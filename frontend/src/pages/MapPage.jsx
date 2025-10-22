// frontend/src/pages/MapPage.jsx

import { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { parkingAPI } from '../services/api';
import ReservationModal from '../components/ReservationModal';
import ReportOccupancyModal from '../components/ReportOccupancyModal';

import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

// Ikona destynacji (czerwony marker)
const DestinationIcon = L.icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34]
});

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

// Komponent do klikania na mapę
function DestinationPicker({ onDestinationSet }) {
  useMapEvents({
    click(e) {
      const { lat, lng } = e.latlng;
      onDestinationSet(lat, lng);
    }
  });
  return null;
}

function MapPage() {
  const mapRef = useRef(null);
  const [parkings, setParkings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedParking, setSelectedParking] = useState(null);
  const [showReservationModal, setShowReservationModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);

  // Nowe state dla wyszukiwania destynacji
  const [searchMode, setSearchMode] = useState(false);
  const [destination, setDestination] = useState(null);
  const [recommendedParkings, setRecommendedParkings] = useState([]);
  const [loadingRecommendations, setLoadingRecommendations] = useState(false);

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

  const handleReportClick = (parking) => {
    setSelectedParking(parking);
    setShowReportModal(true);
  };

  const handleReportSuccess = () => {
    setShowReportModal(false);
    // Odśwież parkingi
    parkingAPI.getAllParkings().then(data => setParkings(data));
  };

  const handleDestinationSet = async (lat, lng) => {
    if (!searchMode) return;

    console.log(`📍 Destynacja ustawiona: [${lat}, ${lng}]`);
    setDestination({ lat, lng });
    setLoadingRecommendations(true);

    try {
      const result = await parkingAPI.getNearbyParkings(lat, lng, 5, 10);
      console.log('✅ Rekomendowane parkingi:', result.parkings);
      setRecommendedParkings(result.parkings);

      if (result.parkings.length === 0) {
        alert('Nie znaleziono parkingów w pobliżu (promień 5km)');
      }
    } catch (err) {
      console.error('❌ Błąd przy szukaniu parkingów:', err);
      alert('Nie udało się znaleźć parkingów w pobliżu');
    } finally {
      setLoadingRecommendations(false);
      setSearchMode(false);
    }
  };

  const handleToggleSearchMode = () => {
    setSearchMode(!searchMode);
    if (searchMode) {
      // Wyłącz tryb wyszukiwania
      setDestination(null);
      setRecommendedParkings([]);
    }
  };

  const handleClearDestination = () => {
    setDestination(null);
    setRecommendedParkings([]);
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
    <div style={{ width: '100%', height: 'calc(100vh - 64px)', position: 'relative' }}>
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

      {/* Przycisk do włączenia trybu wyszukiwania */}
      <div style={{
        position: 'absolute',
        top: '20px',
        left: '20px',
        zIndex: 1000
      }}>
        <button
          onClick={handleToggleSearchMode}
          style={{
            backgroundColor: searchMode ? '#EF4444' : '#6366F1',
            color: 'white',
            padding: '12px 24px',
            border: 'none',
            borderRadius: '8px',
            fontWeight: 'bold',
            cursor: 'pointer',
            boxShadow: '0 4px 6px rgba(0,0,0,0.2)',
            fontSize: '14px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          {searchMode ? '✕ Anuluj' : '🎯 Znajdź parking'}
        </button>

        {searchMode && (
          <div style={{
            marginTop: '10px',
            backgroundColor: '#FEF3C7',
            color: '#92400E',
            padding: '10px 16px',
            borderRadius: '8px',
            fontSize: '13px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            maxWidth: '250px'
          }}>
            📍 Kliknij na mapę aby wybrać destynację
          </div>
        )}
      </div>

      {/* Panel z rekomendacjami */}
      {destination && recommendedParkings.length > 0 && (
        <div style={{
          position: 'absolute',
          top: '20px',
          right: '20px',
          zIndex: 1000,
          backgroundColor: 'white',
          borderRadius: '12px',
          boxShadow: '0 8px 16px rgba(0,0,0,0.2)',
          maxWidth: '400px',
          maxHeight: '80vh',
          overflow: 'auto'
        }}>
          <div style={{
            padding: '16px',
            borderBottom: '2px solid #E5E7EB',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            position: 'sticky',
            top: 0,
            backgroundColor: 'white',
            borderRadius: '12px 12px 0 0'
          }}>
            <h3 style={{
              margin: 0,
              fontSize: '18px',
              fontWeight: 'bold',
              color: '#1F2937'
            }}>
              🏆 Najlepsze parkingi
            </h3>
            <button
              onClick={handleClearDestination}
              style={{
                backgroundColor: 'transparent',
                border: 'none',
                fontSize: '20px',
                cursor: 'pointer',
                color: '#6B7280'
              }}
            >
              ✕
            </button>
          </div>

          <div style={{ padding: '12px' }}>
            {recommendedParkings.map((parking, index) => (
              <div
                key={parking.id}
                style={{
                  backgroundColor: index === 0 ? '#FEF3C7' : '#F9FAFB',
                  border: index === 0 ? '2px solid #F59E0B' : '1px solid #E5E7EB',
                  borderRadius: '8px',
                  padding: '12px',
                  marginBottom: '12px',
                  cursor: 'pointer'
                }}
                onClick={() => {
                  if (mapRef.current) {
                    mapRef.current.setView([parking.latitude, parking.longitude], 16);
                  }
                }}
              >
                {index === 0 && (
                  <div style={{
                    backgroundColor: '#F59E0B',
                    color: 'white',
                    padding: '4px 8px',
                    borderRadius: '4px',
                    fontSize: '11px',
                    fontWeight: 'bold',
                    marginBottom: '8px',
                    display: 'inline-block'
                  }}>
                    NAJLEPSZY WYBÓR
                  </div>
                )}

                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  marginBottom: '8px'
                }}>
                  <h4 style={{
                    margin: 0,
                    fontSize: '15px',
                    fontWeight: 'bold',
                    color: '#1F2937'
                  }}>
                    {index + 1}. {parking.name}
                  </h4>
                  <div style={{
                    backgroundColor: '#6366F1',
                    color: 'white',
                    padding: '4px 8px',
                    borderRadius: '12px',
                    fontSize: '12px',
                    fontWeight: 'bold',
                    whiteSpace: 'nowrap'
                  }}>
                    {parking.price_per_hour} zł/h
                  </div>
                </div>

                <p style={{
                  margin: '4px 0',
                  fontSize: '12px',
                  color: '#6B7280'
                }}>
                  {parking.address}
                </p>

                <div style={{
                  display: 'flex',
                  gap: '12px',
                  marginTop: '8px',
                  fontSize: '12px'
                }}>
                  <div style={{ color: '#059669', fontWeight: 'bold' }}>
                    📍 {parking.distance} km
                  </div>
                  <div style={{ color: '#7C3AED', fontWeight: 'bold' }}>
                    🚶 ~{parking.walkingTime} min
                  </div>
                  <div style={{
                    color: parking.available_spots > 0 ? '#059669' : '#DC2626',
                    fontWeight: 'bold'
                  }}>
                    {parking.available_spots > 0
                      ? `✓ ${parking.available_spots} miejsc`
                      : '✗ Brak miejsc'}
                  </div>
                </div>

                {parking.available_spots > 0 && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleReserveClick(parking);
                    }}
                    style={{
                      marginTop: '8px',
                      width: '100%',
                      backgroundColor: '#6366F1',
                      color: 'white',
                      padding: '8px 16px',
                      border: 'none',
                      borderRadius: '6px',
                      fontWeight: 'bold',
                      cursor: 'pointer',
                      fontSize: '13px'
                    }}
                  >
                    Zarezerwuj teraz
                  </button>
                )}
              </div>
            ))}
          </div>
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

        {/* Komponent do klikania na mapę w trybie wyszukiwania */}
        {searchMode && <DestinationPicker onDestinationSet={handleDestinationSet} />}

        {/* Marker destynacji */}
        {destination && (
          <Marker position={[destination.lat, destination.lng]} icon={DestinationIcon}>
            <Popup>
              <div style={{ minWidth: '150px', textAlign: 'center' }}>
                <h3 style={{ margin: '0 0 8px 0', fontSize: '14px', fontWeight: 'bold' }}>
                  🎯 Twoja destynacja
                </h3>
                <p style={{ margin: '4px 0', fontSize: '12px', color: '#6B7280' }}>
                  {destination.lat.toFixed(5)}, {destination.lng.toFixed(5)}
                </p>
              </div>
            </Popup>
          </Marker>
        )}

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

        <div style={{ margin: '10px 0' }}>
          <div style={{
            fontSize: '16px',
            fontWeight: 'bold',
            color: '#6366F1',
            marginBottom: '5px'
          }}>
            {parking.price_per_hour} zł/godz
          </div>
          {(parking.price_per_day || parking.price_per_week || parking.price_per_month) && (
            <div style={{
              fontSize: '11px',
              color: '#6b7280',
              lineHeight: '1.4'
            }}>
              {parking.price_per_day && <div>• {parking.price_per_day} zł/dzień</div>}
              {parking.price_per_week && <div>• {parking.price_per_week} zł/tydzień</div>}
              {parking.price_per_month && <div>• {parking.price_per_month} zł/miesiąc</div>}
            </div>
          )}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '8px' }}>
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
                cursor: 'pointer'
              }}
            >
              Zarezerwuj teraz
            </button>
          )}

          <button
            onClick={() => handleReportClick(parking)}
            style={{
              width: '100%',
              backgroundColor: '#10b981',
              color: 'white',
              padding: '8px 16px',
              border: 'none',
              borderRadius: '6px',
              fontWeight: 'bold',
              cursor: 'pointer'
            }}
          >
            📍 Zgłoś zajętość (CrowdScan)
          </button>
        </div>
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

      {showReportModal && selectedParking && (
        <ReportOccupancyModal
          parking={selectedParking}
          onClose={() => setShowReportModal(false)}
          onSuccess={handleReportSuccess}
        />
      )}
    </div>
  );
}

export default MapPage;