$ips = Get-NetIPAddress -AddressFamily IPv4 | Where-Object { $_.IPAddress -notlike '169.254*' -and $_.InterfaceAlias -notmatch 'Loopback|vEthernet' }
foreach ($ip in $ips) {
    Write-Host "Interface: $($ip.InterfaceAlias) | IP: $($ip.IPAddress)"
}
