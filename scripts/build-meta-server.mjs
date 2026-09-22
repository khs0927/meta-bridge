import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const source = path.join(root, "upstreams", "mcp_bridge_server");
const output = path.join(root, "dist", "meta-mcp-server");
const token = process.env.META_BRIDGE_TOKEN;

function mustExist(file) {
  if (!fs.existsSync(file)) throw new Error(`Required file missing: ${path.relative(root, file)}`);
}
function mustReplace(sourceText, needle, replacement, label) {
  if (!sourceText.includes(needle)) throw new Error(`Upstream changed: ${label}`);
  return sourceText.replace(needle, replacement);
}

if (!token) throw new Error("META_BRIDGE_TOKEN is required. Use npm run build:meta.");
mustExist(path.join(source, "utils", "mcp_bridge.py"));

fs.rmSync(output, { recursive: true, force: true });
fs.mkdirSync(path.dirname(output), { recursive: true });
fs.cpSync(source, output, { recursive: true });

const serverPath = path.join(output, "utils", "mcp_bridge.py");
let server = fs.readFileSync(serverPath, "utf8");

server = mustReplace(server, "import asyncio\n", "import asyncio\nimport hmac\n", "hmac import");
server = mustReplace(server, "from fastapi import FastAPI, HTTPException, Query", "from fastapi import FastAPI, HTTPException, Query, Request", "Request import");
server = mustReplace(server, "            s.bind(('0.0.0.0', port))", "            s.bind(('127.0.0.1', port))", "port probe bind");
server = mustReplace(
  server,
  '    allow_origins=["*"],\n    allow_credentials=True,',
  '    allow_origin_regex=r"^chrome-extension://[a-p]{32}$",\n    allow_credentials=False,',
  "CORS policy"
);

const corsEnd = `    allow_headers=["*"],
)`;
const authMiddleware = `    allow_headers=["*"],
)

@app.middleware("http")
async def meta_bridge_auth(request: Request, call_next):
    expected = os.environ.get("META_BRIDGE_TOKEN", "")
    if not expected:
        return JSONResponse(status_code=503, content={"detail": "META_BRIDGE_TOKEN is required"})
    supplied = request.headers.get("authorization", "")
    if not hmac.compare_digest(supplied, f"Bearer {expected}"):
        return JSONResponse(status_code=401, content={"detail": "Unauthorized"})
    return await call_next(request)
`;
server = mustReplace(server, corsEnd, authMiddleware, "auth middleware");

const executeNeedle = "async def execute_tool(request: ExecuteRequest):\n";
const executeGuard = `async def execute_tool(request: ExecuteRequest):
    if os.environ.get("META_BRIDGE_MODE", "read_only").lower() != "edit":
        allowed = {
            item.strip()
            for item in os.environ.get("META_BRIDGE_READ_ONLY_TOOLS", "").split(",")
            if item.strip()
        }
        if request.name not in allowed:
            raise HTTPException(
                status_code=403,
                detail=f"Tool '{request.name}' is blocked in read_only mode. "
                       "Add it to META_BRIDGE_READ_ONLY_TOOLS after review, or explicitly set META_BRIDGE_MODE=edit."
            )
`;
server = mustReplace(server, executeNeedle, executeGuard, "read-only execute guard");
server = mustReplace(server, '            host="0.0.0.0",', '            host=os.environ.get("MCP_BRIDGE_HOST", "127.0.0.1"),', "server bind");
fs.writeFileSync(serverPath, server);

fs.writeFileSync(path.join(output, "start-secure.ps1"), `$ErrorActionPreference = "Stop"
$TokenFile = Join-Path $PSScriptRoot "..\\.meta-bridge-token"
if (!(Test-Path $TokenFile)) { throw "Token file not found: $TokenFile" }
$env:META_BRIDGE_TOKEN = (Get-Content $TokenFile -Raw).Trim()
if (!$env:META_BRIDGE_MODE) { $env:META_BRIDGE_MODE = "read_only" }
$env:MCP_BRIDGE_HOST = "127.0.0.1"
python (Join-Path $PSScriptRoot "utils\\mcp_bridge.py")
`);

fs.writeFileSync(path.join(output, "start-secure.sh"), `#!/usr/bin/env sh
set -eu
TOKEN_FILE="$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)/.meta-bridge-token"
export META_BRIDGE_TOKEN="$(tr -d '\\r\\n' < "$TOKEN_FILE")"
export META_BRIDGE_MODE="$(printenv META_BRIDGE_MODE || echo read_only)"
export MCP_BRIDGE_HOST=127.0.0.1
exec python "$(dirname -- "$0")/utils/mcp_bridge.py"
`, { mode: 0o755 });

console.log("Built secured MCP server at " + path.relative(root, output));
