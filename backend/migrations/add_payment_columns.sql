-- Migration: Add payment_method and pricing_type columns to reservations
-- Date: 2025-10-28

-- Add payment_method column (gateway, solana, card, later)
ALTER TABLE reservations
ADD COLUMN IF NOT EXISTS payment_method VARCHAR(50);

-- Add pricing_type column (hourly, daily, weekly, monthly)
ALTER TABLE reservations
ADD COLUMN IF NOT EXISTS pricing_type VARCHAR(50);

-- Add payment_tx column if it doesn't exist (for storing transaction signatures)
ALTER TABLE reservations
ADD COLUMN IF NOT EXISTS payment_tx VARCHAR(255);

-- Add index for payment method queries
CREATE INDEX IF NOT EXISTS idx_reservations_payment_method ON reservations(payment_method);

-- Update existing rows to have default values (set all to 'later' by default)
UPDATE reservations
SET payment_method = 'later'
WHERE payment_method IS NULL;

-- Add comments
COMMENT ON COLUMN reservations.payment_method IS 'Payment method used: gateway, solana, card, or later';
COMMENT ON COLUMN reservations.pricing_type IS 'Pricing model used: hourly, daily, weekly, or monthly';
COMMENT ON COLUMN reservations.payment_tx IS 'Transaction signature for blockchain payments';
