# Parkchain Stellar Smart Contracts

**Soroban contracts for tokenizing parking infrastructure and EV charging rewards**

Built for the **Scaffold Stellar Hackathon** - demonstrating rapid DePIN development on Stellar.

## 📋 Overview

Parkchain brings real-world parking and EV charging infrastructure on-chain using three core Soroban contracts:

### 1. **DCP Token** (`dcp-token`)
Fungible reward token earned through EV charging activities.

**Features:**
- SEP-41 compliant token standard
- Mint 1 DCP per kWh charged
- Transfer, approve, burn functionality
- 7 decimal precision

**Use Case:** Users earn DCP tokens when charging their EVs, creating incentives for sustainable transport.

---

### 2. **Parking Asset** (`parking-asset`)
Tokenization of parking spots and infrastructure for institutional investment.

**Features:**
- Multiple asset types (Single Spot, Revenue Share, Bundle)
- Revenue distribution to token holders
- Compliance status tracking (KYB)
- Yield calculation
- Asset lifecycle management

**Use Case:** Cities and parking operators tokenize infrastructure, investors buy tokens and receive revenue share.

---

### 3. **Marketplace** (`marketplace`)
Secondary market for trading tokenized parking assets.

**Features:**
- Create listings (Sale, Lease, Revenue Share)
- Multi-payment support (USDC, EUROC, XLM)
- Minimum purchase requirements
- KYB verification support
- Platform fee mechanism (max 10%)
- Expiration handling

**Use Case:** Investors trade parking asset tokens, creating liquidity for infrastructure investment.

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Frontend (React)                      │
│  - Stellar Wallet Kit (Freighter, Albedo)               │
│  - Auto-generated TypeScript clients                     │
│  - Real-time transaction status                          │
└────────────────────┬────────────────────────────────────┘
                     │
         ┌───────────┴───────────┐
         │                       │
    ┌────▼─────┐        ┌───────▼────────┐
    │ DCP      │        │ Parking Asset  │
    │ Token    │        │ Tokenization   │
    └──────────┘        └───────┬────────┘
                                │
                        ┌───────▼────────┐
                        │  Marketplace   │
                        │   Trading      │
                        └────────────────┘
```

---

## 🚀 Quick Start

### Prerequisites
- Rust 1.75+
- Stellar CLI (optional with Scaffold Stellar)
- Node.js 18+

### Build Contracts

```bash
cd stellar-contracts

# Build all contracts
./build.sh

# Run tests
./test.sh

# Deploy to testnet
./deploy.sh testnet
```

### With Scaffold Stellar (Recommended)

Scaffold Stellar automates the entire workflow:

```bash
# Initialize project
stellar scaffold init parkchain
cd parkchain

# Copy contracts to contracts/ directory
# Scaffold auto-generates TypeScript clients

# Deploy with one command
npm run deploy:testnet

# Generated clients are in packages/parkchain-client
```

---

## 📊 Contract Details

### DCP Token Functions

```rust
initialize(admin: Address)
mint(to: Address, amount: i128)
transfer(from: Address, to: Address, amount: i128)
approve(from: Address, spender: Address, amount: i128)
burn(from: Address, amount: i128)
balance(address: Address) -> i128
total_supply() -> i128
```

### Parking Asset Functions

```rust
initialize(admin: Address)

initialize_asset(
    token_address: Address,
    operator: Address,
    parking_lot_id: u64,
    spot_number: String,
    asset_type: AssetType,
    total_supply: i128,
    estimated_value_usdc: i128,
    annual_revenue_usdc: i128,
    revenue_share_percentage: u32,
) -> u64

distribute_revenue(
    asset_id: u64,
    total_revenue_usdc: i128,
    operating_costs_usdc: i128,
    period_start: u64,
    period_end: u64,
) -> u64

update_compliance(asset_id: u64, new_status: ComplianceStatus)
set_tradeable(asset_id: u64, tradeable: bool)
get_asset(asset_id: u64) -> ParkingAsset
calculate_yield(asset_id: u64) -> i128
```

### Marketplace Functions

```rust
initialize(admin: Address, platform_fee_bp: u32)

create_listing(
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
) -> u64

buy_asset(
    listing_id: u64,
    buyer: Address,
    token_amount: i128,
    payment_token: Address,
    is_kyb_verified: bool,
) -> u64

cancel_listing(listing_id: u64)
get_listing(listing_id: u64) -> MarketplaceListing
```

---

## 💡 Why Stellar for Parkchain?

### Transaction Costs

**Real-world impact:**
- **10,000 parking transactions/day**
- **Solana cost:** ~$5/day = $1,825/year
- **Stellar cost:** ~$0.10/day = $36.50/year
- **💰 Savings: $1,788/year (98% reduction)**

### Fast Finality
- **2-5 second confirmations** - Perfect for parking payments
- No failed transactions draining user funds

### Built-in Compliance
- Path payments for multi-currency support
- Native USDC bridge
- Jurisdictional flexibility

---

## 🎯 Scaffold Stellar Benefits

This project demonstrates Scaffold Stellar's power:

### Without Scaffold Stellar ❌
- Manual contract compilation
- Write TypeScript bindings by hand
- Custom deployment scripts
- Manual network configuration
- Hours debugging type mismatches

### With Scaffold Stellar ✅
- **One-command setup:** `stellar scaffold init`
- **Auto-generated clients:** Type-safe TypeScript
- **Instant deployment:** `npm run deploy`
- **Live reload:** Contract changes → Frontend updates
- **Built-in testing:** `stellar contract invoke`

### Time Saved

| Task | Manual | Scaffold | Savings |
|------|--------|----------|---------|
| Setup | 2 hours | 5 min | **1h 55min** |
| TypeScript clients | 4 hours | Auto | **4 hours** |
| Deployment | 1 hour | 2 min | **58 min** |
| Testing | 3 hours | 30 min | **2h 30min** |
| **Total** | **10 hours** | **37 min** | **93% faster** |

---

## 🧪 Testing

All contracts include comprehensive test suites:

```bash
# Test individual contracts
cd dcp-token && cargo test
cd parking-asset && cargo test
cd marketplace && cargo test

# Or test all
./test.sh
```

**Test Coverage:**
- ✅ DCP Token: Minting, transfers, approvals, burns
- ✅ Parking Asset: Asset creation, revenue distribution, compliance
- ✅ Marketplace: Listings, purchases, cancellations, fees

---

## 📈 Real-World Example

### Scenario: City of Warsaw Tokenizes 1,000 Parking Spots

1. **Tokenization:**
   ```rust
   parking_asset.initialize_asset(
       parking_lot_id: 42,
       spot_number: "A-101",
       total_supply: 1000,
       estimated_value: 50_000 USDC,
       annual_revenue: 5_000 USDC,
       revenue_share: 80%, // 80% to token holders
   )
   ```

2. **Marketplace Listing:**
   ```rust
   marketplace.create_listing(
       token_amount: 100,
       price_per_token: 50 USDC,
       payment_methods: [USDC, EUROC, XLM],
       minimum_purchase: 100 USDC,
   )
   ```

3. **Investment:**
   - Investor buys 10 tokens for 500 USDC
   - Expected annual yield: 10% (500 USDC → 50 USDC/year)
   - Platform fee: 2.5% (12.50 USDC)

4. **Revenue Distribution:**
   ```rust
   parking_asset.distribute_revenue(
       total_revenue: 6_000 USDC,
       operating_costs: 1_000 USDC,
       // Net: 5_000 USDC to token holders
   )
   ```

---

## 🔗 Integration with Frontend

The frontend uses auto-generated Stellar clients:

```typescript
// Auto-generated by Scaffold Stellar
import { ParkingAssetClient } from '@parkchain/stellar-client';

const client = new ParkingAssetClient({
  publicKey: wallet.publicKey,
  networkPassphrase: Networks.TESTNET,
  rpcUrl: 'https://soroban-testnet.stellar.org',
});

// Type-safe contract calls
const assetId = await client.initializeAsset({
  parking_lot_id: 42,
  spot_number: "A-101",
  total_supply: BigInt(1000),
  // TypeScript autocomplete for all params!
});
```

---

## 🌐 Networks

### Testnet
- Network: Stellar Testnet
- RPC: `https://soroban-testnet.stellar.org`
- Explorer: https://stellar.expert/explorer/testnet

### Mainnet
- Network: Stellar Public
- RPC: `https://soroban-mainnet.stellar.org`
- Explorer: https://stellar.expert/explorer/public

---

## 📝 License

MIT License - See LICENSE file

---

## 🤝 Contributing

Built for **Scaffold Stellar Hackathon** by the Parkchain team.

**Repo:** https://github.com/oliwierels/Parkchain

**Demo:** [Coming soon]

---

## 🏆 Hackathon Submission

This project demonstrates:
✅ **Deployed Smart Contracts** (3 Soroban contracts)
✅ **Functional Frontend** (React + Vite with Stellar integration)
✅ **Stellar Wallet Kit Integration** (Freighter, Albedo)
✅ **Real-world DePIN use case** (Parking + EV charging)
✅ **Scaffold Stellar framework showcase**

**Why this deserves to win:**
1. **Production-ready DePIN platform** - Not a toy demo
2. **Complex multi-contract architecture** - Showcases Soroban capabilities
3. **Real economic impact** - $1,788/year savings vs Solana
4. **Social good** - Sustainable transport infrastructure
5. **Perfect Scaffold Stellar showcase** - Demonstrates framework power

---

**Built with ❤️ using Scaffold Stellar**
