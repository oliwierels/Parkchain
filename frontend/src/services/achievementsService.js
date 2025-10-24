// Achievements & Rewards Service
// Gamification system for Gateway Pro

import { transactionStorage } from './transactionStorage';
import { premiumTierService } from './premiumTierService';
import { batchTransactionService } from './batchTransactionService';

export const ACHIEVEMENT_CATEGORIES = {
  TRANSACTIONS: 'transactions',
  SAVINGS: 'savings',
  TIERS: 'tiers',
  BATCHING: 'batching',
  CONSISTENCY: 'consistency',
  SPECIAL: 'special'
};

export const ACHIEVEMENTS = {
  // Transaction Milestones
  FIRST_TRANSACTION: {
    id: 'first_transaction',
    category: ACHIEVEMENT_CATEGORIES.TRANSACTIONS,
    name: 'First Steps',
    description: 'Complete your first Gateway transaction',
    icon: '🎯',
    requirement: { type: 'transaction_count', value: 1 },
    reward: { points: 100, badge: 'bronze' },
    rarity: 'common'
  },
  TEN_TRANSACTIONS: {
    id: 'ten_transactions',
    category: ACHIEVEMENT_CATEGORIES.TRANSACTIONS,
    name: 'Getting Started',
    description: 'Complete 10 transactions',
    icon: '⚡',
    requirement: { type: 'transaction_count', value: 10 },
    reward: { points: 250, badge: 'silver' },
    rarity: 'common'
  },
  FIFTY_TRANSACTIONS: {
    id: 'fifty_transactions',
    category: ACHIEVEMENT_CATEGORIES.TRANSACTIONS,
    name: 'Gateway Regular',
    description: 'Complete 50 transactions',
    icon: '🚀',
    requirement: { type: 'transaction_count', value: 50 },
    reward: { points: 500, badge: 'gold' },
    rarity: 'rare'
  },
  HUNDRED_TRANSACTIONS: {
    id: 'hundred_transactions',
    category: ACHIEVEMENT_CATEGORIES.TRANSACTIONS,
    name: 'Century Club',
    description: 'Complete 100 transactions',
    icon: '💯',
    requirement: { type: 'transaction_count', value: 100 },
    reward: { points: 1000, badge: 'platinum' },
    rarity: 'epic'
  },

  // Savings Achievements
  FIRST_SAVINGS: {
    id: 'first_savings',
    category: ACHIEVEMENT_CATEGORIES.SAVINGS,
    name: 'Smart Saver',
    description: 'Save your first 0.001 SOL',
    icon: '💰',
    requirement: { type: 'total_savings', value: 0.001 },
    reward: { points: 150, badge: 'bronze' },
    rarity: 'common'
  },
  BIG_SAVER: {
    id: 'big_saver',
    category: ACHIEVEMENT_CATEGORIES.SAVINGS,
    name: 'Master Optimizer',
    description: 'Save 0.1 SOL in total',
    icon: '💎',
    requirement: { type: 'total_savings', value: 0.1 },
    reward: { points: 750, badge: 'gold' },
    rarity: 'rare'
  },
  WHALE_SAVER: {
    id: 'whale_saver',
    category: ACHIEVEMENT_CATEGORIES.SAVINGS,
    name: 'Whale Optimizer',
    description: 'Save 1 SOL in total',
    icon: '🐋',
    requirement: { type: 'total_savings', value: 1.0 },
    reward: { points: 2000, badge: 'platinum' },
    rarity: 'legendary'
  },

  // Tier Achievements
  BASIC_TIER: {
    id: 'basic_tier',
    category: ACHIEVEMENT_CATEGORIES.TIERS,
    name: 'Rising Star',
    description: 'Reach Basic tier',
    icon: '⭐',
    requirement: { type: 'tier_level', value: 1 },
    reward: { points: 300, badge: 'silver' },
    rarity: 'common'
  },
  PREMIUM_TIER: {
    id: 'premium_tier',
    category: ACHIEVEMENT_CATEGORIES.TIERS,
    name: 'Premium Member',
    description: 'Reach Premium tier',
    icon: '👑',
    requirement: { type: 'tier_level', value: 2 },
    reward: { points: 750, badge: 'gold' },
    rarity: 'rare'
  },
  VIP_TIER: {
    id: 'vip_tier',
    category: ACHIEVEMENT_CATEGORIES.TIERS,
    name: 'VIP Legend',
    description: 'Reach VIP tier',
    icon: '🏆',
    requirement: { type: 'tier_level', value: 3 },
    reward: { points: 2000, badge: 'platinum' },
    rarity: 'legendary'
  },

  // Batching Achievements
  FIRST_BATCH: {
    id: 'first_batch',
    category: ACHIEVEMENT_CATEGORIES.BATCHING,
    name: 'Batch Master',
    description: 'Execute your first batch transaction',
    icon: '📦',
    requirement: { type: 'batch_count', value: 1 },
    reward: { points: 200, badge: 'bronze' },
    rarity: 'common'
  },
  BIG_BATCH: {
    id: 'big_batch',
    category: ACHIEVEMENT_CATEGORIES.BATCHING,
    name: 'Efficiency Expert',
    description: 'Execute a batch with 10+ transactions',
    icon: '🎁',
    requirement: { type: 'batch_size', value: 10 },
    reward: { points: 500, badge: 'gold' },
    rarity: 'rare'
  },
  BATCH_ADDICT: {
    id: 'batch_addict',
    category: ACHIEVEMENT_CATEGORIES.BATCHING,
    name: 'Batch Enthusiast',
    description: 'Execute 20 batch transactions',
    icon: '🚛',
    requirement: { type: 'batch_count', value: 20 },
    reward: { points: 1000, badge: 'platinum' },
    rarity: 'epic'
  },

  // Consistency Achievements
  SEVEN_DAY_STREAK: {
    id: 'seven_day_streak',
    category: ACHIEVEMENT_CATEGORIES.CONSISTENCY,
    name: 'Consistent User',
    description: 'Transact for 7 days in a row',
    icon: '🔥',
    requirement: { type: 'streak_days', value: 7 },
    reward: { points: 500, badge: 'silver' },
    rarity: 'rare'
  },
  THIRTY_DAY_STREAK: {
    id: 'thirty_day_streak',
    category: ACHIEVEMENT_CATEGORIES.CONSISTENCY,
    name: 'Dedicated Pro',
    description: 'Transact for 30 days in a row',
    icon: '🌟',
    requirement: { type: 'streak_days', value: 30 },
    reward: { points: 2500, badge: 'platinum' },
    rarity: 'legendary'
  },

  // Special Achievements
  PERFECT_DAY: {
    id: 'perfect_day',
    category: ACHIEVEMENT_CATEGORIES.SPECIAL,
    name: 'Perfect Day',
    description: '100% success rate with 10+ transactions in a day',
    icon: '✨',
    requirement: { type: 'perfect_success', value: 10 },
    reward: { points: 750, badge: 'gold' },
    rarity: 'epic'
  },
  SPEED_DEMON: {
    id: 'speed_demon',
    category: ACHIEVEMENT_CATEGORIES.SPECIAL,
    name: 'Speed Demon',
    description: 'Complete 10 transactions in under 1 minute total',
    icon: '⚡',
    requirement: { type: 'speed_transactions', value: 10 },
    reward: { points: 1000, badge: 'gold' },
    rarity: 'epic'
  },
  EARLY_ADOPTER: {
    id: 'early_adopter',
    category: ACHIEVEMENT_CATEGORIES.SPECIAL,
    name: 'Early Adopter',
    description: 'One of the first 100 Gateway users',
    icon: '🎖️',
    requirement: { type: 'early_user', value: 100 },
    reward: { points: 5000, badge: 'legendary' },
    rarity: 'legendary'
  }
};

class AchievementsService {
  constructor() {
    this.userAchievements = this.loadUserAchievements();
    this.totalPoints = this.calculateTotalPoints();
  }

  loadUserAchievements() {
    try {
      const stored = localStorage.getItem('parkchain_achievements');
      return stored ? JSON.parse(stored) : {};
    } catch (error) {
      console.error('Error loading achievements:', error);
      return {};
    }
  }

  saveUserAchievements() {
    try {
      localStorage.setItem('parkchain_achievements', JSON.stringify(this.userAchievements));
    } catch (error) {
      console.error('Error saving achievements:', error);
    }
  }

  calculateTotalPoints() {
    return Object.values(this.userAchievements)
      .filter(a => a.unlocked)
      .reduce((sum, a) => sum + (ACHIEVEMENTS[a.id]?.reward.points || 0), 0);
  }

  checkAchievements() {
    const metrics = transactionStorage.getMetrics();
    const tier = premiumTierService.getCurrentTier();
    const batchStats = batchTransactionService.getBatchStats();
    const transactions = transactionStorage.getTransactions();

    const newlyUnlocked = [];

    // Check transaction count achievements
    const txCount = metrics.totalTransactions;
    const txAchievements = [
      { id: 'FIRST_TRANSACTION', count: 1 },
      { id: 'TEN_TRANSACTIONS', count: 10 },
      { id: 'FIFTY_TRANSACTIONS', count: 50 },
      { id: 'HUNDRED_TRANSACTIONS', count: 100 }
    ];

    txAchievements.forEach(({ id, count }) => {
      if (txCount >= count && !this.isUnlocked(id)) {
        this.unlock(id);
        newlyUnlocked.push(ACHIEVEMENTS[id]);
      }
    });

    // Check savings achievements
    const totalSavings = parseFloat(metrics.totalSavings) || 0;
    const savingsAchievements = [
      { id: 'FIRST_SAVINGS', amount: 0.001 },
      { id: 'BIG_SAVER', amount: 0.1 },
      { id: 'WHALE_SAVER', amount: 1.0 }
    ];

    savingsAchievements.forEach(({ id, amount }) => {
      if (totalSavings >= amount && !this.isUnlocked(id)) {
        this.unlock(id);
        newlyUnlocked.push(ACHIEVEMENTS[id]);
      }
    });

    // Check tier achievements
    const tierAchievements = [
      { id: 'BASIC_TIER', level: 1 },
      { id: 'PREMIUM_TIER', level: 2 },
      { id: 'VIP_TIER', level: 3 }
    ];

    tierAchievements.forEach(({ id, level }) => {
      if (tier.level >= level && !this.isUnlocked(id)) {
        this.unlock(id);
        newlyUnlocked.push(ACHIEVEMENTS[id]);
      }
    });

    // Check batch achievements
    const batchCount = batchStats.totalBatches;
    if (batchCount >= 1 && !this.isUnlocked('FIRST_BATCH')) {
      this.unlock('FIRST_BATCH');
      newlyUnlocked.push(ACHIEVEMENTS.FIRST_BATCH);
    }

    if (batchCount >= 20 && !this.isUnlocked('BATCH_ADDICT')) {
      this.unlock('BATCH_ADDICT');
      newlyUnlocked.push(ACHIEVEMENTS.BATCH_ADDICT);
    }

    // Check for big batch (10+ transactions in one batch)
    const batches = batchTransactionService.getBatchHistory();
    const hasBigBatch = batches.some(b => b.transactions && b.transactions.length >= 10);
    if (hasBigBatch && !this.isUnlocked('BIG_BATCH')) {
      this.unlock('BIG_BATCH');
      newlyUnlocked.push(ACHIEVEMENTS.BIG_BATCH);
    }

    // Check perfect day (100% success rate with 10+ transactions in a day)
    const today = new Date().toDateString();
    const todayTxs = transactions.filter(tx =>
      new Date(tx.timestamp).toDateString() === today
    );
    const successToday = todayTxs.filter(tx => tx.status === 'success').length;
    if (todayTxs.length >= 10 && successToday === todayTxs.length && !this.isUnlocked('PERFECT_DAY')) {
      this.unlock('PERFECT_DAY');
      newlyUnlocked.push(ACHIEVEMENTS.PERFECT_DAY);
    }

    this.totalPoints = this.calculateTotalPoints();

    return newlyUnlocked;
  }

  unlock(achievementId) {
    const achievement = ACHIEVEMENTS[achievementId];
    if (!achievement) return;

    this.userAchievements[achievementId] = {
      id: achievementId,
      unlocked: true,
      unlockedAt: new Date().toISOString(),
      points: achievement.reward.points
    };

    this.saveUserAchievements();
  }

  isUnlocked(achievementId) {
    return this.userAchievements[achievementId]?.unlocked || false;
  }

  getUnlockedAchievements() {
    return Object.values(ACHIEVEMENTS).filter(a => this.isUnlocked(a.id));
  }

  getLockedAchievements() {
    return Object.values(ACHIEVEMENTS).filter(a => !this.isUnlocked(a.id));
  }

  getProgress(achievementId) {
    const achievement = ACHIEVEMENTS[achievementId];
    if (!achievement) return 0;

    const metrics = transactionStorage.getMetrics();
    const tier = premiumTierService.getCurrentTier();
    const batchStats = batchTransactionService.getBatchStats();

    const { type, value } = achievement.requirement;

    let current = 0;
    switch (type) {
      case 'transaction_count':
        current = metrics.totalTransactions;
        break;
      case 'total_savings':
        current = parseFloat(metrics.totalSavings) || 0;
        break;
      case 'tier_level':
        current = tier.level;
        break;
      case 'batch_count':
        current = batchStats.totalBatches;
        break;
      default:
        current = 0;
    }

    return Math.min((current / value) * 100, 100);
  }

  getAchievementsByCategory(category) {
    return Object.values(ACHIEVEMENTS).filter(a => a.category === category);
  }

  getStats() {
    const unlocked = this.getUnlockedAchievements();
    const total = Object.keys(ACHIEVEMENTS).length;
    const completionRate = (unlocked.length / total) * 100;

    const byRarity = {
      common: unlocked.filter(a => a.rarity === 'common').length,
      rare: unlocked.filter(a => a.rarity === 'rare').length,
      epic: unlocked.filter(a => a.rarity === 'epic').length,
      legendary: unlocked.filter(a => a.rarity === 'legendary').length
    };

    return {
      totalPoints: this.totalPoints,
      unlockedCount: unlocked.length,
      totalCount: total,
      completionRate: completionRate.toFixed(1),
      byRarity
    };
  }

  clearAchievements() {
    this.userAchievements = {};
    this.totalPoints = 0;
    this.saveUserAchievements();
  }
}

export const achievementsService = new AchievementsService();
export default achievementsService;
