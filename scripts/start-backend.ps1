param(
  [int]$Port = 5000
)

$ErrorActionPreference = "Stop"

Set-Location -LiteralPath (Join-Path $PSScriptRoot "..\\backend")

if (-not (Test-Path -LiteralPath ".env")) {
  Write-Host "Missing backend/.env" -ForegroundColor Yellow
  Write-Host "Create backend/.env from backend/.env.example and set LOCAL_MONGODB_URI plus JWT_SECRET."
} else {
  $localMongoLine = (Get-Content -LiteralPath ".env" | Where-Object { $_ -match '^LOCAL_MONGODB_URI=' } | Select-Object -First 1)
  if ($localMongoLine -match '^LOCAL_MONGODB_URI=.+') {
    $mongoService = Get-Service -Name "MongoDB" -ErrorAction SilentlyContinue
    if ($mongoService -and $mongoService.Status -ne "Running") {
      try { Start-Service -Name "MongoDB" -ErrorAction Stop; $mongoService = Get-Service -Name "MongoDB" }
      catch { throw "Local MongoDB is configured but its Windows service could not be started: $($_.Exception.Message)" }
    }
    if ($mongoService) { Write-Host "Local MongoDB service: $($mongoService.Status)" -ForegroundColor Green }
    else { Write-Host "LOCAL_MONGODB_URI is configured. Ensure a local MongoDB server is running." -ForegroundColor Yellow }
  } else {
    Write-Host "LOCAL_MONGODB_URI is not configured in backend/.env" -ForegroundColor Yellow
  }
}

$env:PORT = "$Port"

if (-not (Test-Path -LiteralPath "node_modules")) {
  Write-Host "Installing backend dependencies from package-lock.json..." -ForegroundColor Yellow
  npm ci
  if ($LASTEXITCODE -ne 0) { throw "Backend dependency installation failed." }
}
npm run dev
