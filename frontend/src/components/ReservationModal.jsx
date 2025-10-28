// frontend/src/components/ReservationModal.jsx

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { Transaction, SystemProgram, LAMPORTS_PER_SOL, PublicKey } from '@solana/web3.js';
import { reservationAPI } from '../services/api';
import gatewayService from '../services/gatewayService';
import PaymentMethodSelector from './PaymentMethodSelector';
import { motion, AnimatePresence } from 'framer-motion';

function ReservationModal({ parking, onClose, onSuccess }) {
  const { t } = useTranslation();
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
          label: t('reservations.modal.hourlyRate'),
          price: parseFloat((hours * hourlyRate).toFixed(2))
        });
      }

      // Opcja 2: Cena dzienna (jeśli >= 1 dzień)
      if (parking.price_per_day && days >= 1) {
        const fullDays = Math.ceil(days);
        allOptions.push({
          type: 'daily',
          label: t('reservations.modal.dailyRate'),
          price: parseFloat((fullDays * parking.price_per_day).toFixed(2))
        });
      }

      // Opcja 3: Cena tygodniowa (jeśli >= 1 tydzień)
      if (parking.price_per_week && weeks >= 1) {
        const fullWeeks = Math.ceil(weeks);
        allOptions.push({
          type: 'weekly',
          label: t('reservations.modal.weeklyRate'),
          price: parseFloat((fullWeeks * parking.price_per_week).toFixed(2))
        });
      }

      // Opcja 4: Cena miesięczna (jeśli >= 1 miesiąc)
      if (parking.price_per_month && months >= 1) {
        const fullMonths = Math.ceil(months);
        allOptions.push({
          type: 'monthly',
          label: t('reservations.modal.monthlyRate'),
          price: parseFloat((fullMonths * parking.price_per_month).toFixed(2))
        });
      }

      // Znajdź najtańszą opcję
      if (allOptions.length === 0) {
        console.error(t('messages.noPricingOptions'));
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

      setPriceCalculation(calculation);
    } catch (err) {
      console.error(t('messages.pricingCalculationError'), err);
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
      setError(t('messages.endDateMustBeAfterStart'));
      return;
    }

    if (!priceCalculation) {
      setError(t('messages.pricingCalculationFailed'));
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

    // Validate wallet connection for Solana payments only
    if ((paymentMethod === 'gateway' || paymentMethod === 'solana') && !wallet.connected) {
      setError('Połącz portfel Solana aby użyć tej metody płatności');
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

      console.log('💳 Wybrana metoda płatności:', paymentMethod);

      if (paymentMethod === 'gateway') {
        paymentResult = await processGatewayPayment();
      } else if (paymentMethod === 'solana') {
        paymentResult = await processStandardSolanaPayment();
      } else if (paymentMethod === 'card') {
        console.log('💳 Przetwarzanie płatności kartą (bez Solany)...');
        paymentResult = await processCreditCardPayment();
      } else if (paymentMethod === 'later') {
        console.log('🕐 Płatność później (bez Solany)...');
        paymentResult = { method: 'later', paid: false };
      } else {
        throw new Error(`Nieznana metoda płatności: ${paymentMethod}`);
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

    // Validate wallet is connected
    if (!wallet.connected || !wallet.publicKey) {
      throw new Error('Portfel Solana nie jest połączony. Połącz portfel aby użyć Gateway.');
    }

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

    // Validate wallet is connected
    if (!wallet.connected || !wallet.publicKey) {
      throw new Error('Portfel Solana nie jest połączony. Połącz portfel aby użyć płatności Solana.');
    }

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
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 9999
        }}
        onClick={onClose}
      >
        <motion.div
          initial={{
            scale: 0.95,
            opacity: 0,
            y: 20
          }}
          animate={{
            scale: 1,
            opacity: 1,
            y: 0
          }}
          exit={{
            scale: 0.95,
            opacity: 0,
            y: 20
          }}
          transition={{
            duration: 0.2,
            ease: [0.4, 0, 0.2, 1]
          }}
          style={{
            backgroundColor: 'white',
            borderRadius: '16px',
            padding: '24px',
            maxWidth: step === 'payment' ? '900px' : '480px',
            width: '90%',
            maxHeight: '90vh',
            overflow: 'auto',
            boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
            border: 'none',
            position: 'relative'
          }}
          onClick={(e) => e.stopPropagation()}
        >
        {/* Header with close button */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '20px'
        }}>
          <div style={{ flex: 1 }}>
            <motion.h2
              key={step}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              style={{ fontSize: '18px', fontWeight: '600', margin: '0', color: '#111827', letterSpacing: '-0.3px' }}
            >
              {step === 'details' && t('reservations.modal.title')}
              {step === 'payment' && t('reservations.modal.selectPayment')}
              {step === 'processing' && t('reservations.modal.processing')}
            </motion.h2>
          </div>

          <motion.button
            onClick={onClose}
            disabled={loading}
            whileHover={!loading ? {
              backgroundColor: '#F3F4F6'
            } : {}}
            whileTap={!loading ? { scale: 0.95 } : {}}
            transition={{ duration: 0.2 }}
            style={{
              background: 'transparent',
              border: 'none',
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '20px',
              cursor: loading ? 'not-allowed' : 'pointer',
              color: '#9CA3AF',
              marginLeft: '12px',
              fontWeight: '300',
              lineHeight: '1'
            }}
          >
            ×
          </motion.button>
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.2 }}
          style={{
            background: '#FAFAFA',
            padding: '14px',
            borderRadius: '10px',
            marginBottom: '18px',
            border: '1px solid #F0F0F0'
          }}
        >
          <h3 style={{
            fontSize: '15px',
            fontWeight: '600',
            margin: '0 0 4px 0',
            color: '#111827',
            letterSpacing: '-0.2px'
          }}>
            {parking.name}
          </h3>
          <p style={{
            fontSize: '12px',
            color: '#6B7280',
            margin: '0 0 10px 0'
          }}>
            {parking.address}
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
              fontWeight: '500',
              marginBottom: '10px',
              background: parking.type === 'covered'
                ? '#EFF6FF'
                : parking.type === 'ev_charging'
                ? '#FEF3C7'
                : '#F0FDF4',
              color: parking.type === 'covered'
                ? '#1E40AF'
                : parking.type === 'ev_charging'
                ? '#92400E'
                : '#065F46'
            }}>
              <span style={{ fontSize: '13px' }}>
                {parking.type === 'covered' ? '☂️' : parking.type === 'ev_charging' ? '⚡' : '☀️'}
              </span>
              <span>
                {parking.type === 'covered'
                  ? t('parking.coveredType')
                  : parking.type === 'ev_charging'
                  ? t('parking.evChargingType')
                  : t('parking.openType')}
              </span>
            </div>
          )}
          <div style={{
            marginTop: '10px',
            padding: '10px 14px',
            background: 'white',
            borderRadius: '8px',
            border: '1px solid #E5E7EB',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <span style={{
              fontSize: '13px',
              color: '#6B7280',
              fontWeight: '500'
            }}>
              {t('reservations.modal.price')}
            </span>
            <span style={{
              fontSize: '16px',
              fontWeight: '600',
              color: '#111827'
            }}>
              {parking.price_per_hour || parking.hourly_rate} zł/godz
            </span>
          </div>
        </motion.div>

        {error && (
          <div style={{
            backgroundColor: '#FEF2F2',
            color: '#991B1B',
            padding: '12px 14px',
            borderRadius: '10px',
            marginBottom: '16px',
            fontSize: '13px',
            border: '1px solid #FCA5A5',
            fontWeight: '500'
          }}>
            {error}
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
          <div style={{ marginBottom: '18px' }}>
            <label style={{
              display: 'block',
              marginBottom: '8px',
              fontWeight: '500',
              fontSize: '13px',
              color: '#374151'
            }}>
              {t('reservations.modal.startDate')}
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
                  padding: '10px 12px',
                  border: '1px solid #E5E7EB',
                  borderRadius: '8px',
                  fontSize: '14px',
                  color: '#111827',
                  backgroundColor: 'white',
                  transition: 'border 0.15s ease'
                }}
                onFocus={(e) => e.currentTarget.style.border = '1px solid #111827'}
                onBlur={(e) => e.currentTarget.style.border = '1px solid #E5E7EB'}
              />
              <input
                type="time"
                name="startTime"
                value={formData.startTime}
                onChange={handleChange}
                required
                style={{
                  padding: '10px 12px',
                  border: '1px solid #E5E7EB',
                  borderRadius: '8px',
                  fontSize: '14px',
                  color: '#111827',
                  backgroundColor: 'white',
                  transition: 'border 0.15s ease'
                }}
                onFocus={(e) => e.currentTarget.style.border = '1px solid #111827'}
                onBlur={(e) => e.currentTarget.style.border = '1px solid #E5E7EB'}
              />
            </div>
          </div>

          {/* Data i godzina zakończenia */}
          <div style={{ marginBottom: '18px' }}>
            <label style={{
              display: 'block',
              marginBottom: '8px',
              fontWeight: '500',
              fontSize: '13px',
              color: '#374151'
            }}>
              {t('reservations.modal.endDate')}
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
                  padding: '10px 12px',
                  border: '1px solid #E5E7EB',
                  borderRadius: '8px',
                  fontSize: '14px',
                  color: '#111827',
                  backgroundColor: 'white',
                  transition: 'border 0.15s ease'
                }}
                onFocus={(e) => e.currentTarget.style.border = '1px solid #111827'}
                onBlur={(e) => e.currentTarget.style.border = '1px solid #E5E7EB'}
              />
              <input
                type="time"
                name="endTime"
                value={formData.endTime}
                onChange={handleChange}
                required
                style={{
                  padding: '10px 12px',
                  border: '1px solid #E5E7EB',
                  borderRadius: '8px',
                  fontSize: '14px',
                  color: '#111827',
                  backgroundColor: 'white',
                  transition: 'border 0.15s ease'
                }}
                onFocus={(e) => e.currentTarget.style.border = '1px solid #111827'}
                onBlur={(e) => e.currentTarget.style.border = '1px solid #E5E7EB'}
              />
            </div>
          </div>

          {/* Numer rejestracyjny */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{
              display: 'block',
              marginBottom: '8px',
              fontWeight: '500',
              fontSize: '13px',
              color: '#374151'
            }}>
              {t('reservations.modal.licensePlate')}
            </label>
            <input
              type="text"
              name="licensePlate"
              value={formData.licensePlate}
              onChange={handleChange}
              required
              placeholder={t('reservations.modal.licensePlatePlaceholder')}
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid #E5E7EB',
                borderRadius: '10px',
                fontSize: '14px',
                color: '#111827',
                textTransform: 'uppercase',
                backgroundColor: 'white',
                transition: 'border 0.2s ease'
              }}
              onFocus={(e) => e.currentTarget.style.border = '1px solid #111827'}
              onBlur={(e) => e.currentTarget.style.border = '1px solid #E5E7EB'}
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
              {/* Cena */}
              <div style={{
                backgroundColor: '#F0FDF4',
                padding: '16px',
                borderRadius: '12px',
                marginBottom: '12px',
                border: '1px solid #10B981'
              }}>
                <div style={{
                  fontSize: '13px',
                  fontWeight: '500',
                  color: '#065F46',
                  marginBottom: '8px'
                }}>
                  {priceCalculation.pricingLabel}
                </div>
                <div style={{
                  fontSize: '28px',
                  fontWeight: '600',
                  color: '#111827',
                  letterSpacing: '-0.5px'
                }}>
                  {priceCalculation.price} zł
                </div>
                <div style={{ fontSize: '12px', color: '#6B7280', marginTop: '6px' }}>
                  {priceCalculation.hours.toFixed(1)} {t('reservations.modal.hours')} • {priceCalculation.days.toFixed(1)} {t('reservations.modal.days')}
                </div>
              </div>

              {/* Wszystkie opcje cenowe */}
              {priceCalculation.allOptions && priceCalculation.allOptions.length > 1 && (
                <div style={{
                  backgroundColor: '#F9FAFB',
                  padding: '12px',
                  borderRadius: '10px',
                  fontSize: '12px',
                  border: '1px solid #E5E7EB'
                }}>
                  <div style={{
                    fontWeight: '500',
                    marginBottom: '8px',
                    color: '#6B7280'
                  }}>
                    {t('reservations.modal.otherOptions')}:
                  </div>
                  {priceCalculation.allOptions.map((option, index) => (
                    option.type !== priceCalculation.pricingType && (
                      <div
                        key={index}
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          padding: '6px 0',
                          color: '#9CA3AF'
                        }}
                      >
                        <span>{option.label}</span>
                        <span>{option.price} zł</span>
                      </div>
                    )
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
                border: '1px solid #E5E7EB',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer',
                backgroundColor: 'white',
                color: '#6B7280',
                transition: 'all 0.15s ease',
                letterSpacing: '-0.2px'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.background = '#FAFAFA';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.background = 'white';
              }}
            >
              {t('common.cancel')}
            </button>
            <button
              type="submit"
              disabled={loading || !priceCalculation}
              style={{
                flex: 2,
                padding: '12px',
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '600',
                cursor: loading || !priceCalculation ? 'not-allowed' : 'pointer',
                backgroundColor: loading || !priceCalculation ? '#D1D5DB' : '#111827',
                color: 'white',
                transition: 'all 0.15s ease',
                letterSpacing: '-0.2px',
                opacity: loading || !priceCalculation ? 0.5 : 1
              }}
              onMouseOver={(e) => {
                if (!loading && priceCalculation) {
                  e.currentTarget.style.background = '#1F2937';
                }
              }}
              onMouseOut={(e) => {
                if (!loading && priceCalculation) {
                  e.currentTarget.style.background = '#111827';
                }
              }}
            >
              {loading ? t('common.loading') : t('common.next')}
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
                  border: '1px solid #E5E7EB',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  backgroundColor: 'white',
                  color: '#6B7280',
                  transition: 'all 0.15s ease',
                  letterSpacing: '-0.2px'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.background = '#FAFAFA';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.background = 'white';
                }}
              >
                {t('common.back')}
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
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: !paymentMethod || loading ? 'not-allowed' : 'pointer',
                  backgroundColor: !paymentMethod || loading ? '#D1D5DB' : '#111827',
                  color: 'white',
                  transition: 'all 0.15s ease',
                  letterSpacing: '-0.2px',
                  opacity: !paymentMethod || loading ? 0.5 : 1
                }}
                onMouseOver={(e) => {
                  if (paymentMethod && !loading) {
                    e.currentTarget.style.background = '#1F2937';
                  }
                }}
                onMouseOut={(e) => {
                  if (paymentMethod && !loading) {
                    e.currentTarget.style.background = '#111827';
                  }
                }}
              >
                {loading ? t('reservations.modal.processing') : t('common.confirm')}
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