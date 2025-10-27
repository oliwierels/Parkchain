# 🔥 SZYBKA NAPRAWA - Błąd 404 i Batch Transaction

## ❌ Problem 1: "Failed to tokenize asset: 404"

### Przyczyna:
**BACKEND NIE DZIAŁA!** 🚨

### ✅ Rozwiązanie (SUPER PROSTE):

#### **Opcja A: Użyj skryptu (NAJLEPSZE)**
```bash
cd /home/user/Parkchain
./start-backend.sh
```

#### **Opcja B: Ręcznie**
```bash
cd /home/user/Parkchain/backend
npm run dev
```

### Jak sprawdzić czy działa?

W terminalu powinieneś zobaczyć:
```
✅ Supabase client initialized
✅ Parking Marketplace routes registered
🚀 Parkchain API running on port 3000
```

Lub testuj w przeglądarce:
```
http://localhost:3000/api/parking-marketplace/stats
```

Powinieneś zobaczyć JSON z danymi!

---

## ❌ Problem 2: Co to Batch Transaction?

### Co to jest?

**Batch Transaction Modal** to zaawansowana funkcja dla **premium użytkowników** (VIP tier) która pozwala:

1. **Kupić wiele DCP tokenów naraz** (np. 5 transakcji razem)
2. **Zaoszczędzić na opłatach** - jedna transakcja zamiast pięciu
3. **Atomic execution** - albo wszystkie się udadzą, albo żadna

### Przykład:
Zamiast:
- Kup 100 DCP → 0.0001 SOL fee
- Kup 200 DCP → 0.0001 SOL fee
- Kup 300 DCP → 0.0001 SOL fee
**Total: 0.0003 SOL**

Z Batch Transaction:
- Kup [100 + 200 + 300] DCP razem → **0.00015 SOL fee**
**Total: 0.00015 SOL (50% oszczędności!)**

---

## 🎯 Jak używać?

### DCP Marketplace (`/marketplace`)

1. Otwórz stronę `/marketplace`
2. Na dole strony zobaczysz przycisk **"🔥 Batch Mode"** (jeśli masz PREMIUM tier)
3. Kliknij "Batch Mode"
4. Dodaj kilka transakcji:
   - 100 DCP
   - 200 DCP
   - 300 DCP
5. Kliknij **"Execute Batch"**
6. Gateway wykona wszystkie naraz!

### Jak wyłączyć jeśli przeszkadza?

Jeśli modal się niepotrzebnie wyskakuje:

**Opcja 1: Ukryj przycisk (najlepsze)**

Edytuj `/frontend/src/pages/PointsMarketplacePage.jsx`:

Znajdź (około linii 400-500):
```javascript
{tier?.benefits?.batchTransactions && (
  <button onClick={() => setShowBatchModal(true)}>
    Batch Mode
  </button>
)}
```

Zamień na:
```javascript
{false && tier?.benefits?.batchTransactions && (
  <button onClick={() => setShowBatchModal(true)}>
    Batch Mode
  </button>
)}
```

**Opcja 2: Zmień tier**

W `/frontend/src/services/premiumTierService.js` zmień:
```javascript
// Linia ~100
const currentTier = TIERS.FREE; // Zamiast TIERS.VIP
```

---

## 🧪 TEST - Sprawdź czy backend działa:

### **Krok 1: Terminal**
```bash
./start-backend.sh
```

Poczekaj aż zobaczysz:
```
🚀 Parkchain API running on port 3000
```

### **Krok 2: Przeglądarka**

Otwórz w nowej karcie:
```
http://localhost:3000/api/parking-marketplace/listings
```

Jeśli widzisz JSON z 5 parkingami = ✅ **DZIAŁA!**

Jeśli widzisz "Cannot GET" lub timeout = ❌ **Backend nie działa**

### **Krok 3: Institutional Operator**

1. Idź na `http://localhost:5173/institutional-operator`
2. Kliknij **"Tokenize New Asset"**
3. Wypełnij formularz i kliknij "Tokenize Asset"
4. Powinieneś zobaczyć: ✅ **"Asset tokenized successfully (DEMO MODE)"**

---

## 🐛 Troubleshooting

### "Backend nie startuje"

```bash
# Sprawdź czy port 3000 jest zajęty
lsof -i:3000

# Jeśli coś tam jest, zabij proces
lsof -ti:3000 | xargs kill -9

# Uruchom ponownie
cd backend
npm run dev
```

### "npm run dev nie działa"

```bash
# Zainstaluj zależności
cd backend
npm install

# Uruchom
npm run dev
```

### "Nadal błąd 404"

1. Sprawdź czy backend działa (zobacz Krok 2 powyżej)
2. Sprawdź console przeglądarki (F12) - jaki dokładnie URL wywołuje?
3. Sprawdź terminal backendu - czy są błędy?

---

## 📋 Checklist

- [ ] Backend uruchomiony (`./start-backend.sh`)
- [ ] Widzisz "🚀 Parkchain API running on port 3000"
- [ ] Test w przeglądarce: `localhost:3000/api/parking-marketplace/listings` zwraca JSON
- [ ] Odświeżyłeś frontend (Ctrl + Shift + R)
- [ ] Institutional Operator tokenizacja działa (bez błędu 404)
- [ ] (Opcjonalnie) Batch Transaction wyłączony jeśli przeszkadza

---

## 💡 Szybkie rozwiązanie (copy-paste):

```bash
# Terminal 1 - Backend
cd /home/user/Parkchain/backend
lsof -ti:3000 | xargs kill -9 2>/dev/null
npm run dev

# Terminal 2 - Jeśli frontend nie działa
cd /home/user/Parkchain/frontend
npm run dev
```

Poczekaj 10 sekund, odśwież przeglądarkę = **GOTOWE!** ✅

---

**TL;DR:**
1. Backend nie działa → `./start-backend.sh`
2. Batch Transaction to feature dla VIP (można wyłączyć)
3. Odśwież przeglądarkę i testuj!
