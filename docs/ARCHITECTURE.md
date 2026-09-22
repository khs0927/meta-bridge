# Architecture

## Browser side
```text
extension core
  -> provider adapter (Meta)
  -> transport
  -> authenticated localhost bridge
```

## Local bridge
Owns authentication, origin checks, rate limits, policy mode and transport normalization.

## MCP router
- discover configured MCP servers
- normalize `tools/list`
- validate `tools/call`
- namespace tools
- enforce per-server/per-tool policy
- separate read/write capabilities
- emit structured errors

## Meta gateway
Reuses an authenticated browser session to expose Meta.ai locally. Browser-generated traffic is preferred over rebuilding private Meta transport frames.

## First vertical slice
1. Detect a live Meta.ai tab.
2. Establish authenticated extension ↔ bridge connection.
3. List one allowlisted read-only MCP tool.
4. Execute one read-only call.
5. Return structured result to the Meta.ai conversation.
6. Verify timeout, cancellation, malformed JSON and disconnected bridge behavior.
