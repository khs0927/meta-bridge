import fs from "node:fs";

const extensionBuild = fs.readFileSync(new URL("./build-meta-extension.mjs", import.meta.url), "utf8");
const serverBuild = fs.readFileSync(new URL("./build-meta-server.mjs", import.meta.url), "utf8");
const watcher = fs.readFileSync(new URL("../overlays/mcp-bridge-meta/meta_watcher.js", import.meta.url), "utf8");

const checks = [
  [extensionBuild.includes("www.meta.ai"), "Meta host overlay exists"],
  [extensionBuild.includes("META_BRIDGE_GET_SYSTEM_PROMPT"), "prompt endpoint patch exists"],
  [extensionBuild.includes("Authorization"), "extension attaches bridge auth"],
  [extensionBuild.includes("127.0.0.1"), "extension uses loopback"],
  [serverBuild.includes("META_BRIDGE_TOKEN"), "server requires token"],
  [serverBuild.includes("META_BRIDGE_MODE"), "server has safe/edit policy"],
  [serverBuild.includes("127.0.0.1"), "server binds loopback"],
  [watcher.includes('[data-testid="assistant-message"]'), "assistant selector exists"],
  [watcher.includes('[data-testid="composer-input"]'), "composer selector exists"],
  [watcher.includes("FETCH_RESPONSE_COMPLETE"), "tool-call forwarding exists"]
];

for (const [ok, label] of checks) {
  if (!ok) throw new Error(`FAILED: ${label}`);
  console.log(`OK: ${label}`);
}
