// Batch Transaction Modal for Gateway Pro
// Allows users to create and manage batch transactions

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FaTimes, FaLayerGroup, FaPlus, FaTrash, FaRocket,
  FaClock, FaCoins, FaCheckCircle, FaExclamationTriangle
} from 'react-icons/fa';
import { batchTransactionService } from '../services/batchTransactionService';
import { premiumTierService } from '../services/premiumTierService';

const BatchTransactionModal = ({ isOpen, onClose, onExecute }) => {
  const [currentBatch, setCurrentBatch] = useState(null);
  const [batchItems, setBatchItems] = useState([]);
  const [newItemAmount, setNewItemAmount] = useState('100');
  const [tier, setTier] = useState(null);
  const [executing, setExecuting] = useState(false);
  const [progress, setProgress] = useState(null);

  useEffect(() => {
    if (isOpen) {
      loadTier();
      createNewBatch();
    }
  }, [isOpen]);

  const loadTier = () => {
    const userTier = premiumTierService.getCurrentTier();
    setTier(userTier);
  };

  const createNewBatch = () => {
    try {
      const batch = batchTransactionService.createBatch({
        atomic: true,
        metadata: {
          source: 'marketplace-ui'
        }
      });
      setCurrentBatch(batch);
      setBatchItems([]);
    } catch (error) {
      alert(error.message);
      onClose();
    }
  };

  const addItemToBatch = () => {
    if (!currentBatch) return;

    const amount = parseFloat(newItemAmount);
    if (!amount || amount <= 0) {
      alert('Please enter a valid amount');
      return;
    }

    if (batchItems.length >= currentBatch.maxSize) {
      alert(`Batch is full! Your ${tier.name} tier supports up to ${currentBatch.maxSize} transactions.`);
      return;
    }

    // Create a mock transaction object
    const mockTransaction = {
      amount,
      type: 'dcp-purchase',
      metadata: {
        amount,
        timestamp: new Date().toISOString()
      }
    };

    try {
      const result = batchTransactionService.addToBatch(currentBatch.id, mockTransaction);

      setBatchItems([...batchItems, {
        id: result.transactionId,
        amount,
        status: 'pending'
      }]);

      // Update batch info
      setCurrentBatch(result.batch);
      setNewItemAmount('100');
    } catch (error) {
      alert(error.message);
    }
  };

  const removeItemFromBatch = (itemId) => {
    try {
      const result = batchTransactionService.removeFromBatch(currentBatch.id, itemId);
      setBatchItems(batchItems.filter(item => item.id !== itemId));
      setCurrentBatch(result.batch);
    } catch (error) {
      alert(error.message);
    }
  };

  const executeBatch = async () => {
    if (!currentBatch || batchItems.length === 0) {
      alert('Please add at least one transaction to the batch');
      return;
    }

    setExecuting(true);
    setProgress({ stage: 'building', message: 'Building batch...', progress: 0 });

    try {
      // In a real implementation, this would execute actual transactions
      // For demo, we'll simulate the execution
      await simulateBatchExecution();

      // Close modal and notify parent
      setTimeout(() => {
        setExecuting(false);
        setProgress(null);
        onClose();
        if (onExecute) {
          onExecute(currentBatch);
        }
      }, 1000);

    } catch (error) {
      console.error('Batch execution error:', error);
      setProgress({ stage: 'error', message: error.message });
      setExecuting(false);
    }
  };

  const simulateBatchExecution = async () => {
    // Simulate batch execution for demo
    const stages = [
      { stage: 'building', message: 'Building batch transaction...', progress: 0 },
      { stage: 'optimizing', message: 'Optimizing with Gateway...', progress: 25 },
      { stage: 'signing', message: 'Ready to sign...', progress: 50 },
      { stage: 'sending', message: 'Sending batch to network...', progress: 75 },
      { stage: 'confirming', message: 'Confirming transactions...', progress: 90 },
      { stage: 'complete', message: 'Batch complete!', progress: 100 }
    ];

    for (const stage of stages) {
      setProgress(stage);
      await new Promise(resolve => setTimeout(resolve, 800));
    }

    // Record in batch history
    const totalAmount = batchItems.reduce((sum, item) => sum + item.amount, 0);
    batchTransactionService.getBatch(currentBatch.id).completedAt = new Date().toISOString();
  };

  const cancelBatch = () => {
    if (currentBatch && !executing) {
      try {
        batchTransactionService.cancelBatch(currentBatch.id);
      } catch (error) {
        console.error('Error cancelling batch:', error);
      }
    }
    onClose();
  };

  if (!isOpen) return null;

  const efficiency = currentBatch ? batchTransactionService.calculateBatchEfficiency(batchItems.length) : null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-gray-900 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden border border-gray-700"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <FaLayerGroup className="text-2xl text-white" />
              <div>
                <h2 className="text-xl font-bold text-white">Create Batch Transaction</h2>
                {tier && (
                  <p className="text-sm text-blue-100">
                    {tier.name} Tier - Max {tier.benefits.maxBatchSize} transactions
                  </p>
                )}
              </div>
            </div>
            <button
              onClick={cancelBatch}
              disabled={executing}
              className="text-white hover:text-red-300 transition-colors disabled:opacity-50"
            >
              <FaTimes className="text-xl" />
            </button>
          </div>

          <div className="p-6 space-y-6 overflow-y-auto max-h-[calc(90vh-180px)]">
            {/* Add Item Section */}
            {!executing && (
              <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700">
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <FaPlus className="text-green-400" />
                  Add Transaction to Batch
                </h3>
                <div className="flex gap-3">
                  <input
                    type="number"
                    value={newItemAmount}
                    onChange={(e) => setNewItemAmount(e.target.value)}
                    placeholder="Amount (DCP)"
                    className="flex-1 px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={executing}
                    min="1"
                    max="10000"
                  />
                  <button
                    onClick={addItemToBatch}
                    disabled={executing || (currentBatch && batchItems.length >= currentBatch.maxSize)}
                    className="px-6 py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors flex items-center gap-2"
                  >
                    <FaPlus />
                    Add
                  </button>
                </div>
                <p className="text-xs text-gray-400 mt-2">
                  {batchItems.length} / {currentBatch?.maxSize || 0} transactions in batch
                </p>
              </div>
            )}

            {/* Batch Items List */}
            <div className="space-y-2">
              <h3 className="font-semibold flex items-center gap-2">
                <FaLayerGroup className="text-blue-400" />
                Batch Items ({batchItems.length})
              </h3>

              {batchItems.length === 0 ? (
                <div className="bg-gray-800/30 rounded-lg p-8 text-center border border-gray-700 border-dashed">
                  <FaLayerGroup className="text-4xl text-gray-600 mx-auto mb-3" />
                  <p className="text-gray-400">No transactions in batch yet</p>
                  <p className="text-sm text-gray-500 mt-1">Add transactions above to get started</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {batchItems.map((item, index) => (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      className="bg-gray-800/50 rounded-lg p-3 border border-gray-700 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-sm font-bold">
                          {index + 1}
                        </div>
                        <div>
                          <div className="font-medium">{item.amount} DCP</div>
                          <div className="text-xs text-gray-400">Purchase tokens</div>
                        </div>
                      </div>
                      {!executing && (
                        <button
                          onClick={() => removeItemFromBatch(item.id)}
                          className="text-red-400 hover:text-red-300 transition-colors p-2"
                        >
                          <FaTrash />
                        </button>
                      )}
                    </motion.div>
                  ))}
                </div>
              )}
            </div>

            {/* Efficiency Stats */}
            {efficiency && batchItems.length > 0 && (
              <div className="bg-gradient-to-r from-green-900/20 to-blue-900/20 rounded-xl p-4 border border-green-700/30">
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <FaCoins className="text-green-400" />
                  Batch Efficiency
                </h3>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <div className="text-gray-400">Individual Cost</div>
                    <div className="text-lg font-bold text-red-400">{efficiency.individualCost} XLM</div>
                  </div>
                  <div>
                    <div className="text-gray-400">Batch Cost</div>
                    <div className="text-lg font-bold text-green-400">{efficiency.batchCost} XLM</div>
                  </div>
                  <div>
                    <div className="text-gray-400">You Save</div>
                    <div className="text-lg font-bold text-blue-400">
                      {efficiency.savings} XLM ({efficiency.savingsPercent})
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Execution Progress */}
            {executing && progress && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-blue-900/20 rounded-xl p-4 border border-blue-700"
              >
                <div className="flex items-center gap-3 mb-3">
                  {progress.stage === 'complete' ? (
                    <FaCheckCircle className="text-2xl text-green-400" />
                  ) : progress.stage === 'error' ? (
                    <FaExclamationTriangle className="text-2xl text-red-400" />
                  ) : (
                    <div className="animate-spin text-2xl text-blue-400">
                      <FaClock />
                    </div>
                  )}
                  <div className="flex-1">
                    <div className="font-medium">{progress.message}</div>
                    {progress.progress !== undefined && (
                      <div className="mt-2 h-2 bg-gray-700 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${progress.progress}%` }}
                          className="h-full bg-gradient-to-r from-blue-500 to-green-500"
                          transition={{ duration: 0.3 }}
                        />
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </div>

          {/* Footer */}
          <div className="bg-gray-800/50 px-6 py-4 flex items-center justify-between border-t border-gray-700">
            <div className="text-sm text-gray-400">
              {currentBatch && (
                <>
                  Estimated savings: <span className="text-green-400 font-semibold">
                    {currentBatch.estimatedSavings.toFixed(6)} XLM
                  </span>
                </>
              )}
            </div>
            <div className="flex gap-3">
              <button
                onClick={cancelBatch}
                disabled={executing}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={executeBatch}
                disabled={executing || batchItems.length === 0}
                className="px-6 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:from-gray-600 disabled:to-gray-600 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors flex items-center gap-2"
              >
                <FaRocket />
                {executing ? 'Executing...' : `Execute Batch (${batchItems.length})`}
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default BatchTransactionModal;
