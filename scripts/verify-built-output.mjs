import fs from "node:fs";

function read(path) {
  if (!fs.existsSync(path)) throw new Error("Missing built file: " + path);
  return fs.readFileSync(path, "utf8");
}

const manifest = JSON.parse(read("dist/meta-mcp-bridge/manifest.json"));
const apiClient = read("dist/meta-mcp-bridge/modules/api_client.js");
const watcher = read("dist/meta-mcp-bridge/scripts/meta_watcher.js");
const server = read("dist/meta-mcp-server/utils/mcp_bridge.py");
const token = read("dist/.meta-bridge-token").trim();

const contentScript = manifest.content_scripts.find((entry) =>
  entry.matches?.includes("https://www.meta.ai/*") &&
  entry.js?.includes("scripts/meta_watcher.js")
);

const checks = [
  [token.length >= 64, "generated token is at least 256-bit hex"],
  [manifest.host_permissions.includes("http://127.0.0.1/*"), "loopback host permission"],
  [!!contentScript, "Meta content script registered"],
  [apiClient.includes("'Authorization': 'Bearer ' + META_BRIDGE_TOKEN"), "extension auth header"],
  [apiClient.includes("http://127.0.0.1:"), "extension uses 127.0.0.1"],
  [watcher.includes("META_BRIDGE_GET_SYSTEM_PROMPT"), "Meta bootstrap requests prompt"],
  [server.includes("async def meta_bridge_auth"), "server auth middleware"],
  [server.includes('META_BRIDGE_MODE'), "server execution mode gate"],
  [server.includes('META_BRIDGE_READ_ONLY_TOOLS'), "server exact read-only allowlist"],
  [server.includes('host=os.environ.get("MCP_BRIDGE_HOST", "127.0.0.1")'), "server loopback bind"],
  [!server.includes('host="0.0.0.0"'), "unsafe uvicorn bind removed"]
];

for (const [ok, label] of checks) {
  if (!ok) throw new Error("FAILED: " + label);
  console.log("OK: " + label);
}
