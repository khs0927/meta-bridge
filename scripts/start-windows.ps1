param(
    [ValidateSet("read_only", "edit")]
    [string]$Mode = "read_only",
    [string[]]$AllowReadTools = @()
)

$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $PSScriptRoot
$TokenFile = Join-Path $Root "dist\.meta-bridge-token"
$Server = Join-Path $Root "dist\meta-mcp-server\utils\mcp_bridge.py"
$Python = Join-Path $Root ".venv\Scripts\python.exe"

if (-not (Test-Path $TokenFile)) { throw "Build token missing. Run scripts\setup-windows.ps1 first." }
if (-not (Test-Path $Server)) { throw "Secured server build missing. Run scripts\setup-windows.ps1 first." }
if (-not (Test-Path $Python)) { throw "Python venv missing. Run scripts\setup-windows.ps1 first." }

$env:META_BRIDGE_TOKEN = (Get-Content $TokenFile -Raw).Trim()
$env:MCP_BRIDGE_HOST = "127.0.0.1"
$env:META_BRIDGE_MODE = $Mode
$env:META_BRIDGE_READ_ONLY_TOOLS = ($AllowReadTools -join ",")

if ($Mode -eq "edit") {
    Write-Warning "EDIT MODE ENABLED: non-allowlisted MCP tools may modify local resources."
} else {
    Write-Host "READ-ONLY MODE: only explicitly allowlisted tools can execute." -ForegroundColor Green
    if ($AllowReadTools.Count -eq 0) {
        Write-Host "No read tools are allowlisted; discovery works, execution is blocked." -ForegroundColor Yellow
    }
}

& $Python $Server
