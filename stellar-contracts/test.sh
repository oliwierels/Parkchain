#!/bin/bash

# Run tests for all Parkchain Soroban contracts

set -e

echo "🧪 Running Parkchain contract tests..."
echo ""

GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

# Test DCP Token
echo -e "${BLUE}Testing DCP Token...${NC}"
cd dcp-token
cargo test
echo -e "${GREEN}✓ DCP Token tests passed${NC}"
echo ""

# Test Parking Asset
echo -e "${BLUE}Testing Parking Asset...${NC}"
cd ../parking-asset
cargo test
echo -e "${GREEN}✓ Parking Asset tests passed${NC}"
echo ""

# Test Marketplace
echo -e "${BLUE}Testing Marketplace...${NC}"
cd ../marketplace
cargo test
echo -e "${GREEN}✓ Marketplace tests passed${NC}"
echo ""

cd ..

echo -e "${GREEN}✅ All tests passed!${NC}"
