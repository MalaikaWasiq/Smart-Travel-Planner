param(
  [int]$Port = 5000
)

$ErrorActionPreference = "Stop"

Set-Location -LiteralPath (Join-Path $PSScriptRoot "..\\backend")

if (-not (Test-Path -LiteralPath ".env")) {
  Write-Host "Missing backend/.env" -ForegroundColor Yellow
  Write-Host "Create backend/.env from backend/.env.example and set at least MONGODB_URI and JWT_SECRET."
} else {
  $mongoLine = (Get-Content -LiteralPath ".env" | Where-Object { $_ -match '^MONGODB_URI=' } | Select-Object -First 1)
  if ($mongoLine -match '^MONGODB_URI=$') {
    Write-Host "MONGODB_URI is empty in backend/.env" -ForegroundColor Yellow
    Write-Host "Paste your MongoDB Atlas URI into backend/.env then re-run."
  }
}

$env:PORT = "$Port"

npm install
npm run dev
