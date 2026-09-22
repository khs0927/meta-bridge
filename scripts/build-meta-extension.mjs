import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const source = path.join(root, "upstreams", "mcp-bridge");
const output = path.join(root, "dist", "meta-mcp-bridge");
const watcher = path.join(root, "overlays", "mcp-bridge-meta", "meta_watcher.js");

function mustExist(file) {
  if (!fs.existsSync(file)) {
    throw new Error(`Required file missing: ${path.relative(root, file)}. Run git submodule update --init --recursive first.`);
  }
}

mustExist(path.join(source, "manifest.json"));
mustExist(path.join(source, "config", "api_list.json"));
mustExist(path.join(source, "scripts", "background.js"));
mustExist(watcher);

fs.rmSync(output, { recursive: true, force: true });
fs.mkdirSync(path.dirname(output), { recursive: true });
fs.cpSync(source, output, { recursive: true });

const metaMatches = ["https://www.meta.ai/*", "https://meta.ai/*"];

const manifestPath = path.join(output, "manifest.json");
const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
manifest.host_permissions ??= [];
for (const value of metaMatches) {
  if (!manifest.host_permissions.includes(value)) manifest.host_permissions.push(value);
}

manifest.content_scripts ??= [];
manifest.content_scripts.push({
  matches: metaMatches,
  js: ["scripts/content_script.js", "scripts/meta_watcher.js"],
  run_at: "document_idle"
});

for (const resource of manifest.web_accessible_resources ?? []) {
  resource.matches ??= [];
  for (const value of metaMatches) {
    if (!resource.matches.includes(value)) resource.matches.push(value);
  }
}

fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + "\n");

const apiPath = path.join(output, "config", "api_list.json");
const apiList = JSON.parse(fs.readFileSync(apiPath, "utf8"))
  .filter((item) => item.hostname !== "www.meta.ai" && item.hostname !== "meta.ai");

function metaConfig(hostname, name) {
  return {
    name,
    hostname,
    label: "Meta AI",
    api: ["https://www.meta.ai/", "https://meta.ai/"],
    promptPath: "",
    isJsonString: false,
    enabled: true,
    defaultAlwaysInject: false,
    skipRequestModification: true,
    response: { type: "text", format: "{text}", contentPaths: [] },
    uiParsing: {
      enabled: true,
      priority: "ui",
      messageContainer: '[data-testid="assistant-message"]',
      messageIndex: -1,
      contentSelector: ""
    },
    input: {
      selector: '[data-testid="composer-input"]',
      submitKey: "Enter",
      submitModifiers: [],
      submitDelay: 1200
    }
  };
}

apiList.push(metaConfig("www.meta.ai", "meta_ai_www"));
apiList.push(metaConfig("meta.ai", "meta_ai_root"));
fs.writeFileSync(apiPath, JSON.stringify(apiList, null, 2) + "\n");

const backgroundPath = path.join(output, "scripts", "background.js");
let background = fs.readFileSync(backgroundPath, "utf8");
const needle = "                    case 'REFRESH_SYSTEM_PROMPT_FROM_PANEL':";
if (!background.includes(needle)) {
  throw new Error("Upstream background.js changed: refresh handler insertion point not found.");
}
const inserted = `                    case 'META_BRIDGE_GET_SYSTEM_PROMPT':
                        try {
                            const metaBridgeServices = await apiClient.getServices();
                            const metaBridgePrompt = promptBuilder.buildInitialPrompt(metaBridgeServices);
                            sendResponse({ success: true, prompt: metaBridgePrompt });
                        } catch (error) {
                            sendResponse({ success: false, error: error.message });
                        }
                        return;
`;
background = background.replace(needle, inserted + needle);
fs.writeFileSync(backgroundPath, background);

fs.copyFileSync(watcher, path.join(output, "scripts", "meta_watcher.js"));

console.log(`Built Meta-enabled extension at ${path.relative(root, output)}`);
