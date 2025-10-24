-- ========================================
-- PARKING MARKETPLACE - INSTITUTIONAL DEFI
-- Mastercard DeFi Hackathon Track
-- ========================================
-- Real-World Asset Tokenization Platform for Parking Infrastructure
-- Target: Parking lot operators, municipalities, airports, corporate campuses
-- ========================================

-- ========================================
-- 1. PARKING ASSET REGISTRY
-- ========================================
-- Tokenized parking spots as RWAs (Real-World Assets)

CREATE TABLE IF NOT EXISTS parking_assets (
    id BIGSERIAL PRIMARY KEY,

    -- Asset Identity
    asset_token_address VARCHAR(44) UNIQUE NOT NULL, -- Solana token mint address
    asset_type VARCHAR(50) NOT NULL, -- 'single_spot', 'revenue_share', 'parking_lot_bundle'

    -- Physical Location
    parking_lot_id BIGINT REFERENCES parking_lots(id) ON DELETE CASCADE,
    spot_number VARCHAR(50), -- e.g., "A-42", "B-101"
    location_description TEXT,

    -- Tokenization Details
    total_supply BIGINT NOT NULL DEFAULT 1, -- For fractional ownership
    circulating_supply BIGINT NOT NULL DEFAULT 1,
    min_trade_amount BIGINT DEFAULT 1,

    -- Asset Characteristics
    spot_features JSONB, -- {"ev_charging": true, "covered": true, "size": "standard"}
    operational_hours JSONB, -- {"weekday": "0-24", "weekend": "0-24"}
    access_restrictions JSONB, -- {"permit_required": false, "reserved_for": null}

    -- Valuation & Revenue
    estimated_value_usdc DECIMAL(12, 2), -- Asset valuation in USDC
    annual_revenue_usdc DECIMAL(12, 2), -- Historical annual revenue
    revenue_share_percentage DECIMAL(5, 2), -- % of revenue shared with token holders

    -- Institutional Data
    institutional_operator_id BIGINT REFERENCES users(id), -- Corporate/municipal operator
    compliance_status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'verified', 'compliant'
    regulatory_jurisdiction VARCHAR(100), -- 'PL-MZ' (Poland-Mazowieckie), 'EU', etc.

    -- Legal & Compliance
    legal_entity VARCHAR(255), -- Company name or municipality
    tax_id VARCHAR(50), -- NIP (Polish VAT ID) or equivalent
    contract_address_offchain TEXT, -- Link to legal contract

    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    is_tradeable BOOLEAN DEFAULT TRUE,
    listing_date TIMESTAMP DEFAULT NOW(),
    delisting_date TIMESTAMP,

    -- Timestamps
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_parking_assets_token ON parking_assets(asset_token_address);
CREATE INDEX IF NOT EXISTS idx_parking_assets_lot ON parking_assets(parking_lot_id);
CREATE INDEX IF NOT EXISTS idx_parking_assets_operator ON parking_assets(institutional_operator_id);
CREATE INDEX IF NOT EXISTS idx_parking_assets_type ON parking_assets(asset_type);
CREATE INDEX IF NOT EXISTS idx_parking_assets_tradeable ON parking_assets(is_tradeable, is_active);

-- ========================================
-- 2. PARKING ASSET LISTINGS (Marketplace)
-- ========================================
-- Primary and secondary market for parking assets

CREATE TABLE IF NOT EXISTS parking_marketplace_listings (
    id BIGSERIAL PRIMARY KEY,

    -- Asset Reference
    asset_id BIGINT NOT NULL REFERENCES parking_assets(id),

    -- Seller Info
    seller_id BIGINT NOT NULL REFERENCES users(id),
    seller_type VARCHAR(50) NOT NULL, -- 'institutional', 'individual', 'secondary_market'

    -- Listing Details
    listing_type VARCHAR(50) NOT NULL, -- 'sale', 'lease', 'revenue_share'
    token_amount BIGINT NOT NULL, -- Number of tokens for sale

    -- Pricing
    price_per_token_usdc DECIMAL(12, 6) NOT NULL,
    total_price_usdc DECIMAL(12, 2) NOT NULL,
    payment_methods TEXT[] DEFAULT ARRAY['USDC', 'SOL', 'EUROC'], -- Supported stablecoins

    -- Revenue Share (if applicable)
    revenue_share_duration_months INTEGER, -- For lease/revenue-share deals
    guaranteed_yield_apy DECIMAL(5, 2), -- Guaranteed annual percentage yield

    -- Institutional Features
    minimum_purchase_usdc DECIMAL(12, 2), -- Minimum institutional purchase
    kyb_required BOOLEAN DEFAULT FALSE, -- Know-Your-Business verification
    accredited_only BOOLEAN DEFAULT FALSE, -- Accredited investors only

    -- Market Data
    views_count INTEGER DEFAULT 0,
    inquiries_count INTEGER DEFAULT 0,
    offers_count INTEGER DEFAULT 0,

    -- Status
    status VARCHAR(50) DEFAULT 'active', -- 'active', 'sold', 'cancelled', 'expired', 'under_review'

    -- Blockchain
    solana_listing_tx VARCHAR(255), -- Transaction signature for listing
    solana_sale_tx VARCHAR(255), -- Transaction signature for sale

    -- Timestamps
    created_at TIMESTAMP DEFAULT NOW(),
    sold_at TIMESTAMP,
    expires_at TIMESTAMP,
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_marketplace_asset ON parking_marketplace_listings(asset_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_seller ON parking_marketplace_listings(seller_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_status ON parking_marketplace_listings(status);
CREATE INDEX IF NOT EXISTS idx_marketplace_type ON parking_marketplace_listings(listing_type);
CREATE INDEX IF NOT EXISTS idx_marketplace_active ON parking_marketplace_listings(status, expires_at);

-- ========================================
-- 3. PARKING ASSET TRANSACTIONS
-- ========================================
-- Track all asset purchases with institutional settlement

CREATE TABLE IF NOT EXISTS parking_asset_transactions (
    id BIGSERIAL PRIMARY KEY,

    -- Transaction Parties
    listing_id BIGINT REFERENCES parking_marketplace_listings(id),
    asset_id BIGINT NOT NULL REFERENCES parking_assets(id),
    buyer_id BIGINT NOT NULL REFERENCES users(id),
    seller_id BIGINT NOT NULL REFERENCES users(id),

    -- Transaction Details
    token_amount BIGINT NOT NULL,
    price_per_token_usdc DECIMAL(12, 6) NOT NULL,
    total_amount_usdc DECIMAL(12, 2) NOT NULL,

    -- Payment Processing
    payment_method VARCHAR(50) NOT NULL, -- 'USDC', 'EUROC', 'SOL'
    payment_status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'processing', 'completed', 'failed', 'refunded'

    -- Blockchain Settlement
    solana_tx_signature VARCHAR(255) NOT NULL,
    gateway_used BOOLEAN DEFAULT FALSE,
    gateway_delivery_method VARCHAR(50), -- 'rpc', 'jito', 'triton', 'paladin'
    gateway_fee_sol DECIMAL(12, 9),
    confirmation_time_ms INTEGER,

    -- Institutional Settlement
    settlement_status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'settled', 'failed'
    settlement_date TIMESTAMP,
    custody_provider VARCHAR(100), -- e.g., 'Fireblocks', 'Copper', 'In-house'

    -- Compliance & KYC/KYB
    compliance_checked BOOLEAN DEFAULT FALSE,
    compliance_check_date TIMESTAMP,
    compliance_officer_id BIGINT REFERENCES users(id),
    aml_status VARCHAR(50), -- 'clear', 'flagged', 'under_review'

    -- Cross-Border
    buyer_country VARCHAR(2), -- ISO 3166-1 alpha-2 code (PL, DE, FR, etc.)
    seller_country VARCHAR(2),
    currency_conversion_rate DECIMAL(12, 6), -- If using EUROC or other stablecoin

    -- Timestamps
    created_at TIMESTAMP DEFAULT NOW(),
    completed_at TIMESTAMP,
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_asset_tx_asset ON parking_asset_transactions(asset_id);
CREATE INDEX IF NOT EXISTS idx_asset_tx_buyer ON parking_asset_transactions(buyer_id);
CREATE INDEX IF NOT EXISTS idx_asset_tx_seller ON parking_asset_transactions(seller_id);
CREATE INDEX IF NOT EXISTS idx_asset_tx_status ON parking_asset_transactions(payment_status);
CREATE INDEX IF NOT EXISTS idx_asset_tx_signature ON parking_asset_transactions(solana_tx_signature);
CREATE INDEX IF NOT EXISTS idx_asset_tx_settlement ON parking_asset_transactions(settlement_status);

-- ========================================
-- 4. REVENUE DISTRIBUTION
-- ========================================
-- Track revenue generated by parking assets and distribute to token holders

CREATE TABLE IF NOT EXISTS parking_revenue_distributions (
    id BIGSERIAL PRIMARY KEY,

    -- Asset Reference
    asset_id BIGINT NOT NULL REFERENCES parking_assets(id),

    -- Revenue Period
    period_start TIMESTAMP NOT NULL,
    period_end TIMESTAMP NOT NULL,
    distribution_date TIMESTAMP DEFAULT NOW(),

    -- Revenue Details
    total_revenue_usdc DECIMAL(12, 2) NOT NULL,
    operating_costs_usdc DECIMAL(12, 2) DEFAULT 0,
    net_revenue_usdc DECIMAL(12, 2) NOT NULL,

    -- Distribution
    total_tokens_outstanding BIGINT NOT NULL,
    revenue_per_token_usdc DECIMAL(12, 6) NOT NULL,
    total_distributed_usdc DECIMAL(12, 2) NOT NULL,

    -- Payment Details
    payment_method VARCHAR(50) DEFAULT 'USDC', -- 'USDC', 'EUROC', 'bank_transfer'
    payment_status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'processing', 'completed', 'failed'

    -- Blockchain
    distribution_tx_signatures TEXT[], -- Array of transaction signatures (one per holder)
    gateway_used BOOLEAN DEFAULT TRUE,

    -- Institutional Reporting
    report_url TEXT, -- Link to PDF/Excel report for institutional investors

    -- Timestamps
    created_at TIMESTAMP DEFAULT NOW(),
    completed_at TIMESTAMP,
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_revenue_dist_asset ON parking_revenue_distributions(asset_id);
CREATE INDEX IF NOT EXISTS idx_revenue_dist_period ON parking_revenue_distributions(period_end);
CREATE INDEX IF NOT EXISTS idx_revenue_dist_status ON parking_revenue_distributions(payment_status);

-- ========================================
-- 5. INSTITUTIONAL OPERATORS
-- ========================================
-- Extended profile for institutional parking operators

CREATE TABLE IF NOT EXISTS institutional_operators (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT UNIQUE REFERENCES users(id) ON DELETE CASCADE,

    -- Organization Details
    organization_name VARCHAR(255) NOT NULL,
    organization_type VARCHAR(50) NOT NULL, -- 'municipality', 'private_company', 'airport', 'university', 'hospital'
    registration_number VARCHAR(100), -- Company registration number
    tax_id VARCHAR(50) NOT NULL, -- NIP or equivalent

    -- Contact
    primary_contact_name VARCHAR(255),
    primary_contact_email VARCHAR(255),
    primary_contact_phone VARCHAR(50),

    -- Address
    headquarters_address TEXT,
    headquarters_city VARCHAR(100),
    headquarters_country VARCHAR(2), -- ISO code

    -- Operational Scope
    total_parking_spots INTEGER DEFAULT 0,
    total_parking_lots INTEGER DEFAULT 0,
    cities_operated TEXT[], -- Array of cities

    -- Financial Info
    total_tokenized_value_usdc DECIMAL(15, 2) DEFAULT 0,
    total_revenue_distributed_usdc DECIMAL(15, 2) DEFAULT 0,
    aum_under_management_usdc DECIMAL(15, 2) DEFAULT 0, -- Assets Under Management

    -- Compliance
    kyb_verified BOOLEAN DEFAULT FALSE,
    kyb_verification_date TIMESTAMP,
    compliance_tier VARCHAR(50) DEFAULT 'basic', -- 'basic', 'enhanced', 'institutional'
    regulatory_licenses JSONB, -- {"parking_operator": "PL-123456", "securities": null}

    -- Platform Stats
    total_transactions INTEGER DEFAULT 0,
    total_volume_usdc DECIMAL(15, 2) DEFAULT 0,
    average_transaction_size_usdc DECIMAL(12, 2),

    -- Reputation
    operator_rating DECIMAL(3, 2) DEFAULT 5.0, -- 0.00 to 5.00
    total_reviews INTEGER DEFAULT 0,

    -- Status
    is_verified BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,

    -- Timestamps
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_inst_operators_user ON institutional_operators(user_id);
CREATE INDEX IF NOT EXISTS idx_inst_operators_verified ON institutional_operators(is_verified, is_active);
CREATE INDEX IF NOT EXISTS idx_inst_operators_type ON institutional_operators(organization_type);

-- ========================================
-- 6. MARKET ANALYTICS
-- ========================================
-- Track market metrics for institutional reporting

CREATE TABLE IF NOT EXISTS parking_market_analytics (
    id BIGSERIAL PRIMARY KEY,

    -- Time Period
    date DATE NOT NULL UNIQUE,

    -- Market Volume
    daily_volume_usdc DECIMAL(15, 2) DEFAULT 0,
    daily_transactions INTEGER DEFAULT 0,
    active_listings INTEGER DEFAULT 0,

    -- Asset Metrics
    total_assets_tokenized INTEGER DEFAULT 0,
    total_market_cap_usdc DECIMAL(18, 2) DEFAULT 0,
    average_asset_price_usdc DECIMAL(12, 2),

    -- User Metrics
    active_buyers INTEGER DEFAULT 0,
    active_sellers INTEGER DEFAULT 0,
    new_institutional_operators INTEGER DEFAULT 0,

    -- Revenue Distribution
    total_revenue_distributed_usdc DECIMAL(15, 2) DEFAULT 0,
    average_yield_apy DECIMAL(5, 2),

    -- Cross-Border
    cross_border_transactions INTEGER DEFAULT 0,
    cross_border_volume_usdc DECIMAL(15, 2) DEFAULT 0,
    top_countries JSONB, -- {"PL": 150, "DE": 45, "FR": 30}

    -- Gateway Performance
    gateway_transactions INTEGER DEFAULT 0,
    gateway_success_rate DECIMAL(5, 2),
    average_confirmation_time_ms INTEGER,

    -- Timestamps
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Index
CREATE INDEX IF NOT EXISTS idx_market_analytics_date ON parking_market_analytics(date DESC);

-- ========================================
-- 7. TRIGGERS & AUTOMATION
-- ========================================

-- Trigger: Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_marketplace_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers
DROP TRIGGER IF EXISTS parking_assets_updated_at ON parking_assets;
CREATE TRIGGER parking_assets_updated_at
    BEFORE UPDATE ON parking_assets
    FOR EACH ROW EXECUTE FUNCTION update_marketplace_updated_at();

DROP TRIGGER IF EXISTS marketplace_listings_updated_at ON parking_marketplace_listings;
CREATE TRIGGER marketplace_listings_updated_at
    BEFORE UPDATE ON parking_marketplace_listings
    FOR EACH ROW EXECUTE FUNCTION update_marketplace_updated_at();

DROP TRIGGER IF EXISTS asset_transactions_updated_at ON parking_asset_transactions;
CREATE TRIGGER asset_transactions_updated_at
    BEFORE UPDATE ON parking_asset_transactions
    FOR EACH ROW EXECUTE FUNCTION update_marketplace_updated_at();

DROP TRIGGER IF EXISTS revenue_distributions_updated_at ON parking_revenue_distributions;
CREATE TRIGGER revenue_distributions_updated_at
    BEFORE UPDATE ON parking_revenue_distributions
    FOR EACH ROW EXECUTE FUNCTION update_marketplace_updated_at();

DROP TRIGGER IF EXISTS inst_operators_updated_at ON institutional_operators;
CREATE TRIGGER inst_operators_updated_at
    BEFORE UPDATE ON institutional_operators
    FOR EACH ROW EXECUTE FUNCTION update_marketplace_updated_at();

-- ========================================
-- 8. VIEWS FOR ANALYTICS
-- ========================================

-- View: Active marketplace with asset details
CREATE OR REPLACE VIEW marketplace_active_listings_view AS
SELECT
    l.id as listing_id,
    l.listing_type,
    l.token_amount,
    l.price_per_token_usdc,
    l.total_price_usdc,
    l.payment_methods,
    l.status,
    l.created_at,
    l.expires_at,
    -- Asset details
    a.asset_token_address,
    a.asset_type,
    a.spot_number,
    a.estimated_value_usdc,
    a.annual_revenue_usdc,
    a.revenue_share_percentage,
    -- Parking lot details
    pl.name as parking_lot_name,
    pl.address,
    pl.city,
    pl.latitude,
    pl.longitude,
    -- Operator details
    io.organization_name,
    io.organization_type,
    io.operator_rating
FROM parking_marketplace_listings l
JOIN parking_assets a ON l.asset_id = a.id
JOIN parking_lots pl ON a.parking_lot_id = pl.id
JOIN institutional_operators io ON a.institutional_operator_id = io.user_id
WHERE l.status = 'active' AND l.expires_at > NOW()
ORDER BY l.created_at DESC;

-- View: Institutional operator performance
CREATE OR REPLACE VIEW institutional_operator_performance AS
SELECT
    io.id,
    io.organization_name,
    io.organization_type,
    io.total_parking_spots,
    io.total_tokenized_value_usdc,
    io.total_revenue_distributed_usdc,
    io.operator_rating,
    -- Count assets
    COUNT(DISTINCT pa.id) as total_assets,
    -- Market stats
    COUNT(DISTINCT l.id) as active_listings,
    SUM(CASE WHEN t.payment_status = 'completed' THEN 1 ELSE 0 END) as completed_sales,
    SUM(CASE WHEN t.payment_status = 'completed' THEN t.total_amount_usdc ELSE 0 END) as total_sales_volume_usdc
FROM institutional_operators io
LEFT JOIN parking_assets pa ON io.user_id = pa.institutional_operator_id
LEFT JOIN parking_marketplace_listings l ON pa.id = l.asset_id AND l.status = 'active'
LEFT JOIN parking_asset_transactions t ON pa.id = t.asset_id
WHERE io.is_active = TRUE
GROUP BY io.id;

-- ========================================
-- 9. FUNCTIONS
-- ========================================

-- Function: Calculate asset yield
CREATE OR REPLACE FUNCTION calculate_asset_yield(
    p_asset_id BIGINT
)
RETURNS DECIMAL AS $$
DECLARE
    v_annual_revenue DECIMAL;
    v_estimated_value DECIMAL;
    v_yield DECIMAL;
BEGIN
    SELECT annual_revenue_usdc, estimated_value_usdc
    INTO v_annual_revenue, v_estimated_value
    FROM parking_assets
    WHERE id = p_asset_id;

    IF v_estimated_value = 0 OR v_estimated_value IS NULL THEN
        RETURN 0;
    END IF;

    v_yield := (v_annual_revenue / v_estimated_value) * 100;

    RETURN ROUND(v_yield, 2);
END;
$$ LANGUAGE plpgsql;

-- Function: Update operator stats
CREATE OR REPLACE FUNCTION update_operator_stats(
    p_operator_user_id BIGINT
)
RETURNS VOID AS $$
DECLARE
    v_total_value DECIMAL;
    v_total_revenue DECIMAL;
    v_total_spots INTEGER;
    v_total_lots INTEGER;
BEGIN
    -- Calculate totals
    SELECT
        COALESCE(SUM(pa.estimated_value_usdc), 0),
        COALESCE(SUM(rd.total_distributed_usdc), 0)
    INTO v_total_value, v_total_revenue
    FROM parking_assets pa
    LEFT JOIN parking_revenue_distributions rd ON pa.id = rd.asset_id
    WHERE pa.institutional_operator_id = p_operator_user_id
        AND pa.is_active = TRUE;

    SELECT
        COUNT(DISTINCT pl.id),
        COALESCE(SUM(pl.total_spots), 0)
    INTO v_total_lots, v_total_spots
    FROM parking_lots pl
    WHERE pl.owner_id = p_operator_user_id;

    -- Update operator record
    UPDATE institutional_operators
    SET
        total_tokenized_value_usdc = v_total_value,
        total_revenue_distributed_usdc = v_total_revenue,
        total_parking_spots = v_total_spots,
        total_parking_lots = v_total_lots,
        updated_at = NOW()
    WHERE user_id = p_operator_user_id;
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- 10. SUMMARY
-- ========================================

DO $$
BEGIN
    RAISE NOTICE '✅ Parking Marketplace schema created successfully!';
    RAISE NOTICE '';
    RAISE NOTICE 'Created tables:';
    RAISE NOTICE '  - parking_assets (Tokenized RWAs)';
    RAISE NOTICE '  - parking_marketplace_listings (Primary/Secondary market)';
    RAISE NOTICE '  - parking_asset_transactions (Institutional settlement)';
    RAISE NOTICE '  - parking_revenue_distributions (Revenue sharing)';
    RAISE NOTICE '  - institutional_operators (KYB verified operators)';
    RAISE NOTICE '  - parking_market_analytics (Market metrics)';
    RAISE NOTICE '';
    RAISE NOTICE 'Key Features:';
    RAISE NOTICE '  ✓ Real-World Asset Tokenization';
    RAISE NOTICE '  ✓ Institutional-grade compliance (KYB, AML)';
    RAISE NOTICE '  ✓ Cross-border stablecoin settlement (USDC, EUROC)';
    RAISE NOTICE '  ✓ Revenue sharing with token holders';
    RAISE NOTICE '  ✓ Gateway integration for 99%+ transaction success';
    RAISE NOTICE '  ✓ Multi-currency support for EU market';
    RAISE NOTICE '';
    RAISE NOTICE 'Mastercard DeFi Hackathon Alignment:';
    RAISE NOTICE '  🎯 Institutional Viability: KYB, compliance, custody support';
    RAISE NOTICE '  🎯 Only Possible on Solana: 400ms blocks, $0.00025 fees';
    RAISE NOTICE '  🎯 Market Impact: $100B+ parking industry tokenization';
END $$;
