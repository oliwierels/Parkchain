// Gateway Transaction Storage Service
// Manages transaction history in localStorage

const STORAGE_KEY = 'parkchain_gateway_transactions';
const METRICS_KEY = 'parkchain_gateway_metrics';

/**
 * Transaction Storage Service
 */
class TransactionStorageService {
  constructor() {
    this.transactions = this.loadTransactions();
    this.metrics = this.loadMetrics();
  }

  /**
   * Load transactions from localStorage
   */
  loadTransactions() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Error loading transactions:', error);
      return [];
    }
  }

  /**
   * Load metrics from localStorage
   */
  loadMetrics() {
    try {
      const stored = localStorage.getItem(METRICS_KEY);
      return stored ? JSON.parse(stored) : {
        totalTransactions: 0,
        successfulTransactions: 0,
        failedTransactions: 0,
        totalJitoTipsRefunded: 0,
        totalGatewayFees: 0,
        totalSavings: 0,
        averageConfirmationTime: 0
      };
    } catch (error) {
      console.error('Error loading metrics:', error);
      return {
        totalTransactions: 0,
        successfulTransactions: 0,
        failedTransactions: 0,
        totalJitoTipsRefunded: 0,
        totalGatewayFees: 0,
        totalSavings: 0,
        averageConfirmationTime: 0
      };
    }
  }

  /**
   * Save transactions to localStorage
   */
  saveTransactions() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.transactions));
    } catch (error) {
      console.error('Error saving transactions:', error);
    }
  }

  /**
   * Save metrics to localStorage
   */
  saveMetrics() {
    try {
      localStorage.setItem(METRICS_KEY, JSON.stringify(this.metrics));
    } catch (error) {
      console.error('Error saving metrics:', error);
    }
  }

  /**
   * Add new transaction
   */
  addTransaction(transaction) {
    const txData = {
      id: `tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      signature: transaction.signature,
      amount: transaction.amount || 0,
      status: transaction.status || 'pending', // pending, success, failed
      deliveryMethod: transaction.deliveryMethod || 'gateway',
      gatewayUsed: transaction.gatewayUsed !== false,
      confirmationTime: transaction.confirmationTime || 0,
      jitoTipRefunded: transaction.jitoTipRefunded || 0,
      gatewayFee: transaction.gatewayFee || 0.0001,
      metadata: transaction.metadata || {}
    };

    this.transactions.unshift(txData); // Add to beginning

    // Update metrics
    this.metrics.totalTransactions++;
    if (transaction.status === 'success') {
      this.metrics.successfulTransactions++;
    } else if (transaction.status === 'failed') {
      this.metrics.failedTransactions++;
    }

    if (transaction.jitoTipRefunded) {
      this.metrics.totalJitoTipsRefunded += transaction.jitoTipRefunded;
    }

    if (transaction.gatewayUsed) {
      this.metrics.totalGatewayFees += (transaction.gatewayFee || 0.0001);
    }

    // Calculate total savings (refunded tips - gateway fees)
    this.metrics.totalSavings = this.metrics.totalJitoTipsRefunded - this.metrics.totalGatewayFees;

    // Update average confirmation time
    if (transaction.confirmationTime && transaction.status === 'success') {
      const successfulTxs = this.transactions.filter(tx => tx.status === 'success');
      const totalTime = successfulTxs.reduce((sum, tx) => sum + (tx.confirmationTime || 0), 0);
      this.metrics.averageConfirmationTime = totalTime / successfulTxs.length;
    }

    this.saveTransactions();
    this.saveMetrics();

    return txData;
  }

  /**
   * Get all transactions
   */
  getTransactions() {
    return this.transactions;
  }

  /**
   * Get transactions with filters
   */
  getFilteredTransactions(filters = {}) {
    let filtered = [...this.transactions];

    if (filters.status) {
      filtered = filtered.filter(tx => tx.status === filters.status);
    }

    if (filters.deliveryMethod) {
      filtered = filtered.filter(tx => tx.deliveryMethod === filters.deliveryMethod);
    }

    if (filters.gatewayUsed !== undefined) {
      filtered = filtered.filter(tx => tx.gatewayUsed === filters.gatewayUsed);
    }

    if (filters.dateFrom) {
      filtered = filtered.filter(tx => new Date(tx.timestamp) >= new Date(filters.dateFrom));
    }

    if (filters.dateTo) {
      filtered = filtered.filter(tx => new Date(tx.timestamp) <= new Date(filters.dateTo));
    }

    return filtered;
  }

  /**
   * Get metrics
   */
  getMetrics() {
    return {
      ...this.metrics,
      successRate: this.metrics.totalTransactions > 0
        ? ((this.metrics.successfulTransactions / this.metrics.totalTransactions) * 100).toFixed(2)
        : '0.00'
    };
  }

  /**
   * Get metrics over time (for charts)
   */
  getMetricsOverTime(days = 7) {
    const now = new Date();
    const labels = [];
    const successRates = [];
    const transactionCounts = [];
    const savings = [];

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);

      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);

      const dayTxs = this.transactions.filter(tx => {
        const txDate = new Date(tx.timestamp);
        return txDate >= date && txDate < nextDate;
      });

      labels.push(date.toLocaleDateString('pl-PL', { month: 'short', day: 'numeric' }));

      const successful = dayTxs.filter(tx => tx.status === 'success').length;
      const total = dayTxs.length;
      successRates.push(total > 0 ? ((successful / total) * 100).toFixed(2) : 0);
      transactionCounts.push(total);

      const daySavings = dayTxs.reduce((sum, tx) =>
        sum + (tx.jitoTipRefunded || 0) - (tx.gatewayUsed ? (tx.gatewayFee || 0) : 0), 0
      );
      savings.push(daySavings.toFixed(6));
    }

    return { labels, successRates, transactionCounts, savings };
  }

  /**
   * Get delivery method distribution
   */
  getDeliveryMethodDistribution() {
    const distribution = {};

    this.transactions.forEach(tx => {
      const method = tx.deliveryMethod || 'unknown';
      distribution[method] = (distribution[method] || 0) + 1;
    });

    return distribution;
  }

  /**
   * Clear all data
   */
  clearAll() {
    this.transactions = [];
    this.metrics = {
      totalTransactions: 0,
      successfulTransactions: 0,
      failedTransactions: 0,
      totalJitoTipsRefunded: 0,
      totalGatewayFees: 0,
      totalSavings: 0,
      averageConfirmationTime: 0
    };
    this.saveTransactions();
    this.saveMetrics();
  }

  /**
   * Generate demo data for testing
   */
  generateDemoData(count = 20) {
    const now = new Date();
    const deliveryMethods = ['gateway', 'rpc', 'jito'];
    const statuses = ['success', 'success', 'success', 'success', 'failed']; // 80% success

    for (let i = 0; i < count; i++) {
      const date = new Date(now);
      date.setHours(date.getHours() - Math.floor(Math.random() * 168)); // Last 7 days

      const gatewayUsed = Math.random() > 0.3; // 70% use Gateway
      const status = statuses[Math.floor(Math.random() * statuses.length)];
      const jitoTipRefunded = gatewayUsed && Math.random() > 0.5 ? 0.001 + Math.random() * 0.002 : 0;

      this.addTransaction({
        signature: `demo_${Date.now()}_${i}_${Math.random().toString(36).substr(2, 9)}`,
        amount: 50 + Math.random() * 950, // 50-1000 DCP
        status,
        deliveryMethod: deliveryMethods[Math.floor(Math.random() * deliveryMethods.length)],
        gatewayUsed,
        confirmationTime: status === 'success' ? 2000 + Math.random() * 5000 : 0,
        jitoTipRefunded,
        gatewayFee: gatewayUsed ? 0.0001 : 0,
        timestamp: date.toISOString()
      });
    }
  }

  /**
   * Export transactions to JSON
   */
  exportToJSON() {
    const data = {
      transactions: this.transactions,
      metrics: this.metrics,
      exportedAt: new Date().toISOString()
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `parkchain-gateway-data-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  /**
   * Export transactions to CSV
   */
  exportToCSV() {
    const headers = ['ID', 'Timestamp', 'Signature', 'Amount', 'Status', 'Delivery Method', 'Gateway Used', 'Confirmation Time', 'Jito Tip Refunded', 'Gateway Fee'];

    const rows = this.transactions.map(tx => [
      tx.id,
      tx.timestamp,
      tx.signature,
      tx.amount,
      tx.status,
      tx.deliveryMethod,
      tx.gatewayUsed,
      tx.confirmationTime,
      tx.jitoTipRefunded,
      tx.gatewayFee
    ]);

    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `parkchain-gateway-transactions-${Date.now()}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
}

// Export singleton instance
export const transactionStorage = new TransactionStorageService();

export default transactionStorage;
