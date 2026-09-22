param(
  [string]$Version = "1.0.0",
  [string]$OutputDirectory = ""
)

$ErrorActionPreference = "Stop"
$repoRoot = (Resolve-Path -LiteralPath (Join-Path $PSScriptRoot "..")).Path
$deliveryDir = if ($OutputDirectory) { [IO.Path]::GetFullPath($OutputDirectory) } else { Join-Path $repoRoot "delivered" }
$stamp = Get-Date -Format "yyyyMMdd_HHmmss"
$packageName = "TravelPlanner_client_v$Version"
$zipPath = Join-Path $deliveryDir "${packageName}_${stamp}.zip"
$stagingContainer = Join-Path $env:TEMP "travel-planner-delivery-$([Guid]::NewGuid().ToString('N'))"
$packageRoot = Join-Path $stagingContainer $packageName

function Copy-ProjectItem([string]$RelativePath) {
  $source = Join-Path $repoRoot $RelativePath
  if (-not (Test-Path -LiteralPath $source)) { throw "Required delivery item is missing: $RelativePath" }
  $destination = Join-Path $packageRoot $RelativePath
  $destinationParent = Split-Path -Parent $destination
  if (-not (Test-Path -LiteralPath $destinationParent)) { New-Item -ItemType Directory -Path $destinationParent -Force | Out-Null }
  Copy-Item -LiteralPath $source -Destination $destination -Recurse -Force
}

function Assert-SafeDelivery {
  $files = Get-ChildItem -LiteralPath $packageRoot -Recurse -File
  $forbiddenPath = $files | Where-Object {
    $_.FullName -match '[\\/](node_modules|\.venv|\.expo|dist|build|\.pytest_cache|__pycache__|delivered)[\\/]' -or
    $_.Name -eq '.env' -or $_.Extension -eq '.pyc' -or $_.Extension -eq '.log'
  }
  if ($forbiddenPath) { throw "Forbidden delivery path detected: $($forbiddenPath[0].FullName)" }

  $textExtensions = @('.js', '.json', '.md', '.ps1', '.txt', '.csv', '.example', '.gitignore')
  $textFiles = $files | Where-Object { $textExtensions -contains $_.Extension -or $_.Name -in @('.env.example', '.gitignore') }
  foreach ($file in $textFiles) {
    $content = Get-Content -LiteralPath $file.FullName -Raw -ErrorAction SilentlyContinue
    if ($content -match 'gsk_[A-Za-z0-9_-]{20,}' -or $content -match 'sk-or-v1-[A-Za-z0-9_-]{20,}' -or $content -match 'mongodb\+srv://[^\s<]+') {
      throw "Possible credential detected in delivery file: $($file.FullName)"
    }
  }
}

if (-not (Test-Path -LiteralPath $deliveryDir)) { New-Item -ItemType Directory -Path $deliveryDir -Force | Out-Null }
$resolvedDelivery = (Resolve-Path -LiteralPath $deliveryDir).Path
if (-not $resolvedDelivery.StartsWith($repoRoot + [IO.Path]::DirectorySeparatorChar) -and -not $OutputDirectory) {
  throw "Default delivery path resolved outside the repository."
}

try {
  New-Item -ItemType Directory -Path $packageRoot -Force | Out-Null

  @(
    ".gitignore",
    "AGENT_SETUP.md",
    "CLIENT_DELIVERY.md",
    "FEATURES.md",
    "README.md",
    "VERSION",
    "plan.md",
    "Project Proposal.pdf",
    "run_all.ps1",
    "setup_fresh_pc.ps1",
    "backend\.env.example",
    "backend\package.json",
    "backend\package-lock.json",
    "backend\src",
    "frontend\.env.example",
    "frontend\.gitignore",
    "frontend\App.js",
    "frontend\app.json",
    "frontend\index.js",
    "frontend\package.json",
    "frontend\package-lock.json",
    "frontend\assets",
    "frontend\src",
    "ml\README.md",
    "ml\requirements.txt",
    "ml\app.py",
    "ml\train.py",
    "ml\test_recommender.py",
    "ml\artifacts",
    "ml\data",
    "scripts"
  ) | ForEach-Object { Copy-ProjectItem $_ }

  Assert-SafeDelivery
  if (Test-Path -LiteralPath $zipPath) { throw "Delivery ZIP already exists: $zipPath" }
  Compress-Archive -LiteralPath $packageRoot -DestinationPath $zipPath -CompressionLevel Optimal

  $archive = [IO.Compression.ZipFile]::OpenRead($zipPath)
  try {
    $entries = @($archive.Entries)
    $requiredEntries = @(
      "$packageName/AGENT_SETUP.md",
      "$packageName/setup_fresh_pc.ps1",
      "$packageName/backend/package-lock.json",
      "$packageName/frontend/package-lock.json",
      "$packageName/ml/artifacts/pakistan_ranker.json"
    )
    foreach ($required in $requiredEntries) {
      if (-not ($entries.FullName -contains $required)) { throw "ZIP validation failed. Missing entry: $required" }
    }
    $badEntry = $entries | Where-Object { $_.FullName -match '(^|/)(node_modules|\.venv|\.expo|dist|build|__pycache__|\.pytest_cache|delivered)(/|$)' -or $_.FullName -match '(^|/)\.env$' } | Select-Object -First 1
    if ($badEntry) { throw "ZIP contains forbidden entry: $($badEntry.FullName)" }
  } finally {
    $archive.Dispose()
  }

  $hashLines = Get-ChildItem -LiteralPath $deliveryDir -Filter '*.zip' -File | Sort-Object Name | ForEach-Object {
    $hash = (Get-FileHash -LiteralPath $_.FullName -Algorithm SHA256).Hash.ToLowerInvariant()
    "$hash  $($_.Name)"
  }
  $hashLines | Set-Content -LiteralPath (Join-Path $deliveryDir "SHA256SUMS.txt") -Encoding ascii

  [pscustomobject]@{
    Version = $Version
    ZipPath = $zipPath
    SizeBytes = (Get-Item -LiteralPath $zipPath).Length
    Sha256 = (Get-FileHash -LiteralPath $zipPath -Algorithm SHA256).Hash.ToLowerInvariant()
  }
} finally {
  $resolvedTemp = (Resolve-Path -LiteralPath $env:TEMP).Path
  if (Test-Path -LiteralPath $stagingContainer) {
    $resolvedStage = (Resolve-Path -LiteralPath $stagingContainer).Path
    if (-not $resolvedStage.StartsWith($resolvedTemp + [IO.Path]::DirectorySeparatorChar)) { throw "Refusing to remove staging path outside TEMP: $resolvedStage" }
    Remove-Item -LiteralPath $resolvedStage -Recurse -Force
  }
}
