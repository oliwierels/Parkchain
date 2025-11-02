// Advanced Gateway Dashboard for Parkchain
// Comprehensive analytics with Premium Tiers, Batch Transactions, and Smart Routing

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaTimes } from 'react-icons/fa';
import {
  FaCrown, FaRocket, FaLayerGroup, FaRoute, FaChartLine,
  FaStar, FaBolt, FaShieldAlt, FaTrophy, FaFire,
  FaArrowUp, FaClock, FaCoins, FaNetworkWired, FaPlay,
  FaTrash, FaDownload, FaInfoCircle, FaTools
} from 'react-icons/fa';
import { premiumTierService, USER_TIERS } from '../services/premiumTierService';
import { batchTransactionService } from '../services/batchTransactionService';
import { smartRoutingService, ROUTING_CHANNELS } from '../services/smartRoutingService';
import { transactionStorage } from '../services/transactionStorage';
import NetworkMonitor from '../components/NetworkMonitor';
import TransactionTimeline from '../components/TransactionTimeline';
import LiveNotifications from '../components/LiveNotifications';
import GatewayCharts from '../components/GatewayCharts';
import LiveActivityFeed from '../components/LiveActivityFeed';
import CostComparison from '../components/CostComparison';
import TransactionSimulator from '../components/TransactionSimulator';
import PerformanceRecommendations from '../components/PerformanceRecommendations';

const AdvancedGatewayDashboard = () => {
  const [currentTier, setCurrentTier] = useState(null);
  const [nextTierProgress, setNextTierProgress] = useState(null);
  const [tierStats, setTierStats] = useState(null);
  const [batchStats, setBatchStats] = useState(null);
  const [routingStats, setRoutingStats] = useState(null);
  const [networkConditions, setNetworkConditions] = useState('normal');
  const [activeTab, setActiveTab] = useState('overview'); // overview, tiers, batching, routing, tools
  const [showDemoInfo, setShowDemoInfo] = useState(false);
  const [transactions, setTransactions] = useState([]);

  useEffect(() => {
    loadData();

    // Auto-refresh every 10 seconds
    const interval = setInterval(loadData, 10000);
    return () => clearInterval(interval);
  }, []);

  const loadData = () => {
    // Load tier data
    const tier = premiumTierService.getCurrentTier();
    setCurrentTier(tier);

    const progress = premiumTierService.getNextTierProgress();
    setNextTierProgress(progress);

    const stats = premiumTierService.getTierStats();
    setTierStats(stats);

    // Load batch data
    const bStats = batchTransactionService.getBatchStats();
    setBatchStats(bStats);

    // Load routing data
    const rStats = smartRoutingService.getRoutingStats();
    setRoutingStats(rStats);
    setNetworkConditions(smartRoutingService.getNetworkConditions());

    // Load transactions
    const txs = transactionStorage.getTransactions();
    setTransactions(txs);
  };

  const handleUpgradeTier = () => {
    const result = premiumTierService.updateTier();
    if (result.upgraded) {
      alert(result.message);
      loadData();
    } else {
      alert('Keep transacting to unlock the next tier!');
    }
  };

  const generateDemoData = () => {
    if (confirm('Generate demo data? This will add 20 sample transactions and batches.')) {
      // Generate transaction data
      transactionStorage.generateDemoData(20);

      // Generate batch data (simulate some batches)
      for (let i = 0; i < 5; i++) {
        try {
          const batch = batchTransactionService.createBatch({ atomic: true });
          const txCount = Math.floor(Math.random() * 5) + 2; // 2-6 transactions

          for (let j = 0; j < txCount; j++) {
            batchTransactionService.addToBatch(batch.id, {
              amount: 100 + Math.random() * 900,
              type: 'demo'
            });
          }

          // Mark as completed
          const b = batchTransactionService.getBatch(batch.id);
          b.status = 'success';
          b.completedAt = new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString();
        } catch (error) {
          console.error('Error generating demo batch:', error);
        }
      }

      // Generate routing data
      const channels = ['rpc', 'jito', 'gateway', 'triton'];
      for (let i = 0; i < 30; i++) {
        const channel = channels[Math.floor(Math.random() * channels.length)];
        smartRoutingService.recordRoutingResult({
          channel,
          success: Math.random() > 0.1,
          confirmationTime: 2000 + Math.random() * 5000,
          signature: `demo_${i}`
        });
      }

      alert('✅ Demo data generated! Refresh to see the results.');
      loadData();
    }
  };

  const clearAllData = () => {
    if (confirm('⚠️ Clear all data? This cannot be undone!')) {
      transactionStorage.clearAll();
      batchTransactionService.clearHistory();
      smartRoutingService.resetPerformanceData();
      alert('✅ All data cleared!');
      loadData();
    }
  };

  const exportAllData = () => {
    const allData = {
      transactions: transactionStorage.getTransactions(),
      metrics: transactionStorage.getMetrics(),
      batches: batchTransactionService.getBatchHistory(),
      batchStats: batchTransactionService.getBatchStats(),
      routing: smartRoutingService.getRoutingStats(),
      tier: premiumTierService.getCurrentTier(),
      tierStats: premiumTierService.getTierStats(),
      exportedAt: new Date().toISOString()
    };

    const blob = new Blob([JSON.stringify(allData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `gateway-pro-data-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Tier Badge Component
  const TierBadge = ({ tier, size = 'normal' }) => {
    const sizeClasses = {
      small: 'px-2 py-1 text-xs',
      normal: 'px-3 py-1.5 text-sm',
      large: 'px-4 py-2 text-base'
    };

    return (
      <div
        className={`inline-flex items-center gap-2 rounded-full font-semibold ${sizeClasses[size]}`}
        style={{ backgroundColor: tier.color + '20', color: tier.color }}
      >
        <FaCrown className="text-sm" />
        {tier.name}
      </div>
    );
  };

  // Network Status Indicator
  const NetworkStatus = () => {
    const colors = {
      low: 'bg-green-500',
      normal: 'bg-blue-500',
      high: 'bg-yellow-500',
      critical: 'bg-red-500'
    };

    const labels = {
      low: 'Low Traffic',
      normal: 'Normal',
      high: 'Busy',
      critical: 'Congested'
    };

    return (
      <div className="flex items-center gap-2">
        <div className={`w-3 h-3 rounded-full ${colors[networkConditions]} animate-pulse`} />
        <span className="text-sm text-gray-300">{labels[networkConditions]}</span>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white">
      {/* Live Notifications */}
      <LiveNotifications />

      {/* Header */}
      <div className="bg-gray-800/50 border-b border-gray-700 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-3">
                <FaRocket className="text-blue-400" />
                Advanced Gateway Analytics
              </h1>
              <p className="text-gray-400 mt-1">Premium Features Dashboard</p>
            </div>
            <div className="flex items-center gap-4">
              <NetworkStatus />
              {currentTier && <TierBadge tier={currentTier} size="large" />}

              {/* Demo Controls */}
              <div className="flex items-center gap-2 ml-4">
                <button
                  onClick={() => setShowDemoInfo(!showDemoInfo)}
                  className="p-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
                  title="Demo Mode Info"
                >
                  <FaInfoCircle className="text-gray-300" />
                </button>
                <button
                  onClick={generateDemoData}
                  className="px-3 py-2 bg-green-600 hover:bg-green-500 rounded-lg font-medium transition-colors flex items-center gap-2"
                  title="Generate Demo Data"
                >
                  <FaPlay className="text-sm" />
                  <span className="hidden md:inline">Demo</span>
                </button>
                <button
                  onClick={exportAllData}
                  className="px-3 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg font-medium transition-colors flex items-center gap-2"
                  title="Export All Data"
                >
                  <FaDownload className="text-sm" />
                  <span className="hidden md:inline">Export</span>
                </button>
                <button
                  onClick={clearAllData}
                  className="px-3 py-2 bg-red-600 hover:bg-red-500 rounded-lg font-medium transition-colors flex items-center gap-2"
                  title="Clear All Data"
                >
                  <FaTrash className="text-sm" />
                  <span className="hidden md:inline">Clear</span>
                </button>
              </div>
            </div>
          </div>

          {/* Demo Info Banner */}
          {showDemoInfo && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-blue-900/20 border-t border-blue-700 px-6 py-4"
            >
              <div className="flex items-start gap-3">
                <FaInfoCircle className="text-blue-400 text-xl mt-0.5" />
                <div className="flex-1">
                  <h4 className="font-semibold text-blue-300 mb-2">Demo Mode</h4>
                  <p className="text-sm text-gray-300 mb-3">
                    Try out all Gateway Pro features without real transactions:
                  </p>
                  <ul className="text-sm text-gray-400 space-y-1 list-disc list-inside">
                    <li><strong>Demo:</strong> Generate 20 sample transactions, 5 batches, and routing data</li>
                    <li><strong>Export:</strong> Download all your data as JSON</li>
                    <li><strong>Clear:</strong> Reset everything to start fresh</li>
                    <li>All data is stored locally in your browser</li>
                  </ul>
                </div>
                <button
                  onClick={() => setShowDemoInfo(false)}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <FaTimes />
                </button>
              </div>
            </motion.div>
          )}

          <div className="border-b border-gray-700">
            <div className="max-w-7xl mx-auto px-6">
              <div className="flex gap-2">
                {[
                  { id: 'overview', label: 'Overview', icon: FaChartLine },
                  { id: 'tiers', label: 'Premium Tiers', icon: FaCrown },
                  { id: 'batching', label: 'Batch Transactions', icon: FaLayerGroup },
                  { id: 'routing', label: 'Smart Routing', icon: FaRoute },
                  { id: 'tools', label: 'Tools & Analytics', icon: FaTools }
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 px-4 py-3 font-medium transition-all ${
                      activeTab === tab.id
                        ? 'text-blue-400 border-b-2 border-blue-400'
                        : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    <tab.icon />
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard
                icon={FaCrown}
                label="Current Tier"
                value={currentTier?.name || 'Loading...'}
                color={currentTier?.color || '#6B7280'}
                subtext={`Level ${currentTier?.level || 0}`}
              />
              <StatCard
                icon={FaLayerGroup}
                label="Batch Transactions"
                value={batchStats?.totalBatches || 0}
                color="#10B981"
                subtext={`${batchStats?.successRate || 0}% success rate`}
              />
              <StatCard
                icon={FaRoute}
                label="Smart Routes"
                value={routingStats?.totalRouted || 0}
                color="#3B82F6"
                subtext={`${routingStats?.successRate || 0}% delivered`}
              />
              <StatCard
                icon={FaCoins}
                label="Total Savings"
                value={`${parseFloat(batchStats?.totalSavings || 0).toFixed(4)} XLM`}
                color="#F59E0B"
                subtext="From batching & optimization"
              />
            </div>

            {/* Tier Progress */}
            {nextTierProgress && nextTierProgress.nextTier && (
              <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-xl font-bold flex items-center gap-2">
                      <FaTrophy className="text-yellow-400" />
                      Progress to {nextTierProgress.nextTier.name}
                    </h3>
                    <p className="text-gray-400 text-sm mt-1">
                      Unlock premium benefits by completing transactions
                    </p>
                  </div>
                  <button
                    onClick={handleUpgradeTier}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg font-medium transition-colors"
                  >
                    Check Upgrade
                  </button>
                </div>

                <div className="space-y-4">
                  {/* Transactions Progress */}
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-gray-400">Transactions</span>
                      <span className="text-white font-medium">
                        {nextTierProgress.progress.transactions}%
                      </span>
                    </div>
                    <div className="h-3 bg-gray-700 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${nextTierProgress.progress.transactions}%` }}
                        className="h-full bg-gradient-to-r from-blue-500 to-purple-500"
                        transition={{ duration: 1, ease: 'easeOut' }}
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      {nextTierProgress.remaining.transactions} more transactions needed
                    </p>
                  </div>

                  {/* Volume Progress */}
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-gray-400">Volume</span>
                      <span className="text-white font-medium">
                        {nextTierProgress.progress.volume}%
                      </span>
                    </div>
                    <div className="h-3 bg-gray-700 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${nextTierProgress.progress.volume}%` }}
                        className="h-full bg-gradient-to-r from-green-500 to-blue-500"
                        transition={{ duration: 1, ease: 'easeOut' }}
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      {nextTierProgress.remaining.volume.toFixed(0)} DCP tokens more needed
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Network Monitor & Transaction Timeline */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <NetworkMonitor
                conditions={networkConditions}
                routingStats={routingStats}
              />
              <TransactionTimeline
                transactions={transactions}
                limit={5}
              />
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <QuickStat
                label="Priority Multiplier"
                value={`${currentTier?.benefits.priorityMultiplier}x`}
                icon={FaBolt}
                color="text-yellow-400"
              />
              <QuickStat
                label="Fee Discount"
                value={`${(currentTier?.benefits.feeDiscount * 100 || 0).toFixed(0)}%`}
                icon={FaCoins}
                color="text-green-400"
              />
              <QuickStat
                label="Max Batch Size"
                value={currentTier?.benefits.maxBatchSize || 1}
                icon={FaLayerGroup}
                color="text-blue-400"
              />
            </div>
          </motion.div>
        )}

        {/* Premium Tiers Tab */}
        {activeTab === 'tiers' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
              <h2 className="text-2xl font-bold mb-2 flex items-center gap-2">
                <FaCrown className="text-yellow-400" />
                Premium Tier Comparison
              </h2>
              <p className="text-gray-400 mb-6">
                Unlock faster transactions, lower fees, and exclusive features
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {Object.values(USER_TIERS).map(tier => (
                  <div
                    key={tier.id}
                    className={`rounded-xl p-6 border-2 transition-all ${
                      currentTier?.id === tier.id
                        ? 'border-blue-500 bg-blue-900/20 shadow-lg shadow-blue-500/20'
                        : 'border-gray-700 bg-gray-800/30 hover:border-gray-600'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-xl font-bold" style={{ color: tier.color }}>
                        {tier.name}
                      </h3>
                      {currentTier?.id === tier.id && (
                        <span className="px-2 py-1 bg-blue-600 text-xs rounded-full">
                          Current
                        </span>
                      )}
                    </div>

                    <div className="space-y-3 text-sm">
                      <div className="flex items-center gap-2 text-gray-300">
                        <FaBolt className="text-yellow-400" />
                        <span>{tier.benefits.confirmationSpeedBoost}x faster</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-300">
                        <FaCoins className="text-green-400" />
                        <span>{(tier.benefits.feeDiscount * 100).toFixed(0)}% fee discount</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-300">
                        <FaLayerGroup className="text-blue-400" />
                        <span>Batch up to {tier.benefits.maxBatchSize}</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-300">
                        <FaShieldAlt className="text-purple-400" />
                        <span>{tier.benefits.support} support</span>
                      </div>
                    </div>

                    <div className="mt-6 pt-4 border-t border-gray-700">
                      <p className="text-xs text-gray-500">Requirements:</p>
                      <p className="text-xs text-gray-400 mt-1">
                        {tier.requirements.minTransactions} transactions
                      </p>
                      <p className="text-xs text-gray-400">
                        {tier.requirements.minVolume} DCP volume
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* Batching Tab */}
        {activeTab === 'batching' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
              <h2 className="text-2xl font-bold mb-2 flex items-center gap-2">
                <FaLayerGroup className="text-blue-400" />
                Batch Transaction Analytics
              </h2>
              <p className="text-gray-400 mb-6">
                Save on fees by grouping multiple transactions
              </p>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <StatCard
                  icon={FaLayerGroup}
                  label="Total Batches"
                  value={batchStats?.totalBatches || 0}
                  color="#3B82F6"
                />
                <StatCard
                  icon={FaFire}
                  label="Active Batches"
                  value={batchStats?.activeBatches || 0}
                  color="#EF4444"
                />
                <StatCard
                  icon={FaChartLine}
                  label="Avg Batch Size"
                  value={batchStats?.averageBatchSize || 0}
                  color="#10B981"
                />
                <StatCard
                  icon={FaCoins}
                  label="Total Saved"
                  value={`${batchStats?.totalSavings || 0} XLM`}
                  color="#F59E0B"
                />
              </div>

              {/* Batch Efficiency Calculator */}
              <div className="bg-gray-700/30 rounded-lg p-4">
                <h3 className="font-bold mb-3 flex items-center gap-2">
                  <FaClock />
                  Batch Efficiency Calculator
                </h3>
                <p className="text-sm text-gray-400 mb-4">
                  Compare costs: Individual vs Batch transactions
                </p>

                <div className="grid grid-cols-3 gap-4 text-center">
                  {[3, 5, 10].map(count => {
                    const efficiency = batchTransactionService.calculateBatchEfficiency(count);
                    return (
                      <div key={count} className="bg-gray-800 rounded-lg p-4">
                        <div className="text-2xl font-bold text-blue-400">{count}</div>
                        <div className="text-xs text-gray-500 mb-3">transactions</div>
                        <div className="text-lg font-bold text-green-400">
                          {efficiency.savingsPercent}
                        </div>
                        <div className="text-xs text-gray-400">savings</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Routing Tab */}
        {activeTab === 'routing' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
              <h2 className="text-2xl font-bold mb-2 flex items-center gap-2">
                <FaRoute className="text-blue-400" />
                Smart Routing Analytics
              </h2>
              <p className="text-gray-400 mb-6">
                Real-time network optimization and route selection
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Channel Performance */}
                <div>
                  <h3 className="font-bold mb-4 flex items-center gap-2">
                    <FaNetworkWired className="text-green-400" />
                    Channel Performance
                  </h3>
                  <div className="space-y-3">
                    {routingStats?.channelPerformance && Object.entries(routingStats.channelPerformance).map(([channel, perf]) => {
                      const channelInfo = ROUTING_CHANNELS[channel.toUpperCase()];
                      return (
                        <div key={channel} className="bg-gray-700/30 rounded-lg p-4">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium capitalize">{channelInfo?.name || channel}</span>
                            <span className="text-sm text-green-400">
                              {(perf.successRate * 100).toFixed(1)}%
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-sm text-gray-400">
                            <span>Avg: {perf.avgConfirmTime}ms</span>
                            <span>{perf.totalTxs} txs</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Network Conditions */}
                <div>
                  <h3 className="font-bold mb-4 flex items-center gap-2">
                    <FaNetworkWired className="text-blue-400" />
                    Current Network Status
                  </h3>
                  <div className="bg-gray-700/30 rounded-lg p-6 text-center">
                    <div className="text-5xl mb-4">
                      {networkConditions === 'low' && '🟢'}
                      {networkConditions === 'normal' && '🔵'}
                      {networkConditions === 'high' && '🟡'}
                      {networkConditions === 'critical' && '🔴'}
                    </div>
                    <div className="text-2xl font-bold capitalize mb-2">
                      {networkConditions}
                    </div>
                    <p className="text-sm text-gray-400">
                      {networkConditions === 'low' && 'Perfect time for transactions'}
                      {networkConditions === 'normal' && 'Standard network conditions'}
                      {networkConditions === 'high' && 'Network is busy, using priority routes'}
                      {networkConditions === 'critical' && 'High congestion, maximum priority applied'}
                    </p>
                  </div>

                  {/* Recommended Route */}
                  <div className="mt-4 bg-blue-900/20 border border-blue-700 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <FaRoute className="text-blue-400" />
                      <span className="font-medium">Recommended Route</span>
                    </div>
                    <p className="text-sm text-gray-300">
                      {smartRoutingService.selectRoute().recommendation}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Tools & Analytics Tab */}
        {activeTab === 'tools' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* Interactive Charts */}
            <GatewayCharts
              transactionStorage={transactionStorage}
              batchStats={batchStats}
              routingStats={routingStats}
            />

            {/* Live Activity Feed & Performance Recommendations */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <LiveActivityFeed transactions={transactions} limit={10} />
              <PerformanceRecommendations />
            </div>

            {/* Cost Comparison */}
            <CostComparison />

            {/* Transaction Simulator */}
            <TransactionSimulator />
          </motion.div>
        )}
      </div>
    </div>
  );
};

// Stat Card Component
const StatCard = ({ icon: Icon, label, value, color, subtext }) => (
  <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700 hover:border-gray-600 transition-all">
    <div className="flex items-center justify-between mb-3">
      <Icon className="text-2xl" style={{ color }} />
    </div>
    <div className="text-3xl font-bold mb-1">{value}</div>
    <div className="text-sm text-gray-400">{label}</div>
    {subtext && <div className="text-xs text-gray-500 mt-1">{subtext}</div>}
  </div>
);

// Quick Stat Component
const QuickStat = ({ label, value, icon: Icon, color }) => (
  <div className="bg-gray-800/30 rounded-lg p-4 border border-gray-700">
    <div className="flex items-center gap-3">
      <Icon className={`text-2xl ${color}`} />
      <div>
        <div className="text-2xl font-bold">{value}</div>
        <div className="text-sm text-gray-400">{label}</div>
      </div>
    </div>
  </div>
);

export default AdvancedGatewayDashboard;
