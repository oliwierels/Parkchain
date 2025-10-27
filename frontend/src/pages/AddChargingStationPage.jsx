// frontend/src/pages/AddChargingStationPage.jsx

import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  FaChargingStation,
  FaArrowLeft,
  FaMapMarkerAlt,
  FaPlug,
  FaBolt,
  FaDollarSign,
  FaCheckCircle,
  FaExclamationTriangle
} from 'react-icons/fa';

function AddChargingStationPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState({
    station_name: '',
    address: '',
    latitude: '',
    longitude: '',
    connector_type: 'type2',
    total_connectors: 1,
    available_connectors: 1,
    power_output_kw: 22,
    price_per_kwh: 1.50,
    operator_name: '',
    status: 'active'
  });

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? parseFloat(value) || 0 : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Validation
    if (!formData.station_name || !formData.address) {
      setError('Station name and address are required');
      setLoading(false);
      return;
    }

    if (!formData.latitude || !formData.longitude) {
      setError('Location coordinates are required');
      setLoading(false);
      return;
    }

    if (formData.available_connectors > formData.total_connectors) {
      setError('Available connectors cannot exceed total connectors');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('http://localhost:3000/api/charging-stations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to add charging station');
      }

      const data = await response.json();
      console.log('✅ Charging station added:', data);

      setSuccess(true);
      setTimeout(() => {
        navigate('/charging-map');
      }, 2000);

    } catch (err) {
      console.error('❌ Error adding charging station:', err);
      setError(err.message || 'Failed to add charging station');
    } finally {
      setLoading(false);
    }
  };

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      setLoading(true);
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setFormData(prev => ({
            ...prev,
            latitude: position.coords.latitude.toFixed(6),
            longitude: position.coords.longitude.toFixed(6)
          }));
          setLoading(false);
        },
        (error) => {
          setError('Failed to get current location');
          setLoading(false);
        }
      );
    } else {
      setError('Geolocation is not supported by your browser');
    }
  };

  if (success) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-green-50 to-emerald-100">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-center"
        >
          <FaCheckCircle className="text-8xl text-green-600 mx-auto mb-4" />
          <h2 className="text-3xl font-bold text-gray-800 mb-2">Success!</h2>
          <p className="text-gray-600 mb-4">Charging station added successfully</p>
          <p className="text-sm text-gray-500">Redirecting to map...</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="bg-white rounded-lg shadow-lg p-6 mb-6"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link to="/charging-map" className="text-gray-600 hover:text-gray-800 transition-colors">
                <FaArrowLeft className="text-xl" />
              </Link>
              <div>
                <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-2">
                  <FaChargingStation className="text-indigo-600" />
                  Add Charging Station
                </h1>
                <p className="text-gray-600 mt-1">Register a new EV charging station</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Form */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-lg shadow-lg p-8"
        >
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
              <FaExclamationTriangle className="text-red-600 text-xl" />
              <span className="text-red-800">{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Info */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">Basic Information</h3>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Station Name *
                </label>
                <input
                  type="text"
                  name="station_name"
                  value={formData.station_name}
                  onChange={handleChange}
                  placeholder="e.g., Warsaw Central Station"
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Address *
                </label>
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  placeholder="Street address"
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Operator Name
                </label>
                <input
                  type="text"
                  name="operator_name"
                  value={formData.operator_name}
                  onChange={handleChange}
                  placeholder="Your company name"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Location */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-800 border-b pb-2 flex items-center gap-2">
                <FaMapMarkerAlt className="text-indigo-600" />
                Location
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Latitude *
                  </label>
                  <input
                    type="number"
                    step="0.000001"
                    name="latitude"
                    value={formData.latitude}
                    onChange={handleChange}
                    placeholder="52.229676"
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Longitude *
                  </label>
                  <input
                    type="number"
                    step="0.000001"
                    name="longitude"
                    value={formData.longitude}
                    onChange={handleChange}
                    placeholder="21.012229"
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>
              </div>

              <button
                type="button"
                onClick={getCurrentLocation}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-100 text-indigo-700 rounded-lg hover:bg-indigo-200 transition-colors"
              >
                <FaMapMarkerAlt />
                Use Current Location
              </button>
            </div>

            {/* Technical Specs */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-800 border-b pb-2 flex items-center gap-2">
                <FaPlug className="text-indigo-600" />
                Technical Specifications
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Connector Type *
                  </label>
                  <select
                    name="connector_type"
                    value={formData.connector_type}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  >
                    <option value="type2">Type 2 (Mennekes)</option>
                    <option value="ccs">CCS (Combined Charging System)</option>
                    <option value="chademo">CHAdeMO</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                    <FaBolt className="text-yellow-500" />
                    Power Output (kW) *
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    name="power_output_kw"
                    value={formData.power_output_kw}
                    onChange={handleChange}
                    min="3.7"
                    max="350"
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Slow: &lt;22kW, Fast: 22-50kW, Rapid: &gt;50kW
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Total Connectors *
                  </label>
                  <input
                    type="number"
                    name="total_connectors"
                    value={formData.total_connectors}
                    onChange={(e) => {
                      handleChange(e);
                      // Auto-update available connectors
                      if (formData.available_connectors > parseInt(e.target.value)) {
                        setFormData(prev => ({
                          ...prev,
                          available_connectors: parseInt(e.target.value)
                        }));
                      }
                    }}
                    min="1"
                    max="10"
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Available Connectors *
                  </label>
                  <input
                    type="number"
                    name="available_connectors"
                    value={formData.available_connectors}
                    onChange={handleChange}
                    min="0"
                    max={formData.total_connectors}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            {/* Pricing */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-800 border-b pb-2 flex items-center gap-2">
                <FaDollarSign className="text-green-600" />
                Pricing
              </h3>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Price per kWh (PLN)
                </label>
                <input
                  type="number"
                  step="0.01"
                  name="price_per_kwh"
                  value={formData.price_per_kwh}
                  onChange={handleChange}
                  min="0"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Current value: {formData.price_per_kwh} PLN/kWh
                </p>
              </div>
            </div>

            {/* Status */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">Status</h3>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Station Status
                </label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                >
                  <option value="active">Active</option>
                  <option value="maintenance">Maintenance</option>
                  <option value="offline">Offline</option>
                </select>
              </div>
            </div>

            {/* Submit Buttons */}
            <div className="flex gap-4 pt-4">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-6 py-3 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    Adding...
                  </>
                ) : (
                  <>
                    <FaChargingStation />
                    Add Charging Station
                  </>
                )}
              </button>

              <Link
                to="/charging-map"
                className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition-colors flex items-center justify-center"
              >
                Cancel
              </Link>
            </div>
          </form>
        </motion.div>
      </div>
    </div>
  );
}

export default AddChargingStationPage;
