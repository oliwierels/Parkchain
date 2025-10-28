// frontend/src/components/StartChargingSessionModal.jsx

import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { FaTimes, FaBolt, FaCar, FaBatteryHalf, FaPercent, FaClock, FaSearch } from 'react-icons/fa';
import { EV_MODELS, searchModels, getModelById, calculateChargingTime } from '../data/evModels';

function StartChargingSessionModal({ station, onClose, onSuccess }) {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

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

      alert(t('messages.sessionStartedSuccess'));

      onSuccess();
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
        transition={{ duration: 0.2 }}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 9999
        }}
        onClick={onClose}
      >
        <motion.div
          initial={{
            scale: 0.95,
            opacity: 0,
            y: 20
          }}
          animate={{
            scale: 1,
            opacity: 1,
            y: 0
          }}
          exit={{
            scale: 0.95,
            opacity: 0,
            y: 20
          }}
          transition={{
            duration: 0.2,
            ease: [0.4, 0, 0.2, 1]
          }}
          style={{
            backgroundColor: 'white',
            borderRadius: '16px',
            padding: '24px',
            maxWidth: '600px',
            width: '90%',
            maxHeight: '90vh',
            overflow: 'auto',
            boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
            border: 'none',
            position: 'relative'
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '20px'
          }}>
            <motion.h2
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              style={{ fontSize: '18px', fontWeight: '600', margin: '0', color: '#111827', letterSpacing: '-0.3px' }}
            >
              Rozpocznij ładowanie
            </motion.h2>

            <motion.button
              onClick={onClose}
              disabled={loading}
              whileHover={!loading ? { backgroundColor: '#F3F4F6' } : {}}
              whileTap={!loading ? { scale: 0.95 } : {}}
              transition={{ duration: 0.2 }}
              style={{
                background: 'transparent',
                border: 'none',
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '20px',
                cursor: loading ? 'not-allowed' : 'pointer',
                color: '#9CA3AF',
                marginLeft: '12px',
                fontWeight: '300',
                lineHeight: '1'
              }}
            >
              ×
            </motion.button>
          </div>

          {/* Error */}
          {error && (
            <div style={{
              backgroundColor: '#FEF2F2',
              color: '#991B1B',
              padding: '12px 14px',
              borderRadius: '10px',
              marginBottom: '16px',
              fontSize: '13px',
              border: '1px solid #FCA5A5',
              fontWeight: '500'
            }}>
              {error}
            </div>
          )}

          {/* Station Info */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2 }}
            style={{
              background: '#FAFAFA',
              padding: '14px',
              borderRadius: '10px',
              marginBottom: '18px',
              border: '1px solid #F0F0F0'
            }}
          >
            <h3 style={{
              fontSize: '15px',
              fontWeight: '600',
              margin: '0 0 4px 0',
              color: '#111827',
              letterSpacing: '-0.2px'
            }}>
              {station.name}
            </h3>
            <p style={{
              fontSize: '12px',
              color: '#6B7280',
              margin: '0 0 10px 0'
            }}>
              {station.address}
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
              <div style={{
                padding: '10px 14px',
                background: 'white',
                borderRadius: '8px',
                border: '1px solid #E5E7EB'
              }}>
                <span style={{ fontSize: '12px', color: '#6B7280', display: 'block', marginBottom: '4px' }}>
                  Typ
                </span>
                <span style={{ fontSize: '14px', fontWeight: '600', color: '#111827' }}>
                  {station.charger_type}
                </span>
              </div>
              <div style={{
                padding: '10px 14px',
                background: 'white',
                borderRadius: '8px',
                border: '1px solid #E5E7EB'
              }}>
                <span style={{ fontSize: '12px', color: '#6B7280', display: 'block', marginBottom: '4px' }}>
                  Moc
                </span>
                <span style={{ fontSize: '14px', fontWeight: '600', color: '#111827' }}>
                  {station.max_power_kw} kW
                </span>
              </div>
              <div style={{
                padding: '10px 14px',
                background: 'white',
                borderRadius: '8px',
                border: '1px solid #E5E7EB'
              }}>
                <span style={{ fontSize: '12px', color: '#6B7280', display: 'block', marginBottom: '4px' }}>
                  Cena/kWh
                </span>
                <span style={{ fontSize: '14px', fontWeight: '600', color: '#111827' }}>
                  {station.price_per_kwh} zł
                </span>
              </div>
              <div style={{
                padding: '10px 14px',
                background: 'white',
                borderRadius: '8px',
                border: '1px solid #E5E7EB'
              }}>
                <span style={{ fontSize: '12px', color: '#6B7280', display: 'block', marginBottom: '4px' }}>
                  Dostępne
                </span>
                <span style={{ fontSize: '14px', fontWeight: '600', color: '#111827' }}>
                  {station.available_connectors}/{station.total_connectors}
                </span>
              </div>
            </div>
          </motion.div>

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
            <div style={{ display: 'flex', gap: '10px', paddingTop: '16px' }}>
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                style={{
                  flex: 1,
                  padding: '12px',
                  border: '1px solid #E5E7EB',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  backgroundColor: 'white',
                  color: '#6B7280',
                  transition: 'all 0.15s ease',
                  letterSpacing: '-0.2px',
                  opacity: loading ? 0.5 : 1
                }}
                onMouseOver={(e) => {
                  if (!loading) {
                    e.currentTarget.style.background = '#FAFAFA';
                  }
                }}
                onMouseOut={(e) => {
                  if (!loading) {
                    e.currentTarget.style.background = 'white';
                  }
                }}
              >
                Anuluj
              </button>
              <button
                type="submit"
                disabled={loading || station.available_connectors <= 0}
                style={{
                  flex: 2,
                  padding: '12px',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: loading || station.available_connectors <= 0 ? 'not-allowed' : 'pointer',
                  backgroundColor: loading || station.available_connectors <= 0 ? '#D1D5DB' : '#111827',
                  color: 'white',
                  transition: 'all 0.15s ease',
                  letterSpacing: '-0.2px',
                  opacity: loading || station.available_connectors <= 0 ? 0.5 : 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px'
                }}
                onMouseOver={(e) => {
                  if (!loading && station.available_connectors > 0) {
                    e.currentTarget.style.background = '#1F2937';
                  }
                }}
                onMouseOut={(e) => {
                  if (!loading && station.available_connectors > 0) {
                    e.currentTarget.style.background = '#111827';
                  }
                }}
              >
                {loading ? (
                  <>
                    <div style={{
                      width: '16px',
                      height: '16px',
                      border: '2px solid white',
                      borderTop: '2px solid transparent',
                      borderRadius: '50%',
                      animation: 'spin 1s linear infinite'
                    }} />
                    Rozpoczynanie...
                  </>
                ) : station.available_connectors <= 0 ? (
                  'Brak złączy'
                ) : (
                  'Rozpocznij ładowanie'
                )}
              </button>
            </div>

            {/* CSS Animation */}
            <style>{`
              @keyframes spin {
                from { transform: rotate(0deg); }
                to { transform: rotate(360deg); }
              }
            `}</style>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

export default StartChargingSessionModal;
