# Secured localhost server

The pinned upstream `mcp_bridge_server` currently binds Uvicorn to `0.0.0.0`, enables broad CORS, and does not authenticate `/execute`.

This project never runs that source unchanged.

`npm run build:meta` creates a local build under `dist/meta-mcp-server` with:

- bind default: `127.0.0.1`
- generated 256-bit token
- Bearer auth on every HTTP request
- constant-time token comparison
- Chrome-extension-only CORS response policy
- `read_only` default execution mode
- exact read-only tool allowlist via `META_BRIDGE_READ_ONLY_TOOLS`
- explicit `META_BRIDGE_MODE=edit` required to permit non-allowlisted tools

The same generated token is embedded only into the local built extension under `dist/`. The token is not stored in Git.
