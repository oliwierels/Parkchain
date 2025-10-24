// Sanctum Gateway Service for Parkchain
// Provides optimized transaction delivery for DCP token purchases
//
// Key Features:
// - Automatic transaction optimization (compute units, priority fees)
// - Multi-channel delivery (RPC + Jito bundles)
// - Auto-refund Jito tips if RPC succeeds
// - Real-time observability and metrics
// - 0.0001 SOL per transaction (10x cheaper than alternatives)

import { Transaction, VersionedTransaction } from '@solana/web3.js';
import GATEWAY_CONFIG from '../config/gateway.js';
import { premiumTierService } from './premiumTierService.js';
import { smartRoutingService } from './smartRoutingService.js';

/**
 * Gateway Transaction Service
 * Wraps standard Solana transactions with Gateway optimization and delivery
 */
class GatewayService {
  constructor() {
    this.config = GATEWAY_CONFIG;
    this.metrics = {
      totalTransactions: 0,
      successfulTransactions: 0,
      failedTransactions: 0,
      totalJitoTipsRefunded: 0,
      totalGatewayFees: 0,
    };
  }

  /**
   * Build Gateway Transaction
   * Optimizes transaction with compute units and priority fees
   *
   * @param {Transaction} transaction - Standard Solana transaction
   * @param {Object} options - Additional options
   * @returns {Promise<Object>} Optimized gateway transaction
   */
  async buildGatewayTransaction(transaction, options = {}) {
    const startTime = Date.now();

    this.log('optimize', 'Building Gateway transaction...', { transaction });

    try {
      // Get user tier and priority lane
      const tier = premiumTierService.getCurrentTier();
      const priorityLane = premiumTierService.getPriorityLane();

      // Calculate tier-adjusted fees
      const baseFee = 0.0001;
      const gatewayFee = premiumTierService.calculateGatewayFee(baseFee);

      this.log('optimize', `Using ${tier.name} tier with ${priorityLane.lane} lane`, {
        tier: tier.name,
        lane: priorityLane.lane,
        fee: gatewayFee
      });

      // Add tier info to options
      options.tier = tier;
      options.priorityLane = priorityLane;
      options.gatewayFee = gatewayFee;

      // If Gateway API is available, use it for optimization
      if (this.config.apiKey && this.config.endpoint) {
        return await this._buildWithGatewayAPI(transaction, options);
      }

      // Fallback: Build with local optimization
      return await this._buildWithLocalOptimization(transaction, options);
    } catch (error) {
      console.error('Error building Gateway transaction:', error);

      // If Gateway fails and fallback is enabled, return original transaction
      if (this.config.features.fallbackEnabled) {
        this.log('optimize', 'Gateway optimization failed, using fallback', { error: error.message });
        return {
          transaction,
          optimized: false,
          fallback: true,
          metadata: {
            deliveryMethod: 'standard-rpc',
            gatewayUsed: false,
          }
        };
      }

      throw error;
    } finally {
      const buildTime = Date.now() - startTime;
      this.log('optimize', `Transaction build completed in ${buildTime}ms`);
    }
  }

  /**
   * Build transaction using Gateway API
   * Makes API call to Gateway for optimization
   */
  async _buildWithGatewayAPI(transaction, options) {
    // Serialize transaction for API call
    const serializedTx = transaction.serialize({
      requireAllSignatures: false,
      verifySignatures: false,
    }).toString('base64');

    // Call Gateway API
    const response = await fetch(`${this.config.endpoint}/v1/optimize`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.config.apiKey}`,
        'X-Project-Id': this.config.projectId,
      },
      body: JSON.stringify({
        transaction: serializedTx,
        network: this.config.network,
        optimization: {
          autoComputeUnits: this.config.optimization.autoComputeUnits,
          autoPriorityFees: this.config.optimization.autoPriorityFees,
          computeUnitMargin: this.config.optimization.computeUnitMargin,
        },
        delivery: {
          methods: this.config.delivery.methods,
          weights: this.config.delivery.weights,
          autoRefundJitoTips: this.config.delivery.autoRefundJitoTips,
        },
        ...options
      })
    });

    if (!response.ok) {
      throw new Error(`Gateway API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    return {
      transaction: data.optimizedTransaction,
      optimized: true,
      metadata: {
        computeUnits: data.computeUnits,
        priorityFee: data.priorityFee,
        deliveryMethods: data.deliveryMethods,
        estimatedCost: data.estimatedCost,
        gatewayUsed: true,
      }
    };
  }

  /**
   * Build transaction with local optimization (fallback)
   * Used when Gateway API is not available
   */
  async _buildWithLocalOptimization(transaction, options) {
    this.log('optimize', 'Using local optimization (Gateway API not configured)');

    // Return transaction with metadata
    return {
      transaction,
      optimized: false,
      metadata: {
        deliveryMethod: 'standard-rpc',
        gatewayUsed: false,
        note: 'Gateway API not configured. Add VITE_GATEWAY_API_KEY to enable optimization.'
      }
    };
  }

  /**
   * Send Transaction via Gateway
   * Routes transaction through optimal delivery channels
   *
   * @param {Transaction} transaction - Signed transaction
   * @param {Connection} connection - Solana connection
   * @param {Object} options - Additional options
   * @returns {Promise<string>} Transaction signature
   */
  async sendTransaction(transaction, connection, options = {}) {
    const startTime = Date.now();
    const txId = `tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    this.log('send', `Sending transaction via Gateway (ID: ${txId})...`);

    try {
      this.metrics.totalTransactions++;

      // Get smart routing recommendation
      const route = smartRoutingService.selectRoute({
        conditions: smartRoutingService.getNetworkConditions(),
        prioritize: options.prioritize || 'balanced'
      });

      this.log('send', `Smart routing selected: ${route.primary.channel}`, {
        route: route.primary.channel,
        conditions: route.conditions,
        recommendation: route.recommendation
      });

      // Add routing info to options
      options.selectedRoute = route;

      // If Gateway API is available, use it for delivery
      if (this.config.apiKey && this.config.endpoint) {
        const signature = await this._sendWithGatewayAPI(transaction, connection, options);

        this.metrics.successfulTransactions++;
        const gatewayFee = options.gatewayFee || this.config.costs.gatewayFee;
        this.metrics.totalGatewayFees += gatewayFee;

        // Record routing result
        smartRoutingService.recordRoutingResult({
          channel: route.primary.channel,
          success: true,
          confirmationTime: Date.now() - startTime,
          signature
        });

        this.log('send', `✅ Transaction sent successfully via Gateway`, {
          signature,
          txId,
          duration: Date.now() - startTime,
          route: route.primary.channel
        });

        return signature;
      }

      // Fallback: Use standard sendTransaction
      this.log('send', 'Sending via standard RPC (Gateway API not configured)');
      const signature = await this._sendWithStandardRPC(transaction, connection, options);

      this.metrics.successfulTransactions++;

      // Record routing result
      smartRoutingService.recordRoutingResult({
        channel: 'rpc',
        success: true,
        confirmationTime: Date.now() - startTime,
        signature
      });

      this.log('send', `✅ Transaction sent via standard RPC`, {
        signature,
        txId,
        duration: Date.now() - startTime
      });

      return signature;

    } catch (error) {
      this.metrics.failedTransactions++;

      // Record failed routing result
      if (options.selectedRoute) {
        smartRoutingService.recordRoutingResult({
          channel: options.selectedRoute.primary.channel,
          success: false,
          confirmationTime: 0,
          signature: null
        });
      }

      this.log('send', `❌ Transaction failed`, {
        error: error.message,
        txId,
        duration: Date.now() - startTime
      });

      throw error;
    }
  }

  /**
   * Send transaction via Gateway API
   */
  async _sendWithGatewayAPI(transaction, connection, options) {
    // For hackathon demo: Gateway API integration
    // In production, this would call Gateway's sendTransaction endpoint

    // Serialize signed transaction
    const serializedTx = transaction.serialize().toString('base64');

    // Call Gateway API
    const response = await fetch(`${this.config.endpoint}/v1/send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.config.apiKey}`,
        'X-Project-Id': this.config.projectId,
      },
      body: JSON.stringify({
        transaction: serializedTx,
        network: this.config.network,
        delivery: {
          methods: this.config.delivery.methods,
          timeout: this.config.delivery.confirmationTimeout,
        },
        ...options
      })
    });

    if (!response.ok) {
      throw new Error(`Gateway send error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    // Track Jito tip refunds
    if (data.jitoTipRefunded) {
      this.metrics.totalJitoTipsRefunded += data.jitoTipAmount;
      this.log('send', `💰 Jito tip refunded: ${data.jitoTipAmount} SOL`);
    }

    return data.signature;
  }

  /**
   * Send transaction via standard RPC (fallback)
   */
  async _sendWithStandardRPC(transaction, connection, options) {
    // Use standard Solana RPC
    const signature = await connection.sendRawTransaction(
      transaction.serialize(),
      {
        skipPreflight: options.skipPreflight || false,
        maxRetries: options.maxRetries || 3,
      }
    );

    return signature;
  }

  /**
   * Confirm Transaction
   * Wait for transaction confirmation on-chain
   */
  async confirmTransaction(signature, connection, commitment = 'confirmed') {
    this.log('confirm', `Waiting for confirmation: ${signature}`);

    const startTime = Date.now();

    try {
      const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();

      const confirmation = await connection.confirmTransaction({
        signature,
        blockhash,
        lastValidBlockHeight
      }, commitment);

      const duration = Date.now() - startTime;

      if (confirmation.value.err) {
        throw new Error(`Transaction failed: ${JSON.stringify(confirmation.value.err)}`);
      }

      this.log('confirm', `✅ Transaction confirmed in ${duration}ms`, {
        signature,
        duration
      });

      return confirmation;

    } catch (error) {
      this.log('confirm', `❌ Confirmation failed: ${error.message}`, { signature });
      throw error;
    }
  }

  /**
   * Full transaction flow: Build, Send, Confirm
   * Convenience method for complete Gateway transaction handling
   */
  async executeTransaction({
    transaction,
    connection,
    wallet,
    onProgress
  }) {
    try {
      // Step 1: Build optimized transaction
      onProgress?.({ stage: 'optimize', message: 'Optimizing transaction with Gateway...' });
      const gatewayTx = await this.buildGatewayTransaction(transaction);

      // Step 2: Get latest blockhash
      onProgress?.({ stage: 'prepare', message: 'Preparing transaction...' });
      const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();
      gatewayTx.transaction.recentBlockhash = blockhash;
      gatewayTx.transaction.feePayer = wallet.publicKey;

      // Step 3: Sign transaction
      onProgress?.({ stage: 'sign', message: 'Please sign the transaction...' });
      const signed = await wallet.signTransaction(gatewayTx.transaction);

      // Step 4: Send via Gateway
      onProgress?.({ stage: 'send', message: 'Sending via Gateway...' });
      const signature = await this.sendTransaction(signed, connection);

      // Step 5: Confirm
      onProgress?.({ stage: 'confirm', message: 'Waiting for confirmation...' });
      await this.confirmTransaction(signature, connection);

      onProgress?.({ stage: 'complete', message: 'Transaction successful!', signature });

      return {
        signature,
        metadata: gatewayTx.metadata,
        metrics: this.getMetrics()
      };

    } catch (error) {
      onProgress?.({ stage: 'error', message: error.message, error });
      throw error;
    }
  }

  /**
   * Get Gateway metrics
   */
  getMetrics() {
    return {
      ...this.metrics,
      successRate: this.metrics.totalTransactions > 0
        ? (this.metrics.successfulTransactions / this.metrics.totalTransactions * 100).toFixed(2) + '%'
        : '0%',
      totalSavings: this.metrics.totalJitoTipsRefunded,
    };
  }

  /**
   * Get Gateway status
   */
  getStatus() {
    return {
      configured: !!this.config.apiKey,
      enabled: this.config.features.enabled,
      deliveryMethods: this.config.delivery.methods,
      network: this.config.network,
      metrics: this.getMetrics(),
    };
  }

  /**
   * Log helper
   */
  log(stage, message, data = {}) {
    if (!this.config.observability.enableLogging) return;

    if (!this.config.observability.logStages.includes(stage)) return;

    const timestamp = new Date().toISOString();
    console.log(`[Gateway ${stage.toUpperCase()}] ${timestamp} - ${message}`, data);
  }
}

// Export singleton instance
export const gatewayService = new GatewayService();

export default gatewayService;
