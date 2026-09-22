param([int]$BackendPort = 5200, [int]$MlPort = 8000)
$ErrorActionPreference = 'Stop'
$repoRoot = Resolve-Path -LiteralPath (Join-Path $PSScriptRoot '..')
$mlDir = Join-Path $repoRoot 'ml'
$venvPython = Join-Path $repoRoot '.venv\Scripts\python.exe'
$python = if (Test-Path -LiteralPath $venvPython) { $venvPython } elseif (Get-Command python -ErrorAction SilentlyContinue) { (Get-Command python).Source } else { throw 'Python is required. Run setup_fresh_pc.ps1 first.' }

Write-Host 'Rebuilding recommendation artifacts from verified real and labeled semi-synthetic data...'
Push-Location $mlDir
try {
  & $python 'train.py' | Out-Null
  if ($LASTEXITCODE -ne 0) { throw 'ML training/evaluation failed' }
  & $python -m pytest -q 'test_recommender.py'
  if ($LASTEXITCODE -ne 0) { throw 'ML service tests failed' }
} finally {
  Pop-Location
}

$mlOut = Join-Path $env:TEMP "smart-travel-ml-$MlPort.out.log"
$mlErr = Join-Path $env:TEMP "smart-travel-ml-$MlPort.err.log"
$ml = Start-Process -FilePath $python -ArgumentList @('-m','uvicorn','app:app','--host','127.0.0.1','--port',"$MlPort") -WorkingDirectory $mlDir -WindowStyle Hidden -PassThru -RedirectStandardOutput $mlOut -RedirectStandardError $mlErr
try {
  $ready = $false
  for($attempt=1;$attempt-le 30;$attempt++){
    try { $health=Invoke-RestMethod -Uri "http://127.0.0.1:$MlPort/health"; if($health.ok){$ready=$true;break} } catch { Start-Sleep -Milliseconds 500 }
  }
  if(-not $ready){ throw "Recommendation service did not start: $(Get-Content $mlErr -Raw -ErrorAction SilentlyContinue)" }
  $env:ML_SERVICE_URL = "http://127.0.0.1:$MlPort"
  & (Join-Path $PSScriptRoot 'test-80.ps1') -Port $BackendPort -ExpectedModel 'pakistan-content-v1.0.0'
  if($LASTEXITCODE-ne 0){throw 'Integrated API test failed'}
  Write-Host '100% automated integration suite passed.' -ForegroundColor Green
} finally {
  if($ml -and -not $ml.HasExited){Stop-Process -Id $ml.Id -Force}
}
