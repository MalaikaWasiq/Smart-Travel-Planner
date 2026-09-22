$temp = [System.IO.Path]::GetTempPath()
Write-Host "Temp Path: $temp"
$items = Get-ChildItem -Path $temp -ErrorAction SilentlyContinue | Measure-Object -Property Length -Sum
Write-Host "Temp Total Size: $([math]::Round($items.Sum / 1MB, 2)) MB"

# Check largest folders in user profile
$folders = @("AppData\Local\Temp", "AppData\Local\npm-cache", "AppData\Local\pip\cache", "Downloads")
foreach ($f in $folders) {
    $p = Join-Path $env:USERPROFILE $f
    if (Test-Path $p) {
        $size = (Get-ChildItem -Path $p -Recurse -File -ErrorAction SilentlyContinue | Measure-Object -Property Length -Sum).Sum
        Write-Host "${f} : $([math]::Round($size / 1MB, 2)) MB"
    }
}
