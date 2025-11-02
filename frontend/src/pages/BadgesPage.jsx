import { useState, useEffect } from 'react';
import { useStellar } from '../context/StellarWalletContext';
import { motion } from 'framer-motion';
import { Card, Badge, Button, SkeletonCard, EmptyStateNoBadges, useToast, ToastContainer } from '../components/ui';

// Badge definitions - milestones
const BADGES = [
  {
    id: 'pioneer',
    name: 'EV Pioneer',
    description: 'Complete your first charging session',
    icon: '🔋',
    requirement: 1,
    color: 'from-blue-600 to-blue-800',
    rarity: 'Common'
  },
  {
    id: 'green_driver',
    name: 'Green Driver',
    description: 'Charge 100 kWh of clean energy',
    icon: '⚡',
    requirement: 100,
    color: 'from-green-600 to-green-800',
    rarity: 'Uncommon'
  },
  {
    id: 'climate_hero',
    name: 'Climate Hero',
    description: 'Charge 500 kWh and save the planet',
    icon: '💚',
    requirement: 500,
    color: 'from-purple-600 to-purple-800',
    rarity: 'Rare'
  },
  {
    id: 'sustainability_champion',
    name: 'Sustainability Champion',
    description: 'Reach 1,000 kWh milestone',
    icon: '🌍',
    requirement: 1000,
    color: 'from-orange-600 to-orange-800',
    rarity: 'Epic'
  },
  {
    id: 'ev_legend',
    name: 'EV Legend',
    description: 'Achieve legendary status with 5,000 kWh',
    icon: '🏆',
    requirement: 5000,
    color: 'from-yellow-500 to-amber-700',
    rarity: 'Legendary'
  }
];

function BadgesPage() {
  const { publicKey, connected, connect } = useStellar();
  const [userStats, setUserStats] = useState({
    totalKwh: 0,
    sessionsCount: 0,
    unlockedBadges: []
  });
  const [loading, setLoading] = useState(true);
  const [mintingBadge, setMintingBadge] = useState(null);
  const { toasts, addToast, removeToast } = useToast();

  useEffect(() => {
    fetchUserStats();
  }, []);

  const fetchUserStats = async () => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:3000/api/charging-sessions/my', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        const completedSessions = data.sessions?.filter(s => s.status === 'completed') || [];

        const totalKwh = completedSessions.reduce((sum, s) => sum + (parseFloat(s.energy_delivered_kwh) || 0), 0);
        const sessionsCount = completedSessions.length;

        const unlocked = BADGES.filter(badge => totalKwh >= badge.requirement).map(b => b.id);

        setUserStats({
          totalKwh: totalKwh.toFixed(2),
          sessionsCount,
          unlockedBadges: unlocked
        });
      }
    } catch (err) {
      console.error('Error fetching user stats:', err);
      addToast({ message: 'Nie udało się załadować statystyk', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleMintNFT = async (badge) => {
    if (!connected) {
      addToast({ message: 'Połącz portfel Stellar aby mintować NFT!', type: 'warning' });
      return;
    }

    setMintingBadge(badge.id);

    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      addToast({
        message: `NFT Badge "${badge.name}" został zmintowany! 🎉`,
        type: 'success'
      });
    } catch (err) {
      addToast({ message: 'Nie udało się zmintować NFT', type: 'error' });
    } finally {
      setMintingBadge(null);
    }
  };

  const isBadgeUnlocked = (badgeId) => {
    return userStats.unlockedBadges.includes(badgeId);
  };

  const getProgressToNextBadge = () => {
    const nextBadge = BADGES.find(b => !userStats.unlockedBadges.includes(b.id));
    if (!nextBadge) return { badge: null, progress: 100 };

    const progress = (parseFloat(userStats.totalKwh) / nextBadge.requirement) * 100;
    return { badge: nextBadge, progress: Math.min(progress, 100) };
  };

  const { badge: nextBadge, progress } = getProgressToNextBadge();

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="h-10 w-64 bg-slate-800 rounded-lg mb-8 animate-pulse" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {[1, 2, 3].map(i => (
              <SkeletonCard key={i} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-6">
      <ToastContainer toasts={toasts} removeToast={removeToast} />

      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4"
        >
          <div>
            <h1 className="text-4xl font-bold text-white mb-2 flex items-center gap-3">
              🏅 Achievement Badges
            </h1>
            <p className="text-gray-400">
              Earn NFT badges for your EV charging milestones
            </p>
          </div>
          {!connected && (
            <button
              onClick={connect}
              className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition-colors"
            >
              Connect Stellar Wallet
            </button>
          )}
          {connected && publicKey && (
            <div className="bg-purple-100 text-purple-800 px-4 py-2 rounded-lg font-mono text-sm">
              {publicKey.slice(0, 8)}...{publicKey.slice(-8)}
            </div>
          )}
        </motion.div>

        {/* Stats Overview */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8"
        >
          {[
            { icon: '⚡', value: userStats.totalKwh, label: 'Total kWh Charged', gradient: 'from-blue-500 to-cyan-500', bg: 'bg-blue-500/10' },
            { icon: '🔋', value: userStats.sessionsCount, label: 'Charging Sessions', gradient: 'from-green-500 to-emerald-500', bg: 'bg-green-500/10' },
            { icon: '🏆', value: `${userStats.unlockedBadges.length}/${BADGES.length}`, label: 'Badges Unlocked', gradient: 'from-purple-500 to-pink-500', bg: 'bg-purple-500/10' }
          ].map((stat, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 + i * 0.05 }}>
              <Card variant="gradient" className={stat.bg}>
                <div className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-br ${stat.gradient} opacity-10 blur-2xl`} />
                <div className="relative">
                  <div className="text-4xl mb-2">{stat.icon}</div>
                  <div className="text-3xl font-bold text-white mb-1">{stat.value}</div>
                  <div className="text-gray-400 text-sm">{stat.label}</div>
                </div>
              </Card>
            </motion.div>
          ))}
        </motion.div>

        {/* Progress to Next Badge */}
        {nextBadge && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <Card variant="glass" className="mb-8">
              <h3 className="text-xl font-bold text-white mb-4">Next Milestone</h3>
              <div className="flex items-center gap-4 mb-3">
                <div className="text-5xl">{nextBadge.icon}</div>
                <div className="flex-1">
                  <div className="flex justify-between mb-2">
                    <span className="text-white font-bold">{nextBadge.name}</span>
                    <span className="text-gray-400">{userStats.totalKwh} / {nextBadge.requirement} kWh</span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-3 overflow-hidden">
                    <motion.div
                      className={`bg-gradient-to-r ${nextBadge.color} h-3 rounded-full`}
                      initial={{ width: 0 }}
                      animate={{ width: `${progress}%` }}
                      transition={{ duration: 1, ease: "easeOut" }}
                    />
                  </div>
                </div>
              </div>
              <p className="text-gray-400 text-sm">{nextBadge.description}</p>
            </Card>
          </motion.div>
        )}

        {/* Badges Grid */}
        {userStats.unlockedBadges.length === 0 && userStats.totalKwh === '0.00' ? (
          <EmptyStateNoBadges />
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {BADGES.map((badge, index) => {
              const unlocked = isBadgeUnlocked(badge.id);
              const minting = mintingBadge === badge.id;

              return (
                <motion.div
                  key={badge.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.4 + index * 0.05 }}
                >
                  <Card
                    variant="gradient"
                    className={`relative overflow-hidden ${
                      unlocked ? `bg-gradient-to-br ${badge.color}` : 'bg-gray-800 opacity-60'
                    }`}
                  >
                    {/* Badge Icon */}
                    <div className="text-center mb-4">
                      <motion.div
                        className={`text-6xl mb-3 ${!unlocked && 'grayscale opacity-40'}`}
                        whileHover={unlocked ? { scale: 1.1, rotate: 5 } : {}}
                      >
                        {badge.icon}
                      </motion.div>
                      <Badge
                        variant={unlocked ? 'success' : 'default'}
                        size="sm"
                      >
                        {badge.rarity}
                      </Badge>
                    </div>

                    {/* Badge Info */}
                    <h3 className={`text-xl font-bold text-center mb-2 ${unlocked ? 'text-white' : 'text-gray-500'}`}>
                      {badge.name}
                    </h3>
                    <p className={`text-sm text-center mb-4 ${unlocked ? 'text-gray-100' : 'text-gray-600'}`}>
                      {badge.description}
                    </p>

                    {/* Requirement */}
                    <div className="text-center mb-4">
                      <span className={`text-xs ${unlocked ? 'text-gray-200' : 'text-gray-600'}`}>
                        Requirement: {badge.requirement} kWh
                      </span>
                    </div>

                    {/* Action Button */}
                    {unlocked ? (
                      <Button
                        onClick={() => handleMintNFT(badge)}
                        disabled={!connected || minting}
                        loading={minting}
                        variant={!connected ? 'ghost' : 'secondary'}
                        fullWidth
                        size="md"
                      >
                        {minting ? 'Minting...' : connected ? '🎨 Mint as NFT' : '🔒 Connect Wallet'}
                      </Button>
                    ) : (
                      <div className="text-center py-3 bg-gray-700 rounded-lg">
                        <span className="text-gray-500 text-sm font-bold">🔒 Locked</span>
                      </div>
                    )}
                  </Card>
                </motion.div>
              );
            })}
          </motion.div>
        )}

        {/* How it Works */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="mt-8"
        >
          <Card variant="gradient" className="bg-gradient-to-r from-indigo-900/50 to-purple-900/50 border-indigo-600">
            <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <span className="text-2xl">📚</span>
              How NFT Badges Work
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-300">
              {[
                { num: '1️⃣', title: 'Charge Your EV', desc: 'Use DeCharge network to charge your vehicle and earn kWh milestones' },
                { num: '2️⃣', title: 'Unlock Achievements', desc: 'Reach milestones (100 kWh, 500 kWh, etc.) to unlock badges' },
                { num: '3️⃣', title: 'Mint as NFT', desc: 'Connect Stellar wallet and mint your badges as NFTs using Metaplex' },
                { num: '4️⃣', title: 'Show Off & Trade', desc: 'Display your achievements on-chain, trade with collectors, or keep as memorabilia' }
              ].map((step, i) => (
                <div key={i} className="flex gap-3">
                  <div className="text-xl flex-shrink-0">{step.num}</div>
                  <div>
                    <p className="font-bold text-white mb-1">{step.title}</p>
                    <p>{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </motion.div>

        {/* Implementation Note */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="mt-6"
        >
          <Card variant="glass" className="bg-blue-900/20 border-blue-600 text-center">
            <p className="text-blue-200 text-sm">
              <strong>🔧 NFT Minting:</strong> Badge tracking is fully functional.
              Metaplex NFT minting will be implemented in production using Stellar's standard NFT protocol.
              Each badge would become a unique, tradable NFT in your wallet.
            </p>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}

export default BadgesPage;
