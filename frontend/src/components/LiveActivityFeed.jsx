// Live Activity Feed Component
// Shows real-time events and activities

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FaCheckCircle, FaExclamationTriangle, FaCrown, FaLayerGroup,
  FaRoute, FaBolt, FaCoins, FaRocket, FaClock
} from 'react-icons/fa';

const LiveActivityFeed = ({ transactions, limit = 15 }) => {
  const [activities, setActivities] = useState([]);
  const [filter, setFilter] = useState('all'); // all, transactions, upgrades, batches

  useEffect(() => {
    if (transactions && transactions.length > 0) {
      // Convert transactions to activity format
      const txActivities = transactions.slice(0, limit).map(tx => ({
        id: tx.id,
        type: getTxActivityType(tx),
        timestamp: tx.timestamp,
        data: tx,
        icon: getActivityIcon(tx),
        color: getActivityColor(tx)
      }));

      setActivities(txActivities);
    }
  }, [transactions, limit]);

  const getTxActivityType = (tx) => {
    if (tx.deliveryMethod?.includes('batch')) return 'batch';
    if (tx.status === 'success') return 'transaction';
    if (tx.status === 'failed') return 'error';
    return 'transaction';
  };

  const getActivityIcon = (tx) => {
    if (tx.deliveryMethod?.includes('batch')) return FaLayerGroup;
    if (tx.status === 'success') return FaCheckCircle;
    if (tx.status === 'failed') return FaExclamationTriangle;
    if (tx.gatewayUsed) return FaRocket;
    return FaBolt;
  };

  const getActivityColor = (tx) => {
    if (tx.deliveryMethod?.includes('batch')) return 'text-blue-400';
    if (tx.status === 'success') return 'text-green-400';
    if (tx.status === 'failed') return 'text-red-400';
    if (tx.gatewayUsed) return 'text-purple-400';
    return 'text-gray-400';
  };

  const getActivityMessage = (activity) => {
    const tx = activity.data;

    if (activity.type === 'batch') {
      return {
        title: 'Batch Transaction Completed',
        description: `${tx.amount} DCP tokens via batch delivery`,
        details: `Saved ${(tx.jitoTipRefunded || 0).toFixed(6)} SOL in fees`
      };
    }

    if (activity.type === 'transaction') {
      return {
        title: 'Transaction Successful',
        description: `${tx.amount} DCP tokens purchased`,
        details: tx.gatewayUsed
          ? `⚡ Via Gateway in ${(tx.confirmationTime / 1000).toFixed(1)}s`
          : `📤 Standard RPC delivery`
      };
    }

    if (activity.type === 'error') {
      return {
        title: 'Transaction Failed',
        description: `Failed to process ${tx.amount} DCP tokens`,
        details: 'Check network conditions and try again'
      };
    }

    return {
      title: 'Activity',
      description: 'Unknown activity type',
      details: ''
    };
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;

    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return date.toLocaleDateString();
  };

  const filteredActivities = activities.filter(activity => {
    if (filter === 'all') return true;
    if (filter === 'transactions') return activity.type === 'transaction';
    if (filter === 'batches') return activity.type === 'batch';
    if (filter === 'errors') return activity.type === 'error';
    return true;
  });

  return (
    <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-lg flex items-center gap-2">
          <FaBolt className="text-yellow-400" />
          Live Activity Feed
        </h3>

        {/* Filter Buttons */}
        <div className="flex gap-2">
          {[
            { id: 'all', label: 'All' },
            { id: 'transactions', label: 'Transactions' },
            { id: 'batches', label: 'Batches' },
            { id: 'errors', label: 'Errors' }
          ].map(f => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                filter === f.id
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Activity List */}
      <div className="space-y-2 max-h-96 overflow-y-auto">
        {filteredActivities.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <FaClock className="text-4xl mx-auto mb-3 text-gray-600" />
            <p>No activities yet</p>
            <p className="text-sm mt-1">Activities will appear here in real-time</p>
          </div>
        ) : (
          <AnimatePresence>
            {filteredActivities.map((activity, index) => {
              const Icon = activity.icon;
              const message = getActivityMessage(activity);

              return (
                <motion.div
                  key={activity.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ delay: index * 0.03 }}
                  className="bg-gray-700/30 rounded-lg p-4 hover:bg-gray-700/50 transition-all border border-gray-600/30 hover:border-gray-500/50"
                >
                  <div className="flex items-start gap-3">
                    {/* Icon */}
                    <div className={`text-xl ${activity.color} mt-0.5`}>
                      <Icon />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between mb-1">
                        <div className="font-medium text-white">
                          {message.title}
                        </div>
                        <div className="text-xs text-gray-500 whitespace-nowrap ml-2">
                          {formatTime(activity.timestamp)}
                        </div>
                      </div>

                      <div className="text-sm text-gray-400 mb-1">
                        {message.description}
                      </div>

                      {message.details && (
                        <div className="text-xs text-gray-500">
                          {message.details}
                        </div>
                      )}

                      {/* Transaction Details */}
                      {activity.type === 'transaction' && activity.data.signature && (
                        <div className="mt-2 flex items-center gap-2 text-xs">
                          <a
                            href={`https://explorer.solana.com/tx/${activity.data.signature}?cluster=devnet`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-400 hover:text-blue-300 hover:underline font-mono"
                          >
                            {activity.data.signature.slice(0, 8)}...
                          </a>
                          {activity.data.gatewayFee > 0 && (
                            <span className="text-yellow-400">
                              💰 {activity.data.gatewayFee.toFixed(6)} SOL
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Status Badge */}
                    {activity.type === 'batch' && (
                      <div className="px-2 py-1 bg-blue-900/30 border border-blue-700 rounded text-xs text-blue-300">
                        BATCH
                      </div>
                    )}
                    {activity.data.gatewayUsed && activity.type === 'transaction' && (
                      <div className="px-2 py-1 bg-purple-900/30 border border-purple-700 rounded text-xs text-purple-300">
                        GATEWAY
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}
      </div>

      {/* Stats Footer */}
      {filteredActivities.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-600 flex items-center justify-between text-xs text-gray-500">
          <span>Showing {filteredActivities.length} activities</span>
          <span>Auto-refreshes every 10s</span>
        </div>
      )}
    </div>
  );
};

export default LiveActivityFeed;
