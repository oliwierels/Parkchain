use anchor_lang::prelude::*;
use crate::state::*;
use crate::error::MarketplaceError;

#[derive(Accounts)]
pub struct DistributeRevenue<'info> {
    /// Revenue distribution account PDA
    #[account(
        init,
        payer = operator,
        space = RevenueDistribution::LEN,
        seeds = [
            b"revenue_distribution",
            asset_account.key().as_ref(),
            &Clock::get()?.unix_timestamp.to_le_bytes()
        ],
        bump
    )]
    pub distribution_account: Account<'info, RevenueDistribution>,

    /// Parking asset
    #[account(
        constraint = asset_account.is_active @ MarketplaceError::AssetNotActive,
        constraint = asset_account.institutional_operator == operator.key() @ MarketplaceError::UnauthorizedOperator,
    )]
    pub asset_account: Account<'info, ParkingAsset>,

    /// Operator initiating distribution
    #[account(mut)]
    pub operator: Signer<'info>,

    /// System program
    pub system_program: Program<'info, System>,
}

pub fn handler(
    ctx: Context<DistributeRevenue>,
    total_revenue_usdc: u64,
    operating_costs_usdc: u64,
    period_start: i64,
    period_end: i64,
) -> Result<()> {
    let distribution = &mut ctx.accounts.distribution_account;
    let asset = &ctx.accounts.asset_account;
    let clock = Clock::get()?;

    // Validate period
    require!(
        period_end > period_start,
        MarketplaceError::InvalidRevenuePeriod
    );
    require!(
        period_end <= clock.unix_timestamp,
        MarketplaceError::InvalidRevenuePeriod
    );

    // Initialize distribution
    distribution.asset_account = asset.key();
    distribution.period_start = period_start;
    distribution.period_end = period_end;
    distribution.total_revenue_usdc = total_revenue_usdc;
    distribution.operating_costs_usdc = operating_costs_usdc;
    distribution.total_tokens_outstanding = asset.circulating_supply;
    distribution.operator = ctx.accounts.operator.key();
    distribution.created_at = clock.unix_timestamp;
    distribution.completed_at = 0;
    distribution.distribution_status = DistributionStatus::Pending;
    distribution.bump = ctx.bumps.distribution_account;

    // Calculate net revenue and per-token distribution
    distribution.calculate_net_revenue();
    distribution.calculate_revenue_per_token();

    msg!(
        "Revenue distribution created: {} USDC net revenue, {} USDC per token",
        distribution.net_revenue_usdc,
        distribution.revenue_per_token_usdc
    );

    Ok(())
}
