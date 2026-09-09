Write-Host "Initial C: free space:"
Get-CimInstance Win32_LogicalDisk -Filter "DeviceID='C:'" | Select-Object DeviceID, @{Name='FreeGB';Expression={[math]::Round($_.FreeSpace/1GB, 2)}}

Write-Host "Cleaning npm cache..."
npm cache clean --force

Write-Host "Cleaning Temp files older than 1 day..."
Get-ChildItem -Path "$env:LOCALAPPDATA\Temp" -Recurse -Force -ErrorAction SilentlyContinue | Where-Object { -not $_.PSIsContainer -and $_.LastWriteTime -lt (Get-Date).AddDays(-1) } | Remove-Item -Force -ErrorAction SilentlyContinue

Write-Host "Clearing Recycle Bin..."
Clear-RecycleBin -Force -ErrorAction SilentlyContinue

Write-Host "Updated C: free space:"
Get-CimInstance Win32_LogicalDisk -Filter "DeviceID='C:'" | Select-Object DeviceID, @{Name='FreeGB';Expression={[math]::Round($_.FreeSpace/1GB, 2)}}
