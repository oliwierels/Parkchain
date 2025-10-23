import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

function ChargingDashboardPage() {
  const navigate = useNavigate();
  const [myChargers, setMyChargers] = useState([]);
  const [mySessions, setMySessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({
    totalChargers: 0,
    activeChargers: 0,
    totalSessions: 0,
    activeSessions: 0,
    totalEnergy: 0
  });

  useEffect(() => {
    fetchChargingData();
  }, []);

  const fetchChargingData = async () => {
    try {
      setLoading(true);

      // Pobierz moje ładowarki
      const chargersResponse = await fetch('http://localhost:3000/api/ev-chargers/my', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (chargersResponse.ok) {
        const chargersData = await chargersResponse.json();
        setMyChargers(chargersData || []);

        const activeChargers = chargersData.filter(c => c.available_connectors > 0).length;

        setStats(prev => ({
          ...prev,
          totalChargers: chargersData.length,
          activeChargers
        }));
      }

      // Pobierz moje sesje ładowania
      const sessionsResponse = await fetch('http://localhost:3000/api/charging-sessions/my', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (sessionsResponse.ok) {
        const sessionsData = await sessionsResponse.json();
        setMySessions(sessionsData.sessions || []);

        const activeSessions = sessionsData.sessions?.filter(s => s.status === 'active').length || 0;
        const totalEnergy = sessionsData.sessions
          ?.filter(s => s.energy_delivered_kwh)
          .reduce((sum, s) => sum + parseFloat(s.energy_delivered_kwh || 0), 0) || 0;

        setStats(prev => ({
          ...prev,
          totalSessions: sessionsData.sessions?.length || 0,
          activeSessions,
          totalEnergy: totalEnergy.toFixed(2)
        }));
      }

      setError(null);
    } catch (err) {
      console.error('Błąd pobierania danych ładowarek:', err);
      setError('Nie udało się załadować danych');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pl-PL', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Zwracamy klasy Tailwind dla DARK MODE
  const getStatusClasses = (status) => {
    switch (status) {
      case 'active':
        return 'bg-blue-900 text-blue-200';
      case 'completed':
        return 'bg-green-900 text-green-200';
      case 'cancelled':
        return 'bg-red-900 text-red-200';
      default:
        return 'bg-gray-700 text-gray-200';
    }
  };

  if (loading) {
    return (
      <div className="p-10 text-center text-lg text-indigo-400">
        Ładowanie danych...
      </div>
    );
  }

  return (
    // ========= ⬇️ GŁÓWNA ZMIANA TŁA ⬇️ =========
    <div className="max-w-7xl mx-auto p-6 md:p-8 bg-gray-900 text-gray-100 min-h-screen">
      
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-white flex items-center gap-3">
          ⚡ Moje ładowarki
        </h1>
        <button
          onClick={() => navigate('/map')}
          // Przycisk pozostaje jasny dla kontrastu
          className="bg-amber-500 text-white py-3 px-6 rounded-lg font-bold text-base cursor-pointer hover:bg-amber-600 transition-colors duration-200"
        >
          + Dodaj ładowarkę
        </button>
      </div>

      {error && (
        <div className="bg-red-800 text-red-100 p-4 rounded-lg mb-6">
          {error}
        </div>
      )}

      {/* Statystyki */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 mb-10">
        
        {/* Karta statystyk (ciemne tło) */}
        <div className="bg-gray-800 p-6 rounded-xl shadow-lg border-2 border-amber-500">
          <p className="text-sm text-gray-400 mb-1">Moje ładowarki</p>
          <p className="text-4xl font-bold text-amber-500">{stats.totalChargers}</p>
        </div>
        
        <div className="bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-700">
          <p className="text-sm text-gray-400 mb-1">Aktywne złącza</p>
          <p className="text-4xl font-bold text-green-500">{stats.activeChargers}</p>
        </div>

        <div className="bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-700">
          <p className="text-sm text-gray-400 mb-1">Wszystkie sesje</p>
          <p className="text-4xl font-bold text-indigo-400">{stats.totalSessions}</p>
        </div>

        <div className="bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-700">
          <p className="text-sm text-gray-400 mb-1">Aktywne sesje</p>
          <p className="text-4xl font-bold text-blue-400">{stats.activeSessions}</p>
        </div>

        <div className="bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-700">
          <p className="text-sm text-gray-400 mb-1">Energia dostarczona</p>
          <p className="text-4xl font-bold text-green-500">{stats.totalEnergy} kWh</p>
        </div>
      </div>

      {/* Moje ładowarki */}
      <div className="mb-10">
        <h2 className="text-2xl font-bold mb-5 text-white">
          Lista moich ładowarek
        </h2>

        {myChargers.length === 0 ? (
          <div className="bg-gray-800 p-10 md:p-16 rounded-xl text-center shadow-lg border border-gray-700">
            <div className="text-6xl mb-4">⚡</div>
            <h3 className="text-xl font-bold text-white mb-2">
              Nie masz jeszcze ładowarek
            </h3>
            <p className="text-gray-400 mb-6">
              Dodaj pierwszą ładowarkę na mapie
            </p>
            <button
              onClick={() => navigate('/map')}
              className="bg-amber-500 text-white py-3 px-6 rounded-lg font-bold cursor-pointer hover:bg-amber-600 transition-colors"
            >
              Przejdź do mapy
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {myChargers.map((charger) => (
              <div
                key={charger.id}
                className="bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-700 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:border-gray-600"
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-bold text-white mb-1">
                      {charger.name}
                    </h3>
                    <p className="text-gray-400 text-sm">
                      {charger.address}
                      {charger.city && `, ${charger.city}`}
                    </p>
                  </div>
                  {/* Dynamiczny tag statusu (wersja dark) */}
                  <span className={`py-1 px-3 rounded-full text-xs font-bold whitespace-nowrap ${
                    charger.available_connectors > 0
                      ? 'bg-green-900 text-green-200'
                      : 'bg-red-900 text-red-200'
                  }`}>
                    {charger.available_connectors}/{charger.total_connectors} wolne
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-x-4 gap-y-3 pt-4 border-t border-gray-700">
                  <div>
                    <p className="text-xs text-gray-400 mb-0.5">Typ ładowarki</p>
                    <p className="text-base font-bold text-gray-100">{charger.charger_type}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 mb-0.5">Moc maksymalna</p>
                    <p className="text-base font-bold text-amber-500">{charger.max_power_kw} kW</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 mb-0.5">Cena za kWh</p>
                    <p className="text-base font-bold text-green-500">{charger.price_per_kwh} zł</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 mb-0.5">Liczba złączy</p>
                    <p className="text-base font-bold text-gray-100">{charger.total_connectors}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Moje sesje ładowania */}
      <div>
        <h2 className="text-2xl font-bold mb-5 text-white">
          Historia sesji ładowania
        </h2>

        {mySessions.length === 0 ? (
          <div className="bg-gray-800 p-10 rounded-xl text-center text-gray-400 shadow-lg border border-gray-700">
            Nie masz jeszcze żadnych sesji ładowania
          </div>
        ) : (
          // Kontener tabeli
          <div className="bg-gray-800 rounded-xl shadow-lg overflow-hidden border border-gray-700">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-700">
                <thead className="bg-gray-700">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Stacja</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Data rozpoczęcia</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Energia</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Koszt</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody className="bg-gray-800 divide-y divide-gray-700">
                  {mySessions.map((session) => {
                    const statusClasses = getStatusClasses(session.status);
                    return (
                      <tr key={session.id} className="hover:bg-gray-700 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="font-medium text-white">{session.charging_stations?.name || 'Nieznana stacja'}</div>
                          <div className="text-sm text-gray-400">{session.charging_stations?.address}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                          {formatDate(session.start_time)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-amber-500">
                          {session.energy_delivered_kwh ? `${session.energy_delivered_kwh} kWh` : '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-500">
                          {session.total_cost ? `${session.total_cost} zł` : '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`py-1.5 px-3 rounded-full text-xs font-bold ${statusClasses}`}>
                            {session.status === 'active' ? 'Aktywna' :
                             session.status === 'completed' ? 'Zakończona' :
                             session.status === 'cancelled' ? 'Anulowana' : session.status}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default ChargingDashboardPage;