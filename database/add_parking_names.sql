-- Add parking lot name, city, and address columns to parking_assets table
-- Run this in Supabase SQL Editor

ALTER TABLE parking_assets
ADD COLUMN IF NOT EXISTS parking_lot_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS city VARCHAR(100),
ADD COLUMN IF NOT EXISTS address TEXT;

-- Success message
DO $$
BEGIN
    RAISE NOTICE '✅ Added parking_lot_name, city, and address columns to parking_assets table';
END $$;
