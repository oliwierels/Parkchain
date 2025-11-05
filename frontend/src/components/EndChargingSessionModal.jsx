import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useStellar } from '../context/StellarWalletContext';
import gatewayService from '../services/gatewayService';
import PaymentMethodSelector from './PaymentMethodSelector';

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

// Helper for Stellar addresses (replaces Solana's PublicKey class)
const PublicKey = (address) => address; // In Stellar, addresses are strings

function EndChargingSessionModal({ session, onClose, onSuccess }) {
  const { t } = useTranslation();
  const { publicKey, connected, connect, kit } = useStellar();
  

  const [step, setStep] = useState('details'); // 'details' | 'payment' | 'processing'
  const [paymentMethod, setPaymentMethod] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [gatewayProgress, setGatewayProgress] = useState(null);
  const [txSignature, setTxSignature] = useState(null);

  const [formData, setFormData] = useState({
    energy_delivered_kwh: '',
    charging_duration_minutes: ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const calculateEstimatedCost = () => {
    if (!formData.energy_delivered_kwh) return 0;
    const pricePerKwh = session.originalData?.charging_stations?.price_per_kwh || 0;
    return (parseFloat(formData.energy_delivered_kwh) * parseFloat(pricePerKwh)).toFixed(2);
  };

  const handleDetailsSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!formData.energy_delivered_kwh) {
      setError(t('messages.provideEnergyAmount'));
      return;
    }

    // Go to payment step
    setStep('payment');
  };

  const handlePayment = async () => {
    if (!paymentMethod) {
      setError(t('messages.selectPaymentMethod'));
      return;
    }

    setLoading(true);
    setError(null);
    setStep('processing');

    try {
      // Process payment based on selected method
      let paymentResult = null;

      if (paymentMethod === 'gateway') {
        paymentResult = await processGatewayPayment();
      } else if (paymentMethod === 'solana') {
        paymentResult = await processStandardSolanaPayment();
      } else if (paymentMethod === 'card') {
        paymentResult = await processCreditCardPayment();
      } else if (paymentMethod === 'later') {
        paymentResult = { method: 'later', paid: false };
      }

      // End charging session with payment info
      const response = await fetch(`http://localhost:3000/api/charging-sessions/${session.id}/end`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          energy_delivered_kwh: parseFloat(formData.energy_delivered_kwh),
          charging_duration_minutes: formData.charging_duration_minutes ? parseInt(formData.charging_duration_minutes) : null,
          payment_method: paymentMethod,
          payment_signature: paymentResult?.signature || null,
          payment_status: paymentResult?.paid ? 'paid' : 'pending'
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || t('messages.sessionEndError'));
      }

      const data = await response.json();
      console.log(t('messages.sessionPaidSuccess'), data);

      onSuccess();
      setTimeout(() => onClose(), 2000);
    } catch (err) {
      console.error(t('messages.sessionPaymentError'), err);
      setError(err.message || t('messages.sessionEndError'));
      setStep('payment');
    } finally {
      setLoading(false);
    }
  };

  const processGatewayPayment = async () => {
    console.log('⚡ Procesowanie płatności za ładowanie przez Gateway...');

    const TREASURY_WALLET = new PublicKey('HN7cABqLq46Es1jh92dQQisAq662SmxELLLsHHe4YWrH');

    const costPLN = parseFloat(calculateEstimatedCost());
    const costSOL = costPLN / 600; // Rough conversion
    const lamports = Math.floor(costSOL * LAMPORTS_PER_SOL);

    const transaction = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey: wallet.publicKey,
        toPubkey: TREASURY_WALLET,
        lamports: lamports,
      })
    );

    const result = await gatewayService.executeTransaction({
      transaction,
      connection,
      wallet,
      onProgress: (progress) => {
        console.log(`[Gateway] ${progress.stage}: ${progress.message}`);
        setGatewayProgress(progress);
      }
    });

    setTxSignature(result.signature);

    return {
      method: 'gateway',
      signature: result.signature,
      paid: true,
      metadata: result.metadata
    };
  };

  const processStandardSolanaPayment = async () => {
    console.log('◎ Procesowanie standardowej płatności Stellar...');

    const TREASURY_WALLET = new PublicKey('HN7cABqLq46Es1jh92dQQisAq662SmxELLLsHHe4YWrH');
    const costPLN = parseFloat(calculateEstimatedCost());
    const costSOL = costPLN / 600;
    const lamports = Math.floor(costSOL * LAMPORTS_PER_SOL);

    const transaction = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey: wallet.publicKey,
        toPubkey: TREASURY_WALLET,
        lamports: lamports,
      })
    );

    const { blockhash } = await connection.getLatestBlockhash();
    transaction.recentBlockhash = blockhash;
    transaction.feePayer = wallet.publicKey;

    const signed = await wallet.signTransaction(transaction);
    const signature = await connection.sendRawTransaction(signed.serialize());
    await connection.confirmTransaction(signature);

    return {
      method: 'solana',
      signature,
      paid: true
    };
  };

  const processCreditCardPayment = async () => {
    console.log('💳 Procesowanie płatności kartą...');
    await new Promise(resolve => setTimeout(resolve, 2000));

    return {
      method: 'card',
      signature: `card_${Date.now()}`,
      paid: true
    };
  };

  return (
    <div className="fixed top-0 left-0 right-0 bottom-0 bg-black bg-opacity-70 flex justify-center items-center z-[2000] p-5">
      <div className={`bg-gray-800 rounded-xl p-6 ${step === 'payment' ? 'max-w-4xl' : 'max-w-md'} w-full max-h-[90vh] overflow-auto shadow-2xl border border-gray-700`}>
        {/* Header */}
        <div className="flex justify-between items-center mb-5">
          <div>
            <h2 className="m-0 text-xl font-bold text-white flex items-center gap-2">
              {step === 'details' && '⚡ End Charging Session'}
              {step === 'payment' && '💳 Choose Payment Method'}
              {step === 'processing' && '⏳ Processing Payment...'}
            </h2>
            {/* Step indicator */}
            <div className="flex gap-2 mt-2 text-xs">
              <span className={`font-bold ${step === 'details' ? 'text-indigo-400' : 'text-green-400'}`}>
                {step === 'details' ? '1. Szczegóły' : '✓ Szczegóły'}
              </span>
              <span className="text-gray-600">→</span>
              <span className={`font-bold ${step === 'payment' ? 'text-indigo-400' : step === 'processing' ? 'text-green-400' : 'text-gray-500'}`}>
                {step === 'processing' ? '✓ Płatność' : step === 'payment' ? '2. Płatność' : '2. Płatność'}
              </span>
              <span className="text-gray-600">→</span>
              <span className={`font-bold ${step === 'processing' ? 'text-indigo-400' : 'text-gray-500'}`}>
                3. Potwierdzenie
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={loading}
            className={`bg-transparent border-none text-2xl ${loading ? 'cursor-not-allowed' : 'cursor-pointer'} text-gray-400 hover:text-white transition-colors`}
          >
            ✕
          </button>
        </div>

        {error && (
          <div className="bg-red-800 text-red-100 p-3 rounded-lg mb-4 text-sm">
            {error}
          </div>
        )}

        {/* Info o sesji */}
        <div className="bg-gray-700 p-4 rounded-lg mb-5 border border-gray-600">
          <h3 className="text-base font-bold text-white mb-3">
            {session.name}
          </h3>
          <p className="text-sm text-gray-300 mb-1">
            📍 {session.address}
          </p>
          <p className="text-sm text-gray-300 mb-3">
            🕐 Started: {new Date(session.startTime).toLocaleString('pl-PL')}
          </p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-xs text-gray-400 mb-1">Price per kWh</p>
              <p className="text-sm font-bold text-green-400">
                {session.originalData?.charging_stations?.price_per_kwh} PLN
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-400 mb-1">Typ ładowarki</p>
              <p className="text-sm font-bold text-gray-100">
                {session.originalData?.charging_stations?.charger_type}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-yellow-900 bg-opacity-20 p-3 rounded-lg mb-5 border border-yellow-700">
          <p className="text-yellow-200 text-xs">
            ⚠️ <strong>Uwaga:</strong> Twoje dane będą zweryfikowane przez właściciela ładowarki.
            Podaj prawdziwe wartości z wyświetlacza ładowarki.
          </p>
        </div>

        {/* Step 1: Session Details */}
        {step === 'details' && (
          <form onSubmit={handleDetailsSubmit}>
          {/* Dostarczona energia */}
          <div className="mb-4">
            <label className="block text-sm font-semibold text-gray-300 mb-2">
              Dostarczona energia (kWh) *
            </label>
            <input
              type="number"
              name="energy_delivered_kwh"
              value={formData.energy_delivered_kwh}
              onChange={handleChange}
              placeholder="np. 42.5"
              min="0"
              step="0.1"
              required
              className="w-full p-3 border border-gray-600 rounded-lg text-sm bg-gray-700 text-white placeholder-gray-400 focus:border-indigo-500 focus:outline-none"
            />
            <small className="text-gray-400 text-xs mt-1 block">
              Sprawdź na wyświetlaczu ładowarki lub w aplikacji producenta
            </small>
          </div>

          {/* Czas trwania */}
          <div className="mb-4">
            <label className="block text-sm font-semibold text-gray-300 mb-2">
              Czas ładowania (minuty)
            </label>
            <input
              type="number"
              name="charging_duration_minutes"
              value={formData.charging_duration_minutes}
              onChange={handleChange}
              placeholder="np. 45"
              min="0"
              className="w-full p-3 border border-gray-600 rounded-lg text-sm bg-gray-700 text-white placeholder-gray-400 focus:border-indigo-500 focus:outline-none"
            />
            <small className="text-gray-400 text-xs mt-1 block">
              Opcjonalne - zostanie obliczony automatycznie
            </small>
          </div>

          {/* Szacowany koszt */}
          {formData.energy_delivered_kwh && (
            <div className="bg-indigo-900 bg-opacity-30 p-4 rounded-lg mb-5 border border-indigo-700">
              <p className="text-xs text-gray-400 mb-1">Szacowany koszt</p>
              <p className="text-2xl font-bold text-indigo-400">
                {calculateEstimatedCost()} PLN
              </p>
            </div>
          )}

          {/* Przyciski */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className={`flex-1 py-3 border border-gray-600 rounded-lg text-sm font-bold text-gray-300 bg-transparent transition-colors ${
                loading ? 'cursor-not-allowed opacity-50' : 'hover:bg-gray-700 cursor-pointer'
              }`}
            >
              Anuluj
            </button>
            <button
              type="submit"
              disabled={loading || !formData.energy_delivered_kwh}
              className={`flex-1 py-3 border-none rounded-lg text-sm font-bold text-white transition-colors ${
                loading || !formData.energy_delivered_kwh
                  ? 'bg-gray-600 cursor-not-allowed'
                  : 'bg-indigo-600 hover:bg-indigo-700 cursor-pointer'
              }`}
            >
              {loading ? 'Ładowanie...' : 'Dalej: Płatność →'}
            </button>
          </div>
        </form>
        )}

        {/* Step 2: Payment Method Selection */}
        {step === 'payment' && formData.energy_delivered_kwh && (
          <div>
            <PaymentMethodSelector
              amount={parseFloat(calculateEstimatedCost())}
              selectedMethod={paymentMethod}
              onSelect={setPaymentMethod}
            />

            {/* Payment Buttons */}
            <div className="flex gap-3 mt-6">
              <button
                type="button"
                onClick={() => {
                  setStep('details');
                  setError(null);
                }}
                className="flex-1 py-3 border border-gray-600 rounded-lg text-sm font-bold text-gray-300 bg-transparent hover:bg-gray-700 cursor-pointer transition-colors"
              >
                ← Wróć
              </button>
              <button
                type="button"
                onClick={handlePayment}
                disabled={!paymentMethod || loading}
                className={`flex-2 py-3 border-none rounded-lg text-sm font-bold text-white transition-colors ${
                  !paymentMethod || loading
                    ? 'bg-gray-600 cursor-not-allowed'
                    : 'bg-green-600 hover:bg-green-700 cursor-pointer'
                }`}
              >
                {loading ? 'Przetwarzanie...' : 'Zapłać i zakończ sesję →'}
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Processing Payment */}
        {step === 'processing' && (
          <div>
            {/* Gateway Progress */}
            {gatewayProgress && paymentMethod === 'gateway' && (
              <div className="bg-blue-900 bg-opacity-30 border-2 border-blue-600 rounded-xl p-5 mb-5">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                  <div className="flex-1">
                    <p className="text-lg font-bold text-blue-300 mb-1">
                      {gatewayProgress.stage === 'optimize' && '⚡ Optymalizacja transakcji...'}
                      {gatewayProgress.stage === 'prepare' && '🔧 Przygotowanie...'}
                      {gatewayProgress.stage === 'sign' && '✍️ Sign in wallet...'}
                      {gatewayProgress.stage === 'send' && '📤 Wysyłanie przez Gateway...'}
                      {gatewayProgress.stage === 'confirm' && '⏳ Potwierdzanie...'}
                      {gatewayProgress.stage === 'complete' && '✅ Gotowe!'}
                    </p>
                    <p className="text-sm text-blue-400">{gatewayProgress.message}</p>
                  </div>
                </div>

                {(gatewayProgress.stage === 'send' || gatewayProgress.stage === 'confirm') && (
                  <div className="bg-gray-800 rounded-lg p-3 text-xs text-blue-300">
                    <strong>⚡ Gateway wysyła przez RPC + Jito jednocześnie!</strong>
                    <br />
                    Jeśli RPC sukces → Jito tip zwrócony automatycznie 💰
                  </div>
                )}
              </div>
            )}

            {/* Standard processing */}
            {paymentMethod !== 'gateway' && loading && (
              <div className="text-center py-10 bg-gray-700 rounded-xl">
                <div className="w-16 h-16 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-lg font-bold text-white mb-2">Przetwarzanie płatności...</p>
                <p className="text-sm text-gray-400">Proszę czekać...</p>
              </div>
            )}

            {/* Success */}
            {txSignature && !loading && (
              <div className="bg-green-900 bg-opacity-30 border-2 border-green-600 rounded-xl p-6 text-center">
                <div className="text-5xl mb-4">✅</div>
                <h3 className="text-2xl font-bold text-green-400 mb-3">
                  Płatność zakończona!
                </h3>
                <p className="text-base text-green-300 mb-4">
                  Sesja ładowania zakończona i opłacona
                </p>
                {paymentMethod === 'gateway' && (
                  <div className="bg-gray-800 rounded-lg p-4 mb-4">
                    <p className="text-sm font-bold text-green-400 mb-2">
                      ⚡ Płatność przez Sanctum Gateway
                    </p>
                    <p className="text-xs text-gray-300">
                      Transakcja: {txSignature.slice(0, 16)}...
                    </p>
                  </div>
                )}
                <p className="text-xs text-gray-400">
                  Okno zamknie się automatycznie...
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* CSS Animation */}
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-spin {
          animation: spin 1s linear infinite;
        }
      `}</style>
    </div>
  );
}

export default EndChargingSessionModal;
