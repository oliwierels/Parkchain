import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useSolanaWallet } from '../context/SolanaWalletContext';
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
  const { wallet } = useSolanaWallet();

  const [operatorProfile, setOperatorProfile] = useState(null);
  const [tokenizedAssets, setTokenizedAssets] = useState([]);
  const [myListings, setMyListings] = useState([]);
  const [revenueDistributions, setRevenueDistributions] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal states
  const [showTokenizeModal, setShowTokenizeModal] = useState(false);
  const [selectedParkingLot, setSelectedParkingLot] = useState(null);

  // Form state for tokenization
  const [tokenizeForm, setTokenizeForm] = useState({
    parking_lot_id: '',
    spot_number: '',
    asset_type: 'single_spot',
    total_supply: 1,
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
        api.get('/api/institutional-operators/profile'),
        api.get('/api/institutional-operators/assets'),
        api.get('/api/institutional-operators/listings'),
        api.get('/api/institutional-operators/revenue-distributions'),
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
    if (!wallet) {
      alert('Please connect your Solana wallet first');
      return;
    }

    try {
      // Call backend API to tokenize asset
      const response = await api.post('/api/institutional-operators/tokenize', {
        ...tokenizeForm,
        operator_wallet: wallet.publicKey.toBase58(),
      });

      if (response.data.success) {
        alert('✅ Asset tokenized successfully!');
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
                    {operatorProfile.organization_type.replace('_', ' ').toUpperCase()}
                  </p>
                  <p className="text-gray-400 text-sm">
                    {operatorProfile.headquarters_city}, {operatorProfile.headquarters_country}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-gray-400 text-sm">Operator Rating</p>
                <p className="text-yellow-400 text-2xl font-bold">
                  {operatorProfile.operator_rating} ⭐
                </p>
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
                  <button className="w-full bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 text-sm font-semibold py-2 rounded transition-all">
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

                <div>
                  <label className="block text-gray-300 mb-2">Parking Lot ID</label>
                  <input
                    type="number"
                    value={tokenizeForm.parking_lot_id}
                    onChange={(e) => setTokenizeForm({ ...tokenizeForm, parking_lot_id: e.target.value })}
                    className="w-full bg-white/10 border border-white/30 rounded-lg py-2 px-4 text-white"
                    placeholder="Enter parking lot ID"
                  />
                </div>

                <div>
                  <label className="block text-gray-300 mb-2">Spot Number (e.g., A-42)</label>
                  <input
                    type="text"
                    value={tokenizeForm.spot_number}
                    onChange={(e) => setTokenizeForm({ ...tokenizeForm, spot_number: e.target.value })}
                    className="w-full bg-white/10 border border-white/30 rounded-lg py-2 px-4 text-white"
                    placeholder="A-42"
                  />
                </div>

                <div>
                  <label className="block text-gray-300 mb-2">Total Supply (Number of Tokens)</label>
                  <input
                    type="number"
                    value={tokenizeForm.total_supply}
                    onChange={(e) => setTokenizeForm({ ...tokenizeForm, total_supply: parseInt(e.target.value) })}
                    className="w-full bg-white/10 border border-white/30 rounded-lg py-2 px-4 text-white"
                    placeholder="1"
                  />
                </div>

                <div>
                  <label className="block text-gray-300 mb-2">Estimated Value (USDC)</label>
                  <input
                    type="number"
                    value={tokenizeForm.estimated_value_usdc}
                    onChange={(e) => setTokenizeForm({ ...tokenizeForm, estimated_value_usdc: parseFloat(e.target.value) })}
                    className="w-full bg-white/10 border border-white/30 rounded-lg py-2 px-4 text-white"
                    placeholder="10000"
                  />
                </div>

                <div>
                  <label className="block text-gray-300 mb-2">Annual Revenue (USDC)</label>
                  <input
                    type="number"
                    value={tokenizeForm.annual_revenue_usdc}
                    onChange={(e) => setTokenizeForm({ ...tokenizeForm, annual_revenue_usdc: parseFloat(e.target.value) })}
                    className="w-full bg-white/10 border border-white/30 rounded-lg py-2 px-4 text-white"
                    placeholder="800"
                  />
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
