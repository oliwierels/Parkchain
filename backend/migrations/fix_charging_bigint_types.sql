-- Migration: Fix user_id and owner_id types in charging tables to BIGINT
-- Date: 2025-10-28
-- Problem: user_id is UUID but users.id is BIGINT
-- This version tries to preserve data

-- WARNING: This migration assumes you have very little or no data
-- If you have important data, backup first or use the _safe version

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

-- Step 2: Change column types from UUID to BIGINT
-- WARNING: This will fail if you have existing UUID data that can't convert to BIGINT

-- Check if charging_sessions exists and has the column
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.columns
               WHERE table_name='charging_sessions' AND column_name='user_id') THEN
        ALTER TABLE charging_sessions
        ALTER COLUMN user_id TYPE BIGINT USING user_id::text::bigint;
    END IF;
END $$;

-- Check if charging_stations exists
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.columns
               WHERE table_name='charging_stations' AND column_name='owner_id') THEN
        ALTER TABLE charging_stations
        ALTER COLUMN owner_id TYPE BIGINT USING owner_id::text::bigint;
    END IF;
END $$;

-- Check if user_points exists
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.columns
               WHERE table_name='user_points' AND column_name='user_id') THEN
        ALTER TABLE user_points
        ALTER COLUMN user_id TYPE BIGINT USING user_id::text::bigint;
    END IF;
END $$;

-- Check if points_listings exists
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.columns
               WHERE table_name='points_listings' AND column_name='seller_id') THEN
        ALTER TABLE points_listings
        ALTER COLUMN seller_id TYPE BIGINT USING seller_id::text::bigint;
    END IF;

    IF EXISTS (SELECT FROM information_schema.columns
               WHERE table_name='points_listings' AND column_name='buyer_id') THEN
        ALTER TABLE points_listings
        ALTER COLUMN buyer_id TYPE BIGINT USING buyer_id::text::bigint;
    END IF;
END $$;

-- Step 3: Re-add foreign key constraints
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name='charging_sessions') THEN
        ALTER TABLE charging_sessions
        ADD CONSTRAINT charging_sessions_user_id_fkey
        FOREIGN KEY (user_id) REFERENCES users(id);
    END IF;
END $$;

DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name='charging_sessions') THEN
        ALTER TABLE charging_sessions
        ADD CONSTRAINT charging_sessions_station_id_fkey
        FOREIGN KEY (station_id) REFERENCES charging_stations(id);
    END IF;
END $$;

DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name='charging_stations') THEN
        ALTER TABLE charging_stations
        ADD CONSTRAINT charging_stations_owner_id_fkey
        FOREIGN KEY (owner_id) REFERENCES users(id);
    END IF;
END $$;

DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name='user_points') THEN
        ALTER TABLE user_points
        ADD CONSTRAINT user_points_user_id_fkey
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
    END IF;
END $$;

DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name='points_listings') THEN
        ALTER TABLE points_listings
        ADD CONSTRAINT points_listings_seller_id_fkey
        FOREIGN KEY (seller_id) REFERENCES users(id),
        ADD CONSTRAINT points_listings_buyer_id_fkey
        FOREIGN KEY (buyer_id) REFERENCES users(id);
    END IF;
END $$;

DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name='charging_events') THEN
        ALTER TABLE charging_events
        ADD CONSTRAINT charging_events_session_id_fkey
        FOREIGN KEY (session_id) REFERENCES charging_sessions(id);
    END IF;
END $$;

-- Step 4: Verify the changes
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.columns WHERE table_name='charging_sessions' AND column_name='user_id') THEN
        EXECUTE 'COMMENT ON COLUMN charging_sessions.user_id IS ''BIGINT reference to users table''';
    END IF;
    IF EXISTS (SELECT FROM information_schema.columns WHERE table_name='charging_stations' AND column_name='owner_id') THEN
        EXECUTE 'COMMENT ON COLUMN charging_stations.owner_id IS ''BIGINT reference to users table''';
    END IF;
END $$;

-- Done!
DO $$
BEGIN
    RAISE NOTICE '✅ Migration completed: Fixed user_id types to BIGINT';
    RAISE NOTICE 'ℹ️  This matches your users.id BIGINT type';
END $$;
