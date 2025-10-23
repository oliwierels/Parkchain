// frontend/src/pages/MapPage.jsx

import { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { parkingAPI } from '../services/api';
import ReservationModal from '../components/ReservationModal';
import ReportOccupancyModal from '../components/ReportOccupancyModal';
import AddParkingModal from '../components/AddParkingModal';
import AddChargingStationModal from '../components/AddChargingStationModal';
import StartChargingSessionModal from '../components/StartChargingSessionModal';
import { useAuth } from '../context/AuthContext';

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

// Funkcja do tworzenia custom markerów dla parkingów
function createParkingIcon(parking) {
  // Oblicz procent dostępności
  const availabilityPercent = parking.total_spots > 0
    ? (parking.available_spots / parking.total_spots) * 100
    : 0;

  // Wybierz kolor bazując na dostępności
  let color;
  if (parking.available_spots === 0) {
    color = '#DC2626'; // Czerwony - brak miejsc
  } else if (availabilityPercent < 25) {
    color = '#F59E0B'; // Pomarańczowy - mało miejsc
  } else if (availabilityPercent < 50) {
    color = '#EAB308'; // Żółty - średnio miejsc
  } else {
    color = '#10B981'; // Zielony - dużo miejsc
  }

  const html = `
    <div style="
      width: 30px;
      height: 30px;
      background: ${color};
      border: 3px solid white;
      border-radius: 50% 50% 50% 0;
      transform: rotate(-45deg);
      box-shadow: 0 3px 8px rgba(0,0,0,0.3);
      transition: all 0.2s ease;
    ">
    </div>
  `;

  return L.divIcon({
    html: html,
    className: 'custom-parking-marker',
    iconSize: [30, 30],
    iconAnchor: [15, 30],
    popupAnchor: [0, -30]
  });
}

// Funkcja do tworzenia custom markerów dla ładowarek EV
function createChargingIcon(station) {
  // Oblicz procent dostępności
  const availabilityPercent = station.total_connectors > 0
    ? (station.available_connectors / station.total_connectors) * 100
    : 0;

  // Wybierz kolor bazując na dostępności
  let color;
  if (station.available_connectors === 0) {
    color = '#DC2626'; // Czerwony - brak złączy
  } else if (availabilityPercent < 25) {
    color = '#F59E0B'; // Pomarańczowy - mało złączy
  } else if (availabilityPercent < 50) {
    color = '#EAB308'; // Żółty - średnio złączy
  } else {
    color = '#10B981'; // Zielony - dużo złączy
  }

  const html = `
    <div style="
      width: 32px;
      height: 32px;
      background: ${color};
      border: 3px solid white;
      border-radius: 6px;
      transform: rotate(45deg);
      box-shadow: 0 3px 8px rgba(0,0,0,0.3);
      transition: all 0.2s ease;
      display: flex;
      align-items: center;
      justify-content: center;
    ">
      <div style="
        transform: rotate(-45deg);
        font-size: 16px;
        line-height: 1;
      ">
        ⚡
      </div>
    </div>
  `;

  return L.divIcon({
    html: html,
    className: 'custom-charging-marker',
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32]
  });
}

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
function MapClickHandler({ onMapClick }) {
  useMapEvents({
    click(e) {
      const { lat, lng } = e.latlng;
      onMapClick(lat, lng);
    }
  });
  return null;
}

function MapPage() {
  const { user } = useAuth();
  const mapRef = useRef(null);
  const [parkings, setParkings] = useState([]);
  const [chargingStations, setChargingStations] = useState([]);
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

  // Nowe state dla dodawania parkingu
  const [addParkingMode, setAddParkingMode] = useState(false);
  const [newParkingLocation, setNewParkingLocation] = useState(null);
  const [showAddParkingModal, setShowAddParkingModal] = useState(false);

  // Nowe state dla dodawania ładowarki
  const [addChargingMode, setAddChargingMode] = useState(false);
  const [newChargingLocation, setNewChargingLocation] = useState(null);
  const [showAddChargingModal, setShowAddChargingModal] = useState(false);
  const [showChargingSessionModal, setShowChargingSessionModal] = useState(false);
  const [selectedChargingStation, setSelectedChargingStation] = useState(null);

  // Filtry
  const [showParkings, setShowParkings] = useState(true);
  const [showCharging, setShowCharging] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // Pobierz parkingi
        const parkingsData = await parkingAPI.getAllParkings();
        console.log('✅ Pobrano parkingi:', parkingsData?.length, 'sztuk');
        setParkings(parkingsData);

        // Pobierz ładowarki
        try {
          const response = await fetch('http://localhost:3000/api/charging-stations');
          const chargingData = await response.json();
          console.log('✅ Pobrano ładowarki:', chargingData?.stations?.length, 'sztuk');
          setChargingStations(chargingData.stations || []);
        } catch (err) {
          console.error('⚠️ Nie udało się pobrać ładowarek:', err);
          setChargingStations([]);
        }

        setError(null);
      } catch (err) {
        console.error('❌ Nie udało się pobrać danych:', err);
        setError('Nie udało się załadować danych.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
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

  const handleMapClick = (lat, lng) => {
    if (searchMode) {
      // Tryb wyszukiwania destynacji
      handleDestinationSet(lat, lng);
    } else if (addParkingMode) {
      // Tryb dodawania parkingu
      console.log(`📍 Wybrano lokalizację dla nowego parkingu: [${lat}, ${lng}]`);
      setNewParkingLocation({ lat, lng });
      setShowAddParkingModal(true);
      setAddParkingMode(false);
    } else if (addChargingMode) {
      // Tryb dodawania ładowarki
      console.log(`⚡ Wybrano lokalizację dla nowej ładowarki: [${lat}, ${lng}]`);
      setNewChargingLocation({ lat, lng });
      setShowAddChargingModal(true);
      setAddChargingMode(false);
    }
  };

  const handleToggleAddParkingMode = () => {
    if (!user) {
      alert('Musisz być zalogowany aby dodać parking');
      return;
    }

    setAddParkingMode(!addParkingMode);
    if (addParkingMode) {
      // Wyłącz tryb dodawania
      setNewParkingLocation(null);
    }
    // Wyłącz tryb wyszukiwania jeśli był włączony
    if (searchMode) {
      setSearchMode(false);
      setDestination(null);
      setRecommendedParkings([]);
    }
  };

  const handleAddParkingSuccess = () => {
    setShowAddParkingModal(false);
    setNewParkingLocation(null);
    // Odśwież parkingi
    parkingAPI.getAllParkings().then(data => setParkings(data));
  };

  const handleToggleAddChargingMode = () => {
    if (!user) {
      alert('Musisz być zalogowany aby dodać ładowarkę');
      return;
    }

    setAddChargingMode(!addChargingMode);
    if (addChargingMode) {
      // Wyłącz tryb dodawania
      setNewChargingLocation(null);
    }
    // Wyłącz inne tryby jeśli były włączone
    if (searchMode) {
      setSearchMode(false);
      setDestination(null);
      setRecommendedParkings([]);
    }
    if (addParkingMode) {
      setAddParkingMode(false);
      setNewParkingLocation(null);
    }
  };

  const handleAddChargingSuccess = () => {
    setShowAddChargingModal(false);
    setNewChargingLocation(null);
    // Odśwież ładowarki
    fetch('http://localhost:3000/api/charging-stations')
      .then(res => res.json())
      .then(data => setChargingStations(data.stations || []));
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

      {/* Przyciski do różnych trybów */}
      <div style={{
        position: 'absolute',
        top: '20px',
        left: '20px',
        zIndex: 1000,
        display: 'flex',
        flexDirection: 'column',
        gap: '12px'
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
          {searchMode ? '✕ Anuluj wyszukiwanie' : '🎯 Znajdź parking'}
        </button>

        {user && (
          <>
            <button
              onClick={handleToggleAddParkingMode}
              style={{
                backgroundColor: addParkingMode ? '#EF4444' : '#10B981',
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
              {addParkingMode ? '✕ Anuluj' : '🅿️ Dodaj parking'}
            </button>

            <button
              onClick={handleToggleAddChargingMode}
              style={{
                backgroundColor: addChargingMode ? '#EF4444' : '#F59E0B',
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
              {addChargingMode ? '✕ Anuluj' : '⚡ Dodaj ładowarkę'}
            </button>
          </>
        )}

        {searchMode && (
          <div style={{
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

        {addParkingMode && (
          <div style={{
            backgroundColor: '#D1FAE5',
            color: '#065F46',
            padding: '10px 16px',
            borderRadius: '8px',
            fontSize: '13px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            maxWidth: '250px'
          }}>
            🅿️ Kliknij na mapę w miejscu gdzie chcesz dodać parking
          </div>
        )}

        {addChargingMode && (
          <div style={{
            backgroundColor: '#FEF3C7',
            color: '#92400E',
            padding: '10px 16px',
            borderRadius: '8px',
            fontSize: '13px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            maxWidth: '250px'
          }}>
            ⚡ Kliknij na mapę w miejscu gdzie chcesz dodać ładowarkę
          </div>
        )}

        {/* Filtry */}
        <div style={{
          backgroundColor: 'white',
          padding: '12px',
          borderRadius: '8px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px'
        }}>
          <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#6B7280', marginBottom: '4px' }}>
            Pokaż na mapie:
          </div>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={showParkings}
              onChange={(e) => setShowParkings(e.target.checked)}
              style={{ width: '16px', height: '16px', cursor: 'pointer' }}
            />
            <span style={{ fontSize: '13px' }}>🅿️ Parkingi</span>
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={showCharging}
              onChange={(e) => setShowCharging(e.target.checked)}
              style={{ width: '16px', height: '16px', cursor: 'pointer' }}
            />
            <span style={{ fontSize: '13px' }}>⚡ Ładowarki EV</span>
          </label>
        </div>
      </div>

      {/* Legenda mapy */}
      <div style={{
        position: 'absolute',
        bottom: '30px',
        left: '20px',
        zIndex: 1000,
        backgroundColor: 'white',
        borderRadius: '12px',
        padding: '16px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
        maxWidth: '220px',
        border: '2px solid #E5E7EB'
      }}>
        <h4 style={{
          margin: '0 0 12px 0',
          fontSize: '14px',
          fontWeight: 'bold',
          color: '#1F2937'
        }}>
          📋 Dostępność miejsc
        </h4>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '18px',
              height: '18px',
              borderRadius: '50%',
              background: '#10B981',
              border: '2px solid white',
              boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
            }}></div>
            <span>Dużo miejsc (&gt;50%)</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '18px',
              height: '18px',
              borderRadius: '50%',
              background: '#EAB308',
              border: '2px solid white',
              boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
            }}></div>
            <span>Średnio (25-50%)</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '18px',
              height: '18px',
              borderRadius: '50%',
              background: '#F59E0B',
              border: '2px solid white',
              boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
            }}></div>
            <span>Mało (&lt;25%)</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '18px',
              height: '18px',
              borderRadius: '50%',
              background: '#DC2626',
              border: '2px solid white',
              boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
            }}></div>
            <span>Brak miejsc</span>
          </div>
        </div>
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

        {/* Komponent do klikania na mapę */}
        {(searchMode || addParkingMode || addChargingMode) && <MapClickHandler onMapClick={handleMapClick} />}

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

      {/* Markery parkingów */}
      {showParkings && parkings && parkings.length > 0 && (() => {
        const validParkings = parkings.filter(p => p.latitude && p.longitude);
        console.log(`🗺️ Wyświetlam ${validParkings.length} z ${parkings.length} parkingów na mapie`);
        return validParkings;
      })()
  .map((parking) => (
  <Marker
    key={parking.id}
    position={[parking.latitude, parking.longitude]}
    icon={createParkingIcon(parking)}
  >
    <Popup>
      <div style={{ minWidth: '240px' }}>
        {/* Nagłówek */}
        <h3 style={{
          margin: '0 0 12px 0',
          fontSize: '17px',
          fontWeight: 'bold',
          color: '#1f2937'
        }}>
          {parking.name}
        </h3>

        <p style={{
          fontSize: '13px',
          color: '#6b7280',
          margin: '0 0 12px 0',
          display: 'flex',
          alignItems: 'center',
          gap: '4px'
        }}>
          📍 {parking.address}
        </p>

        {/* Status dostępności z wizualnym wskaźnikiem */}
        <div style={{
          marginBottom: '12px',
          padding: '10px',
          borderRadius: '8px',
          background: parking.available_spots > 0
            ? (parking.available_spots / parking.total_spots > 0.5 ? '#D1FAE5' : '#FEF3C7')
            : '#FEE2E2',
          border: `2px solid ${parking.available_spots > 0
            ? (parking.available_spots / parking.total_spots > 0.5 ? '#10B981' : '#F59E0B')
            : '#DC2626'}`
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <span style={{
              fontSize: '13px',
              fontWeight: 'bold',
              color: parking.available_spots > 0
                ? (parking.available_spots / parking.total_spots > 0.5 ? '#065f46' : '#92400E')
                : '#991b1b'
            }}>
              {parking.available_spots > 0
                ? (parking.available_spots / parking.total_spots > 0.5
                  ? '✅ Dużo wolnych miejsc'
                  : '⚠️ Mało wolnych miejsc')
                : '❌ Brak wolnych miejsc'}
            </span>
            <span style={{
              fontSize: '16px',
              fontWeight: 'bold',
              color: parking.available_spots > 0
                ? (parking.available_spots / parking.total_spots > 0.5 ? '#065f46' : '#92400E')
                : '#991b1b'
            }}>
              {parking.available_spots}/{parking.total_spots}
            </span>
          </div>

          {/* Pasek progresu */}
          <div style={{
            marginTop: '6px',
            height: '6px',
            background: '#E5E7EB',
            borderRadius: '3px',
            overflow: 'hidden'
          }}>
            <div style={{
              height: '100%',
              width: `${(parking.available_spots / parking.total_spots) * 100}%`,
              background: parking.available_spots > 0
                ? (parking.available_spots / parking.total_spots > 0.5 ? '#10B981' : '#F59E0B')
                : '#DC2626',
              transition: 'width 0.3s ease'
            }}></div>
          </div>
        </div>

        {/* Cennik z ikonami */}
        <div style={{
          margin: '12px 0',
          padding: '10px',
          background: '#F9FAFB',
          borderRadius: '8px',
          border: '1px solid #E5E7EB'
        }}>
          <div style={{
            fontSize: '18px',
            fontWeight: 'bold',
            color: '#6366F1',
            marginBottom: '8px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}>
            💳 {parking.price_per_hour} zł/godz
          </div>
          {(parking.price_per_day || parking.price_per_week || parking.price_per_month) && (
            <div style={{
              fontSize: '12px',
              color: '#6b7280',
              lineHeight: '1.6'
            }}>
              {parking.price_per_day && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  ☀️ Dzień: <strong>{parking.price_per_day} zł</strong>
                </div>
              )}
              {parking.price_per_week && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  📅 Tydzień: <strong>{parking.price_per_week} zł</strong>
                </div>
              )}
              {parking.price_per_month && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  📆 Miesiąc: <strong>{parking.price_per_month} zł</strong>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Przyciski akcji */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '12px' }}>
          {parking.available_spots > 0 && (
            <button
              onClick={() => handleReserveClick(parking)}
              style={{
                width: '100%',
                backgroundColor: '#6366F1',
                color: 'white',
                padding: '10px 16px',
                border: 'none',
                borderRadius: '8px',
                fontWeight: 'bold',
                cursor: 'pointer',
                fontSize: '14px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                transition: 'background-color 0.2s'
              }}
              onMouseOver={(e) => e.target.style.backgroundColor = '#4F46E5'}
              onMouseOut={(e) => e.target.style.backgroundColor = '#6366F1'}
            >
              🎫 Zarezerwuj teraz
            </button>
          )}

          <button
            onClick={() => handleReportClick(parking)}
            style={{
              width: '100%',
              backgroundColor: '#10b981',
              color: 'white',
              padding: '10px 16px',
              border: 'none',
              borderRadius: '8px',
              fontWeight: 'bold',
              cursor: 'pointer',
              fontSize: '13px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              transition: 'background-color 0.2s'
            }}
            onMouseOver={(e) => e.target.style.backgroundColor = '#059669'}
            onMouseOut={(e) => e.target.style.backgroundColor = '#10b981'}
          >
            📍 Zgłoś zajętość (CrowdScan)
          </button>
        </div>
      </div>
    </Popup>
  </Marker>
))}

      {/* Markery ładowarek EV */}
      {showCharging && chargingStations && chargingStations.length > 0 && (() => {
        const validStations = chargingStations.filter(s => s.latitude && s.longitude);
        console.log(`⚡ Wyświetlam ${validStations.length} z ${chargingStations.length} ładowarek na mapie`);
        return validStations;
      })()
  .map((station) => (
  <Marker
    key={`charging-${station.id}`}
    position={[station.latitude, station.longitude]}
    icon={createChargingIcon(station)}
  >
    <Popup>
      <div style={{ minWidth: '240px' }}>
        {/* Nagłówek */}
        <h3 style={{
          margin: '0 0 12px 0',
          fontSize: '17px',
          fontWeight: 'bold',
          color: '#1f2937',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          ⚡ {station.name}
        </h3>

        <p style={{
          fontSize: '13px',
          color: '#6b7280',
          margin: '0 0 12px 0',
          display: 'flex',
          alignItems: 'center',
          gap: '4px'
        }}>
          📍 {station.address}
        </p>

        {/* Status dostępności */}
        <div style={{
          marginBottom: '12px',
          padding: '10px',
          borderRadius: '8px',
          background: station.available_connectors > 0
            ? (station.available_connectors / station.total_connectors > 0.5 ? '#D1FAE5' : '#FEF3C7')
            : '#FEE2E2',
          border: `2px solid ${station.available_connectors > 0
            ? (station.available_connectors / station.total_connectors > 0.5 ? '#10B981' : '#F59E0B')
            : '#DC2626'}`
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <span style={{
              fontSize: '13px',
              fontWeight: 'bold',
              color: station.available_connectors > 0
                ? (station.available_connectors / station.total_connectors > 0.5 ? '#065f46' : '#92400E')
                : '#991b1b'
            }}>
              {station.available_connectors > 0
                ? (station.available_connectors / station.total_connectors > 0.5
                  ? '✅ Dużo wolnych złączy'
                  : '⚠️ Mało wolnych złączy')
                : '❌ Brak wolnych złączy'}
            </span>
            <span style={{
              fontSize: '16px',
              fontWeight: 'bold',
              color: station.available_connectors > 0
                ? (station.available_connectors / station.total_connectors > 0.5 ? '#065f46' : '#92400E')
                : '#991b1b'
            }}>
              {station.available_connectors}/{station.total_connectors}
            </span>
          </div>
        </div>

        {/* Specyfikacja */}
        <div style={{
          margin: '12px 0',
          padding: '10px',
          background: '#EFF6FF',
          borderRadius: '8px',
          border: '1px solid #DBEAFE'
        }}>
          <div style={{
            fontSize: '12px',
            color: '#6b7280',
            lineHeight: '1.6'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '4px' }}>
              <strong>Typ:</strong> {station.charger_type === 'AC' ? 'AC (wolne)' : station.charger_type === 'DC_FAST' ? 'DC Fast (szybkie)' : 'Ultra Fast (bardzo szybkie)'}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '4px' }}>
              <strong>Moc:</strong> {station.max_power_kw} kW
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <strong>Złącza:</strong> {station.connector_types?.join(', ') || 'Brak info'}
            </div>
          </div>
        </div>

        {/* Cennik */}
        <div style={{
          margin: '12px 0',
          padding: '10px',
          background: '#F9FAFB',
          borderRadius: '8px',
          border: '1px solid #E5E7EB'
        }}>
          <div style={{
            fontSize: '18px',
            fontWeight: 'bold',
            color: '#F59E0B',
            marginBottom: '8px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}>
            💳 {station.price_per_kwh} zł/kWh
          </div>
          {(station.price_per_minute || station.price_per_session) && (
            <div style={{
              fontSize: '12px',
              color: '#6b7280',
              lineHeight: '1.6'
            }}>
              {station.price_per_minute && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  ⏱️ Minuta: <strong>{station.price_per_minute} zł</strong>
                </div>
              )}
              {station.price_per_session && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  🎫 Sesja: <strong>{station.price_per_session} zł</strong>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Przyciski akcji */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '12px' }}>
          {station.available_connectors > 0 && user && (
            <button
              onClick={() => {
                setSelectedChargingStation(station);
                setShowChargingSessionModal(true);
              }}
              style={{
                width: '100%',
                backgroundColor: '#F59E0B',
                color: 'white',
                padding: '10px 16px',
                border: 'none',
                borderRadius: '8px',
                fontWeight: 'bold',
                cursor: 'pointer',
                fontSize: '14px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                transition: 'background-color 0.2s'
              }}
              onMouseOver={(e) => e.target.style.backgroundColor = '#D97706'}
              onMouseOut={(e) => e.target.style.backgroundColor = '#F59E0B'}
            >
              ⚡ Rozpocznij ładowanie
            </button>
          )}
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

      {showAddParkingModal && newParkingLocation && (
        <AddParkingModal
          latitude={newParkingLocation.lat}
          longitude={newParkingLocation.lng}
          onClose={() => {
            setShowAddParkingModal(false);
            setNewParkingLocation(null);
          }}
          onSuccess={handleAddParkingSuccess}
        />
      )}

      {showAddChargingModal && newChargingLocation && (
        <AddChargingStationModal
          latitude={newChargingLocation.lat}
          longitude={newChargingLocation.lng}
          onClose={() => {
            setShowAddChargingModal(false);
            setNewChargingLocation(null);
          }}
          onSuccess={handleAddChargingSuccess}
        />
      )}

      {showChargingSessionModal && selectedChargingStation && (
        <StartChargingSessionModal
          station={selectedChargingStation}
          onClose={() => {
            setShowChargingSessionModal(false);
            setSelectedChargingStation(null);
          }}
          onSuccess={() => {
            setShowChargingSessionModal(false);
            setSelectedChargingStation(null);
          }}
        />
      )}
    </div>
  );
}

export default MapPage;