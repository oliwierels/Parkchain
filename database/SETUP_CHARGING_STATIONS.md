# Instrukcja: Utworzenie tabeli charging_stations w Supabase

## Problem
Błąd: `Could not find the table 'public.ev_chargers' in the schema cache`

## Rozwiązanie
Musisz utworzyć tabelę `charging_stations` w swojej bazie danych Supabase.

## Kroki instalacji

### 1. Przejdź do Supabase Dashboard
- Otwórz https://supabase.com
- Zaloguj się i otwórz projekt Parkchain
- URL projektu: https://rauhggtfprbbnrbfdpqg.supabase.co

### 2. Otwórz SQL Editor
- W lewym menu kliknij **SQL Editor**
- Kliknij **New query**

### 3. Uruchom SQL
Skopiuj i wklej następujący kod SQL:

```sql
-- ========================================
-- 1. CHARGING STATIONS (Stacje ładowania)
-- ========================================

CREATE TABLE IF NOT EXISTS charging_stations (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    address TEXT NOT NULL,
    city VARCHAR(100),
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),

    -- Typ ładowarki i złącza
    charger_type VARCHAR(50) NOT NULL, -- 'AC', 'DC_FAST', 'ULTRA_FAST'
    connector_types TEXT[] DEFAULT ARRAY['Type2'], -- ['Type2', 'CCS', 'CHAdeMO', 'Tesla']
    max_power_kw DECIMAL(6, 2) NOT NULL, -- np. 150.00 kW

    -- Dostępność
    total_connectors INTEGER NOT NULL DEFAULT 1,
    available_connectors INTEGER NOT NULL DEFAULT 1,

    -- Pricing
    price_per_kwh DECIMAL(6, 4) NOT NULL, -- np. 0.35 zł/kWh
    price_per_minute DECIMAL(6, 4), -- opcjonalnie: opłata za czas
    price_per_session DECIMAL(6, 2), -- opcjonalnie: opłata startowa

    -- Właściciel i status
    owner_id BIGINT REFERENCES users(id),
    is_active BOOLEAN DEFAULT TRUE,
    is_verified BOOLEAN DEFAULT FALSE, -- weryfikacja przez DeCharge

    -- Timestamps
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Indeksy dla wydajności
CREATE INDEX IF NOT EXISTS idx_charging_stations_location ON charging_stations(latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_charging_stations_city ON charging_stations(city);
CREATE INDEX IF NOT EXISTS idx_charging_stations_owner ON charging_stations(owner_id);
CREATE INDEX IF NOT EXISTS idx_charging_stations_active ON charging_stations(is_active);

-- Trigger dla updated_at
CREATE OR REPLACE FUNCTION update_charging_stations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS charging_stations_updated_at_trigger ON charging_stations;
CREATE TRIGGER charging_stations_updated_at_trigger
    BEFORE UPDATE ON charging_stations
    FOR EACH ROW
    EXECUTE FUNCTION update_charging_stations_updated_at();
```

### 4. Uruchom query
- Kliknij przycisk **Run** (lub naciśnij Ctrl+Enter)
- Poczekaj na komunikat **Success**

### 5. Sprawdź czy tabela została utworzona
W SQL Editor uruchom:
```sql
SELECT * FROM charging_stations LIMIT 1;
```

Powinieneś zobaczyć pustą tabelę (bez błędów).

### 6. Zrestartuj backend
```bash
cd backend
npm start
```

## Weryfikacja

Po uruchomieniu backendu sprawdź endpoint health:
```bash
curl http://localhost:3000/health
```

Powinieneś zobaczyć:
```json
{
  "status": "ok",
  "database": {
    "charging_stations_table": "EXISTS"
  }
}
```

## Gotowe!

Teraz możesz dodawać ładowarki elektryczne przez aplikację bez błędów.
