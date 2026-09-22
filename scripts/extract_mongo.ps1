$ErrorActionPreference = "Stop"
$msiPath = "C:\Users\JIN\AppData\Local\Temp\WinGet\MongoDB.Server.8.3.7\mongodb-windows-x86_64-8.3.7-signed.msi"
$targetDir = "C:\Users\JIN\mongodb"

if (-not (Test-Path $targetDir)) {
    New-Item -ItemType Directory -Force -Path $targetDir | Out-Null
}

Write-Host "Extracting MongoDB from MSI to $targetDir..."
$process = Start-Process -FilePath "msiexec.exe" -ArgumentList @("/a", "`"$msiPath`"", "/qn", "TARGETDIR=`"$targetDir`"") -Wait -PassThru
Write-Host "msiexec Exit Code: $($process.ExitCode)"

$mongod = Get-ChildItem -Path $targetDir -Filter "mongod.exe" -Recurse -ErrorAction SilentlyContinue | Select-Object -First 1
if ($mongod) {
    Write-Host "Found mongod at: $($mongod.FullName)"
} else {
    Write-Host "mongod.exe not found in $targetDir"
}
