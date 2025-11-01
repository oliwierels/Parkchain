#![no_std]

//! DCP (DeCharge Points) Token Contract
//! Fungible token rewarding users for EV charging on Parkchain
//! Compliant with Stellar Token Interface (SEP-41)

use soroban_sdk::{contract, contractimpl, contracttype, Address, Env, String, symbol_short};

const DECIMALS: u32 = 7;
const NAME: &str = "DeCharge Points";
const SYMBOL: &str = "DCP";

#[derive(Clone)]
#[contracttype]
pub struct AllowanceDataKey {
    pub from: Address,
    pub spender: Address,
}

#[derive(Clone)]
#[contracttype]
pub enum DataKey {
    Allowance(AllowanceDataKey),
    Balance(Address),
    TotalSupply,
    Admin,
}

#[contract]
pub struct DCPToken;

#[contractimpl]
impl DCPToken {
    /// Initialize the DCP token
    pub fn initialize(env: Env, admin: Address) {
        if env.storage().instance().has(&DataKey::Admin) {
            panic!("Already initialized");
        }

        env.storage().instance().set(&DataKey::Admin, &admin);
        env.storage().instance().set(&DataKey::TotalSupply, &0i128);
    }

    /// Mint new DCP tokens (only admin)
    /// Used to reward users for EV charging (1 DCP per kWh)
    pub fn mint(env: Env, to: Address, amount: i128) {
        let admin: Address = env.storage().instance().get(&DataKey::Admin).unwrap();
        admin.require_auth();

        if amount <= 0 {
            panic!("Amount must be positive");
        }

        // Update recipient balance
        let balance = Self::balance(env.clone(), to.clone());
        env.storage().instance().set(&DataKey::Balance(to.clone()), &(balance + amount));

        // Update total supply
        let total_supply: i128 = env.storage().instance().get(&DataKey::TotalSupply).unwrap_or(0);
        env.storage().instance().set(&DataKey::TotalSupply, &(total_supply + amount));

        // Emit event
        env.events().publish((symbol_short!("mint"), to), amount);
    }

    /// Transfer tokens
    pub fn transfer(env: Env, from: Address, to: Address, amount: i128) {
        from.require_auth();

        if amount <= 0 {
            panic!("Amount must be positive");
        }

        let from_balance = Self::balance(env.clone(), from.clone());
        if from_balance < amount {
            panic!("Insufficient balance");
        }

        // Update balances
        env.storage().instance().set(&DataKey::Balance(from.clone()), &(from_balance - amount));

        let to_balance = Self::balance(env.clone(), to.clone());
        env.storage().instance().set(&DataKey::Balance(to.clone()), &(to_balance + amount));

        // Emit event
        env.events().publish((symbol_short!("transfer"), from, to), amount);
    }

    /// Transfer tokens from allowance
    pub fn transfer_from(env: Env, spender: Address, from: Address, to: Address, amount: i128) {
        spender.require_auth();

        if amount <= 0 {
            panic!("Amount must be positive");
        }

        // Check and update allowance
        let allowance_key = AllowanceDataKey {
            from: from.clone(),
            spender: spender.clone(),
        };
        let allowance: i128 = env
            .storage()
            .instance()
            .get(&DataKey::Allowance(allowance_key.clone()))
            .unwrap_or(0);

        if allowance < amount {
            panic!("Insufficient allowance");
        }

        env.storage().instance().set(
            &DataKey::Allowance(allowance_key),
            &(allowance - amount),
        );

        // Check and update balances
        let from_balance = Self::balance(env.clone(), from.clone());
        if from_balance < amount {
            panic!("Insufficient balance");
        }

        env.storage().instance().set(&DataKey::Balance(from.clone()), &(from_balance - amount));

        let to_balance = Self::balance(env.clone(), to.clone());
        env.storage().instance().set(&DataKey::Balance(to.clone()), &(to_balance + amount));

        // Emit event
        env.events().publish((symbol_short!("transfer"), from, to), amount);
    }

    /// Burn tokens
    pub fn burn(env: Env, from: Address, amount: i128) {
        from.require_auth();

        if amount <= 0 {
            panic!("Amount must be positive");
        }

        let balance = Self::balance(env.clone(), from.clone());
        if balance < amount {
            panic!("Insufficient balance");
        }

        // Update balance
        env.storage().instance().set(&DataKey::Balance(from.clone()), &(balance - amount));

        // Update total supply
        let total_supply: i128 = env.storage().instance().get(&DataKey::TotalSupply).unwrap_or(0);
        env.storage().instance().set(&DataKey::TotalSupply, &(total_supply - amount));

        // Emit event
        env.events().publish((symbol_short!("burn"), from), amount);
    }

    /// Approve spender to use tokens
    pub fn approve(env: Env, from: Address, spender: Address, amount: i128) {
        from.require_auth();

        let allowance_key = AllowanceDataKey {
            from: from.clone(),
            spender: spender.clone(),
        };

        env.storage().instance().set(&DataKey::Allowance(allowance_key), &amount);

        // Emit event
        env.events().publish((symbol_short!("approve"), from, spender), amount);
    }

    /// Get balance of address
    pub fn balance(env: Env, address: Address) -> i128 {
        env.storage()
            .instance()
            .get(&DataKey::Balance(address))
            .unwrap_or(0)
    }

    /// Get allowance
    pub fn allowance(env: Env, from: Address, spender: Address) -> i128 {
        let allowance_key = AllowanceDataKey { from, spender };
        env.storage()
            .instance()
            .get(&DataKey::Allowance(allowance_key))
            .unwrap_or(0)
    }

    /// Get total supply
    pub fn total_supply(env: Env) -> i128 {
        env.storage().instance().get(&DataKey::TotalSupply).unwrap_or(0)
    }

    /// Get token decimals
    pub fn decimals(_env: Env) -> u32 {
        DECIMALS
    }

    /// Get token name
    pub fn name(_env: Env) -> String {
        String::from_str(&_env, NAME)
    }

    /// Get token symbol
    pub fn symbol(_env: Env) -> String {
        String::from_str(&_env, SYMBOL)
    }
}

#[cfg(test)]
mod test {
    use super::*;
    use soroban_sdk::testutils::{Address as _, Events};
    use soroban_sdk::{vec, Env, IntoVal};

    #[test]
    fn test_initialize() {
        let env = Env::default();
        let contract_id = env.register_contract(None, DCPToken);
        let client = DCPTokenClient::new(&env, &contract_id);

        let admin = Address::generate(&env);

        client.initialize(&admin);

        assert_eq!(client.total_supply(), 0);
        assert_eq!(client.decimals(), DECIMALS);
    }

    #[test]
    fn test_mint_and_transfer() {
        let env = Env::default();
        let contract_id = env.register_contract(None, DCPToken);
        let client = DCPTokenClient::new(&env, &contract_id);

        let admin = Address::generate(&env);
        let user1 = Address::generate(&env);
        let user2 = Address::generate(&env);

        env.mock_all_auths();

        client.initialize(&admin);

        // Mint 100 DCP to user1 (simulating 100 kWh charged)
        client.mint(&user1, &100_0000000); // 100 DCP with 7 decimals
        assert_eq!(client.balance(&user1), 100_0000000);
        assert_eq!(client.total_supply(), 100_0000000);

        // Transfer 30 DCP from user1 to user2
        client.transfer(&user1, &user2, &30_0000000);
        assert_eq!(client.balance(&user1), 70_0000000);
        assert_eq!(client.balance(&user2), 30_0000000);
    }

    #[test]
    fn test_approve_and_transfer_from() {
        let env = Env::default();
        let contract_id = env.register_contract(None, DCPToken);
        let client = DCPTokenClient::new(&env, &contract_id);

        let admin = Address::generate(&env);
        let user1 = Address::generate(&env);
        let user2 = Address::generate(&env);
        let spender = Address::generate(&env);

        env.mock_all_auths();

        client.initialize(&admin);
        client.mint(&user1, &100_0000000);

        // User1 approves spender to spend 50 DCP
        client.approve(&user1, &spender, &50_0000000);
        assert_eq!(client.allowance(&user1, &spender), 50_0000000);

        // Spender transfers 30 DCP from user1 to user2
        client.transfer_from(&spender, &user1, &user2, &30_0000000);
        assert_eq!(client.balance(&user1), 70_0000000);
        assert_eq!(client.balance(&user2), 30_0000000);
        assert_eq!(client.allowance(&user1, &spender), 20_0000000);
    }

    #[test]
    fn test_burn() {
        let env = Env::default();
        let contract_id = env.register_contract(None, DCPToken);
        let client = DCPTokenClient::new(&env, &contract_id);

        let admin = Address::generate(&env);
        let user1 = Address::generate(&env);

        env.mock_all_auths();

        client.initialize(&admin);
        client.mint(&user1, &100_0000000);

        // User1 burns 25 DCP
        client.burn(&user1, &25_0000000);
        assert_eq!(client.balance(&user1), 75_0000000);
        assert_eq!(client.total_supply(), 75_0000000);
    }
}
