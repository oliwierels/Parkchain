// Achievement Notifier Utility
// Automatically checks for new achievements and shows notifications

import { achievementsService } from '../services/achievementsService';
import { notify } from '../components/LiveNotifications';

/**
 * Check for newly unlocked achievements and show notifications
 * Call this after any action that might unlock achievements (transactions, tier changes, etc.)
 */
export const checkAndNotifyAchievements = () => {
  try {
    // Check for newly unlocked achievements
    const newAchievements = achievementsService.checkAchievements();

    // Show notification for each newly unlocked achievement
    newAchievements.forEach((achievement) => {
      const rarityEmojis = {
        common: '🥉',
        rare: '🥈',
        epic: '🥇',
        legendary: '👑'
      };

      const emoji = rarityEmojis[achievement.rarity] || '🏆';

      notify.achievement(
        `${emoji} Achievement Unlocked!`,
        `${achievement.name} - ${achievement.description}`,
        [
          `+${achievement.reward.points} points`,
          `${achievement.reward.badge} badge earned`,
          `Rarity: ${achievement.rarity.toUpperCase()}`
        ]
      );

      // Optional: Play sound effect or trigger confetti
      if (window.triggerConfetti && achievement.rarity === 'legendary') {
        window.triggerConfetti();
      }
    });

    return newAchievements;
  } catch (error) {
    console.error('Error checking achievements:', error);
    return [];
  }
};

/**
 * Get achievement progress for a specific achievement
 */
export const getAchievementProgress = (achievementId) => {
  try {
    return achievementsService.getProgress(achievementId);
  } catch (error) {
    console.error('Error getting achievement progress:', error);
    return 0;
  }
};

/**
 * Check if user is close to unlocking an achievement and show a hint
 */
export const checkAlmostUnlockedAchievements = () => {
  try {
    const lockedAchievements = achievementsService.getLockedAchievements();

    lockedAchievements.forEach((achievement) => {
      const progress = achievementsService.getProgress(achievement.id);

      // Show hint if progress is between 75% and 95%
      if (progress >= 75 && progress < 95) {
        const progressPercent = Math.round(progress);

        notify.info(
          `${achievement.icon} Almost There!`,
          `${achievement.name} - ${progressPercent}% complete`,
          [`${achievement.description}`]
        );
      }
    });
  } catch (error) {
    console.error('Error checking almost unlocked achievements:', error);
  }
};

/**
 * Get total points and stats
 */
export const getAchievementStats = () => {
  try {
    return achievementsService.getStats();
  } catch (error) {
    console.error('Error getting achievement stats:', error);
    return {
      totalPoints: 0,
      unlockedCount: 0,
      totalCount: 0,
      completionRate: 0,
      byRarity: { common: 0, rare: 0, epic: 0, legendary: 0 }
    };
  }
};

/**
 * Manual check for specific achievement types
 * Useful for testing or when you want to check specific categories
 */
export const checkSpecificAchievement = (achievementId) => {
  try {
    const isUnlocked = achievementsService.isUnlocked(achievementId);
    const progress = achievementsService.getProgress(achievementId);

    return {
      unlocked: isUnlocked,
      progress
    };
  } catch (error) {
    console.error('Error checking specific achievement:', error);
    return { unlocked: false, progress: 0 };
  }
};

export default {
  checkAndNotifyAchievements,
  getAchievementProgress,
  checkAlmostUnlockedAchievements,
  getAchievementStats,
  checkSpecificAchievement
};
