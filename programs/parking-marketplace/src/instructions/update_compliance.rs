use anchor_lang::prelude::*;
use crate::state::*;
use crate::error::MarketplaceError;

#[derive(Accounts)]
pub struct UpdateCompliance<'info> {
    /// Parking asset
    #[account(
        mut,
        constraint = asset_account.institutional_operator == operator.key() @ MarketplaceError::UnauthorizedOperator,
    )]
    pub asset_account: Account<'info, ParkingAsset>,

    /// Operator (must be asset owner)
    pub operator: Signer<'info>,
}

pub fn handler(
    ctx: Context<UpdateCompliance>,
    new_status: ComplianceStatus,
) -> Result<()> {
    let asset = &mut ctx.accounts.asset_account;

    asset.compliance_status = new_status;

    msg!(
        "Compliance status updated for asset {} to {:?}",
        asset.key(),
        new_status
    );

    Ok(())
}
