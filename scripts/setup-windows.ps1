$ErrorActionPreference = "Stop"

$Root = Split-Path -Parent $PSScriptRoot
Set-Location $Root

function Require-Command($Name) {
    if (-not (Get-Command $Name -ErrorAction SilentlyContinue)) {
        throw "Required command not found: $Name"
    }
}

Require-Command git
Require-Command node
Require-Command python

Write-Host "[1/5] Initializing pinned upstreams..."
git submodule update --init --recursive

Write-Host "[2/5] Building secured Meta Bridge..."
node (Join-Path $PSScriptRoot "build-meta.mjs")

$Venv = Join-Path $Root ".venv"
if (-not (Test-Path $Venv)) {
    Write-Host "[3/5] Creating Python virtual environment..."
    python -m venv $Venv
} else {
    Write-Host "[3/5] Python virtual environment already exists."
}

$Python = Join-Path $Venv "Scripts\python.exe"
Write-Host "[4/5] Installing MCP Bridge Server dependencies..."
& $Python -m pip install --upgrade pip
& $Python -m pip install -r (Join-Path $Root "dist\meta-mcp-server\requirements.txt")

Write-Host "[5/5] Static verification..."
node (Join-Path $PSScriptRoot "verify-built-output.mjs")
& $Python -m py_compile (Join-Path $Root "dist\meta-mcp-server\utils\mcp_bridge.py")

$ExtensionPath = Join-Path $Root "dist\meta-mcp-bridge"

Write-Host ""
Write-Host "Setup complete." -ForegroundColor Green
Write-Host "1. Open Chrome/Edge extensions page."
Write-Host "2. Enable Developer mode."
Write-Host "3. Load unpacked extension from:"
Write-Host "   $ExtensionPath" -ForegroundColor Cyan
Write-Host "4. Configure the MCP servers you want the local bridge to expose."
Write-Host "5. Start the secured server with:"
Write-Host "   powershell -ExecutionPolicy Bypass -File scripts\start-windows.ps1"
Write-Host ""
Write-Host "Default execution mode is read_only. Tools are blocked until explicitly allowlisted."
