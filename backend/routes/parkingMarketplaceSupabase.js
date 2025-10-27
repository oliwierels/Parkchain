// Parking Marketplace API Routes - Supabase Version
// Uses Supabase client instead of PostgreSQL direct connection

import express from 'express';
import { body, validationResult } from 'express-validator';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// ========================================
// TOKENIZE PARKING ASSET
// ========================================

router.post('/tokenize', authenticateToken, [
  body('parking_lot_name').notEmpty().withMessage('Parking lot name is required'),
  body('city').notEmpty().withMessage('City is required'),
  body('asset_type').isIn(['single_spot', 'revenue_share', 'parking_lot_bundle']),
  body('total_supply').isInt({ min: 1 }),
  body('price_per_token_usdc').isFloat({ min: 0 }),
  body('estimated_value_usdc').optional().isFloat({ min: 0 }),
  body('annual_revenue_usdc').optional().isFloat({ min: 0 }),
  body('revenue_share_percentage').optional().isFloat({ min: 0, max: 100 }),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  const supabase = req.app.get('supabase');
  const userId = req.user.id; // FIXED: was req.user.userId

  try {
    const {
      parking_lot_name,
      city,
      address,
      spot_number,
      asset_type,
      total_supply,
      price_per_token_usdc,
      estimated_value_usdc,
      annual_revenue_usdc,
      revenue_share_percentage,
      operator_wallet,
    } = req.body;

    // Generate mock token address
    const asset_token_address = `PARK${Date.now()}${Math.random().toString(36).substring(7)}`;

    // Insert parking asset
    const { data: assetData, error: assetError } = await supabase
      .from('parking_assets')
      .insert([{
        asset_token_address,
        asset_type,
        parking_lot_name,
        city,
        address,
        spot_number: spot_number || `SPOT-${Date.now()}`,
        total_supply: parseInt(total_supply),
        circulating_supply: parseInt(total_supply),
        estimated_value_usdc: parseFloat(estimated_value_usdc || 0),
        annual_revenue_usdc: parseFloat(annual_revenue_usdc || 0),
        revenue_share_percentage: parseFloat(revenue_share_percentage || 0),
        institutional_operator_id: userId,
        compliance_status: 'pending',
        is_active: true,
        is_tradeable: true,
      }])
      .select()
      .single();

    if (assetError) {
      console.error('Error creating asset:', assetError);
      return res.status(500).json({ success: false, error: 'Failed to create asset', details: assetError.message });
    }

    // Create marketplace listing
    const { data: listingData, error: listingError } = await supabase
      .from('parking_marketplace_listings')
      .insert([{
        asset_id: assetData.id,
        seller_id: userId,
        listing_type: 'sale',
        token_amount: parseInt(total_supply),
        price_per_token_usdc: parseFloat(price_per_token_usdc),
        total_price_usdc: parseFloat(price_per_token_usdc) * parseInt(total_supply),
        payment_methods: ['USDC', 'SOL'],
        status: 'active',
        listing_metadata: {
          parking_lot_name,
          city,
          address,
        },
      }])
      .select()
      .single();

    if (listingError) {
      console.error('Error creating listing:', listingError);
    }

    res.json({
      success: true,
      asset_id: assetData.id,
      listing_id: listingData?.id,
      message: 'Asset tokenized successfully',
    });

  } catch (error) {
    console.error('Error tokenizing asset:', error);
    res.status(500).json({ success: false, error: 'Failed to tokenize asset' });
  }
});

// ========================================
// GET MARKETPLACE LISTINGS
// ========================================

router.get('/listings', async (req, res) => {
  const supabase = req.app.get('supabase');

  try {
    const { data, error } = await supabase
      .from('parking_marketplace_listings')
      .select(`
        *,
        asset:parking_assets(*),
        seller:users(id, full_name, email)
      `)
      .eq('status', 'active')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching listings:', error);
      return res.status(500).json({ success: false, error: 'Failed to fetch listings' });
    }

    // Format listings with asset data
    const formattedListings = (data || []).map(listing => ({
      ...listing,
      parking_lot_name: listing.asset?.parking_lot_name || listing.listing_metadata?.parking_lot_name,
      city: listing.asset?.city || listing.listing_metadata?.city,
      address: listing.asset?.address || listing.listing_metadata?.address,
      organization_name: listing.seller?.full_name || 'Unknown Operator',
    }));

    res.json({
      success: true,
      listings: formattedListings,
      count: formattedListings.length,
    });

  } catch (error) {
    console.error('Error fetching listings:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch listings' });
  }
});

// ========================================
// GET MARKETPLACE STATS
// ========================================

router.get('/stats', async (req, res) => {
  const supabase = req.app.get('supabase');

  try {
    // Get total listings
    const { count: totalListings } = await supabase
      .from('parking_marketplace_listings')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'active');

    // Get total assets
    const { count: totalAssets } = await supabase
      .from('parking_assets')
      .select('*', { count: 'exact', head: true });

    // Get total transactions
    const { count: totalTransactions } = await supabase
      .from('parking_asset_transactions')
      .select('*', { count: 'exact', head: true });

    // Calculate total volume
    const { data: transactions } = await supabase
      .from('parking_asset_transactions')
      .select('total_amount_usdc');

    const totalVolume = transactions?.reduce((sum, t) => sum + (t.total_amount_usdc || 0), 0) || 0;

    res.json({
      success: true,
      stats: {
        total_listings: totalListings || 0,
        total_assets: totalAssets || 0,
        total_transactions: totalTransactions || 0,
        total_volume_usdc: totalVolume,
      },
    });

  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch stats' });
  }
});

// ========================================
// PURCHASE ASSET
// ========================================

router.post('/purchase', authenticateToken, [
  body('listing_id').isInt(),
  body('token_amount').isInt({ min: 1 }),
  body('total_amount_usdc').isFloat({ min: 0 }),
  body('solana_tx_signature').isString(),
  body('payment_method').isString(),
  // Note: gateway_used and gateway_delivery_method are accepted but not stored (DB schema doesn't have these columns yet)
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  const supabase = req.app.get('supabase');
  const buyerId = req.user.id; // FIXED: was req.user.userId

  try {
    const {
      listing_id,
      token_amount,
      total_amount_usdc,
      payment_method,
      solana_tx_signature,
    } = req.body;

    // Get listing
    const { data: listing, error: listingError } = await supabase
      .from('parking_marketplace_listings')
      .select('*, asset:parking_assets(*)')
      .eq('id', listing_id)
      .single();

    if (listingError || !listing) {
      return res.status(404).json({ success: false, error: 'Listing not found' });
    }

    if (listing.status !== 'active') {
      return res.status(400).json({ success: false, error: 'Listing is not active' });
    }

    if (token_amount > listing.token_amount) {
      return res.status(400).json({ success: false, error: 'Insufficient tokens available' });
    }

    const totalAmount = listing.price_per_token_usdc * token_amount;

    // Create transaction record
    const { data: transaction, error: txError } = await supabase
      .from('parking_asset_transactions')
      .insert([{
        listing_id,
        asset_id: listing.asset_id,
        buyer_id: buyerId,
        seller_id: listing.seller_id,
        token_amount,
        total_amount_usdc: total_amount_usdc || totalAmount,
        payment_method,
        solana_tx_signature: solana_tx_signature || `DEMO_${Date.now()}`,
        settlement_status: 'settled',
        compliance_checked: true,
      }])
      .select()
      .single();

    if (txError) {
      console.error('Error creating transaction:', txError);
      return res.status(500).json({ success: false, error: 'Failed to create transaction' });
    }

    // Update listing
    const newTokenAmount = listing.token_amount - token_amount;
    const { error: updateError } = await supabase
      .from('parking_marketplace_listings')
      .update({
        token_amount: newTokenAmount,
        status: newTokenAmount === 0 ? 'sold' : 'active',
      })
      .eq('id', listing_id);

    if (updateError) {
      console.error('Error updating listing:', updateError);
    }

    res.json({
      success: true,
      transaction_id: transaction.id,
      message: 'Purchase completed successfully',
    });

  } catch (error) {
    console.error('Error processing purchase:', error);
    res.status(500).json({ success: false, error: 'Failed to process purchase' });
  }
});

// ========================================
// GET OPERATOR PROFILE
// ========================================

router.get('/profile', authenticateToken, async (req, res) => {
  const supabase = req.app.get('supabase');
  const userId = req.user.id; // FIXED: was req.user.userId

  try {
    const { data, error } = await supabase
      .from('institutional_operators')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching operator:', error);
      return res.status(500).json({ success: false, error: 'Failed to fetch operator profile' });
    }

    res.json({
      success: true,
      operator: data || null,
    });

  } catch (error) {
    console.error('Error fetching operator:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch operator profile' });
  }
});

// ========================================
// GET OPERATOR ASSETS
// ========================================

router.get('/assets', authenticateToken, async (req, res) => {
  const supabase = req.app.get('supabase');
  const userId = req.user.id; // FIXED: was req.user.userId

  try {
    const { data, error } = await supabase
      .from('parking_assets')
      .select('*')
      .eq('institutional_operator_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching assets:', error);
      return res.status(500).json({ success: false, error: 'Failed to fetch assets' });
    }

    res.json({
      success: true,
      assets: data || [],
      count: data?.length || 0,
    });

  } catch (error) {
    console.error('Error fetching assets:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch assets' });
  }
});

// ========================================
// GET OPERATOR LISTINGS (MY LISTINGS)
// ========================================

router.get('/listings', authenticateToken, async (req, res) => {
  const supabase = req.app.get('supabase');
  const userId = req.user.id; // FIXED: was req.user.userId

  try {
    const { data, error } = await supabase
      .from('parking_marketplace_listings')
      .select(`
        *,
        asset:parking_assets(*)
      `)
      .eq('seller_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching operator listings:', error);
      return res.status(500).json({ success: false, error: 'Failed to fetch listings' });
    }

    res.json({
      success: true,
      listings: data || [],
      count: data?.length || 0,
    });

  } catch (error) {
    console.error('Error fetching operator listings:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch listings' });
  }
});

// ========================================
// GET REVENUE DISTRIBUTIONS
// ========================================

router.get('/revenue-distributions', authenticateToken, async (req, res) => {
  const supabase = req.app.get('supabase');

  try {
    // For now, return empty array since we don't have revenue distribution data yet
    res.json({
      success: true,
      distributions: [],
      count: 0,
    });

  } catch (error) {
    console.error('Error fetching revenue distributions:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch revenue distributions' });
  }
});

// ========================================
// GET MY TRANSACTIONS (Purchase History)
// ========================================

router.get('/my-transactions', authenticateToken, async (req, res) => {
  const supabase = req.app.get('supabase');
  const userId = req.user.id;

  try {
    const { data, error } = await supabase
      .from('parking_asset_transactions')
      .select(`
        *,
        asset:parking_assets(*),
        listing:parking_marketplace_listings(listing_metadata),
        seller:users(id, full_name, email)
      `)
      .eq('buyer_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching user transactions:', error);
      return res.status(500).json({ success: false, error: 'Failed to fetch transactions' });
    }

    // Format transactions with asset details from listing_metadata
    const formattedTransactions = (data || []).map(tx => ({
      ...tx,
      parking_lot_name: tx.listing?.listing_metadata?.parking_lot_name || 'Unknown Parking',
      city: tx.listing?.listing_metadata?.city || 'Unknown City',
      address: tx.listing?.listing_metadata?.address || '',
      asset_type: tx.asset?.asset_type || 'single_spot',
      seller_name: tx.seller?.full_name || 'Unknown',
    }));

    res.json({
      success: true,
      transactions: formattedTransactions,
      count: formattedTransactions.length,
    });

  } catch (error) {
    console.error('Error fetching user transactions:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch transactions' });
  }
});

// ========================================
// GET MY HOLDINGS (Aggregated Token Balance)
// ========================================

router.get('/my-holdings', authenticateToken, async (req, res) => {
  const supabase = req.app.get('supabase');
  const userId = req.user.id;

  try {
    // Get all purchases by this user (removed payment_status filter as column doesn't exist)
    const { data: purchases, error: purchasesError } = await supabase
      .from('parking_asset_transactions')
      .select('asset_id, token_amount, asset:parking_assets(*)')
      .eq('buyer_id', userId)
      .eq('settlement_status', 'settled');

    if (purchasesError) {
      console.error('Error fetching purchases:', purchasesError);
      return res.status(500).json({ success: false, error: 'Failed to fetch holdings' });
    }

    // Aggregate holdings by asset_id
    const holdingsMap = {};
    (purchases || []).forEach(purchase => {
      const assetId = purchase.asset_id;
      if (!holdingsMap[assetId]) {
        holdingsMap[assetId] = {
          asset_id: assetId,
          asset: purchase.asset,
          listing_metadata: purchase.listing?.listing_metadata,
          total_tokens: 0,
        };
      }
      holdingsMap[assetId].total_tokens += purchase.token_amount;
    });

    // Convert to array and add details
    const holdings = Object.values(holdingsMap).map(holding => ({
      asset_id: holding.asset_id,
      asset_token_address: holding.asset?.asset_token_address,
      asset_type: holding.asset?.asset_type,
      parking_lot_name: holding.listing_metadata?.parking_lot_name || 'Unknown Parking',
      city: holding.listing_metadata?.city || 'Unknown City',
      total_tokens: holding.total_tokens,
      total_supply: holding.asset?.total_supply || 1,
      estimated_value_usdc: holding.asset?.estimated_value_usdc,
      annual_revenue_usdc: holding.asset?.annual_revenue_usdc,
      revenue_share_percentage: holding.asset?.revenue_share_percentage,
    }));

    // Calculate total portfolio value
    const totalValue = holdings.reduce((sum, h) => {
      const tokenValue = (h.estimated_value_usdc || 0) / (h.total_supply || 1);
      return sum + (tokenValue * h.total_tokens);
    }, 0);

    res.json({
      success: true,
      holdings,
      count: holdings.length,
      total_value_usdc: totalValue,
    });

  } catch (error) {
    console.error('Error fetching user holdings:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch holdings' });
  }
});

export default router;
