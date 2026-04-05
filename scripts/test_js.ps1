Write-Host "Running D&D Character Creator Logic Tests..." -ForegroundColor Cyan

# Check if node_modules exists, if not, install
if (!(Test-Path "node_modules")) {
    Write-Host "Installing test dependencies..."
    npm install
}

# Run Vitest pointing to your specific test folder
npx vitest run --dir public/js/tests/

if ($LASTEXITCODE -eq 0) {
    Write-Host "Tests Passed!" -ForegroundColor Green
} else {
    Write-Host "Tests Failed!" -ForegroundColor Red
    exit $LASTEXITCODE
}