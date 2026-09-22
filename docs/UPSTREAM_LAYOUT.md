# Upstream layout

The project keeps major upstreams as pinned Git submodules instead of copying their code.

## `upstreams/mcp-bridge`
MIT. Primary browser-extension/MCP bridge base.

## `upstreams/metaai-api`
MIT. Primary local-to-Meta browser-session gateway.

## `upstreams/ZeroScript-Free`
GPL-3.0. Reference/provider implementation kept as a separate submodule boundary. Do not copy its implementation into the permissive core unless the repository license strategy is intentionally changed.

Clone with:

```bash
git clone --recurse-submodules https://github.com/khs0927/meta-bridge.git
```

or after a normal clone:

```bash
git submodule update --init --recursive
```
