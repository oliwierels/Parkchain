import { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';

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

  return (
    <div className="max-w-7xl mx-auto p-6 md:p-8 bg-gray-900 text-gray-100 min-h-screen">
      {/* Header with Wallet */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
            ⚡ Live Charging Feed
          </h1>
          <p className="text-gray-400 text-sm">
            Real-time EV charging sessions on Solana • Powered by DeCharge
          </p>
        </div>
        <WalletMultiButton className="!bg-purple-600 hover:!bg-purple-700" />
      </div>

      {/* Solana Connection Status */}
      {connected && (
        <div className="bg-green-900 bg-opacity-30 border border-green-600 rounded-lg p-4 mb-6 flex items-center gap-3">
          <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
          <div>
            <p className="text-green-200 font-bold text-sm">Connected to Solana</p>
            <p className="text-green-300 text-xs font-mono">
              {publicKey?.toString().slice(0, 8)}...{publicKey?.toString().slice(-8)}
            </p>
          </div>
        </div>
      )}

      {/* Live Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        <div className="bg-gradient-to-br from-purple-900 to-purple-800 p-6 rounded-xl shadow-lg border border-purple-600">
          <p className="text-sm text-purple-200 mb-1">Active Sessions</p>
          <p className="text-4xl font-bold text-white flex items-center gap-2">
            {stats.activeSessions}
            <span className="text-lg text-purple-300 animate-pulse">●</span>
          </p>
        </div>

        <div className="bg-gradient-to-br from-green-900 to-green-800 p-6 rounded-xl shadow-lg border border-green-600">
          <p className="text-sm text-green-200 mb-1">Energy Flowing Now</p>
          <p className="text-4xl font-bold text-white">
            {stats.totalEnergyNow.toFixed(1)} <span className="text-lg text-green-300">kWh</span>
          </p>
        </div>

        <div className="bg-gradient-to-br from-amber-900 to-amber-800 p-6 rounded-xl shadow-lg border border-amber-600">
          <p className="text-sm text-amber-200 mb-1">Points Earned Today</p>
          <p className="text-4xl font-bold text-white">
            {Math.floor(stats.totalPointsEarned)} <span className="text-lg text-amber-300">DCP</span>
          </p>
        </div>

        <div className="bg-gradient-to-br from-blue-900 to-blue-800 p-6 rounded-xl shadow-lg border border-blue-600">
          <p className="text-sm text-blue-200 mb-1">Active Chargers</p>
          <p className="text-4xl font-bold text-white">{stats.activeChargers}</p>
        </div>
      </div>

      {/* Live Sessions Feed */}
      <div className="bg-gray-800 rounded-xl shadow-lg border border-gray-700 p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-4 h-4 bg-red-500 rounded-full animate-pulse"></div>
          <h2 className="text-2xl font-bold text-white">
            Live Charging Sessions
          </h2>
        </div>

        {loading ? (
          <div className="text-center py-10 text-gray-400">
            Loading live sessions...
          </div>
        ) : liveSessions.length === 0 ? (
          <div className="text-center py-10 text-gray-400">
            <div className="text-6xl mb-4">⚡</div>
            <p className="text-lg">No active charging sessions right now</p>
            <p className="text-sm mt-2">Check back soon!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {liveSessions.map((session) => (
              <div
                key={session.id}
                className="bg-gray-700 rounded-lg p-5 border border-gray-600 hover:border-purple-500 transition-all"
              >
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
                    <p className="text-sm text-gray-400 mb-3">
                      ⏱️ Duration: {formatDuration(session.start_time)}
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
                    <div className="bg-gradient-to-br from-green-900 to-green-800 p-4 rounded-lg text-center min-w-[120px] border border-green-600">
                      <p className="text-xs text-green-200 mb-1">Energy</p>
                      <p className="text-2xl font-bold text-white">
                        {session.energy_delivered_kwh || 0}
                      </p>
                      <p className="text-xs text-green-300">kWh</p>
                    </div>

                    <div className="bg-gradient-to-br from-purple-900 to-purple-800 p-4 rounded-lg text-center min-w-[120px] border border-purple-600">
                      <p className="text-xs text-purple-200 mb-1">Points Earning</p>
                      <p className="text-2xl font-bold text-white">
                        {Math.floor(session.energy_delivered_kwh || 0)}
                      </p>
                      <p className="text-xs text-purple-300">DCP</p>
                    </div>

                    <div className="bg-gradient-to-br from-amber-900 to-amber-800 p-4 rounded-lg text-center min-w-[120px] border border-amber-600">
                      <p className="text-xs text-amber-200 mb-1">Current Cost</p>
                      <p className="text-2xl font-bold text-white">
                        ~{((session.energy_delivered_kwh || 0) * (session.charging_stations?.price_per_kwh || 0)).toFixed(2)}
                      </p>
                      <p className="text-xs text-amber-300">PLN</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Leaderboards */}
      <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Top Users */}
        <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
          <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
            <span className="text-3xl">🏆</span>
            Top EV Drivers
          </h3>

          {leaderboard.topUsers.length === 0 ? (
            <p className="text-gray-400 text-center py-8">No data yet. Start charging to appear here!</p>
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
                  <div
                    key={index}
                    className={`flex items-center justify-between p-4 rounded-lg border transition-all ${
                      index < 3
                        ? `bg-gradient-to-r ${colors[index]} border-white`
                        : 'bg-gray-700 border-gray-600'
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
                );
              })}
            </div>
          )}
        </div>

        {/* Top Stations */}
        <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
          <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
            <span className="text-3xl">⚡</span>
            Top Charging Stations
          </h3>

          {leaderboard.topStations.length === 0 ? (
            <p className="text-gray-400 text-center py-8">No stations data yet</p>
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
                  <div
                    key={index}
                    className={`flex items-center justify-between p-4 rounded-lg border transition-all ${
                      index < 3
                        ? `bg-gradient-to-r ${colors[index]} border-white`
                        : 'bg-gray-700 border-gray-600'
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
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Info Box */}
      <div className="mt-8 bg-gradient-to-r from-purple-900 to-blue-900 border-2 border-purple-600 rounded-xl p-6">
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
      </div>
    </div>
  );
}

export default LiveFeedPage;
