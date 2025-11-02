import { useState, useEffect } from 'react';
import { Line, Doughnut, Bar } from 'react-chartjs-2';
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
import { transactionStorage } from '../services/transactionStorage';
import { demoDataGenerator } from '../utils/demoDataGenerator';
import {
  FaCheckCircle,
  FaTimesCircle,
  FaCoins,
  FaClock,
  FaChartLine,
  FaDownload,
  FaTrash,
  FaPlus,
  FaFilter,
  FaCalculator
} from 'react-icons/fa';
import { motion } from 'framer-motion';

// Register Chart.js components
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

function GatewayDashboardPage() {
  const [metrics, setMetrics] = useState(transactionStorage.getMetrics());
  const [transactions, setTransactions] = useState(transactionStorage.getTransactions());
  const [timeSeriesData, setTimeSeriesData] = useState(transactionStorage.getMetricsOverTime(7));
  const [deliveryDistribution, setDeliveryDistribution] = useState(transactionStorage.getDeliveryMethodDistribution());

  // Filters
  const [statusFilter, setStatusFilter] = useState('all');
  const [deliveryFilter, setDeliveryFilter] = useState('all');

  // Calculator
  const [calcMonthlyTx, setCalcMonthlyTx] = useState(1000);
  const [showCalculator, setShowCalculator] = useState(false);

  useEffect(() => {
    refreshData();
  }, []);

  const refreshData = () => {
    setMetrics(transactionStorage.getMetrics());
    setTransactions(transactionStorage.getTransactions());
    setTimeSeriesData(transactionStorage.getMetricsOverTime(7));
    setDeliveryDistribution(transactionStorage.getDeliveryMethodDistribution());
  };

  const handleGenerateDemoData = () => {
    // Generate realistic demo data for 30 days
    const result = demoDataGenerator.generateComparisonReport(30);
    console.log('📊 Generated demo data:', result.summary);
    alert(`✅ Generated ${result.transactions.length} demo transactions!\n\n` +
          `Success Rate: ${result.summary.successRate}\n` +
          `Gateway Savings: ${result.summary.savings.totalSavings} XLM ($${result.summary.savings.savingsUSD})\n\n` +
          `Check console for detailed report.`);
    refreshData();
  };

  const handleClearData = () => {
    if (confirm('Are you sure you want to clear all transaction data?')) {
      transactionStorage.clearAll();
      refreshData();
    }
  };

  const getFilteredTransactions = () => {
    return transactions.filter(tx => {
      if (statusFilter !== 'all' && tx.status !== statusFilter) return false;
      if (deliveryFilter !== 'all' && tx.deliveryMethod !== deliveryFilter) return false;
      return true;
    });
  };

  // Chart configurations
  const successRateChartData = {
    labels: timeSeriesData.labels,
    datasets: [
      {
        label: 'Success Rate (%)',
        data: timeSeriesData.successRates,
        borderColor: 'rgb(34, 197, 94)',
        backgroundColor: 'rgba(34, 197, 94, 0.1)',
        fill: true,
        tension: 0.4
      }
    ]
  };

  const transactionCountChartData = {
    labels: timeSeriesData.labels,
    datasets: [
      {
        label: 'Transactions',
        data: timeSeriesData.transactionCounts,
        backgroundColor: 'rgba(99, 102, 241, 0.8)',
        borderColor: 'rgb(99, 102, 241)',
        borderWidth: 1
      }
    ]
  };

  const deliveryMethodChartData = {
    labels: Object.keys(deliveryDistribution),
    datasets: [
      {
        data: Object.values(deliveryDistribution),
        backgroundColor: [
          'rgba(99, 102, 241, 0.8)',
          'rgba(34, 197, 94, 0.8)',
          'rgba(234, 179, 8, 0.8)',
          'rgba(239, 68, 68, 0.8)'
        ],
        borderColor: [
          'rgb(99, 102, 241)',
          'rgb(34, 197, 94)',
          'rgb(234, 179, 8)',
          'rgb(239, 68, 68)'
        ],
        borderWidth: 2
      }
    ]
  };

  const savingsChartData = {
    labels: timeSeriesData.labels,
    datasets: [
      {
        label: 'Savings (XLM)',
        data: timeSeriesData.savings,
        borderColor: 'rgb(34, 197, 94)',
        backgroundColor: 'rgba(34, 197, 94, 0.2)',
        fill: true,
        tension: 0.4
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: {
          color: '#d1d5db'
        }
      }
    },
    scales: {
      y: {
        ticks: { color: '#d1d5db' },
        grid: { color: 'rgba(255, 255, 255, 0.1)' }
      },
      x: {
        ticks: { color: '#d1d5db' },
        grid: { color: 'rgba(255, 255, 255, 0.1)' }
      }
    }
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          color: '#d1d5db'
        }
      }
    }
  };

  // Cost Calculator
  const calculateSavings = () => {
    const standardCostPerTx = 0.001; // Standard RPC cost
    const gatewayCostPerTx = 0.0001; // Gateway cost
    const jitoTipAvg = 0.002; // Average Jito tip
    const refundRate = 0.5; // 50% refund rate

    const standardMonthlyCost = calcMonthlyTx * standardCostPerTx;
    const gatewayMonthlyCost = calcMonthlyTx * gatewayCostPerTx;
    const jitoTipsCost = calcMonthlyTx * jitoTipAvg * 0.3; // 30% would use Jito
    const refundedAmount = jitoTipsCost * refundRate;
    const netGatewayCost = gatewayMonthlyCost - refundedAmount;

    const monthlySavings = standardMonthlyCost - netGatewayCost;
    const yearlySavings = monthlySavings * 12;

    return {
      standardMonthlyCost: standardMonthlyCost.toFixed(4),
      gatewayMonthlyCost: netGatewayCost.toFixed(4),
      monthlySavings: monthlySavings.toFixed(4),
      yearlySavings: yearlySavings.toFixed(4),
      savingsPercent: ((monthlySavings / standardMonthlyCost) * 100).toFixed(1)
    };
  };

  const savings = calculateSavings();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-4xl font-bold text-white mb-2 flex items-center gap-3">
                <FaChartLine className="text-indigo-400" />
                Gateway Dashboard
              </h1>
              <p className="text-gray-400">
                Sanctum Gateway integration analytics and performance metrics
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowCalculator(!showCalculator)}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2"
              >
                <FaCalculator />
                <span>Calculator</span>
              </button>
              <button
                onClick={handleGenerateDemoData}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2"
              >
                <FaPlus />
                <span>Demo Data</span>
              </button>
              <button
                onClick={() => transactionStorage.exportToJSON()}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2"
              >
                <FaDownload />
                <span>Export JSON</span>
              </button>
              <button
                onClick={() => transactionStorage.exportToCSV()}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2"
              >
                <FaDownload />
                <span>Export CSV</span>
              </button>
              <button
                onClick={handleClearData}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2"
              >
                <FaTrash />
                <span>Clear</span>
              </button>
            </div>
          </div>

          {/* Calculator Modal */}
          {showCalculator && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-gray-800 border border-gray-700 rounded-lg p-6 mb-6"
            >
              <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <FaCalculator className="text-green-400" />
                Cost Savings Calculator
              </h3>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Monthly Transactions
                  </label>
                  <input
                    type="number"
                    value={calcMonthlyTx}
                    onChange={(e) => setCalcMonthlyTx(parseInt(e.target.value) || 0)}
                    className="w-full bg-gray-700 text-white border border-gray-600 rounded-lg px-4 py-2"
                  />
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Standard RPC Cost:</span>
                    <span className="text-white font-bold">{savings.standardMonthlyCost} XLM/mo</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Gateway Cost (net):</span>
                    <span className="text-white font-bold">{savings.gatewayMonthlyCost} XLM/mo</span>
                  </div>
                  <div className="flex justify-between items-center pt-3 border-t border-gray-700">
                    <span className="text-green-400 font-bold">Monthly Savings:</span>
                    <span className="text-green-400 font-bold text-xl">{savings.monthlySavings} XLM</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-green-400 font-bold">Yearly Savings:</span>
                    <span className="text-green-400 font-bold text-xl">{savings.yearlySavings} XLM</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Savings Percent:</span>
                    <span className="text-green-400 font-bold">{savings.savingsPercent}%</span>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gray-800 border border-gray-700 rounded-xl p-6 shadow-xl"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="bg-indigo-600/20 p-3 rounded-lg">
                <FaChartLine className="text-3xl text-indigo-400" />
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold text-white">{metrics.totalTransactions}</div>
                <div className="text-sm text-gray-400">Total Transactions</div>
              </div>
            </div>
            <div className="text-xs text-gray-500">
              {metrics.successfulTransactions} successful, {metrics.failedTransactions} failed
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-gray-800 border border-gray-700 rounded-xl p-6 shadow-xl"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="bg-green-600/20 p-3 rounded-lg">
                <FaCheckCircle className="text-3xl text-green-400" />
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold text-white">{metrics.successRate}%</div>
                <div className="text-sm text-gray-400">Success Rate</div>
              </div>
            </div>
            <div className="text-xs text-gray-500">
              Gateway optimization active
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-gray-800 border border-gray-700 rounded-xl p-6 shadow-xl"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="bg-amber-600/20 p-3 rounded-lg">
                <FaCoins className="text-3xl text-amber-400" />
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold text-white">{metrics.totalSavings.toFixed(6)}</div>
                <div className="text-sm text-gray-400">Total Savings (XLM)</div>
              </div>
            </div>
            <div className="text-xs text-gray-500">
              Jito tips refunded: {metrics.totalJitoTipsRefunded.toFixed(6)} XLM
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-gray-800 border border-gray-700 rounded-xl p-6 shadow-xl"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="bg-purple-600/20 p-3 rounded-lg">
                <FaClock className="text-3xl text-purple-400" />
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold text-white">
                  {(metrics.averageConfirmationTime / 1000).toFixed(1)}s
                </div>
                <div className="text-sm text-gray-400">Avg Confirmation</div>
              </div>
            </div>
            <div className="text-xs text-gray-500">
              Optimized delivery time
            </div>
          </motion.div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Success Rate Chart */}
          <div className="bg-gray-800 border border-gray-700 rounded-xl p-6 shadow-xl">
            <h3 className="text-lg font-bold text-white mb-4">Success Rate Over Time</h3>
            <div className="h-64">
              <Line data={successRateChartData} options={chartOptions} />
            </div>
          </div>

          {/* Transaction Count Chart */}
          <div className="bg-gray-800 border border-gray-700 rounded-xl p-6 shadow-xl">
            <h3 className="text-lg font-bold text-white mb-4">Transactions Per Day</h3>
            <div className="h-64">
              <Bar data={transactionCountChartData} options={chartOptions} />
            </div>
          </div>

          {/* Delivery Methods Chart */}
          <div className="bg-gray-800 border border-gray-700 rounded-xl p-6 shadow-xl">
            <h3 className="text-lg font-bold text-white mb-4">Delivery Method Distribution</h3>
            <div className="h-64 flex items-center justify-center">
              {Object.keys(deliveryDistribution).length > 0 ? (
                <Doughnut data={deliveryMethodChartData} options={doughnutOptions} />
              ) : (
                <p className="text-gray-500">No data available</p>
              )}
            </div>
          </div>

          {/* Savings Chart */}
          <div className="bg-gray-800 border border-gray-700 rounded-xl p-6 shadow-xl">
            <h3 className="text-lg font-bold text-white mb-4">Cost Savings Over Time</h3>
            <div className="h-64">
              <Line data={savingsChartData} options={chartOptions} />
            </div>
          </div>
        </div>

        {/* Transaction History */}
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-6 shadow-xl">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-white">Transaction History</h3>
            <div className="flex items-center gap-4">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-gray-700 text-white border border-gray-600 rounded-lg px-4 py-2 text-sm"
              >
                <option value="all">All Status</option>
                <option value="success">Success</option>
                <option value="failed">Failed</option>
                <option value="pending">Pending</option>
              </select>
              <select
                value={deliveryFilter}
                onChange={(e) => setDeliveryFilter(e.target.value)}
                className="bg-gray-700 text-white border border-gray-600 rounded-lg px-4 py-2 text-sm"
              >
                <option value="all">All Methods</option>
                <option value="gateway">Gateway</option>
                <option value="rpc">RPC</option>
                <option value="jito">Jito</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="text-left text-gray-400 font-medium py-3 px-4">Time</th>
                  <th className="text-left text-gray-400 font-medium py-3 px-4">Signature</th>
                  <th className="text-left text-gray-400 font-medium py-3 px-4">Amount</th>
                  <th className="text-left text-gray-400 font-medium py-3 px-4">Status</th>
                  <th className="text-left text-gray-400 font-medium py-3 px-4">Method</th>
                  <th className="text-left text-gray-400 font-medium py-3 px-4">Time</th>
                  <th className="text-left text-gray-400 font-medium py-3 px-4">Savings</th>
                </tr>
              </thead>
              <tbody>
                {getFilteredTransactions().length > 0 ? (
                  getFilteredTransactions().slice(0, 20).map((tx) => (
                    <tr key={tx.id} className="border-b border-gray-700/50 hover:bg-gray-700/30 transition-colors">
                      <td className="py-3 px-4 text-gray-300 text-sm">
                        {new Date(tx.timestamp).toLocaleString('pl-PL')}
                      </td>
                      <td className="py-3 px-4 text-gray-300 text-sm font-mono">
                        {tx.signature.slice(0, 8)}...{tx.signature.slice(-8)}
                      </td>
                      <td className="py-3 px-4 text-gray-300 text-sm">
                        {tx.amount.toFixed(0)} DCP
                      </td>
                      <td className="py-3 px-4">
                        {tx.status === 'success' ? (
                          <span className="inline-flex items-center gap-1 bg-green-600/20 text-green-400 px-2 py-1 rounded text-xs font-medium">
                            <FaCheckCircle /> Success
                          </span>
                        ) : tx.status === 'failed' ? (
                          <span className="inline-flex items-center gap-1 bg-red-600/20 text-red-400 px-2 py-1 rounded text-xs font-medium">
                            <FaTimesCircle /> Failed
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 bg-yellow-600/20 text-yellow-400 px-2 py-1 rounded text-xs font-medium">
                            <FaClock /> Pending
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-gray-300 text-sm">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          tx.gatewayUsed ? 'bg-indigo-600/20 text-indigo-400' : 'bg-gray-600/20 text-gray-400'
                        }`}>
                          {tx.deliveryMethod}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-gray-300 text-sm">
                        {(tx.confirmationTime / 1000).toFixed(2)}s
                      </td>
                      <td className="py-3 px-4 text-green-400 text-sm font-medium">
                        {tx.jitoTipRefunded > 0 ? `+${tx.jitoTipRefunded.toFixed(6)} XLM` : '-'}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="7" className="py-8 text-center text-gray-500">
                      No transactions found. Click "Demo Data" to generate sample data.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {getFilteredTransactions().length > 20 && (
            <div className="mt-4 text-center text-gray-500 text-sm">
              Showing 20 of {getFilteredTransactions().length} transactions
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default GatewayDashboardPage;
