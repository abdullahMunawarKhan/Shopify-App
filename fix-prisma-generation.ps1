# PowerShell script to fix Prisma generation issues on Windows

Write-Host "Fixing Prisma generation permission error..." -ForegroundColor Yellow

# Try to kill any node processes
Write-Host "Closing Node.js processes..." -ForegroundColor Yellow
taskkill /F /IM node.exe 2>$null
taskkill /F /IM node.exe 2>$null

# Try to remove Prisma cache
Write-Host "Cleaning Prisma cache..." -ForegroundColor Yellow
if (Test-Path "node_modules\.prisma") {
    Remove-Item -Path "node_modules\.prisma" -Recurse -Force
}
if (Test-Path "node_modules\.cache") {
    Remove-Item -Path "node_modules\.cache" -Recurse -Force
}

# Try to generate Prisma client
Write-Host "Generating Prisma client..." -ForegroundColor Yellow
try {
    npx prisma generate
    Write-Host "✅ Prisma client generated successfully!" -ForegroundColor Green
} catch {
    Write-Host "❌ Failed. Try running PowerShell as Administrator." -ForegroundColor Red
    Write-Host "Or run: npx prisma generate --force" -ForegroundColor Yellow
}