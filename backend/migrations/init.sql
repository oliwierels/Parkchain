-- Parkchain Database Schema v1.1
-- PostgreSQL 14+

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    full_name VARCHAR(255),
    wallet_address VARCHAR(44), -- Solana address
    role VARCHAR(50) DEFAULT 'driver', -- driver, operator, inspector, admin
    status VARCHAR(50) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Parking lots table
CREATE TABLE parking_lots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    operator_id UUID REFERENCES users(id),
    address TEXT,
    city VARCHAR(100),
    capacity INTEGER NOT NULL,
    current_occupancy INTEGER DEFAULT 0,
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    hourly_rate DECIMAL(10, 2),
    daily_rate DECIMAL(10, 2),
    features JSONB, -- EV charging, covered, security, etc.
    status VARCHAR(50) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Subscriptions table
CREATE TABLE subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    plan_type VARCHAR(50) NOT NULL, -- basic, premium, fleet
    price_monthly DECIMAL(10, 2) NOT NULL,
    currency VARCHAR(10) DEFAULT 'USDC',
    status VARCHAR(50) DEFAULT 'active', -- active, paused, cancelled
    started_at TIMESTAMP DEFAULT NOW(),
    expires_at TIMESTAMP,
    auto_renew BOOLEAN DEFAULT TRUE,
    solana_tx_signature VARCHAR(255),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Reservations table
CREATE TABLE reservations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    lot_id UUID REFERENCES parking_lots(id),
    spot_number VARCHAR(20),
    start_time TIMESTAMP NOT NULL,
    end_time TIMESTAMP NOT NULL,
    status VARCHAR(50) DEFAULT 'pending', -- pending, active, completed, cancelled
    price DECIMAL(10, 2),
    currency VARCHAR(10) DEFAULT 'USDC',
    payment_tx VARCHAR(255),
    entry_method VARCHAR(50), -- LPR, QR, manual
    license_plate VARCHAR(20),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Inspections (Crowdscan) table
CREATE TABLE inspections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lot_id UUID REFERENCES parking_lots(id),
    reporter_id UUID REFERENCES users(id),
    inspector_id UUID REFERENCES users(id),
    status VARCHAR(50) DEFAULT 'queued', -- queued, reviewing, confirmed, rejected
    result VARCHAR(50) DEFAULT 'unknown', -- ok, discrepancy, fraud
    reported_occupancy INTEGER,
    actual_occupancy INTEGER,
    evidence_urls TEXT[], -- Array of image/video URLs
    ai_analysis JSONB, -- AI processing results
    notes TEXT,
    reviewed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Rewards table
CREATE TABLE rewards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    inspection_id UUID REFERENCES inspections(id),
    type VARCHAR(50) NOT NULL, -- credit, discount, token
    amount DECIMAL(10, 2) NOT NULL,
    currency VARCHAR(10) DEFAULT 'PLN',
    status VARCHAR(50) DEFAULT 'issued', -- issued, claimed, expired
    expires_at TIMESTAMP,
    claimed_at TIMESTAMP,
    tx_signature VARCHAR(255),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- User reputation table
CREATE TABLE user_reputation (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    score INTEGER DEFAULT 0,
    reports_total INTEGER DEFAULT 0,
    reports_confirmed INTEGER DEFAULT 0,
    reports_rejected INTEGER DEFAULT 0,
    last_report_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Operators table
CREATE TABLE operators (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id UUID REFERENCES users(id),
    company_name VARCHAR(255) NOT NULL,
    tax_id VARCHAR(50),
    wallet_address VARCHAR(44),
    revenue DECIMAL(12, 2) DEFAULT 0,
    total_spots INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Fleet management table
CREATE TABLE fleets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES users(id),
    name VARCHAR(255) NOT NULL,
    budget_monthly DECIMAL(10, 2),
    vehicle_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Fleet vehicles
CREATE TABLE fleet_vehicles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    fleet_id UUID REFERENCES fleets(id) ON DELETE CASCADE,
    driver_id UUID REFERENCES users(id),
    license_plate VARCHAR(20) NOT NULL,
    make VARCHAR(100),
    model VARCHAR(100),
    status VARCHAR(50) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Webhooks log
CREATE TABLE webhook_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_type VARCHAR(100) NOT NULL,
    payload JSONB NOT NULL,
    status VARCHAR(50) DEFAULT 'pending',
    retry_count INTEGER DEFAULT 0,
    processed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_wallet ON users(wallet_address);
CREATE INDEX idx_parking_lots_city ON parking_lots(city);
CREATE INDEX idx_parking_lots_location ON parking_lots(latitude, longitude);
CREATE INDEX idx_reservations_user ON reservations(user_id);
CREATE INDEX idx_reservations_lot ON reservations(lot_id);
CREATE INDEX idx_reservations_time ON reservations(start_time, end_time);
CREATE INDEX idx_inspections_lot ON inspections(lot_id);
CREATE INDEX idx_inspections_reporter ON inspections(reporter_id);
CREATE INDEX idx_inspections_status ON inspections(status);
CREATE INDEX idx_rewards_user ON rewards(user_id);
CREATE INDEX idx_webhook_events_status ON webhook_events(status);

-- Triggers for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_parking_lots_updated_at BEFORE UPDATE ON parking_lots
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_reservations_updated_at BEFORE UPDATE ON reservations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_inspections_updated_at BEFORE UPDATE ON inspections
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger to update reputation on inspection confirmation
CREATE OR REPLACE FUNCTION update_user_reputation()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'confirmed' AND OLD.status != 'confirmed' THEN
        UPDATE user_reputation
        SET 
            reports_confirmed = reports_confirmed + 1,
            score = score + 10,
            last_report_at = NOW()
        WHERE user_id = NEW.reporter_id;
    ELSIF NEW.status = 'rejected' AND OLD.status != 'rejected' THEN
        UPDATE user_reputation
        SET 
            reports_rejected = reports_rejected + 1,
            score = GREATEST(score - 5, 0),
            last_report_at = NOW()
        WHERE user_id = NEW.reporter_id;
    END IF;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER inspection_reputation_trigger AFTER UPDATE ON inspections
    FOR EACH ROW EXECUTE FUNCTION update_user_reputation();

-- Seed data
INSERT INTO users(id, email, full_name, role) VALUES
    (gen_random_uuid(), 'demo@parkchain.io', 'Demo User', 'driver'),
    (gen_random_uuid(), 'operator@parkchain.io', 'Parking Operator', 'operator'),
    (gen_random_uuid(), 'inspector@parkchain.io', 'City Inspector', 'inspector');

INSERT INTO parking_lots(id, name, capacity, city, latitude, longitude, hourly_rate, daily_rate) VALUES
    (gen_random_uuid(), 'Galeria Lublin', 200, 'Lublin', 51.2465, 22.5684, 5.00, 40.00),
    (gen_random_uuid(), 'Centrum Handlowe Warszawa', 500, 'Warszawa', 52.2297, 21.0122, 8.00, 60.00),
    (gen_random_uuid(), 'Stary Rynek Poznań', 150, 'Poznań', 52.4082, 16.9335, 6.00, 45.00);

-- Initialize reputation for demo user
INSERT INTO user_reputation(user_id, score, reports_total, reports_confirmed)
SELECT id, 5, 5, 5 FROM users WHERE email = 'demo@parkchain.io';