import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

function OwnerDashboardPage() {
  const navigate = useNavigate();
  const [myParkings, setMyParkings] = useState([]);
  const [allReservations, setAllReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({
    totalParkings: 0,
    totalReservations: 0,
    totalEarnings: 0,
    activeParkings: 0
  });

  useEffect(() => {
    fetchOwnerData();
  }, []);

  const fetchOwnerData = async () => {
    try {
      setLoading(true);

      // Pobierz moje parkingi
      const parkingsResponse = await fetch('http://localhost:3000/api/parking-lots/my', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!parkingsResponse.ok) {
        throw new Error('Nie udało się pobrać parkingów');
      }

      const parkingsData = await parkingsResponse.json();
      setMyParkings(parkingsData || []);

      // Pobierz wszystkie rezerwacje (filtrujemy po stronie klienta)
      const reservationsResponse = await fetch('http://localhost:3000/api/reservations', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (reservationsResponse.ok) {
        const reservationsData = await reservationsResponse.json();

        // Filtruj rezerwacje tylko dla moich parkingów
        const myParkingIds = parkingsData.map(p => p.id);
        const myReservations = (reservationsData || []).filter(r =>
          myParkingIds.includes(r.lot_id)
        );

        setAllReservations(myReservations);

        // Oblicz statystyki
        const totalEarnings = myReservations
          .filter(r => r.status !== 'cancelled')
          .reduce((sum, r) => sum + (parseFloat(r.price) || 0), 0);

        const activeParkings = parkingsData.filter(p => p.available_spots > 0).length;

        setStats({
          totalParkings: parkingsData.length,
          totalReservations: myReservations.length,
          totalEarnings: totalEarnings.toFixed(2),
          activeParkings
        });
      }

      setError(null);
    } catch (err) {
      console.error('Błąd pobierania danych właściciela:', err);
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

  // Funkcje pomocnicze do statusów (dla dark mode)
  const getStatusClasses = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-blue-900 text-blue-200';
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

  if (loading) {
    return (
      <div className="p-10 text-center text-lg text-indigo-400">
        Ładowanie danych...
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6 md:p-8 bg-gray-900 text-gray-100 min-h-screen">
      
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-white">
          Panel właściciela
        </h1>
        <button
          onClick={() => navigate('/add-parking')}
          className="bg-indigo-600 text-white py-3 px-6 rounded-lg font-bold text-base cursor-pointer hover:bg-indigo-700 transition-colors"
        >
          + Dodaj parking
        </button>
      </div>

      {error && (
        <div className="bg-red-800 text-red-100 p-4 rounded-lg mb-6">
          {error}
        </div>
      )}

      {/* Statystyki */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        <div className="bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-700">
          <p className="text-sm text-gray-400 mb-1">Moje parkingi</p>
          <p className="text-4xl font-bold text-white">{stats.totalParkings}</p>
        </div>

        <div className="bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-700">
          <p className="text-sm text-gray-400 mb-1">Aktywne parkingi</p>
          <p className="text-4xl font-bold text-green-500">{stats.activeParkings}</p>
        </div>

        <div className="bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-700">
          <p className="text-sm text-gray-400 mb-1">Rezerwacje</p>
          <p className="text-4xl font-bold text-indigo-400">{stats.totalReservations}</p>
        </div>

        <div className="bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-700">
          <p className="text-sm text-gray-400 mb-1">Zarobki</p>
          <p className="text-4xl font-bold text-green-500">{stats.totalEarnings} zł</p>
        </div>
      </div>

      {/* Lista parkingów */}
      <div className="mb-10">
        <h2 className="text-2xl font-bold mb-5 text-white">
          Moje parkingi
        </h2>

        {myParkings.length === 0 ? (
          <div className="bg-gray-800 p-10 rounded-xl text-center text-gray-400 shadow-lg border border-gray-700">
            <p className="text-lg mb-4">
              Nie masz jeszcze żadnych parkingów
            </p>
            <button
              onClick={() => navigate('/add-parking')}
              className="bg-indigo-600 text-white py-2 px-5 rounded-lg font-bold hover:bg-indigo-700 transition-colors"
            >
              Dodaj pierwszy parking
            </button>
          </div>
        ) : (
          <div className="grid gap-4">
            {myParkings.map(parking => {
              const activeReservations = allReservations.filter(
                r => r.lot_id === parking.id && (r.status === 'pending' || r.status === 'active')
              );

              return (
                <div
                  key={parking.id}
                  className="bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-700 flex flex-col sm:flex-row justify-between items-start gap-4"
                >
                  {/* Info */}
                  <div>
                    <h3 className="text-xl font-bold text-white mb-2">
                      {parking.name}
                    </h3>
                    <p className="text-sm text-gray-400 mb-2">
                      {parking.address}
                    </p>
                    <p className="text-lg font-bold text-indigo-400">
                      {parking.price_per_hour} zł/godz
                    </p>
                  </div>
                  {/* Status */}
                  <div className="text-left sm:text-right w-full sm:w-auto">
                    <span
                      className={`py-1.5 px-3 rounded-md text-sm font-bold whitespace-nowrap ${
                        parking.available_spots > 0
                          ? 'bg-green-900 text-green-200'
                          : 'bg-red-900 text-red-200'
                      }`}
                    >
                      {parking.available_spots}/{parking.total_spots} miejsc
                    </span>
                    <p className="text-sm text-gray-400 mt-2">
                      {activeReservations.length} aktywnych rezerwacji
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Rezerwacje */}
      <div>
        <h2 className="text-2xl font-bold mb-5 text-white">
          Rezerwacje na moich parkingach
        </h2>

        {allReservations.length === 0 ? (
          <div className="bg-gray-800 p-10 rounded-xl text-center text-gray-400 shadow-lg border border-gray-700">
            <p className="text-lg">
              Brak rezerwacji
            </p>
          </div>
        ) : (
          <div className="bg-gray-800 rounded-xl shadow-lg overflow-hidden border border-gray-700">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-700">
                <thead className="bg-gray-700">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Parking</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Użytkownik</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Start</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Koniec</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Cena</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody className="bg-gray-800 divide-y divide-gray-700">
                  {allReservations.map((reservation) => {
                    const parking = myParkings.find(p => p.id === reservation.lot_id);
                    const statusClasses = getStatusClasses(reservation.status);

                    return (
                      <tr key={reservation.id} className="hover:bg-gray-700 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">
                          {parking?.name || 'Nieznany'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                          {reservation.users?.full_name || reservation.users?.email || 'Nieznany'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                          {formatDate(reservation.start_time)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                          {formatDate(reservation.end_time)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-500">
                          {parseFloat(reservation.price).toFixed(2)} zł
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`py-1.5 px-3 rounded-full text-xs font-bold ${statusClasses}`}>
                            {getStatusText(reservation.status)}
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

export default OwnerDashboardPage;