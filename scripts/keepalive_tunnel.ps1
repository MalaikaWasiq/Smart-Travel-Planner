param()
while ($true) {
    ssh -o ServerAliveInterval=15 -o ServerAliveCountMax=3 -T -o StrictHostKeyChecking=no -R 80:127.0.0.1:5000 nokey@localhost.run
    Start-Sleep -Seconds 3
}
