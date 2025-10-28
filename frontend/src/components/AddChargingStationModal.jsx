// frontend/src/components/AddChargingStationModal.jsx

import { useState } from 'react';
import { useTranslation } from 'react-i18next';

function AddChargingStationModal({ latitude, longitude, onClose, onSuccess }) {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    city: '',
    charger_type: 'AC',
    connector_types: ['Type2'],
    max_power_kw: '',
    total_connectors: '',
    price_per_kwh: '',
    price_per_minute: '',
    price_per_session: '',
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

  const handleConnectorChange = (connector, checked) => {
    setFormData(prev => ({
      ...prev,
      connector_types: checked
        ? [...prev.connector_types, connector]
        : prev.connector_types.filter(c => c !== connector)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Walidacja
      if (!formData.name || !formData.address || !formData.max_power_kw || !formData.total_connectors || !formData.price_per_kwh) {
        throw new Error(t('validation.fillAllFields'));
      }

      // Przygotuj dane
      const stationData = {
        name: formData.name,
        address: formData.address,
        city: formData.city || null,
        charger_type: formData.charger_type,
        connector_types: formData.connector_types,
        max_power_kw: parseFloat(formData.max_power_kw),
        total_connectors: parseInt(formData.total_connectors),
        price_per_kwh: parseFloat(formData.price_per_kwh),
        price_per_minute: formData.price_per_minute ? parseFloat(formData.price_per_minute) : null,
        price_per_session: formData.price_per_session ? parseFloat(formData.price_per_session) : null,
        latitude: latitude,
        longitude: longitude
      };

      console.log('📝 Dodawanie ładowarki:', stationData);

      const response = await fetch('http://localhost:3000/api/charging-stations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(stationData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || t('errors.addParkingError'));
      }

      alert(t('messages.chargerAddedSuccess'));
      onSuccess();
    } catch (err) {
      console.error(t('messages.addingChargerError'), err);
      setError(err.response?.data?.error || err.message || t('errors.addParkingError'));
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
        maxWidth: '550px',
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
            color: '#1F2937',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            {t('modals.addChargingStation')}
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
          {/* Lokalizacja */}
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

          {/* Nazwa */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: 'bold',
              color: '#374151',
              marginBottom: '6px'
            }}>
              {t('modals.chargerName')} <span style={{ color: '#EF4444' }}>*</span>
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              placeholder="np. Moja ładowarka domowa"
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
              placeholder="np. ul. Główna 1"
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

          {/* Typ ładowarki i złącza */}
          <div style={{
            marginBottom: '16px',
            padding: '16px',
            backgroundColor: '#EFF6FF',
            borderRadius: '8px',
            border: '1px solid #DBEAFE'
          }}>
            <div style={{
              fontSize: '14px',
              fontWeight: 'bold',
              color: '#374151',
              marginBottom: '12px'
            }}>
              ⚡ Specyfikacja
            </div>

            {/* Typ ładowarki */}
            <div style={{ marginBottom: '12px' }}>
              <label style={{
                display: 'block',
                fontSize: '13px',
                fontWeight: '600',
                color: '#4B5563',
                marginBottom: '6px'
              }}>
                Typ ładowarki <span style={{ color: '#EF4444' }}>*</span>
              </label>
              <select
                name="charger_type"
                value={formData.charger_type}
                onChange={handleChange}
                required
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '1px solid #D1D5DB',
                  borderRadius: '6px',
                  fontSize: '14px',
                  boxSizing: 'border-box',
                  backgroundColor: 'white'
                }}
              >
                <option value="AC">AC (wolniejsze, domowe)</option>
                <option value="DC_FAST">DC Fast (szybkie)</option>
                <option value="ULTRA_FAST">Ultra Fast (bardzo szybkie)</option>
              </select>
            </div>

            {/* Typy złączy */}
            <div style={{ marginBottom: '12px' }}>
              <label style={{
                display: 'block',
                fontSize: '13px',
                fontWeight: '600',
                color: '#4B5563',
                marginBottom: '8px'
              }}>
                Dostępne złącza
              </label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {['Type2', 'CCS', 'CHAdeMO', 'Tesla'].map(connector => (
                  <label key={connector} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={formData.connector_types.includes(connector)}
                      onChange={(e) => handleConnectorChange(connector, e.target.checked)}
                      style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                    />
                    <span style={{ fontSize: '13px' }}>{connector}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Moc maksymalna */}
            <div style={{ marginBottom: '12px' }}>
              <label style={{
                display: 'block',
                fontSize: '13px',
                fontWeight: '600',
                color: '#4B5563',
                marginBottom: '4px'
              }}>
                Moc maksymalna (kW) <span style={{ color: '#EF4444' }}>*</span>
              </label>
              <input
                type="number"
                name="max_power_kw"
                value={formData.max_power_kw}
                onChange={handleChange}
                required
                min="0"
                step="0.1"
                placeholder="np. 22"
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

            {/* Liczba złączy */}
            <div>
              <label style={{
                display: 'block',
                fontSize: '13px',
                fontWeight: '600',
                color: '#4B5563',
                marginBottom: '4px'
              }}>
                Liczba złączy <span style={{ color: '#EF4444' }}>*</span>
              </label>
              <input
                type="number"
                name="total_connectors"
                value={formData.total_connectors}
                onChange={handleChange}
                required
                min="1"
                placeholder="np. 2"
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

          {/* Cennik */}
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

            {/* Cena za kWh */}
            <div style={{ marginBottom: '12px' }}>
              <label style={{
                display: 'block',
                fontSize: '13px',
                fontWeight: '600',
                color: '#4B5563',
                marginBottom: '4px'
              }}>
                Cena za kWh (zł) <span style={{ color: '#EF4444' }}>*</span>
              </label>
              <input
                type="number"
                name="price_per_kwh"
                value={formData.price_per_kwh}
                onChange={handleChange}
                required
                min="0"
                step="0.01"
                placeholder="np. 1.50"
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

            {/* Cena za minutę */}
            <div style={{ marginBottom: '12px' }}>
              <label style={{
                display: 'block',
                fontSize: '13px',
                fontWeight: '600',
                color: '#4B5563',
                marginBottom: '4px'
              }}>
                Cena za minutę (zł) <span style={{ fontSize: '11px', color: '#6B7280' }}>opcjonalne</span>
              </label>
              <input
                type="number"
                name="price_per_minute"
                value={formData.price_per_minute}
                onChange={handleChange}
                min="0"
                step="0.01"
                placeholder="np. 0.10"
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

            {/* Opłata za sesję */}
            <div>
              <label style={{
                display: 'block',
                fontSize: '13px',
                fontWeight: '600',
                color: '#4B5563',
                marginBottom: '4px'
              }}>
                Opłata za sesję (zł) <span style={{ fontSize: '11px', color: '#6B7280' }}>opcjonalne</span>
              </label>
              <input
                type="number"
                name="price_per_session"
                value={formData.price_per_session}
                onChange={handleChange}
                min="0"
                step="0.01"
                placeholder="np. 2.00"
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
                backgroundColor: loading ? '#9CA3AF' : '#10B981',
                cursor: loading ? 'not-allowed' : 'pointer'
              }}
            >
              {loading ? t('common.loading') : t('modals.addChargingStation')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AddChargingStationModal;
