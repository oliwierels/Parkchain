import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

function AddParkingPage() {
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    city: '',
    price_per_hour: '',
    price_per_day: '',
    price_per_week: '',
    price_per_month: '',
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

      console.log('🔄 Wysyłam parking do API:', {
        name: formData.name,
        address: formData.address,
        city: formData.city,
        price_per_hour: parseFloat(formData.price_per_hour),
        total_spots: parseInt(formData.total_spots),
        latitude: parseFloat(formData.latitude),
        longitude: parseFloat(formData.longitude)
      });

      const response = await axios.post('http://localhost:3000/api/parking-lots', {
        name: formData.name,
        address: formData.address,
        city: formData.city,
        price_per_hour: parseFloat(formData.price_per_hour),
        price_per_day: formData.price_per_day ? parseFloat(formData.price_per_day) : null,
        price_per_week: formData.price_per_week ? parseFloat(formData.price_per_week) : null,
        price_per_month: formData.price_per_month ? parseFloat(formData.price_per_month) : null,
        total_spots: parseInt(formData.total_spots),
        latitude: parseFloat(formData.latitude),
        longitude: parseFloat(formData.longitude)
      }, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      console.log('✅ Parking dodany:', response.data);
      alert('✅ Parking dodany pomyślnie!');
      navigate('/map');
    } catch (err) {
      console.error('❌ Błąd dodawania parkingu:', err);
      console.error('❌ Response:', err.response?.data);
      console.error('❌ Status:', err.response?.status);
      console.error('❌ Message:', err.message);
      setError(err.response?.data?.error || err.message || 'Błąd podczas dodawania parkingu');
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

          {/* Sekcja cen */}
          <div style={{
            backgroundColor: '#f0f9ff',
            padding: '20px',
            borderRadius: '12px',
            marginBottom: '20px',
            border: '2px solid #bfdbfe'
          }}>
            <h3 style={{
              fontSize: '18px',
              fontWeight: 'bold',
              marginBottom: '15px',
              color: '#1e40af'
            }}>
              💰 Cennik (elastyczne taryfy)
            </h3>
            <p style={{
              fontSize: '13px',
              color: '#6b7280',
              marginBottom: '20px'
            }}>
              Ustaw ceny dla różnych okresów wynajmu. System automatycznie wybierze najtańszą opcję dla klienta.
            </p>

            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '15px'
            }}>
              <div>
                <label style={{
                  display: 'block',
                  marginBottom: '8px',
                  fontWeight: 'bold',
                  color: '#374151',
                  fontSize: '14px'
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
                <small style={{ fontSize: '11px', color: '#6b7280', marginTop: '4px', display: 'block' }}>
                  Podstawowa stawka
                </small>
              </div>

              <div>
                <label style={{
                  display: 'block',
                  marginBottom: '8px',
                  fontWeight: 'bold',
                  color: '#374151',
                  fontSize: '14px'
                }}>
                  Cena za dzień (zł)
                </label>
                <input
                  type="number"
                  step="0.01"
                  name="price_per_day"
                  value={formData.price_per_day}
                  onChange={handleChange}
                  placeholder="60.00"
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '2px solid #e5e7eb',
                    borderRadius: '8px',
                    fontSize: '16px'
                  }}
                />
                <small style={{ fontSize: '11px', color: '#6b7280', marginTop: '4px', display: 'block' }}>
                  Opcjonalne (24h)
                </small>
              </div>

              <div>
                <label style={{
                  display: 'block',
                  marginBottom: '8px',
                  fontWeight: 'bold',
                  color: '#374151',
                  fontSize: '14px'
                }}>
                  Cena za tydzień (zł)
                </label>
                <input
                  type="number"
                  step="0.01"
                  name="price_per_week"
                  value={formData.price_per_week}
                  onChange={handleChange}
                  placeholder="350.00"
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '2px solid #e5e7eb',
                    borderRadius: '8px',
                    fontSize: '16px'
                  }}
                />
                <small style={{ fontSize: '11px', color: '#6b7280', marginTop: '4px', display: 'block' }}>
                  Opcjonalne (7 dni)
                </small>
              </div>

              <div>
                <label style={{
                  display: 'block',
                  marginBottom: '8px',
                  fontWeight: 'bold',
                  color: '#374151',
                  fontSize: '14px'
                }}>
                  Cena za miesiąc (zł)
                </label>
                <input
                  type="number"
                  step="0.01"
                  name="price_per_month"
                  value={formData.price_per_month}
                  onChange={handleChange}
                  placeholder="1200.00"
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '2px solid #e5e7eb',
                    borderRadius: '8px',
                    fontSize: '16px'
                  }}
                />
                <small style={{ fontSize: '11px', color: '#6b7280', marginTop: '4px', display: 'block' }}>
                  Opcjonalne (30 dni)
                </small>
              </div>
            </div>

            <div style={{
              backgroundColor: '#eff6ff',
              padding: '12px',
              borderRadius: '8px',
              marginTop: '15px',
              fontSize: '12px',
              color: '#1e40af'
            }}>
              <strong>Wskazówka:</strong> Ustaw niższe ceny dla dłuższych okresów, aby zachęcić do długoterminowego wynajmu.
              Np. dzień = 20h godzinowa, tydzień = 30% taniej, miesiąc = 40% taniej.
            </div>
          </div>

          {/* Liczba miejsc */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{
              display: 'block',
              marginBottom: '8px',
              fontWeight: 'bold',
              color: '#374151'
            }}>
              Liczba miejsc parkingowych *
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