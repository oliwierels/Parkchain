// Parking Marketplace API Routes
// Mastercard DeFi Hackathon - Institutional Parking Asset Tokenization

import express from 'express';
import { body, validationResult } from 'express-validator';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// ========================================
// MARKETPLACE LISTINGS
// ========================================

/**
 * GET /api/parking-marketplace/listings
 * Get all active marketplace listings with asset details
 */
router.get('/listings', async (req, res) => {
  const client = req.app.get('db');

  try {
    const result = await client.query(`
      SELECT * FROM marketplace_active_listings_view
      ORDER BY created_at DESC
    `);

    res.json({
      success: true,
      listings: result.rows,
      count: result.rows.length,
    });
  } catch (error) {
    console.error('Error fetching marketplace listings:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch marketplace listings',
    });
  }
});

/**
 * GET /api/parking-marketplace/stats
 * Get marketplace statistics
 */
router.get('/stats', async (req, res) => {
  const client = req.app.get('db');

  try {
    // Get latest market analytics
    const statsResult = await client.query(`
      SELECT
        COALESCE(SUM(daily_volume_usdc), 0) as totalVolume,
        COUNT(DISTINCT date) as tradingDays,
        MAX(average_asset_price_usdc) as avgPrice
      FROM parking_market_analytics
      WHERE date >= CURRENT_DATE - INTERVAL '30 days'
    `);

    // Get active listings count
    const listingsResult = await client.query(`
      SELECT COUNT(*) as count
      FROM parking_marketplace_listings
      WHERE status = 'active' AND expires_at > NOW()
    `);

    // Get total tokenized assets
    const assetsResult = await client.query(`
      SELECT COUNT(*) as count, AVG(annual_revenue_usdc::numeric / NULLIF(estimated_value_usdc::numeric, 0) * 100) as avgYield
      FROM parking_assets
      WHERE is_active = TRUE AND is_tradeable = TRUE
    `);

    const stats = statsResult.rows[0];
    const avgYield = assetsResult.rows[0].avgyield || 0;

    res.json({
      totalVolume: parseFloat(stats.totalvolume || 0),
      totalAssets: parseInt(assetsResult.rows[0].count),
      avgYield: parseFloat(avgYield).toFixed(2),
      activeListings: parseInt(listingsResult.rows[0].count),
    });
  } catch (error) {
    console.error('Error fetching market stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch market stats',
    });
  }
});

/**
 * POST /api/parking-marketplace/purchase
 * Record a parking asset purchase transaction
 */
router.post(
  '/purchase',
  authenticateToken,
  [
    body('listing_id').isInt(),
    body('token_amount').isInt().isLength({ min: 1 }),
    body('total_amount_usdc').isFloat({ min: 0 }),
    body('solana_tx_signature').isString(),
    body('payment_method').isString(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const client = req.app.get('db');
    const userId = req.user.id;
    const {
      listing_id,
      token_amount,
      total_amount_usdc,
      solana_tx_signature,
      payment_method,
      gateway_used,
      gateway_delivery_method,
    } = req.body;

    try {
      await client.query('BEGIN');

      // Get listing and asset details
      const listingResult = await client.query(
        `SELECT l.*, a.id as asset_id, a.asset_token_address
         FROM parking_marketplace_listings l
         JOIN parking_assets a ON l.asset_id = a.id
         WHERE l.id = $1 AND l.status = 'active'`,
        [listing_id]
      );

      if (listingResult.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json({
          success: false,
          error: 'Listing not found or not active',
        });
      }

      const listing = listingResult.rows[0];

      // Insert transaction record
      const txResult = await client.query(
        `INSERT INTO parking_asset_transactions (
          listing_id, asset_id, buyer_id, seller_id,
          token_amount, price_per_token_usdc, total_amount_usdc,
          payment_method, payment_status, solana_tx_signature,
          gateway_used, gateway_delivery_method, settlement_status,
          buyer_country, seller_country
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
        RETURNING id`,
        [
          listing_id,
          listing.asset_id,
          userId,
          listing.seller_id,
          token_amount,
          listing.price_per_token_usdc,
          total_amount_usdc,
          payment_method,
          'completed',
          solana_tx_signature,
          gateway_used || false,
          gateway_delivery_method || null,
          'settled',
          'PL', // Default to Poland
          'PL',
        ]
      );

      // Update listing token amount
      const remainingTokens = listing.token_amount - token_amount;
      const newStatus = remainingTokens === 0 ? 'sold' : 'active';

      await client.query(
        `UPDATE parking_marketplace_listings
         SET token_amount = $1, status = $2, updated_at = NOW()
         WHERE id = $3`,
        [remainingTokens, newStatus, listing_id]
      );

      // Update market analytics for today
      await client.query(
        `INSERT INTO parking_market_analytics (
          date, daily_volume_usdc, daily_transactions, cross_border_volume_usdc,
          gateway_transactions
        ) VALUES (CURRENT_DATE, $1, 1, $2, $3)
        ON CONFLICT (date) DO UPDATE SET
          daily_volume_usdc = parking_market_analytics.daily_volume_usdc + $1,
          daily_transactions = parking_market_analytics.daily_transactions + 1,
          cross_border_volume_usdc = parking_market_analytics.cross_border_volume_usdc + $2,
          gateway_transactions = parking_market_analytics.gateway_transactions + $3`,
        [total_amount_usdc, total_amount_usdc, gateway_used ? 1 : 0]
      );

      await client.query('COMMIT');

      res.json({
        success: true,
        transaction_id: txResult.rows[0].id,
        message: 'Purchase recorded successfully',
      });
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Error recording purchase:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to record purchase',
      });
    }
  }
);

// ========================================
// INSTITUTIONAL OPERATORS
// ========================================

/**
 * GET /api/institutional-operators/profile
 * Get institutional operator profile
 */
router.get('/profile', authenticateToken, async (req, res) => {
  const client = req.app.get('db');
  const userId = req.user.id;

  try {
    const result = await client.query(
      `SELECT * FROM institutional_operators WHERE user_id = $1`,
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Institutional operator profile not found',
      });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching operator profile:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch operator profile',
    });
  }
});

/**
 * GET /api/institutional-operators/assets
 * Get all tokenized assets for an operator
 */
router.get('/assets', authenticateToken, async (req, res) => {
  const client = req.app.get('db');
  const userId = req.user.id;

  try {
    const result = await client.query(
      `SELECT * FROM parking_assets
       WHERE institutional_operator_id = $1
       ORDER BY created_at DESC`,
      [userId]
    );

    res.json({
      success: true,
      assets: result.rows,
    });
  } catch (error) {
    console.error('Error fetching assets:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch assets',
    });
  }
});

/**
 * GET /api/institutional-operators/listings
 * Get all listings created by operator
 */
router.get('/listings', authenticateToken, async (req, res) => {
  const client = req.app.get('db');
  const userId = req.user.id;

  try {
    const result = await client.query(
      `SELECT l.*, a.spot_number, a.asset_type
       FROM parking_marketplace_listings l
       JOIN parking_assets a ON l.asset_id = a.id
       WHERE l.seller_id = $1
       ORDER BY l.created_at DESC`,
      [userId]
    );

    res.json({
      success: true,
      listings: result.rows,
    });
  } catch (error) {
    console.error('Error fetching listings:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch listings',
    });
  }
});

/**
 * GET /api/institutional-operators/revenue-distributions
 * Get revenue distributions for operator's assets
 */
router.get('/revenue-distributions', authenticateToken, async (req, res) => {
  const client = req.app.get('db');
  const userId = req.user.id;

  try {
    const result = await client.query(
      `SELECT rd.*, a.spot_number as asset_spot_number
       FROM parking_revenue_distributions rd
       JOIN parking_assets a ON rd.asset_id = a.id
       WHERE a.institutional_operator_id = $1
       ORDER BY rd.period_end DESC`,
      [userId]
    );

    res.json({
      success: true,
      distributions: result.rows,
    });
  } catch (error) {
    console.error('Error fetching revenue distributions:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch revenue distributions',
    });
  }
});

/**
 * POST /api/institutional-operators/tokenize
 * Tokenize a new parking asset
 */
router.post(
  '/tokenize',
  authenticateToken,
  [
    body('parking_lot_id').isInt(),
    body('spot_number').isString().isLength({ min: 1, max: 32 }),
    body('asset_type').isIn(['single_spot', 'revenue_share', 'parking_lot_bundle']),
    body('total_supply').isInt().isLength({ min: 1 }),
    body('estimated_value_usdc').isFloat({ min: 0 }),
    body('annual_revenue_usdc').isFloat({ min: 0 }),
    body('revenue_share_percentage').isInt({ min: 0, max: 100 }),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const client = req.app.get('db');
    const userId = req.user.id;
    const {
      parking_lot_id,
      spot_number,
      asset_type,
      total_supply,
      estimated_value_usdc,
      annual_revenue_usdc,
      revenue_share_percentage,
      operator_wallet,
    } = req.body;

    try {
      await client.query('BEGIN');

      // Generate mock token address (in production, this would come from Solana program)
      const tokenAddress = `PARK${parking_lot_id}${spot_number}${Date.now()}`.substring(0, 44);

      // Insert parking asset
      const assetResult = await client.query(
        `INSERT INTO parking_assets (
          asset_token_address, asset_type, parking_lot_id, spot_number,
          total_supply, circulating_supply, estimated_value_usdc,
          annual_revenue_usdc, revenue_share_percentage,
          institutional_operator_id, compliance_status, is_active, is_tradeable
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
        RETURNING id`,
        [
          tokenAddress,
          asset_type,
          parking_lot_id,
          spot_number,
          total_supply,
          total_supply,
          estimated_value_usdc,
          annual_revenue_usdc,
          revenue_share_percentage,
          userId,
          'pending',
          true,
          true,
        ]
      );

      // Update operator stats
      await client.query(
        `SELECT update_operator_stats($1)`,
        [userId]
      );

      await client.query('COMMIT');

      res.json({
        success: true,
        asset_id: assetResult.rows[0].id,
        message: 'Asset tokenized successfully',
      });
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Error tokenizing asset:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to tokenize asset',
      });
    }
  }
);

/**
 * POST /api/institutional-operators/create-listing
 * Create a marketplace listing for a tokenized asset
 */
router.post(
  '/create-listing',
  authenticateToken,
  [
    body('asset_id').isInt(),
    body('listing_type').isIn(['sale', 'lease', 'revenue_share']),
    body('token_amount').isInt().isLength({ min: 1 }),
    body('price_per_token_usdc').isFloat({ min: 0 }),
    body('payment_methods').isArray(),
    body('expires_in_days').isInt({ min: 1, max: 365 }),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const client = req.app.get('db');
    const userId = req.user.id;
    const {
      asset_id,
      listing_type,
      token_amount,
      price_per_token_usdc,
      payment_methods,
      minimum_purchase_usdc,
      kyb_required,
      expires_in_days,
    } = req.body;

    try {
      await client.query('BEGIN');

      // Verify asset ownership
      const assetResult = await client.query(
        `SELECT * FROM parking_assets WHERE id = $1 AND institutional_operator_id = $2`,
        [asset_id, userId]
      );

      if (assetResult.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(403).json({
          success: false,
          error: 'Asset not found or unauthorized',
        });
      }

      const totalPrice = token_amount * price_per_token_usdc;
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + expires_in_days);

      // Create listing
      const listingResult = await client.query(
        `INSERT INTO parking_marketplace_listings (
          asset_id, seller_id, listing_type, token_amount,
          price_per_token_usdc, total_price_usdc, payment_methods,
          minimum_purchase_usdc, kyb_required, status, expires_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        RETURNING id`,
        [
          asset_id,
          userId,
          listing_type,
          token_amount,
          price_per_token_usdc,
          totalPrice,
          payment_methods,
          minimum_purchase_usdc || 0,
          kyb_required || false,
          'active',
          expiresAt,
        ]
      );

      await client.query('COMMIT');

      res.json({
        success: true,
        listing_id: listingResult.rows[0].id,
        message: 'Listing created successfully',
      });
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Error creating listing:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to create listing',
      });
    }
  }
);

export default router;
