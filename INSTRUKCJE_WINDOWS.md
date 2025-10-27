# 🪟 INSTRUKCJE DLA WINDOWS - Parkchain

## 🎯 SZYBKI START - 3 KROKI

### Krok 1: Znajdź folder projektu
Twój projekt jest prawdopodobnie w jednej z tych lokalizacji:
- `C:\Users\oliwi\Parkchain`
- `C:\Users\oliwi\Documents\Parkchain`
- `C:\Users\oliwi\Desktop\Parkchain`
- `C:\Projects\Parkchain`

**Znajdź folder gdzie masz pliki `frontend` i `backend`**

---

### Krok 2: Uruchom PowerShell skrypt

**Metoda A: Uruchom skrypt (ZALECANE)**

```powershell
# 1. Otwórz PowerShell jako Administrator
# 2. Przejdź do folderu projektu:
cd C:\Users\oliwi\Parkchain  # <-- ZMIEŃ NA SWOJĄ ŚCIEŻKĘ!

# 3. Pozwól na wykonanie skryptów (jednorazowo):
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass

# 4. Uruchom skrypt:
.\restart_parkchain.ps1
```

**Metoda B: Manualnie (jeśli skrypt nie działa)**

Przejdź do sekcji "INSTRUKCJE MANUALNE" poniżej.

---

### Krok 3: Wyczyść cache przeglądarki

**KRYTYCZNE!** Po uruchomieniu frontendu:

1. Otwórz: `http://localhost:5173`
2. Naciśnij: `Ctrl + Shift + R` (hard reload)
3. Lub: F12 → Network → zaznacz "Disable cache" → Ctrl + R

---

## 📝 INSTRUKCJE MANUALNE (Krok po kroku)

### 1. Zatrzymaj stare procesy

```powershell
# Otwórz Task Manager (Ctrl + Shift + Esc)
# Znajdź i zakończ:
# - Node.js processes
# - npm processes
```

### 2. Wyczyść cache

```powershell
cd C:\Users\oliwi\Parkchain\frontend  # ZMIEŃ ŚCIEŻKĘ!

# Usuń foldery cache:
Remove-Item -Recurse -Force node_modules\.vite -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force node_modules\.cache -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force dist -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force .vite -ErrorAction SilentlyContinue

Write-Host "✅ Cache wyczyszczony"
```

### 3. Sprawdź branch

```powershell
cd C:\Users\oliwi\Parkchain  # ZMIEŃ ŚCIEŻKĘ!

git branch --show-current
# Powinno być: claude/improve-app-functionality-011CUXtju5Wa8hNq4oXG5s6T

# Jeśli nie:
git checkout claude/improve-app-functionality-011CUXtju5Wa8hNq4oXG5s6T
git pull origin claude/improve-app-functionality-011CUXtju5Wa8hNq4oXG5s6T
```

### 4. Uruchom Backend (Terminal 1)

```powershell
# Otwórz NOWY terminal PowerShell
cd C:\Users\oliwi\Parkchain\backend  # ZMIEŃ ŚCIEŻKĘ!

# Sprawdź czy jest .env
ls .env

# Jeśli nie ma, skopiuj z przykładu:
# cp .env.example .env
# Uzupełnij SUPABASE_URL i SUPABASE_ANON_KEY

# Uruchom backend:
npm start
```

**Poczekaj aż zobaczysz:**
```
🚀 Parkchain API running on port 3000
```

### 5. Uruchom Frontend (Terminal 2)

```powershell
# Otwórz DRUGI terminal PowerShell
cd C:\Users\oliwi\Parkchain\frontend  # ZMIEŃ ŚCIEŻKĘ!

# Uruchom frontend:
npm run dev
```

**Poczekaj aż zobaczysz:**
```
➜  Local:   http://localhost:5173/
```

### 6. Wyczyść cache przeglądarki

**NAJWAŻNIEJSZY KROK!**

1. Otwórz: `http://localhost:5173`
2. Naciśnij: **`Ctrl + Shift + R`** (hard reload)
3. Otwórz DevTools: **F12**
4. Zakładka **Network** → zaznacz **"Disable cache"**
5. Odśwież: **Ctrl + R**

---

## 🧪 TESTY

### Test 1: Filtry na mapie
```
1. http://localhost:5173/map
2. Kliknij "Filtry"
3. Ustaw cena max 20 PLN
4. "Zastosuj"

✅ Mapa NIE jest biała
✅ Widzisz przefiltrowane parkingi
```

### Test 2: Płatność krypto
```
1. Zarezerwuj parking
2. Wybierz płatność krypto
3. Sprawdź console (F12)

✅ "💰 Balance check: ..."
✅ Jeśli brak środków: komunikat z kwotą
```

### Test 3: Live Feed
```
1. http://localhost:5173/charging-map
2. Rozpocznij ładowanie
3. Sprawdź terminal backendu

✅ "🔌 Starting charging session..."
✅ "✅ Charging session created..."

4. http://localhost:5173/live-feed
✅ Sesja widoczna
```

---

## ❗ NAJCZĘSTSZE PROBLEMY

### Problem: "npm nie jest rozpoznawany"
**Rozwiązanie:** Zainstaluj Node.js z https://nodejs.org/

### Problem: "Port 3000 jest zajęty"
**Rozwiązanie:**
```powershell
# Znajdź proces na porcie 3000:
netstat -ano | findstr :3000

# Zabij proces (XXXX to PID z poprzedniej komendy):
taskkill /PID XXXX /F
```

### Problem: "Port 5173 jest zajęty"
**Rozwiązanie:**
```powershell
# Znajdź i zabij proces:
netstat -ano | findstr :5173
taskkill /PID XXXX /F
```

### Problem: "Nadal widzę stary kod"
**Rozwiązanie:**
1. Zamknij WSZYSTKIE karty z localhost:5173
2. Ctrl + Shift + Del → Wyczyść cache (ostatnia godzina)
3. Zamknij przeglądarkę
4. Otwórz ponownie
5. Ctrl + Shift + R

### Problem: "Backend się nie uruchamia"
**Rozwiązanie:**
```powershell
cd backend

# Sprawdź .env:
cat .env

# Musi zawierać:
# SUPABASE_URL=https://...
# SUPABASE_ANON_KEY=eyJ...
# PORT=3000

# Jeśli brakuje, dodaj:
notepad .env
```

---

## 🔧 ALTERNATYWNA METODA - WSL (Windows Subsystem for Linux)

Jeśli masz zainstalowany WSL:

```powershell
# W PowerShell:
wsl

# Teraz w WSL bash:
cd /home/user/Parkchain
bash restart_all.sh
```

Aby zainstalować WSL:
```powershell
wsl --install
```

---

## 📋 CHECKLIST

Zanim uruchomisz aplikację, upewnij się:

- [ ] Zainstalowany Node.js (v18+)
- [ ] Zainstalowany Git
- [ ] Sklonowany projekt Parkchain
- [ ] Plik `backend/.env` z Supabase credentials
- [ ] Wykonano `npm install` w `backend/`
- [ ] Wykonano `npm install` w `frontend/`
- [ ] Port 3000 wolny (backend)
- [ ] Port 5173 wolny (frontend)

---

## 🆘 OSTATECZNE ROZWIĄZANIE

Jeśli NIC nie działa:

```powershell
# 1. Usuń node_modules (tylko jeśli konieczne):
cd C:\Users\oliwi\Parkchain\frontend
Remove-Item -Recurse -Force node_modules
npm install

cd ..\backend
Remove-Item -Recurse -Force node_modules
npm install

# 2. Pełny restart:
cd C:\Users\oliwi\Parkchain

# Pobierz najnowsze zmiany:
git fetch origin
git checkout claude/improve-app-functionality-011CUXtju5Wa8hNq4oXG5s6T
git pull origin claude/improve-app-functionality-011CUXtju5Wa8hNq4oXG5s6T

# 3. Uruchom według instrukcji od kroku 4
```

---

## 💡 PRZYDATNE KOMENDY

```powershell
# Sprawdź wersję Node:
node --version  # Powinno być v18 lub wyżej

# Sprawdź czy port jest wolny:
netstat -ano | findstr :3000
netstat -ano | findstr :5173

# Pokaż procesy Node:
Get-Process -Name "node"

# Zabij wszystkie procesy Node (OSTROŻNIE!):
Get-Process -Name "node" | Stop-Process -Force

# Sprawdź branch:
git branch --show-current

# Zobacz ostatnie commity:
git log --oneline -3
```

---

## ✅ SUKCES!

Jeśli wszystkie 3 testy przechodzą:
- ✅ Filtry działają
- ✅ Płatność krypto sprawdza saldo
- ✅ Sesje pokazują się w Live Feed

**GRATULACJE! Wszystko działa!** 🎉

---

**Utworzono:** 27 października 2025
**System:** Windows 10/11
**Projekt:** Parkchain
