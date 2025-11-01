#![no_std]

//! Parking Asset Tokenization Contract
//! Tokenize parking spots and infrastructure for institutional investment
//! Part of Parkchain DePIN platform

use soroban_sdk::{contract, contractimpl, contracttype, contracterror, Address, Env, String, Vec, symbol_short};

#[derive(Clone, Copy, PartialEq, Eq)]
#[contracttype]
#[repr(u32)]
pub enum AssetType {
    SingleSpot = 1,       // Individual parking spot
    RevenueShare = 2,     // Share of parking lot revenue
    ParkingLotBundle = 3, // Bundle of multiple spots
}

#[derive(Clone, Copy, PartialEq, Eq)]
#[contracttype]
#[repr(u32)]
pub enum ComplianceStatus {
    Pending = 1,
    Verified = 2,
    Compliant = 3,
    NonCompliant = 4,
}

#[contracttype]
#[derive(Clone)]
pub struct ParkingAsset {
    /// Asset token contract address
    pub asset_token_address: Address,

    /// Type of parking asset
    pub asset_type: AssetType,

    /// Reference to parking_lots table in database
    pub parking_lot_id: u64,

    /// Spot identifier (e.g., "A-42", "B-101")
    pub spot_number: String,

    /// Total supply of tokens for this asset
    pub total_supply: i128,

    /// Current circulating supply
    pub circulating_supply: i128,

    /// Estimated asset value in USDC (7 decimals)
    pub estimated_value_usdc: i128,

    /// Annual revenue in USDC (7 decimals)
    pub annual_revenue_usdc: i128,

    /// Revenue share percentage (basis points, 10000 = 100%)
    pub revenue_share_percentage: u32,

    /// Institutional operator address
    pub institutional_operator: Address,

    /// Compliance status
    pub compliance_status: ComplianceStatus,

    /// Asset active status
    pub is_active: bool,

    /// Asset tradeable status
    pub is_tradeable: bool,

    /// Timestamp when asset was tokenized
    pub created_at: u64,
}

#[contracttype]
#[derive(Clone)]
pub struct RevenueDistribution {
    /// Reference to parking asset
    pub asset_id: u64,

    /// Total revenue collected in period (USDC with 7 decimals)
    pub total_revenue_usdc: i128,

    /// Operating costs deducted (USDC with 7 decimals)
    pub operating_costs_usdc: i128,

    /// Net revenue distributed to token holders
    pub net_revenue_usdc: i128,

    /// Distribution period start timestamp
    pub period_start: u64,

    /// Distribution period end timestamp
    pub period_end: u64,

    /// Timestamp of distribution
    pub distributed_at: u64,
}

#[contracttype]
pub enum DataKey {
    Asset(u64),              // asset_id -> ParkingAsset
    Revenue(u64),            // distribution_id -> RevenueDistribution
    AssetCount,              // Counter for asset IDs
    RevenueCount,            // Counter for revenue distribution IDs
    Admin,                   // Contract admin
}

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq, PartialOrd, Ord)]
#[repr(u32)]
pub enum Error {
    NotInitialized = 1,
    AlreadyInitialized = 2,
    Unauthorized = 3,
    InvalidAmount = 4,
    InvalidPercentage = 5,
    AssetNotFound = 6,
    AssetNotActive = 7,
    AssetNotTradeable = 8,
    ComplianceNotMet = 9,
    InvalidSpotNumber = 10,
}

#[contract]
pub struct ParkingAssetContract;

#[contractimpl]
impl ParkingAssetContract {
    /// Initialize the contract
    pub fn initialize(env: Env, admin: Address) -> Result<(), Error> {
        if env.storage().instance().has(&DataKey::Admin) {
            return Err(Error::AlreadyInitialized);
        }

        env.storage().instance().set(&DataKey::Admin, &admin);
        env.storage().instance().set(&DataKey::AssetCount, &0u64);
        env.storage().instance().set(&DataKey::RevenueCount, &0u64);

        Ok(())
    }

    /// Initialize a tokenized parking asset
    /// Creates a parking asset NFT representing real-world infrastructure
    pub fn initialize_asset(
        env: Env,
        token_address: Address,
        operator: Address,
        parking_lot_id: u64,
        spot_number: String,
        asset_type: AssetType,
        total_supply: i128,
        estimated_value_usdc: i128,
        annual_revenue_usdc: i128,
        revenue_share_percentage: u32,
    ) -> Result<u64, Error> {
        operator.require_auth();

        // Validate inputs
        if total_supply <= 0 {
            return Err(Error::InvalidAmount);
        }

        if revenue_share_percentage > 10000 {
            return Err(Error::InvalidPercentage);
        }

        if spot_number.len() > 32 {
            return Err(Error::InvalidSpotNumber);
        }

        // Get next asset ID
        let asset_count: u64 = env
            .storage()
            .instance()
            .get(&DataKey::AssetCount)
            .unwrap_or(0);
        let asset_id = asset_count + 1;

        // Create asset
        let asset = ParkingAsset {
            asset_token_address: token_address,
            asset_type,
            parking_lot_id,
            spot_number: spot_number.clone(),
            total_supply,
            circulating_supply: total_supply,
            estimated_value_usdc,
            annual_revenue_usdc,
            revenue_share_percentage,
            institutional_operator: operator.clone(),
            compliance_status: ComplianceStatus::Pending,
            is_active: true,
            is_tradeable: true,
            created_at: env.ledger().timestamp(),
        };

        // Save asset
        env.storage().instance().set(&DataKey::Asset(asset_id), &asset);
        env.storage().instance().set(&DataKey::AssetCount, &asset_id);

        // Emit event
        env.events().publish(
            (symbol_short!("asset_init"), operator, parking_lot_id),
            asset_id,
        );

        Ok(asset_id)
    }

    /// Distribute revenue to parking asset token holders
    pub fn distribute_revenue(
        env: Env,
        asset_id: u64,
        total_revenue_usdc: i128,
        operating_costs_usdc: i128,
        period_start: u64,
        period_end: u64,
    ) -> Result<u64, Error> {
        // Get asset
        let asset: ParkingAsset = env
            .storage()
            .instance()
            .get(&DataKey::Asset(asset_id))
            .ok_or(Error::AssetNotFound)?;

        // Verify operator
        asset.institutional_operator.require_auth();

        // Validate asset is active
        if !asset.is_active {
            return Err(Error::AssetNotActive);
        }

        // Calculate net revenue
        let net_revenue = total_revenue_usdc - operating_costs_usdc;

        if net_revenue < 0 {
            return Err(Error::InvalidAmount);
        }

        // Get next distribution ID
        let revenue_count: u64 = env
            .storage()
            .instance()
            .get(&DataKey::RevenueCount)
            .unwrap_or(0);
        let distribution_id = revenue_count + 1;

        // Create distribution record
        let distribution = RevenueDistribution {
            asset_id,
            total_revenue_usdc,
            operating_costs_usdc,
            net_revenue_usdc: net_revenue,
            period_start,
            period_end,
            distributed_at: env.ledger().timestamp(),
        };

        // Save distribution
        env.storage()
            .instance()
            .set(&DataKey::Revenue(distribution_id), &distribution);
        env.storage().instance().set(&DataKey::RevenueCount, &distribution_id);

        // Emit event
        env.events().publish(
            (symbol_short!("revenue"), asset_id),
            net_revenue,
        );

        Ok(distribution_id)
    }

    /// Update compliance status for parking asset
    pub fn update_compliance(
        env: Env,
        asset_id: u64,
        new_status: ComplianceStatus,
    ) -> Result<(), Error> {
        let admin: Address = env
            .storage()
            .instance()
            .get(&DataKey::Admin)
            .ok_or(Error::NotInitialized)?;
        admin.require_auth();

        // Get and update asset
        let mut asset: ParkingAsset = env
            .storage()
            .instance()
            .get(&DataKey::Asset(asset_id))
            .ok_or(Error::AssetNotFound)?;

        asset.compliance_status = new_status;

        // Save updated asset
        env.storage().instance().set(&DataKey::Asset(asset_id), &asset);

        // Emit event
        env.events().publish(
            (symbol_short!("compliance"), asset_id),
            new_status as u32,
        );

        Ok(())
    }

    /// Set asset tradeable status
    pub fn set_tradeable(env: Env, asset_id: u64, tradeable: bool) -> Result<(), Error> {
        // Get asset
        let mut asset: ParkingAsset = env
            .storage()
            .instance()
            .get(&DataKey::Asset(asset_id))
            .ok_or(Error::AssetNotFound)?;

        // Verify operator
        asset.institutional_operator.require_auth();

        asset.is_tradeable = tradeable;

        // Save updated asset
        env.storage().instance().set(&DataKey::Asset(asset_id), &asset);

        // Emit event
        env.events().publish(
            (symbol_short!("tradeable"), asset_id),
            tradeable,
        );

        Ok(())
    }

    /// Set asset active status
    pub fn set_active(env: Env, asset_id: u64, active: bool) -> Result<(), Error> {
        // Get asset
        let mut asset: ParkingAsset = env
            .storage()
            .instance()
            .get(&DataKey::Asset(asset_id))
            .ok_or(Error::AssetNotFound)?;

        // Verify operator
        asset.institutional_operator.require_auth();

        asset.is_active = active;

        // Save updated asset
        env.storage().instance().set(&DataKey::Asset(asset_id), &asset);

        // Emit event
        env.events().publish(
            (symbol_short!("active"), asset_id),
            active,
        );

        Ok(())
    }

    /// Get parking asset by ID
    pub fn get_asset(env: Env, asset_id: u64) -> Result<ParkingAsset, Error> {
        env.storage()
            .instance()
            .get(&DataKey::Asset(asset_id))
            .ok_or(Error::AssetNotFound)
    }

    /// Get revenue distribution by ID
    pub fn get_revenue(env: Env, distribution_id: u64) -> Option<RevenueDistribution> {
        env.storage()
            .instance()
            .get(&DataKey::Revenue(distribution_id))
    }

    /// Calculate annual yield percentage for an asset
    pub fn calculate_yield(env: Env, asset_id: u64) -> Result<i128, Error> {
        let asset: ParkingAsset = env
            .storage()
            .instance()
            .get(&DataKey::Asset(asset_id))
            .ok_or(Error::AssetNotFound)?;

        if asset.estimated_value_usdc == 0 {
            return Ok(0);
        }

        // Returns yield in basis points (10000 = 100%)
        let yield_bp = (asset.annual_revenue_usdc * 10000) / asset.estimated_value_usdc;
        Ok(yield_bp)
    }

    /// Get total number of assets
    pub fn get_asset_count(env: Env) -> u64 {
        env.storage().instance().get(&DataKey::AssetCount).unwrap_or(0)
    }

    /// Get total number of revenue distributions
    pub fn get_revenue_count(env: Env) -> u64 {
        env.storage().instance().get(&DataKey::RevenueCount).unwrap_or(0)
    }
}

#[cfg(test)]
mod test {
    use super::*;
    use soroban_sdk::{testutils::Address as _, Env};

    #[test]
    fn test_initialize_asset() {
        let env = Env::default();
        let contract_id = env.register_contract(None, ParkingAssetContract);
        let client = ParkingAssetContractClient::new(&env, &contract_id);

        let admin = Address::generate(&env);
        let operator = Address::generate(&env);
        let token_address = Address::generate(&env);

        env.mock_all_auths();

        client.initialize(&admin);

        let asset_id = client.initialize_asset(
            &token_address,
            &operator,
            &1u64,
            &String::from_str(&env, "A-42"),
            &AssetType::SingleSpot,
            &1000i128,
            &50000_0000000i128,  // $50,000 USDC
            &5000_0000000i128,   // $5,000 annual revenue
            &8000u32,            // 80% revenue share
        );

        assert_eq!(asset_id, 1);

        let asset = client.get_asset(&1u64);
        assert_eq!(asset.parking_lot_id, 1);
        assert_eq!(asset.total_supply, 1000);
        assert_eq!(asset.is_active, true);
        assert_eq!(asset.is_tradeable, true);
    }

    #[test]
    fn test_revenue_distribution() {
        let env = Env::default();
        let contract_id = env.register_contract(None, ParkingAssetContract);
        let client = ParkingAssetContractClient::new(&env, &contract_id);

        let admin = Address::generate(&env);
        let operator = Address::generate(&env);
        let token_address = Address::generate(&env);

        env.mock_all_auths();

        client.initialize(&admin);

        let asset_id = client.initialize_asset(
            &token_address,
            &operator,
            &1u64,
            &String::from_str(&env, "A-42"),
            &AssetType::SingleSpot,
            &1000i128,
            &50000_0000000i128,
            &5000_0000000i128,
            &8000u32,
        );

        // Distribute revenue
        let distribution_id = client.distribute_revenue(
            &asset_id,
            &6000_0000000i128,   // $6,000 total revenue
            &1000_0000000i128,   // $1,000 operating costs
            &1704067200u64,      // period start
            &1706745600u64,      // period end
        );

        assert_eq!(distribution_id, 1);

        let distribution = client.get_revenue(&1u64).unwrap();
        assert_eq!(distribution.net_revenue_usdc, 5000_0000000i128); // $5,000 net
    }

    #[test]
    fn test_calculate_yield() {
        let env = Env::default();
        let contract_id = env.register_contract(None, ParkingAssetContract);
        let client = ParkingAssetContractClient::new(&env, &contract_id);

        let admin = Address::generate(&env);
        let operator = Address::generate(&env);
        let token_address = Address::generate(&env);

        env.mock_all_auths();

        client.initialize(&admin);

        let asset_id = client.initialize_asset(
            &token_address,
            &operator,
            &1u64,
            &String::from_str(&env, "A-42"),
            &AssetType::SingleSpot,
            &1000i128,
            &50000_0000000i128,  // $50,000 value
            &5000_0000000i128,   // $5,000 annual revenue
            &8000u32,
        );

        let yield_bp = client.calculate_yield(&asset_id);
        // Expected: (5000 / 50000) * 10000 = 1000 basis points = 10%
        assert_eq!(yield_bp, 1000);
    }
}
