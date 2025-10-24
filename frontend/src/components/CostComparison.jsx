// Cost Comparison Tool
// Compare Gateway vs Standard RPC costs

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  FaCoins, FaRocket, FaBolt, FaCheckCircle,
  FaChartLine, FaCalculator
} from 'react-icons/fa';
import { premiumTierService } from '../services/premiumTierService';

const CostComparison = () => {
  const [transactionCount, setTransactionCount] = useState(100);
  const [useBatch, setUseBatch] = useState(false);
  const [comparison, setComparison] = useState(null);

  const calculateCosts = () => {
    const tier = premiumTierService.getCurrentTier();

    // Standard RPC costs
    const standardBaseFee = 0.000005; // Base transaction fee
    const standardPriorityFee = 0.0001; // Average priority fee
    const standardJitoTip = 0.0001; // Jito tip (if using)
    const standardTotalPerTx = standardBaseFee + standardPriorityFee + standardJitoTip;
    const standardTotal = standardTotalPerTx * transactionCount;

    // Gateway costs
    const gatewayBaseFee = 0.000005;
    const gatewayFee = premiumTierService.calculateGatewayFee(0.0001);
    const gatewayPriorityFee = premiumTierService.calculatePriorityFee(0.0001, 'normal');

    let gatewayTotal;
    if (useBatch && tier.benefits.maxBatchSize > 1) {
      // Batch pricing
      const batchCount = Math.ceil(transactionCount / tier.benefits.maxBatchSize);
      const batchFee = 0.0001;
      const overhead = batchCount * 0.00001;
      gatewayTotal = (batchCount * batchFee) + overhead;
    } else {
      // Individual transactions
      gatewayTotal = (gatewayBaseFee + gatewayFee + gatewayPriorityFee) * transactionCount;
    }

    // Jito refunds (30% of Gateway transactions get refunds)
    const jitoRefundRate = 0.3;
    const avgRefund = standardJitoTip * jitoRefundRate * transactionCount;
    const gatewayTotalWithRefunds = Math.max(0, gatewayTotal - avgRefund);

    const savings = standardTotal - gatewayTotalWithRefunds;
    const savingsPercent = (savings / standardTotal) * 100;

    // Time savings
    const standardAvgTime = 8; // seconds
    const gatewayAvgTime = standardAvgTime / tier.benefits.confirmationSpeedBoost;
    const timeSaved = (standardAvgTime - gatewayAvgTime) * transactionCount;

    setComparison({
      standard: {
        totalCost: standardTotal,
        perTransaction: standardTotalPerTx,
        avgTime: standardAvgTime,
        totalTime: standardAvgTime * transactionCount
      },
      gateway: {
        totalCost: gatewayTotal,
        totalCostWithRefunds: gatewayTotalWithRefunds,
        perTransaction: gatewayTotal / transactionCount,
        avgTime: gatewayAvgTime,
        totalTime: gatewayAvgTime * transactionCount,
        refunds: avgRefund
      },
      savings: {
        amount: savings,
        percent: savingsPercent,
        timeSaved: timeSaved
      },
      tier: tier.name,
      usedBatch: useBatch && tier.benefits.maxBatchSize > 1
    });
  };

  React.useEffect(() => {
    calculateCosts();
  }, [transactionCount, useBatch]);

  return (
    <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
      <h3 className="font-bold text-xl mb-4 flex items-center gap-2">
        <FaCalculator className="text-blue-400" />
        Cost Comparison Tool
      </h3>

      {/* Input Controls */}
      <div className="bg-gray-700/30 rounded-lg p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Transaction Count */}
          <div>
            <label className="block text-sm text-gray-400 mb-2">
              Number of Transactions
            </label>
            <input
              type="range"
              min="1"
              max="1000"
              value={transactionCount}
              onChange={(e) => setTransactionCount(parseInt(e.target.value))}
              className="w-full"
            />
            <div className="text-center mt-2">
              <span className="text-2xl font-bold text-white">{transactionCount}</span>
              <span className="text-sm text-gray-400 ml-2">transactions</span>
            </div>
          </div>

          {/* Batch Toggle */}
          <div>
            <label className="block text-sm text-gray-400 mb-2">
              Use Batch Transactions
            </label>
            <div className="flex items-center gap-3 mt-4">
              <button
                onClick={() => setUseBatch(!useBatch)}
                className={`flex-1 px-4 py-3 rounded-lg font-medium transition-all ${
                  useBatch
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-600 text-gray-300 hover:bg-gray-500'
                }`}
              >
                {useBatch ? 'Batching Enabled' : 'Batching Disabled'}
              </button>
            </div>
            {useBatch && (
              <div className="text-xs text-blue-400 mt-2">
                Max batch size: {premiumTierService.getCurrentTier().benefits.maxBatchSize}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Comparison Results */}
      {comparison && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          {/* Cost Comparison Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Standard RPC */}
            <div className="bg-red-900/20 border-2 border-red-700 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <FaBolt className="text-red-400 text-xl" />
                <h4 className="font-bold text-red-300">Standard RPC</h4>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-400 text-sm">Total Cost:</span>
                  <span className="font-bold text-white">
                    {comparison.standard.totalCost.toFixed(6)} SOL
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400 text-sm">Per Transaction:</span>
                  <span className="text-gray-300">
                    {comparison.standard.perTransaction.toFixed(6)} SOL
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400 text-sm">Avg Time:</span>
                  <span className="text-gray-300">{comparison.standard.avgTime}s</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400 text-sm">Total Time:</span>
                  <span className="text-gray-300">
                    {(comparison.standard.totalTime / 60).toFixed(1)}m
                  </span>
                </div>
              </div>
            </div>

            {/* Gateway */}
            <div className="bg-green-900/20 border-2 border-green-700 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <FaRocket className="text-green-400 text-xl" />
                <h4 className="font-bold text-green-300">
                  Gateway ({comparison.tier})
                </h4>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-400 text-sm">Total Cost:</span>
                  <span className="font-bold text-white">
                    {comparison.gateway.totalCostWithRefunds.toFixed(6)} SOL
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400 text-sm">Per Transaction:</span>
                  <span className="text-gray-300">
                    {comparison.gateway.perTransaction.toFixed(6)} SOL
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400 text-sm">Avg Time:</span>
                  <span className="text-gray-300">{comparison.gateway.avgTime.toFixed(1)}s</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400 text-sm">Total Time:</span>
                  <span className="text-gray-300">
                    {(comparison.gateway.totalTime / 60).toFixed(1)}m
                  </span>
                </div>
                {comparison.gateway.refunds > 0 && (
                  <div className="pt-2 border-t border-green-700">
                    <div className="flex justify-between text-green-400">
                      <span className="text-sm">Jito Refunds:</span>
                      <span className="font-bold">
                        {comparison.gateway.refunds.toFixed(6)} SOL
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Savings Summary */}
          <div className="bg-gradient-to-r from-blue-900/20 to-purple-900/20 border-2 border-blue-700 rounded-xl p-6">
            <div className="text-center mb-4">
              <div className="text-sm text-gray-400 mb-1">Total Savings with Gateway</div>
              <div className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-blue-400">
                {comparison.savings.amount.toFixed(6)} SOL
              </div>
              <div className="text-xl text-green-400 mt-2">
                ({comparison.savings.percent.toFixed(1)}% cheaper)
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mt-6">
              <div className="text-center p-3 bg-gray-700/30 rounded-lg">
                <FaChartLine className="text-2xl text-blue-400 mx-auto mb-2" />
                <div className="text-sm text-gray-400">Time Saved</div>
                <div className="text-lg font-bold text-white">
                  {(comparison.savings.timeSaved / 60).toFixed(1)}m
                </div>
              </div>
              <div className="text-center p-3 bg-gray-700/30 rounded-lg">
                <FaCheckCircle className="text-2xl text-green-400 mx-auto mb-2" />
                <div className="text-sm text-gray-400">Method</div>
                <div className="text-lg font-bold text-white">
                  {comparison.usedBatch ? 'Batch' : 'Individual'}
                </div>
              </div>
            </div>
          </div>

          {/* Recommendations */}
          <div className="bg-yellow-900/20 border border-yellow-700 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <FaCoins className="text-yellow-400 text-xl mt-0.5" />
              <div>
                <div className="font-semibold text-yellow-300 mb-1">
                  Recommendation
                </div>
                <div className="text-sm text-gray-300">
                  {comparison.savings.percent > 50 && (
                    <>Gateway can save you over 50% on transaction costs! {comparison.usedBatch && 'Batching is highly recommended for these volumes.'}</>
                  )}
                  {comparison.savings.percent > 20 && comparison.savings.percent <= 50 && (
                    <>Gateway provides significant savings. {!comparison.usedBatch && 'Consider enabling batching for even better results.'}</>
                  )}
                  {comparison.savings.percent <= 20 && (
                    <>Gateway still offers improved reliability and speed. Upgrade your tier for better savings.</>
                  )}
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default CostComparison;
