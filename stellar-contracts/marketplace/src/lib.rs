#![no_std]

//! Parking Asset Marketplace Contract
//! Secondary market for trading tokenized parking assets
//! Supports multiple payment methods (USDC, EUROC, XLM)

use soroban_sdk::{contract, contractimpl, contracttype, contracterror, Address, Env, String, Vec, symbol_short};

#[derive(Clone, Copy, PartialEq, Eq)]
#[contracttype]
#[repr(u32)]
pub enum ListingType {
    Sale = 1,         // Outright sale of tokens
    Lease = 2,        // Time-limited lease
    RevenueShare = 3, // Revenue sharing agreement
}

#[derive(Clone, Copy, PartialEq, Eq)]
#[contracttype]
#[repr(u32)]
pub enum ListingStatus {
    Active = 1,
    Sold = 2,
    Cancelled = 3,
    Expired = 4,
}

#[contracttype]
#[derive(Clone)]
pub struct MarketplaceListing {
    /// Listing ID
    pub listing_id: u64,

    /// Reference to parking asset contract and asset ID
    pub asset_contract: Address,
    pub asset_id: u64,

    /// Seller address
    pub seller: Address,

    /// Type of listing
    pub listing_type: ListingType,

    /// Number of tokens for sale
    pub token_amount: i128,

    /// Price per token in USDC (7 decimals)
    pub price_per_token_usdc: i128,

    /// Total price in USDC (7 decimals)
    pub total_price_usdc: i128,

    /// Accepted payment token addresses (USDC, EUROC, XLM, etc.)
    pub payment_methods: Vec<Address>,

    /// Minimum purchase amount in USDC (7 decimals)
    pub minimum_purchase_usdc: i128,

    /// Require KYB verification
    pub kyb_required: bool,

    /// Listing status
    pub status: ListingStatus,

    /// Creation timestamp
    pub created_at: u64,

    /// Expiration timestamp
    pub expires_at: u64,
}

#[contracttype]
#[derive(Clone)]
pub struct Trade {
    /// Trade ID
    pub trade_id: u64,

    /// Listing ID
    pub listing_id: u64,

    /// Buyer address
    pub buyer: Address,

    /// Seller address
    pub seller: Address,

    /// Number of tokens traded
    pub token_amount: i128,

    /// Total price paid in USDC
    pub price_paid_usdc: i128,

    /// Payment token used
    pub payment_token: Address,

    /// Timestamp of trade
    pub traded_at: u64,
}

#[contracttype]
pub enum DataKey {
    Listing(u64),        // listing_id -> MarketplaceListing
    Trade(u64),          // trade_id -> Trade
    ListingCount,        // Counter for listing IDs
    TradeCount,          // Counter for trade IDs
    Admin,               // Contract admin
    PlatformFee,         // Platform fee in basis points (10000 = 100%)
}

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq)]
#[repr(u32)]
pub enum Error {
    NotInitialized = 1,
    AlreadyInitialized = 2,
    Unauthorized = 3,
    InvalidAmount = 4,
    InvalidPrice = 5,
    InvalidPaymentMethod = 6,
    ListingNotFound = 7,
    ListingNotActive = 8,
    ListingExpired = 9,
    InsufficientTokens = 10,
    BelowMinimumPurchase = 11,
    KYBRequired = 12,
    InvalidFee = 13,
}

#[contract]
pub struct MarketplaceContract;

#[contractimpl]
impl MarketplaceContract {
    /// Initialize the marketplace contract
    pub fn initialize(env: Env, admin: Address, platform_fee_bp: u32) -> Result<(), Error> {
        if env.storage().instance().has(&DataKey::Admin) {
            return Err(Error::AlreadyInitialized);
        }

        if platform_fee_bp > 1000 {
            // Max 10% fee
            return Err(Error::InvalidFee);
        }

        env.storage().instance().set(&DataKey::Admin, &admin);
        env.storage().instance().set(&DataKey::PlatformFee, &platform_fee_bp);
        env.storage().instance().set(&DataKey::ListingCount, &0u64);
        env.storage().instance().set(&DataKey::TradeCount, &0u64);

        Ok(())
    }

    /// Create a marketplace listing
    pub fn create_listing(
        env: Env,
        asset_contract: Address,
        asset_id: u64,
        seller: Address,
        listing_type: ListingType,
        token_amount: i128,
        price_per_token_usdc: i128,
        payment_methods: Vec<Address>,
        minimum_purchase_usdc: i128,
        kyb_required: bool,
        expires_in_seconds: u64,
    ) -> Result<u64, Error> {
        seller.require_auth();

        // Validate inputs
        if token_amount <= 0 {
            return Err(Error::InvalidAmount);
        }

        if price_per_token_usdc <= 0 {
            return Err(Error::InvalidPrice);
        }

        if payment_methods.is_empty() {
            return Err(Error::InvalidPaymentMethod);
        }

        // Calculate total price
        let total_price = token_amount * price_per_token_usdc;

        // Get next listing ID
        let listing_count: u64 = env
            .storage()
            .instance()
            .get(&DataKey::ListingCount)
            .unwrap_or(0);
        let listing_id = listing_count + 1;

        // Create listing
        let current_time = env.ledger().timestamp();
        let listing = MarketplaceListing {
            listing_id,
            asset_contract: asset_contract.clone(),
            asset_id,
            seller: seller.clone(),
            listing_type,
            token_amount,
            price_per_token_usdc,
            total_price_usdc: total_price,
            payment_methods,
            minimum_purchase_usdc,
            kyb_required,
            status: ListingStatus::Active,
            created_at: current_time,
            expires_at: current_time + expires_in_seconds,
        };

        // Save listing
        env.storage().instance().set(&DataKey::Listing(listing_id), &listing);
        env.storage().instance().set(&DataKey::ListingCount, &listing_id);

        // Emit event
        env.events().publish(
            (symbol_short!("list"), seller, asset_id),
            listing_id,
        );

        Ok(listing_id)
    }

    /// Buy parking asset from marketplace listing
    pub fn buy_asset(
        env: Env,
        listing_id: u64,
        buyer: Address,
        token_amount: i128,
        payment_token: Address,
        is_kyb_verified: bool,
    ) -> Result<u64, Error> {
        buyer.require_auth();

        // Get listing
        let mut listing: MarketplaceListing = env
            .storage()
            .instance()
            .get(&DataKey::Listing(listing_id))
            .ok_or(Error::ListingNotFound)?;

        // Validate listing is active
        if listing.status != ListingStatus::Active {
            return Err(Error::ListingNotActive);
        }

        // Check expiration
        let current_time = env.ledger().timestamp();
        if listing.expires_at <= current_time {
            listing.status = ListingStatus::Expired;
            env.storage().instance().set(&DataKey::Listing(listing_id), &listing);
            return Err(Error::ListingExpired);
        }

        // Validate KYB if required
        if listing.kyb_required && !is_kyb_verified {
            return Err(Error::KYBRequired);
        }

        // Validate token amount
        if token_amount > listing.token_amount {
            return Err(Error::InsufficientTokens);
        }

        // Calculate purchase price
        let purchase_price = token_amount * listing.price_per_token_usdc;

        // Validate minimum purchase
        if purchase_price < listing.minimum_purchase_usdc {
            return Err(Error::BelowMinimumPurchase);
        }

        // Validate payment method
        let payment_accepted = listing.payment_methods.iter().any(|p| p == payment_token);
        if !payment_accepted {
            return Err(Error::InvalidPaymentMethod);
        }

        // Calculate platform fee
        let platform_fee_bp: u32 = env
            .storage()
            .instance()
            .get(&DataKey::PlatformFee)
            .unwrap_or(250); // Default 2.5%

        let platform_fee = (purchase_price * platform_fee_bp as i128) / 10000;
        let seller_receives = purchase_price - platform_fee;

        // Update listing
        listing.token_amount -= token_amount;
        if listing.token_amount == 0 {
            listing.status = ListingStatus::Sold;
        }
        env.storage().instance().set(&DataKey::Listing(listing_id), &listing);

        // Create trade record
        let trade_count: u64 = env
            .storage()
            .instance()
            .get(&DataKey::TradeCount)
            .unwrap_or(0);
        let trade_id = trade_count + 1;

        let trade = Trade {
            trade_id,
            listing_id,
            buyer: buyer.clone(),
            seller: listing.seller.clone(),
            token_amount,
            price_paid_usdc: purchase_price,
            payment_token: payment_token.clone(),
            traded_at: current_time,
        };

        env.storage().instance().set(&DataKey::Trade(trade_id), &trade);
        env.storage().instance().set(&DataKey::TradeCount, &trade_id);

        // Emit event
        env.events().publish(
            (symbol_short!("trade"), buyer, listing.seller.clone()),
            (token_amount, purchase_price),
        );

        Ok(trade_id)
    }

    /// Cancel marketplace listing
    pub fn cancel_listing(env: Env, listing_id: u64) -> Result<(), Error> {
        // Get listing
        let mut listing: MarketplaceListing = env
            .storage()
            .instance()
            .get(&DataKey::Listing(listing_id))
            .ok_or(Error::ListingNotFound)?;

        // Verify seller
        listing.seller.require_auth();

        // Validate listing can be cancelled
        if listing.status != ListingStatus::Active {
            return Err(Error::ListingNotActive);
        }

        // Update listing status
        listing.status = ListingStatus::Cancelled;
        env.storage().instance().set(&DataKey::Listing(listing_id), &listing);

        // Emit event
        env.events().publish(
            (symbol_short!("cancel"), listing_id),
            listing.seller,
        );

        Ok(())
    }

    /// Update platform fee (admin only)
    pub fn update_platform_fee(env: Env, new_fee_bp: u32) -> Result<(), Error> {
        let admin: Address = env
            .storage()
            .instance()
            .get(&DataKey::Admin)
            .ok_or(Error::NotInitialized)?;
        admin.require_auth();

        if new_fee_bp > 1000 {
            // Max 10% fee
            return Err(Error::InvalidFee);
        }

        env.storage().instance().set(&DataKey::PlatformFee, &new_fee_bp);

        Ok(())
    }

    /// Get marketplace listing by ID
    pub fn get_listing(env: Env, listing_id: u64) -> Result<MarketplaceListing, Error> {
        env.storage()
            .instance()
            .get(&DataKey::Listing(listing_id))
            .ok_or(Error::ListingNotFound)
    }

    /// Get trade by ID
    pub fn get_trade(env: Env, trade_id: u64) -> Option<Trade> {
        env.storage().instance().get(&DataKey::Trade(trade_id))
    }

    /// Check if listing is still valid
    pub fn is_listing_valid(env: Env, listing_id: u64) -> bool {
        if let Some(listing) = env.storage().instance().get::<_, MarketplaceListing>(&DataKey::Listing(listing_id)) {
            let current_time = env.ledger().timestamp();
            listing.status == ListingStatus::Active && listing.expires_at > current_time
        } else {
            false
        }
    }

    /// Get total number of listings
    pub fn get_listing_count(env: Env) -> u64 {
        env.storage().instance().get(&DataKey::ListingCount).unwrap_or(0)
    }

    /// Get total number of trades
    pub fn get_trade_count(env: Env) -> u64 {
        env.storage().instance().get(&DataKey::TradeCount).unwrap_or(0)
    }

    /// Get current platform fee
    pub fn get_platform_fee(env: Env) -> u32 {
        env.storage().instance().get(&DataKey::PlatformFee).unwrap_or(250)
    }
}

#[cfg(test)]
mod test {
    use super::*;
    use soroban_sdk::{testutils::Address as _, vec, Env};

    #[test]
    fn test_create_listing() {
        let env = Env::default();
        let contract_id = env.register_contract(None, MarketplaceContract);
        let client = MarketplaceContractClient::new(&env, &contract_id);

        let admin = Address::generate(&env);
        let seller = Address::generate(&env);
        let asset_contract = Address::generate(&env);
        let usdc = Address::generate(&env);

        env.mock_all_auths();

        client.initialize(&admin, &250u32); // 2.5% fee

        let listing_id = client.create_listing(
            &asset_contract,
            &1u64,
            &seller,
            &ListingType::Sale,
            &1000i128,
            &50_0000000i128,     // $50 per token
            &vec![&env, usdc.clone()],
            &100_0000000i128,    // $100 minimum
            &false,
            &86400u64,           // 24 hours
        );

        assert_eq!(listing_id, 1);

        let listing = client.get_listing(&1u64);
        assert_eq!(listing.token_amount, 1000);
        assert_eq!(listing.price_per_token_usdc, 50_0000000);
        assert_eq!(listing.status, ListingStatus::Active);
    }

    #[test]
    fn test_buy_asset() {
        let env = Env::default();
        let contract_id = env.register_contract(None, MarketplaceContract);
        let client = MarketplaceContractClient::new(&env, &contract_id);

        let admin = Address::generate(&env);
        let seller = Address::generate(&env);
        let buyer = Address::generate(&env);
        let asset_contract = Address::generate(&env);
        let usdc = Address::generate(&env);

        env.mock_all_auths();

        client.initialize(&admin, &250u32);

        let listing_id = client.create_listing(
            &asset_contract,
            &1u64,
            &seller,
            &ListingType::Sale,
            &1000i128,
            &50_0000000i128,
            &vec![&env, usdc.clone()],
            &100_0000000i128,
            &false,
            &86400u64,
        );

        // Buy 10 tokens
        let trade_id = client.buy_asset(
            &listing_id,
            &buyer,
            &10i128,
            &usdc,
            &false,
        );

        assert_eq!(trade_id, 1);

        let trade = client.get_trade(&1u64).unwrap();
        assert_eq!(trade.token_amount, 10);
        assert_eq!(trade.price_paid_usdc, 500_0000000); // 10 * $50

        let listing = client.get_listing(&listing_id);
        assert_eq!(listing.token_amount, 990); // 1000 - 10
        assert_eq!(listing.status, ListingStatus::Active);
    }

    #[test]
    fn test_cancel_listing() {
        let env = Env::default();
        let contract_id = env.register_contract(None, MarketplaceContract);
        let client = MarketplaceContractClient::new(&env, &contract_id);

        let admin = Address::generate(&env);
        let seller = Address::generate(&env);
        let asset_contract = Address::generate(&env);
        let usdc = Address::generate(&env);

        env.mock_all_auths();

        client.initialize(&admin, &250u32);

        let listing_id = client.create_listing(
            &asset_contract,
            &1u64,
            &seller,
            &ListingType::Sale,
            &1000i128,
            &50_0000000i128,
            &vec![&env, usdc],
            &100_0000000i128,
            &false,
            &86400u64,
        );

        client.cancel_listing(&listing_id);

        let listing = client.get_listing(&listing_id);
        assert_eq!(listing.status, ListingStatus::Cancelled);
    }
}
