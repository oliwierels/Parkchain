# Instrukcja: Konfiguracja systemu inspekcji CrowdScan

## Krok 1: Przejdź do Supabase SQL Editor

1. Zaloguj się do [Supabase Dashboard](https://supabase.com/dashboard)
2. Wybierz swój projekt ParkChain
3. W menu po lewej stronie wybierz **SQL Editor** (ikona </> )

## Krok 2: Wykonaj skrypt SQL

1. Kliknij **New Query** (lub "+ New query")
2. Skopiuj całą zawartość pliku `inspections_setup_simple.sql`
3. Wklej do edytora SQL
4. Kliknij **Run** (lub naciśnij Ctrl+Enter)

## Krok 3: Weryfikacja

Po wykonaniu skryptu powinieneś zobaczyć:
- Message: "Tabele utworzone pomyślnie!"
- Lista tabel: `inspections`, `rewards`, `user_reputation`
- Liczba rekordów w każdej tabeli

## Struktura tabel

### 1. `inspections` - Zgłoszenia inspekcji
```sql
- id (BIGSERIAL) - ID zgłoszenia
- lot_id (BIGINT) - ID parkingu
- reporter_id (UUID) - ID użytkownika, który zgłosił
- inspector_id (UUID) - ID inspektora, który zweryfikował
- reported_occupancy (INTEGER) - Zgłoszona liczba zajętych miejsc
- status (VARCHAR) - Status: 'queued', 'confirmed', 'rejected'
- created_at (TIMESTAMP) - Data zgłoszenia
- reviewed_at (TIMESTAMP) - Data weryfikacji
```

### 2. `rewards` - Nagrody za zgłoszenia
```sql
- id (BIGSERIAL) - ID nagrody
- user_id (UUID) - ID użytkownika
- inspection_id (BIGINT) - ID powiązanej inspekcji
- type (VARCHAR) - Typ: 'credit', 'points', 'bonus'
- amount (DECIMAL) - Kwota nagrody
- currency (VARCHAR) - Waluta (domyślnie PLN)
- status (VARCHAR) - Status: 'issued', 'pending', 'paid', 'cancelled'
- created_at (TIMESTAMP) - Data przyznania
- paid_at (TIMESTAMP) - Data wypłaty
```

### 3. `user_reputation` - Reputacja użytkowników
```sql
- user_id (UUID) - ID użytkownika (PRIMARY KEY)
- score (INTEGER) - Punkty reputacji
- reports_total (INTEGER) - Łączna liczba zgłoszeń
- reports_confirmed (INTEGER) - Liczba zatwierdzonych zgłoszeń
- reports_rejected (INTEGER) - Liczba odrzuconych zgłoszeń
- updated_at (TIMESTAMP) - Data ostatniej aktualizacji
```

## Automatyka

### Trigger: `update_user_reputation`
Automatycznie aktualizuje reputację użytkownika po weryfikacji zgłoszenia:
- **+10 punktów** za zatwierdzone zgłoszenie
- **-5 punktów** za odrzucone zgłoszenie

## Krok 4: Nadaj rolę inspektora

Aby ktoś mógł weryfikować zgłoszenia, nadaj mu rolę inspektora:

```sql
UPDATE users
SET role = 'inspector'
WHERE email = 'inspector@example.com';
```

## Krok 5: Testowanie

1. **Zgłoś inspekcję:**
   - Zaloguj się jako zwykły użytkownik
   - Przejdź na mapę (`/map`)
   - Kliknij na parking
   - Kliknij "📍 Zgłoś zajętość (CrowdScan)"
   - Wypełnij formularz i wyślij

2. **Weryfikuj zgłoszenie:**
   - Zaloguj się jako inspektor
   - Przejdź do panelu inspektora (`/inspector-dashboard`)
   - Zobacz listę zgłoszeń
   - Zatwierdź lub odrzuć zgłoszenie

3. **Sprawdź reputację:**
   - Przejdź do profilu (`/profile`)
   - Zobacz sekcję "CrowdScan - Twoja Reputacja"
   - Sprawdź punkty i statystyki

## Rozwiązywanie problemów

### Błąd: "relation already exists"
To oznacza, że tabele już istnieją. Możesz:
- Zignorować błąd (skrypt użyje istniejących tabel)
- Lub usunąć stare tabele przed wykonaniem skryptu:
```sql
DROP TABLE IF EXISTS inspections CASCADE;
DROP TABLE IF EXISTS rewards CASCADE;
DROP TABLE IF EXISTS user_reputation CASCADE;
```

### Błąd: Foreign key constraint violation
Upewnij się, że tabele `users` i `parking_lots` już istnieją w bazie danych.

### Backend zwraca błąd 500
Sprawdź logi backendu (`npm run dev` w terminalu) - prawdopodobnie brakuje uprawnień lub połączenia z bazą.

## Funkcje systemu

✅ Użytkownicy mogą zgłaszać zajętość parkingów
✅ Inspektorzy weryfikują zgłoszenia
✅ Automatyczne naliczanie punktów reputacji
✅ System nagród (5 PLN za zatwierdzone zgłoszenie)
✅ Historia zgłoszeń w profilu użytkownika
✅ Trigger automatycznie aktualizujący statystyki

## Wsparcie

Jeśli masz problemy:
1. Sprawdź logi backendu w terminalu
2. Sprawdź logi Supabase w zakładce "Logs"
3. Upewnij się, że wszystkie tabele zostały utworzone
4. Sprawdź czy użytkownik ma odpowiednie uprawnienia
