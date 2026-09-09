$ErrorActionPreference = "Stop"

$dataDir = "C:\Users\JIN\mongodb\data\db"
if (-not (Test-Path $dataDir)) {
    New-Item -ItemType Directory -Force -Path $dataDir | Out-Null
}

$mongodCandidates = @(
    "C:\Users\JIN\mongodb\MongoDB\Server\8.3\bin\mongod.exe",
    "C:\Program Files\MongoDB\Server\8.0\bin\mongod.exe",
    "C:\Program Files\MongoDB\Server\7.0\bin\mongod.exe"
)

$mongodExe = $null
foreach ($candidate in $mongodCandidates) {
    if (Test-Path -LiteralPath $candidate) {
        $mongodExe = $candidate
        break
    }
}

if (-not $mongodExe) {
    $found = Get-Command "mongod" -ErrorAction SilentlyContinue
    if ($found) { $mongodExe = $found.Source }
}

if (-not $mongodExe) {
    throw "mongod.exe not found."
}

# Check if port 27017 is already listening
$listening = Get-NetTCPConnection -LocalPort 27017 -State Listen -ErrorAction SilentlyContinue
if ($listening) {
    Write-Host "MongoDB is already listening on port 27017."
    exit 0
}

Write-Host "Starting MongoDB using $mongodExe..."
$logPath = "C:\Users\JIN\mongodb\data\mongod.log"
$proc = Start-Process -FilePath $mongodExe -ArgumentList @("--dbpath", $dataDir, "--bind_ip", "127.0.0.1", "--port", "27017", "--logpath", $logPath) -PassThru -WindowStyle Hidden

Start-Sleep -Seconds 2

$listening = Get-NetTCPConnection -LocalPort 27017 -State Listen -ErrorAction SilentlyContinue
if ($listening) {
    Write-Host "MongoDB started successfully and listening on 127.0.0.1:27017 (PID: $($proc.Id))."
} else {
    Write-Host "MongoDB failed to listen on port 27017. Log:"
    if (Test-Path $logPath) { Get-Content $logPath -Tail 20 }
}
