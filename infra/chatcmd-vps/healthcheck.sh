#!/usr/bin/env bash
set -euo pipefail
for unit in chatcmd.service chatcmd-display.service chatcmd-browser.service chatcmd-vnc.service chatcmd-novnc.service nginx.service; do
  if systemctl is-active --quiet "$unit"; then printf 'OK %s\n' "$unit"; else printf 'NOT_RUNNING %s\n' "$unit"; fi
done
check_http() {
  local url="$1" code
  code="$(curl -sS -o /dev/null -w '%{http_code}' --max-time 8 "$url" || true)"
  printf 'Local HTTP %s -> %s\n' "$url" "$code"
}
check_http http://127.0.0.1:8080/api/ping
check_http http://127.0.0.1:8081/
check_http http://127.0.0.1:6080/vnc.html
echo 'Expected: 8081 root returns 404. Verify Cloudflare, browser login and external MCP separately.'
