# Meta.ai vertical slice

## Reused upstream

- `upstreams/mcp-bridge`: extension UI, prompt builder, MCP service discovery, tool execution, result reinjection.
- `upstreams/ZeroScript-Free`: separate GPL reference used to validate current Meta.ai DOM selectors and response behavior.
- `upstreams/metaai-api`: reverse-direction local → Meta.ai gateway track.

## Thin overlay added here

`scripts/build-meta-extension.mjs` copies the pinned MIT `mcp-bridge` submodule to `dist/meta-mcp-bridge` and applies only Meta-specific integration changes:

1. add `meta.ai` host permissions;
2. register Meta site configuration;
3. add a Meta DOM watcher;
4. expose the already-existing MCP prompt builder to the watcher;
5. reuse upstream tool execution and result injection unchanged.

## Runtime flow

```text
Meta.ai
  │
  │ user clicks "MCP 시작"
  ▼
meta_watcher.js
  │ request existing MCP Bridge system prompt
  ▼
mcp-bridge background + prompt_builder
  │
  ▼
Meta composer

Meta assistant emits <tool_code>...</tool_code>
  │
  ▼
meta_watcher MutationObserver
  │ FETCH_RESPONSE_COMPLETE
  ▼
existing mcp-bridge background tool parser/executor
  │
  ▼
localhost:3849 MCP Bridge Server
  │
  ▼
configured local MCP server
  │
  ▼
existing mcp-bridge result reinjection
  │
  ▼
Meta.ai
```

## Build

```bash
git submodule update --init --recursive
pnpm test:meta-overlay
pnpm build:meta-extension
```

Then load `dist/meta-mcp-bridge` as an unpacked Chrome/Edge extension.

## Current limitation

The pinned `mcp-bridge` repository contains the browser extension; its README points to a separate `mcp_bridge_server` project for the Python localhost service. The next integration step is to pin that server upstream as another submodule and make the bridge default to authenticated/read-only operation.
