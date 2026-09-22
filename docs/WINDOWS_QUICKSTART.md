# Windows quick start

## Install/build

From PowerShell in the repository root:

```powershell
powershell -ExecutionPolicy Bypass -File scripts\setup-windows.ps1
```

This initializes pinned submodules, builds the secured extension/server, creates a local token, creates `.venv`, installs server dependencies, and verifies the patched build.

## Load the extension

Open `chrome://extensions` or `edge://extensions`, enable Developer mode, and **Load unpacked**:

```text
dist\meta-mcp-bridge
```

## Start in safe mode

With no executable tools allowlisted:

```powershell
powershell -ExecutionPolicy Bypass -File scripts\start-windows.ps1
```

Allow only reviewed read tools, for example:

```powershell
powershell -ExecutionPolicy Bypass -File scripts\start-windows.ps1 -AllowReadTools read_file,list_directory,search_files
```

Tool names must exactly match the tools exposed by your configured MCP servers.

## Meta.ai

Open Meta.ai after the extension is loaded. The overlay adds an **MCP 시작** button. Clicking it asks the existing MCP Bridge prompt builder for the current tool/service catalogue and submits that bootstrap prompt into Meta.ai.

When Meta emits a complete `<tool_code>...</tool_code>` block, the overlay forwards it to the existing MCP Bridge execution engine and the result is injected back into the Meta conversation.

## Edit mode

Only use this deliberately:

```powershell
powershell -ExecutionPolicy Bypass -File scripts\start-windows.ps1 -Mode edit
```

Edit mode removes the read-only execution gate. The bridge still remains bound to `127.0.0.1` and requires the generated bearer token.
