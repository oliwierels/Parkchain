-- Simple Parking Marketplace Tables
-- Run this in Supabase SQL Editor

-- Drop existing tables if they exist
DROP TABLE IF EXISTS parking_asset_transactions CASCADE;
DROP TABLE IF EXISTS parking_marketplace_listings CASCADE;
DROP TABLE IF EXISTS parking_assets CASCADE;
DROP TABLE IF EXISTS institutional_operators CASCADE;

-- Parking Assets Table
CREATE TABLE parking_assets (
    id BIGSERIAL PRIMARY KEY,
    asset_token_address VARCHAR(255) UNIQUE NOT NULL,
    asset_type VARCHAR(50) NOT NULL CHECK (asset_type IN ('single_spot', 'revenue_share', 'parking_lot_bundle')),
    spot_number VARCHAR(100),
    total_supply BIGINT NOT NULL DEFAULT 0,
    circulating_supply BIGINT NOT NULL DEFAULT 0,
    estimated_value_usdc DECIMAL(18,2) DEFAULT 0,
    annual_revenue_usdc DECIMAL(18,2) DEFAULT 0,
    revenue_share_percentage DECIMAL(5,2) DEFAULT 0,
    institutional_operator_id BIGINT REFERENCES users(id),
    compliance_status VARCHAR(50) DEFAULT 'pending',
    is_active BOOLEAN DEFAULT true,
    is_tradeable BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Marketplace Listings Table
CREATE TABLE parking_marketplace_listings (
    id BIGSERIAL PRIMARY KEY,
    asset_id BIGINT REFERENCES parking_assets(id) ON DELETE CASCADE,
    seller_id BIGINT REFERENCES users(id),
    listing_type VARCHAR(50) DEFAULT 'sale',
    token_amount BIGINT NOT NULL,
    price_per_token_usdc DECIMAL(18,2) NOT NULL,
    total_price_usdc DECIMAL(18,2) NOT NULL,
    payment_methods TEXT[] DEFAULT ARRAY['USDC', 'SOL'],
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'sold', 'cancelled', 'expired')),
    listing_metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Asset Transactions Table
CREATE TABLE parking_asset_transactions (
    id BIGSERIAL PRIMARY KEY,
    listing_id BIGINT REFERENCES parking_marketplace_listings(id),
    asset_id BIGINT REFERENCES parking_assets(id),
    buyer_id BIGINT REFERENCES users(id),
    seller_id BIGINT REFERENCES users(id),
    token_amount BIGINT NOT NULL,
    total_amount_usdc DECIMAL(18,2) NOT NULL,
    payment_method VARCHAR(50),
    solana_tx_signature VARCHAR(255),
    settlement_status VARCHAR(50) DEFAULT 'pending',
    compliance_checked BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Institutional Operators Table
CREATE TABLE institutional_operators (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT REFERENCES users(id) UNIQUE,
    organization_name VARCHAR(255) NOT NULL,
    organization_type VARCHAR(100),
    total_parking_spots INTEGER DEFAULT 0,
    total_tokenized_value_usdc DECIMAL(18,2) DEFAULT 0,
    kyb_verified BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_assets_operator ON parking_assets(institutional_operator_id);
CREATE INDEX idx_assets_active ON parking_assets(is_active, is_tradeable);
CREATE INDEX idx_listings_status ON parking_marketplace_listings(status);
CREATE INDEX idx_listings_asset ON parking_marketplace_listings(asset_id);
CREATE INDEX idx_transactions_buyer ON parking_asset_transactions(buyer_id);
CREATE INDEX idx_transactions_seller ON parking_asset_transactions(seller_id);
CREATE INDEX idx_operators_user ON institutional_operators(user_id);

-- Success message
DO $$
BEGIN
    RAISE NOTICE '✅ Parking Marketplace tables created successfully!';
    RAISE NOTICE 'Tables: parking_assets, parking_marketplace_listings, parking_asset_transactions, institutional_operators';
END $$;
