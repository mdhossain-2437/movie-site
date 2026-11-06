<#
.SYNOPSIS
  Safe boxd helper for inspecting or connecting to the `dark-crow` VPS (fra · delowars-default-org).
.DESCRIPTION
  Defaults to read-only preflight inspection in compliance with AGENTS.md §1.5 approval gates.
  Pass -Mode Shell to open an interactive `boxd connect` session.
#>
param(
  [ValidateSet("Inspect", "Shell")]
  [string]$Mode = "Inspect",
  [string]$Org = "delowars-default-org",
  [string]$Region = "fra",
  [string]$Machine = "dark-crow"
)

$ErrorActionPreference = "Stop"

$boxdCmd = Get-Command boxd -ErrorAction SilentlyContinue
if (-not $boxdCmd) {
  throw "boxd CLI not found on PATH. Expected at C:\Users\<user>\.local\bin\boxd.exe."
}

Write-Host "[boxd] Using $($boxdCmd.Source) ($(boxd --version))" -ForegroundColor Cyan

if ($Mode -eq "Inspect") {
  Write-Host "[boxd] Querying machine inventory in region '$Region'..." -ForegroundColor Cyan
  boxd list --region $Region --json
  Write-Host "[boxd] Running read-only host telemetry on '$Machine'..." -ForegroundColor Cyan
  $null | boxd machine exec --region $Region --timeout 15 $Machine sh -c "uname -a; nproc; free -h; df -h /; docker --version"
  exit 0
}

Write-Host "[boxd] Opening interactive session: boxd connect --org $Org --region $Region $Machine" -ForegroundColor Yellow
boxd connect --org $Org --region $Region $Machine
