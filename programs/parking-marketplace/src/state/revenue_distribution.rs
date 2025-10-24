use anchor_lang::prelude::*;

#[account]
#[derive(Default)]
pub struct RevenueDistribution {
    /// Reference to parking asset
    pub asset_account: Pubkey,

    /// Revenue period start timestamp
    pub period_start: i64,

    /// Revenue period end timestamp
    pub period_end: i64,

    /// Total revenue in USDC (6 decimals)
    pub total_revenue_usdc: u64,

    /// Operating costs in USDC (6 decimals)
    pub operating_costs_usdc: u64,

    /// Net revenue after costs in USDC (6 decimals)
    pub net_revenue_usdc: u64,

    /// Revenue per token in USDC (6 decimals)
    pub revenue_per_token_usdc: u64,

    /// Total amount distributed in USDC (6 decimals)
    pub total_distributed_usdc: u64,

    /// Total tokens outstanding at distribution time
    pub total_tokens_outstanding: u64,

    /// Distribution status
    pub distribution_status: DistributionStatus,

    /// Operator who initiated distribution
    pub operator: Pubkey,

    /// Creation timestamp
    pub created_at: i64,

    /// Completion timestamp
    pub completed_at: i64,

    /// PDA bump seed
    pub bump: u8,
}

impl RevenueDistribution {
    pub const LEN: usize = 8 + // discriminator
        32 + // asset_account
        8 + // period_start
        8 + // period_end
        8 + // total_revenue_usdc
        8 + // operating_costs_usdc
        8 + // net_revenue_usdc
        8 + // revenue_per_token_usdc
        8 + // total_distributed_usdc
        8 + // total_tokens_outstanding
        1 + // distribution_status
        32 + // operator
        8 + // created_at
        8 + // completed_at
        1; // bump

    /// Calculate net revenue
    pub fn calculate_net_revenue(&mut self) {
        self.net_revenue_usdc = self
            .total_revenue_usdc
            .saturating_sub(self.operating_costs_usdc);
    }

    /// Calculate revenue per token
    pub fn calculate_revenue_per_token(&mut self) {
        if self.total_tokens_outstanding == 0 {
            self.revenue_per_token_usdc = 0;
            return;
        }
        self.revenue_per_token_usdc =
            self.net_revenue_usdc / self.total_tokens_outstanding;
    }
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq)]
pub enum DistributionStatus {
    Pending,
    Processing,
    Completed,
    Failed,
}

impl Default for DistributionStatus {
    fn default() -> Self {
        DistributionStatus::Pending
    }
}
