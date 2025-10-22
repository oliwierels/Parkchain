// frontend/src/components/AddParkingModal.jsx

import { useState } from 'react';
import { parkingAPI } from '../services/api';

function AddParkingModal({ latitude, longitude, onClose, onSuccess }) {
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
    longitude: longitude
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

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

    try {
      // Walidacja
      if (!formData.name || !formData.address || !formData.price_per_hour || !formData.total_spots) {
        throw new Error('Wypełnij wszystkie wymagane pola');
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
        longitude: longitude
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
        throw new Error(errorData.error || 'Nie udało się dodać parkingu');
      }

      alert('Parking dodany pomyślnie!');
      onSuccess();
    } catch (err) {
      console.error('❌ Błąd przy dodawaniu parkingu:', err);
      setError(err.response?.data?.error || err.message || 'Nie udało się dodać parkingu');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
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
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '12px',
        padding: '24px',
        maxWidth: '500px',
        width: '100%',
        maxHeight: '90vh',
        overflow: 'auto',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.3)'
      }}>
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
            Dodaj nowy parking
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
              📍 Lokalizacja
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
              Anuluj
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
              {loading ? 'Dodawanie...' : 'Dodaj parking'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AddParkingModal;
