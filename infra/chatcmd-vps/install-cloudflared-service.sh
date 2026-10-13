#!/usr/bin/env bash
# Installs the already-created remotely managed Cloudflare Tunnel as a local systemd service.
# Intentionally does NOT retrieve or print the tunnel token. Requires a real Debian VPS login.
set -euo pipefail
umask 077
if [ "$(id -u)" -ne 0 ]; then echo 'Run as root on the authorized VPS.' >&2; exit 1; fi
token_file=/etc/chatcmd/tunnel-token
if [ ! -f "$token_file" ] || [ -L "$token_file" ]; then
  echo 'Missing regular root-owned /etc/chatcmd/tunnel-token. Provision it privately first.' >&2; exit 1
fi
if [ "$(stat -c %u "$token_file")" -ne 0 ]; then
  echo 'Refusing to run with non-root-owned token file.' >&2; exit 1
fi
chmod 0600 "$token_file"
if [ ! -s "$token_file" ]; then echo 'Empty tunnel token file.' >&2; exit 1; fi
binary="$(command -v cloudflared || true)"
if [ -z "$binary" ]; then
  echo 'cloudflared missing: install the official binary (2025.4.0+) on the VPS first.' >&2; exit 1
fi
if ! [[ "$binary" =~ ^/[a-zA-Z0-9/_-]+$ ]]; then
  echo 'Unsafe cloudflared executable path.' >&2; exit 1
fi
version="$("$binary" --version)"
if ! [[ "$version" =~ ([0-9]{4})\.([0-9]+)\.([0-9]+) ]]; then
  echo 'Cannot validate cloudflared version.' >&2; exit 1
fi
year="${BASH_REMATCH[1]}"; month="${BASH_REMATCH[2]}"
if (( year < 2025 || (year == 2025 && month < 4) )); then
  echo 'Cloudflared 2025.4.0+ required for token-file.' >&2; exit 1
fi
cat >/etc/systemd/system/chatcmd-cloudflared.service <<UNIT
[Unit]
Description=Cloudflare Tunnel for authorized ChatCMD VPS desktop
After=network-online.target chatcmd-novnc.service
Wants=network-online.target
[Service]
Type=simple
User=root
ExecStart=$binary tunnel --no-autoupdate run --token-file /etc/chatcmd/tunnel-token
Restart=on-failure
RestartSec=10
NoNewPrivileges=true
PrivateTmp=true
ProtectHome=true
ProtectSystem=strict
ProtectKernelTunables=true
ProtectKernelModules=true
ProtectControlGroups=true
LockPersonality=true
RestrictAddressFamilies=AF_UNIX AF_INET AF_INET6
[Install]
WantedBy=multi-user.target
UNIT
systemctl daemon-reload
systemctl enable --now chatcmd-cloudflared.service
echo 'Tunnel service enabled; run healthcheck.sh then verify Cloudflare connected status and Access denial.'
echo 'Never put tokens into GitHub Actions logs, CLI arguments, webhooks or ChatGPT messages.'
