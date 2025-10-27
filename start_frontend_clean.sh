#!/bin/bash

echo "🧹 Czyszczenie Parkchain Frontend..."
cd /home/user/Parkchain/frontend

# Kill existing processes
echo "⏹️  Zatrzymywanie procesów..."
pkill -9 -f vite 2>/dev/null
pkill -9 -f "node.*vite" 2>/dev/null
sleep 2

# Clear all caches
echo "🗑️  Usuwanie cache..."
rm -rf node_modules/.vite
rm -rf node_modules/.cache
rm -rf dist
rm -rf .vite
echo "✅ Cache wyczyszczony"

# Start dev server
echo ""
echo "🚀 Uruchamianie dev servera..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
npm run dev
