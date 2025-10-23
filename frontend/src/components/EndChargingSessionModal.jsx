import { useState } from 'react';

function EndChargingSessionModal({ session, onClose, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({
    energy_delivered_kwh: '',
    charging_duration_minutes: ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const calculateEstimatedCost = () => {
    if (!formData.energy_delivered_kwh) return 0;
    const pricePerKwh = session.originalData?.charging_stations?.price_per_kwh || 0;
    return (parseFloat(formData.energy_delivered_kwh) * parseFloat(pricePerKwh)).toFixed(2);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (!formData.energy_delivered_kwh) {
      setError('Podaj ilość dostarczonej energii');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`http://localhost:3000/api/charging-sessions/${session.id}/end`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          energy_delivered_kwh: parseFloat(formData.energy_delivered_kwh),
          charging_duration_minutes: formData.charging_duration_minutes ? parseInt(formData.charging_duration_minutes) : null
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Nie udało się zakończyć sesji');
      }

      const data = await response.json();
      console.log('✅ Sesja zakończona:', data);
      alert('✅ Sesja ładowania zakończona pomyślnie!');
      onSuccess();
    } catch (err) {
      console.error('❌ Błąd kończenia sesji:', err);
      setError(err.message || 'Nie udało się zakończyć sesji');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed top-0 left-0 right-0 bottom-0 bg-black bg-opacity-70 flex justify-center items-center z-[2000] p-5">
      <div className="bg-gray-800 rounded-xl p-6 max-w-md w-full max-h-[90vh] overflow-auto shadow-2xl border border-gray-700">
        <div className="flex justify-between items-center mb-5">
          <h2 className="m-0 text-xl font-bold text-white flex items-center gap-2">
            ⚡ Zakończ sesję ładowania
          </h2>
          <button
            onClick={onClose}
            className="bg-transparent border-none text-2xl cursor-pointer text-gray-400 hover:text-white transition-colors"
          >
            ✕
          </button>
        </div>

        {error && (
          <div className="bg-red-800 text-red-100 p-3 rounded-lg mb-4 text-sm">
            {error}
          </div>
        )}

        {/* Info o sesji */}
        <div className="bg-gray-700 p-4 rounded-lg mb-5 border border-gray-600">
          <h3 className="text-base font-bold text-white mb-3">
            {session.name}
          </h3>
          <p className="text-sm text-gray-300 mb-1">
            📍 {session.address}
          </p>
          <p className="text-sm text-gray-300 mb-3">
            🕐 Rozpoczęto: {new Date(session.startTime).toLocaleString('pl-PL')}
          </p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-xs text-gray-400 mb-1">Cena za kWh</p>
              <p className="text-sm font-bold text-green-400">
                {session.originalData?.charging_stations?.price_per_kwh} zł
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-400 mb-1">Typ ładowarki</p>
              <p className="text-sm font-bold text-gray-100">
                {session.originalData?.charging_stations?.charger_type}
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Dostarczona energia */}
          <div className="mb-4">
            <label className="block text-sm font-semibold text-gray-300 mb-2">
              Dostarczona energia (kWh) *
            </label>
            <input
              type="number"
              name="energy_delivered_kwh"
              value={formData.energy_delivered_kwh}
              onChange={handleChange}
              placeholder="np. 42.5"
              min="0"
              step="0.1"
              required
              className="w-full p-3 border border-gray-600 rounded-lg text-sm bg-gray-700 text-white placeholder-gray-400 focus:border-indigo-500 focus:outline-none"
            />
            <small className="text-gray-400 text-xs mt-1 block">
              Sprawdź na wyświetlaczu ładowarki lub w aplikacji producenta
            </small>
          </div>

          {/* Czas trwania */}
          <div className="mb-4">
            <label className="block text-sm font-semibold text-gray-300 mb-2">
              Czas ładowania (minuty)
            </label>
            <input
              type="number"
              name="charging_duration_minutes"
              value={formData.charging_duration_minutes}
              onChange={handleChange}
              placeholder="np. 45"
              min="0"
              className="w-full p-3 border border-gray-600 rounded-lg text-sm bg-gray-700 text-white placeholder-gray-400 focus:border-indigo-500 focus:outline-none"
            />
            <small className="text-gray-400 text-xs mt-1 block">
              Opcjonalne - zostanie obliczony automatycznie
            </small>
          </div>

          {/* Szacowany koszt */}
          {formData.energy_delivered_kwh && (
            <div className="bg-indigo-900 bg-opacity-30 p-4 rounded-lg mb-5 border border-indigo-700">
              <p className="text-xs text-gray-400 mb-1">Szacowany koszt</p>
              <p className="text-2xl font-bold text-indigo-400">
                {calculateEstimatedCost()} zł
              </p>
            </div>
          )}

          {/* Przyciski */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className={`flex-1 py-3 border border-gray-600 rounded-lg text-sm font-bold text-gray-300 bg-transparent transition-colors ${
                loading ? 'cursor-not-allowed opacity-50' : 'hover:bg-gray-700 cursor-pointer'
              }`}
            >
              Anuluj
            </button>
            <button
              type="submit"
              disabled={loading || !formData.energy_delivered_kwh}
              className={`flex-1 py-3 border-none rounded-lg text-sm font-bold text-white transition-colors ${
                loading || !formData.energy_delivered_kwh
                  ? 'bg-gray-600 cursor-not-allowed'
                  : 'bg-green-600 hover:bg-green-700 cursor-pointer'
              }`}
            >
              {loading ? 'Kończenie...' : '✅ Zakończ sesję'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default EndChargingSessionModal;
