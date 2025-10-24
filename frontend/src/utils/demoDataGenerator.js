import { transactionStorage } from '../services/transactionStorage';

/**
 * Demo Data Generator for Gateway Integration Showcase
 * Generates realistic transaction data showing Gateway's superiority
 *
 * Use cases:
 * 1. DCP Token Purchases
 * 2. Parking Reservations
 * 3. Charging Session Payments
 */

class DemoDataGenerator {
  constructor() {
    this.scenarios = {
      dcpPurchases: {
        name: 'DCP Token Purchases',
        avgAmount: 100, // DCP tokens
        avgPricePLN: 50, // 100 DCP = 50 PLN
        frequency: 50, // per day
        description: 'Web3 users buying DCP tokens at 50% discount'
      },
      parkingReservations: {
        name: 'Parking Reservations',
        avgAmount: 1, // reservation
        avgPricePLN: 25, // average parking cost
        frequency: 30, // per day
        description: 'Users reserving parking spots via map'
      },
      chargingSessions: {
        name: 'Charging Session Payments',
        avgAmount: 42.5, // kWh
        avgPricePLN: 106.25, // 42.5 kWh × 2.5 PLN/kWh
        frequency: 20, // per day
        description: 'EV drivers paying for charging sessions'
      }
    };
  }

  /**
   * Generate demo transactions for all use cases
   * @param {number} days - Number of days to generate data for
   * @param {boolean} includeFailures - Include realistic failure rates
   */
  generateAllScenarios(days = 30, includeFailures = true) {
    console.log(`🎲 Generating demo data for ${days} days...`);

    const allTransactions = [];

    Object.entries(this.scenarios).forEach(([key, scenario]) => {
      const transactions = this.generateScenarioData(key, scenario, days, includeFailures);
      allTransactions.push(...transactions);
    });

    // Sort by timestamp
    allTransactions.sort((a, b) => a.timestamp - b.timestamp);

    // Store in transactionStorage
    allTransactions.forEach(tx => {
      transactionStorage.addTransaction(tx);
    });

    const summary = this.calculateSummary(allTransactions);
    console.log('✅ Demo data generated:', summary);

    return { transactions: allTransactions, summary };
  }

  /**
   * Generate transactions for a specific scenario
   */
  generateScenarioData(scenarioKey, scenario, days, includeFailures) {
    const transactions = [];
    const now = Date.now();
    const dayMs = 24 * 60 * 60 * 1000;

    for (let day = 0; day < days; day++) {
      const dayTimestamp = now - ((days - day) * dayMs);

      // Generate transactions for this day
      const txCount = Math.floor(scenario.frequency * (0.8 + Math.random() * 0.4)); // ±20% variance

      for (let i = 0; i < txCount; i++) {
        // Random time during the day
        const txTimestamp = dayTimestamp + Math.random() * dayMs;

        // 70% Gateway, 20% Standard Solana, 10% Card/Later
        const rand = Math.random();
        const method = rand < 0.7 ? 'gateway' : rand < 0.9 ? 'rpc' : 'card';

        const tx = this.generateTransaction({
          scenarioKey,
          scenario,
          method,
          timestamp: txTimestamp,
          includeFailures
        });

        transactions.push(tx);
      }
    }

    return transactions;
  }

  /**
   * Generate a single transaction
   */
  generateTransaction({ scenarioKey, scenario, method, timestamp, includeFailures }) {
    // Calculate costs
    const amountPLN = scenario.avgPricePLN * (0.9 + Math.random() * 0.2); // ±10% variance
    const amountSOL = amountPLN / 600; // Rough conversion

    // Fees based on method
    let transactionFee, gatewayFee, jitoTipRefunded;
    let successRate, confirmTime;

    if (method === 'gateway') {
      gatewayFee = 0.0001; // Gateway fee
      transactionFee = gatewayFee;
      // 30% of Gateway txs use Jito, 50% of those get refunded
      const usedJito = Math.random() < 0.3;
      jitoTipRefunded = usedJito && Math.random() < 0.5 ? 0.001 : 0;
      successRate = 0.99; // 99% success rate
      confirmTime = 3 + Math.random() * 2; // 3-5 seconds
    } else if (method === 'rpc') {
      transactionFee = 0.001; // Standard Solana fee
      gatewayFee = 0;
      jitoTipRefunded = 0;
      successRate = 0.85; // 85% success rate
      confirmTime = 8 + Math.random() * 7; // 8-15 seconds
    } else {
      // Card
      transactionFee = amountPLN * 0.029 + 0.30; // 2.9% + 0.30 PLN
      gatewayFee = 0;
      jitoTipRefunded = 0;
      successRate = 0.98; // 98% success rate
      confirmTime = 60 + Math.random() * 60; // 1-2 minutes
    }

    // Determine if transaction succeeds
    const succeeded = !includeFailures || Math.random() < successRate;

    return {
      signature: succeeded ? `${method}_${timestamp}_${Math.random().toString(36).substr(2, 9)}` : `failed_${timestamp}`,
      amount: scenario.avgAmount,
      amountPLN: amountPLN,
      amountSOL: amountSOL,
      status: succeeded ? 'success' : 'failed',
      deliveryMethod: method,
      gatewayUsed: method === 'gateway',
      confirmationTime: succeeded ? confirmTime * 1000 : 0, // in ms
      jitoTipRefunded: succeeded ? jitoTipRefunded : 0,
      gatewayFee: succeeded ? gatewayFee : 0,
      transactionFee: succeeded ? transactionFee : 0,
      timestamp: timestamp,
      useCase: scenarioKey,
      useCaseName: scenario.name,
      metadata: {
        scenario: scenario.description,
        method: method,
        succeeded: succeeded
      }
    };
  }

  /**
   * Calculate summary statistics
   */
  calculateSummary(transactions) {
    const total = transactions.length;
    const successful = transactions.filter(tx => tx.status === 'success').length;
    const failed = total - successful;

    const byMethod = {
      gateway: transactions.filter(tx => tx.deliveryMethod === 'gateway'),
      rpc: transactions.filter(tx => tx.deliveryMethod === 'rpc'),
      card: transactions.filter(tx => tx.deliveryMethod === 'card')
    };

    const gatewayStats = this.getMethodStats(byMethod.gateway);
    const rpcStats = this.getMethodStats(byMethod.rpc);
    const cardStats = this.getMethodStats(byMethod.card);

    // Calculate savings
    const gatewayTotalFees = gatewayStats.totalFees;
    const rpcTotalFees = rpcStats.totalFees;
    const cardTotalFees = cardStats.totalFees;

    // What would it cost if everything was Standard Solana?
    const allSuccessful = transactions.filter(tx => tx.status === 'success');
    const hypotheticalRPCCost = allSuccessful.length * 0.001; // 0.001 SOL per tx

    const actualGatewayCost = gatewayStats.totalFees;
    const savings = hypotheticalRPCCost - actualGatewayCost;

    return {
      total,
      successful,
      failed,
      successRate: (successful / total * 100).toFixed(2) + '%',
      byMethod: {
        gateway: {
          count: byMethod.gateway.length,
          successRate: gatewayStats.successRate,
          avgConfirmTime: gatewayStats.avgConfirmTime,
          totalFees: gatewayStats.totalFees,
          jitoRefunded: gatewayStats.jitoRefunded
        },
        rpc: {
          count: byMethod.rpc.length,
          successRate: rpcStats.successRate,
          avgConfirmTime: rpcStats.avgConfirmTime,
          totalFees: rpcStats.totalFees
        },
        card: {
          count: byMethod.card.length,
          successRate: cardStats.successRate,
          avgConfirmTime: cardStats.avgConfirmTime,
          totalFees: cardStats.totalFees
        }
      },
      savings: {
        hypotheticalRPCCost: hypotheticalRPCCost.toFixed(6),
        actualGatewayCost: actualGatewayCost.toFixed(6),
        totalSavings: savings.toFixed(6),
        savingsPercent: ((savings / hypotheticalRPCCost) * 100).toFixed(2) + '%',
        savingsUSD: (savings * 150).toFixed(2) // @ $150/SOL
      }
    };
  }

  getMethodStats(transactions) {
    if (transactions.length === 0) {
      return {
        successRate: '0%',
        avgConfirmTime: '0s',
        totalFees: 0,
        jitoRefunded: 0
      };
    }

    const successful = transactions.filter(tx => tx.status === 'success');
    const successRate = (successful.length / transactions.length * 100).toFixed(2) + '%';

    const avgConfirmTime = successful.length > 0
      ? (successful.reduce((sum, tx) => sum + tx.confirmationTime, 0) / successful.length / 1000).toFixed(1) + 's'
      : '0s';

    const totalFees = successful.reduce((sum, tx) => sum + (tx.gatewayFee || tx.transactionFee || 0), 0);
    const jitoRefunded = successful.reduce((sum, tx) => sum + (tx.jitoTipRefunded || 0), 0);

    return {
      successRate,
      avgConfirmTime,
      totalFees,
      jitoRefunded
    };
  }

  /**
   * Generate comparison report
   */
  generateComparisonReport(days = 30) {
    const result = this.generateAllScenarios(days, true);
    const { summary } = result;

    console.log('\n📊 GATEWAY PERFORMANCE REPORT');
    console.log('═'.repeat(60));
    console.log(`Period: ${days} days`);
    console.log(`Total Transactions: ${summary.total}`);
    console.log(`Success Rate: ${summary.successRate}`);
    console.log('');
    console.log('BY PAYMENT METHOD:');
    console.log('─'.repeat(60));

    Object.entries(summary.byMethod).forEach(([method, stats]) => {
      console.log(`\n${method.toUpperCase()}:`);
      console.log(`  Transactions: ${stats.count}`);
      console.log(`  Success Rate: ${stats.successRate}`);
      console.log(`  Avg Confirm: ${stats.avgConfirmTime}`);
      console.log(`  Total Fees: ${stats.totalFees.toFixed(6)} SOL`);
      if (stats.jitoRefunded) {
        console.log(`  Jito Refunded: ${stats.jitoRefunded.toFixed(6)} SOL 💰`);
      }
    });

    console.log('\n💰 COST SAVINGS:');
    console.log('─'.repeat(60));
    console.log(`If all txs used Standard RPC: ${summary.savings.hypotheticalRPCCost} SOL`);
    console.log(`Actual Gateway cost: ${summary.savings.actualGatewayCost} SOL`);
    console.log(`Total Savings: ${summary.savings.totalSavings} SOL (${summary.savings.savingsPercent})`);
    console.log(`USD Value: $${summary.savings.savingsUSD} @ $150/SOL`);
    console.log('═'.repeat(60));

    return result;
  }

  /**
   * Clear all demo data
   */
  clearDemoData() {
    transactionStorage.clearAll();
    console.log('🗑️  Demo data cleared');
  }

  /**
   * Quick demo generation for testing
   */
  quickDemo() {
    return this.generateComparisonReport(7); // Last 7 days
  }

  /**
   * Full demo for presentation
   */
  fullDemo() {
    return this.generateComparisonReport(30); // Last 30 days
  }
}

// Export singleton instance
export const demoDataGenerator = new DemoDataGenerator();

export default demoDataGenerator;

// Console helpers
window.generateDemoData = (days = 30) => demoDataGenerator.generateComparisonReport(days);
window.clearDemoData = () => demoDataGenerator.clearDemoData();
window.quickDemo = () => demoDataGenerator.quickDemo();
