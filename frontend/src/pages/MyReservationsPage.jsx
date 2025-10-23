import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Navigate } from 'react-router-dom';
import { reservationAPI } from '../services/api';

function MyReservationsPage() {
  const { user, loading: authLoading, isAuthenticated } = useAuth();
  const [reservations, setReservations] = useState([]);
  const [stats, setStats] = useState({
    totalReservations: 0,
    activeReservations: 0,
    pendingReservations: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all'); // 'all', 'active', 'pending', 'past', 'cancelled'

  useEffect(() => {
    if (isAuthenticated) {
      fetchData();
    }
  }, [isAuthenticated]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const reservationsData = await reservationAPI.getMyReservations();
      setReservations(reservationsData);

      const total = reservationsData.length;
      const active = reservationsData.filter(r => r.status === 'active').length;
      const pending = reservationsData.filter(r => r.status === 'pending').length;

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

  const handleCancelReservation = async (id) => {
    if (!window.confirm('Czy na pewno chcesz anulować tę rezerwację?')) {
      return;
    }
    try {
      await reservationAPI.cancelReservation(id);
      fetchData();
      alert('Rezerwacja została anulowana');
    } catch (err) {
      alert('Nie udało się anulować rezerwacji');
    }
  };

  const getStatusClasses = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-900 text-yellow-200';
      case 'active':
        return 'bg-green-900 text-green-200';
      case 'completed':
        return 'bg-gray-700 text-gray-200';
      case 'cancelled':
        return 'bg-red-900 text-red-200';
      default:
        return 'bg-gray-700 text-gray-200';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'pending': return 'Oczekująca';
      case 'active': return 'Aktywna';
      case 'completed': return 'Zakończona';
      case 'cancelled': return 'Anulowana';
      default: return status;
    }
  };

  // ========= ⬇️ TUTAJ JEST POPRAWKA ⬇️ =========
  // Poprawiona logika filtrowania z 5 kategoriami
  const filteredReservations = reservations.filter(r => {
    switch (filter) {
      case 'active':
        return r.status === 'active';
      case 'pending':
        return r.status === 'pending';
      case 'past':
        return r.status === 'completed';
      case 'cancelled':
        return r.status === 'cancelled';
      case 'all':
      default:
        return true;
    }
  });
  // =============================================

  if (authLoading || loading) {
    return (
      <div className="p-10 text-center text-lg text-indigo-400">
        Ładowanie...
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  return (
    <div className="max-w-7xl mx-auto p-6 md:p-8 bg-gray-900 text-gray-100 min-h-screen">
      <h1 className="text-3xl font-bold text-white mb-8">
        Moje Rezerwacje
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        
        <div className="bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-700">
          <p className="text-sm text-gray-400 mb-1">
            Wszystkie rezerwacje
          </p>
          <p className="text-4xl font-bold text-white">
            {stats.totalReservations}
          </p>
        </div>

        <div className="bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-700">
          <p className="text-sm text-gray-400 mb-1">
            Aktywne rezerwacje
          </p>
          <p className="text-4xl font-bold text-green-500">
            {stats.activeReservations}
          </p>
        </div>

        <div className="bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-700">
          <p className="text-sm text-gray-400 mb-1">
            Oczekujące rezerwacje
          </p>
          <p className="text-4xl font-bold text-yellow-500">
            {stats.pendingReservations}
          </p>
        </div>
      </div>

      {/* ========= ⬇️ TUTAJ JEST POPRAWKA ⬇️ ========= */}
      {/* Dodaliśmy przycisk "Oczekujące" */}
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
            {/* Dodaliśmy logikę wyświetlania dla "pending" */}
            {f === 'all' ? 'Wszystkie' :
             f === 'active' ? 'Aktywne' :
             f === 'pending' ? 'Oczekujące' :
             f === 'past' ? 'Historia' :
             'Anulowane'}
          </button>
        ))}
      </div>
      {/* ============================================= */}

      {error && (
        <div className="bg-red-800 text-red-100 p-4 rounded-lg mb-6">
          ❌ {error}
        </div>
      )}

      {/* Reszta kodu bez zmian */}
      {filteredReservations.length === 0 ? (
        <div className="bg-gray-800 p-10 rounded-xl text-center text-gray-400 shadow-lg border border-gray-700">
          <p className="text-lg">Brak rezerwacji w tej kategorii</p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {filteredReservations.map(reservation => {
            const statusClasses = getStatusClasses(reservation.status);
            return (
              <div
                key={reservation.id}
                className="bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-700 flex flex-col md:flex-row justify-between items-start gap-6"
              >
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-white mb-2">
                    {reservation.parking_lots.name}
                  </h3>
                  <p className="text-gray-400 text-sm mb-1">
                    📍 {reservation.parking_lots.address}, {reservation.parking_lots.city}
                  </p>
                  <p className="text-gray-400 text-sm mb-1">
                    🚗 {reservation.license_plate}
                  </p>
                  <p className="text-gray-300 text-sm mt-2">
                    📅 {new Date(reservation.start_time).toLocaleString('pl-PL')}
                    {' → '}
                    {new Date(reservation.end_time).toLocaleString('pl-PL')}
                  </p>
                </div>
                <div className="flex flex-col items-start md:items-end w-full md:w-auto">
                  <div className={`py-1.5 px-3 rounded-full text-xs font-bold mb-3 ${statusClasses}`}>
                    {getStatusText(reservation.status)}
                  </div>
                  <p className="text-2xl font-bold text-indigo-400 mb-4">
                    {reservation.price} zł
                  </p>
                  {['pending', 'active'].includes(reservation.status) && (
                    <button
                      onClick={() => handleCancelReservation(reservation.id)}
                      className="py-2 px-5 rounded-lg font-bold bg-red-600 text-white hover:bg-red-700 transition-colors"
                    >
                      Anuluj
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default MyReservationsPage;