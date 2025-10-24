// Interactive Charts Component for Gateway Pro
// Advanced Chart.js visualizations

import React, { useState, useEffect } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import { motion } from 'framer-motion';
import { FaChartLine, FaChartBar, FaChartPie } from 'react-icons/fa';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const GatewayCharts = ({ transactionStorage, batchStats, routingStats }) => {
  const [timeSeriesData, setTimeSeriesData] = useState(null);
  const [activeChart, setActiveChart] = useState('performance'); // performance, savings, routing

  useEffect(() => {
    if (transactionStorage) {
      const data = transactionStorage.getMetricsOverTime(7);
      setTimeSeriesData(data);
    }
  }, [transactionStorage]);

  // Chart options
  const lineChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: { color: '#E5E7EB' }
      },
      tooltip: {
        mode: 'index',
        intersect: false,
        backgroundColor: 'rgba(17, 24, 39, 0.95)',
        titleColor: '#E5E7EB',
        bodyColor: '#E5E7EB',
        borderColor: '#4B5563',
        borderWidth: 1
      }
    },
    scales: {
      x: {
        grid: { color: '#374151' },
        ticks: { color: '#9CA3AF' }
      },
      y: {
        grid: { color: '#374151' },
        ticks: { color: '#9CA3AF' }
      }
    },
    interaction: {
      mode: 'nearest',
      axis: 'x',
      intersect: false
    }
  };

  const barChartOptions = {
    ...lineChartOptions,
    scales: {
      ...lineChartOptions.scales,
      y: {
        ...lineChartOptions.scales.y,
        beginAtZero: true
      }
    }
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right',
        labels: { color: '#E5E7EB' }
      },
      tooltip: {
        backgroundColor: 'rgba(17, 24, 39, 0.95)',
        titleColor: '#E5E7EB',
        bodyColor: '#E5E7EB',
        borderColor: '#4B5563',
        borderWidth: 1
      }
    }
  };

  // Performance Chart Data
  const performanceChartData = timeSeriesData ? {
    labels: timeSeriesData.labels,
    datasets: [
      {
        label: 'Success Rate (%)',
        data: timeSeriesData.successRates,
        borderColor: 'rgb(34, 197, 94)',
        backgroundColor: 'rgba(34, 197, 94, 0.1)',
        fill: true,
        tension: 0.4,
        pointRadius: 4,
        pointHoverRadius: 6
      },
      {
        label: 'Transaction Count',
        data: timeSeriesData.transactionCounts,
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        fill: true,
        tension: 0.4,
        pointRadius: 4,
        pointHoverRadius: 6,
        yAxisID: 'y1'
      }
    ]
  } : null;

  const performanceOptionsExtended = {
    ...lineChartOptions,
    scales: {
      ...lineChartOptions.scales,
      y: {
        ...lineChartOptions.scales.y,
        type: 'linear',
        display: true,
        position: 'left',
        title: {
          display: true,
          text: 'Success Rate (%)',
          color: '#9CA3AF'
        }
      },
      y1: {
        type: 'linear',
        display: true,
        position: 'right',
        grid: {
          drawOnChartArea: false,
        },
        title: {
          display: true,
          text: 'Transaction Count',
          color: '#9CA3AF'
        },
        ticks: { color: '#9CA3AF' }
      }
    }
  };

  // Savings Chart Data
  const savingsChartData = timeSeriesData ? {
    labels: timeSeriesData.labels,
    datasets: [
      {
        label: 'Daily Savings (SOL)',
        data: timeSeriesData.savings,
        backgroundColor: 'rgba(251, 191, 36, 0.8)',
        borderColor: 'rgb(251, 191, 36)',
        borderWidth: 2
      }
    ]
  } : null;

  // Routing Distribution Chart
  const routingChartData = routingStats?.channelDistribution ? {
    labels: Object.keys(routingStats.channelDistribution).map(k => k.toUpperCase()),
    datasets: [
      {
        label: 'Transactions by Channel',
        data: Object.values(routingStats.channelDistribution),
        backgroundColor: [
          'rgba(59, 130, 246, 0.8)',   // RPC - blue
          'rgba(139, 92, 246, 0.8)',   // Jito - purple
          'rgba(16, 185, 129, 0.8)',   // Gateway - green
          'rgba(251, 191, 36, 0.8)'    // Triton - yellow
        ],
        borderColor: [
          'rgb(59, 130, 246)',
          'rgb(139, 92, 246)',
          'rgb(16, 185, 129)',
          'rgb(251, 191, 36)'
        ],
        borderWidth: 2
      }
    ]
  } : null;

  // Batch Size Distribution
  const batchSizeData = batchStats ? {
    labels: ['1-3 txs', '4-6 txs', '7-10 txs', '11+ txs'],
    datasets: [
      {
        label: 'Batch Size Distribution',
        data: [
          Math.floor(Math.random() * 5),
          Math.floor(Math.random() * 8),
          Math.floor(Math.random() * 6),
          Math.floor(Math.random() * 3)
        ],
        backgroundColor: [
          'rgba(239, 68, 68, 0.8)',
          'rgba(251, 191, 36, 0.8)',
          'rgba(34, 197, 94, 0.8)',
          'rgba(59, 130, 246, 0.8)'
        ],
        borderColor: [
          'rgb(239, 68, 68)',
          'rgb(251, 191, 36)',
          'rgb(34, 197, 94)',
          'rgb(59, 130, 246)'
        ],
        borderWidth: 2
      }
    ]
  } : null;

  if (!timeSeriesData && !routingStats && !batchStats) {
    return (
      <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
        <div className="text-center py-8 text-gray-500">
          No data available yet. Generate demo data to see charts.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Chart Selector */}
      <div className="flex gap-2 justify-center">
        {[
          { id: 'performance', label: 'Performance', icon: FaChartLine },
          { id: 'savings', label: 'Savings', icon: FaChartBar },
          { id: 'routing', label: 'Routing', icon: FaChartPie }
        ].map(chart => (
          <button
            key={chart.id}
            onClick={() => setActiveChart(chart.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
              activeChart === chart.id
                ? 'bg-blue-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            <chart.icon />
            {chart.label}
          </button>
        ))}
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {activeChart === 'performance' && (
          <>
            {/* Success Rate & Transaction Count */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gray-800/50 rounded-xl p-6 border border-gray-700"
            >
              <h3 className="font-bold mb-4 flex items-center gap-2">
                <FaChartLine className="text-green-400" />
                Performance Trends (7 days)
              </h3>
              <div className="h-64">
                {performanceChartData && (
                  <Line data={performanceChartData} options={performanceOptionsExtended} />
                )}
              </div>
            </motion.div>

            {/* Transaction Volume */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-gray-800/50 rounded-xl p-6 border border-gray-700"
            >
              <h3 className="font-bold mb-4 flex items-center gap-2">
                <FaChartBar className="text-blue-400" />
                Transaction Volume
              </h3>
              <div className="h-64">
                {timeSeriesData && (
                  <Bar
                    data={{
                      labels: timeSeriesData.labels,
                      datasets: [{
                        label: 'Transactions',
                        data: timeSeriesData.transactionCounts,
                        backgroundColor: 'rgba(59, 130, 246, 0.8)',
                        borderColor: 'rgb(59, 130, 246)',
                        borderWidth: 2
                      }]
                    }}
                    options={barChartOptions}
                  />
                )}
              </div>
            </motion.div>
          </>
        )}

        {activeChart === 'savings' && (
          <>
            {/* Daily Savings */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gray-800/50 rounded-xl p-6 border border-gray-700"
            >
              <h3 className="font-bold mb-4 flex items-center gap-2">
                <FaChartBar className="text-yellow-400" />
                Daily Savings (SOL)
              </h3>
              <div className="h-64">
                {savingsChartData && (
                  <Bar data={savingsChartData} options={barChartOptions} />
                )}
              </div>
            </motion.div>

            {/* Batch Size Distribution */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-gray-800/50 rounded-xl p-6 border border-gray-700"
            >
              <h3 className="font-bold mb-4 flex items-center gap-2">
                <FaChartPie className="text-purple-400" />
                Batch Size Distribution
              </h3>
              <div className="h-64 flex items-center justify-center">
                {batchSizeData && (
                  <Doughnut data={batchSizeData} options={doughnutOptions} />
                )}
              </div>
            </motion.div>
          </>
        )}

        {activeChart === 'routing' && (
          <>
            {/* Routing Distribution */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gray-800/50 rounded-xl p-6 border border-gray-700"
            >
              <h3 className="font-bold mb-4 flex items-center gap-2">
                <FaChartPie className="text-blue-400" />
                Channel Distribution
              </h3>
              <div className="h-64 flex items-center justify-center">
                {routingChartData && (
                  <Doughnut data={routingChartData} options={doughnutOptions} />
                )}
              </div>
            </motion.div>

            {/* Channel Performance */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-gray-800/50 rounded-xl p-6 border border-gray-700"
            >
              <h3 className="font-bold mb-4 flex items-center gap-2">
                <FaChartBar className="text-green-400" />
                Channel Success Rates
              </h3>
              <div className="h-64">
                {routingStats?.channelPerformance && (
                  <Bar
                    data={{
                      labels: Object.keys(routingStats.channelPerformance).map(k => k.toUpperCase()),
                      datasets: [{
                        label: 'Success Rate (%)',
                        data: Object.values(routingStats.channelPerformance).map(p => (p.successRate * 100).toFixed(1)),
                        backgroundColor: 'rgba(34, 197, 94, 0.8)',
                        borderColor: 'rgb(34, 197, 94)',
                        borderWidth: 2
                      }]
                    }}
                    options={{
                      ...barChartOptions,
                      scales: {
                        ...barChartOptions.scales,
                        y: {
                          ...barChartOptions.scales.y,
                          max: 100
                        }
                      }
                    }}
                  />
                )}
              </div>
            </motion.div>
          </>
        )}
      </div>
    </div>
  );
};

export default GatewayCharts;
