#!/usr/bin/env bash
# Debian 12 only. Read before running. Requires a dedicated VPS (not local PC).
set -euo pipefail
if [ "$(id -u)" -ne 0 ]; then echo 'Run as root (sudo).'; exit 1; fi
. /etc/os-release
if [ "$ID" != debian ] || [ "$VERSION_ID" != 12 ]; then echo 'Only Debian 12 is supported; stopped without changes.'; exit 1; fi

export DEBIAN_FRONTEND=noninteractive
apt-get update
apt-get install -y --no-install-recommends ca-certificates curl gnupg git build-essential pkg-config libssl-dev   nginx chromium xvfb openbox x11vnc novnc websockify dbus-x11 openssl
install -d -m 0755 /etc/apt/keyrings
if [ ! -s /etc/apt/keyrings/nodesource.gpg ]; then
  curl -fsSL https://deb.nodesource.com/gpgkey/nodesource-repo.gpg.key | gpg --dearmor -o /etc/apt/keyrings/nodesource.gpg
fi
echo 'deb [signed-by=/etc/apt/keyrings/nodesource.gpg] https://deb.nodesource.com/node_22.x nodistro main' > /etc/apt/sources.list.d/nodesource.list
apt-get update
apt-get install -y nodejs
node --version
npm --version

if ! command -v cargo >/dev/null 2>&1 || ! cargo --version | grep -Eq 'cargo 1\.(8[5-9]|9[0-9]|[1-9][0-9][0-9])'; then
  curl -fsSL https://sh.rustup.rs -o /tmp/chatcmd-rustup.sh
  sh /tmp/chatcmd-rustup.sh -y --profile minimal
fi
# shellcheck disable=SC1090
source "$HOME/.cargo/env"
command -v cargo

if ! id chatcmd >/dev/null 2>&1; then
  useradd --system --create-home --home-dir /srv/chatcmd --shell /usr/sbin/nologin chatcmd
fi
install -d -m 0700 -o chatcmd -g chatcmd /var/lib/chatcmd /var/lib/chatcmd/chromium
install -d -m 0755 /opt/chatcmd /srv/chatcmd/workspaces
chown chatcmd:chatcmd /srv/chatcmd/workspaces
install -d -m 0700 /etc/chatcmd

if [ ! -d /opt/chatcmd/source/.git ]; then
  git clone https://github.com/int04/ChatCmd.git /opt/chatcmd/source
fi
cd /opt/chatcmd/source
git fetch origin e604ac8cb53322082887f97efdcdd647193de768
git checkout --detach e604ac8cb53322082887f97efdcdd647193de768
(cd web && npm ci && npm run build)
cargo build --locked --release --features embedded-web
install -m 0755 target/release/chat-cmd-client /usr/local/bin/chat-cmd-client

if [ ! -s /var/lib/chatcmd/vnc.pass ]; then
  initial_password="$(openssl rand -hex 8)"
  x11vnc -storepasswd "$initial_password" /var/lib/chatcmd/vnc.pass >/dev/null 2>&1
  printf '%s\n' "$initial_password" > /root/chatcmd-vnc-initial-password
  chmod 0600 /root/chatcmd-vnc-initial-password
  chown chatcmd:chatcmd /var/lib/chatcmd/vnc.pass
  chmod 0600 /var/lib/chatcmd/vnc.pass
fi

cat >/etc/systemd/system/chatcmd.service <<'UNIT'
[Unit]
Description=ChatCMD local MCP orchestrator
After=network-online.target
Wants=network-online.target
[Service]
Type=simple
User=chatcmd
Group=chatcmd
WorkingDirectory=/opt/chatcmd/source
Environment=HOME=/srv/chatcmd
Environment=XDG_DATA_HOME=/var/lib/chatcmd
Environment=CHATCMD_BIND=127.0.0.1
Environment=CHATCMD_PORT=8080
Environment=CHATCMD_DB_PATH=/var/lib/chatcmd/chatcmd.db
Environment=CHATCMD_LOG_PATH=/var/lib/chatcmd/chatcmd.log
ExecStart=/usr/local/bin/chat-cmd-client
Restart=on-failure
RestartSec=5
NoNewPrivileges=true
[Install]
WantedBy=multi-user.target
UNIT

cat >/etc/systemd/system/chatcmd-display.service <<'UNIT'
[Unit]
Description=Private ChatCMD display
[Service]
User=chatcmd
ExecStart=/usr/bin/Xvfb :99 -screen 0 1365x768x24 -nolisten tcp
Restart=always
RestartSec=3
[Install]
WantedBy=multi-user.target
UNIT

cat >/etc/systemd/system/chatcmd-browser.service <<'UNIT'
[Unit]
Description=Persistent Chromium ChatGPT profile and local extension
Requires=chatcmd-display.service chatcmd.service
After=chatcmd-display.service chatcmd.service
[Service]
User=chatcmd
Group=chatcmd
Environment=HOME=/srv/chatcmd
Environment=DISPLAY=:99
WorkingDirectory=/srv/chatcmd
ExecStart=/usr/bin/chromium --user-data-dir=/var/lib/chatcmd/chromium --no-first-run --disable-dev-shm-usage --disable-gpu --password-store=basic --window-size=1365,768 --load-extension=/opt/chatcmd/source/chatgpt-extension http://127.0.0.1:8080
Restart=on-failure
RestartSec=5
[Install]
WantedBy=multi-user.target
UNIT

cat >/etc/systemd/system/chatcmd-vnc.service <<'UNIT'
[Unit]
Description=Local-only VNC for phone login
Requires=chatcmd-display.service
After=chatcmd-display.service
[Service]
User=chatcmd
Group=chatcmd
ExecStart=/usr/bin/x11vnc -display :99 -localhost -rfbport 5901 -forever -shared -rfbauth /var/lib/chatcmd/vnc.pass
Restart=on-failure
RestartSec=5
[Install]
WantedBy=multi-user.target
UNIT

cat >/etc/systemd/system/chatcmd-novnc.service <<'UNIT'
[Unit]
Description=Local-only noVNC web UI (Cloudflare Access required for remote)
Requires=chatcmd-vnc.service
After=chatcmd-vnc.service
[Service]
User=chatcmd
Group=chatcmd
ExecStart=/usr/bin/websockify --web=/usr/share/novnc 127.0.0.1:6080 127.0.0.1:5901
Restart=on-failure
RestartSec=5
[Install]
WantedBy=multi-user.target
UNIT

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cp "$SCRIPT_DIR/nginx-chatcmd.conf" /etc/nginx/conf.d/chatcmd-mcp.conf
nginx -t
systemctl daemon-reload
systemctl enable --now chatcmd-display.service chatcmd.service chatcmd-browser.service chatcmd-vnc.service chatcmd-novnc.service nginx.service
echo 'Staged ChatCMD locally. Cloudflare Tunnel, DNS, Access policy and ChatGPT browser login NOT configured.'
echo 'Initial VNC password stored ONLY at /root/chatcmd-vnc-initial-password; remove after securely recording.'
