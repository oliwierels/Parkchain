import { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { motion } from 'framer-motion';
import {
  Card,
  Badge,
  SkeletonCard,
  EmptyState
} from '../components/ui';
import {
  FaBolt,
  FaChargingStation,
  FaTrophy,
  FaUsers,
  FaClock,
  FaLeaf
} from 'react-icons/fa';

function LiveFeedPage() {
  const { publicKey, connected } = useWallet();
  const [liveSessions, setLiveSessions] = useState([]);
  const [stats, setStats] = useState({
    activeSessions: 0,
    totalEnergyNow: 0,
    totalPointsEarned: 0,
    activeChargers: 0
  });
  const [leaderboard, setLeaderboard] = useState({
    topUsers: [],
    topStations: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLiveData();
    fetchLeaderboard();
    // Refresh every 5 seconds for real-time effect
    const interval = setInterval(() => {
      fetchLiveData();
      fetchLeaderboard();
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchLiveData = async () => {
    try {
      const response = await fetch('http://localhost:3000/api/live-sessions');
      if (response.ok) {
        const data = await response.json();
        setLiveSessions(data.sessions || []);
        setStats(data.stats || {
          activeSessions: 0,
          totalEnergyNow: 0,
          totalPointsEarned: 0,
          activeChargers: 0
        });
      }
    } catch (err) {
      console.error('Error fetching live data:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchLeaderboard = async () => {
    try {
      const response = await fetch('http://localhost:3000/api/leaderboard');
      if (response.ok) {
        const data = await response.json();
        setLeaderboard({
          topUsers: data.topUsers || [],
          topStations: data.topStations || []
        });
      }
    } catch (err) {
      console.error('Error fetching leaderboard:', err);
    }
  };

  const formatDuration = (startTime) => {
    const start = new Date(startTime);
    const now = new Date();
    const diffMs = now - start;
    const diffMins = Math.floor(diffMs / 60000);
    const hours = Math.floor(diffMins / 60);
    const mins = diffMins % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="h-10 w-64 bg-slate-800 rounded-lg mb-8 animate-pulse" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
            {[1, 2, 3, 4].map(i => (
              <SkeletonCard key={i} />
            ))}
          </div>
          <SkeletonCard className="mb-8" />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <SkeletonCard />
            <SkeletonCard />
          </div>
        </div>
      </div>
    );
  }

  const statCards = [
    {
      icon: FaBolt,
      label: 'Active Sessions',
      value: stats.activeSessions,
      gradient: 'from-purple-500 to-purple-700',
      bg: 'bg-purple-500/10',
      color: 'text-purple-400',
      pulse: true
    },
    {
      icon: FaLeaf,
      label: 'Energy Flowing Now',
      value: `${stats.totalEnergyNow.toFixed(1)} kWh`,
      gradient: 'from-green-500 to-emerald-600',
      bg: 'bg-green-500/10',
      color: 'text-green-400'
    },
    {
      icon: FaTrophy,
      label: 'Points Earned Today',
      value: `${Math.floor(stats.totalPointsEarned)} DCP`,
      gradient: 'from-amber-500 to-orange-600',
      bg: 'bg-amber-500/10',
      color: 'text-amber-400'
    },
    {
      icon: FaChargingStation,
      label: 'Active Chargers',
      value: stats.activeChargers,
      gradient: 'from-blue-500 to-cyan-500',
      bg: 'bg-blue-500/10',
      color: 'text-blue-400'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header with Wallet */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4"
        >
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-2 flex items-center gap-3">
              <FaBolt className="text-purple-500" />
              Live Charging Feed
            </h1>
            <p className="text-gray-400 text-sm">
              Real-time EV charging sessions on Solana • Powered by DeCharge
            </p>
          </div>
          <WalletMultiButton className="!bg-purple-600 hover:!bg-purple-700" />
        </motion.div>

        {/* Solana Connection Status */}
        {connected && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-6"
          >
            <Card variant="glass" className="bg-green-900/20 border-green-600">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                <div>
                  <p className="text-green-200 font-bold text-sm">Connected to Solana</p>
                  <p className="text-green-300 text-xs font-mono">
                    {publicKey?.toString().slice(0, 8)}...{publicKey?.toString().slice(-8)}
                  </p>
                </div>
              </div>
            </Card>
          </motion.div>
        )}

        {/* Live Stats */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10"
        >
          {statCards.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + index * 0.05 }}
            >
              <Card variant="gradient" hoverable className={stat.bg}>
                <div className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-br ${stat.gradient} opacity-10 blur-2xl`} />
                <div className="relative">
                  <stat.icon className={`text-3xl ${stat.color} mb-3`} />
                  <div className={`text-4xl font-black ${stat.color} mb-2 flex items-center gap-2`}>
                    {stat.value}
                    {stat.pulse && <span className="text-lg animate-pulse">●</span>}
                  </div>
                  <div className="text-gray-400 text-sm font-medium">
                    {stat.label}
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </motion.div>

        {/* Live Sessions Feed */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card variant="glass">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-4 h-4 bg-red-500 rounded-full animate-pulse"></div>
              <h2 className="text-2xl font-bold text-white">
                Live Charging Sessions
              </h2>
            </div>

            {liveSessions.length === 0 ? (
              <EmptyState
                icon={<FaBolt className="text-6xl text-purple-500" />}
                title="No active charging sessions right now"
                description="Check back soon!"
              />
            ) : (
              <div className="space-y-4">
                {liveSessions.map((session, index) => (
                  <motion.div
                    key={session.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 + index * 0.05 }}
                  >
                    <Card variant="glass" hoverable className="border-slate-700 hover:border-purple-500">
                      <div className="flex flex-col md:flex-row justify-between items-start gap-4">
                        {/* Session Info */}
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                            <h3 className="text-lg font-bold text-white">
                              {session.charging_stations?.name || 'Unknown Station'}
                            </h3>
                          </div>
                          <p className="text-sm text-gray-400 mb-1">
                            📍 {session.charging_stations?.address}
                          </p>
                          <p className="text-sm text-gray-400 mb-3 flex items-center gap-2">
                            <FaClock className="text-gray-500" />
                            Duration: {formatDuration(session.start_time)}
                          </p>
                          <div className="flex items-center gap-4 text-xs text-gray-400">
                            <span>
                              Type: <span className="text-purple-400 font-semibold">{session.charging_stations?.charger_type}</span>
                            </span>
                            <span>•</span>
                            <span>
                              Power: <span className="text-amber-400 font-semibold">{session.charging_stations?.max_power_kw} kW</span>
                            </span>
                          </div>
                        </div>

                        {/* Real-time Stats */}
                        <div className="flex flex-col md:flex-row gap-4">
                          <Card variant="gradient" padding="sm" className="bg-green-500/10 border-green-600 text-center min-w-[120px]">
                            <p className="text-xs text-green-200 mb-1">Energy</p>
                            <p className="text-2xl font-bold text-white">
                              {session.energy_delivered_kwh || 0}
                            </p>
                            <p className="text-xs text-green-300">kWh</p>
                          </Card>

                          <Card variant="gradient" padding="sm" className="bg-purple-500/10 border-purple-600 text-center min-w-[120px]">
                            <p className="text-xs text-purple-200 mb-1">Points Earning</p>
                            <p className="text-2xl font-bold text-white">
                              {Math.floor(session.energy_delivered_kwh || 0)}
                            </p>
                            <p className="text-xs text-purple-300">DCP</p>
                          </Card>

                          <Card variant="gradient" padding="sm" className="bg-amber-500/10 border-amber-600 text-center min-w-[120px]">
                            <p className="text-xs text-amber-200 mb-1">Current Cost</p>
                            <p className="text-2xl font-bold text-white">
                              ~{((session.energy_delivered_kwh || 0) * (session.charging_stations?.price_per_kwh || 0)).toFixed(2)}
                            </p>
                            <p className="text-xs text-amber-300">PLN</p>
                          </Card>
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                ))}
              </div>
            )}
          </Card>
        </motion.div>

        {/* Leaderboards */}
        <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Top Users */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <Card variant="glass">
              <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                <FaTrophy className="text-yellow-500 text-3xl" />
                Top EV Drivers
              </h3>

              {leaderboard.topUsers.length === 0 ? (
                <EmptyState
                  icon={<FaUsers className="text-6xl text-gray-600" />}
                  title="No data yet"
                  description="Start charging to appear here!"
                />
              ) : (
                <div className="space-y-3">
                  {leaderboard.topUsers.map((user, index) => {
                    const medals = ['🥇', '🥈', '🥉'];
                    const colors = [
                      'from-yellow-600 to-amber-700',
                      'from-gray-400 to-gray-600',
                      'from-orange-600 to-orange-800'
                    ];

                    return (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.6 + index * 0.05 }}
                      >
                        <div
                          className={`flex items-center justify-between p-4 rounded-lg border transition-all ${
                            index < 3
                              ? `bg-gradient-to-r ${colors[index]} border-white`
                              : 'bg-slate-800 border-slate-700'
                          }`}
                        >
                          <div className="flex items-center gap-4">
                            <div className="text-3xl">
                              {index < 3 ? medals[index] : `#${user.rank}`}
                            </div>
                            <div>
                              <p className={`font-bold ${index < 3 ? 'text-white' : 'text-gray-200'}`}>
                                {user.name}
                              </p>
                              <p className="text-xs text-gray-300">
                                {user.sessionsCount} sessions
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className={`text-xl font-bold ${index < 3 ? 'text-white' : 'text-gray-200'}`}>
                              {user.totalKwh}
                            </p>
                            <p className="text-xs text-gray-300">kWh</p>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </Card>
          </motion.div>

          {/* Top Stations */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
            <Card variant="glass">
              <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                <FaChargingStation className="text-green-500 text-3xl" />
                Top Charging Stations
              </h3>

              {leaderboard.topStations.length === 0 ? (
                <EmptyState
                  icon={<FaChargingStation className="text-6xl text-gray-600" />}
                  title="No stations data yet"
                />
              ) : (
                <div className="space-y-3">
                  {leaderboard.topStations.map((station, index) => {
                    const medals = ['🥇', '🥈', '🥉'];
                    const colors = [
                      'from-green-600 to-emerald-700',
                      'from-blue-400 to-blue-600',
                      'from-purple-600 to-purple-800'
                    ];

                    return (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.7 + index * 0.05 }}
                      >
                        <div
                          className={`flex items-center justify-between p-4 rounded-lg border transition-all ${
                            index < 3
                              ? `bg-gradient-to-r ${colors[index]} border-white`
                              : 'bg-slate-800 border-slate-700'
                          }`}
                        >
                          <div className="flex items-center gap-4 flex-1 min-w-0">
                            <div className="text-3xl flex-shrink-0">
                              {index < 3 ? medals[index] : `#${station.rank}`}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className={`font-bold truncate ${index < 3 ? 'text-white' : 'text-gray-200'}`}>
                                {station.name}
                              </p>
                              <p className="text-xs text-gray-300 truncate">
                                {station.address}
                              </p>
                            </div>
                          </div>
                          <div className="text-right flex-shrink-0 ml-4">
                            <p className={`text-xl font-bold ${index < 3 ? 'text-white' : 'text-gray-200'}`}>
                              {station.sessionsCount}
                            </p>
                            <p className="text-xs text-gray-300">sessions</p>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </Card>
          </motion.div>
        </div>

        {/* Info Box */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="mt-8"
        >
          <Card variant="gradient" className="bg-gradient-to-r from-purple-900/50 to-blue-900/50 border-purple-600">
            <h3 className="text-xl font-bold text-white mb-3 flex items-center gap-2">
              <span className="text-2xl">💎</span>
              About DeCharge Points (DCP)
            </h3>
            <div className="text-gray-300 text-sm space-y-2">
              <p>
                • <strong>EV Drivers</strong> earn 1 DCP for every kWh charged - verified on-chain
              </p>
              <p>
                • <strong>Web3 Users</strong> can buy DCP at 50% discount to support green energy
              </p>
              <p>
                • All transactions are recorded on Solana for complete transparency
              </p>
              <p className="mt-4 text-purple-300">
                🔗 Connect your Solana wallet to participate in the DeCharge ecosystem!
              </p>
            </div>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}

export default LiveFeedPage;
