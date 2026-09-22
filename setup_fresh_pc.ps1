param(
  [bool]$InstallMissingTools = $true,
  [switch]$SkipDependencyInstall,
  [switch]$SkipTests,
  [string]$ApiBaseUrl = "http://localhost:5000/api",
  [string]$GroqApiKey = "",
  [string]$OpenWeatherApiKey = "",
  [string]$OpenRouteServiceApiKey = ""
)

$ErrorActionPreference = "Stop"
$ProgressPreference = "SilentlyContinue"
$repoRoot = $PSScriptRoot

function Write-Step([string]$Message) {
  Write-Host "`n==> $Message" -ForegroundColor Cyan
}

function Refresh-ProcessPath {
  $machinePath = [Environment]::GetEnvironmentVariable("Path", "Machine")
  $userPath = [Environment]::GetEnvironmentVariable("Path", "User")
  $env:Path = "$machinePath;$userPath"
}

function Install-WingetPackage([string]$Id, [string]$Label) {
  if (-not $InstallMissingTools) {
    throw "$Label is missing. Re-run without -InstallMissingTools:`$false or install $Id manually."
  }
  if (-not (Get-Command winget -ErrorAction SilentlyContinue)) {
    throw "winget is required to install $Label automatically. Install Microsoft App Installer, then run this script again."
  }
  Write-Step "Installing $Label"
  & winget install --id $Id --exact --source winget --silent --accept-package-agreements --accept-source-agreements
  if ($LASTEXITCODE -ne 0) { throw "$Label installation failed with exit code $LASTEXITCODE." }
  Refresh-ProcessPath
}

function Ensure-Command([string]$Command, [string]$PackageId, [string]$Label) {
  if (-not (Get-Command $Command -ErrorAction SilentlyContinue)) {
    Install-WingetPackage -Id $PackageId -Label $Label
  }
  if (-not (Get-Command $Command -ErrorAction SilentlyContinue)) {
    throw "$Label was installed but '$Command' is not available in this process. Open a new elevated PowerShell window and run the script again."
  }
}

function New-RandomSecret {
  $bytes = New-Object byte[] 48
  $generator = [Security.Cryptography.RandomNumberGenerator]::Create()
  try { $generator.GetBytes($bytes) } finally { $generator.Dispose() }
  return [Convert]::ToBase64String($bytes)
}

function Ensure-EnvironmentFiles {
  $backendEnv = Join-Path $repoRoot "backend\.env"
  if (-not (Test-Path -LiteralPath $backendEnv)) {
    $jwtSecret = New-RandomSecret
    @"
PORT=5000
LOCAL_MONGODB_URI=mongodb://127.0.0.1:27017/smart-travel-planner
JWT_SECRET=$jwtSecret
OPENWEATHER_API_KEY=$OpenWeatherApiKey
GROQ_API_KEY=$GroqApiKey
GROQ_MODEL=qwen/qwen3.6-27b
GROQ_BASE_URL=https://api.groq.com/openai/v1
GROQ_TIMEOUT_MS=25000
OPENROUTESERVICE_API_KEY=$OpenRouteServiceApiKey
OPENROUTESERVICE_BASE_URL=https://api.openrouteservice.org
ML_SERVICE_URL=http://127.0.0.1:8000
ML_TIMEOUT_MS=3000
CORS_ORIGIN=http://localhost:8081,http://localhost:8082,http://localhost:19006,http://localhost:3000
"@ | Set-Content -LiteralPath $backendEnv -Encoding utf8
    Write-Host "Created backend/.env with a generated JWT secret. Optional API keys were not printed." -ForegroundColor Green
  } else {
    Write-Host "Preserving existing backend/.env." -ForegroundColor Yellow
  }

  $frontendEnv = Join-Path $repoRoot "frontend\.env"
  if (-not (Test-Path -LiteralPath $frontendEnv)) {
    "EXPO_PUBLIC_API_BASE_URL=$ApiBaseUrl" | Set-Content -LiteralPath $frontendEnv -Encoding utf8
    Write-Host "Created frontend/.env for $ApiBaseUrl" -ForegroundColor Green
  } else {
    Write-Host "Preserving existing frontend/.env." -ForegroundColor Yellow
  }
}

Write-Step "Validating project layout"
$requiredPaths = @(
  "backend\package-lock.json",
  "frontend\package-lock.json",
  "ml\requirements.txt",
  "run_all.ps1",
  "scripts\test-100.ps1"
)
foreach ($relativePath in $requiredPaths) {
  $fullPath = Join-Path $repoRoot $relativePath
  if (-not (Test-Path -LiteralPath $fullPath)) { throw "Incomplete project package. Missing: $relativePath" }
}

Write-Step "Checking required tools"
Ensure-Command -Command "node" -PackageId "OpenJS.NodeJS.LTS" -Label "Node.js LTS"
Ensure-Command -Command "npm" -PackageId "OpenJS.NodeJS.LTS" -Label "npm"
Ensure-Command -Command "python" -PackageId "Python.Python.3.12" -Label "Python 3.12"

$mongoService = Get-Service -Name "MongoDB" -ErrorAction SilentlyContinue
if (-not $mongoService) {
  Install-WingetPackage -Id "MongoDB.Server" -Label "MongoDB Community Server"
  $mongoService = Get-Service -Name "MongoDB" -ErrorAction SilentlyContinue
}
if (-not $mongoService) { throw "MongoDB installed without the expected Windows service. Repair the MongoDB installation with service installation enabled." }
if ($mongoService.Status -ne "Running") {
  try { Start-Service -Name "MongoDB" } catch { throw "MongoDB could not be started. Run this setup from an elevated PowerShell window. $($_.Exception.Message)" }
}
$mongoService = Get-Service -Name "MongoDB"
if ($mongoService.Status -ne "Running") { throw "MongoDB service is not running." }

Write-Host "Node: $(node --version)" -ForegroundColor Green
Write-Host "npm: $(npm --version)" -ForegroundColor Green
Write-Host "Python: $(python --version 2>&1)" -ForegroundColor Green
Write-Host "MongoDB service: $($mongoService.Status)" -ForegroundColor Green

Write-Step "Creating local environment files"
Ensure-EnvironmentFiles

$venvPython = Join-Path $repoRoot ".venv\Scripts\python.exe"
if (-not $SkipDependencyInstall) {
  Write-Step "Installing backend dependencies from lockfile"
  Push-Location (Join-Path $repoRoot "backend")
  try { & npm ci; if ($LASTEXITCODE -ne 0) { throw "Backend npm ci failed." } } finally { Pop-Location }

  Write-Step "Installing frontend dependencies from lockfile"
  Push-Location (Join-Path $repoRoot "frontend")
  try { & npm ci; if ($LASTEXITCODE -ne 0) { throw "Frontend npm ci failed." } } finally { Pop-Location }

  Write-Step "Creating isolated Python environment"
  if (-not (Test-Path -LiteralPath $venvPython)) {
    & python -m venv (Join-Path $repoRoot ".venv")
    if ($LASTEXITCODE -ne 0) { throw "Python virtual environment creation failed." }
  }
  & $venvPython -m pip install --upgrade pip
  if ($LASTEXITCODE -ne 0) { throw "pip upgrade failed." }
  & $venvPython -m pip install -r (Join-Path $repoRoot "ml\requirements.txt")
  if ($LASTEXITCODE -ne 0) { throw "ML dependency installation failed." }
} elseif (-not (Test-Path -LiteralPath $venvPython)) {
  throw "-SkipDependencyInstall was used, but .venv is missing. Run dependency installation at least once."
}

Write-Step "Checking source and model artifacts"
Push-Location (Join-Path $repoRoot "backend")
try { & npm run check; if ($LASTEXITCODE -ne 0) { throw "Backend syntax check failed." } } finally { Pop-Location }

if (-not (Test-Path -LiteralPath (Join-Path $repoRoot "ml\artifacts\pakistan_ranker.json"))) {
  & $venvPython (Join-Path $repoRoot "ml\train.py")
  if ($LASTEXITCODE -ne 0) { throw "Recommendation model training failed." }
}

if (-not $SkipTests) {
  Write-Step "Running complete automated verification"
  & (Join-Path $repoRoot "scripts\test-100.ps1") -BackendPort 5200 -MlPort 8200
  if ($LASTEXITCODE -ne 0) { throw "Complete automated verification failed." }
} else {
  Write-Host "Automated tests skipped by request." -ForegroundColor Yellow
}

Write-Step "Setup complete"
Write-Host "Run the app from this folder with:" -ForegroundColor Green
Write-Host "  .\run_all.ps1"
Write-Host "Then open the Expo web URL shown in the frontend terminal (normally http://localhost:8081)."
Write-Host "Backend health: http://localhost:5000/api/health"
Write-Host "ML health:      http://127.0.0.1:8000/health"
