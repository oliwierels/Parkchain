# Instrukcja uruchomienia bazy danych dla systemu ładowania EV

## Krok 1: Zaloguj się do Supabase

1. Otwórz przeglądarkę i przejdź do https://supabase.com
2. Zaloguj się do swojego projektu ParkChain

## Krok 2: Otwórz SQL Editor

1. W menu po lewej stronie kliknij **SQL Editor**
2. Kliknij **New Query** (Nowe zapytanie)

## Krok 3: Skopiuj i wykonaj SQL

1. Otwórz plik: `database/ev_charging_network.sql`
2. Skopiuj **całą zawartość** pliku (Ctrl+A, Ctrl+C)
3. Wklej do SQL Editor w Supabase (Ctrl+V)
4. Kliknij przycisk **RUN** (lub Ctrl+Enter)

## Krok 4: Sprawdź czy tabele zostały utworzone

Po wykonaniu SQL powinieneś zobaczyć komunikat:
```
✅ EV Charging Network schema created successfully!
```

Następnie sprawdź utworzone tabele:
1. Przejdź do **Table Editor** w menu po lewej
2. Powinieneś zobaczyć nowe tabele:
   - `charging_stations`
   - `charging_sessions`
   - `user_points`
   - `points_listings`
   - `charging_events`

## Krok 5: Zweryfikuj triggery i funkcje

1. W SQL Editor wykonaj to zapytanie:
```sql
SELECT routine_name
FROM information_schema.routines
WHERE routine_type = 'FUNCTION'
AND routine_name LIKE '%charging%' OR routine_name LIKE '%points%';
```

Powinieneś zobaczyć:
- `calculate_session_cost`
- `award_points_for_session`

## Gotowe!

Baza danych jest gotowa. Teraz możesz:
1. Uruchomić backend: `npm run dev` (w folderze backend)
2. Przetestować endpointy API
3. Rozpocząć prace nad frontendem

## Następne kroki:

### Testowanie API:

Możesz przetestować nowe endpointy używając Postmana lub curl:

```bash
# Pobierz stacje ładowania
curl http://localhost:3000/api/charging-stations

# Pobierz live feed
curl http://localhost:3000/api/live-feed

# Pobierz marketplace (oferty punktów)
curl http://localhost:3000/api/points/marketplace
```

### Dodawanie testowych danych:

W SQL Editor możesz dodać przykładową stację ładowania:

```sql
-- Najpierw znajdź swoje user_id
SELECT id, email FROM users LIMIT 1;

-- Następnie wstaw stację (zamień USER_ID na swoje id)
INSERT INTO charging_stations (
  name, address, city, latitude, longitude,
  charger_type, connector_types, max_power_kw,
  total_connectors, price_per_kwh, owner_id
) VALUES (
  'DeCharge Downtown Warsaw',
  'ul. Marszałkowska 1',
  'Warszawa',
  52.2297,
  21.0122,
  'DC_FAST',
  ARRAY['CCS', 'CHAdeMO'],
  150,
  4,
  0.35,
  USER_ID  -- ZAMIEŃ NA SWOJE ID
);
```

## Rozwiązywanie problemów:

### Błąd: "relation already exists"
- To normalne jeśli uruchamiasz SQL po raz drugi
- Skrypt używa `CREATE TABLE IF NOT EXISTS`, więc można go bezpiecznie uruchomić wielokrotnie

### Błąd: "foreign key violation"
- Upewnij się, że tabela `users` istnieje
- Sprawdź czy typ `users.id` to INTEGER lub BIGINT

### Błąd: "function does not exist"
- Upewnij się, że cały skrypt SQL został wykonany
- Spróbuj uruchomić część z funkcjami osobno

## Potrzebujesz pomocy?

Jeśli coś nie działa:
1. Skopiuj treść błędu z Supabase
2. Sprawdź logi w konsoli przeglądarki
3. Sprawdź czy backend się uruchamia bez błędów
