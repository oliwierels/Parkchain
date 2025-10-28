// frontend/src/components/StartChargingSessionModal.jsx

import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { FaTimes, FaBolt, FaCar, FaBatteryHalf, FaPercent, FaClock, FaSearch, FaCheckCircle } from 'react-icons/fa';
import { EV_MODELS, searchModels, getModelById, calculateChargingTime } from '../data/evModels';

function StartChargingSessionModal({ station, onClose, onSuccess }) {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  // Vehicle selection
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedModel, setSelectedModel] = useState(null);
  const [showDropdown, setShowDropdown] = useState(false);

  // Charging info
  const [currentCharge, setCurrentCharge] = useState('20'); // %
  const [targetCharge, setTargetCharge] = useState('80'); // %

  // Filter EV models based on search
  const filteredModels = useMemo(() => {
    if (!searchQuery) return EV_MODELS.slice(0, 10); // Show first 10 by default
    return searchModels(searchQuery);
  }, [searchQuery]);

  // Auto-calculate charging details
  const chargingDetails = useMemo(() => {
    if (!selectedModel || !currentCharge || !targetCharge) return null;

    const current = parseFloat(currentCharge);
    const target = parseFloat(targetCharge);

    if (isNaN(current) || isNaN(target) || target <= current) return null;

    const chargingPower = Math.min(
      station.max_power_kw,
      selectedModel.maxChargingPower
    );

    return calculateChargingTime(
      selectedModel.batteryCapacity,
      current,
      target,
      chargingPower
    );
  }, [selectedModel, currentCharge, targetCharge, station.max_power_kw]);

  const handleModelSelect = (model) => {
    setSelectedModel(model);
    setSearchQuery(model.fullName);
    setShowDropdown(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const vehicleInfo = selectedModel ? {
        model: selectedModel.fullName,
        battery_capacity: selectedModel.batteryCapacity,
        current_charge: currentCharge,
        target_charge: targetCharge,
        estimated_kwh: chargingDetails?.kWhNeeded || null
      } : null;

      console.log(t('messages.startingChargingSession'), {
        station_id: station.id,
        station_name: station.name,
        vehicle: selectedModel?.fullName
      });

      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/charging-sessions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          station_id: station.id,
          vehicle_info: vehicleInfo
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error(t('messages.apiError'), errorData);
        throw new Error(errorData.error || errorData.details || t('messages.sessionStartError'));
      }

      const data = await response.json();
      console.log(t('messages.sessionStartedSuccessfully'), data);

      // Show success message instead of alert
      setSuccess(true);

      // Close after 2 seconds
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 2000);
    } catch (err) {
      console.error(t('messages.startingSessionError'), err);
      setError(err.message || t('messages.sessionStartError'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/70 flex justify-center items-center z-[2000] p-4 backdrop-blur-sm"
        onClick={success ? undefined : onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          transition={{ type: 'spring', damping: 20 }}
          className="bg-gray-800 rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-auto shadow-2xl border border-gray-700"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Success State */}
          {success ? (
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="text-center py-12"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: 'spring' }}
              >
                <FaCheckCircle className="text-green-400 text-7xl mx-auto mb-6" />
              </motion.div>
              <h3 className="text-3xl font-bold text-white mb-3">Sesja rozpoczęta!</h3>
              <p className="text-gray-300 text-lg mb-2">Twoje ładowanie zostało uruchomione</p>
              <p className="text-gray-400 text-sm">Zamykanie...</p>
            </motion.div>
          ) : (
            <>
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                  <FaBolt className="text-yellow-400" />
                  Rozpocznij sesję ładowania
                </h2>
                <button
                  onClick={onClose}
                  className="text-gray-400 hover:text-white transition-colors p-2 hover:bg-gray-700 rounded-lg"
                >
                  <FaTimes size={20} />
                </button>
              </div>

              {/* Error */}
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-red-900/30 border border-red-600 text-red-400 px-4 py-3 rounded-lg mb-6 text-sm"
                >
                  {error}
                </motion.div>
              )}

              {/* Station Info */}
              <div className="bg-gray-700/50 rounded-xl p-5 mb-6 border border-gray-600">
                <h3 className="text-lg font-bold text-white mb-3">{station.name}</h3>
                <p className="text-gray-300 text-sm mb-4">{station.address}</p>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-xs text-gray-400 mb-1">Typ</p>
                    <p className="text-sm font-bold text-white">{station.charger_type}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 mb-1">Moc</p>
                    <p className="text-sm font-bold text-green-400">{station.max_power_kw} kW</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 mb-1">Cena/kWh</p>
                    <p className="text-sm font-bold text-blue-400">{station.price_per_kwh} zł</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 mb-1">Dostępne</p>
                    <p className="text-sm font-bold text-white">
                      {station.available_connectors}/{station.total_connectors}
                    </p>
                  </div>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Vehicle Model Search */}
                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-2 flex items-center gap-2">
                    <FaCar className="text-indigo-400" />
                    Model pojazdu (opcjonalne)
                  </label>

                  <div className="relative">
                    <div className="relative">
                      <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => {
                          setSearchQuery(e.target.value);
                          setShowDropdown(true);
                          if (!e.target.value) setSelectedModel(null);
                        }}
                        onFocus={() => setShowDropdown(true)}
                        placeholder="Szukaj modelu (np. Tesla Model 3, VW ID.3)..."
                        className="w-full pl-10 pr-4 py-3 bg-gray-700 text-white border border-gray-600 rounded-lg focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
                      />
                    </div>

                    {/* Dropdown */}
                    <AnimatePresence>
                      {showDropdown && filteredModels.length > 0 && (
                        <motion.div
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          className="absolute z-10 w-full mt-2 bg-gray-700 border border-gray-600 rounded-lg shadow-2xl max-h-64 overflow-auto"
                        >
                          {filteredModels.map((model) => (
                            <button
                              key={model.id}
                              type="button"
                              onClick={() => handleModelSelect(model)}
                              className="w-full text-left px-4 py-3 hover:bg-gray-600 transition-colors border-b border-gray-600 last:border-b-0"
                            >
                              <div className="flex items-center justify-between">
                                <div>
                                  <p className="text-white font-medium">{model.fullName}</p>
                                  <p className="text-xs text-gray-400 mt-1">
                                    {model.batteryCapacity} kWh • {model.range} km • {model.maxChargingPower} kW
                                  </p>
                                </div>
                                <span className="text-xs bg-gray-800 px-2 py-1 rounded text-gray-400">
                                  {model.category}
                                </span>
                              </div>
                            </button>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {selectedModel && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="mt-3 bg-indigo-900/30 border border-indigo-600/30 rounded-lg p-3"
                    >
                      <div className="grid grid-cols-3 gap-3 text-center">
                        <div>
                          <p className="text-xs text-gray-400">Bateria</p>
                          <p className="text-sm font-bold text-indigo-400">{selectedModel.batteryCapacity} kWh</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-400">Zasięg</p>
                          <p className="text-sm font-bold text-indigo-400">{selectedModel.range} km</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-400">Max ładowanie</p>
                          <p className="text-sm font-bold text-indigo-400">{selectedModel.maxChargingPower} kW</p>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </div>

                {/* Charging Parameters */}
                {selectedModel && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="space-y-4 bg-gray-700/30 p-4 rounded-lg border border-gray-600"
                  >
                    <h4 className="text-sm font-bold text-white mb-3">Parametry ładowania</h4>

                    <div className="grid grid-cols-2 gap-4">
                      {/* Current Charge */}
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2 flex items-center gap-2">
                          <FaBatteryHalf className="text-orange-400" />
                          Obecne naładowanie
                        </label>
                        <div className="relative">
                          <input
                            type="number"
                            value={currentCharge}
                            onChange={(e) => setCurrentCharge(e.target.value)}
                            min="0"
                            max="100"
                            className="w-full pr-10 pl-4 py-3 bg-gray-700 text-white border border-gray-600 rounded-lg focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                          />
                          <FaPercent className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm" />
                        </div>
                      </div>

                      {/* Target Charge */}
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2 flex items-center gap-2">
                          <FaBatteryHalf className="text-green-400" />
                          Docelowe naładowanie
                        </label>
                        <div className="relative">
                          <input
                            type="number"
                            value={targetCharge}
                            onChange={(e) => setTargetCharge(e.target.value)}
                            min="0"
                            max="100"
                            className="w-full pr-10 pl-4 py-3 bg-gray-700 text-white border border-gray-600 rounded-lg focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                          />
                          <FaPercent className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm" />
                        </div>
                      </div>
                    </div>

                    {/* Auto-calculated details */}
                    {chargingDetails && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-green-900/20 border border-green-600/30 rounded-lg p-4 mt-4"
                      >
                        <div className="grid grid-cols-3 gap-4 text-center">
                          <div>
                            <p className="text-xs text-gray-400 mb-1">Energia potrzebna</p>
                            <p className="text-lg font-bold text-green-400">{chargingDetails.kWhNeeded} kWh</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-400 mb-1 flex items-center justify-center gap-1">
                              <FaClock /> Szacowany czas
                            </p>
                            <p className="text-lg font-bold text-green-400">
                              {chargingDetails.hours}h {chargingDetails.minutes}min
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-400 mb-1">Szacowany koszt</p>
                            <p className="text-lg font-bold text-green-400">
                              {(parseFloat(chargingDetails.kWhNeeded) * station.price_per_kwh).toFixed(2)} zł
                            </p>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </motion.div>
                )}

                {/* Info bez wybranego modelu */}
                {!selectedModel && (
                  <div className="bg-blue-900/20 border border-blue-600/30 rounded-lg p-4">
                    <p className="text-sm text-blue-300">
                      💡 <strong>Wskazówka:</strong> Wybierz model pojazdu aby automatycznie obliczyć czas ładowania i koszt.
                      Możesz też rozpocząć bez wyboru modelu.
                    </p>
                  </div>
                )}

                {/* Buttons */}
                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={onClose}
                    disabled={loading}
                    className="flex-1 px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Anuluj
                  </button>
                  <button
                    type="submit"
                    disabled={loading || station.available_connectors <= 0}
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white rounded-lg font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg hover:shadow-xl"
                  >
                    {loading ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Rozpoczynanie...
                      </>
                    ) : station.available_connectors <= 0 ? (
                      'Brak złączy'
                    ) : (
                      <>
                        <FaBolt />
                        Rozpocznij ładowanie
                      </>
                    )}
                  </button>
                </div>
              </form>
            </>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

export default StartChargingSessionModal;
