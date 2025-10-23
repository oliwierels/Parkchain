// frontend/src/components/ReservationModal.jsx

import { useState, useEffect } from 'react';
import { reservationAPI } from '../services/api';

function ReservationModal({ parking, onClose, onSuccess }) {
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const start = new Date(`${formData.startDate}T${formData.startTime}`);
      const end = new Date(`${formData.endDate}T${formData.endTime}`);

      if (end <= start) {
        setError('Data zakończenia musi być późniejsza niż data rozpoczęcia');
        setLoading(false);
        return;
      }

      if (!priceCalculation) {
        setError('Nie udało się obliczyć ceny');
        setLoading(false);
        return;
      }

      const reservationData = {
        lot_id: parking.id,
        start_time: start.toISOString(),
        end_time: end.toISOString(),
        license_plate: formData.licensePlate,
        pricing_type: priceCalculation.pricingType
      };

      console.log('🔄 Wysyłam rezerwację:', reservationData);

      const result = await reservationAPI.createReservation(reservationData);
      console.log('✅ Rezerwacja utworzona:', result);

      onSuccess();
      onClose();
    } catch (err) {
      console.error('❌ Błąd rezerwacji:', err);
      console.error('❌ Response:', err.response?.data);
      console.error('❌ Status:', err.response?.status);
      console.error('❌ Message:', err.message);
      setError(err.response?.data?.error || err.message || 'Nie udało się utworzyć rezerwacji');
    } finally {
      setLoading(false);
    }
  };

  // Dzisiejsza data w formacie YYYY-MM-DD
  const today = new Date().toISOString().split('T')[0];

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 9999
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '15px',
        padding: '30px',
        maxWidth: '500px',
        width: '90%',
        maxHeight: '90vh',
        overflow: 'auto',
        boxShadow: '0 10px 25px rgba(0,0,0,0.2)'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '20px'
        }}>
          <h2 style={{ fontSize: '24px', fontWeight: 'bold', margin: 0 }}>
            Rezerwacja parkingu
          </h2>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '24px',
              cursor: 'pointer',
              color: '#6b7280'
            }}
          >
            ×
          </button>
        </div>

        <div style={{
          backgroundColor: '#f3f4f6',
          padding: '15px',
          borderRadius: '8px',
          marginBottom: '20px'
        }}>
          <h3 style={{ fontSize: '18px', fontWeight: 'bold', margin: '0 0 5px 0' }}>
            {parking.name}
          </h3>
          <p style={{ fontSize: '14px', color: '#6b7280', margin: '0 0 10px 0' }}>
            {parking.address}
          </p>
          <p style={{ fontSize: '16px', fontWeight: 'bold', color: '#6366F1', margin: 0 }}>
            {parking.price_per_hour || parking.hourly_rate} zł/godz
          </p>
        </div>

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

        <form onSubmit={handleSubmit}>
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
              {loading ? 'Rezerwuję...' : 'Zarezerwuj'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ReservationModal;