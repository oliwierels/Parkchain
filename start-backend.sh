#!/bin/bash

# 🚀 Quick Fix Script - Parkchain Backend Starter
# Uruchamia backend automatycznie

echo "🔧 Parkchain Backend - Quick Start"
echo "=================================="
echo ""

# Sprawdź czy backend działa
if lsof -ti:3000 > /dev/null 2>&1; then
    echo "⚠️  Port 3000 jest zajęty. Zatrzymuję stary proces..."
    lsof -ti:3000 | xargs kill -9
    sleep 1
fi

# Przejdź do folderu backend
cd /home/user/Parkchain/backend || exit 1

echo "✅ Uruchamiam backend..."
echo ""

# Uruchom backend
npm run dev

# Jeśli nie zadziała, spróbuj node
if [ $? -ne 0 ]; then
    echo "⚠️  npm run dev nie zadziałał, próbuję node server.js..."
    node server.js
fi
