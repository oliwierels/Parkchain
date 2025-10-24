use anchor_lang::prelude::*;

#[account]
#[derive(Default)]
pub struct ParkingAsset {
    /// SPL token mint address for this asset
    pub asset_token_mint: Pubkey,

    /// Type of parking asset
    pub asset_type: AssetType,

    /// Reference to parking_lots table in database
    pub parking_lot_id: u64,

    /// Spot identifier (e.g., "A-42", "B-101")
    pub spot_number: String,

    /// Total supply of tokens for this asset
    pub total_supply: u64,

    /// Current circulating supply
    pub circulating_supply: u64,

    /// Estimated asset value in USDC (6 decimals)
    pub estimated_value_usdc: u64,

    /// Annual revenue in USDC (6 decimals)
    pub annual_revenue_usdc: u64,

    /// Revenue share percentage (basis points, 10000 = 100%)
    pub revenue_share_percentage: u16,

    /// Institutional operator public key
    pub institutional_operator: Pubkey,

    /// Compliance status
    pub compliance_status: ComplianceStatus,

    /// Asset active status
    pub is_active: bool,

    /// Asset tradeable status
    pub is_tradeable: bool,

    /// Timestamp when asset was tokenized
    pub created_at: i64,

    /// PDA bump seed
    pub bump: u8,
}

impl ParkingAsset {
    pub const LEN: usize = 8 + // discriminator
        32 + // asset_token_mint
        1 + // asset_type
        8 + // parking_lot_id
        (4 + 32) + // spot_number (max 32 chars)
        8 + // total_supply
        8 + // circulating_supply
        8 + // estimated_value_usdc
        8 + // annual_revenue_usdc
        2 + // revenue_share_percentage
        32 + // institutional_operator
        1 + // compliance_status
        1 + // is_active
        1 + // is_tradeable
        8 + // created_at
        1; // bump

    /// Calculate annual yield percentage
    pub fn calculate_yield(&self) -> u64 {
        if self.estimated_value_usdc == 0 {
            return 0;
        }
        // Returns yield in basis points (10000 = 100%)
        (self.annual_revenue_usdc * 10000) / self.estimated_value_usdc
    }
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq)]
pub enum AssetType {
    SingleSpot,       // Individual parking spot
    RevenueShare,     // Share of parking lot revenue
    ParkingLotBundle, // Bundle of multiple spots
}

impl Default for AssetType {
    fn default() -> Self {
        AssetType::SingleSpot
    }
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq)]
pub enum ComplianceStatus {
    Pending,
    Verified,
    Compliant,
    NonCompliant,
}

impl Default for ComplianceStatus {
    fn default() -> Self {
        ComplianceStatus::Pending
    }
}
