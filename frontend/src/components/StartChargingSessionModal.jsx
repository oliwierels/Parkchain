// frontend/src/components/StartChargingSessionModal.jsx

import { useState } from 'react';

function StartChargingSessionModal({ station, onClose, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [vehicleInfo, setVehicleInfo] = useState({
    model: '',
    battery_capacity: '',
    current_charge: ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setVehicleInfo(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('http://localhost:3000/api/charging-sessions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          station_id: station.id,
          vehicle_info: vehicleInfo.model ? vehicleInfo : null
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Nie udało się rozpocząć sesji');
      }

      const data = await response.json();
      console.log('✅ Sesja rozpoczęta:', data);
      alert('⚡ Sesja ładowania rozpoczęta! Możesz ją zakończyć w swoim profilu.');
      onSuccess();
    } catch (err) {
      console.error('❌ Błąd rozpoczynania sesji:', err);
      setError(err.message || 'Nie udało się rozpocząć sesji');
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
            color: '#1F2937',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            ⚡ Rozpocznij sesję ładowania
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

        {/* Info o stacji */}
        <div style={{
          backgroundColor: '#F3F4F6',
          padding: '16px',
          borderRadius: '8px',
          marginBottom: '20px'
        }}>
          <h3 style={{
            fontSize: '16px',
            fontWeight: 'bold',
            color: '#1F2937',
            margin: '0 0 12px 0'
          }}>
            {station.name}
          </h3>
          <p style={{ fontSize: '14px', color: '#6B7280', margin: '4px 0' }}>
            {station.address}
          </p>
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '12px',
            marginTop: '12px'
          }}>
            <div>
              <p style={{ fontSize: '12px', color: '#6B7280', margin: '0 0 4px 0' }}>Typ</p>
              <p style={{ fontSize: '14px', fontWeight: 'bold', color: '#1F2937', margin: 0 }}>
                {station.charger_type}
              </p>
            </div>
            <div>
              <p style={{ fontSize: '12px', color: '#6B7280', margin: '0 0 4px 0' }}>Moc</p>
              <p style={{ fontSize: '14px', fontWeight: 'bold', color: '#1F2937', margin: 0 }}>
                {station.max_power_kw} kW
              </p>
            </div>
            <div>
              <p style={{ fontSize: '12px', color: '#6B7280', margin: '0 0 4px 0' }}>Cena/kWh</p>
              <p style={{ fontSize: '14px', fontWeight: 'bold', color: '#059669', margin: 0 }}>
                {station.price_per_kwh} zł
              </p>
            </div>
            <div>
              <p style={{ fontSize: '12px', color: '#6B7280', margin: '0 0 4px 0' }}>Dostępne</p>
              <p style={{ fontSize: '14px', fontWeight: 'bold', color: '#1F2937', margin: 0 }}>
                {station.available_connectors}/{station.total_connectors}
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <p style={{
            fontSize: '14px',
            color: '#6B7280',
            marginBottom: '16px'
          }}>
            Opcjonalnie: Dodaj informacje o pojeździe
          </p>

          {/* Model pojazdu */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: '600',
              color: '#374151',
              marginBottom: '6px'
            }}>
              Model pojazdu
            </label>
            <input
              type="text"
              name="model"
              value={vehicleInfo.model}
              onChange={handleChange}
              placeholder="np. Tesla Model 3"
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

          {/* Pojemność baterii */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: '600',
              color: '#374151',
              marginBottom: '6px'
            }}>
              Pojemność baterii (kWh)
            </label>
            <input
              type="number"
              name="battery_capacity"
              value={vehicleInfo.battery_capacity}
              onChange={handleChange}
              placeholder="np. 75"
              min="0"
              step="0.1"
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

          {/* Obecny poziom naładowania */}
          <div style={{ marginBottom: '24px' }}>
            <label style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: '600',
              color: '#374151',
              marginBottom: '6px'
            }}>
              Obecny poziom naładowania (%)
            </label>
            <input
              type="number"
              name="current_charge"
              value={vehicleInfo.current_charge}
              onChange={handleChange}
              placeholder="np. 25"
              min="0"
              max="100"
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

          {/* Przyciski */}
          <div style={{
            display: 'flex',
            gap: '12px'
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
              disabled={loading || station.available_connectors <= 0}
              style={{
                flex: 1,
                padding: '12px',
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: 'bold',
                color: 'white',
                backgroundColor: loading || station.available_connectors <= 0 ? '#9CA3AF' : '#F59E0B',
                cursor: loading || station.available_connectors <= 0 ? 'not-allowed' : 'pointer'
              }}
            >
              {loading ? 'Rozpoczynanie...' : station.available_connectors <= 0 ? 'Brak złączy' : '⚡ Rozpocznij ładowanie'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default StartChargingSessionModal;
