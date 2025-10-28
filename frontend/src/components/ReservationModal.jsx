// frontend/src/components/ReservationModal.jsx

import { useState, useEffect } from 'react';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { Transaction, SystemProgram, LAMPORTS_PER_SOL, PublicKey } from '@solana/web3.js';
import { reservationAPI } from '../services/api';
import gatewayService from '../services/gatewayService';
import PaymentMethodSelector from './PaymentMethodSelector';
import { motion, AnimatePresence } from 'framer-motion';

function ReservationModal({ parking, onClose, onSuccess }) {
  const wallet = useWallet();
  const { connection } = useConnection();

  const [step, setStep] = useState('details'); // 'details' | 'payment' | 'processing'
  const [paymentMethod, setPaymentMethod] = useState(null);

  const [formData, setFormData] = useState({
    startDate: '',
    startTime: '',
    endDate: '',
    endTime: '',
    licensePlate: ''
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [priceCalculation, setPriceCalculation] = useState(null);
  const [calculatingPrice, setCalculatingPrice] = useState(false);
  const [gatewayProgress, setGatewayProgress] = useState(null);
  const [txSignature, setTxSignature] = useState(null);

  const handleChange = (e) => {
    const newData = {
      ...formData,
      [e.target.name]: e.target.value
    };
    setFormData(newData);

    // Oblicz cenę jeśli wszystkie daty są wypełnione
    if (newData.startDate && newData.startTime && newData.endDate && newData.endTime) {
      calculatePrice(newData);
    } else {
      setPriceCalculation(null);
    }
  };

  const calculatePrice = async (data) => {
    const start = new Date(`${data.startDate}T${data.startTime}`);
    const end = new Date(`${data.endDate}T${data.endTime}`);

    if (end <= start) {
      setPriceCalculation(null);
      return;
    }

    try {
      setCalculatingPrice(true);

      // Oblicz czas trwania
      const durationMs = end.getTime() - start.getTime();
      const hours = durationMs / (1000 * 60 * 60);
      const days = hours / 24;
      const weeks = days / 7;
      const months = days / 30;

      // Dostępne opcje cenowe
      const allOptions = [];

      // Opcja 1: Cena godzinowa
      if (parking.price_per_hour || parking.hourly_rate) {
        const hourlyRate = parking.price_per_hour || parking.hourly_rate;
        allOptions.push({
          type: 'hourly',
          label: 'Stawka godzinowa',
          price: parseFloat((hours * hourlyRate).toFixed(2))
        });
      }

      // Opcja 2: Cena dzienna (jeśli >= 1 dzień)
      if (parking.price_per_day && days >= 1) {
        const fullDays = Math.ceil(days);
        allOptions.push({
          type: 'daily',
          label: 'Stawka dzienna',
          price: parseFloat((fullDays * parking.price_per_day).toFixed(2))
        });
      }

      // Opcja 3: Cena tygodniowa (jeśli >= 1 tydzień)
      if (parking.price_per_week && weeks >= 1) {
        const fullWeeks = Math.ceil(weeks);
        allOptions.push({
          type: 'weekly',
          label: 'Stawka tygodniowa',
          price: parseFloat((fullWeeks * parking.price_per_week).toFixed(2))
        });
      }

      // Opcja 4: Cena miesięczna (jeśli >= 1 miesiąc)
      if (parking.price_per_month && months >= 1) {
        const fullMonths = Math.ceil(months);
        allOptions.push({
          type: 'monthly',
          label: 'Stawka miesięczna',
          price: parseFloat((fullMonths * parking.price_per_month).toFixed(2))
        });
      }

      // Znajdź najtańszą opcję
      if (allOptions.length === 0) {
        console.error('❌ Brak dostępnych opcji cenowych dla parkingu');
        setPriceCalculation(null);
        setCalculatingPrice(false);
        return;
      }

      const bestOption = allOptions.reduce((min, option) =>
        option.price < min.price ? option : min
      );

      const calculation = {
        price: bestOption.price,
        pricingType: bestOption.type,
        pricingLabel: bestOption.label,
        hours: hours,
        days: days,
        allOptions: allOptions
      };

      console.log('💰 Obliczona cena:', calculation);
      setPriceCalculation(calculation);
    } catch (err) {
      console.error('Błąd obliczania ceny:', err);
      setPriceCalculation(null);
    } finally {
      setCalculatingPrice(false);
    }
  };

  const handleDetailsSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    const start = new Date(`${formData.startDate}T${formData.startTime}`);
    const end = new Date(`${formData.endDate}T${formData.endTime}`);

    if (end <= start) {
      setError('Data zakończenia musi być późniejsza niż data rozpoczęcia');
      return;
    }

    if (!priceCalculation) {
      setError('Nie udało się obliczyć ceny');
      return;
    }

    // Go to payment step
    setStep('payment');
  };

  const handlePayment = async () => {
    if (!paymentMethod) {
      setError('Wybierz metodę płatności');
      return;
    }

    setLoading(true);
    setError(null);
    setStep('processing');

    try {
      const start = new Date(`${formData.startDate}T${formData.startTime}`);
      const end = new Date(`${formData.endDate}T${formData.endTime}`);

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

      // Create reservation in database
      const reservationData = {
        lot_id: parking.id,
        start_time: start.toISOString(),
        end_time: end.toISOString(),
        license_plate: formData.licensePlate,
        pricing_type: priceCalculation.pricingType,
        payment_method: paymentMethod,
        payment_signature: paymentResult?.signature || null,
        payment_status: paymentResult?.paid ? 'paid' : 'pending'
      };

      console.log('🔄 Tworzę rezerwację z płatnością:', reservationData);

      const result = await reservationAPI.createReservation(reservationData);
      console.log('✅ Rezerwacja utworzona:', result);

      // Pass reservation data to success callback
      onSuccess(result);
      onClose(); // Close immediately, success modal will show
    } catch (err) {
      console.error('❌ Błąd płatności/rezerwacji:', err);
      setError(err.message || 'Nie udało się przetworzyć płatności');
      setStep('payment'); // Go back to payment selection
    } finally {
      setLoading(false);
    }
  };

  const processGatewayPayment = async () => {
    console.log('⚡ Procesowanie płatności przez Gateway...');

    // Treasury wallet for parking payments (in production, use owner's wallet)
    const TREASURY_WALLET = new PublicKey('HN7cABqLq46Es1jh92dQQisAq662SmxELLLsHHe4YWrH');

    // Convert PLN to SOL (rough estimate: 1 SOL = ~600 PLN)
    const priceSOL = priceCalculation.price / 600;
    const lamports = Math.floor(priceSOL * LAMPORTS_PER_SOL);

    // Check user balance
    const balance = await connection.getBalance(wallet.publicKey);
    const minRent = 5000; // 0.000005 SOL minimum rent exemption
    const estimatedFee = 5000; // ~0.000005 SOL estimated transaction fee
    const requiredBalance = lamports + minRent + estimatedFee;

    console.log(`💰 Balance check: ${balance / LAMPORTS_PER_SOL} SOL available, ${requiredBalance / LAMPORTS_PER_SOL} SOL required`);

    if (balance < requiredBalance) {
      throw new Error(
        `Niewystarczające środki. Potrzebujesz ${(requiredBalance / LAMPORTS_PER_SOL).toFixed(6)} SOL, masz ${(balance / LAMPORTS_PER_SOL).toFixed(6)} SOL. ` +
        `Dodaj co najmniej ${((requiredBalance - balance) / LAMPORTS_PER_SOL).toFixed(6)} SOL do portfela.`
      );
    }

    // Create transaction
    const transaction = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey: wallet.publicKey,
        toPubkey: TREASURY_WALLET,
        lamports: lamports,
      })
    );

    // Execute via Gateway
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
    console.log('◎ Procesowanie standardowej płatności Solana...');

    const TREASURY_WALLET = new PublicKey('HN7cABqLq46Es1jh92dQQisAq662SmxELLLsHHe4YWrH');
    const priceSOL = priceCalculation.price / 600;
    const lamports = Math.floor(priceSOL * LAMPORTS_PER_SOL);

    // Check user balance
    const balance = await connection.getBalance(wallet.publicKey);
    const minRent = 5000; // 0.000005 SOL minimum rent exemption
    const estimatedFee = 5000; // ~0.000005 SOL estimated transaction fee
    const requiredBalance = lamports + minRent + estimatedFee;

    console.log(`💰 Balance check: ${balance / LAMPORTS_PER_SOL} SOL available, ${requiredBalance / LAMPORTS_PER_SOL} SOL required`);

    if (balance < requiredBalance) {
      throw new Error(
        `Niewystarczające środki. Potrzebujesz ${(requiredBalance / LAMPORTS_PER_SOL).toFixed(6)} SOL, masz ${(balance / LAMPORTS_PER_SOL).toFixed(6)} SOL. ` +
        `Dodaj co najmniej ${((requiredBalance - balance) / LAMPORTS_PER_SOL).toFixed(6)} SOL do portfela.`
      );
    }

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
    // In production, integrate with Stripe or other payment provider
    // For demo, simulate payment
    await new Promise(resolve => setTimeout(resolve, 2000));

    return {
      method: 'card',
      signature: `card_${Date.now()}`,
      paid: true
    };
  };

  // Dzisiejsza data w formacie YYYY-MM-DD
  const today = new Date().toISOString().split('T')[0];

  // Step progress calculation
  const getStepNumber = () => {
    if (step === 'details') return 1;
    if (step === 'payment') return 2;
    if (step === 'processing') return 3;
    return 1;
  };

  const progress = (getStepNumber() / 3) * 100;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, backdropFilter: 'blur(0px)' }}
        animate={{ opacity: 1, backdropFilter: 'blur(12px)' }}
        exit={{ opacity: 0, backdropFilter: 'blur(0px)' }}
        transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.65)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 9999
        }}
        onClick={onClose}
      >
        <motion.div
          initial={{
            scale: 0.6,
            opacity: 0,
            y: 100,
            rotateX: 25,
            rotateZ: -10
          }}
          animate={{
            scale: [0.6, 1.15, 0.95, 1],
            opacity: 1,
            y: 0,
            rotateX: 0,
            rotateZ: 0
          }}
          exit={{
            scale: 0.8,
            opacity: 0,
            y: 50,
            rotateX: 15
          }}
          transition={{
            scale: {
              type: 'tween',
              ease: [0.34, 1.56, 0.64, 1],
              duration: 0.7,
              times: [0, 0.4, 0.7, 1]
            },
            opacity: { duration: 0.3 },
            y: {
              type: 'spring',
              stiffness: 200,
              damping: 25
            },
            rotateX: {
              type: 'spring',
              stiffness: 150,
              damping: 20
            },
            rotateZ: {
              type: 'spring',
              stiffness: 150,
              damping: 20
            }
          }}
          style={{
            backgroundColor: 'white',
            borderRadius: '28px',
            padding: '36px',
            maxWidth: step === 'payment' ? '900px' : '550px',
            width: '90%',
            maxHeight: '90vh',
            overflow: 'auto',
            boxShadow: '0 40px 120px rgba(0,0,0,0.4), 0 0 0 3px rgba(99, 102, 241, 0.3), 0 0 100px rgba(99, 102, 241, 0.15)',
            border: '2px solid rgba(255, 255, 255, 0.9)',
            position: 'relative'
          }}
          onClick={(e) => e.stopPropagation()}
        >
        {/* Dekoracyjny gradient na górze modalu */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '200px',
          background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.03) 0%, rgba(139, 92, 246, 0.03) 100%)',
          borderRadius: '24px 24px 0 0',
          pointerEvents: 'none',
          zIndex: 0
        }} />
        {/* Header with close button */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: '25px',
          position: 'relative',
          zIndex: 1
        }}>
          <div style={{ flex: 1 }}>
            <motion.h2
              key={step}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              style={{ fontSize: '26px', fontWeight: '700', margin: '0 0 8px 0', color: '#1f2937' }}
            >
              {step === 'details' && '📝 Szczegóły rezerwacji'}
              {step === 'payment' && '💳 Wybierz płatność'}
              {step === 'processing' && '⏳ Przetwarzanie...'}
            </motion.h2>

            {/* Progress bar */}
            <div style={{
              width: '100%',
              height: '10px',
              backgroundColor: 'rgba(99, 102, 241, 0.08)',
              borderRadius: '999px',
              overflow: 'hidden',
              marginBottom: '15px',
              boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.05)',
              position: 'relative'
            }}>
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{
                  type: 'spring',
                  stiffness: 100,
                  damping: 20,
                  mass: 0.5
                }}
                style={{
                  height: '100%',
                  background: 'linear-gradient(90deg, #6366F1 0%, #8B5CF6 50%, #A855F7 100%)',
                  borderRadius: '999px',
                  position: 'relative',
                  overflow: 'hidden',
                  boxShadow: '0 0 20px rgba(99, 102, 241, 0.4)'
                }}
              >
                {/* Shimmer effect */}
                <motion.div
                  animate={{
                    x: ['-200%', '200%']
                  }}
                  transition={{
                    repeat: Infinity,
                    duration: 2,
                    ease: 'linear'
                  }}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'linear-gradient(90deg, transparent 0%, rgba(255, 255, 255, 0.4) 50%, transparent 100%)',
                    width: '50%'
                  }}
                />
              </motion.div>
            </div>

            {/* Step indicators */}
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              {/* Step 1 */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}>
                <motion.div
                  animate={{
                    scale: getStepNumber() >= 1 ? [1, 1.15, 1] : 1,
                    backgroundColor: getStepNumber() >= 1 ? '#6366F1' : '#E5E7EB'
                  }}
                  transition={{
                    scale: { duration: 0.4, times: [0, 0.5, 1] },
                    backgroundColor: { duration: 0.3 }
                  }}
                  style={{
                    width: '28px',
                    height: '28px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '12px',
                    fontWeight: 'bold',
                    color: 'white',
                    boxShadow: getStepNumber() >= 1 ? '0 4px 12px rgba(99, 102, 241, 0.4)' : 'none'
                  }}
                >
                  {getStepNumber() > 1 ? '✓' : '1'}
                </motion.div>
                <motion.span
                  animate={{
                    color: getStepNumber() >= 1 ? '#6366F1' : '#9CA3AF'
                  }}
                  style={{
                    fontSize: '13px',
                    fontWeight: '600'
                  }}
                >
                  Szczegóły
                </motion.span>
              </div>

              <motion.div
                animate={{
                  backgroundColor: getStepNumber() >= 2 ? '#6366F1' : '#E5E7EB',
                  scaleX: getStepNumber() >= 2 ? [0, 1] : 1
                }}
                transition={{ duration: 0.4 }}
                style={{
                  width: '30px',
                  height: '2px',
                  transformOrigin: 'left'
                }}
              />

              {/* Step 2 */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}>
                <motion.div
                  animate={{
                    scale: getStepNumber() >= 2 ? [1, 1.15, 1] : 1,
                    backgroundColor: getStepNumber() >= 2 ? '#6366F1' : '#E5E7EB'
                  }}
                  transition={{
                    scale: { duration: 0.4, times: [0, 0.5, 1] },
                    backgroundColor: { duration: 0.3 }
                  }}
                  style={{
                    width: '28px',
                    height: '28px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '12px',
                    fontWeight: 'bold',
                    color: 'white',
                    boxShadow: getStepNumber() >= 2 ? '0 4px 12px rgba(99, 102, 241, 0.4)' : 'none'
                  }}
                >
                  {getStepNumber() > 2 ? '✓' : '2'}
                </motion.div>
                <motion.span
                  animate={{
                    color: getStepNumber() >= 2 ? '#6366F1' : '#9CA3AF'
                  }}
                  style={{
                    fontSize: '13px',
                    fontWeight: '600'
                  }}
                >
                  Płatność
                </motion.span>
              </div>

              <motion.div
                animate={{
                  backgroundColor: getStepNumber() >= 3 ? '#6366F1' : '#E5E7EB',
                  scaleX: getStepNumber() >= 3 ? [0, 1] : 1
                }}
                transition={{ duration: 0.4 }}
                style={{
                  width: '30px',
                  height: '2px',
                  transformOrigin: 'left'
                }}
              />

              {/* Step 3 */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}>
                <motion.div
                  animate={{
                    scale: getStepNumber() >= 3 ? [1, 1.15, 1] : 1,
                    backgroundColor: getStepNumber() >= 3 ? '#6366F1' : '#E5E7EB'
                  }}
                  transition={{
                    scale: { duration: 0.4, times: [0, 0.5, 1] },
                    backgroundColor: { duration: 0.3 }
                  }}
                  style={{
                    width: '28px',
                    height: '28px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '12px',
                    fontWeight: 'bold',
                    color: 'white',
                    boxShadow: getStepNumber() >= 3 ? '0 4px 12px rgba(99, 102, 241, 0.4)' : 'none'
                  }}
                >
                  {getStepNumber() > 3 ? '✓' : '3'}
                </motion.div>
                <motion.span
                  animate={{
                    color: getStepNumber() >= 3 ? '#6366F1' : '#9CA3AF'
                  }}
                  style={{
                    fontSize: '13px',
                    fontWeight: '600'
                  }}
                >
                  Potwierdzenie
                </motion.span>
              </div>
            </div>
          </div>

          <motion.button
            onClick={onClose}
            disabled={loading}
            whileHover={!loading ? {
              scale: 1.1,
              backgroundColor: '#FEE2E2',
              color: '#DC2626',
              boxShadow: '0 4px 12px rgba(220, 38, 38, 0.2)'
            } : {}}
            whileTap={!loading ? { scale: 0.95 } : {}}
            transition={{ type: 'spring', stiffness: 400, damping: 20 }}
            style={{
              background: '#F3F4F6',
              border: 'none',
              width: '42px',
              height: '42px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '22px',
              cursor: loading ? 'not-allowed' : 'pointer',
              color: '#6B7280',
              marginLeft: '15px',
              fontWeight: '300',
              lineHeight: '1'
            }}
          >
            ×
          </motion.button>
        </div>

        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.3 }}
          style={{
            background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.06) 0%, rgba(139, 92, 246, 0.06) 100%)',
            padding: '18px',
            borderRadius: '16px',
            marginBottom: '20px',
            border: '2px solid rgba(99, 102, 241, 0.15)',
            position: 'relative',
            zIndex: 1
          }}
        >
          <h3 style={{
            fontSize: '20px',
            fontWeight: '700',
            margin: '0 0 6px 0',
            color: '#1f2937',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <span style={{
              fontSize: '16px',
              width: '28px',
              height: '28px',
              background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>🅿️</span>
            {parking.name}
          </h3>
          <p style={{
            fontSize: '14px',
            color: '#6b7280',
            margin: '0 0 12px 0',
            paddingLeft: '36px'
          }}>
            📍 {parking.address}
          </p>
          {/* Parking Type Badge */}
          {parking.type && (
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '4px 10px',
              borderRadius: '6px',
              fontSize: '12px',
              fontWeight: '600',
              marginBottom: '10px',
              background: parking.type === 'covered'
                ? '#EFF6FF'
                : parking.type === 'ev_charging'
                ? '#FFFBEB'
                : '#ECFDF5',
              border: `2px solid ${
                parking.type === 'covered'
                  ? '#3B82F6'
                  : parking.type === 'ev_charging'
                  ? '#F59E0B'
                  : '#10B981'
              }`,
              color: parking.type === 'covered'
                ? '#1E40AF'
                : parking.type === 'ev_charging'
                ? '#92400E'
                : '#065F46'
            }}>
              <span>
                {parking.type === 'covered' ? '☂️' : parking.type === 'ev_charging' ? '⚡' : '☀️'}
              </span>
              <span>
                {parking.type === 'covered'
                  ? 'Zadaszony'
                  : parking.type === 'ev_charging'
                  ? 'Z ładowarką EV'
                  : 'Odkryty'}
              </span>
            </div>
          )}
          <div style={{
            marginTop: '10px',
            padding: '10px 14px',
            background: 'white',
            borderRadius: '10px',
            border: '2px solid rgba(99, 102, 241, 0.2)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <span style={{ fontSize: '18px' }}>💰</span>
            <span style={{
              fontSize: '18px',
              fontWeight: '700',
              background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}>
              {parking.price_per_hour || parking.hourly_rate} zł/godz
            </span>
          </div>
        </motion.div>

        {error && (
          <div style={{
            backgroundColor: '#fee2e2',
            color: '#991b1b',
            padding: '12px',
            borderRadius: '8px',
            marginBottom: '20px',
            fontSize: '14px'
          }}>
            ❌ {error}
          </div>
        )}

        {/* Step 1: Reservation Details */}
        {step === 'details' && (
          <motion.form
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
            onSubmit={handleDetailsSubmit}
          >
          {/* Data i godzina rozpoczęcia */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{
              display: 'block',
              marginBottom: '8px',
              fontWeight: 'bold',
              fontSize: '14px'
            }}>
              Początek rezerwacji *
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <input
                type="date"
                name="startDate"
                value={formData.startDate}
                onChange={handleChange}
                min={today}
                required
                style={{
                  padding: '10px',
                  border: '2px solid #e5e7eb',
                  borderRadius: '8px',
                  fontSize: '14px'
                }}
              />
              <input
                type="time"
                name="startTime"
                value={formData.startTime}
                onChange={handleChange}
                required
                style={{
                  padding: '10px',
                  border: '2px solid #e5e7eb',
                  borderRadius: '8px',
                  fontSize: '14px'
                }}
              />
            </div>
          </div>

          {/* Data i godzina zakończenia */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{
              display: 'block',
              marginBottom: '8px',
              fontWeight: 'bold',
              fontSize: '14px'
            }}>
              Koniec rezerwacji *
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <input
                type="date"
                name="endDate"
                value={formData.endDate}
                onChange={handleChange}
                min={formData.startDate || today}
                required
                style={{
                  padding: '10px',
                  border: '2px solid #e5e7eb',
                  borderRadius: '8px',
                  fontSize: '14px'
                }}
              />
              <input
                type="time"
                name="endTime"
                value={formData.endTime}
                onChange={handleChange}
                required
                style={{
                  padding: '10px',
                  border: '2px solid #e5e7eb',
                  borderRadius: '8px',
                  fontSize: '14px'
                }}
              />
            </div>
          </div>

          {/* Numer rejestracyjny */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{
              display: 'block',
              marginBottom: '8px',
              fontWeight: 'bold',
              fontSize: '14px'
            }}>
              Numer rejestracyjny *
            </label>
            <input
              type="text"
              name="licensePlate"
              value={formData.licensePlate}
              onChange={handleChange}
              required
              placeholder="np. WA 12345"
              style={{
                width: '100%',
                padding: '10px',
                border: '2px solid #e5e7eb',
                borderRadius: '8px',
                fontSize: '14px',
                textTransform: 'uppercase'
              }}
            />
          </div>

          {/* Podsumowanie ceny */}
          {calculatingPrice && (
            <div style={{
              backgroundColor: '#f3f4f6',
              padding: '15px',
              borderRadius: '8px',
              marginBottom: '20px',
              textAlign: 'center',
              color: '#6b7280'
            }}>
              Obliczam cenę...
            </div>
          )}

          {priceCalculation && !calculatingPrice && (
            <div style={{ marginBottom: '20px' }}>
              {/* Najlepsza cena (główna) */}
              <div style={{
                backgroundColor: '#dcfce7',
                padding: '20px',
                borderRadius: '12px',
                marginBottom: '15px',
                border: '2px solid #16a34a'
              }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '5px'
                }}>
                  <span style={{
                    fontSize: '14px',
                    fontWeight: 'bold',
                    color: '#16a34a',
                    textTransform: 'uppercase'
                  }}>
                    ✓ Najlepsza opcja: {priceCalculation.pricingLabel}
                  </span>
                </div>
                <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#16a34a' }}>
                  {priceCalculation.price} zł
                </div>
                <div style={{ fontSize: '13px', color: '#15803d', marginTop: '8px' }}>
                  {priceCalculation.hours.toFixed(1)} godz ({priceCalculation.days.toFixed(1)} dni)
                </div>
              </div>

              {/* Wszystkie opcje cenowe */}
              {priceCalculation.allOptions && priceCalculation.allOptions.length > 1 && (
                <div style={{
                  backgroundColor: '#f9fafb',
                  padding: '15px',
                  borderRadius: '8px',
                  fontSize: '13px'
                }}>
                  <div style={{
                    fontWeight: 'bold',
                    marginBottom: '10px',
                    color: '#374151'
                  }}>
                    Porównanie taryf:
                  </div>
                  {priceCalculation.allOptions.map((option, index) => (
                    <div
                      key={index}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        padding: '8px 0',
                        borderBottom: index < priceCalculation.allOptions.length - 1 ? '1px solid #e5e7eb' : 'none'
                      }}
                    >
                      <span style={{ color: '#6b7280' }}>{option.label}:</span>
                      <span style={{
                        fontWeight: option.type === priceCalculation.pricingType ? 'bold' : 'normal',
                        color: option.type === priceCalculation.pricingType ? '#16a34a' : '#374151'
                      }}>
                        {option.price} zł
                        {option.type === priceCalculation.pricingType && ' ✓'}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Przyciski */}
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                flex: 1,
                padding: '12px',
                border: '2px solid #e5e7eb',
                borderRadius: '8px',
                fontSize: '16px',
                fontWeight: 'bold',
                cursor: 'pointer',
                backgroundColor: 'white',
                color: '#6b7280'
              }}
            >
              Anuluj
            </button>
            <button
              type="submit"
              disabled={loading || !priceCalculation}
              style={{
                flex: 1,
                padding: '12px',
                border: 'none',
                borderRadius: '8px',
                fontSize: '16px',
                fontWeight: 'bold',
                cursor: loading || !priceCalculation ? 'not-allowed' : 'pointer',
                backgroundColor: loading || !priceCalculation ? '#9ca3af' : '#6366F1',
                color: 'white'
              }}
            >
              {loading ? 'Ładowanie...' : 'Dalej: Wybierz płatność →'}
            </button>
          </div>
        </motion.form>
        )}

        {/* Step 2: Payment Method Selection */}
        {step === 'payment' && priceCalculation && (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
          >
          <div>
            <PaymentMethodSelector
              amount={priceCalculation.price}
              selectedMethod={paymentMethod}
              onSelect={setPaymentMethod}
            />

            {/* Payment Buttons */}
            <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
              <button
                type="button"
                onClick={() => {
                  setStep('details');
                  setError(null);
                }}
                style={{
                  flex: 1,
                  padding: '12px',
                  border: '2px solid #e5e7eb',
                  borderRadius: '8px',
                  fontSize: '16px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  backgroundColor: 'white',
                  color: '#6b7280'
                }}
              >
                ← Wróć
              </button>
              <button
                type="button"
                onClick={handlePayment}
                disabled={!paymentMethod || loading}
                style={{
                  flex: 2,
                  padding: '12px',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '16px',
                  fontWeight: 'bold',
                  cursor: !paymentMethod || loading ? 'not-allowed' : 'pointer',
                  backgroundColor: !paymentMethod || loading ? '#9ca3af' : '#10B981',
                  color: 'white'
                }}
              >
                {loading ? 'Przetwarzanie...' : 'Zapłać i zarezerwuj →'}
              </button>
            </div>
          </div>
          </motion.div>
        )}

        {/* Step 3: Processing Payment */}
        {step === 'processing' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
          >
            {/* Gateway Progress Indicator */}
            {gatewayProgress && paymentMethod === 'gateway' && (
              <div style={{
                backgroundColor: '#dbeafe',
                border: '2px solid #3b82f6',
                borderRadius: '12px',
                padding: '20px',
                marginBottom: '20px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '15px' }}>
                  <div style={{
                    width: '50px',
                    height: '50px',
                    borderRadius: '50%',
                    border: '4px solid #3b82f6',
                    borderTopColor: 'transparent',
                    animation: 'spin 1s linear infinite'
                  }}></div>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: '18px', fontWeight: 'bold', color: '#1e40af', margin: '0 0 5px 0' }}>
                      {gatewayProgress.stage === 'optimize' && '⚡ Optymalizacja transakcji...'}
                      {gatewayProgress.stage === 'prepare' && '🔧 Przygotowanie transakcji...'}
                      {gatewayProgress.stage === 'sign' && '✍️ Podpisz transakcję w portfelu...'}
                      {gatewayProgress.stage === 'send' && '📤 Wysyłanie przez Gateway...'}
                      {gatewayProgress.stage === 'confirm' && '⏳ Potwierdzanie na blockchainie...'}
                      {gatewayProgress.stage === 'complete' && '✅ Transakcja ukończona!'}
                      {gatewayProgress.stage === 'error' && '❌ Błąd transakcji'}
                    </p>
                    <p style={{ fontSize: '14px', color: '#60a5fa', margin: 0 }}>
                      {gatewayProgress.message}
                    </p>
                  </div>
                </div>

                {/* Gateway Benefits Reminder */}
                {(gatewayProgress.stage === 'send' || gatewayProgress.stage === 'confirm') && (
                  <div style={{
                    backgroundColor: 'white',
                    borderRadius: '8px',
                    padding: '12px',
                    fontSize: '12px',
                    color: '#1e40af'
                  }}>
                    <strong>⚡ Gateway wysyła transakcję przez RPC i Jito jednocześnie!</strong>
                    <br />
                    Jeśli RPC zakończy się sukcesem, Jito tip zostanie automatycznie zwrócony.
                  </div>
                )}
              </div>
            )}

            {/* Standard Solana/Card Processing */}
            {paymentMethod !== 'gateway' && loading && (
              <div style={{
                textAlign: 'center',
                padding: '40px',
                backgroundColor: '#f3f4f6',
                borderRadius: '12px'
              }}>
                <div style={{
                  width: '60px',
                  height: '60px',
                  border: '4px solid #6366F1',
                  borderTopColor: 'transparent',
                  borderRadius: '50%',
                  margin: '0 auto 20px',
                  animation: 'spin 1s linear infinite'
                }}></div>
                <p style={{ fontSize: '18px', fontWeight: 'bold', color: '#374151' }}>
                  Przetwarzanie płatności...
                </p>
                <p style={{ fontSize: '14px', color: '#6b7280' }}>
                  Proszę czekać, nie zamykaj tego okna
                </p>
              </div>
            )}

            {/* Success Message */}
            {txSignature && !loading && (
              <div style={{
                backgroundColor: '#d1fae5',
                border: '2px solid #10b981',
                borderRadius: '12px',
                padding: '20px',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '48px', marginBottom: '15px' }}>✅</div>
                <h3 style={{ fontSize: '24px', fontWeight: 'bold', color: '#065f46', margin: '0 0 10px 0' }}>
                  Płatność zakończona sukcesem!
                </h3>
                <p style={{ fontSize: '16px', color: '#047857', marginBottom: '15px' }}>
                  Twoja rezerwacja została potwierdzona
                </p>
                {paymentMethod === 'gateway' && (
                  <div style={{
                    backgroundColor: 'white',
                    borderRadius: '8px',
                    padding: '15px',
                    marginBottom: '15px'
                  }}>
                    <p style={{ fontSize: '14px', color: '#065f46', marginBottom: '8px' }}>
                      <strong>⚡ Płatność przez Sanctum Gateway</strong>
                    </p>
                    <p style={{ fontSize: '12px', color: '#047857', margin: 0 }}>
                      Transakcja: {txSignature.slice(0, 16)}...
                    </p>
                  </div>
                )}
                <p style={{ fontSize: '12px', color: '#6b7280' }}>
                  To okno zamknie się automatycznie...
                </p>
              </div>
            )}
          </motion.div>
        )}

        {/* CSS Animation */}
        <style>{`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}</style>
      </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

export default ReservationModal;