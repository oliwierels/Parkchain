// frontend/src/pages/AddParkingPage.jsx

import { useState } from 'react';
import { parkingAPI } from '../services/api';

function AddParkingPage() {
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    city: 'Warszawa',
    price_per_hour: '',
    total_spots: '',
    description: ''
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const dataToSend = {
        ...formData,
        price_per_hour: parseFloat(formData.price_per_hour),
        total_spots: parseInt(formData.total_spots)
      };

      console.log('Wysyłam dane:', dataToSend);

      await parkingAPI.createParking(dataToSend);
      setSuccess(true);
      
      // Reset formularza
      setFormData({
        name: '',
        address: '',
        city: 'Warszawa',
        price_per_hour: '',
        total_spots: '',
        description: ''
      });

      setTimeout(() => setSuccess(false), 5000);
    } catch (err) {
      console.error('Błąd:', err);
      setError(err.response?.data?.message || 'Nie udało się dodać parkingu');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ 
      maxWidth: '800px', 
      margin: '40px auto', 
      padding: '20px',
      backgroundColor: 'white',
      borderRadius: '15px',
      boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
    }}>
      <h1 style={{ 
        fontSize: '32px', 
        fontWeight: 'bold', 
        marginBottom: '30px',
        color: '#1f2937'
      }}>
        Dodaj nowy parking
      </h1>

      {success && (
        <div style={{
          backgroundColor: '#d1fae5',
          color: '#065f46',
          padding: '15px',
          borderRadius: '8px',
          marginBottom: '20px',
          fontWeight: 'bold'
        }}>
          ✅ Parking został dodany pomyślnie!
        </div>
      )}

      {error && (
        <div style={{
          backgroundColor: '#fee2e2',
          color: '#991b1b',
          padding: '15px',
          borderRadius: '8px',
          marginBottom: '20px'
        }}>
          ❌ {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        {/* Nazwa */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{ 
            display: 'block', 
            marginBottom: '8px', 
            fontWeight: 'bold',
            color: '#374151'
          }}>
            Nazwa parkingu *
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
              padding: '12px',
              border: '2px solid #e5e7eb',
              borderRadius: '8px',
              fontSize: '16px'
            }}
          />
        </div>

        {/* Adres */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{ 
            display: 'block', 
            marginBottom: '8px', 
            fontWeight: 'bold',
            color: '#374151'
          }}>
            Adres *
          </label>
          <input
            type="text"
            name="address"
            value={formData.address}
            onChange={handleChange}
            required
            placeholder="ul. Przykładowa 123"
            style={{
              width: '100%',
              padding: '12px',
              border: '2px solid #e5e7eb',
              borderRadius: '8px',
              fontSize: '16px'
            }}
          />
        </div>

        {/* Miasto */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{ 
            display: 'block', 
            marginBottom: '8px', 
            fontWeight: 'bold',
            color: '#374151'
          }}>
            Miasto *
          </label>
          <input
            type="text"
            name="city"
            value={formData.city}
            onChange={handleChange}
            required
            style={{
              width: '100%',
              padding: '12px',
              border: '2px solid #e5e7eb',
              borderRadius: '8px',
              fontSize: '16px'
            }}
          />
        </div>

        {/* Cena i Liczba miejsc */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
          <div>
            <label style={{ 
              display: 'block', 
              marginBottom: '8px', 
              fontWeight: 'bold',
              color: '#374151'
            }}>
              Cena za godzinę (zł) *
            </label>
            <input
              type="number"
              name="price_per_hour"
              value={formData.price_per_hour}
              onChange={handleChange}
              required
              min="0"
              step="0.01"
              placeholder="15.00"
              style={{
                width: '100%',
                padding: '12px',
                border: '2px solid #e5e7eb',
                borderRadius: '8px',
                fontSize: '16px'
              }}
            />
          </div>
          <div>
            <label style={{ 
              display: 'block', 
              marginBottom: '8px', 
              fontWeight: 'bold',
              color: '#374151'
            }}>
              Liczba miejsc *
            </label>
            <input
              type="number"
              name="total_spots"
              value={formData.total_spots}
              onChange={handleChange}
              required
              min="1"
              placeholder="10"
              style={{
                width: '100%',
                padding: '12px',
                border: '2px solid #e5e7eb',
                borderRadius: '8px',
                fontSize: '16px'
              }}
            />
          </div>
        </div>

        {/* Opis */}
        <div style={{ marginBottom: '30px' }}>
          <label style={{ 
            display: 'block', 
            marginBottom: '8px', 
            fontWeight: 'bold',
            color: '#374151'
          }}>
            Opis
          </label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows="4"
            placeholder="Dodatkowe informacje o parkingu..."
            style={{
              width: '100%',
              padding: '12px',
              border: '2px solid #e5e7eb',
              borderRadius: '8px',
              fontSize: '16px',
              fontFamily: 'inherit',
              resize: 'vertical'
            }}
          />
        </div>

        {/* Przycisk */}
        <button
          type="submit"
          disabled={loading}
          style={{
            width: '100%',
            backgroundColor: loading ? '#9ca3af' : '#6366F1',
            color: 'white',
            padding: '15px',
            fontSize: '18px',
            fontWeight: 'bold',
            border: 'none',
            borderRadius: '8px',
            cursor: loading ? 'not-allowed' : 'pointer'
          }}
        >
          {loading ? 'Dodawanie...' : 'Dodaj parking'}
        </button>
      </form>

      <div style={{ 
        marginTop: '20px', 
        padding: '15px', 
        backgroundColor: '#f3f4f6', 
        borderRadius: '8px',
        fontSize: '14px',
        color: '#6b7280'
      }}>
        ℹ️ Parking zostanie dodany w centrum Warszawy. Geokodowanie będzie dostępne wkrótce.
      </div>
    </div>
  );
}

export default AddParkingPage;