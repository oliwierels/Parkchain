// frontend/src/components/AddParkingModal.jsx

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { parkingAPI } from '../services/api';

function AddParkingModal({ latitude, longitude, onClose, onSuccess }) {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    city: '',
    price_per_hour: '',
    price_per_day: '',
    price_per_week: '',
    price_per_month: '',
    total_spots: '',
    latitude: latitude,
    longitude: longitude,
    type: 'outdoor' // covered, outdoor, ev_charging
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [stage, setStage] = useState('form'); // 'form', 'submitting', 'success'

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setStage('submitting');

    try {
      // Walidacja
      if (!formData.name || !formData.address || !formData.price_per_hour || !formData.total_spots) {
        throw new Error(t('validation.fillAllFields'));
      }

      // Przygotuj dane
      const parkingData = {
        name: formData.name,
        address: formData.address,
        city: formData.city || null,
        price_per_hour: parseFloat(formData.price_per_hour),
        price_per_day: formData.price_per_day ? parseFloat(formData.price_per_day) : null,
        price_per_week: formData.price_per_week ? parseFloat(formData.price_per_week) : null,
        price_per_month: formData.price_per_month ? parseFloat(formData.price_per_month) : null,
        total_spots: parseInt(formData.total_spots),
        latitude: latitude,
        longitude: longitude,
        type: formData.type
      };

      console.log('📝 Dodawanie parkingu:', parkingData);

      // Użyj nowszego endpointu /api/parking-lots który obsługuje więcej pól
      const response = await fetch('http://localhost:3000/api/parking-lots', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(parkingData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || t('errors.addParkingError'));
      }

      // Success!
      setStage('success');

      // Wait for animation then callback
      setTimeout(() => {
        onSuccess();
      }, 1500);
    } catch (err) {
      console.error(t('messages.addingParkingError'), err);
      setError(err.response?.data?.error || err.message || t('errors.addParkingError'));
      setStage('form');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 2000,
          padding: '20px'
        }}
        onClick={stage !== 'submitting' ? onClose : undefined}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 50 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 50 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          style={{
            backgroundColor: 'white',
            borderRadius: '16px',
            padding: '24px',
            maxWidth: '500px',
            width: '100%',
            maxHeight: '90vh',
            overflow: 'auto',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.3)'
          }}
          onClick={(e) => e.stopPropagation()}
        >
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '20px'
        }}>
          <h2 style={{
            margin: 0,
            fontSize: '20px',
            fontWeight: 'bold',
            color: '#1F2937'
          }}>
            {t('modals.addNewParking')}
          </h2>
          <button
            onClick={onClose}
            style={{
              backgroundColor: 'transparent',
              border: 'none',
              fontSize: '24px',
              cursor: 'pointer',
              color: '#6B7280'
            }}
          >
            ✕
          </button>
        </div>

        {error && (
          <div style={{
            backgroundColor: '#FEE2E2',
            color: '#991B1B',
            padding: '12px',
            borderRadius: '8px',
            marginBottom: '16px',
            fontSize: '14px'
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Lokalizacja (tylko do odczytu) */}
          <div style={{
            marginBottom: '16px',
            padding: '12px',
            backgroundColor: '#F3F4F6',
            borderRadius: '8px'
          }}>
            <div style={{
              fontSize: '12px',
              fontWeight: 'bold',
              color: '#6B7280',
              marginBottom: '4px'
            }}>
              {t('modals.locationLabel')}
            </div>
            <div style={{ fontSize: '13px', color: '#1F2937' }}>
              Szerokość: {latitude.toFixed(6)}
            </div>
            <div style={{ fontSize: '13px', color: '#1F2937' }}>
              Długość: {longitude.toFixed(6)}
            </div>
          </div>

          {/* Nazwa parkingu */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: 'bold',
              color: '#374151',
              marginBottom: '6px'
            }}>
              Nazwa parkingu <span style={{ color: '#EF4444' }}>*</span>
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              placeholder="np. Parking Centrum"
              style={{
                width: '100%',
                padding: '10px',
                border: '1px solid #D1D5DB',
                borderRadius: '6px',
                fontSize: '14px',
                boxSizing: 'border-box'
              }}
            />
          </div>

          {/* Adres */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: 'bold',
              color: '#374151',
              marginBottom: '6px'
            }}>
              Adres <span style={{ color: '#EF4444' }}>*</span>
            </label>
            <input
              type="text"
              name="address"
              value={formData.address}
              onChange={handleChange}
              required
              placeholder="np. ul. Marszałkowska 1"
              style={{
                width: '100%',
                padding: '10px',
                border: '1px solid #D1D5DB',
                borderRadius: '6px',
                fontSize: '14px',
                boxSizing: 'border-box'
              }}
            />
          </div>

          {/* Miasto */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: 'bold',
              color: '#374151',
              marginBottom: '6px'
            }}>
              Miasto
            </label>
            <input
              type="text"
              name="city"
              value={formData.city}
              onChange={handleChange}
              placeholder="np. Warszawa"
              style={{
                width: '100%',
                padding: '10px',
                border: '1px solid #D1D5DB',
                borderRadius: '6px',
                fontSize: '14px',
                boxSizing: 'border-box'
              }}
            />
          </div>

          {/* Typ parkingu */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: 'bold',
              color: '#374151',
              marginBottom: '8px'
            }}>
              Typ parkingu <span style={{ color: '#EF4444' }}>*</span>
            </label>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '8px'
            }}>
              {/* Zadaszony */}
              <button
                type="button"
                onClick={() => setFormData({ ...formData, type: 'covered' })}
                style={{
                  padding: '12px 8px',
                  border: formData.type === 'covered' ? '2px solid #3B82F6' : '2px solid #D1D5DB',
                  borderRadius: '8px',
                  backgroundColor: formData.type === 'covered' ? '#EFF6FF' : 'white',
                  color: formData.type === 'covered' ? '#3B82F6' : '#6B7280',
                  fontSize: '13px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                ☂️ Zadaszony
              </button>

              {/* Odkryty */}
              <button
                type="button"
                onClick={() => setFormData({ ...formData, type: 'outdoor' })}
                style={{
                  padding: '12px 8px',
                  border: formData.type === 'outdoor' ? '2px solid #10B981' : '2px solid #D1D5DB',
                  borderRadius: '8px',
                  backgroundColor: formData.type === 'outdoor' ? '#ECFDF5' : 'white',
                  color: formData.type === 'outdoor' ? '#10B981' : '#6B7280',
                  fontSize: '13px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                ☀️ Odkryty
              </button>

              {/* Z ładowarką */}
              <button
                type="button"
                onClick={() => setFormData({ ...formData, type: 'ev_charging' })}
                style={{
                  padding: '12px 8px',
                  border: formData.type === 'ev_charging' ? '2px solid #F59E0B' : '2px solid #D1D5DB',
                  borderRadius: '8px',
                  backgroundColor: formData.type === 'ev_charging' ? '#FFFBEB' : 'white',
                  color: formData.type === 'ev_charging' ? '#F59E0B' : '#6B7280',
                  fontSize: '13px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                ⚡ Ładowarka EV
              </button>
            </div>
          </div>

          {/* Liczba miejsc */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: 'bold',
              color: '#374151',
              marginBottom: '6px'
            }}>
              Liczba miejsc parkingowych <span style={{ color: '#EF4444' }}>*</span>
            </label>
            <input
              type="number"
              name="total_spots"
              value={formData.total_spots}
              onChange={handleChange}
              required
              min="1"
              placeholder="np. 50"
              style={{
                width: '100%',
                padding: '10px',
                border: '1px solid #D1D5DB',
                borderRadius: '6px',
                fontSize: '14px',
                boxSizing: 'border-box'
              }}
            />
          </div>

          {/* Ceny */}
          <div style={{
            marginBottom: '16px',
            padding: '16px',
            backgroundColor: '#F9FAFB',
            borderRadius: '8px',
            border: '1px solid #E5E7EB'
          }}>
            <div style={{
              fontSize: '14px',
              fontWeight: 'bold',
              color: '#374151',
              marginBottom: '12px'
            }}>
              💰 Cennik
            </div>

            {/* Cena za godzinę */}
            <div style={{ marginBottom: '12px' }}>
              <label style={{
                display: 'block',
                fontSize: '13px',
                fontWeight: '600',
                color: '#4B5563',
                marginBottom: '4px'
              }}>
                Cena za godzinę (zł) <span style={{ color: '#EF4444' }}>*</span>
              </label>
              <input
                type="number"
                name="price_per_hour"
                value={formData.price_per_hour}
                onChange={handleChange}
                required
                min="0"
                step="0.01"
                placeholder="np. 5.00"
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #D1D5DB',
                  borderRadius: '6px',
                  fontSize: '14px',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            {/* Cena za dzień */}
            <div style={{ marginBottom: '12px' }}>
              <label style={{
                display: 'block',
                fontSize: '13px',
                fontWeight: '600',
                color: '#4B5563',
                marginBottom: '4px'
              }}>
                Cena za dzień (zł)
              </label>
              <input
                type="number"
                name="price_per_day"
                value={formData.price_per_day}
                onChange={handleChange}
                min="0"
                step="0.01"
                placeholder="np. 40.00"
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #D1D5DB',
                  borderRadius: '6px',
                  fontSize: '14px',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            {/* Cena za tydzień */}
            <div style={{ marginBottom: '12px' }}>
              <label style={{
                display: 'block',
                fontSize: '13px',
                fontWeight: '600',
                color: '#4B5563',
                marginBottom: '4px'
              }}>
                Cena za tydzień (zł)
              </label>
              <input
                type="number"
                name="price_per_week"
                value={formData.price_per_week}
                onChange={handleChange}
                min="0"
                step="0.01"
                placeholder="np. 200.00"
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #D1D5DB',
                  borderRadius: '6px',
                  fontSize: '14px',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            {/* Cena za miesiąc */}
            <div>
              <label style={{
                display: 'block',
                fontSize: '13px',
                fontWeight: '600',
                color: '#4B5563',
                marginBottom: '4px'
              }}>
                Cena za miesiąc (zł)
              </label>
              <input
                type="number"
                name="price_per_month"
                value={formData.price_per_month}
                onChange={handleChange}
                min="0"
                step="0.01"
                placeholder="np. 600.00"
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #D1D5DB',
                  borderRadius: '6px',
                  fontSize: '14px',
                  boxSizing: 'border-box'
                }}
              />
            </div>
          </div>

          {/* Przyciski */}
          <div style={{
            display: 'flex',
            gap: '12px',
            marginTop: '20px'
          }}>
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              style={{
                flex: 1,
                padding: '12px',
                border: '1px solid #D1D5DB',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: 'bold',
                color: '#374151',
                backgroundColor: 'white',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.5 : 1
              }}
            >
              {t('common.cancel')}
            </button>
            <button
              type="submit"
              disabled={loading}
              style={{
                flex: 1,
                padding: '12px',
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: 'bold',
                color: 'white',
                backgroundColor: loading ? '#9CA3AF' : '#6366F1',
                cursor: loading ? 'not-allowed' : 'pointer'
              }}
            >
              {loading ? t('common.loading') : t('parking.addParking')}
            </button>
          </div>
        </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

export default AddParkingModal;
