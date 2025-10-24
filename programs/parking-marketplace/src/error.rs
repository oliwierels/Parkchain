use anchor_lang::prelude::*;

#[error_code]
pub enum MarketplaceError {
    #[msg("Invalid asset type")]
    InvalidAssetType,

    #[msg("Invalid token amount")]
    InvalidTokenAmount,

    #[msg("Invalid price")]
    InvalidPrice,

    #[msg("Listing has expired")]
    ListingExpired,

    #[msg("Listing is not active")]
    ListingNotActive,

    #[msg("Insufficient token balance")]
    InsufficientBalance,

    #[msg("Payment method not accepted")]
    PaymentMethodNotAccepted,

    #[msg("Minimum purchase amount not met")]
    MinimumPurchaseNotMet,

    #[msg("KYB verification required")]
    KYBRequired,

    #[msg("Asset not tradeable")]
    AssetNotTradeable,

    #[msg("Asset not active")]
    AssetNotActive,

    #[msg("Unauthorized operator")]
    UnauthorizedOperator,

    #[msg("Invalid compliance status")]
    InvalidComplianceStatus,

    #[msg("Distribution already completed")]
    DistributionAlreadyCompleted,

    #[msg("Invalid revenue period")]
    InvalidRevenuePeriod,

    #[msg("Arithmetic overflow")]
    ArithmeticOverflow,

    #[msg("Invalid spot number")]
    InvalidSpotNumber,

    #[msg("Revenue share percentage exceeds 100%")]
    InvalidRevenueSharePercentage,
}
