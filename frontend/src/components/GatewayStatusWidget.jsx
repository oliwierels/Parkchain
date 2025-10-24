// Gateway Status Widget Component
// Compact widget showing Gateway status and tier info

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  FaRocket, FaCrown, FaChartLine, FaCoins, FaBolt
} from 'react-icons/fa';
import { premiumTierService } from '../services/premiumTierService';
import { transactionStorage } from '../services/transactionStorage';
import { smartRoutingService } from '../services/smartRoutingService';

const GatewayStatusWidget = ({ compact = false }) => {
  const [tier, setTier] = useState(null);
  const [metrics, setMetrics] = useState(null);
  const [networkConditions, setNetworkConditions] = useState('normal');
  const [isExpanded, setIsExpanded] = useState(!compact);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, []);

  const loadData = () => {
    const currentTier = premiumTierService.getCurrentTier();
    setTier(currentTier);

    const txMetrics = transactionStorage.getMetrics();
    setMetrics(txMetrics);

    const conditions = smartRoutingService.getNetworkConditions();
    setNetworkConditions(conditions);
  };

  const getNetworkColor = () => {
    const colors = {
      low: '#10B981',
      normal: '#3B82F6',
      high: '#F59E0B',
      critical: '#EF4444'
    };
    return colors[networkConditions] || colors.normal;
  };

  const getNetworkEmoji = () => {
    const emojis = {
      low: '🟢',
      normal: '🔵',
      high: '🟡',
      critical: '🔴'
    };
    return emojis[networkConditions] || '🔵';
  };

  if (!tier || !metrics) {
    return null;
  }

  if (compact && !isExpanded) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="fixed bottom-6 right-6 z-40"
      >
        <button
          onClick={() => setIsExpanded(true)}
          className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white rounded-full p-4 shadow-2xl transition-all hover:scale-110"
          title="Gateway Status"
        >
          <FaRocket className="text-2xl" />
        </button>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`${
        compact
          ? 'fixed bottom-6 right-6 z-40 w-80'
          : 'w-full'
      }`}
    >
      <div className="bg-gray-800 rounded-xl border border-gray-700 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FaRocket className="text-white" />
            <span className="font-bold text-white text-sm">Gateway Status</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
              <div
                className="w-2 h-2 rounded-full animate-pulse"
                style={{ backgroundColor: getNetworkColor() }}
              />
              <span className="text-xs text-white opacity-90 capitalize">{networkConditions}</span>
            </div>
            {compact && (
              <button
                onClick={() => setIsExpanded(false)}
                className="text-white hover:text-gray-200 transition-colors"
              >
                ×
              </button>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="p-4 space-y-3">
          {/* Tier Info */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FaCrown className="text-yellow-400" />
              <span className="text-sm text-gray-400">Tier</span>
            </div>
            <div
              className="px-3 py-1 rounded-full text-sm font-semibold"
              style={{ backgroundColor: tier.color + '20', color: tier.color }}
            >
              {tier.name}
            </div>
          </div>

          {/* Metrics Grid */}
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-gray-700/50 rounded-lg p-2">
              <div className="text-xs text-gray-400 mb-1">Transactions</div>
              <div className="text-lg font-bold text-white">{metrics.totalTransactions}</div>
            </div>
            <div className="bg-gray-700/50 rounded-lg p-2">
              <div className="text-xs text-gray-400 mb-1">Success Rate</div>
              <div className="text-lg font-bold text-green-400">{metrics.successRate}%</div>
            </div>
          </div>

          {/* Benefits */}
          <div className="bg-blue-900/20 border border-blue-700 rounded-lg p-3 space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-400">Speed Boost:</span>
              <span className="text-blue-400 font-semibold">{tier.benefits.confirmationSpeedBoost}x</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-400">Fee Discount:</span>
              <span className="text-green-400 font-semibold">{(tier.benefits.feeDiscount * 100).toFixed(0)}%</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-400">Max Batch:</span>
              <span className="text-purple-400 font-semibold">{tier.benefits.maxBatchSize}</span>
            </div>
          </div>

          {/* Actions */}
          <div className="grid grid-cols-2 gap-2">
            <Link
              to="/advanced-gateway"
              className="px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-medium text-center transition-colors flex items-center justify-center gap-1"
            >
              <FaChartLine />
              Dashboard
            </Link>
            <button
              onClick={() => {
                // Trigger tier check
                const result = premiumTierService.updateTier();
                if (result.upgraded) {
                  alert(result.message);
                  loadData();
                } else {
                  alert('Keep transacting to upgrade your tier!');
                }
              }}
              className="px-3 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-xs font-medium transition-colors flex items-center justify-center gap-1"
            >
              <FaBolt />
              Upgrade
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default GatewayStatusWidget;
