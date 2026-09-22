Write-Host "==========================================" -ForegroundColor Cyan
Write-Host " SMART TRAVEL PLANNER - SYSTEM STATUS" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan

Write-Host "`n1. MongoDB (Port 27017):"
$mongoConn = Get-NetTCPConnection -LocalPort 27017 -State Listen -ErrorAction SilentlyContinue
if ($mongoConn) {
    Write-Host "  Status: RUNNING (PID: $($mongoConn.OwningProcess))" -ForegroundColor Green
} else {
    Write-Host "  Status: STOPPED" -ForegroundColor Red
}

Write-Host "`n2. ML Recommendation Service (Port 8000):"
try {
    $mlHealth = Invoke-RestMethod -Uri "http://127.0.0.1:8000/health" -Method Get -TimeoutSec 5
    Write-Host "  Status: RUNNING" -ForegroundColor Green
    Write-Host "  Model Version: $($mlHealth.modelVersion)" -ForegroundColor Green
    Write-Host "  Benchmark Model: $($mlHealth.benchmarkModel)" -ForegroundColor Green
    Write-Host "  Benchmark Gate: $($mlHealth.benchmarkGatePassed)" -ForegroundColor Green
} catch {
    Write-Host "  Status: ERROR - $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n3. Backend API Service (Port 5000):"
try {
    $apiHealth = Invoke-RestMethod -Uri "http://localhost:5000/api/health" -Method Get -TimeoutSec 5
    Write-Host "  Status: RUNNING" -ForegroundColor Green
    Write-Host "  Service: $($apiHealth.service)" -ForegroundColor Green
    Write-Host "  Database: $($apiHealth.database)" -ForegroundColor Green
} catch {
    Write-Host "  Status: ERROR - $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n4. Frontend Metro / Expo (Port 8081):"
$expoConn = Get-NetTCPConnection -LocalPort 8081 -State Listen -ErrorAction SilentlyContinue
if ($expoConn) {
    Write-Host "  Status: RUNNING (Port 8081, PID: $($expoConn.OwningProcess))" -ForegroundColor Green
    Write-Host "  Web URL: http://localhost:8081" -ForegroundColor Cyan
} else {
    Write-Host "  Status: STOPPED" -ForegroundColor Red
}

Write-Host "`n==========================================" -ForegroundColor Cyan
