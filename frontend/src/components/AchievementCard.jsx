// Achievement Card Component
// Displays individual achievement with progress and unlock status

import React from 'react';
import { motion } from 'framer-motion';
import { FaLock, FaTrophy, FaCheck } from 'react-icons/fa';

const AchievementCard = ({ achievement, isUnlocked, progress, userAchievement }) => {
  const getRarityStyles = (rarity) => {
    switch (rarity) {
      case 'common':
        return {
          border: 'border-gray-500',
          bg: 'bg-gray-700',
          text: 'text-gray-400',
          glow: 'shadow-gray-500/20'
        };
      case 'rare':
        return {
          border: 'border-blue-500',
          bg: 'bg-blue-700',
          text: 'text-blue-400',
          glow: 'shadow-blue-500/30'
        };
      case 'epic':
        return {
          border: 'border-purple-500',
          bg: 'bg-purple-700',
          text: 'text-purple-400',
          glow: 'shadow-purple-500/40'
        };
      case 'legendary':
        return {
          border: 'border-yellow-500',
          bg: 'bg-yellow-700',
          text: 'text-yellow-400',
          glow: 'shadow-yellow-500/50'
        };
      default:
        return {
          border: 'border-gray-500',
          bg: 'bg-gray-700',
          text: 'text-gray-400',
          glow: 'shadow-gray-500/20'
        };
    }
  };

  const styles = getRarityStyles(achievement.rarity);

  const formatUnlockDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <motion.div
      whileHover={{ scale: isUnlocked ? 1.05 : 1.02, y: -5 }}
      className={`relative rounded-xl p-6 border-2 ${styles.border} ${
        isUnlocked ? `${styles.bg} bg-opacity-20 shadow-lg ${styles.glow}` : 'bg-gray-800/30 opacity-60'
      } transition-all`}
    >
      {/* Locked Overlay */}
      {!isUnlocked && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-900/80 rounded-xl backdrop-blur-sm z-10">
          <FaLock className="text-4xl text-gray-500" />
        </div>
      )}

      {/* Achievement Icon */}
      <div className="flex items-start gap-4 mb-4">
        <div
          className={`text-5xl p-4 rounded-xl ${
            isUnlocked ? `${styles.bg} bg-opacity-30` : 'bg-gray-700/30'
          }`}
        >
          {achievement.icon}
        </div>

        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <h3 className={`font-bold text-lg ${isUnlocked ? 'text-white' : 'text-gray-400'}`}>
              {achievement.name}
            </h3>
            {isUnlocked && <FaCheck className="text-green-400" />}
          </div>

          <p className="text-sm text-gray-400 mb-3">{achievement.description}</p>

          {/* Rarity Badge */}
          <div className="flex items-center gap-2 mb-3">
            <span
              className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${styles.bg} ${styles.text}`}
            >
              {achievement.rarity}
            </span>
            <span className="text-gray-500 text-sm">
              {achievement.category}
            </span>
          </div>
        </div>
      </div>

      {/* Progress Bar (only for locked achievements) */}
      {!isUnlocked && progress !== undefined && (
        <div className="mb-4">
          <div className="flex justify-between text-xs text-gray-500 mb-1">
            <span>Progress</span>
            <span>{progress.toFixed(0)}%</span>
          </div>
          <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              className={`h-full ${styles.bg} rounded-full`}
            />
          </div>
        </div>
      )}

      {/* Reward Info */}
      <div className="flex items-center justify-between pt-4 border-t border-gray-700">
        <div className="flex items-center gap-4 text-sm">
          <div>
            <span className="text-gray-500">Points:</span>
            <span className="ml-2 font-bold text-yellow-400">
              +{achievement.reward.points}
            </span>
          </div>
          <div>
            <span className="text-gray-500">Badge:</span>
            <span className="ml-2 font-bold capitalize text-blue-400">
              {achievement.reward.badge}
            </span>
          </div>
        </div>

        {isUnlocked && userAchievement?.unlockedAt && (
          <div className="text-xs text-gray-500">
            <FaTrophy className="inline mr-1 text-yellow-500" />
            {formatUnlockDate(userAchievement.unlockedAt)}
          </div>
        )}
      </div>

      {/* Unlocked Shine Effect */}
      {isUnlocked && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 1, 0] }}
          transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent rounded-xl pointer-events-none"
        />
      )}
    </motion.div>
  );
};

export default AchievementCard;
