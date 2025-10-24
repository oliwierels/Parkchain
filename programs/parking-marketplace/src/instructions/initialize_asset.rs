use anchor_lang::prelude::*;
use anchor_spl::token::{self, Mint, Token, TokenAccount, MintTo};
use crate::state::*;
use crate::error::MarketplaceError;

#[derive(Accounts)]
#[instruction(parking_lot_id: u64, spot_number: String)]
pub struct InitializeAsset<'info> {
    /// Asset account PDA
    #[account(
        init,
        payer = operator,
        space = ParkingAsset::LEN,
        seeds = [
            b"parking_asset",
            parking_lot_id.to_le_bytes().as_ref(),
            spot_number.as_bytes()
        ],
        bump
    )]
    pub asset_account: Account<'info, ParkingAsset>,

    /// SPL token mint for the asset
    #[account(
        init,
        payer = operator,
        mint::decimals = 0,
        mint::authority = asset_account,
    )]
    pub token_mint: Account<'info, Mint>,

    /// Token account to receive initial supply
    #[account(
        init,
        payer = operator,
        token::mint = token_mint,
        token::authority = operator,
    )]
    pub operator_token_account: Account<'info, TokenAccount>,

    /// Institutional operator (must be authorized)
    #[account(mut)]
    pub operator: Signer<'info>,

    /// Token program
    pub token_program: Program<'info, Token>,

    /// System program
    pub system_program: Program<'info, System>,

    /// Rent sysvar
    pub rent: Sysvar<'info, Rent>,
}

pub fn handler(
    ctx: Context<InitializeAsset>,
    parking_lot_id: u64,
    spot_number: String,
    asset_type: AssetType,
    total_supply: u64,
    estimated_value_usdc: u64,
    annual_revenue_usdc: u64,
    revenue_share_percentage: u16,
) -> Result<()> {
    // Validate inputs
    require!(total_supply > 0, MarketplaceError::InvalidTokenAmount);
    require!(
        spot_number.len() <= 32,
        MarketplaceError::InvalidSpotNumber
    );
    require!(
        revenue_share_percentage <= 10000,
        MarketplaceError::InvalidRevenueSharePercentage
    );

    let asset = &mut ctx.accounts.asset_account;
    let clock = Clock::get()?;

    // Initialize asset account
    asset.asset_token_mint = ctx.accounts.token_mint.key();
    asset.asset_type = asset_type;
    asset.parking_lot_id = parking_lot_id;
    asset.spot_number = spot_number;
    asset.total_supply = total_supply;
    asset.circulating_supply = total_supply; // Initially all tokens circulating
    asset.estimated_value_usdc = estimated_value_usdc;
    asset.annual_revenue_usdc = annual_revenue_usdc;
    asset.revenue_share_percentage = revenue_share_percentage;
    asset.institutional_operator = ctx.accounts.operator.key();
    asset.compliance_status = ComplianceStatus::Pending;
    asset.is_active = true;
    asset.is_tradeable = true;
    asset.created_at = clock.unix_timestamp;
    asset.bump = ctx.bumps.asset_account;

    // Mint initial supply to operator
    let seeds = &[
        b"parking_asset",
        parking_lot_id.to_le_bytes().as_ref(),
        asset.spot_number.as_bytes(),
        &[asset.bump],
    ];
    let signer = &[&seeds[..]];

    let cpi_accounts = MintTo {
        mint: ctx.accounts.token_mint.to_account_info(),
        to: ctx.accounts.operator_token_account.to_account_info(),
        authority: ctx.accounts.asset_account.to_account_info(),
    };
    let cpi_program = ctx.accounts.token_program.to_account_info();
    let cpi_ctx = CpiContext::new_with_signer(cpi_program, cpi_accounts, signer);

    token::mint_to(cpi_ctx, total_supply)?;

    msg!(
        "Parking asset initialized: {} tokens minted for spot {} at lot {}",
        total_supply,
        asset.spot_number,
        parking_lot_id
    );

    Ok(())
}
