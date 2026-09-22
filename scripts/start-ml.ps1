param([int]$Port = 8000)
$ErrorActionPreference = 'Stop'
$mlDir = Join-Path $PSScriptRoot '..\ml'
$repoRoot = Resolve-Path -LiteralPath (Join-Path $PSScriptRoot '..')
$venvPython = Join-Path $repoRoot '.venv\Scripts\python.exe'
Set-Location -LiteralPath $mlDir
if (Test-Path -LiteralPath $venvPython) { $python = $venvPython }
elseif (Get-Command python -ErrorAction SilentlyContinue) { $python = (Get-Command python).Source }
else { throw 'Python 3.11 or newer is required for the recommendation service.' }
& $python -c "import fastapi,uvicorn,pandas,sklearn,openpyxl" 2>$null
if ($LASTEXITCODE -ne 0) { & $python -m pip install -r requirements.txt; if ($LASTEXITCODE -ne 0) { throw 'ML dependency installation failed.' } }
if (-not (Test-Path -LiteralPath 'artifacts\pakistan_ranker.json')) { & $python train.py; if ($LASTEXITCODE -ne 0) { throw 'Recommendation model training failed.' } }
Write-Host "Recommendation service listening on http://127.0.0.1:$Port" -ForegroundColor Green
& $python -m uvicorn app:app --host 127.0.0.1 --port $Port
