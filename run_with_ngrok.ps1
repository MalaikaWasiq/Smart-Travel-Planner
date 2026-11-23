# =====================================================================
# Smart Travel Planner - One-Click Launcher for Mobile Sharing
# Launches MongoDB, ML Service, Node Backend (with Web Build), & Public Tunnel
# =====================================================================

$projectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path

Write-Host "==========================================================" -ForegroundColor Green
Write-Host " [START] Starting Smart Travel Planner for Mobile Sharing" -ForegroundColor Green
Write-Host "==========================================================" -ForegroundColor Green

# 1. Start MongoDB Service if not running
$mongoService = Get-Service -Name MongoDB -ErrorAction SilentlyContinue
if ($mongoService -and $mongoService.Status -ne 'Running') {
    Write-Host "Starting MongoDB Service..." -ForegroundColor Cyan
    Start-Service MongoDB
}

# 2. Detect Local Wi-Fi IP Address
$wifiIp = (Get-NetIPAddress -AddressFamily IPv4 | Where-Object { $_.InterfaceAlias -notmatch 'Loopback' -and $_.IPAddress -notmatch '169\.254' -and ($_.InterfaceAlias -match 'Wi-Fi|Wireless|Ethernet') } | Select-Object -First 1).IPAddress
if (-not $wifiIp) { $wifiIp = "localhost" }

# 3. Launch FastAPI ML Service (Port 8000)
Write-Host "Launching ML Recommender on http://127.0.0.1:8000..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "`$Host.UI.RawUI.WindowTitle = 'STP - ML Service (8000)'; Set-Location '$projectRoot\ml'; python -m uvicorn app:app --host 127.0.0.1 --port 8000"

# 4. Launch Node.js Backend & Web Host (Port 5000)
Write-Host "Launching Node Backend on port 5000..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "`$Host.UI.RawUI.WindowTitle = 'STP - Backend & Web (5000)'; Set-Location '$projectRoot\backend'; node src/server.js"

Start-Sleep -Seconds 3

# 5. Launch Public Tunnel for Remote Supervisor Access
$hasNgrok = (Get-Command ngrok -ErrorAction SilentlyContinue)
$tunnelUrl = ""
$tunnelPass = ""

if ($hasNgrok) {
    Write-Host "Launching ngrok tunnel on port 5000..." -ForegroundColor Cyan
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "`$Host.UI.RawUI.WindowTitle = 'STP - ngrok Tunnel (5000)'; ngrok http 5000"
    Start-Sleep -Seconds 3
    try {
        $tunnelUrl = ((Invoke-RestMethod -Uri "http://127.0.0.1:4040/api/tunnels" -TimeoutSec 5).tunnels | Select-Object -First 1).public_url
    } catch {
        $tunnelUrl = ""
    }
} else {
    Write-Host "Launching localtunnel on port 5000..." -ForegroundColor Cyan
    try {
        $tunnelPass = (Invoke-RestMethod -Uri "https://loca.lt/mytunnelpassword" -TimeoutSec 3).Trim()
    } catch {
        $tunnelPass = ""
    }
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "`$Host.UI.RawUI.WindowTitle = 'STP - Public Tunnel (5000)'; npx -y localtunnel --port 5000"
}

Write-Host ""
Write-Host "==========================================================" -ForegroundColor Green
Write-Host " ALL SERVICES ARE RUNNING!" -ForegroundColor Green
Write-Host "==========================================================" -ForegroundColor Green
Write-Host ""
Write-Host " [METHOD 1] SEND PUBLIC NGROK LINK TO SUPERVISOR (ANYWHERE):" -ForegroundColor Yellow
if ($tunnelUrl) {
    Write-Host "   URL: $tunnelUrl" -ForegroundColor Green
} else {
    Write-Host "   Look at the ngrok window for your public URL (e.g. https://...ngrok-free.dev)" -ForegroundColor White
}
Write-Host "   (Supervisor opens this directly on Chrome/Safari on mobile)" -ForegroundColor White
Write-Host ""
Write-Host " [METHOD 2] IF YOU & SUPERVISOR ARE ON THE SAME WI-FI / HOTSPOT:" -ForegroundColor Yellow
Write-Host "   Send this link: http://$wifiIp:5000" -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Green
