import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { FiMapPin, FiDollarSign, FiTrendingUp, FiShield, FiFilter, FiSearch } from 'react-icons/fi';
import { BsBuilding, BsGlobe, BsCheck2Circle } from 'react-icons/bs';
import api from '../services/api';
import gatewayService from '../services/gatewayService';
import { Connection, PublicKey, Transaction, SystemProgram } from '@solana/web3.js';

const ParkingMarketplacePage = () => {
  const { user } = useAuth();
  const wallet = useWallet();
  const { connection } = useConnection();

  // State
  const [listings, setListings] = useState([]);
  const [filteredListings, setFilteredListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(null);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCity, setFilterCity] = useState('all');
  const [filterAssetType, setFilterAssetType] = useState('all');
  const [filterOrganizationType, setFilterOrganizationType] = useState('all');
  const [sortBy, setSortBy] = useState('newest');

  // Market stats
  const [marketStats, setMarketStats] = useState({
    totalVolume: 0,
    totalAssets: 0,
    avgYield: 0,
    activeListings: 0
  });

  // Selected listing for purchase modal
  const [selectedListing, setSelectedListing] = useState(null);
  const [purchaseAmount, setPurchaseAmount] = useState(1);

  useEffect(() => {
    fetchMarketplaceListings();
    fetchMarketStats();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [listings, searchTerm, filterCity, filterAssetType, filterOrganizationType, sortBy]);

  const fetchMarketplaceListings = async () => {
    try {
      const response = await api.get('/api/parking-marketplace/listings');
      setListings(response.data.listings || []);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching marketplace listings:', error);
      setLoading(false);
    }
  };

  const fetchMarketStats = async () => {
    try {
      const response = await api.get('/api/parking-marketplace/stats');
      setMarketStats(response.data);
    } catch (error) {
      console.error('Error fetching market stats:', error);
    }
  };

  const applyFilters = () => {
    let filtered = [...listings];

    // Search by name, city, or organization
    if (searchTerm) {
      filtered = filtered.filter(listing =>
        listing.parking_lot_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        listing.city?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        listing.organization_name?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by city
    if (filterCity !== 'all') {
      filtered = filtered.filter(listing => listing.city === filterCity);
    }

    // Filter by asset type
    if (filterAssetType !== 'all') {
      filtered = filtered.filter(listing => listing.asset_type === filterAssetType);
    }

    // Filter by organization type
    if (filterOrganizationType !== 'all') {
      filtered = filtered.filter(listing => listing.organization_type === filterOrganizationType);
    }

    // Sort
    switch (sortBy) {
      case 'newest':
        filtered.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        break;
      case 'price_low':
        filtered.sort((a, b) => a.price_per_token_usdc - b.price_per_token_usdc);
        break;
      case 'price_high':
        filtered.sort((a, b) => b.price_per_token_usdc - a.price_per_token_usdc);
        break;
      case 'yield_high':
        filtered.sort((a, b) => calculateYield(b) - calculateYield(a));
        break;
      default:
        break;
    }

    setFilteredListings(filtered);
  };

  const calculateYield = (listing) => {
    if (!listing.estimated_value_usdc || listing.estimated_value_usdc === 0) return 0;
    return ((listing.annual_revenue_usdc / listing.estimated_value_usdc) * 100).toFixed(2);
  };

  const handlePurchase = (listing) => {
    setSelectedListing(listing);
    setPurchaseAmount(1);
  };

  const executePurchase = async () => {
    if (!wallet.connected || !selectedListing) return;

    setPurchasing(selectedListing.listing_id);

    try {
      // Calculate total cost
      const totalCost = selectedListing.price_per_token_usdc * purchaseAmount;

      // Build transaction (simplified - actual implementation would interact with Solana program)
      const transaction = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: wallet.publicKey,
          toPubkey: new PublicKey(selectedListing.asset_token_address),
          lamports: totalCost * 1000000, // Convert to lamports (assuming USDC representation)
        })
      );

      // Use Gateway for optimized transaction delivery
      const result = await gatewayService.executeTransaction(
        transaction,
        wallet,
        connection,
        {
          context: 'parking_asset_purchase',
          assetId: selectedListing.asset_id,
          tokenAmount: purchaseAmount,
        }
      );

      if (result.success) {
        // Record transaction in backend
        await api.post('/api/parking-marketplace/purchase', {
          listing_id: selectedListing.listing_id,
          token_amount: purchaseAmount,
          total_amount_usdc: totalCost,
          solana_tx_signature: result.signature,
          payment_method: 'USDC',
          gateway_used: true,
          gateway_delivery_method: result.deliveryMethod,
        });

        alert('✅ Purchase successful! You now own ' + purchaseAmount + ' parking asset tokens.');
        setSelectedListing(null);
        fetchMarketplaceListings();
      } else {
        alert('❌ Purchase failed: ' + result.error);
      }
    } catch (error) {
      console.error('Purchase error:', error);
      alert('❌ Purchase failed: ' + error.message);
    } finally {
      setPurchasing(null);
    }
  };

  const getAssetTypeLabel = (type) => {
    const labels = {
      single_spot: 'Single Spot',
      revenue_share: 'Revenue Share',
      parking_lot_bundle: 'Parking Lot Bundle',
    };
    return labels[type] || type;
  };

  const getOrganizationTypeLabel = (type) => {
    const labels = {
      municipality: 'Municipality',
      private_company: 'Private Company',
      airport: 'Airport',
      university: 'University',
      hospital: 'Hospital',
    };
    return labels[type] || type;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 py-12 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-5xl font-bold text-white mb-4">
            🅿️ ParkFi Marketplace
          </h1>
          <p className="text-xl text-gray-300 mb-2">
            Institutional-Grade Parking Asset Tokenization
          </p>
          <p className="text-lg text-blue-300">
            Trade Real-World Parking Assets as Tokens on Solana
          </p>
        </motion.div>

        {/* Market Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8"
        >
          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-300 text-sm">Total Volume</p>
                <p className="text-white text-2xl font-bold">${marketStats.totalVolume.toLocaleString()}</p>
              </div>
              <FiDollarSign className="text-green-400 text-3xl" />
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-300 text-sm">Active Assets</p>
                <p className="text-white text-2xl font-bold">{marketStats.totalAssets}</p>
              </div>
              <BsBuilding className="text-blue-400 text-3xl" />
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-300 text-sm">Avg Yield</p>
                <p className="text-white text-2xl font-bold">{marketStats.avgYield}%</p>
              </div>
              <FiTrendingUp className="text-yellow-400 text-3xl" />
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-300 text-sm">Active Listings</p>
                <p className="text-white text-2xl font-bold">{marketStats.activeListings}</p>
              </div>
              <FiShield className="text-purple-400 text-3xl" />
            </div>
          </div>
        </motion.div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-white/10 backdrop-blur-lg rounded-xl p-6 mb-8 border border-white/20"
        >
          <div className="flex items-center gap-4 mb-4">
            <FiFilter className="text-white text-xl" />
            <h2 className="text-white text-xl font-semibold">Filters</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {/* Search */}
            <div className="relative">
              <FiSearch className="absolute left-3 top-3 text-gray-400" />
              <input
                type="text"
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-white/20 border border-white/30 rounded-lg py-2 pl-10 pr-4 text-white placeholder-gray-400"
              />
            </div>

            {/* City Filter */}
            <select
              value={filterCity}
              onChange={(e) => setFilterCity(e.target.value)}
              className="bg-white/20 border border-white/30 rounded-lg py-2 px-4 text-white"
            >
              <option value="all">All Cities</option>
              <option value="Warszawa">Warsaw</option>
              <option value="Kraków">Krakow</option>
              <option value="Wrocław">Wroclaw</option>
              <option value="Poznań">Poznan</option>
            </select>

            {/* Asset Type Filter */}
            <select
              value={filterAssetType}
              onChange={(e) => setFilterAssetType(e.target.value)}
              className="bg-white/20 border border-white/30 rounded-lg py-2 px-4 text-white"
            >
              <option value="all">All Asset Types</option>
              <option value="single_spot">Single Spot</option>
              <option value="revenue_share">Revenue Share</option>
              <option value="parking_lot_bundle">Parking Lot Bundle</option>
            </select>

            {/* Organization Type Filter */}
            <select
              value={filterOrganizationType}
              onChange={(e) => setFilterOrganizationType(e.target.value)}
              className="bg-white/20 border border-white/30 rounded-lg py-2 px-4 text-white"
            >
              <option value="all">All Organizations</option>
              <option value="municipality">Municipality</option>
              <option value="private_company">Private Company</option>
              <option value="airport">Airport</option>
              <option value="university">University</option>
            </select>

            {/* Sort */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-white/20 border border-white/30 rounded-lg py-2 px-4 text-white"
            >
              <option value="newest">Newest First</option>
              <option value="price_low">Price: Low to High</option>
              <option value="price_high">Price: High to Low</option>
              <option value="yield_high">Yield: High to Low</option>
            </select>
          </div>
        </motion.div>

        {/* Listings Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredListings.map((listing, index) => (
            <motion.div
              key={listing.listing_id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white/10 backdrop-blur-lg rounded-xl overflow-hidden border border-white/20 hover:border-blue-400 transition-all"
            >
              {/* Card Header */}
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-white font-semibold text-lg mb-1">
                      {listing.parking_lot_name}
                    </h3>
                    <p className="text-blue-200 text-sm flex items-center gap-1">
                      <FiMapPin className="text-xs" />
                      {listing.city}, {listing.address}
                    </p>
                  </div>
                  <div className="bg-white/20 rounded-lg px-2 py-1">
                    <p className="text-xs text-white">{getAssetTypeLabel(listing.asset_type)}</p>
                  </div>
                </div>
              </div>

              {/* Card Body */}
              <div className="p-6">
                {/* Organization */}
                <div className="flex items-center gap-2 mb-4">
                  <BsBuilding className="text-gray-400" />
                  <p className="text-gray-300 text-sm">
                    {listing.organization_name}
                  </p>
                  {listing.operator_rating >= 4.5 && (
                    <BsCheck2Circle className="text-green-400" />
                  )}
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <p className="text-gray-400 text-xs">Price per Token</p>
                    <p className="text-white font-semibold">${listing.price_per_token_usdc}</p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-xs">Tokens Available</p>
                    <p className="text-white font-semibold">{listing.token_amount}</p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-xs">Est. Annual Yield</p>
                    <p className="text-green-400 font-semibold">{calculateYield(listing)}%</p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-xs">Total Value</p>
                    <p className="text-white font-semibold">${listing.total_price_usdc.toLocaleString()}</p>
                  </div>
                </div>

                {/* Payment Methods */}
                <div className="mb-4">
                  <p className="text-gray-400 text-xs mb-1">Accepted Payments</p>
                  <div className="flex gap-2">
                    {listing.payment_methods && listing.payment_methods.map((method, i) => (
                      <span key={i} className="bg-blue-500/20 text-blue-300 text-xs px-2 py-1 rounded">
                        {method}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Organization Badge */}
                <div className="flex items-center gap-2 mb-4">
                  <BsGlobe className="text-purple-400 text-xs" />
                  <p className="text-gray-300 text-xs">
                    {getOrganizationTypeLabel(listing.organization_type)}
                  </p>
                </div>

                {/* CTA Button */}
                <button
                  onClick={() => handlePurchase(listing)}
                  disabled={purchasing === listing.listing_id || !wallet.connected}
                  className="w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 disabled:from-gray-500 disabled:to-gray-600 text-white font-semibold py-3 rounded-lg transition-all"
                >
                  {purchasing === listing.listing_id ? (
                    <span className="flex items-center justify-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Processing...
                    </span>
                  ) : !wallet.connected ? (
                    'Connect Wallet to Buy'
                  ) : (
                    'Buy Asset Tokens'
                  )}
                </button>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Empty State */}
        {filteredListings.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <p className="text-gray-400 text-lg">No listings found matching your filters.</p>
          </motion.div>
        )}

        {/* Purchase Modal */}
        {selectedListing && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-gray-900 rounded-xl p-8 max-w-md w-full border border-white/20"
            >
              <h2 className="text-white text-2xl font-bold mb-4">Purchase Parking Asset</h2>

              <div className="mb-6">
                <p className="text-gray-300 mb-2">{selectedListing.parking_lot_name}</p>
                <p className="text-gray-400 text-sm">{selectedListing.city}</p>
              </div>

              <div className="mb-6">
                <label className="block text-gray-300 mb-2">Number of Tokens</label>
                <input
                  type="number"
                  min="1"
                  max={selectedListing.token_amount}
                  value={purchaseAmount}
                  onChange={(e) => setPurchaseAmount(parseInt(e.target.value) || 1)}
                  className="w-full bg-white/10 border border-white/30 rounded-lg py-2 px-4 text-white"
                />
              </div>

              <div className="mb-6 bg-white/10 rounded-lg p-4">
                <div className="flex justify-between mb-2">
                  <span className="text-gray-300">Price per Token</span>
                  <span className="text-white">${selectedListing.price_per_token_usdc}</span>
                </div>
                <div className="flex justify-between mb-2">
                  <span className="text-gray-300">Quantity</span>
                  <span className="text-white">{purchaseAmount}</span>
                </div>
                <div className="border-t border-white/20 mt-2 pt-2 flex justify-between">
                  <span className="text-white font-semibold">Total Cost</span>
                  <span className="text-white font-semibold">
                    ${(selectedListing.price_per_token_usdc * purchaseAmount).toLocaleString()} USDC
                  </span>
                </div>
              </div>

              <div className="flex gap-4">
                <button
                  onClick={() => setSelectedListing(null)}
                  className="flex-1 bg-gray-700 hover:bg-gray-600 text-white font-semibold py-3 rounded-lg transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={executePurchase}
                  disabled={purchasing}
                  className="flex-1 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 disabled:from-gray-500 disabled:to-gray-600 text-white font-semibold py-3 rounded-lg transition-all"
                >
                  {purchasing ? 'Processing...' : 'Confirm Purchase'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ParkingMarketplacePage;
