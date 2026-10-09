$ErrorActionPreference = "Stop"

Set-Location (Join-Path $PSScriptRoot "..\..")

if (Test-Path ".env") {
  Get-Content ".env" | ForEach-Object {
    $line = $_.Trim()
    if ($line -and -not $line.StartsWith("#") -and $line.Contains("=")) {
      $name, $value = $line.Split("=", 2)
      [Environment]::SetEnvironmentVariable($name.Trim(), $value.Trim(), "Process")
    }
  }
}

Write-Host "Starting LocalStack..."
docker compose up -d localstack

Write-Host "Creating local AWS resources..."
npm run aws:bootstrap

Write-Host ""
Write-Host "Open http://localhost:3000 after the API starts."
Write-Host "Press Ctrl+C here to stop the API."
Write-Host ""

npm run dev
