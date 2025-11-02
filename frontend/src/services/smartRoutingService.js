// Smart Routing Service for Parkchain Gateway
// Intelligently routes transactions based on real-time network conditions
//
// Features:
// - Real-time network congestion monitoring
// - Dynamic route selection (RPC, Jito, Triton, Paladin)
// - Cost optimization based on conditions
// - Automatic failover and retry logic
// - Historical performance tracking

import { premiumTierService } from './premiumTierService.js';

export const NETWORK_CONDITIONS = {
  LOW: 'low',
  NORMAL: 'normal',
  HIGH: 'high',
  CRITICAL: 'critical'
};

export const ROUTING_CHANNELS = {
  RPC: {
    id: 'rpc',
    name: 'Standard RPC',
    baseCost: 0.000005, // Base transaction fee
    speed: 'medium',
    reliability: 0.95,
    bestFor: ['low', 'normal']
  },
  JITO: {
    id: 'jito',
    name: 'Jito Bundles',
    baseCost: 0.0001, // Tip required
    speed: 'fast',
    reliability: 0.97,
    bestFor: ['high', 'critical']
  },
  TRITON: {
    id: 'triton',
    name: 'Triton Priority',
    baseCost: 0.00005,
    speed: 'very-fast',
    reliability: 0.98,
    bestFor: ['high', 'critical']
  },
  GATEWAY: {
    id: 'gateway',
    name: 'Gateway Optimized',
    baseCost: 0.0001,
    speed: 'optimized',
    reliability: 0.99,
    bestFor: ['normal', 'high', 'critical']
  }
};

/**
 * Smart Routing Service
 * Manages intelligent transaction routing
 */
class SmartRoutingService {
  constructor() {
    this.networkConditions = NETWORK_CONDITIONS.NORMAL;
    this.channelPerformance = this.loadChannelPerformance();
    this.routingHistory = [];
    this.isMonitoring = false;
  }

  /**
   * Load channel performance from localStorage
   */
  loadChannelPerformance() {
    try {
      const stored = localStorage.getItem('parkchain_channel_performance');
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      console.error('Error loading channel performance:', error);
    }

    // Default performance metrics
    return {
      rpc: { successRate: 0.95, avgConfirmTime: 8000, totalTxs: 0 },
      jito: { successRate: 0.97, avgConfirmTime: 4000, totalTxs: 0 },
      triton: { successRate: 0.98, avgConfirmTime: 2000, totalTxs: 0 },
      gateway: { successRate: 0.99, avgConfirmTime: 3000, totalTxs: 0 }
    };
  }

  /**
   * Save channel performance to localStorage
   */
  saveChannelPerformance() {
    try {
      localStorage.setItem('parkchain_channel_performance', JSON.stringify(this.channelPerformance));
    } catch (error) {
      console.error('Error saving channel performance:', error);
    }
  }

  /**
   * Monitor network conditions
   */
  async monitorNetworkConditions(connection) {
    if (!connection) {
      console.warn('No connection provided for network monitoring');
      return;
    }

    try {
      // Get recent performance samples
      const recentPerformance = await connection.getRecentPerformanceSamples(10);

      if (recentPerformance && recentPerformance.length > 0) {
        // Calculate average transactions per slot
        const avgTxPerSlot = recentPerformance.reduce((sum, sample) =>
          sum + sample.numTransactions, 0
        ) / recentPerformance.length;

        // Determine network conditions based on tx volume
        // These thresholds are approximate for Stellar devnet
        if (avgTxPerSlot < 1000) {
          this.networkConditions = NETWORK_CONDITIONS.LOW;
        } else if (avgTxPerSlot < 2000) {
          this.networkConditions = NETWORK_CONDITIONS.NORMAL;
        } else if (avgTxPerSlot < 3000) {
          this.networkConditions = NETWORK_CONDITIONS.HIGH;
        } else {
          this.networkConditions = NETWORK_CONDITIONS.CRITICAL;
        }

        console.log(`[SmartRouting] Network conditions: ${this.networkConditions} (${avgTxPerSlot.toFixed(0)} tx/slot)`);
      }
    } catch (error) {
      console.error('Error monitoring network:', error);
      // Default to normal on error
      this.networkConditions = NETWORK_CONDITIONS.NORMAL;
    }
  }

  /**
   * Start continuous monitoring
   */
  startMonitoring(connection, interval = 30000) {
    if (this.isMonitoring) {
      console.warn('Monitoring already started');
      return;
    }

    this.isMonitoring = true;

    // Initial check
    this.monitorNetworkConditions(connection);

    // Periodic monitoring
    this.monitoringInterval = setInterval(() => {
      this.monitorNetworkConditions(connection);
    }, interval);

    console.log('[SmartRouting] Network monitoring started');
  }

  /**
   * Stop monitoring
   */
  stopMonitoring() {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
    this.isMonitoring = false;
    console.log('[SmartRouting] Network monitoring stopped');
  }

  /**
   * Get current network conditions
   */
  getNetworkConditions() {
    return this.networkConditions;
  }

  /**
   * Calculate route score
   * Higher score = better route for current conditions
   */
  calculateRouteScore(channel, conditions, userTier) {
    const channelInfo = ROUTING_CHANNELS[channel.toUpperCase()];

    if (!channelInfo) return 0;

    let score = 0;

    // Base reliability score
    score += channelInfo.reliability * 50;

    // Performance from history
    const perf = this.channelPerformance[channel];
    if (perf) {
      score += perf.successRate * 30;

      // Faster confirmation = higher score
      const timeScore = Math.max(0, 20 - (perf.avgConfirmTime / 1000));
      score += timeScore;
    }

    // Condition match bonus
    if (channelInfo.bestFor.includes(conditions)) {
      score += 20;
    }

    // User tier bonus for premium channels
    if (userTier.level >= 2 && ['triton', 'gateway'].includes(channel)) {
      score += 15;
    }

    // Cost penalty (lower cost = higher score)
    const costPenalty = channelInfo.baseCost * 10000; // Normalize
    score -= costPenalty;

    return score;
  }

  /**
   * Select best route for transaction
   */
  selectRoute(options = {}) {
    const conditions = options.conditions || this.networkConditions;
    const userTier = premiumTierService.getCurrentTier();
    const prioritize = options.prioritize || 'balanced'; // 'speed', 'cost', 'balanced'

    // Available channels based on tier
    let availableChannels = ['rpc', 'gateway'];

    if (userTier.level >= 1) {
      availableChannels.push('jito');
    }

    if (userTier.level >= 2) {
      availableChannels.push('triton');
    }

    // Calculate scores for each channel
    const channelScores = availableChannels.map(channel => {
      let score = this.calculateRouteScore(channel, conditions, userTier);

      // Adjust score based on prioritization
      if (prioritize === 'speed') {
        const channelInfo = ROUTING_CHANNELS[channel.toUpperCase()];
        const speedBonus = {
          'very-fast': 30,
          'fast': 20,
          'optimized': 25,
          'medium': 10
        };
        score += speedBonus[channelInfo.speed] || 0;
      } else if (prioritize === 'cost') {
        const channelInfo = ROUTING_CHANNELS[channel.toUpperCase()];
        score += (1 / channelInfo.baseCost) * 5; // Inverse cost bonus
      }

      return {
        channel,
        score,
        info: ROUTING_CHANNELS[channel.toUpperCase()]
      };
    });

    // Sort by score (highest first)
    channelScores.sort((a, b) => b.score - a.score);

    const selectedRoute = channelScores[0];
    const alternativeRoutes = channelScores.slice(1, 3); // Top 2 alternatives

    return {
      primary: selectedRoute,
      alternatives: alternativeRoutes,
      conditions,
      recommendation: this.generateRecommendation(selectedRoute, conditions, userTier)
    };
  }

  /**
   * Generate routing recommendation
   */
  generateRecommendation(route, conditions, userTier) {
    let recommendation = '';

    if (conditions === NETWORK_CONDITIONS.CRITICAL) {
      recommendation = `Network is congested. Using ${route.info.name} for fastest delivery.`;
    } else if (conditions === NETWORK_CONDITIONS.HIGH) {
      recommendation = `Network is busy. ${route.info.name} offers best balance.`;
    } else if (conditions === NETWORK_CONDITIONS.LOW) {
      recommendation = `Network is clear. ${route.info.name} provides cost-effective delivery.`;
    } else {
      recommendation = `${route.info.name} recommended for current conditions.`;
    }

    if (userTier.level < 2 && route.channel === 'gateway') {
      recommendation += ' Upgrade to Premium for more routing options.';
    }

    return recommendation;
  }

  /**
   * Record routing result
   */
  recordRoutingResult(result) {
    const { channel, success, confirmationTime, signature } = result;

    // Update channel performance
    if (this.channelPerformance[channel]) {
      const perf = this.channelPerformance[channel];

      perf.totalTxs++;

      // Update success rate (exponential moving average)
      const alpha = 0.1; // Smoothing factor
      perf.successRate = alpha * (success ? 1 : 0) + (1 - alpha) * perf.successRate;

      // Update average confirmation time
      if (success && confirmationTime) {
        perf.avgConfirmTime = alpha * confirmationTime + (1 - alpha) * perf.avgConfirmTime;
      }

      this.saveChannelPerformance();
    }

    // Add to routing history
    this.routingHistory.unshift({
      timestamp: new Date().toISOString(),
      channel,
      success,
      confirmationTime,
      signature,
      conditions: this.networkConditions
    });

    // Keep last 100 records
    if (this.routingHistory.length > 100) {
      this.routingHistory = this.routingHistory.slice(0, 100);
    }
  }

  /**
   * Get routing statistics
   */
  getRoutingStats() {
    const totalRouted = this.routingHistory.length;

    if (totalRouted === 0) {
      return {
        totalRouted: 0,
        channelDistribution: {},
        averageConfirmTime: 0,
        successRate: '0.00'
      };
    }

    // Channel distribution
    const channelDistribution = {};
    this.routingHistory.forEach(record => {
      channelDistribution[record.channel] = (channelDistribution[record.channel] || 0) + 1;
    });

    // Success rate
    const successful = this.routingHistory.filter(r => r.success).length;
    const successRate = ((successful / totalRouted) * 100).toFixed(2);

    // Average confirmation time
    const successfulWithTime = this.routingHistory.filter(r => r.success && r.confirmationTime);
    const avgConfirmTime = successfulWithTime.length > 0
      ? successfulWithTime.reduce((sum, r) => sum + r.confirmationTime, 0) / successfulWithTime.length
      : 0;

    return {
      totalRouted,
      channelDistribution,
      averageConfirmTime: avgConfirmTime.toFixed(0),
      successRate,
      networkConditions: this.networkConditions,
      channelPerformance: this.channelPerformance
    };
  }

  /**
   * Get routing recommendations for bulk
   */
  getBulkRoutingStrategy(transactionCount) {
    const tier = premiumTierService.getCurrentTier();
    const conditions = this.networkConditions;

    let strategy = {
      recommended: 'sequential',
      channels: [],
      estimatedTime: 0,
      estimatedCost: 0
    };

    // If user can use batch
    if (tier.benefits.maxBatchSize >= transactionCount) {
      strategy.recommended = 'batch';
      strategy.channels = ['gateway'];
      strategy.estimatedTime = 5000; // 5 seconds for batch
      strategy.estimatedCost = 0.0001 + (transactionCount * 0.00001);
    } else {
      // Sequential with load balancing
      const route = this.selectRoute({ conditions });

      strategy.recommended = 'sequential';
      strategy.channels = [route.primary.channel];
      strategy.estimatedTime = transactionCount * (this.channelPerformance[route.primary.channel]?.avgConfirmTime || 5000);
      strategy.estimatedCost = transactionCount * route.primary.info.baseCost;
    }

    return strategy;
  }

  /**
   * Reset performance data
   */
  resetPerformanceData() {
    this.channelPerformance = {
      rpc: { successRate: 0.95, avgConfirmTime: 8000, totalTxs: 0 },
      jito: { successRate: 0.97, avgConfirmTime: 4000, totalTxs: 0 },
      triton: { successRate: 0.98, avgConfirmTime: 2000, totalTxs: 0 },
      gateway: { successRate: 0.99, avgConfirmTime: 3000, totalTxs: 0 }
    };
    this.routingHistory = [];
    this.saveChannelPerformance();
  }
}

// Export singleton instance
export const smartRoutingService = new SmartRoutingService();

export default smartRoutingService;
