$ErrorActionPreference = "Stop"

Set-Location (Join-Path $PSScriptRoot "..\..")

Write-Host "Stopping LocalStack..."
docker compose down

Write-Host "Stopped."
