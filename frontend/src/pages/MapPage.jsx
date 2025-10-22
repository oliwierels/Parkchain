// frontend/src/pages/MapPage.jsx

import { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { parkingAPI } from '../services/api';
import ReservationModal from '../components/ReservationModal';

import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

// Komponent do automatycznego centrowania mapy
function AutoCenter({ parkings }) {
  const map = useMap();

  useEffect(() => {
    if (parkings && parkings.length > 0) {
      const validParkings = parkings.filter(p => p.latitude && p.longitude);

      if (validParkings.length === 0) {
        console.log('⚠️ Brak parkingów z poprawnymi współrzędnymi');
        return;
      }

      if (validParkings.length === 1) {
        // Pojedynczy parking - wycentruj na nim
        const parking = validParkings[0];
        console.log('🎯 Centruję mapę na parkingu:', parking.name, [parking.latitude, parking.longitude]);
        map.setView([parking.latitude, parking.longitude], 15);
      } else {
        // Wiele parkingów - pokaż wszystkie
        const bounds = L.latLngBounds(
          validParkings.map(p => [p.latitude, p.longitude])
        );
        console.log('🎯 Centruję mapę na wszystkich parkingach:', validParkings.length);
        map.fitBounds(bounds, { padding: [50, 50] });
      }
    }
  }, [parkings, map]);

  return null;
}

function MapPage() {
  const mapRef = useRef(null);
  const [parkings, setParkings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedParking, setSelectedParking] = useState(null);
  const [showReservationModal, setShowReservationModal] = useState(false);

  useEffect(() => {
    const fetchParkings = async () => {
      try {
        setLoading(true);
        const data = await parkingAPI.getAllParkings();
        console.log('✅ Pobrano parkingi:', data?.length, 'sztuk');
        console.log('📍 Pierwsze 3 parkingi:', data?.slice(0, 3));
        setParkings(data);
        setError(null);
      } catch (err) {
        console.error('❌ Nie udało się pobrać parkingów:', err);
        setError('Nie udało się załadować parkingów.');
        setParkings([]);
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

  const handleReserveClick = (parking) => {
    setSelectedParking(parking);
    setShowReservationModal(true);
  };

  const handleReservationSuccess = () => {
    alert('Rezerwacja utworzona!');
    setShowReservationModal(false);
    // Odśwież parkingi
    parkingAPI.getAllParkings().then(data => setParkings(data));
  };

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
        center={[52.2297, 21.0118]}
        zoom={12}
        style={{ width: '100%', height: '100%' }}
      >
<TileLayer
  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
  url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
/>
        <AutoCenter parkings={parkings} />

      {parkings && parkings.length > 0 && (() => {
        const validParkings = parkings.filter(p => p.latitude && p.longitude);
        console.log(`🗺️ Wyświetlam ${validParkings.length} z ${parkings.length} parkingów na mapie`);
        return validParkings;
      })()
  .map((parking) => (
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
        
        <p style={{
          fontSize: '13px',
          color: '#6b7280',
          margin: '5px 0'
        }}>
          {parking.address}
        </p>
        
        <div style={{ marginBottom: '8px', marginTop: '8px' }}>
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
              ? `${parking.available_spots}/${parking.total_spots} miejsc` 
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

        {parking.available_spots > 0 && (
          <button 
            onClick={() => handleReserveClick(parking)}
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

      {showReservationModal && selectedParking && (
        <ReservationModal
          parking={selectedParking}
          onClose={() => setShowReservationModal(false)}
          onSuccess={handleReservationSuccess}
        />
      )}
    </div>
  );
}

export default MapPage;