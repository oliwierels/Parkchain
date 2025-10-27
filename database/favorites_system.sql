-- Favorites/Bookmarks System for Parkchain
-- Users can save their favorite parking lots and EV chargers

-- Create favorites table
CREATE TABLE IF NOT EXISTS favorites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    target_type VARCHAR(50) NOT NULL CHECK (target_type IN ('parking_lot', 'ev_charger')),
    target_id UUID NOT NULL,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_user_favorite UNIQUE (user_id, target_type, target_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_favorites_user ON favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_favorites_target ON favorites(target_type, target_id);
CREATE INDEX IF NOT EXISTS idx_favorites_created ON favorites(created_at DESC);

-- Add favorite_count to parking_lots
ALTER TABLE parking_lots
ADD COLUMN IF NOT EXISTS favorite_count INTEGER DEFAULT 0;

-- Add favorite_count to ev_chargers
ALTER TABLE ev_chargers
ADD COLUMN IF NOT EXISTS favorite_count INTEGER DEFAULT 0;

-- Function to update favorite count
CREATE OR REPLACE FUNCTION update_favorite_count()
RETURNS TRIGGER AS $$
DECLARE
    target_table TEXT;
BEGIN
    IF TG_OP = 'DELETE' THEN
        target_table := OLD.target_type;

        IF target_table = 'parking_lot' THEN
            target_table := 'parking_lots';
        ELSIF target_table = 'ev_charger' THEN
            target_table := 'ev_chargers';
        END IF;

        EXECUTE format('UPDATE %I SET favorite_count = favorite_count - 1 WHERE id = $1', target_table)
        USING OLD.target_id;

        RETURN OLD;
    ELSE -- INSERT
        target_table := NEW.target_type;

        IF target_table = 'parking_lot' THEN
            target_table := 'parking_lots';
        ELSIF target_table = 'ev_charger' THEN
            target_table := 'ev_chargers';
        END IF;

        EXECUTE format('UPDATE %I SET favorite_count = favorite_count + 1 WHERE id = $1', target_table)
        USING NEW.target_id;

        RETURN NEW;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update favorite count
DROP TRIGGER IF EXISTS trigger_update_favorite_count ON favorites;
CREATE TRIGGER trigger_update_favorite_count
    AFTER INSERT OR DELETE ON favorites
    FOR EACH ROW
    EXECUTE FUNCTION update_favorite_count();

COMMENT ON TABLE favorites IS 'User favorite parking lots and EV chargers';
COMMENT ON COLUMN favorites.notes IS 'Optional user notes about this favorite location';
