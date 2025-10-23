# Instrukcja: Utworzenie tabeli charging_sessions w Supabase

## Problem
Brak tabeli `charging_sessions` - potrzebna do funkcjonalności sesji ładowania.

## Rozwiązanie
Musisz utworzyć tabelę `charging_sessions` w swojej bazie danych Supabase.

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
-- CHARGING SESSIONS (Sesje ładowania)
-- ========================================

CREATE TABLE IF NOT EXISTS charging_sessions (
    id BIGSERIAL PRIMARY KEY,
    station_id BIGINT NOT NULL REFERENCES charging_stations(id),
    user_id BIGINT NOT NULL REFERENCES users(id),

    -- Czas trwania
    start_time TIMESTAMP NOT NULL DEFAULT NOW(),
    end_time TIMESTAMP,

    -- Dane energetyczne
    energy_delivered_kwh DECIMAL(8, 3), -- np. 42.567 kWh
    charging_duration_minutes INTEGER, -- np. 45 minut
    average_power_kw DECIMAL(6, 2), -- średnia moc ładowania

    -- Koszt i płatność
    total_cost DECIMAL(10, 2), -- całkowity koszt w PLN
    payment_method VARCHAR(50) DEFAULT 'fiat', -- 'fiat', 'crypto', 'points'
    payment_status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'completed', 'failed'
    solana_tx_signature VARCHAR(255), -- podpis transakcji Solana

    -- Punkty i blockchain
    points_earned INTEGER DEFAULT 0, -- 1 kWh = 1 punkt
    on_chain_verified BOOLEAN DEFAULT FALSE,

    -- Status
    status VARCHAR(50) DEFAULT 'active', -- 'active', 'completed', 'cancelled'

    -- Dodatkowe info
    vehicle_info JSONB, -- opcjonalne info o pojeździe

    -- Timestamps
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Indeksy
CREATE INDEX IF NOT EXISTS idx_charging_sessions_station ON charging_sessions(station_id);
CREATE INDEX IF NOT EXISTS idx_charging_sessions_user ON charging_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_charging_sessions_status ON charging_sessions(status);
CREATE INDEX IF NOT EXISTS idx_charging_sessions_start_time ON charging_sessions(start_time);

-- Trigger dla updated_at
CREATE OR REPLACE FUNCTION update_charging_sessions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS charging_sessions_updated_at_trigger ON charging_sessions;
CREATE TRIGGER charging_sessions_updated_at_trigger
    BEFORE UPDATE ON charging_sessions
    FOR EACH ROW
    EXECUTE FUNCTION update_charging_sessions_updated_at();
```

### 4. Uruchom query
- Kliknij przycisk **Run** (lub naciśnij Ctrl+Enter)
- Poczekaj na komunikat **Success**

### 5. Sprawdź czy tabela została utworzona
W SQL Editor uruchom:
```sql
SELECT * FROM charging_sessions LIMIT 1;
```

Powinieneś zobaczyć pustą tabelę (bez błędów).

### 6. Zrestartuj backend
```bash
cd backend
npm start
```

## Weryfikacja

Po uruchomieniu backendu spróbuj rozpocząć sesję ładowania przez aplikację.
Nie powinno być błędów.

## Gotowe!

Teraz możesz:
- Rozpoczynać sesje ładowania z mapy
- Zobacz sesje w "Moje Ładowarki"
- Zakończyć sesje z obliczonym kosztem
