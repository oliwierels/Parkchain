import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
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
import {
  Card,
  Button,
  SkeletonCard
} from '../components/ui';
import {
  FaBolt,
  FaChartLine,
  FaChargingStation,
  FaWallet,
  FaClock,
  FaLightbulb,
  FaCheckCircle,
  FaLink
} from 'react-icons/fa';

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

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="h-10 w-64 bg-slate-800 rounded-lg mb-8 animate-pulse" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[1, 2, 3, 4].map(i => (
              <SkeletonCard key={i} />
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            <SkeletonCard />
            <SkeletonCard />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <SkeletonCard />
            <SkeletonCard className="lg:col-span-2" />
          </div>
        </div>
      </div>
    );
  }

  const metricCards = [
    {
      icon: FaBolt,
      label: 'Total Energy',
      value: analytics.totalEnergy,
      unit: 'kWh delivered',
      gradient: 'from-blue-500 to-cyan-600',
      bg: 'bg-blue-500/10',
      color: 'text-blue-400'
    },
    {
      icon: FaChargingStation,
      label: 'Total Sessions',
      value: analytics.totalSessions,
      unit: 'charging sessions',
      gradient: 'from-green-500 to-emerald-600',
      bg: 'bg-green-500/10',
      color: 'text-green-400'
    },
    {
      icon: FaWallet,
      label: 'Total Revenue',
      value: analytics.totalRevenue,
      unit: 'PLN earned',
      gradient: 'from-purple-500 to-pink-600',
      bg: 'bg-purple-500/10',
      color: 'text-purple-400'
    },
    {
      icon: FaClock,
      label: 'Avg Duration',
      value: analytics.avgSessionDuration,
      unit: 'minutes per session',
      gradient: 'from-amber-500 to-orange-600',
      bg: 'bg-amber-500/10',
      color: 'text-amber-400'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4"
        >
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-2 flex items-center gap-3">
              <FaChartLine className="text-purple-500" />
              Analytics Dashboard
            </h1>
            <p className="text-gray-400 text-sm">
              Insights into your EV charging network performance
            </p>
          </div>

          {/* Time Range Selector */}
          <div className="flex gap-2">
            {[
              { key: '7days', label: '7 Days' },
              { key: '30days', label: '30 Days' },
              { key: 'all', label: 'All Time' }
            ].map((range) => (
              <Button
                key={range.key}
                onClick={() => setTimeRange(range.key)}
                variant={timeRange === range.key ? 'primary' : 'ghost'}
                size="md"
              >
                {range.label}
              </Button>
            ))}
          </div>
        </motion.div>

        {/* Key Metrics */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
        >
          {metricCards.map((metric, index) => (
            <motion.div
              key={metric.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + index * 0.05 }}
            >
              <Card variant="gradient" hoverable className={metric.bg}>
                <div className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-br ${metric.gradient} opacity-10 blur-2xl`} />
                <div className="relative">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-gray-300 text-sm font-medium">{metric.label}</span>
                    <metric.icon className={`text-3xl ${metric.color}`} />
                  </div>
                  <div className="text-3xl font-bold text-white mb-1">{metric.value}</div>
                  <div className="text-gray-400 text-xs">{metric.unit}</div>
                </div>
              </Card>
            </motion.div>
          ))}
        </motion.div>

        {/* Charts Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8"
        >
          {/* Energy Over Time */}
          <Card variant="glass">
            <Line data={energyChartData} options={energyChartOptions} />
          </Card>

          {/* Sessions by Station */}
          <Card variant="glass">
            <Bar data={stationsChartData} options={stationsChartOptions} />
          </Card>
        </motion.div>

        {/* Status Distribution */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="grid grid-cols-1 lg:grid-cols-3 gap-8"
        >
          <Card variant="glass" className="lg:col-span-1">
            <Doughnut data={statusChartData} options={statusChartOptions} />
          </Card>

          {/* Insights */}
          <Card variant="gradient" className="bg-gradient-to-br from-indigo-900/50 to-purple-900/50 border-indigo-600 lg:col-span-2">
            <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <FaLightbulb className="text-yellow-400 text-2xl" />
              Key Insights
            </h3>
            <div className="space-y-3 text-sm text-gray-300">
              <div className="flex items-start gap-3">
                <FaCheckCircle className="text-green-400 text-lg flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-white">Network Performance</p>
                  <p>{analytics.totalSessions} charging sessions completed with {analytics.totalEnergy} kWh delivered</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <FaCheckCircle className="text-blue-400 text-lg flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-white">Revenue Generation</p>
                  <p>Generated {analytics.totalRevenue} PLN in revenue from EV charging services</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <FaCheckCircle className="text-purple-400 text-lg flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-white">Session Efficiency</p>
                  <p>Average session duration of {analytics.avgSessionDuration} minutes shows optimal charging patterns</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <FaCheckCircle className="text-amber-400 text-lg flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-white">Blockchain Integration</p>
                  <p>All transactions recorded on Solana for transparency and verifiability</p>
                </div>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* DeCharge Integration Notice */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-8"
        >
          <Card variant="gradient" className="bg-gradient-to-r from-purple-900/50 to-blue-900/50 border-purple-600">
            <p className="text-purple-100 text-sm text-center flex items-center justify-center gap-2">
              <FaLink className="text-purple-400" />
              <strong>Powered by Solana:</strong> This analytics dashboard demonstrates real-time insights
              into the DeCharge network. All metrics are derived from on-chain verified charging sessions.
            </p>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}

export default AnalyticsPage;
