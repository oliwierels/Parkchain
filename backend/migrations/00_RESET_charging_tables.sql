-- ========================================
-- RESET: Drop ALL charging tables and recreate with BIGINT
-- ========================================
-- Date: 2025-10-28
-- Use this to completely reset charging infrastructure
-- ⚠️  THIS WILL DELETE ALL CHARGING DATA ⚠️

-- Step 1: Drop everything (CASCADE removes dependencies)
DROP TABLE IF EXISTS charging_events CASCADE;
DROP TABLE IF EXISTS points_listings CASCADE;
DROP TABLE IF EXISTS user_points CASCADE;
DROP TABLE IF EXISTS charging_sessions CASCADE;
DROP TABLE IF EXISTS charging_stations CASCADE;

-- Step 2: Recreate with BIGINT for user references

-- CHARGING STATIONS
CREATE TABLE charging_stations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    address TEXT NOT NULL,
    city VARCHAR(100),
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),

    -- Typ ładowarki i złącza
    charger_type VARCHAR(50) NOT NULL,
    connector_types TEXT[] DEFAULT ARRAY['Type2'],
    max_power_kw DECIMAL(8, 2) NOT NULL,

    -- Dostępność
    total_connectors INTEGER NOT NULL DEFAULT 1,
    available_connectors INTEGER NOT NULL DEFAULT 1,

    -- Pricing
    price_per_kwh DECIMAL(8, 4) NOT NULL,
    price_per_minute DECIMAL(8, 4),
    price_per_session DECIMAL(8, 2),

    -- Właściciel i status
    -- ⚠️ BIGINT to match users.id type
    owner_id BIGINT REFERENCES users(id),
    is_active BOOLEAN DEFAULT TRUE,
    is_verified BOOLEAN DEFAULT FALSE,

    -- Timestamps
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- CHARGING SESSIONS
CREATE TABLE charging_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    station_id UUID NOT NULL REFERENCES charging_stations(id),
    -- ⚠️ BIGINT to match users.id type
    user_id BIGINT NOT NULL REFERENCES users(id),

    -- Czas trwania
    start_time TIMESTAMP NOT NULL DEFAULT NOW(),
    end_time TIMESTAMP,

    -- Dane energetyczne
    energy_delivered_kwh DECIMAL(10, 3),
    charging_duration_minutes INTEGER,
    average_power_kw DECIMAL(8, 2),

    -- Koszt i płatność
    total_cost DECIMAL(10, 2),
    payment_method VARCHAR(50) DEFAULT 'fiat',
    payment_status VARCHAR(50) DEFAULT 'pending',
    solana_tx_signature VARCHAR(255),

    -- Punkty i blockchain
    points_earned INTEGER DEFAULT 0,
    on_chain_verified BOOLEAN DEFAULT FALSE,

    -- Status
    status VARCHAR(50) DEFAULT 'active',

    -- Dodatkowe info
    vehicle_info JSONB,

    -- Timestamps
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- USER POINTS
CREATE TABLE user_points (
    -- ⚠️ BIGINT to match users.id type
    user_id BIGINT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    total_points INTEGER DEFAULT 0,
    available_points INTEGER DEFAULT 0,
    locked_points INTEGER DEFAULT 0,
    total_traded INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- POINTS LISTINGS
CREATE TABLE points_listings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    -- ⚠️ BIGINT to match users.id type
    seller_id BIGINT NOT NULL REFERENCES users(id),
    buyer_id BIGINT REFERENCES users(id),

    -- Oferta
    points_amount INTEGER NOT NULL,
    price_per_point DECIMAL(8, 6) NOT NULL,
    total_price DECIMAL(10, 2) NOT NULL,
    discount_percentage INTEGER DEFAULT 50,

    -- Status
    status VARCHAR(50) DEFAULT 'active',

    -- Blockchain
    solana_listing_tx VARCHAR(255),
    solana_sale_tx VARCHAR(255),

    -- Timestamps
    created_at TIMESTAMP DEFAULT NOW(),
    sold_at TIMESTAMP,
    expires_at TIMESTAMP,
    updated_at TIMESTAMP DEFAULT NOW()
);

-- CHARGING EVENTS
CREATE TABLE charging_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID REFERENCES charging_sessions(id),
    event_type VARCHAR(50) NOT NULL,
    event_data JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Step 3: Create indexes
CREATE INDEX idx_charging_stations_location ON charging_stations(latitude, longitude);
CREATE INDEX idx_charging_stations_city ON charging_stations(city);
CREATE INDEX idx_charging_stations_owner ON charging_stations(owner_id);
CREATE INDEX idx_charging_stations_active ON charging_stations(is_active);

CREATE INDEX idx_charging_sessions_station ON charging_sessions(station_id);
CREATE INDEX idx_charging_sessions_user ON charging_sessions(user_id);
CREATE INDEX idx_charging_sessions_status ON charging_sessions(status);
CREATE INDEX idx_charging_sessions_start_time ON charging_sessions(start_time);

CREATE INDEX idx_user_points_available ON user_points(available_points);

CREATE INDEX idx_points_listings_seller ON points_listings(seller_id);
CREATE INDEX idx_points_listings_status ON points_listings(status);
CREATE INDEX idx_points_listings_created ON points_listings(created_at);

CREATE INDEX idx_charging_events_session ON charging_events(session_id);
CREATE INDEX idx_charging_events_type ON charging_events(event_type);
CREATE INDEX idx_charging_events_created ON charging_events(created_at DESC);

-- Step 4: Create triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER charging_stations_updated_at_trigger
    BEFORE UPDATE ON charging_stations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER charging_sessions_updated_at_trigger
    BEFORE UPDATE ON charging_sessions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER user_points_updated_at_trigger
    BEFORE UPDATE ON user_points
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER points_listings_updated_at_trigger
    BEFORE UPDATE ON points_listings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Step 5: Create award points trigger
CREATE OR REPLACE FUNCTION award_points_for_session()
RETURNS TRIGGER AS $$
DECLARE
    v_points INTEGER;
BEGIN
    IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
        v_points := ROUND(NEW.energy_delivered_kwh);
        NEW.points_earned := v_points;

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

CREATE TRIGGER award_points_trigger
    BEFORE UPDATE ON charging_sessions
    FOR EACH ROW
    EXECUTE FUNCTION award_points_for_session();

-- Done!
DO $$
BEGIN
    RAISE NOTICE '✅ RESET completed: All charging tables dropped and recreated';
    RAISE NOTICE '⚠️  ALL previous charging data deleted';
    RAISE NOTICE '✅ All foreign keys now use BIGINT (matching users.id)';
END $$;
