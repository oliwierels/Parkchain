import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

function AddParkingPage() {
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    price_per_hour: '',
      city: '', // DODAJ TO
    total_spots: '',
    latitude: '',
    longitude: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [geocoding, setGeocoding] = useState(false);
  
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleGeocodeAddress = async () => {
    if (!formData.address) {
      setError('Wprowadź adres przed geokodowaniem');
      return;
    }

    setGeocoding(true);
    setError('');

    try {
      const response = await axios.post('http://localhost:3000/api/geocode', {
        address: formData.address
      });

      setFormData({
        ...formData,
        latitude: response.data.latitude.toString(),
        longitude: response.data.longitude.toString()
      });
      
      alert('✅ Znaleziono współrzędne!');
    } catch (err) {
      setError('Nie udało się znaleźć współrzędnych dla podanego adresu');
    } finally {
      setGeocoding(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Walidacja
    if (!formData.name || !formData.address || !formData.price_per_hour || !formData.total_spots) {
      setError('Wypełnij wszystkie wymagane pola');
      setLoading(false);
      return;
    }

    if (!formData.latitude || !formData.longitude) {
      setError('Użyj przycisku "Znajdź współrzędne" aby dodać lokalizację');
      setLoading(false);
      return;
    }

    try {
      const token = localStorage.getItem('token');
      
      await axios.post('http://localhost:3000/api/parking-lots', {
        name: formData.name,
        address: formData.address,
          city: formData.city,  // <-- DODAJ TĘ LINIĘ
        price_per_hour: parseFloat(formData.price_per_hour),
        total_spots: parseInt(formData.total_spots),
        latitude: parseFloat(formData.latitude),
        longitude: parseFloat(formData.longitude)
      }, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      alert('✅ Parking dodany pomyślnie!');
      navigate('/map');
    } catch (err) {
      console.error('Error adding parking:', err);
      setError(err.response?.data?.error || 'Błąd podczas dodawania parkingu');
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div style={{
        minHeight: 'calc(100vh - 64px)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '20px'
      }}>
        <div style={{
          backgroundColor: '#fee2e2',
          color: '#991b1b',
          padding: '20px',
          borderRadius: '8px',
          textAlign: 'center'
        }}>
          Musisz być zalogowany aby dodać parking
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: 'calc(100vh - 64px)',
      backgroundColor: '#f9fafb',
      padding: '40px 20px'
    }}>
      <div style={{
        maxWidth: '600px',
        margin: '0 auto',
        backgroundColor: 'white',
        padding: '40px',
        borderRadius: '15px',
        boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
      }}>
        <h1 style={{
          fontSize: '28px',
          fontWeight: 'bold',
          marginBottom: '10px',
          color: '#1f2937'
        }}>
          Dodaj nowy parking
        </h1>
        
        <p style={{
          color: '#6b7280',
          marginBottom: '30px',
          fontSize: '14px'
        }}>
          Wypełnij poniższy formularz, aby dodać swój parking do systemu
        </p>

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

          <div style={{ marginBottom: '20px' }}>
            <label style={{
              display: 'block',
              marginBottom: '8px',
              fontWeight: 'bold',
              color: '#374151'
            }}>
              Adres *
            </label>
            <div style={{ display: 'flex', gap: '10px' }}>
              <input
                type="text"
                name="address"
                value={formData.address}
                onChange={handleChange}
                required
                placeholder="ul. Marszałkowska 1, Warszawa"
                style={{
                  flex: 1,
                  padding: '12px',
                  border: '2px solid #e5e7eb',
                  borderRadius: '8px',
                  fontSize: '16px'
                }}
              />
              <button
                type="button"
                onClick={handleGeocodeAddress}
                disabled={geocoding}
                style={{
                  padding: '12px 20px',
                  backgroundColor: geocoding ? '#9ca3af' : '#10b981',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontWeight: 'bold',
                  cursor: geocoding ? 'not-allowed' : 'pointer',
                  whiteSpace: 'nowrap'
                }}
              >
                {geocoding ? '...' : '📍 Znajdź'}
              </button>
            </div>
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
    placeholder="Warszawa"
    style={{
      width: '100%',
      padding: '12px',
      border: '2px solid #e5e7eb',
      borderRadius: '8px',
      fontSize: '16px'
    }}
  />
</div>
            <small style={{ color: '#6b7280', fontSize: '12px', marginTop: '5px', display: 'block' }}>
              Kliknij "Znajdź" aby automatycznie pobrać współrzędne
            </small>
          </div>

          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: '1fr 1fr', 
            gap: '20px',
            marginBottom: '20px' 
          }}>
            <div>
              <label style={{
                display: 'block',
                marginBottom: '8px',
                fontWeight: 'bold',
                color: '#374151'
              }}>
                Szerokość geograficzna
              </label>
              <input
                type="number"
                step="any"
                name="latitude"
                value={formData.latitude}
                onChange={handleChange}
                placeholder="52.2297"
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '2px solid #e5e7eb',
                  borderRadius: '8px',
                  fontSize: '16px',
                  backgroundColor: '#f9fafb'
                }}
                readOnly
              />
            </div>

            <div>
              <label style={{
                display: 'block',
                marginBottom: '8px',
                fontWeight: 'bold',
                color: '#374151'
              }}>
                Długość geograficzna
              </label>
              <input
                type="number"
                step="any"
                name="longitude"
                value={formData.longitude}
                onChange={handleChange}
                placeholder="21.0122"
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '2px solid #e5e7eb',
                  borderRadius: '8px',
                  fontSize: '16px',
                  backgroundColor: '#f9fafb'
                }}
                readOnly
              />
            </div>
          </div>

          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: '1fr 1fr', 
            gap: '20px',
            marginBottom: '20px' 
          }}>
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
                step="0.01"
                name="price_per_hour"
                value={formData.price_per_hour}
                onChange={handleChange}
                required
                placeholder="10.00"
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
                placeholder="50"
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

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              backgroundColor: loading ? '#9ca3af' : '#6366F1',
              color: 'white',
              padding: '15px',
              fontSize: '16px',
              fontWeight: 'bold',
              border: 'none',
              borderRadius: '8px',
              cursor: loading ? 'not-allowed' : 'pointer',
              marginTop: '10px'
            }}
          >
            {loading ? 'Dodawanie...' : '✅ Dodaj parking'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default AddParkingPage;