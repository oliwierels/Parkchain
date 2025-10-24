// Achievements & Rewards Page
// Gamification dashboard showing all achievements, progress, and stats

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FaTrophy, FaStar, FaMedal, FaFire, FaChartLine,
  FaFilter, FaSort, FaLock, FaUnlock, FaCoins
} from 'react-icons/fa';
import AchievementCard from '../components/AchievementCard';
import { achievementsService, ACHIEVEMENTS, ACHIEVEMENT_CATEGORIES } from '../services/achievementsService';

const AchievementsPage = () => {
  const [stats, setStats] = useState(null);
  const [unlockedAchievements, setUnlockedAchievements] = useState([]);
  const [lockedAchievements, setLockedAchievements] = useState([]);
  const [filterCategory, setFilterCategory] = useState('all');
  const [sortBy, setSortBy] = useState('rarity'); // rarity, points, recent
  const [showLocked, setShowLocked] = useState(true);

  useEffect(() => {
    loadAchievements();
  }, []);

  const loadAchievements = () => {
    const statsData = achievementsService.getStats();
    setStats(statsData);

    const unlocked = achievementsService.getUnlockedAchievements();
    const locked = achievementsService.getLockedAchievements();

    setUnlockedAchievements(unlocked);
    setLockedAchievements(locked);
  };

  const getProgress = (achievementId) => {
    return achievementsService.getProgress(achievementId);
  };

  const getUserAchievement = (achievementId) => {
    return achievementsService.userAchievements[achievementId];
  };

  const filterAchievements = (achievements) => {
    let filtered = achievements;

    // Filter by category
    if (filterCategory !== 'all') {
      filtered = filtered.filter(a => a.category === filterCategory);
    }

    // Sort
    filtered = [...filtered].sort((a, b) => {
      if (sortBy === 'rarity') {
        const rarityOrder = { common: 1, rare: 2, epic: 3, legendary: 4 };
        return rarityOrder[b.rarity] - rarityOrder[a.rarity];
      } else if (sortBy === 'points') {
        return b.reward.points - a.reward.points;
      } else if (sortBy === 'recent') {
        const aUnlocked = getUserAchievement(a.id);
        const bUnlocked = getUserAchievement(b.id);
        if (!aUnlocked) return 1;
        if (!bUnlocked) return -1;
        return new Date(bUnlocked.unlockedAt) - new Date(aUnlocked.unlockedAt);
      }
      return 0;
    });

    return filtered;
  };

  const displayedUnlocked = filterAchievements(unlockedAchievements);
  const displayedLocked = filterAchievements(lockedAchievements);

  if (!stats) {
    return (
      <div className="min-h-screen bg-gray-900 text-white p-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mx-auto"></div>
            <p className="mt-4 text-gray-400">Loading achievements...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-4xl font-bold mb-2 flex items-center gap-3">
                <FaTrophy className="text-yellow-400" />
                Achievements & Rewards
              </h1>
              <p className="text-gray-400">
                Complete challenges and earn rewards for using Gateway Pro
              </p>
            </div>

            {/* Total Points Badge */}
            <div className="bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-xl p-6 text-center min-w-[180px]">
              <FaCoins className="text-3xl mx-auto mb-2" />
              <div className="text-3xl font-bold">{stats.totalPoints.toLocaleString()}</div>
              <div className="text-sm opacity-90">Total Points</div>
            </div>
          </div>

          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            {/* Progress Card */}
            <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
              <div className="flex items-center justify-between mb-4">
                <FaChartLine className="text-2xl text-blue-400" />
                <span className="text-2xl font-bold">{stats.completionRate}%</span>
              </div>
              <div className="text-sm text-gray-400 mb-2">Overall Progress</div>
              <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"
                  style={{ width: `${stats.completionRate}%` }}
                />
              </div>
              <div className="text-xs text-gray-500 mt-2">
                {stats.unlockedCount} of {stats.totalCount} unlocked
              </div>
            </div>

            {/* Rarity Breakdown */}
            {['common', 'rare', 'epic', 'legendary'].map((rarity, index) => {
              const icons = {
                common: { icon: FaMedal, color: 'text-gray-400', bg: 'bg-gray-700' },
                rare: { icon: FaStar, color: 'text-blue-400', bg: 'bg-blue-700' },
                epic: { icon: FaFire, color: 'text-purple-400', bg: 'bg-purple-700' },
                legendary: { icon: FaTrophy, color: 'text-yellow-400', bg: 'bg-yellow-700' }
              };
              const Icon = icons[rarity].icon;

              return (
                <div
                  key={rarity}
                  className="bg-gray-800/50 rounded-xl p-6 border border-gray-700"
                >
                  <div className="flex items-center justify-between mb-2">
                    <Icon className={`text-2xl ${icons[rarity].color}`} />
                    <span className="text-2xl font-bold">{stats.byRarity[rarity]}</span>
                  </div>
                  <div className="text-sm capitalize text-gray-400">{rarity}</div>
                  <div className={`mt-2 px-2 py-1 rounded text-xs ${icons[rarity].bg} bg-opacity-20 ${icons[rarity].color}`}>
                    Unlocked
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>

        {/* Filters and Controls */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="bg-gray-800/50 rounded-xl p-4 border border-gray-700 mb-6"
        >
          <div className="flex flex-wrap items-center gap-4">
            {/* Category Filter */}
            <div className="flex items-center gap-2">
              <FaFilter className="text-gray-400" />
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="bg-gray-700 text-white px-4 py-2 rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none"
              >
                <option value="all">All Categories</option>
                {Object.entries(ACHIEVEMENT_CATEGORIES).map(([key, value]) => (
                  <option key={key} value={value}>
                    {value.charAt(0).toUpperCase() + value.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            {/* Sort */}
            <div className="flex items-center gap-2">
              <FaSort className="text-gray-400" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="bg-gray-700 text-white px-4 py-2 rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none"
              >
                <option value="rarity">Sort by Rarity</option>
                <option value="points">Sort by Points</option>
                <option value="recent">Recently Unlocked</option>
              </select>
            </div>

            {/* Show Locked Toggle */}
            <button
              onClick={() => setShowLocked(!showLocked)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                showLocked
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-700 text-gray-300'
              }`}
            >
              {showLocked ? <FaUnlock /> : <FaLock />}
              {showLocked ? 'Hide Locked' : 'Show Locked'}
            </button>

            {/* Stats Summary */}
            <div className="ml-auto text-sm text-gray-400">
              Showing: {displayedUnlocked.length} unlocked
              {showLocked && `, ${displayedLocked.length} locked`}
            </div>
          </div>
        </motion.div>

        {/* Unlocked Achievements */}
        {displayedUnlocked.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="mb-8"
          >
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
              <FaUnlock className="text-green-400" />
              Unlocked ({displayedUnlocked.length})
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <AnimatePresence>
                {displayedUnlocked.map((achievement, index) => (
                  <motion.div
                    key={achievement.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <AchievementCard
                      achievement={achievement}
                      isUnlocked={true}
                      progress={100}
                      userAchievement={getUserAchievement(achievement.id)}
                    />
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </motion.div>
        )}

        {/* Locked Achievements */}
        {showLocked && displayedLocked.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
              <FaLock className="text-gray-500" />
              Locked ({displayedLocked.length})
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <AnimatePresence>
                {displayedLocked.map((achievement, index) => (
                  <motion.div
                    key={achievement.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <AchievementCard
                      achievement={achievement}
                      isUnlocked={false}
                      progress={getProgress(achievement.id)}
                      userAchievement={null}
                    />
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </motion.div>
        )}

        {/* Empty State */}
        {displayedUnlocked.length === 0 && (!showLocked || displayedLocked.length === 0) && (
          <div className="bg-gray-800/50 rounded-xl p-12 border border-gray-700 text-center">
            <FaTrophy className="text-6xl text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-bold mb-2 text-gray-400">No achievements found</h3>
            <p className="text-gray-500 mb-6">
              Try adjusting your filters or start completing transactions to unlock achievements!
            </p>
            <button
              onClick={() => {
                setFilterCategory('all');
                setShowLocked(true);
              }}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium transition-colors"
            >
              Reset Filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default AchievementsPage;
