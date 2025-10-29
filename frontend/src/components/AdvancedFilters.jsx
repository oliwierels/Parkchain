// frontend/src/components/AdvancedFilters.jsx

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FaFilter,
  FaTimes,
  FaSearch,
  FaDollarSign,
  FaParking,
  FaMapMarkerAlt,
  FaStar,
  FaSave,
  FaTrash
} from 'react-icons/fa';
import { useTranslation } from 'react-i18next';

function AdvancedFilters({ parkings, onFilterChange, isOpen, onClose }) {
  const { t } = useTranslation();
  const [filters, setFilters] = useState({
    searchQuery: '',
    priceMin: '',
    priceMax: '',
    parkingType: 'all', // all, covered, outdoor, ev_charging
    availability: 'all', // all, available, full
    distanceMax: '',
    minRating: 0,
    sortBy: 'distance' // distance, price-low, price-high, rating
  });

  const [userLocation, setUserLocation] = useState(null);
  const [savedPresets, setSavedPresets] = useState([]);
  const [presetName, setPresetName] = useState('');
  const [showSavePreset, setShowSavePreset] = useState(false);

  // Load saved presets from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('filterPresets');
    if (saved) {
      try {
        setSavedPresets(JSON.parse(saved));
      } catch (err) {
        console.error('Error loading presets:', err);
      }
    }
  }, []);

  // Get user location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error) => {
          console.warn('Geolocation error:', error);
        }
      );
    }
  }, []);

  // Calculate distance between two points
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Radius of Earth in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  // Apply filters
  useEffect(() => {
    let filtered = [...parkings];

    // Search query
    if (filters.searchQuery) {
      const query = filters.searchQuery.toLowerCase();
      filtered = filtered.filter(p =>
        p.name?.toLowerCase().includes(query) ||
        p.address?.toLowerCase().includes(query) ||
        p.city?.toLowerCase().includes(query)
      );
    }

    // Price range
    if (filters.priceMin) {
      filtered = filtered.filter(p =>
        (p.price_per_hour || p.hourly_rate || 0) >= parseFloat(filters.priceMin)
      );
    }
    if (filters.priceMax) {
      filtered = filtered.filter(p =>
        (p.price_per_hour || p.hourly_rate || 0) <= parseFloat(filters.priceMax)
      );
    }

    // Parking type
    if (filters.parkingType !== 'all') {
      filtered = filtered.filter(p => p.type === filters.parkingType);
    }

    // Availability
    if (filters.availability === 'available') {
      filtered = filtered.filter(p => p.available_spots > 0);
    } else if (filters.availability === 'full') {
      filtered = filtered.filter(p => p.available_spots === 0);
    }

    // Distance filter
    if (filters.distanceMax && userLocation) {
      filtered = filtered.filter(p => {
        if (!p.latitude || !p.longitude) return false;
        const distance = calculateDistance(
          userLocation.lat,
          userLocation.lng,
          p.latitude,
          p.longitude
        );
        return distance <= parseFloat(filters.distanceMax);
      });
    }

    // Rating filter
    if (filters.minRating > 0) {
      filtered = filtered.filter(p => (p.rating || 0) >= filters.minRating);
    }

    // Sorting
    if (filters.sortBy === 'price-low') {
      filtered.sort((a, b) =>
        (a.price_per_hour || a.hourly_rate || 0) - (b.price_per_hour || b.hourly_rate || 0)
      );
    } else if (filters.sortBy === 'price-high') {
      filtered.sort((a, b) =>
        (b.price_per_hour || b.hourly_rate || 0) - (a.price_per_hour || a.hourly_rate || 0)
      );
    } else if (filters.sortBy === 'rating') {
      filtered.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    } else if (filters.sortBy === 'distance' && userLocation) {
      filtered.sort((a, b) => {
        const distA = calculateDistance(userLocation.lat, userLocation.lng, a.latitude, a.longitude);
        const distB = calculateDistance(userLocation.lat, userLocation.lng, b.latitude, b.longitude);
        return distA - distB;
      });
    }

    onFilterChange(filtered);
  }, [filters, parkings, userLocation]);

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const resetFilters = () => {
    setFilters({
      searchQuery: '',
      priceMin: '',
      priceMax: '',
      parkingType: 'all',
      availability: 'all',
      distanceMax: '',
      minRating: 0,
      sortBy: 'distance'
    });
  };

  const savePreset = () => {
    if (!presetName.trim()) {
      alert(t('filters.enterPresetName'));
      return;
    }

    const newPreset = {
      id: Date.now(),
      name: presetName,
      filters: { ...filters }
    };

    const updated = [...savedPresets, newPreset];
    setSavedPresets(updated);
    localStorage.setItem('filterPresets', JSON.stringify(updated));
    setPresetName('');
    setShowSavePreset(false);
  };

  const loadPreset = (preset) => {
    setFilters(preset.filters);
  };

  const deletePreset = (id) => {
    const updated = savedPresets.filter(p => p.id !== id);
    setSavedPresets(updated);
    localStorage.setItem('filterPresets', JSON.stringify(updated));
  };

  const activeFiltersCount = [
    filters.searchQuery,
    filters.priceMin,
    filters.priceMax,
    filters.parkingType !== 'all',
    filters.availability !== 'all',
    filters.distanceMax,
    filters.minRating > 0,
    filters.sortBy !== 'distance'
  ].filter(Boolean).length;

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black bg-opacity-50 z-[9999] flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold flex items-center gap-2">
                  <FaFilter />
                  {t('filters.title')}
                </h2>
                {activeFiltersCount > 0 && (
                  <p className="text-sm text-indigo-200 mt-1">
                    {activeFiltersCount} {t('filters.activeFilters')}
                  </p>
                )}
              </div>
              <button
                onClick={onClose}
                className="text-white hover:text-gray-200 transition-colors"
              >
                <FaTimes className="text-2xl" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
            {/* Search Bar */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                <FaSearch className="inline mr-2" />
                {t('filters.searchLabel')}
              </label>
              <input
                type="text"
                value={filters.searchQuery}
                onChange={(e) => handleFilterChange('searchQuery', e.target.value)}
                placeholder={t('filters.searchPlaceholder')}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>

            {/* Price Range */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                <FaDollarSign className="inline mr-2" />
                {t('filters.priceRangeLabel')}
              </label>
              <div className="grid grid-cols-2 gap-4">
                <input
                  type="number"
                  value={filters.priceMin}
                  onChange={(e) => handleFilterChange('priceMin', e.target.value)}
                  placeholder={t('filters.priceMin')}
                  className="px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
                <input
                  type="number"
                  value={filters.priceMax}
                  onChange={(e) => handleFilterChange('priceMax', e.target.value)}
                  placeholder={t('filters.priceMax')}
                  className="px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Parking Type */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                <FaParking className="inline mr-2" />
                {t('filters.parkingTypeLabel')}
              </label>
              <select
                value={filters.parkingType}
                onChange={(e) => handleFilterChange('parkingType', e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                <option value="all">{t('filters.allTypes')}</option>
                <option value="covered">{t('filters.covered')}</option>
                <option value="outdoor">{t('filters.outdoor')}</option>
                <option value="ev_charging">{t('filters.withEVCharger')}</option>
              </select>
            </div>

            {/* Availability */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                {t('filters.availabilityLabel')}
              </label>
              <select
                value={filters.availability}
                onChange={(e) => handleFilterChange('availability', e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                <option value="all">{t('filters.all')}</option>
                <option value="available">{t('filters.availableNow')}</option>
                <option value="full">{t('filters.occupied')}</option>
              </select>
            </div>

            {/* Distance */}
            {userLocation && (
              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  <FaMapMarkerAlt className="inline mr-2" />
                  {t('filters.maxDistanceLabel')}
                </label>
                <input
                  type="number"
                  value={filters.distanceMax}
                  onChange={(e) => handleFilterChange('distanceMax', e.target.value)}
                  placeholder={t('filters.distancePlaceholder')}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
            )}

            {/* Rating */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                <FaStar className="inline mr-2 text-yellow-500" />
                {t('filters.minRatingLabel')}
              </label>
              <div className="flex gap-2">
                {[0, 1, 2, 3, 4, 5].map((rating) => (
                  <button
                    key={rating}
                    onClick={() => handleFilterChange('minRating', rating)}
                    className={`flex-1 px-3 py-2 rounded-lg font-semibold transition-all ${
                      filters.minRating === rating
                        ? 'bg-yellow-500 text-white shadow-lg scale-105'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    {rating === 0 ? t('filters.all') : `${rating}+`}
                  </button>
                ))}
              </div>
            </div>

            {/* Sort By */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                {t('filters.sortByLabel')}
              </label>
              <select
                value={filters.sortBy}
                onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                <option value="distance">{t('filters.sortDistance')}</option>
                <option value="price-low">{t('filters.sortPriceLow')}</option>
                <option value="price-high">{t('filters.sortPriceHigh')}</option>
                <option value="rating">{t('filters.sortRating')}</option>
              </select>
            </div>

            {/* Saved Presets */}
            {savedPresets.length > 0 && (
              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  {t('filters.savedPresets')}
                </label>
                <div className="space-y-2">
                  {savedPresets.map((preset) => (
                    <div
                      key={preset.id}
                      className="flex items-center justify-between bg-gray-100 px-4 py-2 rounded-lg"
                    >
                      <button
                        onClick={() => loadPreset(preset)}
                        className="flex-1 text-left font-medium text-gray-800 hover:text-indigo-600"
                      >
                        {preset.name}
                      </button>
                      <button
                        onClick={() => deletePreset(preset.id)}
                        className="text-red-600 hover:text-red-800 ml-2"
                      >
                        <FaTrash />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Save Preset */}
            {!showSavePreset ? (
              <button
                onClick={() => setShowSavePreset(true)}
                className="w-full px-4 py-3 bg-green-100 text-green-700 rounded-lg font-semibold hover:bg-green-200 transition-colors flex items-center justify-center gap-2"
              >
                <FaSave />
                {t('filters.saveCurrentFilters')}
              </button>
            ) : (
              <div className="bg-green-50 border-2 border-green-200 rounded-lg p-4">
                <input
                  type="text"
                  value={presetName}
                  onChange={(e) => setPresetName(e.target.value)}
                  placeholder={t('filters.presetNamePlaceholder')}
                  className="w-full px-4 py-2 border-2 border-green-300 rounded-lg mb-2"
                />
                <div className="flex gap-2">
                  <button
                    onClick={savePreset}
                    className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700"
                  >
                    {t('filters.savePreset')}
                  </button>
                  <button
                    onClick={() => {
                      setShowSavePreset(false);
                      setPresetName('');
                    }}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300"
                  >
                    {t('filters.cancelPreset')}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="bg-gray-50 p-4 flex gap-3 border-t border-gray-200">
            <button
              onClick={resetFilters}
              className="flex-1 px-6 py-3 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
            >
              {t('filters.reset')}
            </button>
            <button
              onClick={onClose}
              className="flex-1 px-6 py-3 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition-colors"
            >
              {t('filters.applyFilters')}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

export default AdvancedFilters;
