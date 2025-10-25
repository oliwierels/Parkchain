// Parking Marketplace API Routes - MOCK DATA VERSION
// Mastercard DeFi Hackathon - Institutional Parking Asset Tokenization
// This version returns mock data for demo purposes

import express from 'express';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Mock data
const mockListings = [
  {
    listing_id: 1,
    parking_lot_name: 'Warszawski Parking Centralny',
    city: 'Warszawa',
    address: 'ul. Marszałkowska 142',
    asset_type: 'revenue_share',
    organization_name: 'Miasto Warszawa',
    organization_type: 'municipality',
    operator_rating: 4.8,
    price_per_token_usdc: 100,
    token_amount: 1000,
    total_price_usdc: 100000,
    estimated_value_usdc: 500000,
    annual_revenue_usdc: 40000,
    asset_token_address: 'PARK1234567890abcdefghijklmnopqrstuvwxyz',
    asset_id: 1,
    payment_methods: ['USDC', 'EUROC', 'SOL'],
    created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    listing_id: 2,
    parking_lot_name: 'Kraków Airport Parking',
    city: 'Kraków',
    address: 'ul. Kapitana Medweckiego 1',
    asset_type: 'parking_lot_bundle',
    organization_name: 'Kraków Airport Authority',
    organization_type: 'airport',
    operator_rating: 4.9,
    price_per_token_usdc: 250,
    token_amount: 500,
    total_price_usdc: 125000,
    estimated_value_usdc: 800000,
    annual_revenue_usdc: 64000,
    asset_token_address: 'PARK2345678901bcdefghijklmnopqrstuvwxyza',
    asset_id: 2,
    payment_methods: ['USDC', 'EUROC'],
    created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    listing_id: 3,
    parking_lot_name: 'Wrocław Tech Park',
    city: 'Wrocław',
    address: 'ul. Legnicka 57',
    asset_type: 'single_spot',
    organization_name: 'Wrocław Technology Park',
    organization_type: 'private_company',
    operator_rating: 4.6,
    price_per_token_usdc: 50,
    token_amount: 200,
    total_price_usdc: 10000,
    estimated_value_usdc: 120000,
    annual_revenue_usdc: 9600,
    asset_token_address: 'PARK3456789012cdefghijklmnopqrstuvwxyzab',
    asset_id: 3,
    payment_methods: ['USDC'],
    created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    listing_id: 4,
    parking_lot_name: 'Poznań University Campus',
    city: 'Poznań',
    address: 'ul. Wieniawskiego 1',
    asset_type: 'revenue_share',
    organization_name: 'Adam Mickiewicz University',
    organization_type: 'university',
    operator_rating: 4.7,
    price_per_token_usdc: 75,
    token_amount: 800,
    total_price_usdc: 60000,
    estimated_value_usdc: 350000,
    annual_revenue_usdc: 28000,
    asset_token_address: 'PARK4567890123defghijklmnopqrstuvwxyzabc',
    asset_id: 4,
    payment_methods: ['USDC', 'EUROC', 'SOL'],
    created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    listing_id: 5,
    parking_lot_name: 'Gdańsk Shopping Center',
    city: 'Gdańsk',
    address: 'al. Grunwaldzka 141',
    asset_type: 'parking_lot_bundle',
    organization_name: 'Baltic Shopping Group',
    organization_type: 'private_company',
    operator_rating: 4.5,
    price_per_token_usdc: 150,
    token_amount: 600,
    total_price_usdc: 90000,
    estimated_value_usdc: 600000,
    annual_revenue_usdc: 48000,
    asset_token_address: 'PARK5678901234efghijklmnopqrstuvwxyzabcd',
    asset_id: 5,
    payment_methods: ['USDC'],
    created_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

const mockOperatorProfile = {
  id: 1,
  user_id: 1,
  organization_name: 'Miasto Warszawa',
  organization_type: 'municipality',
  registration_number: 'PL-123456789',
  tax_id: '5252123456',
  headquarters_city: 'Warszawa',
  headquarters_country: 'PL',
  total_parking_spots: 15000,
  total_parking_lots: 45,
  total_tokenized_value_usdc: 5000000,
  total_revenue_distributed_usdc: 250000,
  kyb_verified: true,
  operator_rating: 4.8,
  is_verified: true,
  is_active: true,
};

const mockAssets = [
  {
    id: 1,
    spot_number: 'A-42',
    asset_type: 'single_spot',
    total_supply: 1,
    estimated_value_usdc: 5000,
    annual_revenue_usdc: 400,
    revenue_share_percentage: 50,
    compliance_status: 'compliant',
  },
  {
    id: 2,
    spot_number: 'Bundle-Downtown',
    asset_type: 'parking_lot_bundle',
    total_supply: 100,
    estimated_value_usdc: 500000,
    annual_revenue_usdc: 40000,
    revenue_share_percentage: 60,
    compliance_status: 'compliant',
  },
  {
    id: 3,
    spot_number: 'Revenue-Share-1',
    asset_type: 'revenue_share',
    total_supply: 1000,
    estimated_value_usdc: 1000000,
    annual_revenue_usdc: 80000,
    revenue_share_percentage: 70,
    compliance_status: 'pending',
  },
];

const mockRevenueDistributions = [
  {
    period_start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    period_end: new Date().toISOString(),
    total_revenue_usdc: 5000,
    total_distributed_usdc: 2500,
    payment_status: 'completed',
    asset_spot_number: 'A-42',
  },
  {
    period_start: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
    period_end: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    total_revenue_usdc: 4800,
    total_distributed_usdc: 2400,
    payment_status: 'completed',
    asset_spot_number: 'Bundle-Downtown',
  },
];

// ========================================
// MARKETPLACE LISTINGS
// ========================================

router.get('/listings', async (req, res) => {
  try {
    res.json({
      success: true,
      listings: mockListings,
      count: mockListings.length,
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
    res.json({
      totalVolume: 385000,
      totalAssets: 5,
      avgYield: 8.0,
      activeListings: 5,
    });
  } catch (error) {
    console.error('Error fetching market stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch market stats',
    });
  }
});

router.post('/purchase', authenticateToken, async (req, res) => {
  try {
    const { listing_id, token_amount, total_amount_usdc, solana_tx_signature } = req.body;

    console.log('✅ Mock purchase recorded:', {
      listing_id,
      token_amount,
      total_amount_usdc,
      solana_tx_signature,
      buyer: req.user?.id,
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

router.get('/profile', authenticateToken, async (req, res) => {
  try {
    res.json(mockOperatorProfile);
  } catch (error) {
    console.error('Error fetching operator profile:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch operator profile',
    });
  }
});

router.get('/assets', authenticateToken, async (req, res) => {
  try {
    res.json({
      success: true,
      assets: mockAssets,
    });
  } catch (error) {
    console.error('Error fetching assets:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch assets',
    });
  }
});

router.get('/listings', authenticateToken, async (req, res) => {
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

router.get('/revenue-distributions', authenticateToken, async (req, res) => {
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

router.post('/tokenize', authenticateToken, async (req, res) => {
  try {
    const {
      parking_lot_id,
      spot_number,
      asset_type,
      total_supply,
      estimated_value_usdc,
      annual_revenue_usdc,
      revenue_share_percentage,
    } = req.body;

    console.log('✅ Mock asset tokenized:', {
      parking_lot_id,
      spot_number,
      asset_type,
      total_supply,
      estimated_value_usdc,
      annual_revenue_usdc,
      revenue_share_percentage,
      operator: req.user?.id,
    });

    res.json({
      success: true,
      asset_id: Math.floor(Math.random() * 10000),
      message: 'Asset tokenized successfully (DEMO MODE)',
    });
  } catch (error) {
    console.error('Error tokenizing asset:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to tokenize asset',
    });
  }
});

router.post('/create-listing', authenticateToken, async (req, res) => {
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
      seller: req.user?.id,
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
