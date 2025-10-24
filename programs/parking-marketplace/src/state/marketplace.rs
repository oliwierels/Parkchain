use anchor_lang::prelude::*;

#[account]
#[derive(Default)]
pub struct MarketplaceListing {
    /// Reference to parking asset account
    pub asset_account: Pubkey,

    /// Seller public key
    pub seller: Pubkey,

    /// Type of listing
    pub listing_type: ListingType,

    /// Number of tokens for sale
    pub token_amount: u64,

    /// Price per token in USDC (6 decimals)
    pub price_per_token_usdc: u64,

    /// Total price in USDC (6 decimals)
    pub total_price_usdc: u64,

    /// Accepted payment token mints (USDC, EUROC, etc.)
    pub payment_methods: Vec<Pubkey>,

    /// Minimum purchase amount in USDC (6 decimals)
    pub minimum_purchase_usdc: u64,

    /// Require KYB verification
    pub kyb_required: bool,

    /// Listing status
    pub status: ListingStatus,

    /// Creation timestamp
    pub created_at: i64,

    /// Expiration timestamp
    pub expires_at: i64,

    /// PDA bump seed
    pub bump: u8,
}

impl MarketplaceListing {
    pub const MAX_PAYMENT_METHODS: usize = 5;

    pub const LEN: usize = 8 + // discriminator
        32 + // asset_account
        32 + // seller
        1 + // listing_type
        8 + // token_amount
        8 + // price_per_token_usdc
        8 + // total_price_usdc
        (4 + (32 * Self::MAX_PAYMENT_METHODS)) + // payment_methods (vec of pubkeys)
        8 + // minimum_purchase_usdc
        1 + // kyb_required
        1 + // status
        8 + // created_at
        8 + // expires_at
        1; // bump

    /// Check if listing is still valid
    pub fn is_valid(&self, current_time: i64) -> bool {
        self.status == ListingStatus::Active && self.expires_at > current_time
    }

    /// Check if payment method is accepted
    pub fn accepts_payment_method(&self, payment_mint: &Pubkey) -> bool {
        self.payment_methods.contains(payment_mint)
    }
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq)]
pub enum ListingType {
    Sale,         // Outright sale of tokens
    Lease,        // Time-limited lease
    RevenueShare, // Revenue sharing agreement
}

impl Default for ListingType {
    fn default() -> Self {
        ListingType::Sale
    }
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq)]
pub enum ListingStatus {
    Active,
    Sold,
    Cancelled,
    Expired,
}

impl Default for ListingStatus {
    fn default() -> Self {
        ListingStatus::Active
    }
}
