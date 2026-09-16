param(
  [int]$BackendPort = 5000,
  [string]$ApiBaseUrl = "",
  [switch]$NoNewWindows
)

$ErrorActionPreference = "Stop"

function Test-PortFree([int]$Port) {
  try {
    $null = Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction Stop
    return $false
  } catch {
    return $true
  }
}

function Get-FreePort([int]$PreferredPort) {
  if (Test-PortFree $PreferredPort) { return $PreferredPort }
  for ($p = $PreferredPort + 1; $p -le $PreferredPort + 20; $p++) {
    if (Test-PortFree $p) { return $p }
  }
  throw "No free port found in range $PreferredPort..$($PreferredPort + 20)"
}

$repoRoot = $PSScriptRoot
$backendScript = Join-Path $repoRoot "scripts\\start-backend.ps1"
$frontendScript = Join-Path $repoRoot "scripts\\start-frontend.ps1"

if (-not (Test-Path -LiteralPath $backendScript)) { throw "Missing script: $backendScript" }
if (-not (Test-Path -LiteralPath $frontendScript)) { throw "Missing script: $frontendScript" }

$portToUse = Get-FreePort $BackendPort
$apiToUse = if ($ApiBaseUrl -and $ApiBaseUrl.Trim()) { $ApiBaseUrl.Trim() } else { "http://localhost:$portToUse/api" }

Write-Host "Starting backend on port $portToUse"
Write-Host "Frontend API base URL: $apiToUse"

if ($NoNewWindows) {
  # Run backend in a background process, frontend in this window.
  $env:PORT = "$portToUse"
  $backendProc = Start-Process -FilePath node -ArgumentList "src\\server.js" -WorkingDirectory (Join-Path $repoRoot "backend") -PassThru -WindowStyle Hidden
  try {
    Start-Sleep -Seconds 2
    & $frontendScript -ApiBaseUrl $apiToUse
  } finally {
    if ($backendProc -and -not $backendProc.HasExited) { Stop-Process -Id $backendProc.Id -Force }
  }
  exit 0
}

# Default: open two PowerShell windows so logs are visible and each stays running.
# Use -Command with quoted paths because this project path contains a space.
$backendCommand = @"
try {
  & '$backendScript' -Port $portToUse
} catch {
  Write-Host ''
  Write-Host "Backend failed: `$(`$_.Exception.Message)" -ForegroundColor Red
  Read-Host 'Press Enter to close'
}
"@

$frontendCommand = @"
try {
  & '$frontendScript' -ApiBaseUrl '$apiToUse'
} catch {
  Write-Host ''
  Write-Host "Frontend failed: `$(`$_.Exception.Message)" -ForegroundColor Red
  Read-Host 'Press Enter to close'
}
"@

Start-Process -FilePath powershell -WorkingDirectory $repoRoot -ArgumentList @(
  "-NoExit",
  "-ExecutionPolicy", "Bypass",
  "-Command", $backendCommand
)

Start-Process -FilePath powershell -WorkingDirectory $repoRoot -ArgumentList @(
  "-NoExit",
  "-ExecutionPolicy", "Bypass",
  "-Command", $frontendCommand
)

Write-Host "Done. Two windows were opened (backend + frontend)."
