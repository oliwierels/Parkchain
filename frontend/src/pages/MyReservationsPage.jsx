import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Navigate } from 'react-router-dom';
import { reservationAPI } from '../services/api'; // Używamy tylko tego
import EndChargingSessionModal from '../components/EndChargingSessionModal';

function MyReservationsPage() {
  const { user, loading: authLoading, isAuthenticated } = useAuth();
  // Ten stan będzie teraz przechowywał ustandaryzowane dane
  const [reservations, setReservations] = useState([]);
  const [stats, setStats] = useState({
    totalReservations: 0,
    activeReservations: 0,
    pendingReservations: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all');
  const [showEndChargingModal, setShowEndChargingModal] = useState(false);
  const [selectedSession, setSelectedSession] = useState(null);

  useEffect(() => {
    if (isAuthenticated) {
      fetchData();
    }
  }, [isAuthenticated]);

  const fetchData = async () => {
    try {
      setLoading(true);

      // === KROK 1: Pobieramy OBA typy rezerwacji równolegle ===
      const parkingPromise = reservationAPI.getMyReservations();
      
      const chargingPromise = fetch('http://localhost:3000/api/charging-sessions/my', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      }).then(res => {
        if (res.ok) return res.json();
        throw new Error('Nie udało się pobrać sesji ładowania');
      });

      // Czekamy na oba
      const [parkingData, chargingData] = await Promise.all([
        parkingPromise,
        chargingPromise
      ]);

      // === KROK 2: Standaryzujemy dane do wspólnego formatu ===

      // Mapowanie rezerwacji parkingowych
      const mappedParking = parkingData.map(r => ({
        id: r.id,
        type: 'parking', // Dodajemy typ, aby wiedzieć, co anulować
        name: r.parking_lots.name,
        address: `${r.parking_lots.address}, ${r.parking_lots.city}`,
        startTime: r.start_time,
        endTime: r.end_time,
        price: r.price,
        status: r.status,
        details: `🚗 ${r.license_plate}`, // Dodatkowe info
        originalData: r
      }));

      // Mapowanie sesji ładowania
      const mappedCharging = (chargingData.sessions || []).map(s => {
        // Obliczamy cenę: jeśli total_cost istnieje (sesja zakończona), użyj go
        // W przeciwnym razie oblicz bieżący koszt: energia * cena_za_kWh
        let calculatedPrice = s.total_cost;
        if (!calculatedPrice && s.energy_delivered_kwh && s.charging_stations?.price_per_kwh) {
          calculatedPrice = (parseFloat(s.energy_delivered_kwh) * parseFloat(s.charging_stations.price_per_kwh)).toFixed(2);
        }

        return {
          id: s.id,
          type: 'charging', // Dodajemy typ
          name: s.charging_stations?.name || 'Nieznana stacja',
          address: s.charging_stations?.address || 'Brak adresu',
          startTime: s.start_time,
          endTime: s.end_time,
          price: calculatedPrice, // Używamy obliczonej ceny
          status: s.status,
          details: `⚡ ${s.energy_delivered_kwh || 0} kWh`, // Dodatkowe info
          isEstimated: !s.total_cost && s.status === 'active', // Flaga czy to szacunek
          originalData: s
        };
      });

      // === KROK 3: Łączymy i sortujemy obie listy ===
      const combinedReservations = [...mappedParking, ...mappedCharging];
      
      // Sortujemy po dacie rozpoczęcia (najnowsze na górze)
      combinedReservations.sort((a, b) => new Date(b.startTime) - new Date(a.startTime));

      setReservations(combinedReservations);

      // === KROK 4: Obliczamy statystyki na podstawie połączonych danych ===
      const total = combinedReservations.length;
      const active = combinedReservations.filter(r => r.status === 'active').length;
      const pending = combinedReservations.filter(r => r.status === 'pending').length;

      setStats({
        totalReservations: total,
        activeReservations: active,
        pendingReservations: pending
      });

      setError(null);
    } catch (err) {
      console.error('Błąd pobierania danych:', err);
      setError('Nie udało się załadować rezerwacji');
    } finally {
      setLoading(false);
    }
  };

  // === KROK 5: Aktualizujemy logikę anulowania ===
  const handleCancelReservation = async (id, type) => {
    const confirmationText = type === 'parking'
      ? 'Czy na pewno chcesz anulować tę rezerwację?'
      : 'Czy na pewno chcesz anulować tę sesję ładowania?';

    if (!window.confirm(confirmationText)) {
      return;
    }

    try {
      if (type === 'parking') {
        // Anulowanie rezerwacji parkingu
        await reservationAPI.cancelReservation(id);
      } else if (type === 'charging') {
        // Anulowanie sesji ładowania (musimy użyć fetch, jak zakładaliśmy)
        // Zakładam, że endpoint to /cancel, tak jak w Twoim API
        const response = await fetch(`http://localhost:3000/api/charging-sessions/${id}/cancel`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        if (!response.ok) {
          throw new Error('Nie udało się anulować sesji ładowania');
        }
      }

      fetchData(); // Odświeżamy całą listę
      alert('Anulowano pomyślnie');
    } catch (err) {
      console.error(err);
      alert('Nie udało się anulować');
    }
  };

  // Funkcja do otwierania modala zakończenia sesji ładowania
  const handleEndChargingSession = (reservation) => {
    setSelectedSession(reservation);
    setShowEndChargingModal(true);
  };

  // Funkcja wywoływana po zakończeniu sesji
  const handleChargingSessionEnded = () => {
    setShowEndChargingModal(false);
    setSelectedSession(null);
    fetchData(); // Odśwież listę rezerwacji
  };

  // Reszta funkcji pomocniczych (bez zmian)
  const getStatusClasses = (status) => {
    switch (status) {
      case 'pending': return 'bg-yellow-900 text-yellow-200';
      case 'active': return 'bg-green-900 text-green-200';
      case 'completed': return 'bg-gray-700 text-gray-200';
      case 'cancelled': return 'bg-red-900 text-red-200';
      case 'pending_verification': return 'bg-orange-900 text-orange-200';
      default: return 'bg-gray-700 text-gray-200';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'pending': return 'Oczekująca';
      case 'active': return 'Aktywna';
      case 'completed': return 'Zakończona';
      case 'cancelled': return 'Anulowana';
      case 'pending_verification': return 'Weryfikacja właściciela';
      default: return status;
    }
  };

  // Logika filtrowania (bez zmian, działa na ustandaryzowanym 'status')
  const filteredReservations = reservations.filter(r => {
    switch (filter) {
      case 'active': return r.status === 'active';
      case 'pending': return r.status === 'pending';
      case 'past': return r.status === 'completed';
      case 'cancelled': return r.status === 'cancelled';
      case 'all': default: return true;
    }
  });

  if (authLoading || loading) {
    return <div className="p-10 text-center text-lg text-indigo-400">Ładowanie...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  return (
    <div className="max-w-7xl mx-auto p-6 md:p-8 bg-gray-900 text-gray-100 min-h-screen">
      <h1 className="text-3xl font-bold text-white mb-8">
        Moje Rezerwacje
      </h1>

      {/* Statystyki (bez zmian) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <div className="bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-700">
          <p className="text-sm text-gray-400 mb-1">Wszystkie rezerwacje</p>
          <p className="text-4xl font-bold text-white">{stats.totalReservations}</p>
        </div>
        <div className="bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-700">
          <p className="text-sm text-gray-400 mb-1">Aktywne rezerwacje</p>
          <p className="text-4xl font-bold text-green-500">{stats.activeReservations}</p>
        </div>
        <div className="bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-700">
          <p className="text-sm text-gray-400 mb-1">Oczekujące rezerwacje</p>
          <p className="text-4xl font-bold text-yellow-500">{stats.pendingReservations}</p>
        </div>
      </div>

      {/* Filtry (bez zmian) */}
      <div className="flex gap-3 mb-6 flex-wrap">
        {['all', 'active', 'pending', 'past', 'cancelled'].map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`py-2 px-5 rounded-lg font-bold cursor-pointer transition-colors ${
              filter === f
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            {f === 'all' ? 'Wszystkie' :
             f === 'active' ? 'Aktywne' :
             f === 'pending' ? 'Oczekujące' :
             f === 'past' ? 'Historia' :
             'Anulowane'}
          </button>
        ))}
      </div>

      {error && (
        <div className="bg-red-800 text-red-100 p-4 rounded-lg mb-6">
          ❌ {error}
        </div>
      )}

      {/* === KROK 6: Aktualizujemy renderowanie listy === */}
      {filteredReservations.length === 0 ? (
        <div className="bg-gray-800 p-10 rounded-xl text-center text-gray-400 shadow-lg border border-gray-700">
          <p className="text-lg">Brak rezerwacji w tej kategorii</p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {filteredReservations.map(reservation => { // 'reservation' to teraz nasz ustandaryzowany obiekt
            const statusClasses = getStatusClasses(reservation.status);
            return (
              <div
                key={`${reservation.type}-${reservation.id}`} // Unikalny klucz
                className="bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-700 flex flex-col md:flex-row justify-between items-start gap-6"
              >
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-white mb-2">
                    {reservation.name} {/* Używamy ustandaryzowanego pola */}
                  </h3>
                  <p className="text-gray-400 text-sm mb-1">
                    📍 {reservation.address} {/* Używamy ustandaryzowanego pola */}
                  </p>
                  <p className="text-gray-400 text-sm mb-1">
                    {reservation.details} {/* Używamy ustandaryzowanego pola */}
                  </p>
                  <p className="text-gray-300 text-sm mt-2">
                    📅 {new Date(reservation.startTime).toLocaleString('pl-PL')}
                    {' → '}
                    {/* Aktywne sesje ładowania mogą nie mieć czasu końca */}
                    {reservation.endTime ? new Date(reservation.endTime).toLocaleString('pl-PL') : '...'}
                  </p>
                </div>
                <div className="flex flex-col items-start md:items-end w-full md:w-auto">
                  <div className={`py-1.5 px-3 rounded-full text-xs font-bold mb-3 ${statusClasses}`}>
                    {getStatusText(reservation.status)}
                  </div>
                  <div className="mb-4">
                    <p className="text-2xl font-bold text-indigo-400">
                      {reservation.price ? `${reservation.isEstimated ? '~' : ''}${reservation.price} zł` : '-'}
                    </p>
                    {reservation.isEstimated && (
                      <p className="text-xs text-gray-500 mt-1">
                        (w trakcie)
                      </p>
                    )}
                  </div>
                  {['pending', 'active'].includes(reservation.status) && (
                    <div className="flex flex-col gap-2 w-full md:w-auto">
                      {/* Dla aktywnych sesji ładowania pokaż przycisk "Zakończ ładowanie" */}
                      {reservation.type === 'charging' && reservation.status === 'active' && (
                        <button
                          onClick={() => handleEndChargingSession(reservation)}
                          className="py-2 px-5 rounded-lg font-bold bg-green-600 text-white hover:bg-green-700 transition-colors"
                        >
                          ✅ Zakończ ładowanie
                        </button>
                      )}
                      {/* Przycisk anuluj dla wszystkich pending/active */}
                      <button
                        onClick={() => handleCancelReservation(reservation.id, reservation.type)}
                        className="py-2 px-5 rounded-lg font-bold bg-red-600 text-white hover:bg-red-700 transition-colors"
                      >
                        ❌ Anuluj
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal zakończenia sesji ładowania */}
      {showEndChargingModal && selectedSession && (
        <EndChargingSessionModal
          session={selectedSession}
          onClose={() => setShowEndChargingModal(false)}
          onSuccess={handleChargingSessionEnded}
        />
      )}
    </div>
  );
}

export default MyReservationsPage;