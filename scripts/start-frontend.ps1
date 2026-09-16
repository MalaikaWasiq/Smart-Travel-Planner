param(
  [string]$ApiBaseUrl = "http://localhost:5000/api"
)

$ErrorActionPreference = "Stop"

Set-Location -LiteralPath (Join-Path $PSScriptRoot "..\\frontend")

if (-not $env:EXPO_PUBLIC_API_BASE_URL) {
  $env:EXPO_PUBLIC_API_BASE_URL = $ApiBaseUrl
}

Write-Host "EXPO_PUBLIC_API_BASE_URL=$env:EXPO_PUBLIC_API_BASE_URL"

npm install
npm start

