// Transaction Simulator
// Simulate and preview transactions before sending

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  FaPlay, FaCheckCircle, FaClock, FaCoins,
  FaRocket, FaLayerGroup, FaRoute, FaBolt
} from 'react-icons/fa';
import { premiumTierService } from '../services/premiumTierService';
import { smartRoutingService } from '../services/smartRoutingService';

const TransactionSimulator = () => {
  const [amount, setAmount] = useState('100');
  const [count, setCount] = useState(1);
  const [useBatch, setUseBatch] = useState(false);
  const [simulation, setSimulation] = useState(null);
  const [simulating, setSimulating] = useState(false);

  const runSimulation = async () => {
    setSimulating(true);

    // Simulate delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    const tier = premiumTierService.getCurrentTier();
    const route = smartRoutingService.selectRoute({
      conditions: smartRoutingService.getNetworkConditions()
    });

    // Calculate costs
    const tokenAmount = parseFloat(amount);
    const pricePerToken = 0.001; // SOL per DCP
    const totalValue = tokenAmount * count * pricePerToken;

    let estimatedFees;
    let estimatedTime;

    if (useBatch && tier.benefits.maxBatchSize >= count) {
      // Batch simulation
      const batchFee = 0.0001;
      const overhead = count * 0.00001;
      estimatedFees = batchFee + overhead;
      estimatedTime = 5 + (count * 0.5); // seconds
    } else {
      // Individual transactions
      const baseFee = 0.000005;
      const gatewayFee = premiumTierService.calculateGatewayFee(0.0001);
      const priorityFee = premiumTierService.calculatePriorityFee(0.0001, 'normal');
      estimatedFees = (baseFee + gatewayFee + priorityFee) * count;

      const baseTime = 8; // seconds
      const tierSpeedup = tier.benefits.confirmationSpeedBoost;
      estimatedTime = (baseTime / tierSpeedup) * count;
    }

    // Success probability based on network conditions
    const conditionSuccess = {
      low: 0.99,
      normal: 0.97,
      high: 0.93,
      critical: 0.88
    };
    const successProbability = conditionSuccess[route.conditions] || 0.95;

    setSimulation({
      count,
      tokenAmount,
      totalValue,
      estimatedFees,
      estimatedTime,
      successProbability,
      route: route.primary,
      tier: tier.name,
      usedBatch: useBatch && tier.benefits.maxBatchSize >= count,
      recommendation: route.recommendation,
      networkConditions: route.conditions,
      estimatedCost: totalValue + estimatedFees,
      feePercentage: (estimatedFees / totalValue) * 100
    });

    setSimulating(false);
  };

  return (
    <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
      <h3 className="font-bold text-xl mb-4 flex items-center gap-2">
        <FaBolt className="text-yellow-400" />
        Transaction Simulator
      </h3>

      {/* Input Section */}
      <div className="bg-gray-700/30 rounded-lg p-4 mb-6 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Amount per transaction */}
          <div>
            <label className="block text-sm text-gray-400 mb-2">
              Amount (DCP tokens)
            </label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full px-4 py-2 bg-gray-600 border border-gray-500 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              min="1"
              max="10000"
            />
          </div>

          {/* Transaction count */}
          <div>
            <label className="block text-sm text-gray-400 mb-2">
              Number of Transactions
            </label>
            <input
              type="number"
              value={count}
              onChange={(e) => setCount(parseInt(e.target.value) || 1)}
              className="w-full px-4 py-2 bg-gray-600 border border-gray-500 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              min="1"
              max="100"
            />
          </div>
        </div>

        {/* Batch toggle */}
        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            id="useBatch"
            checked={useBatch}
            onChange={(e) => setUseBatch(e.target.checked)}
            className="w-4 h-4 text-blue-600 bg-gray-600 border-gray-500 rounded focus:ring-blue-500"
          />
          <label htmlFor="useBatch" className="text-sm text-gray-300">
            Use batch transactions (if available)
          </label>
        </div>

        {/* Simulate button */}
        <button
          onClick={runSimulation}
          disabled={simulating}
          className="w-full px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 disabled:from-gray-600 disabled:to-gray-600 text-white rounded-lg font-semibold transition-all flex items-center justify-center gap-2"
        >
          {simulating ? (
            <>
              <div className="animate-spin">
                <FaClock />
              </div>
              Simulating...
            </>
          ) : (
            <>
              <FaPlay />
              Run Simulation
            </>
          )}
        </button>
      </div>

      {/* Simulation Results */}
      {simulation && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          {/* Success Probability */}
          <div className="bg-gradient-to-r from-green-900/20 to-blue-900/20 border-2 border-green-700 rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <FaCheckCircle className="text-green-400 text-xl" />
                <span className="font-bold text-green-300">Success Probability</span>
              </div>
              <span className="text-3xl font-bold text-green-400">
                {(simulation.successProbability * 100).toFixed(1)}%
              </span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-3 overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${simulation.successProbability * 100}%` }}
                transition={{ duration: 1, ease: 'easeOut' }}
                className="h-full bg-gradient-to-r from-green-500 to-blue-500"
              />
            </div>
          </div>

          {/* Metrics Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-gray-700/30 rounded-lg p-3 border border-gray-600">
              <div className="text-xs text-gray-400 mb-1">Total Transactions</div>
              <div className="text-xl font-bold text-white">{simulation.count}</div>
            </div>
            <div className="bg-gray-700/30 rounded-lg p-3 border border-gray-600">
              <div className="text-xs text-gray-400 mb-1">Estimated Time</div>
              <div className="text-xl font-bold text-blue-400">
                {simulation.estimatedTime.toFixed(1)}s
              </div>
            </div>
            <div className="bg-gray-700/30 rounded-lg p-3 border border-gray-600">
              <div className="text-xs text-gray-400 mb-1">Estimated Fees</div>
              <div className="text-xl font-bold text-yellow-400">
                {simulation.estimatedFees.toFixed(6)} SOL
              </div>
            </div>
            <div className="bg-gray-700/30 rounded-lg p-3 border border-gray-600">
              <div className="text-xs text-gray-400 mb-1">Total Cost</div>
              <div className="text-xl font-bold text-purple-400">
                {simulation.estimatedCost.toFixed(6)} SOL
              </div>
            </div>
          </div>

          {/* Details */}
          <div className="bg-gray-700/30 rounded-lg p-4 border border-gray-600 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Token Amount:</span>
              <span className="font-semibold text-white">
                {simulation.tokenAmount * simulation.count} DCP
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Total Value:</span>
              <span className="font-semibold text-white">
                {simulation.totalValue.toFixed(6)} SOL
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Fee Percentage:</span>
              <span className="font-semibold text-yellow-400">
                {simulation.feePercentage.toFixed(2)}%
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Delivery Method:</span>
              <span className="font-semibold text-white flex items-center gap-2">
                {simulation.usedBatch ? (
                  <>
                    <FaLayerGroup className="text-blue-400" />
                    Batch
                  </>
                ) : (
                  <>
                    <FaRocket className="text-purple-400" />
                    Gateway
                  </>
                )}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-400">User Tier:</span>
              <span className="font-semibold text-white">{simulation.tier}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Network Status:</span>
              <span className={`font-semibold capitalize ${
                simulation.networkConditions === 'low' ? 'text-green-400' :
                simulation.networkConditions === 'normal' ? 'text-blue-400' :
                simulation.networkConditions === 'high' ? 'text-yellow-400' :
                'text-red-400'
              }`}>
                {simulation.networkConditions}
              </span>
            </div>
          </div>

          {/* Recommendation */}
          <div className="bg-blue-900/20 border border-blue-700 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <FaRoute className="text-blue-400 text-xl mt-0.5" />
              <div>
                <div className="font-semibold text-blue-300 mb-1">
                  Routing Recommendation
                </div>
                <div className="text-sm text-gray-300">
                  {simulation.recommendation}
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default TransactionSimulator;
