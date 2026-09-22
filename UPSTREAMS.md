# Upstream integration map

Research freeze: 2026-09-23.

| Priority | Project | Role | License | Integration |
|---|---|---|---|---|
| A | `sebattfg/ZeroScript-Free` | Meta.ai provider adapter and web-AI agent loop | GPL-3.0 | Study first; isolate GPL boundary |
| A | `WongJingGitt/mcp-bridge` | Generic web-AI → local MCP bridge | MIT | Primary bridge candidate |
| A | `mir-ashiq/metaai-api` | Logged-in Meta.ai browser session → FastAPI | MIT | Primary reverse-direction gateway candidate |
| A | `2noScript/unofficial-api` | OpenAI-compatible multi-provider gateway | verify | Reuse design after license check |
| B | `cliat/meta-ai` | Browser-login/session persistence | verify | Auth/session reference |
| B | `Bl0ck154/metaai-cookie-client` | Playwright cookie/session component | MIT | Small reusable session candidate |
| B | `vitalysim/browser-bridge` | Real-profile Chrome + authenticated MCP bridge | MIT | Security/transport reference |
| C | `chang-pro/meta-ai-mcp` | Browser-driven Meta MCP | NOASSERTION | Reference only |

Exact branch heads are pinned in `UPSTREAMS.lock.json`.
