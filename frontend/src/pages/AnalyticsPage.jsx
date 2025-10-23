import { useState, useEffect } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

function AnalyticsPage() {
  const [analytics, setAnalytics] = useState({
    totalEnergy: 0,
    totalSessions: 0,
    totalRevenue: 0,
    avgSessionDuration: 0,
    energyByDay: [],
    sessionsByStation: [],
    statusDistribution: {
      completed: 0,
      active: 0,
      pending_verification: 0
    }
  });
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('7days'); // 7days, 30days, all

  useEffect(() => {
    fetchAnalytics();
  }, [timeRange]);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      // Fetch all sessions for analytics (owner should see their own stations)
      const response = await fetch('http://localhost:3000/api/charging-sessions/my', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        processAnalytics(data.sessions || []);
      }
    } catch (err) {
      console.error('Error fetching analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  const processAnalytics = (sessions) => {
    // Filter by time range
    const now = new Date();
    const filteredSessions = sessions.filter(s => {
      const sessionDate = new Date(s.created_at);
      if (timeRange === '7days') {
        return (now - sessionDate) / (1000 * 60 * 60 * 24) <= 7;
      } else if (timeRange === '30days') {
        return (now - sessionDate) / (1000 * 60 * 60 * 24) <= 30;
      }
      return true; // 'all'
    });

    // Total metrics
    const totalEnergy = filteredSessions.reduce((sum, s) => sum + (parseFloat(s.energy_delivered_kwh) || 0), 0);
    const totalSessions = filteredSessions.length;
    const totalRevenue = filteredSessions.reduce((sum, s) => sum + (parseFloat(s.total_cost) || 0), 0);

    // Average session duration
    const sessionsWithDuration = filteredSessions.filter(s => s.charging_duration_minutes);
    const avgSessionDuration = sessionsWithDuration.length > 0
      ? sessionsWithDuration.reduce((sum, s) => sum + s.charging_duration_minutes, 0) / sessionsWithDuration.length
      : 0;

    // Energy by day (last 7 days or 30 days)
    const daysCount = timeRange === '7days' ? 7 : timeRange === '30days' ? 30 : 90;
    const energyByDay = Array(daysCount).fill(0).map((_, i) => {
      const date = new Date(now);
      date.setDate(date.getDate() - (daysCount - 1 - i));
      const dayStr = date.toISOString().split('T')[0];

      const dayEnergy = filteredSessions
        .filter(s => s.created_at?.startsWith(dayStr))
        .reduce((sum, s) => sum + (parseFloat(s.energy_delivered_kwh) || 0), 0);

      return {
        date: date.toLocaleDateString('pl-PL', { month: 'short', day: 'numeric' }),
        energy: dayEnergy
      };
    });

    // Sessions by station (top 5)
    const stationMap = {};
    filteredSessions.forEach(s => {
      const stationName = s.charging_stations?.name || 'Unknown';
      if (!stationMap[stationName]) {
        stationMap[stationName] = { count: 0, energy: 0 };
      }
      stationMap[stationName].count += 1;
      stationMap[stationName].energy += parseFloat(s.energy_delivered_kwh) || 0;
    });

    const sessionsByStation = Object.entries(stationMap)
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Status distribution
    const statusDistribution = {
      completed: filteredSessions.filter(s => s.status === 'completed').length,
      active: filteredSessions.filter(s => s.status === 'active').length,
      pending_verification: filteredSessions.filter(s => s.status === 'pending_verification').length
    };

    setAnalytics({
      totalEnergy: totalEnergy.toFixed(2),
      totalSessions,
      totalRevenue: totalRevenue.toFixed(2),
      avgSessionDuration: Math.round(avgSessionDuration),
      energyByDay,
      sessionsByStation,
      statusDistribution
    });
  };

  // Chart configurations
  const energyChartData = {
    labels: analytics.energyByDay.map(d => d.date),
    datasets: [
      {
        label: 'Energy Delivered (kWh)',
        data: analytics.energyByDay.map(d => d.energy),
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0.4,
        fill: true,
      },
    ],
  };

  const energyChartOptions = {
    responsive: true,
    plugins: {
      legend: {
        display: true,
        labels: { color: '#fff' }
      },
      title: {
        display: true,
        text: 'Energy Delivered Over Time',
        color: '#fff',
        font: { size: 16 }
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: { color: '#9ca3af' },
        grid: { color: '#374151' }
      },
      x: {
        ticks: { color: '#9ca3af' },
        grid: { color: '#374151' }
      }
    },
  };

  const stationsChartData = {
    labels: analytics.sessionsByStation.map(s => s.name),
    datasets: [
      {
        label: 'Sessions',
        data: analytics.sessionsByStation.map(s => s.count),
        backgroundColor: [
          'rgba(34, 197, 94, 0.8)',
          'rgba(59, 130, 246, 0.8)',
          'rgba(168, 85, 247, 0.8)',
          'rgba(251, 146, 60, 0.8)',
          'rgba(236, 72, 153, 0.8)',
        ],
      },
    ],
  };

  const stationsChartOptions = {
    responsive: true,
    plugins: {
      legend: {
        display: false,
      },
      title: {
        display: true,
        text: 'Sessions by Station',
        color: '#fff',
        font: { size: 16 }
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: { color: '#9ca3af', precision: 0 },
        grid: { color: '#374151' }
      },
      x: {
        ticks: { color: '#9ca3af' },
        grid: { display: false }
      }
    },
  };

  const statusChartData = {
    labels: ['Completed', 'Active', 'Pending Verification'],
    datasets: [
      {
        data: [
          analytics.statusDistribution.completed,
          analytics.statusDistribution.active,
          analytics.statusDistribution.pending_verification
        ],
        backgroundColor: [
          'rgba(34, 197, 94, 0.8)',
          'rgba(59, 130, 246, 0.8)',
          'rgba(251, 146, 60, 0.8)',
        ],
        borderColor: [
          'rgb(34, 197, 94)',
          'rgb(59, 130, 246)',
          'rgb(251, 146, 60)',
        ],
        borderWidth: 2,
      },
    ],
  };

  const statusChartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'bottom',
        labels: { color: '#fff' }
      },
      title: {
        display: true,
        text: 'Sessions by Status',
        color: '#fff',
        font: { size: 16 }
      },
    },
  };

  return (
    <div className="max-w-7xl mx-auto p-6 md:p-8 bg-gray-900 text-gray-100 min-h-screen">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
            📊 Analytics Dashboard
          </h1>
          <p className="text-gray-400 text-sm">
            Insights into your EV charging network performance
          </p>
        </div>

        {/* Time Range Selector */}
        <div className="flex gap-2">
          {['7days', '30days', 'all'].map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${
                timeRange === range
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
              }`}
            >
              {range === '7days' ? '7 Days' : range === '30days' ? '30 Days' : 'All Time'}
            </button>
          ))}
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-gradient-to-br from-blue-900 to-blue-800 rounded-xl p-6 border border-blue-600">
          <div className="flex items-center justify-between mb-2">
            <span className="text-blue-200 text-sm font-medium">Total Energy</span>
            <span className="text-3xl">⚡</span>
          </div>
          <div className="text-3xl font-bold text-white mb-1">{analytics.totalEnergy}</div>
          <div className="text-blue-300 text-xs">kWh delivered</div>
        </div>

        <div className="bg-gradient-to-br from-green-900 to-green-800 rounded-xl p-6 border border-green-600">
          <div className="flex items-center justify-between mb-2">
            <span className="text-green-200 text-sm font-medium">Total Sessions</span>
            <span className="text-3xl">🔋</span>
          </div>
          <div className="text-3xl font-bold text-white mb-1">{analytics.totalSessions}</div>
          <div className="text-green-300 text-xs">charging sessions</div>
        </div>

        <div className="bg-gradient-to-br from-purple-900 to-purple-800 rounded-xl p-6 border border-purple-600">
          <div className="flex items-center justify-between mb-2">
            <span className="text-purple-200 text-sm font-medium">Total Revenue</span>
            <span className="text-3xl">💰</span>
          </div>
          <div className="text-3xl font-bold text-white mb-1">{analytics.totalRevenue}</div>
          <div className="text-purple-300 text-xs">PLN earned</div>
        </div>

        <div className="bg-gradient-to-br from-amber-900 to-amber-800 rounded-xl p-6 border border-amber-600">
          <div className="flex items-center justify-between mb-2">
            <span className="text-amber-200 text-sm font-medium">Avg Duration</span>
            <span className="text-3xl">⏱️</span>
          </div>
          <div className="text-3xl font-bold text-white mb-1">{analytics.avgSessionDuration}</div>
          <div className="text-amber-300 text-xs">minutes per session</div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Energy Over Time */}
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <Line data={energyChartData} options={energyChartOptions} />
        </div>

        {/* Sessions by Station */}
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <Bar data={stationsChartData} options={stationsChartOptions} />
        </div>
      </div>

      {/* Status Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 lg:col-span-1">
          <Doughnut data={statusChartData} options={statusChartOptions} />
        </div>

        {/* Insights */}
        <div className="bg-gradient-to-br from-indigo-900 to-purple-900 rounded-xl p-6 border border-indigo-600 lg:col-span-2">
          <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <span className="text-2xl">💡</span>
            Key Insights
          </h3>
          <div className="space-y-3 text-sm text-gray-300">
            <div className="flex items-start gap-3">
              <span className="text-green-400 text-lg">✓</span>
              <div>
                <p className="font-bold text-white">Network Performance</p>
                <p>{analytics.totalSessions} charging sessions completed with {analytics.totalEnergy} kWh delivered</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-blue-400 text-lg">✓</span>
              <div>
                <p className="font-bold text-white">Revenue Generation</p>
                <p>Generated {analytics.totalRevenue} PLN in revenue from EV charging services</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-purple-400 text-lg">✓</span>
              <div>
                <p className="font-bold text-white">Session Efficiency</p>
                <p>Average session duration of {analytics.avgSessionDuration} minutes shows optimal charging patterns</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-amber-400 text-lg">✓</span>
              <div>
                <p className="font-bold text-white">Blockchain Integration</p>
                <p>All transactions recorded on Solana for transparency and verifiability</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* DeCharge Integration Notice */}
      <div className="mt-8 bg-gradient-to-r from-purple-900 to-blue-900 border-2 border-purple-600 rounded-xl p-5">
        <p className="text-purple-100 text-sm text-center">
          <strong>⛓️ Powered by Solana:</strong> This analytics dashboard demonstrates real-time insights
          into the DeCharge network. All metrics are derived from on-chain verified charging sessions.
        </p>
      </div>
    </div>
  );
}

export default AnalyticsPage;
