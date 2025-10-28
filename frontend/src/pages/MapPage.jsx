// frontend/src/pages/MapPage.jsx

import { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from 'react-leaflet';
import { motion, AnimatePresence } from 'framer-motion';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { parkingAPI } from '../services/api';
import ReservationModal from '../components/ReservationModal';
import ReservationSuccessModal from '../components/ReservationSuccessModal';
import ReservationQRModal from '../components/ReservationQRModal';
import AddParkingModal from '../components/AddParkingModal';
import AddChargingStationModal from '../components/AddChargingStationModal';
import StartChargingSessionModal from '../components/StartChargingSessionModal';
import AdvancedFilters from '../components/AdvancedFilters';
import ParkingSuccessAnimation from '../components/ParkingSuccessAnimation';
import { useAuth } from '../context/AuthContext';
import { useParkingFeed, useChargingFeed } from '../hooks/useWebSocket';
import {
  FaHome,
  FaCog,
  FaArrowLeft,
  FaParking,
  FaMapMarkerAlt,
  FaChargingStation,
  FaCreditCard,
  FaCalendarAlt,
  FaCalendarWeek,
  FaCalendar,
  FaTicketAlt,
  FaBolt,
  FaPlug,
  FaClock,
  FaCheckCircle,
  FaExclamationTriangle,
  FaTimesCircle,
  FaTrophy,
  FaWalking,
  FaRoad,
  FaFilter
} from 'react-icons/fa';

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
  const { t } = useTranslation();
  const map = useMap();

  useEffect(() => {
    if (parkings && parkings.length > 0) {
      const validParkings = parkings.filter(p => p.latitude && p.longitude);

      if (validParkings.length === 0) {
        console.log(t('messages.noParkingsWithCoordinates'));
        return;
      }

      if (validParkings.length === 1) {
        // Pojedynczy parking - wycentruj na nim
        const parking = validParkings[0];
        console.log(t('messages.centeringOnParking'), parking.name, [parking.latitude, parking.longitude]);
        map.setView([parking.latitude, parking.longitude], 15);
      } else {
        // Wiele parkingów - pokaż wszystkie
        const bounds = L.latLngBounds(
          validParkings.map(p => [p.latitude, p.longitude])
        );
        console.log(t('messages.centeringOnAllParkings'), validParkings.length);
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
  const { t } = useTranslation();
  const { user } = useAuth();
  const mapRef = useRef(null);
  const [parkings, setParkings] = useState([]);
  const [chargingStations, setChargingStations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedParking, setSelectedParking] = useState(null);
  const [showReservationModal, setShowReservationModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successReservation, setSuccessReservation] = useState(null);
  const [showQRModal, setShowQRModal] = useState(false);

  // Nowe state dla wyszukiwania destynacji
  const [searchMode, setSearchMode] = useState(false);
  const [destination, setDestination] = useState(null);
  const [recommendedParkings, setRecommendedParkings] = useState([]);
  const [loadingRecommendations, setLoadingRecommendations] = useState(false);

  // Nowe state dla dodawania parkingu
  const [addParkingMode, setAddParkingMode] = useState(false);
  const [newParkingLocation, setNewParkingLocation] = useState(null);
  const [showAddParkingModal, setShowAddParkingModal] = useState(false);
  const [showSuccessAnimation, setShowSuccessAnimation] = useState(false);

  // Nowe state dla dodawania ładowarki
  const [addChargingMode, setAddChargingMode] = useState(false);
  const [newChargingLocation, setNewChargingLocation] = useState(null);
  const [showAddChargingModal, setShowAddChargingModal] = useState(false);
  const [showChargingSessionModal, setShowChargingSessionModal] = useState(false);
  const [selectedChargingStation, setSelectedChargingStation] = useState(null);

  // Filtry
  const [showParkings, setShowParkings] = useState(true);
  const [showCharging, setShowCharging] = useState(true);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [filteredParkings, setFilteredParkings] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // Pobierz parkingi
        const parkingsData = await parkingAPI.getAllParkings();
        console.log(t('messages.chargersLoaded'), parkingsData?.length, 'sztuk');
        setParkings(parkingsData);

        // Pobierz ładowarki
        try {
          const response = await fetch('http://localhost:3000/api/charging-stations');
          const chargingData = await response.json();
          console.log(t('messages.chargersLoaded'), chargingData?.stations?.length, 'sztuk');
          setChargingStations(chargingData.stations || []);
        } catch (err) {
          console.error(t('messages.chargersLoadFailed'), err);
          setChargingStations([]);
        }

        setError(null);
      } catch (err) {
        console.error(t('messages.dataLoadFailed'), err);
        setError(t('errors.loadDataError'));
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // ========== WEBSOCKET LIVE UPDATES ==========

  // Handle parking updates via WebSocket
  const handleParkingUpdate = useCallback((data) => {
    console.log('🔄 Live parking update:', data);

    setParkings(prevParkings => {
      const updatedParkings = prevParkings.map(parking => {
        if (parking.id === data.parkingLotId) {
          return {
            ...parking,
            available_spots: data.availableSpots,
            occupied_spots: data.occupiedSpots,
            total_spots: data.availableSpots + data.occupiedSpots
          };
        }
        return parking;
      });
      return updatedParkings;
    });
  }, []);

  // Handle charging session updates via WebSocket
  const handleChargingUpdate = useCallback((data) => {
    console.log('🔄 Live charging update:', data);

    setChargingStations(prevStations => {
      const updatedStations = prevStations.map(station => {
        if (station.id === data.station_id) {
          // Update available connectors based on session status
          const availableChange = data.status === 'active' ? -1 : 1;
          return {
            ...station,
            available_connectors: Math.max(0, station.available_connectors + availableChange)
          };
        }
        return station;
      });
      return updatedStations;
    });
  }, []);

  // Subscribe to parking feed for live updates
  useParkingFeed(handleParkingUpdate);

  // Subscribe to charging feed for live updates
  useChargingFeed(handleChargingUpdate);

  // ========== END WEBSOCKET ==========

  useEffect(() => {
    if (mapRef.current) {
      setTimeout(() => {
        mapRef.current.invalidateSize();
      }, 100);
    }
  }, []);

  const [isModalOpening, setIsModalOpening] = useState(false);

  const handleReserveClick = (parking) => {
    console.log('🎯 Kliknięto rezerwuj dla:', parking.name);
    setSelectedParking(parking);
    setShowReservationModal(true);
  };

  const handleReservationSuccess = (reservation) => {
    console.log('✅ Rezerwacja sukces:', reservation);
    setShowReservationModal(false);

    // Przygotuj dane dla success modal
    const reservationData = {
      ...reservation,
      parking_lot_name: selectedParking?.name,
      address: selectedParking?.address
    };

    setSuccessReservation(reservationData);
    setShowSuccessModal(true);

    // Odśwież parkingi
    parkingAPI.getAllParkings().then(data => setParkings(data));
  };

  const handleViewQRFromSuccess = () => {
    setShowSuccessModal(false);
    setShowQRModal(true);
  };

  const handleCloseSuccessModal = () => {
    setShowSuccessModal(false);
    setSuccessReservation(null);
  };

  const handleCloseQRModal = () => {
    setShowQRModal(false);
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
        alert(t('messages.noParkingsInRadius'));
      }
    } catch (err) {
      console.error(t('messages.searchingForParkings'), err);
      alert(t('messages.searchParkingsError'));
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
      console.log(t('messages.selectedLocationForParking'), `[${lat}, ${lng}]`);
      setNewParkingLocation({ lat, lng });
      setShowAddParkingModal(true);
      setAddParkingMode(false);
    } else if (addChargingMode) {
      // Tryb dodawania ładowarki
      console.log(t('messages.selectedLocationForCharger'), `[${lat}, ${lng}]`);
      setNewChargingLocation({ lat, lng });
      setShowAddChargingModal(true);
      setAddChargingMode(false);
    }
  };

  const handleToggleAddParkingMode = () => {
    if (!user) {
      alert(t('messages.mustBeLoggedInToAddParking'));
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

    // Show success animation! 🎉
    setShowSuccessAnimation(true);

    // Odśwież parkingi
    parkingAPI.getAllParkings().then(data => setParkings(data));
  };

  const handleToggleAddChargingMode = () => {
    if (!user) {
      alert(t('messages.mustBeLoggedInToAddCharger'));
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
        height: '100vh',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        fontSize: '20px',
        color: '#6366F1'
      }}>
        {t('common.loading')}
      </div>
    );
  }

  return (
    <div style={{ width: '100%', height: '100vh', position: 'relative' }}>
      {/* 🎨 MEGA ANIMACJE CSS - SUPER WIDOCZNE EFEKTY UX */}
      <style>{`
        @keyframes ripple {
          0% {
            transform: scale(0);
            opacity: 0.8;
          }
          100% {
            transform: scale(6);
            opacity: 0;
          }
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        @keyframes superBounce {
          0% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.3);
          }
          70% {
            transform: scale(0.9);
          }
          100% {
            transform: scale(1);
          }
        }

        @keyframes shake {
          0%, 100% { transform: translateX(0) rotate(0deg); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-5px) rotate(-2deg); }
          20%, 40%, 60%, 80% { transform: translateX(5px) rotate(2deg); }
        }

        @keyframes megaGlow {
          0%, 100% {
            box-shadow: 0 0 5px rgba(99, 102, 241, 0.5),
                        0 0 20px rgba(99, 102, 241, 0.4),
                        0 0 40px rgba(99, 102, 241, 0.3);
          }
          50% {
            box-shadow: 0 0 20px rgba(99, 102, 241, 0.8),
                        0 0 60px rgba(99, 102, 241, 0.6),
                        0 0 100px rgba(99, 102, 241, 0.4);
          }
        }

        @keyframes float {
          0%, 100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-10px);
          }
        }

        @keyframes pulse {
          0%, 100% {
            transform: scale(1);
            opacity: 1;
          }
          50% {
            transform: scale(1.1);
            opacity: 0.8;
          }
        }

        @keyframes popupFloat {
          0% {
            opacity: 0;
            transform: translateY(30px) scale(0.8) rotate(-5deg);
          }
          60% {
            transform: translateY(-5px) scale(1.05) rotate(2deg);
          }
          100% {
            opacity: 1;
            transform: translateY(0) scale(1) rotate(0deg);
          }
        }

        @keyframes sparkle {
          0% {
            opacity: 1;
            transform: translate(0, 0) scale(0) rotate(0deg);
          }
          50% {
            opacity: 1;
            transform: translate(var(--tx), var(--ty)) scale(1.5) rotate(180deg);
          }
          100% {
            opacity: 0;
            transform: translate(var(--tx), var(--ty)) scale(0) rotate(360deg);
          }
        }

        @keyframes rainbow {
          0% { filter: hue-rotate(0deg); }
          100% { filter: hue-rotate(360deg); }
        }

        /* 🎯 Stylizacja Leaflet Popup - MEGA EFEKT */
        .leaflet-popup {
          animation: popupFloat 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) !important;
        }

        .leaflet-popup-content-wrapper {
          border-radius: 20px !important;
          box-shadow: 0 30px 90px rgba(0, 0, 0, 0.3),
                      0 0 0 3px rgba(99, 102, 241, 0.3) !important;
          animation: megaGlow 2s infinite ease-in-out !important;
        }

        .leaflet-popup-tip {
          box-shadow: 0 8px 16px rgba(0, 0, 0, 0.2) !important;
        }

        /* 🌟 Sparkle effects */
        .sparkle {
          position: absolute;
          width: 4px;
          height: 4px;
          background: linear-gradient(45deg, #FFD700, #FFA500);
          border-radius: 50%;
          animation: sparkle 1.5s infinite;
          pointer-events: none;
        }
      `}</style>
      {/* Minimal Floating Controls */}
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 1000,
        padding: '20px',
        pointerEvents: 'none'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          maxWidth: '100%'
        }}>
          {/* Powrót do strony głównej - lewy górny róg */}
          <Link to="/" style={{ pointerEvents: 'auto' }}>
            <motion.div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '12px 20px',
                background: 'rgba(255, 255, 255, 0.95)',
                backdropFilter: 'blur(20px)',
                borderRadius: '16px',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                cursor: 'pointer'
              }}
              whileHover={{
                scale: 1.05,
                boxShadow: '0 12px 40px rgba(99, 102, 241, 0.2)'
              }}
              whileTap={{ scale: 0.95 }}
              transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            >
              <FaArrowLeft style={{ fontSize: '16px', color: '#6366F1' }} />
              <span style={{
                fontSize: '15px',
                fontWeight: '600',
                color: '#1F2937'
              }}>
                {t('common.back')}
              </span>
            </motion.div>
          </Link>

          {/* Controls - prawy górny róg */}
          <div style={{ display: 'flex', gap: '12px', pointerEvents: 'auto' }}>
            {/* Filters Button */}
            <motion.div
              onClick={() => setShowAdvancedFilters(true)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '48px',
                height: '48px',
                background: showAdvancedFilters
                  ? 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)'
                  : 'rgba(255, 255, 255, 0.95)',
                backdropFilter: 'blur(20px)',
                borderRadius: '16px',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                cursor: 'pointer'
              }}
              whileHover={{
                scale: 1.1,
                boxShadow: '0 12px 40px rgba(99, 102, 241, 0.2)'
              }}
              whileTap={{ scale: 0.9 }}
              transition={{ type: 'spring', stiffness: 400, damping: 25 }}
              title="Advanced Filters"
            >
              <FaFilter style={{
                fontSize: '18px',
                color: showAdvancedFilters ? 'white' : '#6366F1'
              }} />
            </motion.div>

            {/* Settings */}
            <Link to="/profile">
              <motion.div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '48px',
                  height: '48px',
                  background: 'rgba(255, 255, 255, 0.95)',
                  backdropFilter: 'blur(20px)',
                  borderRadius: '16px',
                  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)',
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                  cursor: 'pointer'
                }}
                whileHover={{
                  scale: 1.1,
                  rotate: 90,
                  boxShadow: '0 12px 40px rgba(99, 102, 241, 0.2)'
                }}
                whileTap={{ scale: 0.9 }}
                transition={{ type: 'spring', stiffness: 400, damping: 25 }}
              >
                <FaCog style={{ fontSize: '20px', color: '#6366F1' }} />
              </motion.div>
            </Link>
          </div>
        </div>
      </div>
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


      {/* Panel z rekomendacjami */}
      {destination && recommendedParkings.length > 0 && (
        <div style={{
          position: 'absolute',
          top: '20px',
          right: '20px',
          zIndex: 1000,
          background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.98) 0%, rgba(249, 250, 251, 0.98) 100%)',
          backdropFilter: 'blur(20px)',
          borderRadius: '16px',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.15)',
          border: '1px solid rgba(255, 255, 255, 0.8)',
          maxWidth: '420px',
          maxHeight: '80vh',
          overflow: 'auto'
        }}>
          <div style={{
            padding: '20px',
            borderBottom: '2px solid rgba(99, 102, 241, 0.1)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            position: 'sticky',
            top: 0,
            background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.98) 0%, rgba(249, 250, 251, 0.98) 100%)',
            backdropFilter: 'blur(20px)',
            borderRadius: '16px 16px 0 0',
            zIndex: 10
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            }}>
              <div style={{
                width: '36px',
                height: '36px',
                background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
                borderRadius: '10px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(245, 158, 11, 0.3)'
              }}>
                <FaTrophy style={{ fontSize: '18px', color: 'white' }} />
              </div>
              <h3 style={{
                margin: 0,
                fontSize: '19px',
                fontWeight: '800',
                background: 'linear-gradient(135deg, #1F2937 0%, #4B5563 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                letterSpacing: '-0.5px'
              }}>
                {t('favorites.title')}
              </h3>
            </div>
            <button
              onClick={handleClearDestination}
              style={{
                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                border: 'none',
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                fontSize: '18px',
                cursor: 'pointer',
                color: '#EF4444',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s',
                fontWeight: 'bold'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.2)';
                e.currentTarget.style.transform = 'scale(1.1)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.1)';
                e.currentTarget.style.transform = 'scale(1)';
              }}
            >
              ✕
            </button>
          </div>

          <div style={{ padding: '16px' }}>
            {recommendedParkings.map((parking, index) => (
              <div
                key={parking.id}
                style={{
                  background: index === 0
                    ? 'linear-gradient(135deg, rgba(245, 158, 11, 0.12) 0%, rgba(217, 119, 6, 0.12) 100%)'
                    : 'rgba(255, 255, 255, 0.6)',
                  border: index === 0
                    ? '2px solid rgba(245, 158, 11, 0.4)'
                    : '1px solid rgba(226, 232, 240, 0.8)',
                  borderRadius: '12px',
                  padding: '14px',
                  marginBottom: '12px',
                  cursor: 'pointer',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  boxShadow: index === 0
                    ? '0 4px 12px rgba(245, 158, 11, 0.15)'
                    : '0 2px 8px rgba(0, 0, 0, 0.05)'
                }}
                onClick={() => {
                  if (mapRef.current) {
                    mapRef.current.setView([parking.latitude, parking.longitude], 16);
                  }
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = index === 0
                    ? '0 8px 20px rgba(245, 158, 11, 0.25)'
                    : '0 6px 16px rgba(0, 0, 0, 0.1)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = index === 0
                    ? '0 4px 12px rgba(245, 158, 11, 0.15)'
                    : '0 2px 8px rgba(0, 0, 0, 0.05)';
                }}
              >
                {index === 0 && (
                  <div style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
                    color: 'white',
                    padding: '5px 10px',
                    borderRadius: '6px',
                    fontSize: '11px',
                    fontWeight: '700',
                    marginBottom: '10px',
                    boxShadow: '0 2px 8px rgba(245, 158, 11, 0.3)',
                    letterSpacing: '0.5px'
                  }}>
                    <FaTrophy style={{ fontSize: '10px' }} />
                    {t('common.yes').toUpperCase()}
                  </div>
                )}

                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  marginBottom: '10px',
                  gap: '8px'
                }}>
                  <h4 style={{
                    margin: 0,
                    fontSize: '16px',
                    fontWeight: '700',
                    color: '#1F2937',
                    letterSpacing: '-0.3px'
                  }}>
                    {index + 1}. {parking.name}
                  </h4>
                  <div style={{
                    background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)',
                    color: 'white',
                    padding: '5px 10px',
                    borderRadius: '8px',
                    fontSize: '13px',
                    fontWeight: '700',
                    whiteSpace: 'nowrap',
                    boxShadow: '0 2px 8px rgba(99, 102, 241, 0.3)'
                  }}>
                    {parking.price_per_hour} zł/h
                  </div>
                </div>

                <p style={{
                  margin: '0 0 12px 0',
                  fontSize: '13px',
                  color: '#6B7280',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}>
                  <FaMapMarkerAlt style={{ fontSize: '11px', color: '#6366F1', flexShrink: 0 }} />
                  {parking.address}
                </p>

                <div style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '8px',
                  marginBottom: '10px',
                  fontSize: '12px'
                }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px',
                    color: '#059669',
                    fontWeight: '600',
                    background: 'rgba(5, 150, 105, 0.08)',
                    padding: '4px 8px',
                    borderRadius: '6px'
                  }}>
                    <FaRoad style={{ fontSize: '11px' }} />
                    {parking.distance} {t('common.km')}
                  </div>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px',
                    color: '#7C3AED',
                    fontWeight: '600',
                    background: 'rgba(124, 58, 237, 0.08)',
                    padding: '4px 8px',
                    borderRadius: '6px'
                  }}>
                    <FaWalking style={{ fontSize: '11px' }} />
                    ~{parking.walkingTime} min
                  </div>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px',
                    color: parking.available_spots > 0 ? '#059669' : '#DC2626',
                    fontWeight: '600',
                    background: parking.available_spots > 0
                      ? 'rgba(5, 150, 105, 0.08)'
                      : 'rgba(220, 38, 38, 0.08)',
                    padding: '4px 8px',
                    borderRadius: '6px'
                  }}>
                    {parking.available_spots > 0 ? (
                      <>
                        <FaCheckCircle style={{ fontSize: '11px' }} />
                        {parking.available_spots} miejsc
                      </>
                    ) : (
                      <>
                        <FaTimesCircle style={{ fontSize: '11px' }} />
                        Brak miejsc
                      </>
                    )}
                  </div>
                </div>

                {parking.available_spots > 0 && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleReserveClick(parking);
                    }}
                    style={{
                      width: '100%',
                      background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)',
                      color: 'white',
                      padding: '10px 16px',
                      border: 'none',
                      borderRadius: '10px',
                      fontWeight: '700',
                      cursor: 'pointer',
                      fontSize: '14px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                      boxShadow: '0 4px 12px rgba(99, 102, 241, 0.25)',
                      letterSpacing: '0.3px'
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      e.currentTarget.style.boxShadow = '0 6px 16px rgba(99, 102, 241, 0.35)';
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = '0 4px 12px rgba(99, 102, 241, 0.25)';
                    }}
                  >
                    <FaTicketAlt style={{ fontSize: '13px' }} />
                    {t('reservations.reserveNow')}
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
              <div style={{
                minWidth: '200px',
                textAlign: 'center',
                background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(249, 250, 251, 0.95) 100%)',
                backdropFilter: 'blur(20px)',
                borderRadius: '12px',
                padding: '16px',
                boxShadow: '0 8px 24px rgba(0, 0, 0, 0.12)',
                border: '1px solid rgba(255, 255, 255, 0.8)'
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  marginBottom: '12px'
                }}>
                  <div style={{
                    width: '32px',
                    height: '32px',
                    background: 'linear-gradient(135deg, #DC2626 0%, #B91C1C 100%)',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 4px 12px rgba(220, 38, 38, 0.3)'
                  }}>
                    <FaMapMarkerAlt style={{ fontSize: '16px', color: 'white' }} />
                  </div>
                  <h3 style={{
                    margin: 0,
                    fontSize: '16px',
                    fontWeight: '700',
                    color: '#1f2937',
                    letterSpacing: '-0.3px'
                  }}>
                    {t('common.destination')}
                  </h3>
                </div>
                <p style={{
                  margin: 0,
                  fontSize: '13px',
                  color: '#6B7280',
                  background: 'rgba(99, 102, 241, 0.05)',
                  padding: '8px 12px',
                  borderRadius: '8px',
                  fontFamily: 'monospace'
                }}>
                  {destination.lat.toFixed(5)}, {destination.lng.toFixed(5)}
                </p>
              </div>
            </Popup>
          </Marker>
        )}

        {/* Animated Marker for New Parking Location 🎯✨ */}
        {newParkingLocation && (
          <Marker
            position={[newParkingLocation.lat, newParkingLocation.lng]}
            icon={L.divIcon({
              html: `
                <div style="position: relative; width: 40px; height: 40px;">
                  <div class="pulse-ring"></div>
                  <div class="pulse-ring" style="animation-delay: 0.4s;"></div>
                  <div class="pulse-ring" style="animation-delay: 0.8s;"></div>
                  <div class="pulse-dot"></div>
                </div>
                <style>
                  @keyframes pulse {
                    0% { transform: translate(-50%, -50%) scale(0); opacity: 0.6; }
                    50% { opacity: 0.3; }
                    100% { transform: translate(-50%, -50%) scale(3); opacity: 0; }
                  }
                  @keyframes glow {
                    0%, 100% { box-shadow: 0 0 20px rgba(99, 102, 241, 0.4); transform: translate(-50%, -50%) scale(1); }
                    50% { box-shadow: 0 0 40px rgba(99, 102, 241, 0.6); transform: translate(-50%, -50%) scale(1.2); }
                  }
                  .pulse-ring {
                    position: absolute;
                    top: 50%;
                    left: 50%;
                    width: 100%;
                    height: 100%;
                    border-radius: 50%;
                    border: 3px solid #6366F1;
                    animation: pulse 2s infinite ease-out;
                    pointer-events: none;
                  }
                  .pulse-dot {
                    position: absolute;
                    top: 50%;
                    left: 50%;
                    width: 20px;
                    height: 20px;
                    background: linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%);
                    border-radius: 50%;
                    border: 3px solid white;
                    animation: glow 1.5s infinite ease-in-out;
                    z-index: 1;
                    cursor: pointer;
                  }
                </style>
              `,
              className: '',
              iconSize: [40, 40],
              iconAnchor: [20, 20],
              popupAnchor: [0, -20]
            })}
          >
            <Popup>
              <div style={{
                minWidth: '220px',
                textAlign: 'center',
                background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.95) 0%, rgba(139, 92, 246, 0.95) 100%)',
                backdropFilter: 'blur(20px)',
                borderRadius: '12px',
                padding: '16px',
                boxShadow: '0 8px 24px rgba(99, 102, 241, 0.4)',
                border: '2px solid rgba(255, 255, 255, 0.3)',
                color: 'white'
              }}>
                <div style={{
                  fontSize: '32px',
                  marginBottom: '8px'
                }}>
                  🅿️✨
                </div>
                <h3 style={{
                  margin: '0 0 8px 0',
                  fontSize: '18px',
                  fontWeight: '700',
                  textShadow: '0 2px 4px rgba(0,0,0,0.2)'
                }}>
                  Nowa lokalizacja parkingu!
                </h3>
                <p style={{
                  margin: 0,
                  fontSize: '12px',
                  opacity: 0.9,
                  background: 'rgba(255, 255, 255, 0.2)',
                  padding: '6px 12px',
                  borderRadius: '6px',
                  fontFamily: 'monospace'
                }}>
                  {newParkingLocation.lat.toFixed(5)}, {newParkingLocation.lng.toFixed(5)}
                </p>
              </div>
            </Popup>
          </Marker>
        )}

      {/* Markery parkingów */}
      {showParkings && parkings && parkings.length > 0 && (() => {
        // Use filtered parkings if available, otherwise use all parkings
        const parkingsToDisplay = filteredParkings.length > 0 ? filteredParkings : parkings;
        const validParkings = parkingsToDisplay.filter(p => p.latitude && p.longitude);
        console.log(`🗺️ Wyświetlam ${validParkings.length} z ${parkingsToDisplay.length} parkingów na mapie`);
        return validParkings;
      })()
  .map((parking) => (
  <Marker
    key={parking.id}
    position={[parking.latitude, parking.longitude]}
    icon={createParkingIcon(parking)}
  >
    <Popup>
      <div style={{
        minWidth: '280px',
        background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(249, 250, 251, 0.95) 100%)',
        backdropFilter: 'blur(20px)',
        borderRadius: '16px',
        padding: '16px',
        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.15)',
        border: '1px solid rgba(255, 255, 255, 0.8)'
      }}>
        {/* Nagłówek z ikoną */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          marginBottom: '16px',
          paddingBottom: '12px',
          borderBottom: '2px solid rgba(99, 102, 241, 0.1)'
        }}>
          <div style={{
            width: '44px',
            height: '44px',
            background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)',
            borderRadius: '14px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 0 4px rgba(99, 102, 241, 0.2), 0 8px 16px rgba(99, 102, 241, 0.4)',
            animation: 'pulse 2s infinite, float 3s infinite ease-in-out'
          }}>
            <FaParking style={{ fontSize: '22px', color: 'white' }} />
          </div>
          <div style={{ flex: 1 }}>
            <h3 style={{
              margin: 0,
              fontSize: '18px',
              fontWeight: '700',
              color: '#1f2937',
              letterSpacing: '-0.5px'
            }}>
              {parking.name}
            </h3>
          </div>
        </div>

        {/* Adres */}
        <div style={{
          fontSize: '13px',
          color: '#6b7280',
          margin: '0 0 12px 0',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '8px 12px',
          background: 'rgba(99, 102, 241, 0.05)',
          borderRadius: '8px'
        }}>
          <FaMapMarkerAlt style={{ fontSize: '14px', color: '#6366F1', flexShrink: 0 }} />
          <span>{parking.address}</span>
        </div>

        {/* Typ parkingu / Amenities Badge */}
        {parking.type && (
          <div style={{
            marginBottom: '16px',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '6px 12px',
            borderRadius: '8px',
            fontSize: '12px',
            fontWeight: '600',
            background: parking.type === 'covered'
              ? 'linear-gradient(135deg, rgba(59, 130, 246, 0.15) 0%, rgba(37, 99, 235, 0.15) 100%)'
              : parking.type === 'ev_charging'
              ? 'linear-gradient(135deg, rgba(245, 158, 11, 0.15) 0%, rgba(217, 119, 6, 0.15) 100%)'
              : 'linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(5, 150, 105, 0.15) 100%)',
            border: `2px solid ${
              parking.type === 'covered'
                ? 'rgba(59, 130, 246, 0.3)'
                : parking.type === 'ev_charging'
                ? 'rgba(245, 158, 11, 0.3)'
                : 'rgba(16, 185, 129, 0.3)'
            }`,
            color: parking.type === 'covered'
              ? '#1e40af'
              : parking.type === 'ev_charging'
              ? '#92400e'
              : '#065f46'
          }}>
            <span style={{ fontSize: '14px' }}>
              {parking.type === 'covered' ? '☂️' : parking.type === 'ev_charging' ? '⚡' : '☀️'}
            </span>
            <span>
              {parking.type === 'covered'
                ? 'Zadaszony'
                : parking.type === 'ev_charging'
                ? 'Z ładowarką EV'
                : 'Odkryty'}
            </span>
          </div>
        )}

        {/* Status dostępności z wizualnym wskaźnikiem */}
        <div style={{
          marginBottom: '16px',
          padding: '14px',
          borderRadius: '12px',
          background: parking.available_spots > 0
            ? (parking.available_spots / parking.total_spots > 0.5
              ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(5, 150, 105, 0.1) 100%)'
              : 'linear-gradient(135deg, rgba(245, 158, 11, 0.1) 0%, rgba(217, 119, 6, 0.1) 100%)')
            : 'linear-gradient(135deg, rgba(220, 38, 38, 0.1) 0%, rgba(185, 28, 28, 0.1) 100%)',
          border: `2px solid ${parking.available_spots > 0
            ? (parking.available_spots / parking.total_spots > 0.5 ? 'rgba(16, 185, 129, 0.3)' : 'rgba(245, 158, 11, 0.3)')
            : 'rgba(220, 38, 38, 0.3)'}`,
          boxShadow: parking.available_spots > 0
            ? (parking.available_spots / parking.total_spots > 0.5
              ? '0 4px 12px rgba(16, 185, 129, 0.1)'
              : '0 4px 12px rgba(245, 158, 11, 0.1)')
            : '0 4px 12px rgba(220, 38, 38, 0.1)'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '10px'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              {parking.available_spots > 0
                ? (parking.available_spots / parking.total_spots > 0.5
                  ? <FaCheckCircle style={{ fontSize: '16px', color: '#10B981' }} />
                  : <FaExclamationTriangle style={{ fontSize: '16px', color: '#F59E0B' }} />)
                : <FaTimesCircle style={{ fontSize: '16px', color: '#DC2626' }} />}
              <span style={{
                fontSize: '14px',
                fontWeight: '700',
                color: parking.available_spots > 0
                  ? (parking.available_spots / parking.total_spots > 0.5 ? '#065f46' : '#92400E')
                  : '#991b1b'
              }}>
                {parking.available_spots > 0
                  ? (parking.available_spots / parking.total_spots > 0.5
                    ? t('parking.manyAvailableSpots')
                    : t('parking.fewAvailableSpots'))
                  : t('parking.noAvailableSpots')}
              </span>
            </div>
            <div style={{
              background: parking.available_spots > 0
                ? (parking.available_spots / parking.total_spots > 0.5 ? '#10B981' : '#F59E0B')
                : '#DC2626',
              color: 'white',
              padding: '4px 12px',
              borderRadius: '8px',
              fontSize: '15px',
              fontWeight: '700',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)'
            }}>
              {parking.available_spots}/{parking.total_spots}
            </div>
          </div>

          {/* Pasek progresu */}
          <div style={{
            height: '8px',
            background: 'rgba(0, 0, 0, 0.08)',
            borderRadius: '4px',
            overflow: 'hidden',
            boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.06)'
          }}>
            <div style={{
              height: '100%',
              width: `${(parking.available_spots / parking.total_spots) * 100}%`,
              background: parking.available_spots > 0
                ? (parking.available_spots / parking.total_spots > 0.5
                  ? 'linear-gradient(90deg, #10B981 0%, #059669 100%)'
                  : 'linear-gradient(90deg, #F59E0B 0%, #D97706 100%)')
                : 'linear-gradient(90deg, #DC2626 0%, #B91C1C 100%)',
              transition: 'width 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
              boxShadow: '0 0 8px rgba(255, 255, 255, 0.5)'
            }}></div>
          </div>
        </div>

        {/* Cennik z ikonami */}
        <div style={{
          margin: '0 0 16px 0',
          padding: '14px',
          background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.08) 0%, rgba(139, 92, 246, 0.08) 100%)',
          borderRadius: '12px',
          border: '2px solid rgba(99, 102, 241, 0.2)',
          boxShadow: '0 4px 12px rgba(99, 102, 241, 0.08)'
        }}>
          <div style={{
            fontSize: '20px',
            fontWeight: '800',
            background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            marginBottom: '10px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <FaCreditCard style={{ fontSize: '18px', color: '#6366F1' }} />
            <span>{parking.price_per_hour} zł/godz</span>
          </div>
          {(parking.price_per_day || parking.price_per_week || parking.price_per_month) && (
            <div style={{
              fontSize: '13px',
              color: '#6b7280',
              lineHeight: '1.8',
              marginTop: '8px',
              paddingTop: '8px',
              borderTop: '1px solid rgba(99, 102, 241, 0.1)'
            }}>
              {parking.price_per_day && (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  marginBottom: '4px'
                }}>
                  <FaCalendarAlt style={{ fontSize: '12px', color: '#6366F1', flexShrink: 0 }} />
                  <span>Dzień: <strong style={{ color: '#1F2937' }}>{parking.price_per_day} zł</strong></span>
                </div>
              )}
              {parking.price_per_week && (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  marginBottom: '4px'
                }}>
                  <FaCalendarWeek style={{ fontSize: '12px', color: '#6366F1', flexShrink: 0 }} />
                  <span>Tydzień: <strong style={{ color: '#1F2937' }}>{parking.price_per_week} zł</strong></span>
                </div>
              )}
              {parking.price_per_month && (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <FaCalendar style={{ fontSize: '12px', color: '#6366F1', flexShrink: 0 }} />
                  <span>Miesiąc: <strong style={{ color: '#1F2937' }}>{parking.price_per_month} zł</strong></span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Przyciski akcji */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {parking.available_spots > 0 && (
            <button
              onClick={(e) => {
                // 🎯 NAJPIERW otwórz modal - to najważniejsze!
                handleReserveClick(parking);

                // 💥 POTEM animacje - jeśli się wywali, modal już jest otwarty
                try {
                  const button = e.currentTarget;

                  // 💥 MEGA EFEKT RIPPLE
                  const ripple = document.createElement('span');
                  const rect = button.getBoundingClientRect();
                  const size = Math.max(rect.width, rect.height) * 2;
                  const x = e.clientX - rect.left - size / 2;
                  const y = e.clientY - rect.top - size / 2;

                  ripple.style.width = ripple.style.height = size + 'px';
                  ripple.style.left = x + 'px';
                  ripple.style.top = y + 'px';
                  ripple.style.position = 'absolute';
                  ripple.style.borderRadius = '50%';
                  ripple.style.background = 'radial-gradient(circle, rgba(255,255,255,0.8) 0%, rgba(255,255,255,0) 70%)';
                  ripple.style.transform = 'scale(0)';
                  ripple.style.animation = 'ripple 1s ease-out';
                  ripple.style.pointerEvents = 'none';
                  ripple.style.zIndex = '10';

                  button.style.position = 'relative';
                  button.style.overflow = 'hidden';
                  button.appendChild(ripple);

                  // ✨ DODAJ SPARKLES - PARTICLE EFFECTS!
                  for (let i = 0; i < 12; i++) {
                    const sparkle = document.createElement('div');
                    sparkle.className = 'sparkle';
                    const angle = (Math.PI * 2 * i) / 12;
                    const distance = 50 + Math.random() * 30;
                    sparkle.style.left = (e.clientX - rect.left) + 'px';
                    sparkle.style.top = (e.clientY - rect.top) + 'px';
                    sparkle.style.setProperty('--tx', `${Math.cos(angle) * distance}px`);
                    sparkle.style.setProperty('--ty', `${Math.sin(angle) * distance}px`);
                    sparkle.style.animation = `sparkle 0.8s ease-out ${i * 0.05}s`;

                    button.appendChild(sparkle);
                    setTimeout(() => {
                      try { sparkle.remove(); } catch(e) {}
                    }, 1000);
                  }

                  // 🎯 SHAKE + BOUNCE ANIMATION
                  button.style.animation = 'shake 0.5s, superBounce 0.6s';
                  setTimeout(() => {
                    try {
                      button.style.animation = '';
                      ripple.remove();
                    } catch(e) {}
                  }, 600);
                } catch (error) {
                  console.log('⚠️ Animacja error (nie blokuje):', error);
                }
              }}
              disabled={isModalOpening}
              style={{
                width: '100%',
                background: isModalOpening
                  ? 'linear-gradient(135deg, #9333EA 0%, #C026D3 100%)'
                  : 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)',
                color: 'white',
                padding: '14px 24px',
                border: 'none',
                borderRadius: '14px',
                fontWeight: '700',
                cursor: isModalOpening ? 'wait' : 'pointer',
                fontSize: '15px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '10px',
                transition: 'all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
                boxShadow: isModalOpening
                  ? '0 8px 32px rgba(147, 51, 234, 0.5)'
                  : '0 4px 16px rgba(99, 102, 241, 0.4)',
                letterSpacing: '0.5px',
                position: 'relative',
                overflow: 'hidden',
                transform: isModalOpening ? 'scale(0.98)' : 'scale(1)'
              }}
              onMouseOver={(e) => {
                if (!isModalOpening) {
                  e.currentTarget.style.transform = 'translateY(-8px) scale(1.08)';
                  e.currentTarget.style.boxShadow = '0 20px 60px rgba(99, 102, 241, 0.8), 0 0 0 4px rgba(99, 102, 241, 0.3)';
                  e.currentTarget.style.filter = 'brightness(1.15)';
                  e.currentTarget.style.animation = 'pulse 0.8s infinite';

                  // Animacja ikony
                  const icon = e.currentTarget.querySelector('svg');
                  if (icon) {
                    icon.style.animation = 'shake 0.5s';
                    setTimeout(() => { if(icon) icon.style.animation = ''; }, 500);
                  }
                }
              }}
              onMouseOut={(e) => {
                if (!isModalOpening) {
                  e.currentTarget.style.transform = 'translateY(0) scale(1)';
                  e.currentTarget.style.boxShadow = '0 4px 16px rgba(99, 102, 241, 0.4)';
                  e.currentTarget.style.filter = 'brightness(1)';
                  e.currentTarget.style.animation = '';
                }
              }}
            >
              {isModalOpening ? (
                <>
                  <div style={{
                    width: '18px',
                    height: '18px',
                    border: '3px solid rgba(255, 255, 255, 0.3)',
                    borderTop: '3px solid white',
                    borderRadius: '50%',
                    animation: 'spin 0.8s linear infinite'
                  }} />
                  <span>{t('common.loading')}...</span>
                </>
              ) : (
                <>
                  <FaTicketAlt style={{ fontSize: '18px' }} />
                  <span>{t('reservations.reserveNow')}</span>
                </>
              )}
            </button>
          )}
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
      <div style={{
        minWidth: '280px',
        background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(249, 250, 251, 0.95) 100%)',
        backdropFilter: 'blur(20px)',
        borderRadius: '16px',
        padding: '16px',
        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.15)',
        border: '1px solid rgba(255, 255, 255, 0.8)'
      }}>
        {/* Nagłówek z ikoną */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          marginBottom: '16px',
          paddingBottom: '12px',
          borderBottom: '2px solid rgba(245, 158, 11, 0.1)'
        }}>
          <div style={{
            width: '40px',
            height: '40px',
            background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(245, 158, 11, 0.3)'
          }}>
            <FaBolt style={{ fontSize: '20px', color: 'white' }} />
          </div>
          <div style={{ flex: 1 }}>
            <h3 style={{
              margin: 0,
              fontSize: '18px',
              fontWeight: '700',
              color: '#1f2937',
              letterSpacing: '-0.5px'
            }}>
              {station.name}
            </h3>
          </div>
        </div>

        {/* Adres */}
        <div style={{
          fontSize: '13px',
          color: '#6b7280',
          margin: '0 0 16px 0',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '8px 12px',
          background: 'rgba(245, 158, 11, 0.05)',
          borderRadius: '8px'
        }}>
          <FaMapMarkerAlt style={{ fontSize: '14px', color: '#F59E0B', flexShrink: 0 }} />
          <span>{station.address}</span>
        </div>

        {/* Status dostępności */}
        <div style={{
          marginBottom: '16px',
          padding: '14px',
          borderRadius: '12px',
          background: station.available_connectors > 0
            ? (station.available_connectors / station.total_connectors > 0.5
              ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(5, 150, 105, 0.1) 100%)'
              : 'linear-gradient(135deg, rgba(245, 158, 11, 0.1) 0%, rgba(217, 119, 6, 0.1) 100%)')
            : 'linear-gradient(135deg, rgba(220, 38, 38, 0.1) 0%, rgba(185, 28, 28, 0.1) 100%)',
          border: `2px solid ${station.available_connectors > 0
            ? (station.available_connectors / station.total_connectors > 0.5 ? 'rgba(16, 185, 129, 0.3)' : 'rgba(245, 158, 11, 0.3)')
            : 'rgba(220, 38, 38, 0.3)'}`,
          boxShadow: station.available_connectors > 0
            ? (station.available_connectors / station.total_connectors > 0.5
              ? '0 4px 12px rgba(16, 185, 129, 0.1)'
              : '0 4px 12px rgba(245, 158, 11, 0.1)')
            : '0 4px 12px rgba(220, 38, 38, 0.1)'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              {station.available_connectors > 0
                ? (station.available_connectors / station.total_connectors > 0.5
                  ? <FaCheckCircle style={{ fontSize: '16px', color: '#10B981' }} />
                  : <FaExclamationTriangle style={{ fontSize: '16px', color: '#F59E0B' }} />)
                : <FaTimesCircle style={{ fontSize: '16px', color: '#DC2626' }} />}
              <span style={{
                fontSize: '14px',
                fontWeight: '700',
                color: station.available_connectors > 0
                  ? (station.available_connectors / station.total_connectors > 0.5 ? '#065f46' : '#92400E')
                  : '#991b1b'
              }}>
                {station.available_connectors > 0
                  ? (station.available_connectors / station.total_connectors > 0.5
                    ? t('charging.manyAvailableConnectors')
                    : t('charging.fewAvailableConnectors'))
                  : t('charging.noAvailableConnectors')}
              </span>
            </div>
            <div style={{
              background: station.available_connectors > 0
                ? (station.available_connectors / station.total_connectors > 0.5 ? '#10B981' : '#F59E0B')
                : '#DC2626',
              color: 'white',
              padding: '4px 12px',
              borderRadius: '8px',
              fontSize: '15px',
              fontWeight: '700',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)'
            }}>
              {station.available_connectors}/{station.total_connectors}
            </div>
          </div>
        </div>

        {/* Specyfikacja */}
        <div style={{
          margin: '0 0 16px 0',
          padding: '14px',
          background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.08) 0%, rgba(37, 99, 235, 0.08) 100%)',
          borderRadius: '12px',
          border: '2px solid rgba(59, 130, 246, 0.2)',
          boxShadow: '0 4px 12px rgba(59, 130, 246, 0.08)'
        }}>
          <div style={{
            fontSize: '13px',
            color: '#4B5563',
            lineHeight: '1.8'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginBottom: '8px',
              padding: '6px 0'
            }}>
              <FaChargingStation style={{ fontSize: '14px', color: '#3B82F6', flexShrink: 0 }} />
              <span><strong style={{ color: '#1F2937' }}>Typ:</strong> {station.charger_type === 'AC' ? 'AC (wolne)' : station.charger_type === 'DC_FAST' ? 'DC Fast (szybkie)' : 'Ultra Fast (bardzo szybkie)'}</span>
            </div>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginBottom: '8px',
              padding: '6px 0'
            }}>
              <FaBolt style={{ fontSize: '14px', color: '#3B82F6', flexShrink: 0 }} />
              <span><strong style={{ color: '#1F2937' }}>Moc:</strong> {station.max_power_kw} kW</span>
            </div>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '6px 0'
            }}>
              <FaPlug style={{ fontSize: '14px', color: '#3B82F6', flexShrink: 0 }} />
              <span><strong style={{ color: '#1F2937' }}>Złącza:</strong> {station.connector_types?.join(', ') || 'Brak info'}</span>
            </div>
          </div>
        </div>

        {/* Cennik */}
        <div style={{
          margin: '0 0 16px 0',
          padding: '14px',
          background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.08) 0%, rgba(217, 119, 6, 0.08) 100%)',
          borderRadius: '12px',
          border: '2px solid rgba(245, 158, 11, 0.2)',
          boxShadow: '0 4px 12px rgba(245, 158, 11, 0.08)'
        }}>
          <div style={{
            fontSize: '20px',
            fontWeight: '800',
            background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            marginBottom: '10px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <FaCreditCard style={{ fontSize: '18px', color: '#F59E0B' }} />
            <span>{station.price_per_kwh} zł/kWh</span>
          </div>
          {(station.price_per_minute || station.price_per_session) && (
            <div style={{
              fontSize: '13px',
              color: '#6b7280',
              lineHeight: '1.8',
              marginTop: '8px',
              paddingTop: '8px',
              borderTop: '1px solid rgba(245, 158, 11, 0.1)'
            }}>
              {station.price_per_minute && (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  marginBottom: '4px'
                }}>
                  <FaClock style={{ fontSize: '12px', color: '#F59E0B', flexShrink: 0 }} />
                  <span>Minuta: <strong style={{ color: '#1F2937' }}>{station.price_per_minute} zł</strong></span>
                </div>
              )}
              {station.price_per_session && (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <FaTicketAlt style={{ fontSize: '12px', color: '#F59E0B', flexShrink: 0 }} />
                  <span>Sesja: <strong style={{ color: '#1F2937' }}>{station.price_per_session} zł</strong></span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Przyciski akcji */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {station.available_connectors > 0 && user && (
            <button
              onClick={() => {
                setSelectedChargingStation(station);
                setShowChargingSessionModal(true);
              }}
              style={{
                width: '100%',
                background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
                color: 'white',
                padding: '12px 20px',
                border: 'none',
                borderRadius: '12px',
                fontWeight: '700',
                cursor: 'pointer',
                fontSize: '15px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                boxShadow: '0 4px 12px rgba(245, 158, 11, 0.3)',
                letterSpacing: '0.3px'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 6px 20px rgba(245, 158, 11, 0.4)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(245, 158, 11, 0.3)';
              }}
            >
              <FaBolt style={{ fontSize: '16px' }} />
              <span>{t('charging.startCharging')}</span>
            </button>
          )}
        </div>
      </div>
    </Popup>
  </Marker>
))}
      </MapContainer>

      {/* Floating Action Buttons - Prawy dolny róg */}
      <div style={{
        position: 'fixed',
        bottom: '30px',
        right: '30px',
        zIndex: 1000,
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        pointerEvents: 'none'
      }}>
        {/* Add Parking Button */}
        <motion.button
          onClick={handleToggleAddParkingMode}
          style={{
            width: '60px',
            height: '60px',
            borderRadius: '50%',
            border: 'none',
            background: addParkingMode
              ? 'linear-gradient(135deg, #10B981 0%, #059669 100%)'
              : 'linear-gradient(135deg, #6366F1 0%, #4F46E5 100%)',
            color: 'white',
            fontSize: '24px',
            cursor: 'pointer',
            boxShadow: '0 8px 32px rgba(99, 102, 241, 0.4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            pointerEvents: 'auto',
            position: 'relative'
          }}
          whileHover={{
            scale: 1.1,
            boxShadow: '0 12px 40px rgba(99, 102, 241, 0.5)'
          }}
          whileTap={{ scale: 0.9 }}
          transition={{ type: 'spring', stiffness: 400, damping: 25 }}
          title={addParkingMode ? t('modals.cancelAddParking') : t('parking.addParking')}
        >
          <FaParking />
          {addParkingMode && (
            <div style={{
              position: 'absolute',
              top: '-8px',
              right: '-8px',
              width: '24px',
              height: '24px',
              borderRadius: '50%',
              background: '#EF4444',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '14px',
              fontWeight: 'bold'
            }}>
              ×
            </div>
          )}
        </motion.button>

        {/* Add Charging Station Button */}
        <motion.button
          onClick={handleToggleAddChargingMode}
          style={{
            width: '60px',
            height: '60px',
            borderRadius: '50%',
            border: 'none',
            background: addChargingMode
              ? 'linear-gradient(135deg, #10B981 0%, #059669 100%)'
              : 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
            color: 'white',
            fontSize: '24px',
            cursor: 'pointer',
            boxShadow: '0 8px 32px rgba(245, 158, 11, 0.4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            pointerEvents: 'auto',
            position: 'relative'
          }}
          whileHover={{
            scale: 1.1,
            boxShadow: '0 12px 40px rgba(245, 158, 11, 0.5)'
          }}
          whileTap={{ scale: 0.9 }}
          transition={{ type: 'spring', stiffness: 400, damping: 25 }}
          title={addChargingMode ? t('modals.cancelAddCharger') : t('modals.addChargingStation')}
        >
          <FaChargingStation />
          {addChargingMode && (
            <div style={{
              position: 'absolute',
              top: '-8px',
              right: '-8px',
              width: '24px',
              height: '24px',
              borderRadius: '50%',
              background: '#EF4444',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '14px',
              fontWeight: 'bold'
            }}>
              ×
            </div>
          )}
        </motion.button>

        {/* Helper text */}
        {(addParkingMode || addChargingMode) && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            style={{
              position: 'absolute',
              right: '75px',
              top: '50%',
              transform: 'translateY(-50%)',
              padding: '12px 16px',
              background: 'rgba(0, 0, 0, 0.85)',
              backdropFilter: 'blur(10px)',
              color: 'white',
              borderRadius: '12px',
              fontSize: '14px',
              fontWeight: '500',
              whiteSpace: 'nowrap',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
              pointerEvents: 'none'
            }}
          >
            {addParkingMode ? t('modals.clickMapToAddParking') : t('modals.clickMapToAddCharger')}
          </motion.div>
        )}
      </div>

      {showReservationModal && selectedParking && (
        <ReservationModal
          parking={selectedParking}
          onClose={() => setShowReservationModal(false)}
          onSuccess={handleReservationSuccess}
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

      {showSuccessModal && successReservation && (
        <ReservationSuccessModal
          reservation={successReservation}
          onClose={handleCloseSuccessModal}
          onViewQR={handleViewQRFromSuccess}
        />
      )}

      {showQRModal && successReservation && (
        <ReservationQRModal
          reservation={successReservation}
          onClose={handleCloseQRModal}
        />
      )}

      {showAdvancedFilters && (
        <AdvancedFilters
          parkings={parkings}
          isOpen={showAdvancedFilters}
          onClose={() => setShowAdvancedFilters(false)}
          onFilterChange={setFilteredParkings}
        />
      )}

      {/* Success Animation - The WOW Effect! ✨🎉 */}
      <ParkingSuccessAnimation
        show={showSuccessAnimation}
        onComplete={() => setShowSuccessAnimation(false)}
      />
    </div>
  );
}

export default MapPage;