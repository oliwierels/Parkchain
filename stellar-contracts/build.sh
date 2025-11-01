#!/bin/bash

# Build all Soroban contracts for Parkchain
# This script compiles contracts to WASM and prepares them for deployment

set -e

echo "🔨 Building Parkchain Soroban Contracts..."
echo ""

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Build DCP Token
echo -e "${BLUE}Building DCP Token contract...${NC}"
cd dcp-token
cargo build --target wasm32-unknown-unknown --release
echo -e "${GREEN}✓ DCP Token built${NC}"
echo ""

# Build Parking Asset
echo -e "${BLUE}Building Parking Asset contract...${NC}"
cd ../parking-asset
cargo build --target wasm32-unknown-unknown --release
echo -e "${GREEN}✓ Parking Asset built${NC}"
echo ""

# Build Marketplace
echo -e "${BLUE}Building Marketplace contract...${NC}"
cd ../marketplace
cargo build --target wasm32-unknown-unknown --release
echo -e "${GREEN}✓ Marketplace built${NC}"
echo ""

cd ..

# Create target directory for optimized WASMs
mkdir -p target/wasm32-unknown-unknown/release-optimized

echo -e "${BLUE}Optimizing contracts...${NC}"

# Note: In production, you would use stellar contract optimize here
# For now, we just copy the release builds
cp dcp-token/target/wasm32-unknown-unknown/release/dcp_token.wasm \
   target/wasm32-unknown-unknown/release-optimized/ || true

cp parking-asset/target/wasm32-unknown-unknown/release/parking_asset.wasm \
   target/wasm32-unknown-unknown/release-optimized/ || true

cp marketplace/target/wasm32-unknown-unknown/release/marketplace.wasm \
   target/wasm32-unknown-unknown/release-optimized/ || true

echo ""
echo -e "${GREEN}✅ All contracts built successfully!${NC}"
echo ""
echo "Built contracts:"
echo "  - DCP Token (Rewards token for EV charging)"
echo "  - Parking Asset (Tokenization of parking infrastructure)"
echo "  - Marketplace (Trading platform for parking assets)"
echo ""
echo "Contract WASMs are in: target/wasm32-unknown-unknown/release/"
