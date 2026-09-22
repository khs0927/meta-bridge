import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dist = path.join(root, "dist");
fs.mkdirSync(dist, { recursive: true });

const token = crypto.randomBytes(32).toString("hex");
const tokenFile = path.join(dist, ".meta-bridge-token");
fs.writeFileSync(tokenFile, token + "\n", { mode: 0o600 });
process.env.META_BRIDGE_TOKEN = token;

await import("./build-meta-extension.mjs");
await import("./build-meta-server.mjs");

console.log("");
console.log("Meta Bridge build complete.");
console.log("Extension: dist/meta-mcp-bridge");
console.log("Server:    dist/meta-mcp-server");
console.log("Token:     dist/.meta-bridge-token (generated locally; never commit)");
