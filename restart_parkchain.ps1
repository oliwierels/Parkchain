# PARKCHAIN - RESTART SCRIPT FOR WINDOWS
# PowerShell script to restart Parkchain with all fixes

Write-Host "╔═══════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║   PARKCHAIN - RESTART Z NAPRAWKAMI (Windows)             ║" -ForegroundColor Cyan
Write-Host "╚═══════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

# Get script directory
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $ScriptDir

# 1. Kill existing processes
Write-Host "⏹️  Krok 1/5: Zatrzymywanie procesów..." -ForegroundColor Yellow
Get-Process -Name "node" -ErrorAction SilentlyContinue | Where-Object { $_.Path -like "*Parkchain*" } | Stop-Process -Force
Start-Sleep -Seconds 2
Write-Host "✅ Procesy zatrzymane" -ForegroundColor Green
Write-Host ""

# 2. Check git branch
Write-Host "🔍 Krok 2/5: Sprawdzanie brancha..." -ForegroundColor Yellow
$currentBranch = git branch --show-current
Write-Host "   Obecny branch: $currentBranch" -ForegroundColor White
$expectedBranch = "claude/improve-app-functionality-011CUXtju5Wa8hNq4oXG5s6T"
if ($currentBranch -ne $expectedBranch) {
    Write-Host "⚠️  Uwaga: Jesteś na złym branchu!" -ForegroundColor Red
    Write-Host "   Przełączam na: $expectedBranch" -ForegroundColor Yellow
    git checkout $expectedBranch
}
Write-Host "✅ Branch poprawny" -ForegroundColor Green
Write-Host ""

# 3. Clear cache
Write-Host "🧹 Krok 3/5: Czyszczenie cache..." -ForegroundColor Yellow
Set-Location frontend
if (Test-Path "node_modules\.vite") { Remove-Item -Recurse -Force "node_modules\.vite" }
if (Test-Path "node_modules\.cache") { Remove-Item -Recurse -Force "node_modules\.cache" }
if (Test-Path "dist") { Remove-Item -Recurse -Force "dist" }
if (Test-Path ".vite") { Remove-Item -Recurse -Force ".vite" }
Write-Host "✅ Cache wyczyszczony" -ForegroundColor Green
Write-Host ""

# 4. Verify fixes
Write-Host "🔍 Krok 4/5: Weryfikowanie naprawek..." -ForegroundColor Yellow

$fix1 = Select-String -Path "src\pages\MapPage.jsx" -Pattern "onFilterChange=\{setFilteredParkings\}" -Quiet
$fix2 = Select-String -Path "src\components\ReservationModal.jsx" -Pattern "Check user balance" -Quiet
Set-Location ..\backend
$fix3 = Select-String -Path "server.js" -Pattern "Broadcast new session" -Quiet
Set-Location ..\frontend

if ($fix1) {
    Write-Host "   ✅ Naprawka #1 (Filtry) - OK" -ForegroundColor Green
} else {
    Write-Host "   ❌ Naprawka #1 (Filtry) - BRAK!" -ForegroundColor Red
    exit 1
}

if ($fix2) {
    Write-Host "   ✅ Naprawka #2 (Płatność) - OK" -ForegroundColor Green
} else {
    Write-Host "   ❌ Naprawka #2 (Płatność) - BRAK!" -ForegroundColor Red
    exit 1
}

if ($fix3) {
    Write-Host "   ✅ Naprawka #3 (Live Feed) - OK" -ForegroundColor Green
} else {
    Write-Host "   ❌ Naprawka #3 (Live Feed) - BRAK!" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Wszystkie naprawki zweryfikowane" -ForegroundColor Green
Write-Host ""

# 5. Instructions
Write-Host "🚀 Krok 5/5: Instrukcje..." -ForegroundColor Yellow
Write-Host ""
Write-Host "╔═══════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║              OTWÓRZ 2 TERMINALE                          ║" -ForegroundColor Cyan
Write-Host "╠═══════════════════════════════════════════════════════════╣" -ForegroundColor Cyan
Write-Host "║                                                          ║" -ForegroundColor Cyan
Write-Host "║  TERMINAL 1 (Backend):                                   ║" -ForegroundColor White
Write-Host "║    cd backend                                            ║" -ForegroundColor Yellow
Write-Host "║    npm start                                             ║" -ForegroundColor Yellow
Write-Host "║                                                          ║" -ForegroundColor Cyan
Write-Host "║  TERMINAL 2 (Frontend):                                  ║" -ForegroundColor White
Write-Host "║    cd frontend                                           ║" -ForegroundColor Yellow
Write-Host "║    npm run dev                                           ║" -ForegroundColor Yellow
Write-Host "║                                                          ║" -ForegroundColor Cyan
Write-Host "║  Następnie w przeglądarce:                              ║" -ForegroundColor White
Write-Host "║    1. Otwórz: http://localhost:5173                     ║" -ForegroundColor Yellow
Write-Host "║    2. Naciśnij: Ctrl + Shift + R (HARD RELOAD!)         ║" -ForegroundColor Yellow
Write-Host "║    3. F12 → Network → Disable cache                     ║" -ForegroundColor Yellow
Write-Host "║                                                          ║" -ForegroundColor Cyan
Write-Host "╚═══════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""
Write-Host "✅ Gotowe! Cache wyczyszczony, naprawki zweryfikowane." -ForegroundColor Green
Write-Host ""
