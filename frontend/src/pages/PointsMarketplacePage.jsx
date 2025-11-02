import { useState, useEffect } from 'react';
import { useStellar } from '../context/StellarWalletContext';

import { QRCodeSVG } from 'qrcode.react';
import BigNumber from 'bignumber.js';
import gatewayService from '../services/gatewayService';
import { getGatewayStatus } from '../config/gateway';
import { transactionStorage } from '../services/transactionStorage';
import { premiumTierService } from '../services/premiumTierService';
import { batchTransactionService } from '../services/batchTransactionService';
import { notify } from '../components/LiveNotifications';
import BatchTransactionModal from '../components/BatchTransactionModal';
import { checkAndNotifyAchievements } from '../utils/achievementNotifier';

// Stellar constants (equivalent to Solana's LAMPORTS_PER_SOL)
const STROOPS_PER_XLM = 10000000; // 1 XLM = 10 million stroops
const LAMPORTS_PER_SOL = STROOPS_PER_XLM; // Alias for compatibility

// TODO: Replace with Stellar SDK Transaction and operations
// Temporary stubs for compilation - these need to be replaced with actual Stellar SDK
class Transaction {
  add() { return this; }
  toJSON() { return {}; }
}
const SystemProgram = {
  transfer: () => ({})
};

// Treasury wallet dla odbierania płatności (w produkcji użyj bezpiecznego multi-sig)
// TODO: Replace with actual Stellar public key
const TREASURY_WALLET = 'GDXXXXXXXXXXXXXXXXXXXXXEXAMPLESTELLARADDRESSXXXXXXXXXXXXXXX'; // Testnet wallet

function PointsMarketplacePage() {
  const { publicKey, connected, connect, kit } = useStellar();
  
  const [pointsStats, setPointsStats] = useState({
    totalPointsAvailable: 0,
    topEarners: [],
    recentTransactions: []
  });
  const [buyAmount, setBuyAmount] = useState('100');
  const [loading, setLoading] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [txSignature, setTxSignature] = useState(null);
  const [gatewayProgress, setGatewayProgress] = useState(null);
  const [gatewayMetrics, setGatewayMetrics] = useState(null);
  const [useGateway, setUseGateway] = useState(true); // Toggle Gateway on/off
  const [showBatchModal, setShowBatchModal] = useState(false);
  const [currentTier, setCurrentTier] = useState(null);

  useEffect(() => {
    fetchPointsData();
    loadTierInfo();
  }, []);

  const fetchPointsData = async () => {
    try {
      // Fetch completed sessions to calculate available points
      const response = await fetch('http://localhost:3000/api/charging-sessions/my', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        const totalPoints = data.sessions
          ?.filter(s => s.status === 'completed')
          .reduce((sum, s) => sum + (s.points_earned || 0), 0) || 0;

        setPointsStats(prev => ({
          ...prev,
          totalPointsAvailable: totalPoints
        }));
      }
    } catch (err) {
      console.error('Error fetching points data:', err);
    }
  };

  const loadTierInfo = () => {
    const tier = premiumTierService.getCurrentTier();
    setCurrentTier(tier);
  };

  const handleBuyPoints = async () => {
    if (!connected || !publicKey) {
      alert('❌ Please connect your Stellar wallet first!');
      return;
    }

    const amount = parseFloat(buyAmount);
    if (!amount || amount <= 0 || amount > 10000) {
      alert('❌ Invalid amount. Please enter between 1 and 10,000 DCP.');
      return;
    }

    setLoading(true);
    setTxSignature(null);
    setGatewayProgress(null);
    setGatewayMetrics(null);

    try {
      // Oblicz cenę w XLM (zakładamy 1 DCP = 0.5 PLN, 1 XLM = ~$150, 1 PLN = ~$0.25)
      // Więc: 1 DCP = 0.5 PLN = ~$0.125 = ~0.00083 XLM
      // Dla uproszczenia: 100 DCP = 0.1 XLM (można dostosować)
      const priceInSOL = new BigNumber(amount).dividedBy(1000); // 100 DCP = 0.1 XLM
      const lamports = priceInSOL.multipliedBy(LAMPORTS_PER_SOL).toNumber();

      console.log(`💰 Buying ${amount} DCP for ${priceInSOL.toFixed(4)} XLM (${lamports} lamports)`);

      // Utwórz transakcję transferu XLM do treasury
      const transaction = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: publicKey,
          toPubkey: TREASURY_WALLET,
          lamports: Math.floor(lamports),
        })
      );

      let signature;

      // Use Gateway if enabled
      if (useGateway) {
        console.log('🚀 Using Sanctum Gateway for optimized delivery...');

        // Execute transaction through Gateway
        const result = await gatewayService.executeTransaction({
          transaction,
          connection,
          wallet,
          onProgress: (progress) => {
            console.log(`[Gateway] ${progress.stage}: ${progress.message}`);
            setGatewayProgress(progress);
          }
        });

        signature = result.signature;
        setGatewayMetrics(result.metrics);

        console.log('✅ Transaction completed via Gateway:', {
          signature,
          metadata: result.metadata,
          metrics: result.metrics
        });

      } else {
        // Standard Stellar RPC (without Gateway)
        console.log('📤 Sending via standard Stellar RPC...');

        const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();
        transaction.recentBlockhash = blockhash;
        transaction.feePayer = publicKey;

        signature = await sendTransaction(transaction, connection);
        console.log('✅ Transaction sent:', signature);

        setGatewayProgress({ stage: 'confirm', message: 'Waiting for confirmation...' });

        const confirmation = await connection.confirmTransaction({
          signature,
          blockhash,
          lastValidBlockHeight
        });

        if (confirmation.value.err) {
          throw new Error('Transaction failed: ' + JSON.stringify(confirmation.value.err));
        }

        console.log('✅ Transaction confirmed!');
      }

      setTxSignature(signature);
      setGatewayProgress({ stage: 'complete', message: 'Transaction successful!', signature });

      // Save transaction to Gateway storage for dashboard
      const transactionStartTime = Date.now() - (gatewayMetrics?.averageConfirmationTime || 3000);
      transactionStorage.addTransaction({
        signature,
        amount,
        status: 'success',
        deliveryMethod: useGateway ? 'gateway' : 'rpc',
        gatewayUsed: useGateway,
        confirmationTime: Date.now() - transactionStartTime,
        jitoTipRefunded: gatewayMetrics?.totalJitoTipsRefunded || 0,
        gatewayFee: useGateway ? 0.0001 : 0,
        metadata: {
          priceSOL: priceInSOL.toFixed(6),
          walletAddress: publicKey.toString()
        }
      });

      // Check for tier upgrade
      const tierUpgrade = premiumTierService.updateTier();
      if (tierUpgrade.upgraded) {
        console.log('🎉 Tier upgraded!', tierUpgrade);

        // Show notification
        notify.tierUpgrade(
          `Upgraded to ${tierUpgrade.newTier.name} Tier!`,
          tierUpgrade.message,
          [
            `${tierUpgrade.newTier.benefits.confirmationSpeedBoost}x faster confirmations`,
            `${(tierUpgrade.newTier.benefits.feeDiscount * 100).toFixed(0)}% fee discount`,
            `Batch up to ${tierUpgrade.newTier.benefits.maxBatchSize} transactions`,
            `${tierUpgrade.newTier.benefits.support} support level`
          ]
        );
      }

      // Check for newly unlocked achievements
      checkAndNotifyAchievements();

      // Show success notification
      notify.success(
        'Transaction Successful!',
        `Bought ${amount} DCP tokens for ${priceInSOL.toFixed(4)} XLM`,
        [
          useGateway ? '⚡ Delivered via Sanctum Gateway' : '📤 Standard RPC delivery',
          `Confirmation: ${((Date.now() - transactionStartTime) / 1000).toFixed(1)}s`,
          tierUpgrade.upgraded ? `🎉 Tier upgraded to ${tierUpgrade.newTier.name}!` : `Current tier: ${premiumTierService.getCurrentTier().name}`
        ]
      );

      // Zapisz zakup w bazie danych
      const response = await fetch('http://localhost:3000/api/points/purchase', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          amount: amount,
          priceSOL: priceInSOL.toFixed(6),
          txSignature: signature,
          walletAddress: publicKey.toString(),
          gatewayUsed: useGateway
        })
      });

      if (!response.ok) {
        console.warn('Failed to record purchase in database, but blockchain transaction succeeded');
      }

      // Show success with Gateway info
      const gatewayInfo = useGateway ? '\n⚡ Delivered via Sanctum Gateway' : '';
      alert(`🎉 Purchase Successful!\n\n✓ Bought: ${amount} DCP tokens\n✓ Paid: ${priceInSOL.toFixed(4)} XLM (50% discount)\n✓ Transaction: ${signature.slice(0, 16)}...${gatewayInfo}\n\n🔗 View on Stellar Explorer:\nhttps://explorer.solana.com/tx/${signature}?cluster=devnet`);

      // Refresh stats
      fetchPointsData();
      setBuyAmount('100');

    } catch (err) {
      console.error('Transaction error:', err);
      setGatewayProgress({ stage: 'error', message: err.message });

      // Save failed transaction to Gateway storage
      transactionStorage.addTransaction({
        signature: 'failed_' + Date.now(),
        amount,
        status: 'failed',
        deliveryMethod: useGateway ? 'gateway' : 'rpc',
        gatewayUsed: useGateway,
        confirmationTime: 0,
        jitoTipRefunded: 0,
        gatewayFee: 0,
        metadata: {
          error: err.message,
          walletAddress: publicKey?.toString() || 'unknown'
        }
      });

      alert(`❌ Transaction Failed\n\n${err.message}\n\nPlease ensure you have enough XLM for the transaction and fees.`);
    } finally {
      setLoading(false);
    }
  };

  const calculateDiscount = (amount) => {
    const regularPrice = parseFloat(amount) * 1.0;
    const discountedPrice = regularPrice * 0.5;
    return {
      regular: regularPrice.toFixed(2),
      discounted: discountedPrice.toFixed(2),
      saved: (regularPrice - discountedPrice).toFixed(2)
    };
  };

  const pricing = calculateDiscount(buyAmount);

  return (
    <div className="max-w-7xl mx-auto p-6 md:p-8 bg-gray-900 text-gray-100 min-h-screen">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
            💎 DeCharge Points Marketplace
          </h1>
          <p className="text-gray-400 text-sm">
            Buy DCP tokens at 50% discount • Support green energy on Stellar
          </p>
        </div>
        <WalletMultiButton className="!bg-purple-600 hover:!bg-purple-700" />
      </div>

      {/* Info Banner */}
      <div className="bg-gradient-to-r from-purple-900 to-blue-900 border-2 border-purple-600 rounded-xl p-6 mb-8">
        <h3 className="text-xl font-bold text-white mb-3 flex items-center gap-2">
          <span className="text-2xl">🌟</span>
          How it Works
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-300">
          <div className="flex gap-3">
            <div className="text-2xl">⚡</div>
            <div>
              <p className="font-bold text-white mb-1">EV Drivers Earn</p>
              <p>1 DCP token for every kWh charged, verified on-chain</p>
            </div>
          </div>
          <div className="flex gap-3">
            <div className="text-2xl">💰</div>
            <div>
              <p className="font-bold text-white mb-1">Web3 Users Buy</p>
              <p>Purchase DCP at 50% discount to support green energy</p>
            </div>
          </div>
          <div className="flex gap-3">
            <div className="text-2xl">🔗</div>
            <div>
              <p className="font-bold text-white mb-1">Blockchain Verified</p>
              <p>All transactions recorded on Stellar for transparency</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Buy Points Card */}
        <div className="bg-gray-800 rounded-xl shadow-lg border border-gray-700 p-6">
          <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
            🛒 Buy DeCharge Points
          </h2>

          {!connected ? (
            <div className="bg-yellow-900 bg-opacity-30 border border-yellow-600 rounded-lg p-6 text-center">
              <p className="text-yellow-200 mb-4">
                Connect your Stellar wallet to buy DCP tokens
              </p>
              <WalletMultiButton className="!bg-purple-600 hover:!bg-purple-700 mx-auto" />
            </div>
          ) : (
            <>
              {/* Gateway Status Banner */}
              <div className="mb-6 p-4 bg-gradient-to-r from-blue-900/30 to-purple-900/30 border border-blue-500/30 rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">⚡</span>
                    <span className="text-sm font-bold text-white">Sanctum Gateway</span>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      getGatewayStatus().enabled
                        ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                        : 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                    }`}>
                      {getGatewayStatus().enabled ? 'Active' : 'Fallback Mode'}
                    </span>
                  </div>
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={useGateway}
                      onChange={(e) => setUseGateway(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="relative w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
                <p className="text-xs text-gray-400 leading-relaxed">
                  {useGateway
                    ? '🚀 Optimized delivery via RPC + Jito bundles • Auto-refund tips • 0.0001 XLM/tx'
                    : '📡 Standard Stellar RPC (Gateway disabled for comparison)'}
                </p>
              </div>

              {/* Gateway Progress Indicator */}
              {gatewayProgress && loading && (
                <div className="mb-6 p-4 bg-blue-900/20 border border-blue-500/30 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-400"></div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-blue-400">
                        {gatewayProgress.stage === 'optimize' && '⚡ Optimizing transaction...'}
                        {gatewayProgress.stage === 'prepare' && '🔧 Preparing transaction...'}
                        {gatewayProgress.stage === 'sign' && '✍️ Please sign in your wallet...'}
                        {gatewayProgress.stage === 'send' && '📤 Sending via Gateway...'}
                        {gatewayProgress.stage === 'confirm' && '⏳ Confirming on-chain...'}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">{gatewayProgress.message}</p>
                    </div>
                  </div>
                </div>
              )}

              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-300 mb-2">
                  Amount of DCP Tokens
                </label>
                <input
                  type="number"
                  value={buyAmount}
                  onChange={(e) => setBuyAmount(e.target.value)}
                  min="1"
                  placeholder="100"
                  className="w-full p-4 border-2 border-gray-600 rounded-lg text-lg bg-gray-700 text-white placeholder-gray-400 focus:border-purple-500 focus:outline-none"
                />
                <p className="text-xs text-gray-400 mt-2">
                  Minimum: 1 DCP • Maximum: 10,000 DCP
                </p>
              </div>

              {/* Price Breakdown */}
              <div className="bg-gray-700 rounded-lg p-5 mb-6 space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Regular Price (1 DCP = 1 PLN)</span>
                  <span className="text-gray-300 line-through">{pricing.regular} PLN</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-green-400 font-bold">50% Discount</span>
                  <span className="text-green-400 font-bold">-{pricing.saved} PLN</span>
                </div>
                <div className="border-t border-gray-600 pt-3 flex justify-between">
                  <span className="text-white font-bold text-lg">You Pay</span>
                  <span className="text-purple-400 font-bold text-2xl">{pricing.discounted} PLN</span>
                </div>
                <p className="text-xs text-gray-400 text-center pt-2">
                  Payment processed via Stellar Pay
                </p>
              </div>

              <div className="space-y-3">
                <button
                  onClick={handleBuyPoints}
                  disabled={loading || !buyAmount || parseFloat(buyAmount) <= 0}
                  className={`w-full py-4 rounded-lg font-bold text-lg transition-all ${
                    loading || !buyAmount || parseFloat(buyAmount) <= 0
                      ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                      : 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white'
                  }`}
                >
                  {loading ? '⏳ Processing Transaction...' : `💎 Buy ${buyAmount} DCP (${new BigNumber(buyAmount).dividedBy(1000).toFixed(4)} XLM)`}
                </button>

                {/* Batch Purchase Button */}
                {currentTier && currentTier.benefits.maxBatchSize > 1 && (
                  <button
                    onClick={() => setShowBatchModal(true)}
                    disabled={loading}
                    className="w-full py-3 rounded-lg font-semibold text-base transition-all bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:from-gray-600 disabled:to-gray-600 text-white flex items-center justify-center gap-2"
                  >
                    <span>⚡</span>
                    Batch Purchase (Save up to 90%)
                    <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full">
                      {currentTier.name}
                    </span>
                  </button>
                )}
              </div>

              {txSignature && (
                <div className="mt-4 p-4 bg-green-900 bg-opacity-30 border border-green-600 rounded-lg space-y-3">
                  <p className="text-green-400 font-bold mb-2">✅ Transaction Successful!</p>
                  <p className="text-xs text-gray-300 mb-2 break-all">
                    Signature: {txSignature}
                  </p>

                  {/* Gateway Metrics */}
                  {gatewayMetrics && useGateway && (
                    <div className="mt-3 pt-3 border-t border-green-600/30">
                      <p className="text-xs font-bold text-green-400 mb-2">⚡ Gateway Performance:</p>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="bg-gray-800/50 rounded p-2">
                          <p className="text-gray-400">Success Rate</p>
                          <p className="text-green-400 font-bold">{gatewayMetrics.successRate}</p>
                        </div>
                        <div className="bg-gray-800/50 rounded p-2">
                          <p className="text-gray-400">Transactions</p>
                          <p className="text-blue-400 font-bold">{gatewayMetrics.successfulTransactions}/{gatewayMetrics.totalTransactions}</p>
                        </div>
                        {gatewayMetrics.totalJitoTipsRefunded > 0 && (
                          <div className="bg-gray-800/50 rounded p-2 col-span-2">
                            <p className="text-gray-400">💰 Jito Tips Refunded</p>
                            <p className="text-amber-400 font-bold">{gatewayMetrics.totalJitoTipsRefunded} XLM saved</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  <a
                    href={`https://explorer.solana.com/tx/${txSignature}?cluster=devnet`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-400 hover:text-blue-300 underline text-sm block"
                  >
                    🔗 View on Stellar Explorer
                  </a>
                </div>
              )}

              <div className="flex items-center justify-between mt-4">
                <p className="text-xs text-gray-400">
                  Connected: {publicKey?.toString().slice(0, 8)}...{publicKey?.toString().slice(-8)}
                </p>
                <button
                  onClick={() => setShowQR(!showQR)}
                  className="text-xs text-purple-400 hover:text-purple-300 underline"
                >
                  {showQR ? 'Hide' : 'Show'} Payment QR
                </button>
              </div>

              {showQR && (
                <div className="mt-4 p-4 bg-gray-700 rounded-lg text-center">
                  <p className="text-sm text-gray-300 mb-3">Scan with Stellar Pay compatible wallet</p>
                  <div className="flex justify-center">
                    <QRCodeSVG
                      value={`solana:${TREASURY_WALLET.toString()}?amount=${new BigNumber(buyAmount).dividedBy(1000).toFixed(6)}&label=DeCharge%20Points&message=Buy%20${buyAmount}%20DCP`}
                      size={200}
                      bgColor="#1f2937"
                      fgColor="#ffffff"
                      level="H"
                    />
                  </div>
                  <p className="text-xs text-gray-400 mt-3">
                    Amount: {new BigNumber(buyAmount).dividedBy(1000).toFixed(4)} XLM
                  </p>
                </div>
              )}
            </>
          )}
        </div>

        {/* Stats & Info */}
        <div className="space-y-6">
          {/* Market Stats */}
          <div className="bg-gray-800 rounded-xl shadow-lg border border-gray-700 p-6">
            <h3 className="text-xl font-bold text-white mb-4">Market Stats</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Total DCP Available</span>
                <span className="text-2xl font-bold text-purple-400">{pointsStats.totalPointsAvailable}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Current Price</span>
                <span className="text-xl font-bold text-green-400">0.50 PLN</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Regular Price</span>
                <span className="text-lg text-gray-500 line-through">1.00 PLN</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Your Savings</span>
                <span className="text-xl font-bold text-amber-400">50%</span>
              </div>
            </div>
          </div>

          {/* Benefits */}
          <div className="bg-gradient-to-br from-green-900 to-green-800 rounded-xl shadow-lg border border-green-600 p-6">
            <h3 className="text-xl font-bold text-white mb-4">Why Buy DCP?</h3>
            <ul className="space-y-3 text-sm text-green-100">
              <li className="flex items-start gap-2">
                <span className="text-green-400 mt-0.5">✓</span>
                <span>Support real-world EV charging infrastructure</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-400 mt-0.5">✓</span>
                <span>Participate in green energy economy on Stellar</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-400 mt-0.5">✓</span>
                <span>Get 50% discount on tokens earned by real EV drivers</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-400 mt-0.5">✓</span>
                <span>Full transparency via on-chain verification</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-400 mt-0.5">✓</span>
                <span>Contribute to sustainable transport adoption</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Blockchain Notice */}
      <div className="mt-8 bg-gradient-to-r from-purple-900 to-blue-900 border-2 border-purple-600 rounded-xl p-5 text-center space-y-3">
        <p className="text-purple-100 text-sm">
          <strong>⛓️ Real Blockchain Transactions:</strong> All purchases are executed as actual XLM transfers on Stellar Devnet.
          Each transaction is recorded on-chain and can be verified on Stellar Explorer. This demonstrates real Web3 integration for the DeCharge economy.
        </p>
        <div className="pt-3 border-t border-purple-600/30">
          <p className="text-blue-200 text-sm">
            <strong>⚡ Powered by Sanctum Gateway:</strong> Transactions are optimized and delivered through multiple channels (RPC + Jito bundles) for maximum reliability.
            Gateway automatically refunds Jito tips if transactions land via RPC, saving costs while ensuring the highest success rate.
            <a
              href="https://gateway.sanctum.so"
              target="_blank"
              rel="noopener noreferrer"
              className="ml-2 text-blue-400 hover:text-blue-300 underline"
            >
              Learn more →
            </a>
          </p>
          <p className="text-indigo-200 text-sm mt-3">
            <strong>📊 Track Performance:</strong> View detailed analytics, success rates, and cost savings in the{' '}
            <a
              href="/gateway-dashboard"
              className="text-indigo-400 hover:text-indigo-300 underline font-bold"
            >
              Gateway Dashboard →
            </a>
          </p>
        </div>
      </div>

      {/* Batch Transaction Modal */}
      <BatchTransactionModal
        isOpen={showBatchModal}
        onClose={() => setShowBatchModal(false)}
        onExecute={(batch) => {
          console.log('Batch executed:', batch);
          notify.batch(
            'Batch Transaction Complete!',
            `Successfully processed ${batch.transactions.length} transactions`,
            [
              `Saved ${batch.estimatedSavings.toFixed(6)} XLM in fees`,
              `Total: ${batch.transactions.reduce((sum, tx) => sum + (tx.amount || 0), 0)} DCP`,
              `Tier: ${currentTier?.name || 'Unknown'}`
            ]
          );
          loadTierInfo();
        }}
      />
    </div>
  );
}

export default PointsMarketplacePage;
