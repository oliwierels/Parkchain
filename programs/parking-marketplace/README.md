# Parking Marketplace - Solana Program

## Overview

This Solana program implements the tokenization and marketplace infrastructure for parking assets as Real-World Assets (RWAs).

## Key Features

1. **Asset Tokenization**: Mint SPL tokens representing parking spots or revenue shares
2. **Marketplace Operations**: List, buy, and trade parking assets
3. **Revenue Distribution**: Distribute parking revenue to token holders
4. **Institutional Compliance**: On-chain verification and compliance checks

## Program Structure

```
parking-marketplace/
├── src/
│   ├── lib.rs                  # Program entrypoint
│   ├── instructions/
│   │   ├── mod.rs
│   │   ├── initialize_asset.rs # Tokenize a parking spot
│   │   ├── list_asset.rs       # Create marketplace listing
│   │   ├── buy_asset.rs        # Purchase parking asset
│   │   ├── distribute_revenue.rs # Send revenue to holders
│   │   └── update_compliance.rs # Update compliance status
│   ├── state/
│   │   ├── mod.rs
│   │   ├── parking_asset.rs    # Asset account structure
│   │   ├── marketplace.rs      # Marketplace state
│   │   └── revenue_vault.rs    # Revenue distribution vault
│   └── error.rs                # Custom program errors
└── tests/
    └── integration_test.rs
```

## Key Instructions

### 1. Initialize Parking Asset

Tokenizes a parking spot or lot into SPL tokens.

**Accounts:**
- `asset_account`: PDA for storing asset metadata
- `token_mint`: SPL token mint for the asset
- `operator`: Institutional operator (signer)
- `parking_lot`: Parking lot account
- `token_program`: SPL Token program
- `system_program`: System program

**Data:**
- `asset_type`: SingleSpot | RevenueShare | ParkingLotBundle
- `total_supply`: Number of tokens to mint
- `revenue_share_percentage`: % of revenue distributed
- `estimated_value_usdc`: Asset valuation

### 2. Create Marketplace Listing

Lists a parking asset for sale on the marketplace.

**Accounts:**
- `listing_account`: PDA for listing
- `asset_account`: Parking asset to list
- `seller`: Seller wallet (signer)
- `seller_token_account`: Seller's token account
- `system_program`: System program

**Data:**
- `listing_type`: Sale | Lease | RevenueShare
- `token_amount`: Number of tokens for sale
- `price_per_token_usdc`: Price in USDC (6 decimals)
- `payment_methods`: Accepted tokens (USDC, EUROC, etc.)

### 3. Buy Parking Asset

Purchases tokens from a marketplace listing.

**Accounts:**
- `listing_account`: Marketplace listing
- `asset_account`: Parking asset
- `buyer`: Buyer wallet (signer)
- `buyer_token_account`: Buyer's asset token account
- `buyer_payment_account`: Buyer's USDC/payment token account
- `seller_payment_account`: Seller's payment token account
- `marketplace_fee_account`: Platform fee account
- `token_program`: SPL Token program

**Data:**
- `token_amount`: Number of tokens to purchase

### 4. Distribute Revenue

Distributes parking revenue to token holders.

**Accounts:**
- `revenue_distribution_account`: PDA for distribution
- `asset_account`: Parking asset
- `revenue_vault`: Vault holding revenue
- `operator`: Operator wallet (signer)
- `token_program`: SPL Token program

**Data:**
- `total_revenue_usdc`: Total revenue to distribute
- `period_start`: Revenue period start timestamp
- `period_end`: Revenue period end timestamp

## Account Structures

### ParkingAsset

```rust
pub struct ParkingAsset {
    pub asset_token_mint: Pubkey,        // SPL token mint
    pub asset_type: AssetType,           // Type of asset
    pub parking_lot_id: u64,             // Database parking lot ID
    pub spot_number: String,             // e.g., "A-42"
    pub total_supply: u64,               // Total tokens minted
    pub circulating_supply: u64,         // Tokens in circulation
    pub estimated_value_usdc: u64,       // Value in USDC (6 decimals)
    pub annual_revenue_usdc: u64,        // Annual revenue
    pub revenue_share_percentage: u16,   // Basis points (100 = 1%)
    pub institutional_operator: Pubkey,  // Operator wallet
    pub compliance_status: ComplianceStatus,
    pub is_active: bool,
    pub is_tradeable: bool,
    pub bump: u8,
}
```

### MarketplaceListing

```rust
pub struct MarketplaceListing {
    pub asset_account: Pubkey,           // Parking asset
    pub seller: Pubkey,                  // Seller wallet
    pub listing_type: ListingType,       // Sale, Lease, RevenueShare
    pub token_amount: u64,               // Tokens for sale
    pub price_per_token_usdc: u64,       // Price (6 decimals)
    pub payment_methods: Vec<Pubkey>,    // Accepted token mints
    pub minimum_purchase_usdc: u64,      // Minimum purchase
    pub kyb_required: bool,              // KYB verification required
    pub status: ListingStatus,           // Active, Sold, Cancelled
    pub created_at: i64,                 // Unix timestamp
    pub expires_at: i64,                 // Expiration timestamp
    pub bump: u8,
}
```

### RevenueDistribution

```rust
pub struct RevenueDistribution {
    pub asset_account: Pubkey,           // Parking asset
    pub period_start: i64,               // Period start timestamp
    pub period_end: i64,                 // Period end timestamp
    pub total_revenue_usdc: u64,         // Total revenue (6 decimals)
    pub net_revenue_usdc: u64,           // After operating costs
    pub revenue_per_token_usdc: u64,     // Per token (6 decimals)
    pub total_distributed_usdc: u64,     // Total distributed
    pub distribution_status: DistributionStatus,
    pub operator: Pubkey,                // Operator who initiated
    pub bump: u8,
}
```

## Enums

```rust
pub enum AssetType {
    SingleSpot,        // Individual parking spot
    RevenueShare,      // Share of parking lot revenue
    ParkingLotBundle,  // Bundle of multiple spots
}

pub enum ListingType {
    Sale,              // Outright sale
    Lease,             // Time-limited lease
    RevenueShare,      // Revenue share agreement
}

pub enum ComplianceStatus {
    Pending,
    Verified,
    Compliant,
    NonCompliant,
}

pub enum ListingStatus {
    Active,
    Sold,
    Cancelled,
    Expired,
}

pub enum DistributionStatus {
    Pending,
    Processing,
    Completed,
    Failed,
}
```

## Seeds for PDAs

```rust
// Asset account PDA
["parking_asset", parking_lot_id.to_le_bytes(), spot_number.as_bytes()]

// Listing account PDA
["marketplace_listing", asset_account.key().as_ref(), seller.key().as_ref(), timestamp.to_le_bytes()]

// Revenue distribution PDA
["revenue_distribution", asset_account.key().as_ref(), period_end.to_le_bytes()]

// Revenue vault PDA
["revenue_vault", asset_account.key().as_ref()]
```

## Integration with Gateway

The program uses Sanctum Gateway for:
1. **Transaction Optimization**: Auto-compute units and priority fees
2. **Multi-Channel Delivery**: RPC + Jito bundles for 99%+ success
3. **Stablecoin Settlement**: USDC/EUROC transfers with institutional reliability
4. **Cross-Border Payments**: Low-latency international settlements

## Testing

```bash
# Build program
anchor build

# Run tests
anchor test

# Deploy to devnet
anchor deploy --provider.cluster devnet
```

## Security Considerations

1. **Compliance Checks**: Verify operator authorization before asset tokenization
2. **Revenue Distribution**: Prevent double-distribution attacks
3. **Token Transfers**: Use proper token account validation
4. **PDA Derivation**: Validate all PDA seeds and bumps
5. **Ownership**: Verify asset ownership before listing

## Deployment

**Devnet Program ID**: `TBD` (after deployment)
**Mainnet Program ID**: `TBD` (pending audit)

## License

MIT
