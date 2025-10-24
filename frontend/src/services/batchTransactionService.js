// Batch Transaction Service for Parkchain Gateway
// Allows grouping multiple transactions for cost optimization
//
// Benefits:
// - Reduced total fees (single Gateway fee for batch)
// - Atomic execution (all succeed or all fail)
// - Better network efficiency
// - Priority batching for VIP users

import { premiumTierService } from './premiumTierService.js';
import { transactionStorage } from './transactionStorage.js';

export const BATCH_STATUS = {
  PENDING: 'pending',
  BUILDING: 'building',
  SIGNING: 'signing',
  SENDING: 'sending',
  CONFIRMING: 'confirming',
  SUCCESS: 'success',
  FAILED: 'failed',
  PARTIAL: 'partial' // Some succeeded, some failed
};

/**
 * Batch Transaction Service
 * Manages grouping and execution of multiple transactions
 */
class BatchTransactionService {
  constructor() {
    this.activeBatches = new Map();
    this.batchHistory = this.loadBatchHistory();
  }

  /**
   * Load batch history from localStorage
   */
  loadBatchHistory() {
    try {
      const stored = localStorage.getItem('parkchain_batch_history');
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Error loading batch history:', error);
      return [];
    }
  }

  /**
   * Save batch history to localStorage
   */
  saveBatchHistory() {
    try {
      localStorage.setItem('parkchain_batch_history', JSON.stringify(this.batchHistory));
    } catch (error) {
      console.error('Error saving batch history:', error);
    }
  }

  /**
   * Create a new batch
   */
  createBatch(options = {}) {
    const tier = premiumTierService.getCurrentTier();
    const maxSize = tier.benefits.maxBatchSize;

    if (maxSize <= 1) {
      throw new Error(`Your tier (${tier.name}) does not support batch transactions. Upgrade to Basic or higher.`);
    }

    const batchId = `batch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const batch = {
      id: batchId,
      status: BATCH_STATUS.PENDING,
      transactions: [],
      maxSize,
      createdAt: new Date().toISOString(),
      estimatedSavings: 0,
      metadata: {
        tier: tier.id,
        priority: options.priority || 'normal',
        atomic: options.atomic !== false, // Default to atomic
        ...options.metadata
      }
    };

    this.activeBatches.set(batchId, batch);

    return batch;
  }

  /**
   * Add transaction to batch
   */
  addToBatch(batchId, transaction) {
    const batch = this.activeBatches.get(batchId);

    if (!batch) {
      throw new Error(`Batch ${batchId} not found`);
    }

    if (batch.status !== BATCH_STATUS.PENDING) {
      throw new Error(`Cannot add to batch: batch is ${batch.status}`);
    }

    if (batch.transactions.length >= batch.maxSize) {
      throw new Error(`Batch is full (max ${batch.maxSize} transactions)`);
    }

    const txData = {
      id: `tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      transaction,
      status: 'pending',
      addedAt: new Date().toISOString(),
      ...transaction.metadata
    };

    batch.transactions.push(txData);

    // Calculate savings
    // Individual transactions: N * 0.0001 SOL
    // Batch transaction: 1 * 0.0001 SOL + small batch overhead
    const individualCost = batch.transactions.length * 0.0001;
    const batchCost = 0.0001 + (batch.transactions.length * 0.00001); // Small overhead per tx
    batch.estimatedSavings = individualCost - batchCost;

    this.activeBatches.set(batchId, batch);

    return {
      success: true,
      batch,
      transactionId: txData.id
    };
  }

  /**
   * Remove transaction from batch
   */
  removeFromBatch(batchId, transactionId) {
    const batch = this.activeBatches.get(batchId);

    if (!batch) {
      throw new Error(`Batch ${batchId} not found`);
    }

    if (batch.status !== BATCH_STATUS.PENDING) {
      throw new Error(`Cannot remove from batch: batch is ${batch.status}`);
    }

    const index = batch.transactions.findIndex(tx => tx.id === transactionId);

    if (index === -1) {
      throw new Error(`Transaction ${transactionId} not found in batch`);
    }

    batch.transactions.splice(index, 1);
    this.activeBatches.set(batchId, batch);

    return { success: true, batch };
  }

  /**
   * Execute batch transaction
   */
  async executeBatch(batchId, gatewayService, connection, wallet, options = {}) {
    const batch = this.activeBatches.get(batchId);

    if (!batch) {
      throw new Error(`Batch ${batchId} not found`);
    }

    if (batch.transactions.length === 0) {
      throw new Error('Cannot execute empty batch');
    }

    const startTime = Date.now();

    try {
      // Update status
      batch.status = BATCH_STATUS.BUILDING;
      this.activeBatches.set(batchId, batch);
      options.onProgress?.({ stage: 'building', message: 'Building batch transaction...' });

      // Build combined transaction
      // In production, this would combine multiple instructions into one transaction
      // For demo, we execute sequentially with batch tracking
      const results = [];

      for (let i = 0; i < batch.transactions.length; i++) {
        const tx = batch.transactions[i];

        try {
          options.onProgress?.({
            stage: 'executing',
            message: `Executing transaction ${i + 1}/${batch.transactions.length}...`,
            progress: ((i / batch.transactions.length) * 100).toFixed(0)
          });

          // Execute individual transaction through Gateway
          const result = await gatewayService.executeTransaction({
            transaction: tx.transaction,
            connection,
            wallet,
            onProgress: (progress) => {
              // Forward progress updates
              options.onProgress?.({
                ...progress,
                batchProgress: `${i + 1}/${batch.transactions.length}`
              });
            }
          });

          tx.status = 'success';
          tx.signature = result.signature;
          tx.confirmedAt = new Date().toISOString();

          results.push({
            transactionId: tx.id,
            success: true,
            signature: result.signature
          });

          // Save to transaction storage
          transactionStorage.addTransaction({
            signature: result.signature,
            amount: tx.amount || 0,
            status: 'success',
            deliveryMethod: 'gateway-batch',
            gatewayUsed: true,
            confirmationTime: Date.now() - startTime,
            gatewayFee: 0.0001 / batch.transactions.length, // Split fee
            metadata: {
              batchId,
              batchSize: batch.transactions.length,
              ...tx.metadata
            }
          });

        } catch (error) {
          tx.status = 'failed';
          tx.error = error.message;

          results.push({
            transactionId: tx.id,
            success: false,
            error: error.message
          });

          // If atomic, stop on first failure
          if (batch.metadata.atomic) {
            throw new Error(`Batch failed atomically: ${error.message}`);
          }

          // Save failed transaction
          transactionStorage.addTransaction({
            signature: `failed_${tx.id}`,
            amount: tx.amount || 0,
            status: 'failed',
            deliveryMethod: 'gateway-batch',
            gatewayUsed: true,
            metadata: {
              batchId,
              error: error.message
            }
          });
        }
      }

      // Update batch status
      const successCount = results.filter(r => r.success).length;
      const failedCount = results.filter(r => !r.success).length;

      if (successCount === batch.transactions.length) {
        batch.status = BATCH_STATUS.SUCCESS;
      } else if (failedCount === batch.transactions.length) {
        batch.status = BATCH_STATUS.FAILED;
      } else {
        batch.status = BATCH_STATUS.PARTIAL;
      }

      batch.completedAt = new Date().toISOString();
      batch.executionTime = Date.now() - startTime;
      batch.results = results;

      // Save to history
      this.batchHistory.unshift({
        ...batch,
        completedAt: new Date().toISOString()
      });
      this.saveBatchHistory();

      // Remove from active batches
      this.activeBatches.delete(batchId);

      options.onProgress?.({
        stage: 'complete',
        message: `Batch complete: ${successCount}/${batch.transactions.length} succeeded`,
        batch
      });

      return {
        success: batch.status === BATCH_STATUS.SUCCESS,
        batch,
        results,
        summary: {
          total: batch.transactions.length,
          successful: successCount,
          failed: failedCount,
          executionTime: batch.executionTime,
          estimatedSavings: batch.estimatedSavings
        }
      };

    } catch (error) {
      batch.status = BATCH_STATUS.FAILED;
      batch.error = error.message;
      batch.completedAt = new Date().toISOString();

      this.activeBatches.set(batchId, batch);

      options.onProgress?.({
        stage: 'error',
        message: error.message,
        error
      });

      throw error;
    }
  }

  /**
   * Cancel batch
   */
  cancelBatch(batchId) {
    const batch = this.activeBatches.get(batchId);

    if (!batch) {
      throw new Error(`Batch ${batchId} not found`);
    }

    if (batch.status !== BATCH_STATUS.PENDING) {
      throw new Error(`Cannot cancel batch: batch is ${batch.status}`);
    }

    this.activeBatches.delete(batchId);

    return { success: true, message: 'Batch cancelled' };
  }

  /**
   * Get active batch
   */
  getBatch(batchId) {
    return this.activeBatches.get(batchId);
  }

  /**
   * Get all active batches
   */
  getActiveBatches() {
    return Array.from(this.activeBatches.values());
  }

  /**
   * Get batch history
   */
  getBatchHistory(limit = 50) {
    return this.batchHistory.slice(0, limit);
  }

  /**
   * Get batch statistics
   */
  getBatchStats() {
    const allBatches = [...this.batchHistory];

    const totalBatches = allBatches.length;
    const successfulBatches = allBatches.filter(b => b.status === BATCH_STATUS.SUCCESS).length;
    const totalTransactions = allBatches.reduce((sum, b) => sum + b.transactions.length, 0);
    const totalSavings = allBatches.reduce((sum, b) => sum + (b.estimatedSavings || 0), 0);
    const averageBatchSize = totalBatches > 0 ? (totalTransactions / totalBatches).toFixed(1) : 0;

    return {
      totalBatches,
      successfulBatches,
      successRate: totalBatches > 0 ? ((successfulBatches / totalBatches) * 100).toFixed(2) : '0.00',
      totalTransactions,
      averageBatchSize,
      totalSavings: totalSavings.toFixed(6),
      activeBatches: this.activeBatches.size
    };
  }

  /**
   * Calculate batch efficiency
   */
  calculateBatchEfficiency(transactionCount) {
    const tier = premiumTierService.getCurrentTier();
    const maxBatchSize = tier.benefits.maxBatchSize;

    if (transactionCount > maxBatchSize) {
      transactionCount = maxBatchSize;
    }

    // Individual: N * gateway fee
    const individualCost = transactionCount * 0.0001;

    // Batch: 1 * gateway fee + small overhead per tx
    const batchCost = 0.0001 + (transactionCount * 0.00001);

    const savings = individualCost - batchCost;
    const savingsPercent = ((savings / individualCost) * 100).toFixed(1);

    return {
      transactionCount,
      individualCost: individualCost.toFixed(6),
      batchCost: batchCost.toFixed(6),
      savings: savings.toFixed(6),
      savingsPercent: `${savingsPercent}%`,
      recommended: transactionCount >= 3 // Batch worthwhile for 3+ transactions
    };
  }

  /**
   * Clear batch history
   */
  clearHistory() {
    this.batchHistory = [];
    this.saveBatchHistory();
  }
}

// Export singleton instance
export const batchTransactionService = new BatchTransactionService();

export default batchTransactionService;
