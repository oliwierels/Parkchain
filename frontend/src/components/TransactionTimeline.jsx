// Transaction Timeline Component
// Shows recent transactions with visual timeline

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FaCheckCircle, FaExclamationTriangle, FaClock,
  FaLayerGroup, FaRoute, FaBolt
} from 'react-icons/fa';

const TransactionTimeline = ({ transactions, limit = 10 }) => {
  const [displayTransactions, setDisplayTransactions] = useState([]);

  useEffect(() => {
    if (transactions && transactions.length > 0) {
      const sortedTxs = [...transactions]
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
        .slice(0, limit);
      setDisplayTransactions(sortedTxs);
    }
  }, [transactions, limit]);

  const getStatusIcon = (status) => {
    switch (status) {
      case 'success':
        return <FaCheckCircle className="text-green-400" />;
      case 'failed':
        return <FaExclamationTriangle className="text-red-400" />;
      case 'pending':
        return <FaClock className="text-yellow-400 animate-pulse" />;
      default:
        return <FaClock className="text-gray-400" />;
    }
  };

  const getDeliveryIcon = (method) => {
    if (method?.includes('batch')) {
      return <FaLayerGroup className="text-blue-400" />;
    }
    if (method?.includes('gateway')) {
      return <FaRoute className="text-purple-400" />;
    }
    return <FaBolt className="text-gray-400" />;
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

  if (!displayTransactions || displayTransactions.length === 0) {
    return (
      <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
        <h3 className="font-bold mb-4 flex items-center gap-2">
          <FaClock className="text-blue-400" />
          Recent Transactions
        </h3>
        <div className="text-center py-8 text-gray-500">
          No transactions yet
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
      <h3 className="font-bold mb-4 flex items-center gap-2">
        <FaClock className="text-blue-400" />
        Recent Transactions
      </h3>

      <div className="space-y-3">
        <AnimatePresence>
          {displayTransactions.map((tx, index) => (
            <motion.div
              key={tx.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ delay: index * 0.05 }}
              className="bg-gray-700/30 rounded-lg p-4 hover:bg-gray-700/50 transition-all cursor-pointer"
            >
              <div className="flex items-start gap-4">
                {/* Timeline Line */}
                <div className="flex flex-col items-center">
                  <div className="text-xl">{getStatusIcon(tx.status)}</div>
                  {index < displayTransactions.length - 1 && (
                    <div className="w-0.5 h-full bg-gray-600 mt-2" />
                  )}
                </div>

                {/* Transaction Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <div className="font-medium text-white mb-1">
                        {tx.amount} DCP {tx.metadata?.type && `(${tx.metadata.type})`}
                      </div>
                      <div className="text-xs text-gray-400">
                        {formatTime(tx.timestamp)}
                      </div>
                    </div>

                    {/* Delivery Method Badge */}
                    <div className="flex items-center gap-1 px-2 py-1 bg-gray-600/50 rounded text-xs">
                      {getDeliveryIcon(tx.deliveryMethod)}
                      <span className="text-gray-300 capitalize">
                        {tx.deliveryMethod?.split('-')[0] || 'rpc'}
                      </span>
                    </div>
                  </div>

                  {/* Metrics */}
                  <div className="flex items-center gap-3 text-xs text-gray-500">
                    {tx.confirmationTime && (
                      <span>
                        ⚡ {(tx.confirmationTime / 1000).toFixed(1)}s
                      </span>
                    )}
                    {tx.gatewayFee !== undefined && (
                      <span>
                        💰 {tx.gatewayFee.toFixed(6)} XLM
                      </span>
                    )}
                    {tx.jitoTipRefunded > 0 && (
                      <span className="text-green-400">
                        ↩️ {tx.jitoTipRefunded.toFixed(6)} XLM refunded
                      </span>
                    )}
                  </div>

                  {/* Signature */}
                  {tx.signature && (
                    <div className="mt-2 text-xs font-mono text-gray-600 truncate">
                      {tx.signature.slice(0, 20)}...{tx.signature.slice(-20)}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {transactions && transactions.length > limit && (
        <div className="mt-4 text-center text-sm text-gray-500">
          Showing {limit} of {transactions.length} transactions
        </div>
      )}
    </div>
  );
};

export default TransactionTimeline;
