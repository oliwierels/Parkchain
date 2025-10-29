import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useWallet } from '@solana/wallet-adapter-react';
import {
  FiDollarSign,
  FiTrendingUp,
  FiPackage,
  FiPieChart,
  FiPlus,
  FiEdit,
  FiBarChart2,
} from 'react-icons/fi';
import { BsBuilding, BsCheck2Circle } from 'react-icons/bs';
import api from '../services/api';

const InstitutionalOperatorDashboard = () => {
  const { user } = useAuth();
  const wallet = useWallet();

  const [operatorProfile, setOperatorProfile] = useState(null);
  const [tokenizedAssets, setTokenizedAssets] = useState([]);
  const [myListings, setMyListings] = useState([]);
  const [revenueDistributions, setRevenueDistributions] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal states
  const [showTokenizeModal, setShowTokenizeModal] = useState(false);
  const [showAssetDetailsModal, setShowAssetDetailsModal] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [selectedParkingLot, setSelectedParkingLot] = useState(null);

  // Form state for tokenization
  const [tokenizeForm, setTokenizeForm] = useState({
    parking_lot_name: '',
    city: '',
    address: '',
    spot_number: '',
    asset_type: 'single_spot',
    total_supply: 1,
    price_per_token_usdc: 100,
    estimated_value_usdc: 0,
    annual_revenue_usdc: 0,
    revenue_share_percentage: 50,
  });

  useEffect(() => {
    fetchOperatorData();
  }, [user]);

  const fetchOperatorData = async () => {
    try {
      const [profileRes, assetsRes, listingsRes, revenueRes] = await Promise.all([
        api.get('/institutional-operators/profile'),
        api.get('/institutional-operators/assets'),
        api.get('/institutional-operators/listings'),
        api.get('/institutional-operators/revenue-distributions'),
      ]);

      setOperatorProfile(profileRes.data);
      setTokenizedAssets(assetsRes.data.assets || []);
      setMyListings(listingsRes.data.listings || []);
      setRevenueDistributions(revenueRes.data.distributions || []);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching operator data:', error);
      setLoading(false);
    }
  };

  const handleTokenizeAsset = async () => {
    if (!wallet.connected) {
      alert('Please connect your Solana wallet first');
      return;
    }

    // Validate required fields
    if (!tokenizeForm.parking_lot_name || !tokenizeForm.city) {
      alert('⚠️ Please fill in Parking Lot Name and City (required fields)');
      return;
    }

    try {
      // Call backend API to tokenize asset
      const response = await api.post('/institutional-operators/tokenize', {
        ...tokenizeForm,
        operator_wallet: wallet.publicKey.toBase58(),
      });

      if (response.data.success) {
        alert(`✅ Asset tokenized successfully!\n\n🎯 Your parking is now available in the marketplace!\n\nAsset ID: ${response.data.asset_id}\nListing ID: ${response.data.listing_id}\n\n📍 Go to ParkFi Marketplace to see your listing.`);

        // Reset form
        setTokenizeForm({
          parking_lot_name: '',
          city: '',
          address: '',
          spot_number: '',
          asset_type: 'single_spot',
          total_supply: 1,
          price_per_token_usdc: 100,
          estimated_value_usdc: 0,
          annual_revenue_usdc: 0,
          revenue_share_percentage: 50,
        });

        setShowTokenizeModal(false);
        fetchOperatorData();
      }
    } catch (error) {
      console.error('Error tokenizing asset:', error);
      alert('❌ Failed to tokenize asset: ' + error.message);
    }
  };

  const calculateTotalAUM = () => {
    return tokenizedAssets.reduce((sum, asset) => sum + parseFloat(asset.estimated_value_usdc || 0), 0);
  };

  const calculateTotalRevenue = () => {
    return revenueDistributions.reduce((sum, dist) => sum + parseFloat(dist.total_distributed_usdc || 0), 0);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-blue-900 py-12 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-4xl font-bold text-white mb-2">
                🏢 Institutional Operator Dashboard
              </h1>
              <p className="text-gray-300">
                Tokenize and manage your parking infrastructure as Real-World Assets
              </p>
            </div>
            <button
              onClick={() => setShowTokenizeModal(true)}
              className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white font-semibold py-3 px-6 rounded-lg flex items-center gap-2 transition-all"
            >
              <FiPlus />
              Tokenize New Asset
            </button>
          </div>
        </motion.div>

        {/* Operator Profile Card */}
        {operatorProfile && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/10 backdrop-blur-lg rounded-xl p-6 mb-8 border border-white/20"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-4">
                <div className="bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl p-4">
                  <BsBuilding className="text-white text-3xl" />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h2 className="text-white text-2xl font-bold">
                      {operatorProfile.organization_name}
                    </h2>
                    {operatorProfile.kyb_verified && (
                      <BsCheck2Circle className="text-green-400 text-xl" />
                    )}
                  </div>
                  <p className="text-gray-300 mb-2">
                    {operatorProfile.organization_type ? operatorProfile.organization_type.replace('_', ' ').toUpperCase() : 'Parking Operator'}
                  </p>
                  <p className="text-gray-400 text-sm">
                    {operatorProfile.headquarters_city || 'N/A'}, {operatorProfile.headquarters_country || 'N/A'}
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20"
          >
            <div className="flex items-center justify-between mb-2">
              <p className="text-gray-300">Assets Under Management</p>
              <FiDollarSign className="text-green-400 text-2xl" />
            </div>
            <p className="text-white text-3xl font-bold">
              ${calculateTotalAUM().toLocaleString()}
            </p>
            <p className="text-gray-400 text-sm mt-1">{tokenizedAssets.length} tokenized assets</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20"
          >
            <div className="flex items-center justify-between mb-2">
              <p className="text-gray-300">Total Revenue Distributed</p>
              <FiTrendingUp className="text-blue-400 text-2xl" />
            </div>
            <p className="text-white text-3xl font-bold">
              ${calculateTotalRevenue().toLocaleString()}
            </p>
            <p className="text-gray-400 text-sm mt-1">{revenueDistributions.length} distributions</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20"
          >
            <div className="flex items-center justify-between mb-2">
              <p className="text-gray-300">Active Listings</p>
              <FiPackage className="text-purple-400 text-2xl" />
            </div>
            <p className="text-white text-3xl font-bold">
              {myListings.filter(l => l.status === 'active').length}
            </p>
            <p className="text-gray-400 text-sm mt-1">of {myListings.length} total listings</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20"
          >
            <div className="flex items-center justify-between mb-2">
              <p className="text-gray-300">Parking Infrastructure</p>
              <FiBarChart2 className="text-yellow-400 text-2xl" />
            </div>
            <p className="text-white text-3xl font-bold">
              {operatorProfile?.total_parking_spots || 0}
            </p>
            <p className="text-gray-400 text-sm mt-1">
              {operatorProfile?.total_parking_lots || 0} parking lots
            </p>
          </motion.div>
        </div>

        {/* Tokenized Assets */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-white/10 backdrop-blur-lg rounded-xl p-6 mb-8 border border-white/20"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-white text-2xl font-semibold flex items-center gap-2">
              <FiPieChart />
              Tokenized Assets
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {tokenizedAssets.map((asset, index) => (
              <motion.div
                key={asset.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05 }}
                className="bg-white/5 rounded-lg p-4 border border-white/10 hover:border-blue-400 transition-all"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="text-white font-semibold">{asset.spot_number || 'Bundle'}</p>
                    <p className="text-gray-400 text-sm">{asset.asset_type.replace('_', ' ')}</p>
                  </div>
                  <span className={`px-2 py-1 rounded text-xs ${
                    asset.compliance_status === 'compliant'
                      ? 'bg-green-500/20 text-green-300'
                      : 'bg-yellow-500/20 text-yellow-300'
                  }`}>
                    {asset.compliance_status}
                  </span>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-400 text-sm">Token Supply</span>
                    <span className="text-white text-sm">{asset.total_supply}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400 text-sm">Value</span>
                    <span className="text-white text-sm">${asset.estimated_value_usdc}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400 text-sm">Annual Revenue</span>
                    <span className="text-green-400 text-sm">${asset.annual_revenue_usdc}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400 text-sm">Revenue Share</span>
                    <span className="text-blue-400 text-sm">{asset.revenue_share_percentage}%</span>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-white/10">
                  <button
                    onClick={() => {
                      setSelectedAsset(asset);
                      setShowAssetDetailsModal(true);
                    }}
                    className="w-full bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 text-sm font-semibold py-2 rounded transition-all"
                  >
                    <FiEdit className="inline mr-1" />
                    Manage Asset
                  </button>
                </div>
              </motion.div>
            ))}
          </div>

          {tokenizedAssets.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-400">No tokenized assets yet. Start tokenizing your parking infrastructure!</p>
            </div>
          )}
        </motion.div>

        {/* Revenue Distributions */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20"
        >
          <h2 className="text-white text-2xl font-semibold mb-6 flex items-center gap-2">
            <FiTrendingUp />
            Revenue Distributions
          </h2>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/20">
                  <th className="text-left text-gray-300 py-3 px-4">Period</th>
                  <th className="text-left text-gray-300 py-3 px-4">Asset</th>
                  <th className="text-left text-gray-300 py-3 px-4">Total Revenue</th>
                  <th className="text-left text-gray-300 py-3 px-4">Distributed</th>
                  <th className="text-left text-gray-300 py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody>
                {revenueDistributions.map((dist, index) => (
                  <tr key={index} className="border-b border-white/10 hover:bg-white/5">
                    <td className="text-white py-3 px-4">
                      {new Date(dist.period_start).toLocaleDateString()} - {new Date(dist.period_end).toLocaleDateString()}
                    </td>
                    <td className="text-gray-300 py-3 px-4">{dist.asset_spot_number}</td>
                    <td className="text-green-400 py-3 px-4">${dist.total_revenue_usdc}</td>
                    <td className="text-blue-400 py-3 px-4">${dist.total_distributed_usdc}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 rounded text-xs ${
                        dist.payment_status === 'completed'
                          ? 'bg-green-500/20 text-green-300'
                          : 'bg-yellow-500/20 text-yellow-300'
                      }`}>
                        {dist.payment_status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {revenueDistributions.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-400">No revenue distributions yet.</p>
            </div>
          )}
        </motion.div>

        {/* Asset Details Modal */}
        {showAssetDetailsModal && selectedAsset && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-gray-900 rounded-xl p-8 max-w-3xl w-full border border-white/20 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-white text-3xl font-bold">Asset Details</h2>
                <button
                  onClick={() => setShowAssetDetailsModal(false)}
                  className="text-gray-400 hover:text-white text-2xl"
                >
                  ×
                </button>
              </div>

              <div className="space-y-6">
                {/* Asset Header */}
                <div className="bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-lg p-6 border border-blue-400/30">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-white text-2xl font-bold mb-2">
                        {selectedAsset.parking_lot_name || 'Parking Asset'}
                      </h3>
                      <p className="text-gray-300 mb-1">
                        {selectedAsset.spot_number ? `Spot #${selectedAsset.spot_number}` : 'Bundle Asset'}
                      </p>
                      <p className="text-gray-400 text-sm">
                        {selectedAsset.city || 'N/A'} • {selectedAsset.address || 'No address'}
                      </p>
                    </div>
                    <span className={`px-3 py-1 rounded text-sm font-semibold ${
                      selectedAsset.compliance_status === 'compliant'
                        ? 'bg-green-500/20 text-green-300'
                        : 'bg-yellow-500/20 text-yellow-300'
                    }`}>
                      {selectedAsset.compliance_status}
                    </span>
                  </div>
                </div>

                {/* Token Information */}
                <div className="bg-white/5 rounded-lg p-6 border border-white/10">
                  <h4 className="text-white text-xl font-semibold mb-4 flex items-center gap-2">
                    <FiPackage />
                    Token Information
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-gray-400 text-sm mb-1">Asset Token Address</p>
                      <p className="text-white font-mono text-sm break-all">
                        {selectedAsset.asset_token_address || 'Not minted'}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-400 text-sm mb-1">Asset Type</p>
                      <p className="text-white">
                        {selectedAsset.asset_type?.replace('_', ' ').toUpperCase() || 'N/A'}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-400 text-sm mb-1">Total Supply</p>
                      <p className="text-white font-semibold">{selectedAsset.total_supply} tokens</p>
                    </div>
                    <div>
                      <p className="text-gray-400 text-sm mb-1">Circulating Supply</p>
                      <p className="text-white font-semibold">{selectedAsset.circulating_supply || 0} tokens</p>
                    </div>
                  </div>
                </div>

                {/* Financial Information */}
                <div className="bg-white/5 rounded-lg p-6 border border-white/10">
                  <h4 className="text-white text-xl font-semibold mb-4 flex items-center gap-2">
                    <FiDollarSign />
                    Financial Information
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-gray-400 text-sm mb-1">Estimated Value</p>
                      <p className="text-green-400 text-2xl font-bold">
                        ${parseFloat(selectedAsset.estimated_value_usdc || 0).toLocaleString()} USDC
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-400 text-sm mb-1">Annual Revenue</p>
                      <p className="text-blue-400 text-2xl font-bold">
                        ${parseFloat(selectedAsset.annual_revenue_usdc || 0).toLocaleString()} USDC
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-400 text-sm mb-1">Revenue Share</p>
                      <p className="text-purple-400 text-xl font-bold">
                        {selectedAsset.revenue_share_percentage}% for token holders
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-400 text-sm mb-1">Expected Yield</p>
                      <p className="text-yellow-400 text-xl font-bold">
                        {selectedAsset.annual_revenue_usdc && selectedAsset.estimated_value_usdc
                          ? ((parseFloat(selectedAsset.annual_revenue_usdc) / parseFloat(selectedAsset.estimated_value_usdc)) * 100).toFixed(2)
                          : '0.00'}% APY
                      </p>
                    </div>
                  </div>
                </div>

                {/* Asset Status */}
                <div className="bg-white/5 rounded-lg p-6 border border-white/10">
                  <h4 className="text-white text-xl font-semibold mb-4 flex items-center gap-2">
                    <FiBarChart2 />
                    Asset Status
                  </h4>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center p-4 bg-white/5 rounded-lg">
                      <p className="text-gray-400 text-sm mb-2">Active</p>
                      <p className={`text-2xl font-bold ${selectedAsset.is_active ? 'text-green-400' : 'text-red-400'}`}>
                        {selectedAsset.is_active ? '✓' : '✗'}
                      </p>
                    </div>
                    <div className="text-center p-4 bg-white/5 rounded-lg">
                      <p className="text-gray-400 text-sm mb-2">Tradeable</p>
                      <p className={`text-2xl font-bold ${selectedAsset.is_tradeable ? 'text-green-400' : 'text-red-400'}`}>
                        {selectedAsset.is_tradeable ? '✓' : '✗'}
                      </p>
                    </div>
                    <div className="text-center p-4 bg-white/5 rounded-lg">
                      <p className="text-gray-400 text-sm mb-2">Compliance</p>
                      <p className={`text-sm font-bold ${selectedAsset.compliance_status === 'compliant' ? 'text-green-400' : 'text-yellow-400'}`}>
                        {selectedAsset.compliance_status?.toUpperCase()}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Operational Information */}
                {(selectedAsset.operational_hours || selectedAsset.spot_features || selectedAsset.access_restrictions) && (
                  <div className="bg-white/5 rounded-lg p-6 border border-white/10">
                    <h4 className="text-white text-xl font-semibold mb-4">Operational Information</h4>
                    <div className="space-y-3">
                      {selectedAsset.operational_hours && (
                        <div>
                          <p className="text-gray-400 text-sm mb-1">Operational Hours</p>
                          <p className="text-white">
                            {typeof selectedAsset.operational_hours === 'object'
                              ? JSON.stringify(selectedAsset.operational_hours)
                              : selectedAsset.operational_hours}
                          </p>
                        </div>
                      )}
                      {selectedAsset.spot_features && (
                        <div>
                          <p className="text-gray-400 text-sm mb-1">Spot Features</p>
                          <p className="text-white">
                            {typeof selectedAsset.spot_features === 'object'
                              ? JSON.stringify(selectedAsset.spot_features)
                              : selectedAsset.spot_features}
                          </p>
                        </div>
                      )}
                      {selectedAsset.access_restrictions && (
                        <div>
                          <p className="text-gray-400 text-sm mb-1">Access Restrictions</p>
                          <p className="text-white">
                            {typeof selectedAsset.access_restrictions === 'object'
                              ? JSON.stringify(selectedAsset.access_restrictions)
                              : selectedAsset.access_restrictions}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Timestamps */}
                <div className="bg-white/5 rounded-lg p-6 border border-white/10">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-400 mb-1">Created</p>
                      <p className="text-white">
                        {selectedAsset.created_at ? new Date(selectedAsset.created_at).toLocaleString() : 'N/A'}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-400 mb-1">Last Updated</p>
                      <p className="text-white">
                        {selectedAsset.updated_at ? new Date(selectedAsset.updated_at).toLocaleString() : 'N/A'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-8 flex gap-4">
                <button
                  onClick={() => setShowAssetDetailsModal(false)}
                  className="flex-1 bg-gray-700 hover:bg-gray-600 text-white font-semibold py-3 rounded-lg transition-all"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    // Future: Add edit functionality
                    alert('Edit functionality coming soon!');
                  }}
                  className="flex-1 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white font-semibold py-3 rounded-lg transition-all flex items-center justify-center gap-2"
                >
                  <FiEdit />
                  Edit Asset
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {/* Tokenize Asset Modal */}
        {showTokenizeModal && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-gray-900 rounded-xl p-8 max-w-2xl w-full border border-white/20 max-h-[90vh] overflow-y-auto"
            >
              <h2 className="text-white text-3xl font-bold mb-6">Tokenize Parking Asset</h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-gray-300 mb-2">Parking Lot Name *</label>
                  <input
                    type="text"
                    value={tokenizeForm.parking_lot_name}
                    onChange={(e) => setTokenizeForm({ ...tokenizeForm, parking_lot_name: e.target.value })}
                    className="w-full bg-white/10 border border-white/30 rounded-lg py-2 px-4 text-white"
                    placeholder="e.g., Centralna Parking Warsaw"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-gray-300 mb-2">City *</label>
                    <input
                      type="text"
                      value={tokenizeForm.city}
                      onChange={(e) => setTokenizeForm({ ...tokenizeForm, city: e.target.value })}
                      className="w-full bg-white/10 border border-white/30 rounded-lg py-2 px-4 text-white"
                      placeholder="Warszawa"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-gray-300 mb-2">Spot/ID</label>
                    <input
                      type="text"
                      value={tokenizeForm.spot_number}
                      onChange={(e) => setTokenizeForm({ ...tokenizeForm, spot_number: e.target.value })}
                      className="w-full bg-white/10 border border-white/30 rounded-lg py-2 px-4 text-white"
                      placeholder="A-42"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-gray-300 mb-2">Address</label>
                  <input
                    type="text"
                    value={tokenizeForm.address}
                    onChange={(e) => setTokenizeForm({ ...tokenizeForm, address: e.target.value })}
                    className="w-full bg-white/10 border border-white/30 rounded-lg py-2 px-4 text-white"
                    placeholder="ul. Marszałkowska 142"
                  />
                </div>

                <div>
                  <label className="block text-gray-300 mb-2">Asset Type</label>
                  <select
                    value={tokenizeForm.asset_type}
                    onChange={(e) => setTokenizeForm({ ...tokenizeForm, asset_type: e.target.value })}
                    className="w-full bg-white/10 border border-white/30 rounded-lg py-2 px-4 text-white"
                  >
                    <option value="single_spot">Single Parking Spot</option>
                    <option value="revenue_share">Revenue Share Token</option>
                    <option value="parking_lot_bundle">Parking Lot Bundle</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-gray-300 mb-2">Total Supply (Tokens)</label>
                    <input
                      type="number"
                      value={tokenizeForm.total_supply}
                      onChange={(e) => setTokenizeForm({ ...tokenizeForm, total_supply: parseInt(e.target.value) })}
                      className="w-full bg-white/10 border border-white/30 rounded-lg py-2 px-4 text-white"
                      placeholder="1000"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-300 mb-2">Price per Token (USDC)</label>
                    <input
                      type="number"
                      value={tokenizeForm.price_per_token_usdc}
                      onChange={(e) => setTokenizeForm({ ...tokenizeForm, price_per_token_usdc: parseFloat(e.target.value) })}
                      className="w-full bg-white/10 border border-white/30 rounded-lg py-2 px-4 text-white"
                      placeholder="100"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-gray-300 mb-2">Estimated Value (USDC)</label>
                    <input
                      type="number"
                      value={tokenizeForm.estimated_value_usdc}
                      onChange={(e) => setTokenizeForm({ ...tokenizeForm, estimated_value_usdc: parseFloat(e.target.value) })}
                      className="w-full bg-white/10 border border-white/30 rounded-lg py-2 px-4 text-white"
                      placeholder="100000"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-300 mb-2">Annual Revenue (USDC)</label>
                    <input
                      type="number"
                      value={tokenizeForm.annual_revenue_usdc}
                      onChange={(e) => setTokenizeForm({ ...tokenizeForm, annual_revenue_usdc: parseFloat(e.target.value) })}
                      className="w-full bg-white/10 border border-white/30 rounded-lg py-2 px-4 text-white"
                      placeholder="8000"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-gray-300 mb-2">Revenue Share % (for token holders)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={tokenizeForm.revenue_share_percentage}
                    onChange={(e) => setTokenizeForm({ ...tokenizeForm, revenue_share_percentage: parseInt(e.target.value) })}
                    className="w-full bg-white/10 border border-white/30 rounded-lg py-2 px-4 text-white"
                    placeholder="50"
                  />
                </div>
              </div>

              <div className="mt-8 flex gap-4">
                <button
                  onClick={() => setShowTokenizeModal(false)}
                  className="flex-1 bg-gray-700 hover:bg-gray-600 text-white font-semibold py-3 rounded-lg transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleTokenizeAsset}
                  className="flex-1 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white font-semibold py-3 rounded-lg transition-all"
                >
                  Tokenize Asset
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
};

export default InstitutionalOperatorDashboard;
