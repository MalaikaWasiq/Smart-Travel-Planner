param(
  [Parameter(Mandatory = $true)]
  [string]$ZipPath
)

$ErrorActionPreference = "Stop"
$resolvedZip = (Resolve-Path -LiteralPath $ZipPath).Path
$tempRoot = (Resolve-Path -LiteralPath $env:TEMP).Path
$validationRoot = Join-Path $tempRoot "travel-planner-validation-$([Guid]::NewGuid().ToString('N'))"

try {
  New-Item -ItemType Directory -Path $validationRoot -Force | Out-Null
  Expand-Archive -LiteralPath $resolvedZip -DestinationPath $validationRoot
  $packageRoot = Get-ChildItem -LiteralPath $validationRoot -Directory | Select-Object -First 1
  if (-not $packageRoot) { throw "Delivery ZIP does not contain a package root folder." }

  Write-Host "Validating extracted package: $($packageRoot.FullName)" -ForegroundColor Cyan
  & (Join-Path $packageRoot.FullName "setup_fresh_pc.ps1") -InstallMissingTools $false
  if ($LASTEXITCODE -ne 0) { throw "Fresh-PC setup validation failed." }

  $webOutput = Join-Path $validationRoot "expo-web-export"
  Push-Location (Join-Path $packageRoot.FullName "frontend")
  try {
    & npx expo export --platform web --output-dir $webOutput
    if ($LASTEXITCODE -ne 0) { throw "Expo web export validation failed." }
  } finally {
    Pop-Location
  }

  if (-not (Test-Path -LiteralPath (Join-Path $webOutput "index.html"))) {
    throw "Expo export completed without index.html."
  }

  Write-Host "Client delivery validation passed: dependencies, ML tests, API integration, and Expo web export." -ForegroundColor Green
} finally {
  if (Test-Path -LiteralPath $validationRoot) {
    $resolvedValidation = (Resolve-Path -LiteralPath $validationRoot).Path
    if (-not $resolvedValidation.StartsWith($tempRoot + [IO.Path]::DirectorySeparatorChar)) {
      throw "Refusing to remove validation path outside TEMP: $resolvedValidation"
    }
    Remove-Item -LiteralPath $resolvedValidation -Recurse -Force
  }
}
