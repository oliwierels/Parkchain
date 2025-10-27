# Parking Marketplace Database Setup

## Overview
This guide helps you set up the PostgreSQL database for the Parking Marketplace feature (Mastercard DeFi Hackathon Side Track).

## Prerequisites
- Supabase account
- SUPABASE_URL and SUPABASE_ANON_KEY configured in backend/.env

## Setup Steps

### 1. Get Database Credentials

From your Supabase dashboard:
1. Go to Project Settings → Database
2. Copy the connection string or note down:
   - Host: `db.[YOUR-PROJECT].supabase.co`
   - Database: `postgres`
   - Port: `5432`
   - User: `postgres`
   - Password: [Your database password]

### 2. Configure Environment Variables

Add to `backend/.env`:
```env
DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT].supabase.co:5432/postgres

# OR if using separate fields:
SUPABASE_DB_PASSWORD=[YOUR-PASSWORD]
SUPABASE_URL=https://[YOUR-PROJECT].supabase.co
SUPABASE_ANON_KEY=[YOUR-ANON-KEY]
```

### 3. Create Database Tables

#### Option A: Using Supabase SQL Editor (Recommended)
1. Open Supabase Dashboard
2. Go to SQL Editor
3. Create new query
4. Copy and paste content from `parking_marketplace.sql`
5. Run the query

#### Option B: Using psql CLI
```bash
psql "postgresql://postgres:[PASSWORD]@db.[PROJECT].supabase.co:5432/postgres" < database/parking_marketplace.sql
```

### 4. Verify Setup

Run this query in Supabase SQL Editor to verify tables were created:
```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name LIKE 'parking_%';
```

You should see:
- parking_assets
- parking_marketplace_listings
- parking_asset_transactions
- parking_revenue_distributions
- parking_market_analytics
- institutional_operators

### 5. Start Backend Server

```bash
cd backend
npm start
```

You should see:
```
✅ Supabase client initialized
✅ PostgreSQL pool initialized
Server running on port 3000
```

## Testing

### Test Tokenization
1. Start frontend: `cd frontend && npm run dev`
2. Login as operator
3. Go to Institutional Operator Dashboard
4. Click "Tokenize New Asset"
5. Fill the form and submit

### Verify Data in Database
```sql
-- Check tokenized assets
SELECT * FROM parking_assets ORDER BY created_at DESC LIMIT 5;

-- Check marketplace listings
SELECT * FROM marketplace_active_listings_view;

-- Check operator stats
SELECT * FROM institutional_operator_performance;
```

## Troubleshooting

### Error: "relation does not exist"
- Tables not created → Run parking_marketplace.sql again

### Error: "PostgreSQL connection error"
- Check DATABASE_URL or SUPABASE_DB_PASSWORD
- Verify database is accessible (not paused)

### Error: "permission denied"
- Check if postgres user has correct permissions
- Try running as service_role in Supabase

## Database Schema

Key tables created by `parking_marketplace.sql`:

### parking_assets
Stores tokenized parking spots/lots
- asset_token_address (Solana SPL token)
- asset_type (single_spot, revenue_share, parking_lot_bundle)
- total_supply, circulating_supply
- estimated_value_usdc
- annual_revenue_usdc
- institutional_operator_id

### parking_marketplace_listings
Active marketplace listings
- asset_id, seller_id
- token_amount, price_per_token_usdc
- payment_methods (USDC, SOL, EUROC)
- status (active, sold, cancelled)

### parking_asset_transactions
Purchase history
- buyer_id, seller_id
- token_amount, total_amount_usdc
- solana_tx_signature
- compliance_checked, aml_status

### institutional_operators
KYB-verified parking operators
- organization_name, organization_type
- total_parking_spots, total_tokenized_value_usdc
- kyb_verified

## Features Enabled

Once setup is complete, you'll have:
- ✅ Operator tokenization of parking assets
- ✅ Marketplace listings with real database storage
- ✅ Purchase transactions recorded
- ✅ Operator performance analytics
- ✅ Revenue distribution tracking
- ✅ Compliance and KYB tracking
- ✅ Market analytics dashboard

## Next Steps for Hackathon

1. Deploy Solana program to devnet
2. Integrate Mastercard Gateway for payments
3. Implement KYB verification flow
4. Add revenue distribution automation
5. Create compliance reporting dashboard
