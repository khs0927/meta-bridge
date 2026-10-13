# ChatCMD Mobile VPS Deployment
Status: STAGED ONLY. No VPS or browser login has been provisioned yet.

## Verified configuration (2026-10-13)
- GitHub: khs0927 (private repo meta-bridge)
- Cloudflare DNS zone: sion-jesus.xyz, active
- Existing Worker mobile-work-gateway: leave unchanged
- Existing rhino-gpt-gateway tunnel: down, leave unchanged
- Upstream: https://github.com/int04/ChatCmd , MIT
- Pinned upstream SHA: e604ac8cb53322082887f97efdcdd647193de768
- ChatCMD extension's allowed bridge origins are localhost/127.0.0.1. Keep ChatCMD and Chromium in the same VPS.

## Architecture
iPhone ChatGPT Work -> mcp.sion-jesus.xyz/mcp/(secret) -> Cloudflare Tunnel
-> nginx localhost:8081 (only MCP paths) -> ChatCMD localhost:8080
-> SQLite / queued instructions / sub-agents
-> Chromium in Xvfb :99 + local ChatCMD extension -> logged-in chatgpt.com tab

iPhone -> desktop.sion-jesus.xyz/vnc.html (mandatory Cloudflare Access)
-> Cloudflare Tunnel -> noVNC 127.0.0.1:6080 -> x11vnc -> Xvfb -> Chromium.

## Host requirement
Use a dedicated Debian 12 VPS with SSH or provider web console accessible on a phone. This repository does NOT purchase, start or connect a VPS and should not overwrite an existing server. Login is interactive via VPS noVNC, no cookies or passwords are sent to ChatGPT.

## Setup after VPS access becomes available
1. Read and execute install-debian12.sh with sudo from the root of this repository.
2. Run healthcheck.sh. Check localhost:8080/api/ping, nginx denied root and noVNC.
3. Provision a NEW Cloudflare remotely managed tunnel named chatcmd-mobile-vps. DO NOT reuse rhino-gpt-gateway.
4. Set two public hostnames in this new tunnel:
   - mcp.sion-jesus.xyz -> http://127.0.0.1:8081
   - desktop.sion-jesus.xyz -> http://127.0.0.1:6080
5. Apply Cloudflare Access identity/one-time email login policy to desktop hostname BEFORE enabling the hostname; verify unauthorized access is blocked.
6. Store new tunnel token at /etc/chatcmd/tunnel-token (root only, 0600). Use cloudflared version >= 2025.4.0 with token-file rather than exposing token in process arguments.
7. Open noVNC in iPhone, retrieve initial VNC password from root-only file through VPS terminal, then log in to chatgpt.com in Chromium. Remove initial password copy.
8. In local ChatCMD panel create narrowly scoped MCP profile, verify public hostname and copy private tokenized URL into ChatGPT custom plugin connection; start with read-only operations.
9. Run a disposable read-only MCP smoke test, then a queued follow-up; review task state and permission approval before enabling write actions.

## Safety
- Keep ChatCMD management interface and VNC ports localhost-only; public nginx exposes only /api/ping and /mcp/(secret).
- MCP URL contains bearer credentials: never log paths, publish connection URLs, send tokens in chat or GitHub, or enable broad filesystem/terminal access.
- Restrict Cloudflare Access to user for desktop, use additional VNC password.
- Cloudflare Worker mobile-work-gateway and unrelated services remain untouched.
- SQLite can retain recoverable tokenized connection URLs; protect disk and backups.
- Browser DOM automation is unofficial and may break when chatgpt.com changes.
- VPN/VPS and subscription fees are not guaranteed free.
- This is a deployment DRAFT until a Linux host and E2E test exist.

Upstream instructions: https://github.com/int04/ChatCmd/blob/main/docs/PLUGIN_SETUP.md
