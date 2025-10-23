import { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';

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
  const { publicKey, connected } = useWallet();
  const [userStats, setUserStats] = useState({
    totalKwh: 0,
    sessionsCount: 0,
    unlockedBadges: []
  });
  const [loading, setLoading] = useState(true);
  const [mintingBadge, setMintingBadge] = useState(null);

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

        // Determine unlocked badges
        const unlocked = BADGES.filter(badge => totalKwh >= badge.requirement).map(b => b.id);

        setUserStats({
          totalKwh: totalKwh.toFixed(2),
          sessionsCount,
          unlockedBadges: unlocked
        });
      }
    } catch (err) {
      console.error('Error fetching user stats:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleMintNFT = async (badge) => {
    if (!connected) {
      alert('❌ Please connect your Solana wallet to mint NFT badges!');
      return;
    }

    setMintingBadge(badge.id);

    try {
      // TODO: Implement Metaplex NFT minting
      // For hackathon demo, show concept
      await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate minting

      alert(`🎉 NFT Badge Minted!\n\n${badge.icon} ${badge.name}\n\nThis would create an actual NFT using Metaplex on Solana.\n\nThe NFT would include:\n- Badge artwork and metadata\n- Achievement milestone (${badge.requirement} kWh)\n- Wallet: ${publicKey.toString().slice(0, 8)}...`);

    } catch (err) {
      alert('❌ Failed to mint NFT: ' + err.message);
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

  return (
    <div className="max-w-7xl mx-auto p-6 md:p-8 bg-gray-900 text-gray-100 min-h-screen">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
            🏅 Achievement Badges
          </h1>
          <p className="text-gray-400 text-sm">
            Earn NFT badges for your EV charging milestones
          </p>
        </div>
        <WalletMultiButton className="!bg-purple-600 hover:!bg-purple-700" />
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-gradient-to-br from-blue-900 to-blue-800 rounded-xl p-6 border border-blue-600">
          <div className="text-4xl mb-2">⚡</div>
          <div className="text-3xl font-bold text-white">{userStats.totalKwh}</div>
          <div className="text-blue-200 text-sm">Total kWh Charged</div>
        </div>
        <div className="bg-gradient-to-br from-green-900 to-green-800 rounded-xl p-6 border border-green-600">
          <div className="text-4xl mb-2">🔋</div>
          <div className="text-3xl font-bold text-white">{userStats.sessionsCount}</div>
          <div className="text-green-200 text-sm">Charging Sessions</div>
        </div>
        <div className="bg-gradient-to-br from-purple-900 to-purple-800 rounded-xl p-6 border border-purple-600">
          <div className="text-4xl mb-2">🏆</div>
          <div className="text-3xl font-bold text-white">{userStats.unlockedBadges.length}/{BADGES.length}</div>
          <div className="text-purple-200 text-sm">Badges Unlocked</div>
        </div>
      </div>

      {/* Progress to Next Badge */}
      {nextBadge && (
        <div className="bg-gray-800 rounded-xl p-6 mb-8 border border-gray-700">
          <h3 className="text-xl font-bold text-white mb-4">Next Milestone</h3>
          <div className="flex items-center gap-4 mb-3">
            <div className="text-4xl">{nextBadge.icon}</div>
            <div className="flex-1">
              <div className="flex justify-between mb-2">
                <span className="text-white font-bold">{nextBadge.name}</span>
                <span className="text-gray-400">{userStats.totalKwh} / {nextBadge.requirement} kWh</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-3">
                <div
                  className={`bg-gradient-to-r ${nextBadge.color} h-3 rounded-full transition-all duration-500`}
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          </div>
          <p className="text-gray-400 text-sm">{nextBadge.description}</p>
        </div>
      )}

      {/* Badges Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {BADGES.map((badge) => {
          const unlocked = isBadgeUnlocked(badge.id);
          const minting = mintingBadge === badge.id;

          return (
            <div
              key={badge.id}
              className={`rounded-xl p-6 border-2 transition-all ${
                unlocked
                  ? `bg-gradient-to-br ${badge.color} border-white shadow-lg`
                  : 'bg-gray-800 border-gray-700 opacity-60'
              }`}
            >
              {/* Badge Icon */}
              <div className="text-center mb-4">
                <div className={`text-6xl mb-3 ${!unlocked && 'grayscale opacity-40'}`}>
                  {badge.icon}
                </div>
                <div className={`inline-block px-3 py-1 rounded-full text-xs font-bold mb-2 ${
                  unlocked ? 'bg-white text-gray-900' : 'bg-gray-700 text-gray-400'
                }`}>
                  {badge.rarity}
                </div>
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
                <button
                  onClick={() => handleMintNFT(badge)}
                  disabled={!connected || minting}
                  className={`w-full py-3 rounded-lg font-bold text-sm transition-all ${
                    !connected
                      ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                      : minting
                      ? 'bg-gray-700 text-gray-300'
                      : 'bg-white text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  {minting ? '⏳ Minting...' : connected ? '🎨 Mint as NFT' : '🔒 Connect Wallet'}
                </button>
              ) : (
                <div className="text-center py-3 bg-gray-700 rounded-lg">
                  <span className="text-gray-500 text-sm font-bold">🔒 Locked</span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* How it Works */}
      <div className="mt-8 bg-gradient-to-r from-indigo-900 to-purple-900 border-2 border-indigo-600 rounded-xl p-6">
        <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
          <span className="text-2xl">📚</span>
          How NFT Badges Work
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-300">
          <div className="flex gap-3">
            <div className="text-xl">1️⃣</div>
            <div>
              <p className="font-bold text-white mb-1">Charge Your EV</p>
              <p>Use DeCharge network to charge your vehicle and earn kWh milestones</p>
            </div>
          </div>
          <div className="flex gap-3">
            <div className="text-xl">2️⃣</div>
            <div>
              <p className="font-bold text-white mb-1">Unlock Achievements</p>
              <p>Reach milestones (100 kWh, 500 kWh, etc.) to unlock badges</p>
            </div>
          </div>
          <div className="flex gap-3">
            <div className="text-xl">3️⃣</div>
            <div>
              <p className="font-bold text-white mb-1">Mint as NFT</p>
              <p>Connect Solana wallet and mint your badges as NFTs using Metaplex</p>
            </div>
          </div>
          <div className="flex gap-3">
            <div className="text-xl">4️⃣</div>
            <div>
              <p className="font-bold text-white mb-1">Show Off & Trade</p>
              <p>Display your achievements on-chain, trade with collectors, or keep as memorabilia</p>
            </div>
          </div>
        </div>
      </div>

      {/* Implementation Note */}
      <div className="mt-6 bg-blue-900 bg-opacity-30 border border-blue-600 rounded-xl p-5 text-center">
        <p className="text-blue-200 text-sm">
          <strong>🔧 NFT Minting:</strong> Badge tracking is fully functional.
          Metaplex NFT minting will be implemented in production using Solana's standard NFT protocol.
          Each badge would become a unique, tradable NFT in your wallet.
        </p>
      </div>
    </div>
  );
}

export default BadgesPage;
