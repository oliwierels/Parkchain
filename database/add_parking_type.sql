-- Add parking type column and set all existing to covered
-- Run this in Supabase SQL Editor

-- 1. Add type column if it doesn't exist
ALTER TABLE parking_lots
ADD COLUMN IF NOT EXISTS type VARCHAR(50) DEFAULT 'covered';

-- 2. Set all existing parkings to covered
UPDATE parking_lots
SET type = 'covered'
WHERE type IS NULL OR type = '';

-- 3. Add comment
COMMENT ON COLUMN parking_lots.type IS 'Parking type: covered, outdoor, ev_charging';

-- 4. Verify
SELECT id, name, type FROM parking_lots LIMIT 10;
