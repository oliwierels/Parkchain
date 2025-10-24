// Premium Tier Service for Parkchain Gateway
// Manages user tiers and priority lane access
//
// Tier Benefits:
// - FREE: Standard transactions, default priority
// - BASIC: 2x faster confirmation, 5% fee discount
// - PREMIUM: 5x faster, 20% fee discount, priority lanes
// - VIP: 10x faster, 50% fee discount, dedicated lanes, batch support

import { transactionStorage } from './transactionStorage.js';

export const USER_TIERS = {
  FREE: {
    id: 'free',
    name: 'Free',
    level: 0,
    color: '#6B7280',
    benefits: {
      priorityMultiplier: 1,
      feeDiscount: 0,
      maxBatchSize: 1,
      dedicatedLane: false,
      confirmationSpeedBoost: 1,
      analytics: 'basic',
      support: 'community'
    },
    requirements: {
      minTransactions: 0,
      minVolume: 0
    }
  },
  BASIC: {
    id: 'basic',
    name: 'Basic',
    level: 1,
    color: '#10B981',
    benefits: {
      priorityMultiplier: 1.5,
      feeDiscount: 0.05,
      maxBatchSize: 5,
      dedicatedLane: false,
      confirmationSpeedBoost: 2,
      analytics: 'standard',
      support: 'email'
    },
    requirements: {
      minTransactions: 10,
      minVolume: 1000 // DCP tokens
    }
  },
  PREMIUM: {
    id: 'premium',
    name: 'Premium',
    level: 2,
    color: '#3B82F6',
    benefits: {
      priorityMultiplier: 3,
      feeDiscount: 0.20,
      maxBatchSize: 20,
      dedicatedLane: true,
      confirmationSpeedBoost: 5,
      analytics: 'advanced',
      support: 'priority'
    },
    requirements: {
      minTransactions: 50,
      minVolume: 10000
    }
  },
  VIP: {
    id: 'vip',
    name: 'VIP',
    level: 3,
    color: '#8B5CF6',
    benefits: {
      priorityMultiplier: 5,
      feeDiscount: 0.50,
      maxBatchSize: 100,
      dedicatedLane: true,
      confirmationSpeedBoost: 10,
      analytics: 'enterprise',
      support: 'dedicated'
    },
    requirements: {
      minTransactions: 200,
      minVolume: 100000
    }
  }
};

/**
 * Premium Tier Service
 * Manages user tier calculations and benefits
 */
class PremiumTierService {
  constructor() {
    this.currentTier = this.loadUserTier();
  }

  /**
   * Load user tier from localStorage
   */
  loadUserTier() {
    try {
      const stored = localStorage.getItem('parkchain_user_tier');
      return stored ? stored : 'free';
    } catch (error) {
      console.error('Error loading user tier:', error);
      return 'free';
    }
  }

  /**
   * Save user tier to localStorage
   */
  saveUserTier(tierId) {
    try {
      localStorage.setItem('parkchain_user_tier', tierId);
      this.currentTier = tierId;
    } catch (error) {
      console.error('Error saving user tier:', error);
    }
  }

  /**
   * Calculate user tier based on transaction history
   */
  calculateUserTier() {
    const metrics = transactionStorage.getMetrics();
    const transactions = transactionStorage.getTransactions();

    // Calculate total volume
    const totalVolume = transactions
      .filter(tx => tx.status === 'success')
      .reduce((sum, tx) => sum + (tx.amount || 0), 0);

    const totalTransactions = metrics.successfulTransactions;

    // Check VIP tier
    if (totalTransactions >= USER_TIERS.VIP.requirements.minTransactions &&
        totalVolume >= USER_TIERS.VIP.requirements.minVolume) {
      return 'vip';
    }

    // Check Premium tier
    if (totalTransactions >= USER_TIERS.PREMIUM.requirements.minTransactions &&
        totalVolume >= USER_TIERS.PREMIUM.requirements.minVolume) {
      return 'premium';
    }

    // Check Basic tier
    if (totalTransactions >= USER_TIERS.BASIC.requirements.minTransactions &&
        totalVolume >= USER_TIERS.BASIC.requirements.minVolume) {
      return 'basic';
    }

    // Default to Free tier
    return 'free';
  }

  /**
   * Get current tier
   */
  getCurrentTier() {
    return USER_TIERS[this.currentTier.toUpperCase()];
  }

  /**
   * Get next tier and progress
   */
  getNextTierProgress() {
    const currentTier = this.getCurrentTier();
    const nextTierKey = Object.keys(USER_TIERS).find(
      key => USER_TIERS[key].level === currentTier.level + 1
    );

    if (!nextTierKey) {
      return {
        nextTier: null,
        progress: {
          transactions: 100,
          volume: 100
        },
        remaining: {
          transactions: 0,
          volume: 0
        }
      };
    }

    const nextTier = USER_TIERS[nextTierKey];
    const metrics = transactionStorage.getMetrics();
    const transactions = transactionStorage.getTransactions();

    const totalVolume = transactions
      .filter(tx => tx.status === 'success')
      .reduce((sum, tx) => sum + (tx.amount || 0), 0);

    const totalTransactions = metrics.successfulTransactions;

    const transactionsProgress = Math.min(
      (totalTransactions / nextTier.requirements.minTransactions) * 100,
      100
    );
    const volumeProgress = Math.min(
      (totalVolume / nextTier.requirements.minVolume) * 100,
      100
    );

    return {
      nextTier,
      progress: {
        transactions: transactionsProgress.toFixed(1),
        volume: volumeProgress.toFixed(1)
      },
      remaining: {
        transactions: Math.max(0, nextTier.requirements.minTransactions - totalTransactions),
        volume: Math.max(0, nextTier.requirements.minVolume - totalVolume)
      }
    };
  }

  /**
   * Calculate priority fee for tier
   */
  calculatePriorityFee(baseFee, networkConditions = 'normal') {
    const tier = this.getCurrentTier();

    // Base fee multipliers based on network conditions
    const conditionMultipliers = {
      low: 0.5,
      normal: 1.0,
      high: 2.0,
      critical: 5.0
    };

    const conditionMultiplier = conditionMultipliers[networkConditions] || 1.0;
    const tierMultiplier = tier.benefits.priorityMultiplier;

    return baseFee * conditionMultiplier * tierMultiplier;
  }

  /**
   * Calculate gateway fee with tier discount
   */
  calculateGatewayFee(baseFee = 0.0001) {
    const tier = this.getCurrentTier();
    const discount = tier.benefits.feeDiscount;
    return baseFee * (1 - discount);
  }

  /**
   * Check if user can use batch transactions
   */
  canUseBatch(batchSize) {
    const tier = this.getCurrentTier();
    return batchSize <= tier.benefits.maxBatchSize;
  }

  /**
   * Get priority lane assignment
   */
  getPriorityLane() {
    const tier = this.getCurrentTier();

    if (tier.level >= 3) { // VIP
      return {
        lane: 'vip-dedicated',
        priority: 'highest',
        estimatedConfirmation: '1-2s',
        dedicated: true
      };
    }

    if (tier.level >= 2) { // Premium
      return {
        lane: 'premium',
        priority: 'high',
        estimatedConfirmation: '2-4s',
        dedicated: true
      };
    }

    if (tier.level >= 1) { // Basic
      return {
        lane: 'standard-fast',
        priority: 'medium',
        estimatedConfirmation: '4-8s',
        dedicated: false
      };
    }

    // Free
    return {
      lane: 'standard',
      priority: 'normal',
      estimatedConfirmation: '8-15s',
      dedicated: false
    };
  }

  /**
   * Update tier based on activity
   */
  updateTier() {
    const calculatedTier = this.calculateUserTier();
    const currentTier = this.getCurrentTier();

    if (calculatedTier !== currentTier.id) {
      this.saveUserTier(calculatedTier);

      // Return upgrade notification
      return {
        upgraded: true,
        oldTier: currentTier,
        newTier: USER_TIERS[calculatedTier.toUpperCase()],
        message: `Congratulations! You've been upgraded to ${USER_TIERS[calculatedTier.toUpperCase()].name} tier!`
      };
    }

    return { upgraded: false };
  }

  /**
   * Get tier comparison table
   */
  getAllTiers() {
    return Object.values(USER_TIERS);
  }

  /**
   * Get tier statistics
   */
  getTierStats() {
    const tier = this.getCurrentTier();
    const metrics = transactionStorage.getMetrics();
    const transactions = transactionStorage.getTransactions();

    const totalVolume = transactions
      .filter(tx => tx.status === 'success')
      .reduce((sum, tx) => sum + (tx.amount || 0), 0);

    const averageSavings = tier.benefits.feeDiscount * 0.0001 * metrics.totalTransactions;
    const speedImprovement = tier.benefits.confirmationSpeedBoost;

    return {
      tier: tier.name,
      level: tier.level,
      totalTransactions: metrics.successfulTransactions,
      totalVolume: totalVolume.toFixed(2),
      averageSavings: averageSavings.toFixed(6),
      speedImprovement: `${speedImprovement}x`,
      feeDiscount: `${(tier.benefits.feeDiscount * 100).toFixed(0)}%`,
      maxBatchSize: tier.benefits.maxBatchSize
    };
  }
}

// Export singleton instance
export const premiumTierService = new PremiumTierService();

export default premiumTierService;
