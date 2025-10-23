import { useState, useEffect } from 'react';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { Connection, Transaction, SystemProgram, PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { QRCodeSVG } from 'qrcode.react';
import BigNumber from 'bignumber.js';

// Treasury wallet dla odbierania płatności (w produkcji użyj bezpiecznego multi-sig)
const TREASURY_WALLET = new PublicKey('HN7cABqLq46Es1jh92dQQisAq662SmxELLLsHHe4YWrH'); // Devnet test wallet

function PointsMarketplacePage() {
  const { publicKey, connected, sendTransaction } = useWallet();
  const { connection } = useConnection();
  const [pointsStats, setPointsStats] = useState({
    totalPointsAvailable: 0,
    topEarners: [],
    recentTransactions: []
  });
  const [buyAmount, setBuyAmount] = useState('100');
  const [loading, setLoading] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [txSignature, setTxSignature] = useState(null);

  useEffect(() => {
    fetchPointsData();
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

  const handleBuyPoints = async () => {
    if (!connected || !publicKey) {
      alert('❌ Please connect your Solana wallet first!');
      return;
    }

    const amount = parseFloat(buyAmount);
    if (!amount || amount <= 0 || amount > 10000) {
      alert('❌ Invalid amount. Please enter between 1 and 10,000 DCP.');
      return;
    }

    setLoading(true);
    setTxSignature(null);

    try {
      // Oblicz cenę w SOL (zakładamy 1 DCP = 0.5 PLN, 1 SOL = ~$150, 1 PLN = ~$0.25)
      // Więc: 1 DCP = 0.5 PLN = ~$0.125 = ~0.00083 SOL
      // Dla uproszczenia: 100 DCP = 0.1 SOL (można dostosować)
      const priceInSOL = new BigNumber(amount).dividedBy(1000); // 100 DCP = 0.1 SOL
      const lamports = priceInSOL.multipliedBy(LAMPORTS_PER_SOL).toNumber();

      console.log(`💰 Buying ${amount} DCP for ${priceInSOL.toFixed(4)} SOL (${lamports} lamports)`);

      // Utwórz transakcję transferu SOL do treasury
      const transaction = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: publicKey,
          toPubkey: TREASURY_WALLET,
          lamports: Math.floor(lamports),
        })
      );

      // Pobierz recent blockhash
      const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = publicKey;

      console.log('📤 Sending transaction...');

      // Wyślij transakcję
      const signature = await sendTransaction(transaction, connection);
      console.log('✅ Transaction sent:', signature);
      setTxSignature(signature);

      // Czekaj na potwierdzenie
      alert(`⏳ Transaction sent!\nSignature: ${signature.slice(0, 16)}...\n\nWaiting for confirmation...`);

      const confirmation = await connection.confirmTransaction({
        signature,
        blockhash,
        lastValidBlockHeight
      });

      if (confirmation.value.err) {
        throw new Error('Transaction failed: ' + JSON.stringify(confirmation.value.err));
      }

      console.log('✅ Transaction confirmed!');

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
          walletAddress: publicKey.toString()
        })
      });

      if (!response.ok) {
        console.warn('Failed to record purchase in database, but blockchain transaction succeeded');
      }

      alert(`🎉 Purchase Successful!\n\n✓ Bought: ${amount} DCP tokens\n✓ Paid: ${priceInSOL.toFixed(4)} SOL (50% discount)\n✓ Transaction: ${signature.slice(0, 16)}...\n\n🔗 View on Solana Explorer:\nhttps://explorer.solana.com/tx/${signature}?cluster=devnet`);

      // Refresh stats
      fetchPointsData();
      setBuyAmount('100');

    } catch (err) {
      console.error('Transaction error:', err);
      alert(`❌ Transaction Failed\n\n${err.message}\n\nPlease ensure you have enough SOL for the transaction and fees.`);
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
            Buy DCP tokens at 50% discount • Support green energy on Solana
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
              <p>All transactions recorded on Solana for transparency</p>
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
                Connect your Solana wallet to buy DCP tokens
              </p>
              <WalletMultiButton className="!bg-purple-600 hover:!bg-purple-700 mx-auto" />
            </div>
          ) : (
            <>
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
                  Payment processed via Solana Pay
                </p>
              </div>

              <button
                onClick={handleBuyPoints}
                disabled={loading || !buyAmount || parseFloat(buyAmount) <= 0}
                className={`w-full py-4 rounded-lg font-bold text-lg transition-all ${
                  loading || !buyAmount || parseFloat(buyAmount) <= 0
                    ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                    : 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white'
                }`}
              >
                {loading ? '⏳ Processing Transaction...' : `💎 Buy ${buyAmount} DCP (${new BigNumber(buyAmount).dividedBy(1000).toFixed(4)} SOL)`}
              </button>

              {txSignature && (
                <div className="mt-4 p-4 bg-green-900 bg-opacity-30 border border-green-600 rounded-lg">
                  <p className="text-green-400 font-bold mb-2">✅ Transaction Successful!</p>
                  <p className="text-xs text-gray-300 mb-2 break-all">
                    Signature: {txSignature}
                  </p>
                  <a
                    href={`https://explorer.solana.com/tx/${txSignature}?cluster=devnet`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-400 hover:text-blue-300 underline text-sm"
                  >
                    🔗 View on Solana Explorer
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
                  <p className="text-sm text-gray-300 mb-3">Scan with Solana Pay compatible wallet</p>
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
                    Amount: {new BigNumber(buyAmount).dividedBy(1000).toFixed(4)} SOL
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
                <span>Participate in green energy economy on Solana</span>
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
      <div className="mt-8 bg-gradient-to-r from-purple-900 to-blue-900 border-2 border-purple-600 rounded-xl p-5 text-center">
        <p className="text-purple-100 text-sm">
          <strong>⛓️ Real Blockchain Transactions:</strong> All purchases are executed as actual SOL transfers on Solana Devnet.
          Each transaction is recorded on-chain and can be verified on Solana Explorer. This demonstrates real Web3 integration for the DeCharge economy.
        </p>
      </div>
    </div>
  );
}

export default PointsMarketplacePage;
