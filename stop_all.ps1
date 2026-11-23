# =====================================================================
# Stop All Smart Travel Planner Services & ngrok
# =====================================================================

Write-Host "Stopping all Smart Travel Planner services..." -ForegroundColor Yellow

# Kill ngrok
Get-Process ngrok -ErrorAction SilentlyContinue | Stop-Process -Force
Write-Host "[OK] ngrok processes stopped" -ForegroundColor Green

# Kill processes on Port 5000 (Node backend)
$conn5000 = Get-NetTCPConnection -LocalPort 5000 -ErrorAction SilentlyContinue
if ($conn5000) {
    $pids = $conn5000 | Select-Object -ExpandProperty OwningProcess -Unique
    foreach ($p in $pids) {
        Stop-Process -Id $p -Force -ErrorAction SilentlyContinue
    }
    Write-Host "[OK] Backend on port 5000 stopped" -ForegroundColor Green
} else {
    Write-Host "[OK] Port 5000 is clear" -ForegroundColor Green
}

# Kill processes on Port 8000 (Python uvicorn)
$conn8000 = Get-NetTCPConnection -LocalPort 8000 -ErrorAction SilentlyContinue
if ($conn8000) {
    $pids = $conn8000 | Select-Object -ExpandProperty OwningProcess -Unique
    foreach ($p in $pids) {
        Stop-Process -Id $p -Force -ErrorAction SilentlyContinue
    }
    Write-Host "[OK] ML service on port 8000 stopped" -ForegroundColor Green
} else {
    Write-Host "[OK] Port 8000 is clear" -ForegroundColor Green
}

Write-Host "All services stopped successfully." -ForegroundColor Green
