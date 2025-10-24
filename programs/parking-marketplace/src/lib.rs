use anchor_lang::prelude::*;

pub mod instructions;
pub mod state;
pub mod error;

use instructions::*;
use state::*;

declare_id!("ParkingMarketplace11111111111111111111111111");

#[program]
pub mod parking_marketplace {
    use super::*;

    /// Initialize a tokenized parking asset
    /// Creates an SPL token mint and associates it with parking infrastructure
    pub fn initialize_asset(
        ctx: Context<InitializeAsset>,
        parking_lot_id: u64,
        spot_number: String,
        asset_type: AssetType,
        total_supply: u64,
        estimated_value_usdc: u64,
        annual_revenue_usdc: u64,
        revenue_share_percentage: u16,
    ) -> Result<()> {
        instructions::initialize_asset::handler(
            ctx,
            parking_lot_id,
            spot_number,
            asset_type,
            total_supply,
            estimated_value_usdc,
            annual_revenue_usdc,
            revenue_share_percentage,
        )
    }

    /// Create a marketplace listing for a parking asset
    pub fn create_listing(
        ctx: Context<CreateListing>,
        listing_type: ListingType,
        token_amount: u64,
        price_per_token_usdc: u64,
        payment_methods: Vec<Pubkey>,
        minimum_purchase_usdc: u64,
        kyb_required: bool,
        expires_in_seconds: i64,
    ) -> Result<()> {
        instructions::create_listing::handler(
            ctx,
            listing_type,
            token_amount,
            price_per_token_usdc,
            payment_methods,
            minimum_purchase_usdc,
            kyb_required,
            expires_in_seconds,
        )
    }

    /// Buy parking asset from marketplace listing
    pub fn buy_asset(
        ctx: Context<BuyAsset>,
        token_amount: u64,
    ) -> Result<()> {
        instructions::buy_asset::handler(ctx, token_amount)
    }

    /// Distribute revenue to parking asset token holders
    pub fn distribute_revenue(
        ctx: Context<DistributeRevenue>,
        total_revenue_usdc: u64,
        operating_costs_usdc: u64,
        period_start: i64,
        period_end: i64,
    ) -> Result<()> {
        instructions::distribute_revenue::handler(
            ctx,
            total_revenue_usdc,
            operating_costs_usdc,
            period_start,
            period_end,
        )
    }

    /// Update compliance status for parking asset
    pub fn update_compliance(
        ctx: Context<UpdateCompliance>,
        new_status: ComplianceStatus,
    ) -> Result<()> {
        instructions::update_compliance::handler(ctx, new_status)
    }

    /// Cancel marketplace listing
    pub fn cancel_listing(
        ctx: Context<CancelListing>,
    ) -> Result<()> {
        instructions::cancel_listing::handler(ctx)
    }
}
