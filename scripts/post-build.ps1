$ErrorActionPreference = "Stop"

$root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
$package = Get-Content (Join-Path $root "package.json") -Raw | ConvertFrom-Json
$version = $package.version
$dist = Join-Path $root "dist"

$portable = Join-Path $dist "Weekly Premium Email Builder $version.exe"
$latestPortable = Join-Path $dist "Weekly Premium Email Builder Latest.exe"
if (Test-Path $portable) {
  Copy-Item -LiteralPath $portable -Destination $latestPortable -Force
}

$setup = Join-Path $dist "Weekly Premium Email Builder Setup $version.exe"
$latestSetup = Join-Path $dist "Weekly Premium Email Builder Setup Latest.exe"
if (Test-Path $setup) {
  Copy-Item -LiteralPath $setup -Destination $latestSetup -Force
}
