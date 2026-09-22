import fs from "node:fs";

const build = fs.readFileSync(new URL("./build-meta-extension.mjs", import.meta.url), "utf8");
const watcher = fs.readFileSync(new URL("../overlays/mcp-bridge-meta/meta_watcher.js", import.meta.url), "utf8");

const checks = [
  [build.includes("www.meta.ai"), "build overlay contains Meta host"],
  [build.includes("META_BRIDGE_GET_SYSTEM_PROMPT"), "background prompt endpoint patch exists"],
  [watcher.includes('[data-testid="assistant-message"]'), "assistant selector exists"],
  [watcher.includes('[data-testid="composer-input"]'), "composer selector exists"],
  [watcher.includes("FETCH_RESPONSE_COMPLETE"), "tool-call forwarding exists"],
  [watcher.includes("MCP 시작"), "explicit session bootstrap UI exists"]
];

for (const [ok, label] of checks) {
  if (!ok) throw new Error(`FAILED: ${label}`);
  console.log(`OK: ${label}`);
}
