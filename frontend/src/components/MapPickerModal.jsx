// Plik: frontend/src/components/MapPickerModal.jsx

import { useState } from 'react';
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import axios from 'axios';

// Poprawka dla ikony Leaflet, tak jak w MapPage.jsx
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';
let DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;


// Komponent do obsługi kliknięć na mapie
function MapClickHandler({ onMapClick, position }) {
  useMapEvents({
    click(e) {
      onMapClick(e.latlng); // Przekaż współrzędne po kliknięciu
    },
  });

  // Wyświetl pinezkę na klikniętej pozycji
  return position === null ? null : <Marker position={position} />;
}

// Komponent do centrowania mapy
function ChangeView({ center, zoom }) {
  const map = useMap();
  map.setView(center, zoom);
  return null;
}

function MapPickerModal({ onClose, onSelect }) {
  const [position, setPosition] = useState(null); // Pozycja pinezki
  const [loading, setLoading] = useState(false);
  const warsawCenter = [52.2297, 21.0118]; // Domyślne centrum mapy

  const handleMapClick = (latlng) => {
    setPosition(latlng);
  };

  const handleConfirm = async () => {
    if (!position) {
      alert('Wybierz lokalizację na mapie, klikając na nią.');
      return;
    }

    setLoading(true);
    try {
      // Używamy Nominatim (OSM) do reverse geocoding (zamiana koordynatów na adres)
      const response = await axios.get('https://nominatim.openstreetmap.org/reverse', {
        params: {
          lat: position.lat,
          lon: position.lng,
          format: 'json',
          addressdetails: 1, // Potrzebujemy szczegółów adresu, by wyciągnąć miasto
        },
        headers: {
          'User-Agent': 'ParkChain/1.0' // Wymagane przez Nominatim
        }
      });

      const data = response.data;
      const address = data.display_name; // Pełny adres
      // Próbujemy znaleźć miasto w szczegółach adresu
      const city = data.address.city || data.address.town || data.address.village || '';

      // Przekaż wybrane dane z powrotem do formularza
      onSelect({
        latitude: position.lat,
        longitude: position.lng,
        address: address,
        city: city,
      });
      onClose(); // Zamknij modal

    } catch (error) {
      console.error("Błąd reverse geocoding:", error);
      alert("Nie udało się pobrać adresu dla tej lokalizacji.");
    } finally {
      setLoading(false);
    }
  };

  return (
    // Tło modala
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1000,
      padding: '20px'
    }}>
      {/* Okno modala */}
      <div style={{
        backgroundColor: 'white',
        borderRadius: '15px',
        padding: '20px',
        width: '90%',
        maxWidth: '800px',
        height: '90vh',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 10px 25px rgba(0,0,0,0.1)'
      }}>
        <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '10px' }}>
          Wybierz lokalizację z mapy
        </h2>
        <p style={{ color: '#6b7280', marginBottom: '15px' }}>
          Kliknij na mapie, aby ustawić pinezkę w miejscu parkingu.
        </p>
        
        {/* Kontener mapy */}
        <div style={{ flex: 1, width: '100%', borderRadius: '8px', overflow: 'hidden' }}>
          <MapContainer
            center={warsawCenter}
            zoom={13}
            style={{ width: '100%', height: '100%' }}
          >
            <TileLayer
  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
  url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
/>
            <MapClickHandler onMapClick={handleMapClick} position={position} />
            <ChangeView center={warsawCenter} zoom={13} />
          </MapContainer>
        </div>

        {/* Przyciski */}
        <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: '10px 20px',
              backgroundColor: '#f3f4f6',
              color: '#1f2937',
              border: 'none',
              borderRadius: '8px',
              fontWeight: 'bold',
              cursor: 'pointer'
            }}
          >
            Anuluj
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={loading || !position}
            style={{
              padding: '10px 20px',
              backgroundColor: loading || !position ? '#9ca3af' : '#6366F1',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontWeight: 'bold',
              cursor: loading || !position ? 'not-allowed' : 'pointer'
            }}
          >
            {loading ? 'Pobieranie adresu...' : 'Zatwierdź lokalizację'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default MapPickerModal;