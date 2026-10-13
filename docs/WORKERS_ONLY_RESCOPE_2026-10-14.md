# Worker-only architecture correction — 2026-10-14

## Verified ownership and runtime

The owner has clarified that **Cloudflare Workers is the entire runtime; there is no VPS**.
Do not install Termalin Connector, SSH, Docker, Nginx, `cloudflared`, ChatCMD Linux host or noVNC on an imagined server.
The original `infra/chatcmd-vps/` scripts in this draft PR are **not applicable** to this environment. Retain only as unmerged historical exploration; do not deploy.

Cloudflare account inventory (observed 2026-10-14):
- Existing Worker `mobile-work-gateway`: D1 and `OAUTH_KV` bound. Its public URL is `https://mobile-work-gateway.hscad-kangyu.workers.dev`.
- Worker `diagram-private-mcp`: separate OAuth and KV settings. Do not couple its credentials or authorization to Mobile Work Gateway.
- `chatcmd-mobile-vps` tunnel: status `inactive`, zero origin connections. The DNS record `desktop.sion-jesus.xyz` targets this inactive tunnel; it is **not** evidence of a running desktop.
- `rhino-gpt-gateway` is separate; do not change it.

Verified unauthenticated gateway HTTP checks:
- `GET /health` returns HTTP 200, JSON with `status=running`, `version=0.1.0`, `mcp_ready=false`.
- `GET /` returns HTTP 503 `Configuration required`.
These are not end-to-end MCP successes.

## Actual connected execution route

```text
iPhone / ChatGPT plugin (OAuth)
   -> Cloudflare Worker: mobile-work-gateway (MCP HTTP + OAuth; D1/KV)
   -> reviewed GitHub Actions workflow in khs0927/jev-browser-control-plane
   -> OIDC signed result callback -> Worker -> owner-bound result
```

The code is in `khs0927/jev-browser-control-plane/mobile-work-gateway`.
The configured GitHub Action is `.github/workflows/mobile-work-environment.yml`. It currently runs **only** an allowlisted Python `environment_check` fixture, not arbitrary shell commands or persistent ChatGPT browsers. The Worker code itself requires `GITHUB_TOKEN`, `GITHUB_CLIENT_ID`, and `GITHUB_CLIENT_SECRET` in addition to its preexisting bindings and PUBLIC_URL.

## Safe completion gates

1. Verify that the owner controls the GitHub OAuth App for `/callback`; enter client ID/secret only through Cloudflare dashboard secrets, not public Git, chat, Workflow output or command arguments.
2. Create a **repo-scoped**, least-privilege GitHub token with workflow dispatch permissions and store only as the Worker secret `GITHUB_TOKEN`. Do not reuse unrelated personal/global credentials.
3. Align reviewed SHA with the true audited workflow commit and configure `MWG_RESULT_ENDPOINT` to the callback URL; verify callback OIDC identity restrictions.
4. Recheck `GET /health`: require `mcp_ready=true`. Independently verify owner-only OAuth, MCP `initialize`, `tools/list`, read-only `system_status`, one reviewed test dispatch and matched result callback.
5. Verify an **actual iPhone ChatGPT tool call**. Only then claim the plugin live.
6. For site interaction, evaluate Cloudflare Browser Run separately. Browser Run is time-/plan-limited and does **not** provide an unlimited, always-running Linux desktop or guaranteed long-lived ChatGPT.com login.

Never publish `mcp.sion-jesus.xyz` or claim ChatCMD can run in Workers without an authenticated origin or a supported browser automation runtime.

Keep `meta-bridge`, `ASIDE-GPT`, and `jev-browser-control-plane` public solely as previously instructed for public Actions work; make them private **only after the full requested work passes live E2E checks**, with an explicit secret-history and service-compatibility review before conversion.

Current status: **Worker deployed, MCP not ready; no VPS exists.**
