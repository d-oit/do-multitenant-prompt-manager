# Script to start dev server and capture console output with Playwright

Write-Host "🚀 Starting development server..." -ForegroundColor Cyan

# Start frontend dev server in background
$frontendJob = Start-Job -ScriptBlock {
    Set-Location "D:\git\do-multitenant-prompt-manager"
    npm run dev:frontend
}

Write-Host "⏳ Waiting for dev server to be ready..." -ForegroundColor Yellow

# Wait for server to be ready
$maxAttempts = 30
$attempt = 0
$serverReady = $false

while ($attempt -lt $maxAttempts -and -not $serverReady) {
    Start-Sleep -Seconds 1
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:5173" -TimeoutSec 2 -UseBasicParsing -ErrorAction SilentlyContinue
        if ($response.StatusCode -eq 200) {
            $serverReady = $true
            Write-Host "✅ Dev server is ready!" -ForegroundColor Green
        }
    } catch {
        # Server not ready yet
    }
    $attempt++
}

if (-not $serverReady) {
    Write-Host "❌ Dev server failed to start after 30 seconds" -ForegroundColor Red
    Stop-Job $frontendJob
    Remove-Job $frontendJob
    exit 1
}

Write-Host ""
Write-Host "🎭 Running Playwright to capture console output..." -ForegroundColor Cyan
Write-Host ""

# Run Playwright script
try {
    Set-Location "D:\git\do-multitenant-prompt-manager"
    node scripts/capture-console.mjs
} catch {
    Write-Host "❌ Playwright script error: $_" -ForegroundColor Red
} finally {
    Write-Host ""
    Write-Host "🛑 Stopping dev server..." -ForegroundColor Yellow
    Stop-Job $frontendJob
    Remove-Job $frontendJob
    Write-Host "✅ Cleanup complete" -ForegroundColor Green
}
