-- ========================================
-- EV Charging Network Schema - DeCharge Hackathon
-- ========================================
-- Rozszerzenie systemu ParkChain o sieć ładowania EV
-- ========================================

-- ========================================
-- 0. FUNKCJE POMOCNICZE (wymagane przez triggery)
-- ========================================

-- Funkcja do automatycznej aktualizacji kolumny updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

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

-- ========================================
-- 2. CHARGING SESSIONS (Sesje ładowania)
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
DROP TRIGGER IF EXISTS charging_sessions_updated_at_trigger ON charging_sessions;
CREATE TRIGGER charging_sessions_updated_at_trigger
    BEFORE UPDATE ON charging_sessions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ========================================
-- 3. USER POINTS (System punktów)
-- ========================================

CREATE TABLE IF NOT EXISTS user_points (
    user_id BIGINT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    total_points INTEGER DEFAULT 0,
    available_points INTEGER DEFAULT 0, -- punkty dostępne do sprzedaży
    locked_points INTEGER DEFAULT 0, -- punkty wystawione na sprzedaż
    total_traded INTEGER DEFAULT 0, -- suma sprzedanych punktów
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Indeks
CREATE INDEX IF NOT EXISTS idx_user_points_available ON user_points(available_points);

-- Trigger dla updated_at
DROP TRIGGER IF EXISTS user_points_updated_at_trigger ON user_points;
CREATE TRIGGER user_points_updated_at_trigger
    BEFORE UPDATE ON user_points
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ========================================
-- 4. POINTS LISTINGS (Marketplace punktów)
-- ========================================

CREATE TABLE IF NOT EXISTS points_listings (
    id BIGSERIAL PRIMARY KEY,
    seller_id BIGINT NOT NULL REFERENCES users(id),
    buyer_id BIGINT REFERENCES users(id),

    -- Oferta
    points_amount INTEGER NOT NULL,
    price_per_point DECIMAL(8, 6) NOT NULL, -- np. 0.10 zł/punkt
    total_price DECIMAL(10, 2) NOT NULL,
    discount_percentage INTEGER DEFAULT 50, -- % zniżki vs. koszt naładowania

    -- Status
    status VARCHAR(50) DEFAULT 'active', -- 'active', 'sold', 'cancelled', 'expired'

    -- Blockchain
    solana_listing_tx VARCHAR(255), -- tx wystawienia oferty
    solana_sale_tx VARCHAR(255), -- tx sprzedaży

    -- Timestamps
    created_at TIMESTAMP DEFAULT NOW(),
    sold_at TIMESTAMP,
    expires_at TIMESTAMP, -- wygaśnięcie oferty

    updated_at TIMESTAMP DEFAULT NOW()
);

-- Indeksy
CREATE INDEX IF NOT EXISTS idx_points_listings_seller ON points_listings(seller_id);
CREATE INDEX IF NOT EXISTS idx_points_listings_status ON points_listings(status);
CREATE INDEX IF NOT EXISTS idx_points_listings_created ON points_listings(created_at);

-- Trigger dla updated_at
DROP TRIGGER IF EXISTS points_listings_updated_at_trigger ON points_listings;
CREATE TRIGGER points_listings_updated_at_trigger
    BEFORE UPDATE ON points_listings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ========================================
-- 5. CHARGING EVENTS (Live Feed)
-- ========================================

CREATE TABLE IF NOT EXISTS charging_events (
    id BIGSERIAL PRIMARY KEY,
    session_id BIGINT REFERENCES charging_sessions(id),
    event_type VARCHAR(50) NOT NULL, -- 'session_started', 'session_completed', 'milestone_reached'
    event_data JSONB, -- dodatkowe dane o evencie
    created_at TIMESTAMP DEFAULT NOW()
);

-- Indeksy
CREATE INDEX IF NOT EXISTS idx_charging_events_session ON charging_events(session_id);
CREATE INDEX IF NOT EXISTS idx_charging_events_type ON charging_events(event_type);
CREATE INDEX IF NOT EXISTS idx_charging_events_created ON charging_events(created_at DESC);

-- ========================================
-- 6. FUNKCJE POMOCNICZE
-- ========================================

-- Funkcja do obliczania kosztu sesji ładowania
CREATE OR REPLACE FUNCTION calculate_session_cost(
    p_station_id BIGINT,
    p_energy_kwh DECIMAL,
    p_duration_minutes INTEGER
)
RETURNS DECIMAL AS $$
DECLARE
    v_price_per_kwh DECIMAL;
    v_price_per_minute DECIMAL;
    v_price_per_session DECIMAL;
    v_total_cost DECIMAL := 0;
BEGIN
    -- Pobierz ceny stacji
    SELECT price_per_kwh, price_per_minute, price_per_session
    INTO v_price_per_kwh, v_price_per_minute, v_price_per_session
    FROM charging_stations
    WHERE id = p_station_id;

    -- Oblicz koszt za energię
    v_total_cost := v_total_cost + (p_energy_kwh * v_price_per_kwh);

    -- Dodaj koszt za czas (jeśli ustawiony)
    IF v_price_per_minute IS NOT NULL THEN
        v_total_cost := v_total_cost + (p_duration_minutes * v_price_per_minute);
    END IF;

    -- Dodaj opłatę startową (jeśli ustawiona)
    IF v_price_per_session IS NOT NULL THEN
        v_total_cost := v_total_cost + v_price_per_session;
    END IF;

    RETURN ROUND(v_total_cost, 2);
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- 7. TRIGGERY DLA AUTOMATYZACJI
-- ========================================

-- Trigger: automatyczne przyznawanie punktów po zakończeniu sesji
CREATE OR REPLACE FUNCTION award_points_for_session()
RETURNS TRIGGER AS $$
DECLARE
    v_points INTEGER;
BEGIN
    -- Tylko gdy sesja jest kompletowana
    IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
        -- 1 kWh = 1 punkt (zaokrąglone)
        v_points := ROUND(NEW.energy_delivered_kwh);

        -- Zaktualizuj points_earned w sesji
        NEW.points_earned := v_points;

        -- Dodaj punkty do user_points
        INSERT INTO user_points (user_id, total_points, available_points)
        VALUES (NEW.user_id, v_points, v_points)
        ON CONFLICT (user_id)
        DO UPDATE SET
            total_points = user_points.total_points + v_points,
            available_points = user_points.available_points + v_points,
            updated_at = NOW();
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS award_points_trigger ON charging_sessions;
CREATE TRIGGER award_points_trigger
    BEFORE UPDATE ON charging_sessions
    FOR EACH ROW
    EXECUTE FUNCTION award_points_for_session();

-- ========================================
-- 8. WIDOKI (VIEWS)
-- ========================================

-- Widok: Live Feed aktywnych sesji ładowania
CREATE OR REPLACE VIEW live_charging_feed AS
SELECT
    cs.id as session_id,
    cs.start_time,
    cs.energy_delivered_kwh,
    cs.charging_duration_minutes,
    cs.points_earned,
    cs.status,
    st.name as station_name,
    st.city,
    st.charger_type,
    st.max_power_kw,
    u.full_name as user_name,
    u.id as user_id
FROM charging_sessions cs
JOIN charging_stations st ON cs.station_id = st.id
JOIN users u ON cs.user_id = u.id
WHERE cs.status IN ('active', 'completed')
ORDER BY cs.start_time DESC
LIMIT 50;

-- Widok: Aktywne stacje z statystykami
CREATE OR REPLACE VIEW active_stations_view AS
SELECT
    cs.*,
    COUNT(sess.id) as total_sessions,
    SUM(sess.energy_delivered_kwh) as total_energy_delivered,
    AVG(sess.energy_delivered_kwh) as avg_energy_per_session
FROM charging_stations cs
LEFT JOIN charging_sessions sess ON cs.id = sess.station_id AND sess.status = 'completed'
WHERE cs.is_active = TRUE
GROUP BY cs.id;

-- ========================================
-- 9. SEED DATA (Przykładowe dane testowe)
-- ========================================

-- Przykładowe stacje ładowania (opcjonalne - tylko dla testów)
-- Odkomentuj jeśli chcesz dodać testowe dane

/*
-- Znajdź pierwszego użytkownika do przypisania jako właściciel
DO $$
DECLARE
    v_owner_id UUID;
BEGIN
    SELECT id INTO v_owner_id FROM users LIMIT 1;

    -- Dodaj przykładowe stacje
    INSERT INTO charging_stations (
        name, address, city, latitude, longitude,
        charger_type, connector_types, max_power_kw,
        total_connectors, available_connectors,
        price_per_kwh, owner_id
    ) VALUES
    (
        'DeCharge Downtown Warsaw',
        'ul. Marszałkowska 1',
        'Warszawa',
        52.2297,
        21.0122,
        'DC_FAST',
        ARRAY['CCS', 'CHAdeMO'],
        150,
        4,
        4,
        0.35,
        v_owner_id
    ),
    (
        'DeCharge Lublin Center',
        'al. Racławickie 14',
        'Lublin',
        51.2465,
        22.5684,
        'DC_FAST',
        ARRAY['CCS', 'Type2'],
        100,
        2,
        2,
        0.32,
        v_owner_id
    ),
    (
        'DeCharge Poznań Plaza',
        'ul. Święty Marcin 1',
        'Poznań',
        52.4082,
        16.9335,
        'ULTRA_FAST',
        ARRAY['CCS', 'CHAdeMO', 'Type2'],
        350,
        6,
        6,
        0.45,
        v_owner_id
    );
END $$;
*/

-- ========================================
-- 10. PODSUMOWANIE
-- ========================================

DO $$
BEGIN
    RAISE NOTICE '✅ EV Charging Network schema created successfully!';
    RAISE NOTICE '';
    RAISE NOTICE 'Created tables:';
    RAISE NOTICE '  - charging_stations';
    RAISE NOTICE '  - charging_sessions';
    RAISE NOTICE '  - user_points';
    RAISE NOTICE '  - points_listings';
    RAISE NOTICE '  - charging_events';
    RAISE NOTICE '';
    RAISE NOTICE 'Created functions:';
    RAISE NOTICE '  - calculate_session_cost()';
    RAISE NOTICE '  - award_points_for_session()';
    RAISE NOTICE '';
    RAISE NOTICE 'Created views:';
    RAISE NOTICE '  - live_charging_feed';
    RAISE NOTICE '  - active_stations_view';
    RAISE NOTICE '';
    RAISE NOTICE 'Next steps:';
    RAISE NOTICE '  1. Test the API endpoints';
    RAISE NOTICE '  2. Start building the frontend';
    RAISE NOTICE '  3. Optional: Uncomment seed data section to add test stations';
END $$;
