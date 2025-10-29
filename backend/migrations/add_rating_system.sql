-- Migration: Add rating system for parking lots and charging stations
-- Date: 2025-10-28

-- Ratings for parking lots
-- ⚠️ lot_id is INTEGER to match parking_lots.id
CREATE TABLE IF NOT EXISTS parking_ratings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lot_id INTEGER NOT NULL REFERENCES parking_lots(id) ON DELETE CASCADE,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),

    -- One rating per user per parking lot
    UNIQUE(lot_id, user_id)
);

-- Ratings for charging stations
-- ⚠️ station_id is UUID to match charging_stations.id
CREATE TABLE IF NOT EXISTS charging_ratings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    station_id UUID NOT NULL REFERENCES charging_stations(id) ON DELETE CASCADE,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),

    -- One rating per user per charging station
    UNIQUE(station_id, user_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_parking_ratings_lot ON parking_ratings(lot_id);
CREATE INDEX IF NOT EXISTS idx_parking_ratings_user ON parking_ratings(user_id);
CREATE INDEX IF NOT EXISTS idx_parking_ratings_rating ON parking_ratings(rating);
CREATE INDEX IF NOT EXISTS idx_parking_ratings_created ON parking_ratings(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_charging_ratings_station ON charging_ratings(station_id);
CREATE INDEX IF NOT EXISTS idx_charging_ratings_user ON charging_ratings(user_id);
CREATE INDEX IF NOT EXISTS idx_charging_ratings_rating ON charging_ratings(rating);
CREATE INDEX IF NOT EXISTS idx_charging_ratings_created ON charging_ratings(created_at DESC);

-- Triggers for updated_at
CREATE TRIGGER parking_ratings_updated_at_trigger
    BEFORE UPDATE ON parking_ratings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER charging_ratings_updated_at_trigger
    BEFORE UPDATE ON charging_ratings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Function to calculate average rating for parking lot
-- ⚠️ lot_id parameter is INTEGER
CREATE OR REPLACE FUNCTION get_parking_avg_rating(p_lot_id INTEGER)
RETURNS TABLE (
    avg_rating NUMERIC,
    total_ratings INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        ROUND(AVG(rating)::numeric, 1) as avg_rating,
        COUNT(*)::integer as total_ratings
    FROM parking_ratings
    WHERE lot_id = p_lot_id;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate average rating for charging station
-- ⚠️ station_id parameter is UUID
CREATE OR REPLACE FUNCTION get_charging_avg_rating(p_station_id UUID)
RETURNS TABLE (
    avg_rating NUMERIC,
    total_ratings INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        ROUND(AVG(rating)::numeric, 1) as avg_rating,
        COUNT(*)::integer as total_ratings
    FROM charging_ratings
    WHERE station_id = p_station_id;
END;
$$ LANGUAGE plpgsql;

-- Done!
DO $$
BEGIN
    RAISE NOTICE '✅ Rating system migration completed';
    RAISE NOTICE '📊 Created tables: parking_ratings, charging_ratings';
    RAISE NOTICE '⭐ Users can now rate parking lots and charging stations (1-5 stars)';
    RAISE NOTICE 'ℹ️  parking_ratings.lot_id: INTEGER (matches parking_lots.id)';
    RAISE NOTICE 'ℹ️  charging_ratings.station_id: UUID (matches charging_stations.id)';
END $$;
