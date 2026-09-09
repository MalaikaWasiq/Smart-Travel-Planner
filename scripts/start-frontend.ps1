param(
  [string]$ApiBaseUrl = "http://localhost:5000/api"
)

$ErrorActionPreference = "Stop"

Set-Location -LiteralPath (Join-Path $PSScriptRoot "..\\frontend")

if (-not $env:EXPO_PUBLIC_API_BASE_URL) {
  $env:EXPO_PUBLIC_API_BASE_URL = $ApiBaseUrl
}

Write-Host "EXPO_PUBLIC_API_BASE_URL=$env:EXPO_PUBLIC_API_BASE_URL"

if (-not (Test-Path -LiteralPath "node_modules")) {
  Write-Host "Installing frontend dependencies from package-lock.json..." -ForegroundColor Yellow
  npm ci
  if ($LASTEXITCODE -ne 0) { throw "Frontend dependency installation failed." }
}
npm start
