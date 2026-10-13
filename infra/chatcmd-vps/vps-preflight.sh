#!/usr/bin/env bash
# Read-only VPS preflight. Never prints token, browser session, SSH keys or environment.
set -euo pipefail
printf 'OS=%s\n' "$(. /etc/os-release && printf '%s:%s' "$ID" "$VERSION_ID")"
printf 'ARCH=%s\n' "$(uname -m)"
printf 'KERNEL=%s\n' "$(uname -r)"
printf 'USER=%s\n' "$(id -un)"
printf 'DISK_ROOT='; df -h / | tail -1
for bin in git bash curl nginx chromium Xvfb x11vnc websockify node npm cargo cloudflared docker; do
  if command -v "$bin" >/dev/null 2>&1; then
    printf 'BIN_%s=present\n' "$bin"
  else
    printf 'BIN_%s=missing\n' "$bin"
  fi
done
if command -v systemctl >/dev/null 2>&1; then
  for name in chatcmd chatcmd-display chatcmd-browser chatcmd-vnc chatcmd-novnc chatcmd-cloudflared; do
    state="$(systemctl is-active "$name.service" 2>/dev/null || true)"
    printf 'SERVICE_%s=%s\n' "$name" "$state"
  done
fi
if [ -f /etc/chatcmd/tunnel-token ]; then
  printf 'CLOUDFLARE_TUNNEL_TOKEN_FILE=present\n'
else
  printf 'CLOUDFLARE_TUNNEL_TOKEN_FILE=missing\n'
fi
printf 'VPS_PREFLIGHT_COMPLETE=read_only\n'
