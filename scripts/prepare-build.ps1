$ErrorActionPreference = "Stop"

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path

& (Join-Path $scriptDir "close-old-builds.ps1")
& (Join-Path $scriptDir "generate-icon.ps1")
