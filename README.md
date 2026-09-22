# Meta AI Local Bridge

Composition-first project for connecting the logged-in `meta.ai` web experience to local MCP tools.

## Main path

```text
Meta.ai
  -> Meta DOM overlay
  -> reused MCP Bridge extension engine
  -> authenticated 127.0.0.1 bridge
  -> configured MCP servers
```

The project minimizes custom code by pinning major upstream projects as Git submodules and applying small build-time overlays.

## Current implementation

- Meta.ai DOM watcher using current `data-testid` selectors.
- Explicit **MCP 시작** bootstrap in Meta.ai.
- Reuse of upstream MCP service discovery, prompt builder, tool parser/executor and result reinjection.
- Secured build of `mcp_bridge_server`.
- Generated 256-bit local Bearer token shared only between built extension/server.
- Loopback-only server bind.
- Default `read_only` policy with exact tool allowlist.
- CI build verification.
- Windows setup/start scripts.

## Windows

See `docs/WINDOWS_QUICKSTART.md`.

Quick setup:

```powershell
powershell -ExecutionPolicy Bypass -File scripts\setup-windows.ps1
```

Then load `dist\meta-mcp-bridge` as an unpacked Chrome/Edge extension and start the secured server.

## Upstream policy

See `UPSTREAMS.md`, `UPSTREAMS.lock.json`, `LICENSE_POLICY.md`, and `SECURITY.md`.

No cookies, browser profiles, authenticated HAR files, or generated bridge tokens belong in Git.
