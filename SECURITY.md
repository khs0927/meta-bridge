# Security model

The browser extension and local bridge may control authenticated browser sessions and local MCP tools.

Default policy:

1. Bind to `127.0.0.1`.
2. Require a random bearer/session token.
3. Reject unexpected origins where applicable.
4. Validate every tool call against a declared schema.
5. Deny arbitrary shell / eval by default.
6. Start in read-only mode.
7. Separate read and write tool allowlists.
8. Enforce request size, timeout, concurrency and rate limits.
9. Keep browser cookies/tokens out of model-visible messages.
10. Redact authorization headers and cookies from logs.

Never commit `datr`, `ecto_1_sess`, `abra_sess`, Meta access tokens, OAuth credentials, browser storage-state, browser profiles, or authenticated HAR/WS captures.
