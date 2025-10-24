// Performance Recommendations Component
// AI-powered suggestions for optimization

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  FaLightbulb, FaCheckCircle, FaExclamationTriangle,
  FaInfo, FaChartLine, FaCrown, FaLayerGroup, FaRoute
} from 'react-icons/fa';
import { premiumTierService } from '../services/premiumTierService';
import { batchTransactionService } from '../services/batchTransactionService';
import { smartRoutingService } from '../services/smartRoutingService';
import { transactionStorage } from '../services/transactionStorage';

const PerformanceRecommendations = () => {
  const [recommendations, setRecommendations] = useState([]);

  useEffect(() => {
    generateRecommendations();
  }, []);

  const generateRecommendations = () => {
    const recs = [];
    const tier = premiumTierService.getCurrentTier();
    const tierProgress = premiumTierService.getNextTierProgress();
    const batchStats = batchTransactionService.getBatchStats();
    const routingStats = smartRoutingService.getRoutingStats();
    const metrics = transactionStorage.getMetrics();

    // Tier upgrade recommendation
    if (tierProgress.nextTier) {
      const txProgress = parseFloat(tierProgress.progress.transactions);
      const volProgress = parseFloat(tierProgress.progress.volume);

      if (txProgress > 70 || volProgress > 70) {
        recs.push({
          type: 'success',
          category: 'tier',
          icon: FaCrown,
          title: `You're close to ${tierProgress.nextTier.name} tier!`,
          description: `${tierProgress.remaining.transactions} more transactions or ${tierProgress.remaining.volume.toFixed(0)} DCP volume needed.`,
          impact: 'high',
          action: 'Keep transacting to unlock premium benefits',
          benefits: [
            `${tierProgress.nextTier.benefits.confirmationSpeedBoost}x faster confirmations`,
            `${(tierProgress.nextTier.benefits.feeDiscount * 100).toFixed(0)}% fee discount`,
            `Batch up to ${tierProgress.nextTier.benefits.maxBatchSize} transactions`
          ]
        });
      }
    }

    // Batch recommendation
    if (tier.benefits.maxBatchSize > 1 && batchStats.totalBatches < 5) {
      recs.push({
        type: 'info',
        category: 'batch',
        icon: FaLayerGroup,
        title: 'Try batch transactions for massive savings',
        description: `Your ${tier.name} tier supports batches up to ${tier.benefits.maxBatchSize} transactions.`,
        impact: 'high',
        action: 'Group your transactions to save up to 90% on fees',
        benefits: [
          'Single Gateway fee for multiple transactions',
          'Atomic execution (all succeed or all fail)',
          'Reduced network load'
        ]
      });
    }

    // Success rate optimization
    const successRate = parseFloat(metrics.successRate);
    if (successRate < 95 && metrics.totalTransactions > 5) {
      recs.push({
        type: 'warning',
        category: 'routing',
        icon: FaRoute,
        title: 'Success rate could be improved',
        description: `Current success rate: ${successRate}%. Gateway can help.`,
        impact: 'medium',
        action: 'Use smart routing to improve transaction reliability',
        benefits: [
          'Automatic channel selection',
          'Real-time network monitoring',
          'Failover to backup routes'
        ]
      });
    }

    // Network conditions recommendation
    const networkConditions = smartRoutingService.getNetworkConditions();
    if (networkConditions === 'high' || networkConditions === 'critical') {
      recs.push({
        type: 'warning',
        category: 'network',
        icon: FaExclamationTriangle,
        title: 'Network is congested',
        description: `Current status: ${networkConditions}. Consider waiting or using priority lanes.`,
        impact: 'medium',
        action: tier.level >= 2 ? 'Your tier has priority lanes - use them!' : 'Upgrade tier for priority access',
        benefits: [
          'Skip congestion with priority lanes',
          'Faster confirmations during peak times',
          'Higher success rates'
        ]
      });
    }

    // Cost optimization
    if (batchStats.totalSavings && parseFloat(batchStats.totalSavings) < 0.001) {
      recs.push({
        type: 'info',
        category: 'cost',
        icon: FaChartLine,
        title: 'Maximize your savings',
        description: 'You could be saving more with optimized transaction strategies.',
        impact: 'medium',
        action: 'Use batching and tier benefits for lower costs',
        benefits: [
          'Tier fee discounts',
          'Jito tip refunds',
          'Batch transaction savings'
        ]
      });
    }

    // Channel performance recommendation
    if (routingStats && routingStats.channelPerformance) {
      const channels = Object.entries(routingStats.channelPerformance);
      const bestChannel = channels.reduce((best, [name, perf]) =>
        perf.successRate > (best.perf?.successRate || 0) ? { name, perf } : best,
        {}
      );

      if (bestChannel.name && bestChannel.perf.totalTxs > 5) {
        recs.push({
          type: 'success',
          category: 'routing',
          icon: FaRoute,
          title: `${bestChannel.name.toUpperCase()} is performing best`,
          description: `${(bestChannel.perf.successRate * 100).toFixed(1)}% success rate, ${bestChannel.perf.avgConfirmTime}ms avg time.`,
          impact: 'low',
          action: 'Smart routing will automatically use this channel',
          benefits: [
            'Automatic optimization',
            'No manual intervention needed',
            'Continuous performance tracking'
          ]
        });
      }
    }

    // General optimization tip
    if (metrics.totalTransactions === 0) {
      recs.push({
        type: 'info',
        category: 'general',
        icon: FaLightbulb,
        title: 'Welcome to Gateway Pro!',
        description: 'Start transacting to unlock insights and recommendations.',
        impact: 'low',
        action: 'Try the demo mode or make your first transaction',
        benefits: [
          'Real-time analytics',
          'Personalized recommendations',
          'Tier progression tracking'
        ]
      });
    }

    setRecommendations(recs);
  };

  const getTypeStyles = (type) => {
    switch (type) {
      case 'success':
        return {
          bg: 'bg-green-900/20',
          border: 'border-green-700',
          iconColor: 'text-green-400'
        };
      case 'warning':
        return {
          bg: 'bg-yellow-900/20',
          border: 'border-yellow-700',
          iconColor: 'text-yellow-400'
        };
      case 'info':
      default:
        return {
          bg: 'bg-blue-900/20',
          border: 'border-blue-700',
          iconColor: 'text-blue-400'
        };
    }
  };

  const getImpactBadge = (impact) => {
    const colors = {
      high: 'bg-red-600 text-white',
      medium: 'bg-yellow-600 text-white',
      low: 'bg-blue-600 text-white'
    };

    return (
      <span className={`px-2 py-1 rounded text-xs font-semibold ${colors[impact]}`}>
        {impact.toUpperCase()} IMPACT
      </span>
    );
  };

  return (
    <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-xl flex items-center gap-2">
          <FaLightbulb className="text-yellow-400" />
          Performance Recommendations
        </h3>
        <button
          onClick={generateRecommendations}
          className="px-3 py-1 bg-blue-600 hover:bg-blue-500 rounded-lg text-sm font-medium transition-colors"
        >
          Refresh
        </button>
      </div>

      {recommendations.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <FaLightbulb className="text-4xl mx-auto mb-3 text-gray-600" />
          <p>No recommendations available</p>
        </div>
      ) : (
        <div className="space-y-4">
          {recommendations.map((rec, index) => {
            const styles = getTypeStyles(rec.type);
            const Icon = rec.icon;

            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`${styles.bg} border ${styles.border} rounded-xl p-4`}
              >
                <div className="flex items-start gap-4">
                  <Icon className={`text-2xl ${styles.iconColor} mt-1`} />

                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-bold text-white">{rec.title}</h4>
                      {getImpactBadge(rec.impact)}
                    </div>

                    <p className="text-sm text-gray-300 mb-3">{rec.description}</p>

                    <div className="bg-gray-700/30 rounded-lg p-3 mb-3">
                      <div className="text-sm font-semibold text-gray-300 mb-1">
                        Recommended Action:
                      </div>
                      <div className="text-sm text-gray-400">{rec.action}</div>
                    </div>

                    {rec.benefits && rec.benefits.length > 0 && (
                      <div>
                        <div className="text-xs font-semibold text-gray-400 mb-2">
                          Benefits:
                        </div>
                        <div className="space-y-1">
                          {rec.benefits.map((benefit, idx) => (
                            <div key={idx} className="flex items-center gap-2 text-sm text-gray-300">
                              <FaCheckCircle className="text-green-400 text-xs" />
                              {benefit}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default PerformanceRecommendations;
