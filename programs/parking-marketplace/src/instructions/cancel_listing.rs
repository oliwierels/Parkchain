use anchor_lang::prelude::*;
use crate::state::*;
use crate::error::MarketplaceError;

#[derive(Accounts)]
pub struct CancelListing<'info> {
    /// Listing account
    #[account(
        mut,
        constraint = listing_account.seller == seller.key() @ MarketplaceError::UnauthorizedOperator,
        constraint = listing_account.status == ListingStatus::Active @ MarketplaceError::ListingNotActive,
    )]
    pub listing_account: Account<'info, MarketplaceListing>,

    /// Seller
    pub seller: Signer<'info>,
}

pub fn handler(
    ctx: Context<CancelListing>,
) -> Result<()> {
    let listing = &mut ctx.accounts.listing_account;

    listing.status = ListingStatus::Cancelled;

    msg!("Listing cancelled: {}", listing.key());

    Ok(())
}
