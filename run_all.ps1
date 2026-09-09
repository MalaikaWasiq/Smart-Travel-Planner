param(
  [int]$BackendPort = 5000,
  [int]$MlPort = 8000,
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
$mlScript = Join-Path $repoRoot "scripts\\start-ml.ps1"
$venvPython = Join-Path $repoRoot ".venv\\Scripts\\python.exe"

if (-not (Test-Path -LiteralPath $backendScript)) { throw "Missing script: $backendScript" }
if (-not (Test-Path -LiteralPath $frontendScript)) { throw "Missing script: $frontendScript" }
if (-not (Test-Path -LiteralPath $mlScript)) { throw "Missing script: $mlScript" }

$portToUse = Get-FreePort $BackendPort
$mlPortToUse = Get-FreePort $MlPort
$apiToUse = if ($ApiBaseUrl -and $ApiBaseUrl.Trim()) { $ApiBaseUrl.Trim() } else { "http://localhost:$portToUse/api" }
$mlUrl = "http://127.0.0.1:$mlPortToUse"
$env:ML_SERVICE_URL = $mlUrl

Write-Host "Starting backend on port $portToUse"
Write-Host "Frontend API base URL: $apiToUse"
Write-Host "Recommendation service: $mlUrl"

if ($NoNewWindows) {
  # Run backend and recommendations in background processes, frontend in this window.
  $python = if (Test-Path -LiteralPath $venvPython) { $venvPython } elseif (Get-Command python -ErrorAction SilentlyContinue) { (Get-Command python).Source } else { throw "Python is required. Run .\\setup_fresh_pc.ps1 first." }
  $env:PORT = "$portToUse"
  $env:ML_SERVICE_URL = $mlUrl
  $mlProc = Start-Process -FilePath $python -ArgumentList @("-m", "uvicorn", "app:app", "--host", "127.0.0.1", "--port", "$mlPortToUse") -WorkingDirectory (Join-Path $repoRoot "ml") -PassThru -WindowStyle Hidden
  $backendProc = Start-Process -FilePath node -ArgumentList "src\\server.js" -WorkingDirectory (Join-Path $repoRoot "backend") -PassThru -WindowStyle Hidden
  try {
    Start-Sleep -Seconds 2
    & $frontendScript -ApiBaseUrl $apiToUse
  } finally {
    if ($backendProc -and -not $backendProc.HasExited) { Stop-Process -Id $backendProc.Id -Force }
    if ($mlProc -and -not $mlProc.HasExited) { Stop-Process -Id $mlProc.Id -Force }
  }
  exit 0
}

# Default: open three PowerShell windows so logs are visible and each stays running.
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

$mlCommand = @"
try {
  & '$mlScript' -Port $mlPortToUse
} catch {
  Write-Host ''
  Write-Host "Recommendation service failed: `$(`$_.Exception.Message)" -ForegroundColor Red
  Read-Host 'Press Enter to close'
}
"@

Start-Process -FilePath powershell -WorkingDirectory $repoRoot -ArgumentList @(
  "-NoExit",
  "-ExecutionPolicy", "Bypass",
  "-Command", $mlCommand
)

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

Write-Host "Done. Three windows were opened (recommendations + backend + frontend)."
