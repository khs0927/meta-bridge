# Meta AI Local Bridge

Composition-first project for connecting the logged-in `meta.ai` web experience to local MCP tools, while also exposing the Meta AI browser session through a local OpenAI-compatible gateway.

## Direction A — Meta.ai → local tools

`meta.ai -> browser extension -> authenticated localhost bridge -> MCP router -> local tools`

## Direction B — local agents → Meta.ai

`local agent -> OpenAI-compatible gateway -> browser-session adapter -> meta.ai`

## Principles

- Reuse upstream open source before writing new code.
- Keep Meta-specific DOM logic behind a provider interface.
- Bind local services to `127.0.0.1` by default.
- Require authenticated extension ↔ bridge transport.
- Read-only / Safe Mode by default.
- Never place cookies, browser profiles, HAR captures with auth headers, or tokens in Git.
- Prefer browser-generated Meta traffic over reimplementing private DGW framing from scratch.
- Treat GPL upstream code as a separate licensing boundary unless the resulting project intentionally adopts a compatible license.

## Bootstrap status

This repository intentionally contains **interfaces, policy, documentation, and integration seams only**. No upstream source code has been copied into this bootstrap.

See:

- `UPSTREAMS.md`
- `UPSTREAMS.lock.json`
- `SECURITY.md`
- `LICENSE_POLICY.md`
- `docs/ARCHITECTURE.md`
