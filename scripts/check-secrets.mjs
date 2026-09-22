import fs from "node:fs";
import path from "node:path";

const blockedNames = ["ecto_1_sess", "abra_sess", "datr", "storage-state"];
const skip = new Set([".git", "node_modules", "dist", "build"]);
const hits = [];

function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (skip.has(entry.name)) continue;
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(p);
    else {
      const lower = entry.name.toLowerCase();
      if (blockedNames.some((n) => lower.includes(n))) hits.push(p);
      if (entry.name === ".env") hits.push(p);
    }
  }
}

walk(process.cwd());
if (hits.length) {
  console.error("Potential secret/session files detected:");
  for (const hit of hits) console.error(` - ${hit}`);
  process.exit(1);
}
console.log("No blocked secret/session filenames detected.");
