param(
  [int]$Port = 5000
)

$ErrorActionPreference = "Stop"

function Test-PortFree([int]$PortToCheck) {
  try {
    $null = Get-NetTCPConnection -LocalPort $PortToCheck -State Listen -ErrorAction Stop
    return $false
  } catch {
    return $true
  }
}

$repoRoot = Resolve-Path -LiteralPath (Join-Path $PSScriptRoot "..")
$backendDir = Join-Path $repoRoot "backend"

if (-not (Test-Path -LiteralPath (Join-Path $backendDir ".env"))) {
  throw "Missing backend/.env"
}

if (-not (Test-PortFree $Port)) {
  for ($candidate = $Port + 1; $candidate -le $Port + 20; $candidate++) {
    if (Test-PortFree $candidate) {
      $Port = $candidate
      break
    }
  }
}

$env:PORT = "$Port"
$server = Start-Process -FilePath node -ArgumentList "src/server.js" -WorkingDirectory $backendDir -PassThru -WindowStyle Hidden

try {
  Start-Sleep -Seconds 3
  $baseUrl = "http://localhost:$Port/api"

  $health = Invoke-RestMethod -Method Get -Uri "$baseUrl/health"
  if (-not $health.ok) { throw "Health endpoint failed" }
  if ($health.database -ne "connected") { throw "Database is not connected" }

  $stamp = Get-Date -Format "yyyyMMddHHmmss"
  $email = "codex_test_$stamp@example.com"
  $password = "testpass123"

  $signup = Invoke-RestMethod -Method Post -Uri "$baseUrl/auth/signup" -ContentType "application/json" -Body (@{
    fullName = "Codex Test"
    email = $email
    password = $password
  } | ConvertTo-Json)
  if (-not $signup.token) { throw "Signup did not return token" }

  $login = Invoke-RestMethod -Method Post -Uri "$baseUrl/auth/login" -ContentType "application/json" -Body (@{
    email = $email
    password = $password
  } | ConvertTo-Json)
  if (-not $login.token) { throw "Login did not return token" }

  $headers = @{ Authorization = "Bearer $($signup.token)" }

  $me = Invoke-RestMethod -Method Get -Uri "$baseUrl/auth/me" -Headers $headers
  if ($me.user.email -ne $email) { throw "Authenticated user mismatch" }

  $weather = Invoke-RestMethod -Method Get -Uri "$baseUrl/weather?city=Lahore&days=3"
  if ($weather.weather.city -ne "Lahore") { throw "Weather city mismatch" }
  if ($weather.forecast.Count -lt 1) { throw "Forecast is empty" }

  $tripResponse = Invoke-RestMethod -Method Post -Uri "$baseUrl/trips/generate" -Headers $headers -ContentType "application/json" -Body (@{
    destination = "Lahore"
    days = 3
    budget = 50000
    interests = @("Historic Sites", "Food Tours")
  } | ConvertTo-Json)
  $tripId = $tripResponse.trip._id
  if (-not $tripId) { throw "Trip did not return an id" }

  $tripList = Invoke-RestMethod -Method Get -Uri "$baseUrl/trips" -Headers $headers
  if ($tripList.trips.Count -lt 1) { throw "Trip list is empty" }

  $trip = Invoke-RestMethod -Method Get -Uri "$baseUrl/trips/$tripId" -Headers $headers
  if ($trip.trip.destination -ne "Lahore") { throw "Trip destination mismatch" }

  $deleted = Invoke-RestMethod -Method Delete -Uri "$baseUrl/trips/$tripId" -Headers $headers
  if (-not $deleted.ok) { throw "Trip delete failed" }

  Write-Host "50% smoke test passed on port $Port" -ForegroundColor Green
} finally {
  if ($server -and -not $server.HasExited) {
    Stop-Process -Id $server.Id -Force
  }
}

