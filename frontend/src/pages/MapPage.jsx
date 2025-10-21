// frontend/src/pages/MapPage.jsx

import { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { parkingAPI } from '../services/api';

// Napraw ikony markerów
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

function MapPage() {
  const mapRef = useRef(null);
  const [parkings, setParkings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Pobierz parkingi z API
  useEffect(() => {
    const fetchParkings = async () => {
      try {
        setLoading(true);
        const data = await parkingAPI.getAllParkings();
        setParkings(data);
        setError(null);
      } catch (err) {
        console.error('Nie udało się pobrać parkingów:', err);
        setError('Nie udało się załadować parkingów. Sprawdź czy backend działa.');
        // Fallback - użyj przykładowych danych jeśli API nie działa
        setParkings([
          {
            id: 1,
            name: "Parking Centrum",
            latitude: 52.2297,
            longitude: 19.1451,
            price_per_hour: 15,
            total_spots: 10,
            available_spots: 5
          },
          {
            id: 2,
            name: "Parking Dworcowy",
            latitude: 52.2330,
            longitude: 19.1520,
            price_per_hour: 12,
            total_spots: 8,
            available_spots: 3
          }
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchParkings();
  }, []);

  useEffect(() => {
    if (mapRef.current) {
      setTimeout(() => {
        mapRef.current.invalidateSize();
      }, 100);
    }
  }, []);

  if (loading) {
    return (
      <div style={{
        width: '100%',
        height: 'calc(100vh - 64px)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        fontSize: '20px',
        color: '#6366F1'
      }}>
        Ładowanie parkingów...
      </div>
    );
  }

  return (
    <div style={{ width: '100%', height: 'calc(100vh - 64px)' }}>
      {error && (
        <div style={{
          position: 'absolute',
          top: '80px',
          left: '50%',
          transform: 'translateX(-50%)',
          backgroundColor: '#fee2e2',
          color: '#991b1b',
          padding: '12px 24px',
          borderRadius: '8px',
          zIndex: 1000,
          boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
        }}>
          {error}
        </div>
      )}
      
      <MapContainer
        ref={mapRef}
        center={[52.2297, 19.1451]}
        zoom={13}
        style={{ width: '100%', height: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {parkings.map((parking) => (
          <Marker 
            key={parking.id} 
            position={[parking.latitude, parking.longitude]}
          >
            <Popup>
              <div style={{ minWidth: '200px' }}>
                <h3 style={{ 
                  margin: '0 0 10px 0', 
                  fontSize: '16px',
                  fontWeight: 'bold',
                  color: '#1f2937'
                }}>
                  {parking.name}
                </h3>
                
                <div style={{ marginBottom: '8px' }}>
                  <span style={{ 
                    display: 'inline-block',
                    padding: '4px 12px',
                    borderRadius: '12px',
                    fontSize: '12px',
                    fontWeight: 'bold',
                    backgroundColor: parking.available_spots > 0 ? '#d1fae5' : '#fee2e2',
                    color: parking.available_spots > 0 ? '#065f46' : '#991b1b'
                  }}>
                    {parking.available_spots > 0 
                      ? `${parking.available_spots}/${parking.total_spots} miejsc dostępnych` 
                      : 'Brak miejsc'}
                  </span>
                </div>

                <p style={{ 
                  margin: '8px 0',
                  fontSize: '18px',
                  fontWeight: 'bold',
                  color: '#6366F1'
                }}>
                  {parking.price_per_hour} zł/godz
                </p>

                {parking.description && (
                  <p style={{
                    fontSize: '14px',
                    color: '#6b7280',
                    margin: '8px 0'
                  }}>
                    {parking.description}
                  </p>
                )}

                {parking.available_spots > 0 && (
                  <button 
                    onClick={() => {
                      alert(`Rezerwacja parkingu: ${parking.name}`);
                      // Tutaj później dodamy formularz rezerwacji
                    }}
                    style={{
                      width: '100%',
                      backgroundColor: '#6366F1',
                      color: 'white',
                      padding: '8px 16px',
                      border: 'none',
                      borderRadius: '6px',
                      fontWeight: 'bold',
                      cursor: 'pointer',
                      marginTop: '8px'
                    }}
                  >
                    Zarezerwuj teraz
                  </button>
                )}
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}

export default MapPage;