-- Reviews and Ratings System for Parkchain
-- Supports reviews for parking lots and EV chargers

-- Create reviews table
CREATE TABLE IF NOT EXISTS reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    target_type VARCHAR(50) NOT NULL CHECK (target_type IN ('parking_lot', 'ev_charger')),
    target_id UUID NOT NULL,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    title VARCHAR(200),
    comment TEXT,
    helpful_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_user_target UNIQUE (user_id, target_type, target_id)
);

-- Create review_responses table (for operators to respond)
CREATE TABLE IF NOT EXISTS review_responses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    review_id UUID NOT NULL REFERENCES reviews(id) ON DELETE CASCADE,
    operator_id UUID NOT NULL,
    response_text TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create review_helpful table (track who found reviews helpful)
CREATE TABLE IF NOT EXISTS review_helpful (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    review_id UUID NOT NULL REFERENCES reviews(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_user_review UNIQUE (review_id, user_id)
);

-- Create review_photos table (optional photos with reviews)
CREATE TABLE IF NOT EXISTS review_photos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    review_id UUID NOT NULL REFERENCES reviews(id) ON DELETE CASCADE,
    photo_url TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_reviews_target ON reviews(target_type, target_id);
CREATE INDEX IF NOT EXISTS idx_reviews_user ON reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_reviews_rating ON reviews(rating);
CREATE INDEX IF NOT EXISTS idx_reviews_created ON reviews(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_review_responses_review ON review_responses(review_id);
CREATE INDEX IF NOT EXISTS idx_review_helpful_review ON review_helpful(review_id);

-- Function to update review helpful count
CREATE OR REPLACE FUNCTION update_review_helpful_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE reviews
        SET helpful_count = helpful_count + 1
        WHERE id = NEW.review_id;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE reviews
        SET helpful_count = helpful_count - 1
        WHERE id = OLD.review_id;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for helpful count
DROP TRIGGER IF EXISTS trigger_update_helpful_count ON review_helpful;
CREATE TRIGGER trigger_update_helpful_count
    AFTER INSERT OR DELETE ON review_helpful
    FOR EACH ROW
    EXECUTE FUNCTION update_review_helpful_count();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
DROP TRIGGER IF EXISTS trigger_reviews_updated_at ON reviews;
CREATE TRIGGER trigger_reviews_updated_at
    BEFORE UPDATE ON reviews
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_review_responses_updated_at ON review_responses;
CREATE TRIGGER trigger_review_responses_updated_at
    BEFORE UPDATE ON review_responses
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create view for review statistics per target
CREATE OR REPLACE VIEW review_statistics AS
SELECT
    target_type,
    target_id,
    COUNT(*) as total_reviews,
    ROUND(AVG(rating)::numeric, 2) as average_rating,
    COUNT(CASE WHEN rating = 5 THEN 1 END) as five_star_count,
    COUNT(CASE WHEN rating = 4 THEN 1 END) as four_star_count,
    COUNT(CASE WHEN rating = 3 THEN 1 END) as three_star_count,
    COUNT(CASE WHEN rating = 2 THEN 1 END) as two_star_count,
    COUNT(CASE WHEN rating = 1 THEN 1 END) as one_star_count
FROM reviews
GROUP BY target_type, target_id;

-- Add rating statistics columns to parking_lots table
ALTER TABLE parking_lots
ADD COLUMN IF NOT EXISTS average_rating DECIMAL(3,2) DEFAULT 0.0,
ADD COLUMN IF NOT EXISTS total_reviews INTEGER DEFAULT 0;

-- Add rating statistics columns to charging_stations table
ALTER TABLE charging_stations
ADD COLUMN IF NOT EXISTS average_rating DECIMAL(3,2) DEFAULT 0.0,
ADD COLUMN IF NOT EXISTS total_reviews INTEGER DEFAULT 0;

-- Function to update target rating statistics
CREATE OR REPLACE FUNCTION update_target_rating_stats()
RETURNS TRIGGER AS $$
DECLARE
    target_table TEXT;
    avg_rating DECIMAL(3,2);
    review_count INTEGER;
BEGIN
    -- Determine which table to update
    IF TG_OP = 'DELETE' THEN
        target_table := OLD.target_type;

        IF target_table = 'parking_lot' THEN
            target_table := 'parking_lots';
        ELSIF target_table = 'ev_charger' THEN
            target_table := 'charging_stations';
        END IF;

        -- Calculate new statistics
        SELECT COALESCE(ROUND(AVG(rating)::numeric, 2), 0.0), COUNT(*)
        INTO avg_rating, review_count
        FROM reviews
        WHERE target_type = OLD.target_type AND target_id = OLD.target_id;

        -- Update the target table
        EXECUTE format('UPDATE %I SET average_rating = $1, total_reviews = $2 WHERE id = $3', target_table)
        USING avg_rating, review_count, OLD.target_id;

    ELSE -- INSERT or UPDATE
        target_table := NEW.target_type;

        IF target_table = 'parking_lot' THEN
            target_table := 'parking_lots';
        ELSIF target_table = 'ev_charger' THEN
            target_table := 'charging_stations';
        END IF;

        -- Calculate new statistics
        SELECT COALESCE(ROUND(AVG(rating)::numeric, 2), 0.0), COUNT(*)
        INTO avg_rating, review_count
        FROM reviews
        WHERE target_type = NEW.target_type AND target_id = NEW.target_id;

        -- Update the target table
        EXECUTE format('UPDATE %I SET average_rating = $1, total_reviews = $2 WHERE id = $3', target_table)
        USING avg_rating, review_count, NEW.target_id;
    END IF;

    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update rating stats
DROP TRIGGER IF EXISTS trigger_update_rating_stats ON reviews;
CREATE TRIGGER trigger_update_rating_stats
    AFTER INSERT OR UPDATE OR DELETE ON reviews
    FOR EACH ROW
    EXECUTE FUNCTION update_target_rating_stats();

-- Sample queries for testing
COMMENT ON TABLE reviews IS 'User reviews for parking lots and EV chargers';
COMMENT ON TABLE review_responses IS 'Operator responses to reviews';
COMMENT ON TABLE review_helpful IS 'Track which users found reviews helpful';
COMMENT ON TABLE review_photos IS 'Optional photos attached to reviews';
