// Parking Marketplace API Routes - DYNAMIC DEMO VERSION
// Mastercard DeFi Hackathon - Institutional Parking Asset Tokenization
// This version stores operator-created assets in memory for demo purposes

import express from 'express';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// ========================================
// DYNAMIC STORAGE (in-memory)
// ========================================
let nextListingId = 100;
let nextAssetId = 100;

// Dynamic listings created by operators
const dynamicListings = [];

// Dynamic assets created by operators
const dynamicAssets = [];

// Seed data - a few example listings to start with (optional)
const seedListings = [
  {
    listing_id: 1,
    parking_lot_name: 'Demo Parking Centralny',
    city: 'Warszawa',
    address: 'ul. Przykładowa 1',
    asset_type: 'revenue_share',
    organization_name: 'Miasto Warszawa',
    organization_type: 'municipality',
    operator_rating: 4.8,
    price_per_token_usdc: 100,
    token_amount: 1000,
    total_price_usdc: 100000,
    estimated_value_usdc: 500000,
    annual_revenue_usdc: 40000,
    asset_token_address: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
    asset_id: 1,
    payment_methods: ['USDC', 'EUROC', 'SOL'],
    created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

// Mock operator profile
const mockOperatorProfile = {
  id: 1,
  user_id: 1,
  organization_name: 'Miasto Warszawa',
  organization_type: 'municipality',
  registration_number: 'PL-123456789',
  tax_id: '5252123456',
  headquarters_city: 'Warszawa',
  headquarters_country: 'PL',
  total_parking_spots: 0, // Will be calculated dynamically
  total_parking_lots: 0, // Will be calculated dynamically
  total_tokenized_value_usdc: 0, // Will be calculated dynamically
  total_revenue_distributed_usdc: 0,
  kyb_verified: true,
  operator_rating: 4.8,
  is_verified: true,
  is_active: true,
};

const mockRevenueDistributions = [];

// ========================================
// MARKETPLACE LISTINGS
// ========================================

router.get('/listings', async (req, res) => {
  try {
    // Combine seed data with dynamically created listings
    const allListings = [...seedListings, ...dynamicListings];

    console.log(`📋 Fetching ${allListings.length} listings (${seedListings.length} seed + ${dynamicListings.length} dynamic)`);

    res.json({
      success: true,
      listings: allListings,
      count: allListings.length,
    });
  } catch (error) {
    console.error('Error fetching marketplace listings:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch marketplace listings',
    });
  }
});

router.get('/stats', async (req, res) => {
  try {
    const allListings = [...seedListings, ...dynamicListings];

    // Calculate stats dynamically
    const totalVolume = allListings.reduce((sum, l) => sum + l.total_price_usdc, 0);
    const totalAssets = allListings.length;
    const avgYield = allListings.length > 0
      ? allListings.reduce((sum, l) => {
          const yield_ = l.estimated_value_usdc > 0
            ? (l.annual_revenue_usdc / l.estimated_value_usdc) * 100
            : 0;
          return sum + yield_;
        }, 0) / allListings.length
      : 0;

    console.log(`📊 Market stats: ${totalAssets} assets, $${totalVolume} volume, ${avgYield.toFixed(1)}% avg yield`);

    res.json({
      totalVolume: Math.round(totalVolume),
      totalAssets,
      avgYield: parseFloat(avgYield.toFixed(1)),
      activeListings: totalAssets,
    });
  } catch (error) {
    console.error('Error fetching market stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch market stats',
    });
  }
});

router.post('/purchase', async (req, res) => {
  // No authentication required for demo
  try {
    const { listing_id, token_amount, total_amount_usdc, solana_tx_signature } = req.body;

    console.log('✅ Mock purchase recorded:', {
      listing_id,
      token_amount,
      total_amount_usdc,
      solana_tx_signature,
      buyer: req.user?.id || 'demo_user',
    });

    res.json({
      success: true,
      transaction_id: Math.floor(Math.random() * 10000),
      message: 'Purchase recorded successfully (DEMO MODE)',
    });
  } catch (error) {
    console.error('Error recording purchase:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to record purchase',
    });
  }
});

// ========================================
// INSTITUTIONAL OPERATORS
// ========================================

router.get('/profile', async (req, res) => {
  // No authentication required for demo
  try {
    // Calculate dynamic stats
    const totalSpots = dynamicAssets.reduce((sum, asset) => sum + asset.total_supply, 0);
    const totalValue = dynamicAssets.reduce((sum, asset) => sum + asset.estimated_value_usdc, 0);
    const totalLots = dynamicAssets.length;

    const profile = {
      ...mockOperatorProfile,
      total_parking_spots: totalSpots,
      total_parking_lots: totalLots,
      total_tokenized_value_usdc: totalValue,
    };

    console.log(`👤 Operator profile: ${totalLots} lots, ${totalSpots} spots, $${totalValue} tokenized`);

    res.json(profile);
  } catch (error) {
    console.error('Error fetching operator profile:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch operator profile',
    });
  }
});

router.get('/assets', async (req, res) => {
  // No authentication required for demo
  try {
    console.log(`📦 Fetching ${dynamicAssets.length} dynamically created assets`);

    res.json({
      success: true,
      assets: dynamicAssets,
    });
  } catch (error) {
    console.error('Error fetching assets:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch assets',
    });
  }
});

router.get('/listings', async (req, res) => {
  // No authentication required for demo
  try {
    res.json({
      success: true,
      listings: mockListings.filter(l => l.organization_name === mockOperatorProfile.organization_name),
    });
  } catch (error) {
    console.error('Error fetching listings:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch listings',
    });
  }
});

router.get('/revenue-distributions', async (req, res) => {
  // No authentication required for demo
  try {
    res.json({
      success: true,
      distributions: mockRevenueDistributions,
    });
  } catch (error) {
    console.error('Error fetching revenue distributions:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch revenue distributions',
    });
  }
});

router.post('/tokenize', async (req, res) => {
  // No authentication required for demo
  try {
    const {
      parking_lot_name,
      city,
      address,
      spot_number,
      asset_type,
      total_supply,
      estimated_value_usdc,
      annual_revenue_usdc,
      revenue_share_percentage,
      price_per_token_usdc,
    } = req.body;

    // Generate new asset ID and listing ID
    const assetId = nextAssetId++;
    const listingId = nextListingId++;

    // Generate a valid Solana token address (using various known addresses for demo)
    const tokenAddresses = [
      'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
      'So11111111111111111111111111111111111111112',
      '4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU',
      'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
      '11111111111111111111111111111111',
    ];
    const randomTokenAddress = tokenAddresses[Math.floor(Math.random() * tokenAddresses.length)];

    // Create new asset
    const newAsset = {
      id: assetId,
      spot_number,
      asset_type,
      total_supply: parseInt(total_supply),
      estimated_value_usdc: parseFloat(estimated_value_usdc),
      annual_revenue_usdc: parseFloat(annual_revenue_usdc),
      revenue_share_percentage: parseInt(revenue_share_percentage),
      compliance_status: 'compliant',
    };

    // Create new marketplace listing
    const newListing = {
      listing_id: listingId,
      parking_lot_name: parking_lot_name || `Parking ${spot_number}`,
      city: city || 'Warszawa',
      address: address || 'ul. Nowa 1',
      asset_type,
      organization_name: mockOperatorProfile.organization_name,
      organization_type: mockOperatorProfile.organization_type,
      operator_rating: mockOperatorProfile.operator_rating,
      price_per_token_usdc: parseFloat(price_per_token_usdc) || 100,
      token_amount: parseInt(total_supply),
      total_price_usdc: (parseFloat(price_per_token_usdc) || 100) * parseInt(total_supply),
      estimated_value_usdc: parseFloat(estimated_value_usdc),
      annual_revenue_usdc: parseFloat(annual_revenue_usdc),
      asset_token_address: randomTokenAddress,
      asset_id: assetId,
      payment_methods: ['USDC', 'EUROC', 'SOL'],
      created_at: new Date().toISOString(),
    };

    // Add to dynamic storage
    dynamicAssets.push(newAsset);
    dynamicListings.push(newListing);

    console.log('✅ Asset tokenized and listed:', {
      assetId,
      listingId,
      parking_lot_name: newListing.parking_lot_name,
      city: newListing.city,
      asset_type,
      total_supply,
      estimated_value_usdc,
    });

    res.json({
      success: true,
      asset_id: assetId,
      listing_id: listingId,
      message: 'Asset tokenized and listed successfully (DEMO MODE)',
      asset: newAsset,
      listing: newListing,
    });
  } catch (error) {
    console.error('Error tokenizing asset:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to tokenize asset',
    });
  }
});

router.post('/create-listing', async (req, res) => {
  // No authentication required for demo
  try {
    const {
      asset_id,
      listing_type,
      token_amount,
      price_per_token_usdc,
    } = req.body;

    console.log('✅ Mock listing created:', {
      asset_id,
      listing_type,
      token_amount,
      price_per_token_usdc,
      seller: req.user?.id || 'demo_user',
    });

    res.json({
      success: true,
      listing_id: Math.floor(Math.random() * 10000),
      message: 'Listing created successfully (DEMO MODE)',
    });
  } catch (error) {
    console.error('Error creating listing:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create listing',
    });
  }
});

export default router;
