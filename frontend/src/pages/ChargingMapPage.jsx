// frontend/src/pages/ChargingMapPage.jsx

import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { motion } from 'framer-motion';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useChargingFeed } from '../hooks/useWebSocket';
import { useAuth } from '../context/AuthContext';
import {
  FaHome,
  FaArrowLeft,
  FaChargingStation,
  FaBolt,
  FaPlug,
  FaCheckCircle,
  FaExclamationTriangle,
  FaClock,
  FaMapMarkerAlt,
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

// Custom marker for charging stations
function createChargingIcon(station) {
  const availabilityPercent = station.total_connectors > 0
    ? (station.available_connectors / station.total_connectors) * 100
    : 0;

  let color;
  if (station.available_connectors === 0) {
    color = '#DC2626'; // Red - no connectors
  } else if (availabilityPercent < 25) {
    color = '#F59E0B'; // Orange - few connectors
  } else if (availabilityPercent < 50) {
    color = '#EAB308'; // Yellow - medium connectors
  } else {
    color = '#10B981'; // Green - many connectors
  }

  // Icon based on connector type
  let iconSymbol = '⚡';
  if (station.connector_type === 'chademo') iconSymbol = '🔌';
  else if (station.connector_type === 'ccs') iconSymbol = '⚡';
  else if (station.connector_type === 'type2') iconSymbol = '🔋';

  const html = `
    <div style="
      width: 36px;
      height: 36px;
      background: ${color};
      border: 3px solid white;
      border-radius: 8px;
      transform: rotate(45deg);
      box-shadow: 0 4px 10px rgba(0,0,0,0.3);
      transition: all 0.2s ease;
      display: flex;
      align-items: center;
      justify-content: center;
    ">
      <div style="
        transform: rotate(-45deg);
        font-size: 18px;
        line-height: 1;
      ">
        ${iconSymbol}
      </div>
    </div>
  `;

  return L.divIcon({
    html: html,
    className: 'custom-charging-marker',
    iconSize: [36, 36],
    iconAnchor: [18, 36],
    popupAnchor: [0, -36]
  });
}

// Auto-center component
function AutoCenter({ stations }) {
  const map = useMap();

  useEffect(() => {
    if (stations && stations.length > 0) {
      const validStations = stations.filter(s => s.latitude && s.longitude);

      if (validStations.length === 0) return;

      if (validStations.length === 1) {
        const station = validStations[0];
        map.setView([station.latitude, station.longitude], 15);
      } else {
        const bounds = L.latLngBounds(
          validStations.map(s => [s.latitude, s.longitude])
        );
        map.fitBounds(bounds, { padding: [50, 50] });
      }
    }
  }, [stations, map]);

  return null;
}

function ChargingMapPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stations, setStations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedStation, setSelectedStation] = useState(null);
  const [showFilters, setShowFilters] = useState(false);

  // Filters
  const [filters, setFilters] = useState({
    connectorType: 'all', // all, type2, ccs, chademo
    availability: 'all', // all, available, busy
    powerOutput: 'all', // all, slow, fast, rapid
    operatorName: ''
  });

  useEffect(() => {
    fetchStations();
  }, []);

  const fetchStations = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:3000/api/charging-stations');
      const data = await response.json();
      console.log('✅ Loaded charging stations:', data?.stations?.length);
      setStations(data.stations || []);
      setError(null);
    } catch (err) {
      console.error('❌ Failed to load charging stations:', err);
      setError('Failed to load charging stations.');
    } finally {
      setLoading(false);
    }
  };

  // ========== WEBSOCKET LIVE UPDATES ==========

  const handleChargingUpdate = useCallback((data) => {
    console.log('🔄 Live charging update:', data);

    setStations(prevStations => {
      return prevStations.map(station => {
        if (station.id === data.station_id) {
          const availableChange = data.status === 'active' ? -1 : 1;
          return {
            ...station,
            available_connectors: Math.max(0, Math.min(
              station.total_connectors,
              station.available_connectors + availableChange
            ))
          };
        }
        return station;
      });
    });
  }, []);

  useChargingFeed(handleChargingUpdate);

  // ========== END WEBSOCKET ==========

  // Apply filters
  const filteredStations = stations.filter(station => {
    // Connector type filter
    if (filters.connectorType !== 'all' && station.connector_type !== filters.connectorType) {
      return false;
    }

    // Availability filter
    if (filters.availability === 'available' && station.available_connectors === 0) {
      return false;
    }
    if (filters.availability === 'busy' && station.available_connectors > 0) {
      return false;
    }

    // Power output filter
    if (filters.powerOutput !== 'all') {
      const power = parseFloat(station.power_output_kw);
      if (filters.powerOutput === 'slow' && power >= 22) return false;
      if (filters.powerOutput === 'fast' && (power < 22 || power >= 50)) return false;
      if (filters.powerOutput === 'rapid' && power < 50) return false;
    }

    // Operator name filter
    if (filters.operatorName && !station.operator_name?.toLowerCase().includes(filters.operatorName.toLowerCase())) {
      return false;
    }

    return true;
  });

  const handleStartCharging = (station) => {
    setSelectedStation(station);
    navigate('/charging-session', { state: { station } });
  };

  const getStatusBadge = (station) => {
    if (station.status === 'offline') {
      return { text: 'Offline', color: 'bg-gray-500' };
    }
    if (station.available_connectors === 0) {
      return { text: 'Occupied', color: 'bg-red-500' };
    }
    if (station.available_connectors < station.total_connectors / 2) {
      return { text: 'Busy', color: 'bg-yellow-500' };
    }
    return { text: 'Available', color: 'bg-green-500' };
  };

  const getPowerLabel = (kw) => {
    const power = parseFloat(kw);
    if (power < 22) return { label: 'Slow', icon: FaClock };
    if (power < 50) return { label: 'Fast', icon: FaBolt };
    return { label: 'Rapid', icon: FaBolt };
  };

  const resetFilters = () => {
    setFilters({
      connectorType: 'all',
      availability: 'all',
      powerOutput: 'all',
      operatorName: ''
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <FaChargingStation className="text-6xl text-indigo-600 animate-pulse mx-auto mb-4" />
          <p className="text-gray-600">Loading charging stations...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <FaExclamationTriangle className="text-6xl text-red-500 mx-auto mb-4" />
          <p className="text-gray-800 text-xl mb-2">Error</p>
          <p className="text-gray-600">{error}</p>
          <button
            onClick={fetchStations}
            className="mt-4 px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="bg-white shadow-lg p-4 flex items-center justify-between"
      >
        <div className="flex items-center gap-4">
          <Link to="/" className="text-gray-600 hover:text-gray-800 transition-colors">
            <FaArrowLeft className="text-xl" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
              <FaChargingStation className="text-indigo-600" />
              EV Charging Map
            </h1>
            <p className="text-sm text-gray-600">
              {filteredStations.length} station{filteredStations.length !== 1 ? 's' : ''} found
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
              showFilters
                ? 'bg-indigo-600 text-white'
                : 'bg-white border-2 border-indigo-600 text-indigo-600 hover:bg-indigo-50'
            }`}
          >
            <FaFilter />
            Filters
          </button>
          <Link
            to="/"
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
          >
            <FaHome />
            Home
          </Link>
        </div>
      </motion.div>

      {/* Filters Panel */}
      {showFilters && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          className="bg-white shadow-md p-4 overflow-hidden"
        >
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Connector Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Connector Type</label>
              <select
                value={filters.connectorType}
                onChange={(e) => setFilters({ ...filters, connectorType: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              >
                <option value="all">All Types</option>
                <option value="type2">Type 2</option>
                <option value="ccs">CCS</option>
                <option value="chademo">CHAdeMO</option>
              </select>
            </div>

            {/* Availability */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Availability</label>
              <select
                value={filters.availability}
                onChange={(e) => setFilters({ ...filters, availability: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              >
                <option value="all">All</option>
                <option value="available">Available</option>
                <option value="busy">Busy</option>
              </select>
            </div>

            {/* Power Output */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Power Output</label>
              <select
                value={filters.powerOutput}
                onChange={(e) => setFilters({ ...filters, powerOutput: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              >
                <option value="all">All</option>
                <option value="slow">Slow (&lt;22 kW)</option>
                <option value="fast">Fast (22-50 kW)</option>
                <option value="rapid">Rapid (&gt;50 kW)</option>
              </select>
            </div>

            {/* Operator Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Operator</label>
              <input
                type="text"
                value={filters.operatorName}
                onChange={(e) => setFilters({ ...filters, operatorName: e.target.value })}
                placeholder="Search operator..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div className="mt-4 flex justify-end">
            <button
              onClick={resetFilters}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Reset Filters
            </button>
          </div>
        </motion.div>
      )}

      {/* Map */}
      <div className="flex-1 relative">
        <MapContainer
          center={[52.2297, 21.0122]} // Warsaw
          zoom={13}
          style={{ height: '100%', width: '100%' }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          <AutoCenter stations={filteredStations} />

          {filteredStations.map(station => {
            const statusBadge = getStatusBadge(station);
            const powerLabel = getPowerLabel(station.power_output_kw);

            return (
              <Marker
                key={station.id}
                position={[station.latitude, station.longitude]}
                icon={createChargingIcon(station)}
              >
                <Popup maxWidth={300}>
                  <div className="p-2">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-bold text-lg text-gray-800">{station.station_name}</h3>
                      <span className={`px-2 py-1 rounded text-xs text-white ${statusBadge.color}`}>
                        {statusBadge.text}
                      </span>
                    </div>

                    <div className="space-y-2 mb-3">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <FaMapMarkerAlt className="text-indigo-600" />
                        {station.address}
                      </div>

                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <FaPlug className="text-indigo-600" />
                        <span className="font-medium">{station.connector_type?.toUpperCase()}</span>
                        <span>•</span>
                        <span>{station.available_connectors}/{station.total_connectors} available</span>
                      </div>

                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <powerLabel.icon className="text-yellow-500" />
                        <span className="font-medium">{powerLabel.label}</span>
                        <span>•</span>
                        <span>{station.power_output_kw} kW</span>
                      </div>

                      {station.price_per_kwh && (
                        <div className="text-sm text-gray-600">
                          Price: <span className="font-bold text-indigo-600">{station.price_per_kwh} PLN/kWh</span>
                        </div>
                      )}

                      {station.operator_name && (
                        <div className="text-xs text-gray-500">
                          Operator: {station.operator_name}
                        </div>
                      )}
                    </div>

                    {station.available_connectors > 0 && user && (
                      <button
                        onClick={() => handleStartCharging(station)}
                        className="w-full px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2"
                      >
                        <FaBolt />
                        Start Charging
                      </button>
                    )}

                    {!user && (
                      <div className="text-xs text-gray-500 text-center mt-2">
                        <Link to="/login" className="text-indigo-600 hover:underline">
                          Login to start charging
                        </Link>
                      </div>
                    )}
                  </div>
                </Popup>
              </Marker>
            );
          })}
        </MapContainer>

        {/* Stats overlay */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="absolute bottom-4 left-4 bg-white rounded-lg shadow-lg p-4 z-[1000]"
        >
          <div className="text-sm font-medium text-gray-700 mb-2">Quick Stats</div>
          <div className="space-y-1 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span>Available: {filteredStations.filter(s => s.available_connectors > 0).length}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
              <span>Occupied: {filteredStations.filter(s => s.available_connectors === 0).length}</span>
            </div>
            <div className="flex items-center gap-2">
              <FaBolt className="text-yellow-500" />
              <span>Total: {filteredStations.reduce((sum, s) => sum + s.total_connectors, 0)} connectors</span>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

export default ChargingMapPage;
