import React, { useState, useEffect, useRef } from 'react';
import { MapPin, Navigation, Filter, Search, Clock, Car, Zap, Star, DollarSign } from 'lucide-react';

const ParkingMap = () => {
  const [userLocation, setUserLocation] = useState(null);
  const [selectedLot, setSelectedLot] = useState(null);
  const [filters, setFilters] = useState({
    showAvailable: true,
    showEV: false,
    showCovered: false,
    maxPrice: 100
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [parkingLots, setParkingLots] = useState([]);
  const [mapCenter, setMapCenter] = useState({ lat: 52.2297, lng: 21.0122 });
  const [mapZoom, setMapZoom] = useState(12);
  const mapRef = useRef(null);

  // Mock parking lots data with Polish cities
  const mockParkingLots = [
    {
      id: '1',
      name: 'Galeria Lublin',
      address: 'ul. Lipowa 13, Lublin',
      city: 'Lublin',
      lat: 51.2465,
      lng: 22.5684,
      capacity: 200,
      occupied: 145,
      available: 55,
      hourlyRate: 5.00,
      dailyRate: 40.00,
      features: ['covered', 'ev_charging', 'security'],
      rating: 4.5,
      distance: 1.2
    },
    {
      id: '2',
      name: 'Centrum Handlowe Warszawa',
      address: 'ul. Marszałkowska 104/122, Warszawa',
      city: 'Warszawa',
      lat: 52.2297,
      lng: 21.0122,
      capacity: 500,
      occupied: 420,
      available: 80,
      hourlyRate: 8.00,
      dailyRate: 60.00,
      features: ['covered', 'ev_charging', 'security', '24/7'],
      rating: 4.7,
      distance: 0.3
    },
    {
      id: '3',
      name: 'Stary Rynek Poznań',
      address: 'Stary Rynek, Poznań',
      city: 'Poznań',
      lat: 52.4082,
      lng: 16.9335,
      capacity: 150,
      occupied: 89,
      available: 61,
      hourlyRate: 6.00,
      dailyRate: 45.00,
      features: ['outdoor', 'security'],
      rating: 4.2,
      distance: 2.1
    },
    {
      id: '4',
      name: 'Manufaktura Łódź',
      address: 'ul. Karskiego 5, Łódź',
      city: 'Łódź',
      lat: 51.7833,
      lng: 19.4500,
      capacity: 300,
      occupied: 180,
      available: 120,
      hourlyRate: 5.50,
      dailyRate: 42.00,
      features: ['covered', 'ev_charging'],
      rating: 4.4,
      distance: 3.5
    },
    {
      id: '5',
      name: 'Forum Gdańsk',
      address: 'ul. Targ Sienny 7, Gdańsk',
      city: 'Gdańsk',
      lat: 54.3520,
      lng: 18.6466,
      capacity: 250,
      occupied: 195,
      available: 55,
      hourlyRate: 7.00,
      dailyRate: 50.00,
      features: ['covered', 'security', 'ev_charging'],
      rating: 4.6,
      distance: 1.8
    },
    {
      id: '6',
      name: 'Silesia City Center Katowice',
      address: 'ul. Chorzowska 107, Katowice',
      city: 'Katowice',
      lat: 50.2599,
      lng: 19.0216,
      capacity: 400,
      occupied: 312,
      available: 88,
      hourlyRate: 6.50,
      dailyRate: 48.00,
      features: ['covered', 'ev_charging', '24/7'],
      rating: 4.5,
      distance: 0.9
    }
  ];

  useEffect(() => {
    setParkingLots(mockParkingLots);
    
    // Get user location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          setUserLocation(location);
          setMapCenter(location);
        },
        (error) => {
          console.log('Location access denied, using default location');
        }
      );
    }
  }, []);

  const getOccupancyColor = (lot) => {
    const rate = (lot.occupied / lot.capacity) * 100;
    if (rate >= 90) return 'bg-red-500';
    if (rate >= 70) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getOccupancyStatus = (lot) => {
    const rate = (lot.occupied / lot.capacity) * 100;
    if (rate >= 90) return 'Full';
    if (rate >= 70) return 'Filling Up';
    return 'Available';
  };

  const filteredLots = parkingLots.filter(lot => {
    if (filters.showAvailable && lot.available === 0) return false;
    if (filters.showEV && !lot.features.includes('ev_charging')) return false;
    if (filters.showCovered && !lot.features.includes('covered')) return false;
    if (lot.hourlyRate > filters.maxPrice) return false;
    if (searchQuery && !lot.name.toLowerCase().includes(searchQuery.toLowerCase()) && 
        !lot.city.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const centerOnLot = (lot) => {
    setMapCenter({ lat: lot.lat, lng: lot.lng });
    setMapZoom(15);
    setSelectedLot(lot);
  };

  const handleReserve = (lot) => {
    alert(`Reservation for ${lot.name} - This will integrate with the booking API`);
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <div className="w-96 bg-white shadow-lg overflow-y-auto">
        {/* Header */}
        <div className="p-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
          <h1 className="text-2xl font-bold mb-2">Find Parking</h1>
          <p className="text-blue-100 text-sm">Real-time availability across Poland</p>
        </div>

        {/* Search Bar */}
        <div className="p-4 border-b">
          <div className="relative">
            <Search className="absolute left-3 top-3 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search by name or city..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Filters */}
        <div className="p-4 border-b bg-gray-50">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold flex items-center">
              <Filter size={18} className="mr-2" />
              Filters
            </h3>
            <button 
              onClick={() => setFilters({ showAvailable: true, showEV: false, showCovered: false, maxPrice: 100 })}
              className="text-xs text-blue-600 hover:text-blue-700"
            >
              Reset
            </button>
          </div>
          
          <div className="space-y-2">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={filters.showAvailable}
                onChange={(e) => setFilters({ ...filters, showAvailable: e.target.checked })}
                className="mr-2 rounded text-blue-600"
              />
              <span className="text-sm">Only available spots</span>
            </label>
            
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={filters.showEV}
                onChange={(e) => setFilters({ ...filters, showEV: e.target.checked })}
                className="mr-2 rounded text-blue-600"
              />
              <Zap size={16} className="mr-1 text-yellow-500" />
              <span className="text-sm">EV Charging</span>
            </label>
            
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={filters.showCovered}
                onChange={(e) => setFilters({ ...filters, showCovered: e.target.checked })}
                className="mr-2 rounded text-blue-600"
              />
              <span className="text-sm">Covered parking</span>
            </label>

            <div className="mt-3">
              <label className="text-sm text-gray-700">Max price: {filters.maxPrice} PLN/h</label>
              <input
                type="range"
                min="0"
                max="20"
                value={filters.maxPrice}
                onChange={(e) => setFilters({ ...filters, maxPrice: parseInt(e.target.value) })}
                className="w-full mt-1"
              />
            </div>
          </div>
        </div>

        {/* Parking Lots List */}
        <div className="divide-y">
          {filteredLots.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <Car size={48} className="mx-auto mb-3 text-gray-300" />
              <p>No parking lots match your filters</p>
            </div>
          ) : (
            filteredLots.map(lot => (
              <div
                key={lot.id}
                onClick={() => centerOnLot(lot)}
                className={`p-4 cursor-pointer hover:bg-blue-50 transition-colors ${
                  selectedLot?.id === lot.id ? 'bg-blue-50 border-l-4 border-blue-600' : ''
                }`}
              >
                <div className="flex justify-between items-start mb-2">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">{lot.name}</h3>
                    <p className="text-xs text-gray-600">{lot.address}</p>
                  </div>
                  <div className="flex items-center ml-2">
                    <Star size={14} className="text-yellow-500 mr-1" />
                    <span className="text-sm font-medium">{lot.rating}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center text-sm text-gray-600">
                    <Navigation size={14} className="mr-1" />
                    <span>{lot.distance} km away</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    {lot.features.includes('ev_charging') && (
                      <Zap size={16} className="text-yellow-500" title="EV Charging" />
                    )}
                    {lot.features.includes('covered') && (
                      <div className="w-4 h-4 bg-gray-400 rounded" title="Covered" />
                    )}
                    {lot.features.includes('24/7') && (
                      <Clock size={16} className="text-blue-500" title="24/7" />
                    )}
                  </div>
                </div>

                <div className="mb-3">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm font-medium text-gray-700">
                      {lot.available} / {lot.capacity} available
                    </span>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      lot.available === 0 ? 'bg-red-100 text-red-800' :
                      lot.available < 20 ? 'bg-yellow-100 text-yellow-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                      {getOccupancyStatus(lot)}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`${getOccupancyColor(lot)} h-2 rounded-full transition-all`}
                      style={{ width: `${(lot.occupied / lot.capacity) * 100}%` }}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center text-gray-700">
                    <DollarSign size={16} />
                    <span className="text-sm font-semibold">{lot.hourlyRate} PLN/h</span>
                    <span className="text-xs text-gray-500 ml-2">{lot.dailyRate} PLN/day</span>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleReserve(lot);
                    }}
                    disabled={lot.available === 0}
                    className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                      lot.available === 0
                        ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                        : 'bg-blue-600 text-white hover:bg-blue-700'
                    }`}
                  >
                    {lot.available === 0 ? 'Full' : 'Reserve'}
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Map Area */}
      <div className="flex-1 relative">
        {/* Map Container - Simulated with markers */}
        <div className="w-full h-full bg-gray-200 relative overflow-hidden">
          {/* Map placeholder with grid */}
          <div className="absolute inset-0" style={{
            backgroundImage: 'linear-gradient(#e5e7eb 1px, transparent 1px), linear-gradient(90deg, #e5e7eb 1px, transparent 1px)',
            backgroundSize: '20px 20px'
          }} />
          
          {/* Simulated map markers */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="relative w-full h-full">
              {filteredLots.map((lot, idx) => {
                // Position markers in a circular pattern for demo
                const angle = (idx / filteredLots.length) * 2 * Math.PI;
                const radius = 200;
                const x = 50 + Math.cos(angle) * 30;
                const y = 50 + Math.sin(angle) * 30;
                
                return (
                  <div
                    key={lot.id}
                    onClick={() => setSelectedLot(lot)}
                    className="absolute cursor-pointer transform -translate-x-1/2 -translate-y-1/2"
                    style={{ left: `${x}%`, top: `${y}%` }}
                  >
                    <div className={`relative ${selectedLot?.id === lot.id ? 'z-20' : 'z-10'}`}>
                      <div className={`w-12 h-12 rounded-full shadow-lg flex items-center justify-center transition-all ${
                        selectedLot?.id === lot.id 
                          ? 'bg-blue-600 scale-125' 
                          : getOccupancyColor(lot)
                      }`}>
                        <MapPin className="text-white" size={24} />
                      </div>
                      {selectedLot?.id === lot.id && (
                        <div className="absolute top-full mt-2 left-1/2 transform -translate-x-1/2 bg-white rounded-lg shadow-xl p-3 w-64 z-30">
                          <h4 className="font-semibold mb-1">{lot.name}</h4>
                          <p className="text-xs text-gray-600 mb-2">{lot.city}</p>
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-sm">{lot.available} spots</span>
                            <span className="text-sm font-semibold text-blue-600">{lot.hourlyRate} PLN/h</span>
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleReserve(lot);
                            }}
                            className="w-full bg-blue-600 text-white py-2 rounded-lg text-sm font-semibold hover:bg-blue-700"
                          >
                            Reserve Now
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
              
              {/* User location marker */}
              {userLocation && (
                <div
                  className="absolute transform -translate-x-1/2 -translate-y-1/2 z-30"
                  style={{ left: '50%', top: '50%' }}
                >
                  <div className="w-4 h-4 bg-blue-500 border-4 border-white rounded-full shadow-lg animate-pulse" />
                </div>
              )}
            </div>
          </div>

          {/* Map Legend */}
          <div className="absolute bottom-4 left-4 bg-white rounded-lg shadow-lg p-3">
            <h4 className="font-semibold text-sm mb-2">Legend</h4>
            <div className="space-y-1 text-xs">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-green-500 rounded-full mr-2" />
                <span>Available (&lt;70%)</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 bg-yellow-500 rounded-full mr-2" />
                <span>Filling (70-90%)</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 bg-red-500 rounded-full mr-2" />
                <span>Full (&gt;90%)</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 bg-blue-500 rounded-full mr-2" />
                <span>Your location</span>
              </div>
            </div>
          </div>

          {/* Map Info Note */}
          <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-blue-600 text-white px-4 py-2 rounded-lg shadow-lg text-sm">
            📍 Live parking availability • Updates every 60s
          </div>

          {/* Integration Note */}
          <div className="absolute bottom-4 right-4 bg-white rounded-lg shadow-lg p-4 max-w-xs">
            <h4 className="font-semibold text-sm mb-2 flex items-center">
              <MapPin size={16} className="mr-2 text-blue-600" />
              Mapbox Integration
            </h4>
            <p className="text-xs text-gray-600">
              This demo uses simulated markers. In production, integrate with:
              <code className="block mt-1 bg-gray-100 p-1 rounded text-xs">
                react-map-gl + mapbox-gl
              </code>
            </p>
            <p className="text-xs text-gray-500 mt-2">
              Add MAPBOX_ACCESS_TOKEN to .env
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ParkingMap;