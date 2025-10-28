-- Migration: Fix user_id and owner_id types in charging tables
-- Date: 2025-10-28
-- Problem: user_id is BIGINT but users.id is UUID

-- First, check if we have any existing data to migrate
-- If you have data, you'll need to handle it carefully

-- Step 1: Drop foreign key constraints
ALTER TABLE charging_sessions
DROP CONSTRAINT IF EXISTS charging_sessions_user_id_fkey;

ALTER TABLE charging_stations
DROP CONSTRAINT IF EXISTS charging_stations_owner_id_fkey;

ALTER TABLE user_points
DROP CONSTRAINT IF EXISTS user_points_user_id_fkey;

ALTER TABLE points_listings
DROP CONSTRAINT IF EXISTS points_listings_seller_id_fkey,
DROP CONSTRAINT IF EXISTS points_listings_buyer_id_fkey;

-- Step 2: Change column types from BIGINT to UUID
-- WARNING: This will fail if you have existing data that's not UUID compatible
-- If you have data, backup first or clear the tables

ALTER TABLE charging_sessions
ALTER COLUMN user_id TYPE UUID USING user_id::text::uuid;

ALTER TABLE charging_stations
ALTER COLUMN id TYPE UUID USING id::text::uuid,
ALTER COLUMN owner_id TYPE UUID USING owner_id::text::uuid;

ALTER TABLE user_points
ALTER COLUMN user_id TYPE UUID USING user_id::text::uuid;

ALTER TABLE points_listings
ALTER COLUMN seller_id TYPE UUID USING seller_id::text::uuid,
ALTER COLUMN buyer_id TYPE UUID USING buyer_id::text::uuid;

ALTER TABLE charging_sessions
ALTER COLUMN station_id TYPE UUID USING station_id::text::uuid;

ALTER TABLE charging_events
ALTER COLUMN session_id TYPE UUID USING session_id::text::uuid;

-- Step 3: Re-add foreign key constraints
ALTER TABLE charging_sessions
ADD CONSTRAINT charging_sessions_user_id_fkey
FOREIGN KEY (user_id) REFERENCES users(id);

ALTER TABLE charging_sessions
ADD CONSTRAINT charging_sessions_station_id_fkey
FOREIGN KEY (station_id) REFERENCES charging_stations(id);

ALTER TABLE charging_stations
ADD CONSTRAINT charging_stations_owner_id_fkey
FOREIGN KEY (owner_id) REFERENCES users(id);

ALTER TABLE user_points
ADD CONSTRAINT user_points_user_id_fkey
FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE points_listings
ADD CONSTRAINT points_listings_seller_id_fkey
FOREIGN KEY (seller_id) REFERENCES users(id),
ADD CONSTRAINT points_listings_buyer_id_fkey
FOREIGN KEY (buyer_id) REFERENCES users(id);

ALTER TABLE charging_events
ADD CONSTRAINT charging_events_session_id_fkey
FOREIGN KEY (session_id) REFERENCES charging_sessions(id);

-- Step 4: Verify the changes
COMMENT ON COLUMN charging_sessions.user_id IS 'UUID reference to users table';
COMMENT ON COLUMN charging_stations.owner_id IS 'UUID reference to users table';

-- Done!
DO $$
BEGIN
    RAISE NOTICE '✅ Migration completed: Fixed user_id types to UUID';
END $$;
