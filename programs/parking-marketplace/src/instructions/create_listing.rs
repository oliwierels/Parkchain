use anchor_lang::prelude::*;
use crate::state::*;
use crate::error::MarketplaceError;

#[derive(Accounts)]
pub struct CreateListing<'info> {
    /// Listing account PDA
    #[account(
        init,
        payer = seller,
        space = MarketplaceListing::LEN,
        seeds = [
            b"marketplace_listing",
            asset_account.key().as_ref(),
            seller.key().as_ref(),
            &Clock::get()?.unix_timestamp.to_le_bytes()
        ],
        bump
    )]
    pub listing_account: Account<'info, MarketplaceListing>,

    /// Parking asset to list
    #[account(
        constraint = asset_account.is_active @ MarketplaceError::AssetNotActive,
        constraint = asset_account.is_tradeable @ MarketplaceError::AssetNotTradeable,
    )]
    pub asset_account: Account<'info, ParkingAsset>,

    /// Seller (must own the tokens)
    #[account(mut)]
    pub seller: Signer<'info>,

    /// System program
    pub system_program: Program<'info, System>,
}

pub fn handler(
    ctx: Context<CreateListing>,
    listing_type: ListingType,
    token_amount: u64,
    price_per_token_usdc: u64,
    payment_methods: Vec<Pubkey>,
    minimum_purchase_usdc: u64,
    kyb_required: bool,
    expires_in_seconds: i64,
) -> Result<()> {
    // Validate inputs
    require!(token_amount > 0, MarketplaceError::InvalidTokenAmount);
    require!(price_per_token_usdc > 0, MarketplaceError::InvalidPrice);
    require!(
        payment_methods.len() <= MarketplaceListing::MAX_PAYMENT_METHODS,
        MarketplaceError::InvalidPrice
    );

    let listing = &mut ctx.accounts.listing_account;
    let clock = Clock::get()?;

    // Calculate total price
    let total_price_usdc = token_amount
        .checked_mul(price_per_token_usdc)
        .ok_or(MarketplaceError::ArithmeticOverflow)?;

    // Initialize listing
    listing.asset_account = ctx.accounts.asset_account.key();
    listing.seller = ctx.accounts.seller.key();
    listing.listing_type = listing_type;
    listing.token_amount = token_amount;
    listing.price_per_token_usdc = price_per_token_usdc;
    listing.total_price_usdc = total_price_usdc;
    listing.payment_methods = payment_methods;
    listing.minimum_purchase_usdc = minimum_purchase_usdc;
    listing.kyb_required = kyb_required;
    listing.status = ListingStatus::Active;
    listing.created_at = clock.unix_timestamp;
    listing.expires_at = clock.unix_timestamp + expires_in_seconds;
    listing.bump = ctx.bumps.listing_account;

    msg!(
        "Listing created: {} tokens at {} USDC per token",
        token_amount,
        price_per_token_usdc
    );

    Ok(())
}
