import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Navigate } from 'react-router-dom';
import { reservationAPI, userAPI } from '../services/api';

function MyReservationsPage() {
  const { user, loading: authLoading, isAuthenticated } = useAuth();
  const [reservations, setReservations] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all'); // all, active, past, cancelled

  useEffect(() => {
    if (isAuthenticated) {
      fetchData();
    }
  }, [isAuthenticated]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [reservationsData, statsData] = await Promise.all([
        reservationAPI.getMyReservations(),
        userAPI.getStats()
      ]);
      setReservations(reservationsData);
      setStats(statsData);
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
      // Odśwież dane
      fetchData();
      alert('Rezerwacja została anulowana');
    } catch (err) {
      alert('Nie udało się anulować rezerwacji');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return '#FFA500';
      case 'active': return '#22C55E';
      case 'completed': return '#6B7280';
      case 'cancelled': return '#EF4444';
      default: return '#6B7280';
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

  const filteredReservations = reservations.filter(r => {
    if (filter === 'all') return true;
    if (filter === 'active') return ['pending', 'active'].includes(r.status);
    if (filter === 'past') return r.status === 'completed';
    if (filter === 'cancelled') return r.status === 'cancelled';
    return true;
  });

  if (authLoading || loading) {
    return <div style={{ padding: '40px', textAlign: 'center' }}>Ładowanie...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  return (
    <div style={{ maxWidth: '1200px', margin: '40px auto', padding: '20px' }}>
      {/* Header z statystykami */}
      <h1 style={{ fontSize: '32px', fontWeight: 'bold', marginBottom: '30px' }}>
        Moje Rezerwacje
      </h1>

      {stats && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '20px',
          marginBottom: '30px'
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '20px',
            borderRadius: '15px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
          }}>
            <p style={{ fontSize: '14px', color: '#6b7280', marginBottom: '5px' }}>
              Wszystkie rezerwacje
            </p>
            <p style={{ fontSize: '32px', fontWeight: 'bold', color: '#1f2937' }}>
              {stats.totalReservations}
            </p>
          </div>

          <div style={{
            backgroundColor: 'white',
            padding: '20px',
            borderRadius: '15px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
          }}>
            <p style={{ fontSize: '14px', color: '#6b7280', marginBottom: '5px' }}>
              Aktywne rezerwacje
            </p>
            <p style={{ fontSize: '32px', fontWeight: 'bold', color: '#22C55E' }}>
              {stats.activeReservations}
            </p>
          </div>

          <div style={{
            backgroundColor: 'white',
            padding: '20px',
            borderRadius: '15px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
          }}>
            <p style={{ fontSize: '14px', color: '#6b7280', marginBottom: '5px' }}>
              Wydane pieniądze
            </p>
            <p style={{ fontSize: '32px', fontWeight: 'bold', color: '#6366F1' }}>
              {stats.totalSpent} zł
            </p>
          </div>
        </div>
      )}

      {/* Filtry */}
      <div style={{
        display: 'flex',
        gap: '10px',
        marginBottom: '20px',
        flexWrap: 'wrap'
      }}>
        {['all', 'active', 'past', 'cancelled'].map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            style={{
              padding: '10px 20px',
              borderRadius: '8px',
              border: 'none',
              backgroundColor: filter === f ? '#6366F1' : 'white',
              color: filter === f ? 'white' : '#6b7280',
              fontWeight: 'bold',
              cursor: 'pointer',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }}
          >
            {f === 'all' ? 'Wszystkie' : 
             f === 'active' ? 'Aktywne' :
             f === 'past' ? 'Historia' :
             'Anulowane'}
          </button>
        ))}
      </div>

      {/* Error */}
      {error && (
        <div style={{
          backgroundColor: '#fee2e2',
          color: '#991b1b',
          padding: '15px',
          borderRadius: '8px',
          marginBottom: '20px'
        }}>
          ❌ {error}
        </div>
      )}

      {/* Lista rezerwacji */}
      {filteredReservations.length === 0 ? (
        <div style={{
          backgroundColor: 'white',
          padding: '40px',
          borderRadius: '15px',
          textAlign: 'center',
          color: '#6b7280'
        }}>
          <p style={{ fontSize: '18px' }}>Brak rezerwacji</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          {filteredReservations.map(reservation => (
            <div
              key={reservation.id}
              style={{
                backgroundColor: 'white',
                padding: '20px',
                borderRadius: '15px',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                flexWrap: 'wrap',
                gap: '20px'
              }}
            >
              <div style={{ flex: 1, minWidth: '250px' }}>
                <h3 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '10px' }}>
                  {reservation.parking_lots.name}
                </h3>
                <p style={{ color: '#6b7280', fontSize: '14px', marginBottom: '5px' }}>
                  📍 {reservation.parking_lots.address}, {reservation.parking_lots.city}
                </p>
                <p style={{ color: '#6b7280', fontSize: '14px', marginBottom: '5px' }}>
                  🚗 {reservation.license_plate}
                </p>
                <p style={{ color: '#6b7280', fontSize: '14px' }}>
                  📅 {new Date(reservation.start_time).toLocaleString('pl-PL')} 
                  {' → '} 
                  {new Date(reservation.end_time).toLocaleString('pl-PL')}
                </p>
              </div>

              <div style={{ textAlign: 'right' }}>
                <div style={{
                  display: 'inline-block',
                  padding: '5px 15px',
                  borderRadius: '20px',
                  backgroundColor: getStatusColor(reservation.status) + '20',
                  color: getStatusColor(reservation.status),
                  fontWeight: 'bold',
                  fontSize: '14px',
                  marginBottom: '10px'
                }}>
                  {getStatusText(reservation.status)}
                </div>
                <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#6366F1', marginBottom: '15px' }}>
                  {reservation.price} zł
                </p>

                {['pending', 'active'].includes(reservation.status) && (
                  <button
                    onClick={() => handleCancelReservation(reservation.id)}
                    style={{
                      padding: '8px 20px',
                      backgroundColor: '#EF4444',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      fontWeight: 'bold',
                      cursor: 'pointer'
                    }}
                  >
                    Anuluj
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default MyReservationsPage;