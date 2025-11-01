#!/bin/bash

# Deploy Parkchain contracts to Stellar network
# Usage: ./deploy.sh [testnet|mainnet]

set -e

NETWORK=${1:-testnet}

echo "🚀 Deploying Parkchain contracts to Stellar ${NETWORK}..."
echo ""

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Check if stellar CLI is installed
if ! command -v stellar &> /dev/null; then
    echo -e "${YELLOW}⚠️  Stellar CLI not found!${NC}"
    echo "Please install it from: https://developers.stellar.org/docs/tools/developer-tools/cli/install-cli"
    echo ""
    echo "For Scaffold Stellar users, this is automatically handled by the framework."
    exit 1
fi

# Build contracts first
echo -e "${BLUE}Building contracts...${NC}"
./build.sh

echo ""
echo -e "${BLUE}Deploying to ${NETWORK}...${NC}"
echo ""

# Note: Actual deployment would use stellar contract deploy
# This is a template showing what Scaffold Stellar automates

echo -e "${GREEN}📝 Deployment Instructions:${NC}"
echo ""
echo "With Scaffold Stellar, deployment is automated:"
echo ""
echo "  1. stellar contract deploy \\"
echo "       --wasm target/wasm32-unknown-unknown/release/dcp_token.wasm \\"
echo "       --network ${NETWORK}"
echo ""
echo "  2. stellar contract deploy \\"
echo "       --wasm target/wasm32-unknown-unknown/release/parking_asset.wasm \\"
echo "       --network ${NETWORK}"
echo ""
echo "  3. stellar contract deploy \\"
echo "       --wasm target/wasm32-unknown-unknown/release/marketplace.wasm \\"
echo "       --network ${NETWORK}"
echo ""
echo -e "${YELLOW}💡 Scaffold Stellar automates this entire process!${NC}"
echo "   It also generates TypeScript clients automatically."
echo ""
