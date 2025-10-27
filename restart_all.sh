#!/bin/bash
#
# KOMPLETNA NAPRAWA I RESTART PARKCHAIN
# Uruchom ten skrypt aby naprawić wszystkie problemy
#

set -e

echo "╔═══════════════════════════════════════════════════════════╗"
echo "║   PARKCHAIN - KOMPLETNA NAPRAWA I RESTART                ║"
echo "╚═══════════════════════════════════════════════════════════╝"
echo ""

# 1. Zatrzymaj wszystkie procesy
echo "⏹️  Krok 1/6: Zatrzymywanie procesów..."
pkill -9 -f "vite" 2>/dev/null || true
pkill -9 -f "node.*frontend" 2>/dev/null || true
pkill -9 -f "npm.*dev" 2>/dev/null || true
sleep 2
echo "✅ Procesy zatrzymane"
echo ""

# 2. Sprawdź branch
echo "🔍 Krok 2/6: Sprawdzanie brancha..."
CURRENT_BRANCH=$(git branch --show-current)
echo "   Obecny branch: $CURRENT_BRANCH"
EXPECTED_BRANCH="claude/improve-app-functionality-011CUXtju5Wa8hNq4oXG5s6T"
if [ "$CURRENT_BRANCH" != "$EXPECTED_BRANCH" ]; then
    echo "⚠️  Uwaga: Jesteś na złym branchu!"
    echo "   Przełączam na: $EXPECTED_BRANCH"
    git checkout "$EXPECTED_BRANCH"
fi
echo "✅ Branch poprawny"
echo ""

# 3. Wyczyść cache
echo "🧹 Krok 3/6: Czyszczenie cache..."
cd frontend
rm -rf node_modules/.vite 2>/dev/null || true
rm -rf node_modules/.cache 2>/dev/null || true
rm -rf dist 2>/dev/null || true
rm -rf .vite 2>/dev/null || true
echo "✅ Cache wyczyszczony"
echo ""

# 4. Weryfikuj naprawki
echo "🔍 Krok 4/6: Weryfikowanie naprawek w kodzie..."

# Sprawdź naprawkę filtrów
if grep -q "onFilterChange={setFilteredParkings}" src/pages/MapPage.jsx; then
    echo "   ✅ Naprawka #1 (Filtry) - OK"
else
    echo "   ❌ Naprawka #1 (Filtry) - BRAK!"
    exit 1
fi

# Sprawdź naprawkę płatności
if grep -q "Check user balance" src/components/ReservationModal.jsx; then
    echo "   ✅ Naprawka #2 (Płatność) - OK"
else
    echo "   ❌ Naprawka #2 (Płatność) - BRAK!"
    exit 1
fi

# Sprawdź naprawkę sesji ładowania
cd ../backend
if grep -q "Broadcast new session through WebSocket" server.js; then
    echo "   ✅ Naprawka #3 (Live Feed) - OK"
else
    echo "   ❌ Naprawka #3 (Live Feed) - BRAK!"
    exit 1
fi

cd ../frontend
echo "✅ Wszystkie naprawki zweryfikowane"
echo ""

# 5. Start backend (w tle)
echo "🚀 Krok 5/6: Uruchamianie backendu..."
cd ../backend
if [ ! -f ".env" ]; then
    echo "⚠️  Uwaga: Brak pliku .env w backendzie!"
    echo "   Upewnij się że masz poprawną konfigurację Supabase"
fi

# Sprawdź czy backend już działa
if lsof -Pi :3000 -sTCP:LISTEN -t >/dev/null ; then
    echo "   ℹ️  Backend już działa na porcie 3000"
else
    echo "   Uruchamianie backend server..."
    npm start > /tmp/parkchain-backend.log 2>&1 &
    BACKEND_PID=$!
    echo "   Backend PID: $BACKEND_PID"
    sleep 3

    # Sprawdź czy backend wystartował
    if lsof -Pi :3000 -sTCP:LISTEN -t >/dev/null ; then
        echo "   ✅ Backend działa na http://localhost:3000"
    else
        echo "   ❌ Backend nie uruchomił się. Sprawdź logi:"
        echo "      tail -f /tmp/parkchain-backend.log"
        exit 1
    fi
fi
echo ""

# 6. Start frontend
echo "🚀 Krok 6/6: Uruchamianie frontendu..."
cd ../frontend
echo ""
echo "╔═══════════════════════════════════════════════════════════╗"
echo "║                  FRONTEND STARTUJE...                    ║"
echo "╠═══════════════════════════════════════════════════════════╣"
echo "║                                                          ║"
echo "║  Po uruchomieniu MUSISZ wykonać w przeglądarce:         ║"
echo "║                                                          ║"
echo "║  1. Otwórz: http://localhost:5173                       ║"
echo "║  2. Naciśnij: Ctrl + Shift + R (HARD RELOAD!)           ║"
echo "║  3. Otwórz DevTools: F12                                ║"
echo "║  4. Zakładka Network → zaznacz 'Disable cache'          ║"
echo "║  5. Odśwież ponownie: Ctrl + R                          ║"
echo "║                                                          ║"
echo "╚═══════════════════════════════════════════════════════════╝"
echo ""
sleep 2

npm run dev

# Ten skrypt zakończy się gdy zatrzymasz frontend (Ctrl+C)
