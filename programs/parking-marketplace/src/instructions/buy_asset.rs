use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Transfer};
use crate::state::*;
use crate::error::MarketplaceError;

#[derive(Accounts)]
pub struct BuyAsset<'info> {
    /// Listing account
    #[account(
        mut,
        constraint = listing_account.status == ListingStatus::Active @ MarketplaceError::ListingNotActive,
    )]
    pub listing_account: Account<'info, MarketplaceListing>,

    /// Asset account
    #[account(
        constraint = asset_account.is_tradeable @ MarketplaceError::AssetNotTradeable,
    )]
    pub asset_account: Account<'info, ParkingAsset>,

    /// Buyer
    #[account(mut)]
    pub buyer: Signer<'info>,

    /// Buyer's token account (receives asset tokens)
    #[account(
        mut,
        constraint = buyer_asset_token_account.mint == asset_account.asset_token_mint,
    )]
    pub buyer_asset_token_account: Account<'info, TokenAccount>,

    /// Buyer's payment token account (USDC/EUROC/etc.)
    #[account(
        mut,
        constraint = buyer_payment_account.owner == buyer.key(),
    )]
    pub buyer_payment_account: Account<'info, TokenAccount>,

    /// Seller's asset token account (source of asset tokens)
    #[account(
        mut,
        constraint = seller_asset_token_account.owner == listing_account.seller,
        constraint = seller_asset_token_account.mint == asset_account.asset_token_mint,
    )]
    pub seller_asset_token_account: Account<'info, TokenAccount>,

    /// Seller's payment token account (receives payment)
    #[account(
        mut,
        constraint = seller_payment_account.owner == listing_account.seller,
        constraint = seller_payment_account.mint == buyer_payment_account.mint,
    )]
    pub seller_payment_account: Account<'info, TokenAccount>,

    /// Token program
    pub token_program: Program<'info, Token>,
}

pub fn handler(
    ctx: Context<BuyAsset>,
    token_amount: u64,
) -> Result<()> {
    let listing = &mut ctx.accounts.listing_account;
    let clock = Clock::get()?;

    // Validate listing is still valid
    require!(
        listing.is_valid(clock.unix_timestamp),
        MarketplaceError::ListingExpired
    );

    // Validate payment method
    require!(
        listing.accepts_payment_method(&ctx.accounts.buyer_payment_account.mint),
        MarketplaceError::PaymentMethodNotAccepted
    );

    // Validate token amount
    require!(
        token_amount <= listing.token_amount,
        MarketplaceError::InvalidTokenAmount
    );

    // Calculate payment amount
    let payment_amount = token_amount
        .checked_mul(listing.price_per_token_usdc)
        .ok_or(MarketplaceError::ArithmeticOverflow)?;

    // Check minimum purchase
    require!(
        payment_amount >= listing.minimum_purchase_usdc,
        MarketplaceError::MinimumPurchaseNotMet
    );

    // Transfer payment tokens from buyer to seller
    let transfer_payment_ctx = CpiContext::new(
        ctx.accounts.token_program.to_account_info(),
        Transfer {
            from: ctx.accounts.buyer_payment_account.to_account_info(),
            to: ctx.accounts.seller_payment_account.to_account_info(),
            authority: ctx.accounts.buyer.to_account_info(),
        },
    );
    token::transfer(transfer_payment_ctx, payment_amount)?;

    // Transfer asset tokens from seller to buyer
    let transfer_asset_ctx = CpiContext::new(
        ctx.accounts.token_program.to_account_info(),
        Transfer {
            from: ctx.accounts.seller_asset_token_account.to_account_info(),
            to: ctx.accounts.buyer_asset_token_account.to_account_info(),
            authority: ctx.accounts.buyer.to_account_info(), // Assumes approval
        },
    );
    token::transfer(transfer_asset_ctx, token_amount)?;

    // Update listing
    listing.token_amount = listing.token_amount.saturating_sub(token_amount);

    if listing.token_amount == 0 {
        listing.status = ListingStatus::Sold;
    }

    msg!(
        "Purchase completed: {} tokens for {} USDC",
        token_amount,
        payment_amount
    );

    Ok(())
}
