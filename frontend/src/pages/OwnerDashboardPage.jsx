// frontend/src/pages/OwnerDashboardPage.jsx

import { useState, useEffect } from 'react';
import { parkingAPI, reservationAPI } from '../services/api';
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

  if (loading) {
    return (
      <div style={{
        padding: '40px',
        textAlign: 'center',
        fontSize: '18px',
        color: '#6366F1'
      }}>
        Ładowanie danych...
      </div>
    );
  }

  return (
    <div style={{
      maxWidth: '1400px',
      margin: '0 auto',
      padding: '30px'
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '30px'
      }}>
        <h1 style={{
          fontSize: '32px',
          fontWeight: 'bold',
          color: '#1f2937'
        }}>
          Panel właściciela
        </h1>
        <button
          onClick={() => navigate('/add-parking')}
          style={{
            backgroundColor: '#6366F1',
            color: 'white',
            padding: '12px 24px',
            borderRadius: '8px',
            border: 'none',
            fontWeight: 'bold',
            fontSize: '16px',
            cursor: 'pointer'
          }}
        >
          + Dodaj parking
        </button>
      </div>

      {error && (
        <div style={{
          backgroundColor: '#fee2e2',
          color: '#991b1b',
          padding: '16px',
          borderRadius: '8px',
          marginBottom: '20px'
        }}>
          {error}
        </div>
      )}

      {/* Statystyki */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
        gap: '20px',
        marginBottom: '40px'
      }}>
        <div style={{
          backgroundColor: 'white',
          padding: '24px',
          borderRadius: '12px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
        }}>
          <p style={{ fontSize: '14px', color: '#6b7280', margin: '0 0 8px 0' }}>
            Moje parkingi
          </p>
          <p style={{ fontSize: '32px', fontWeight: 'bold', color: '#1f2937', margin: 0 }}>
            {stats.totalParkings}
          </p>
        </div>

        <div style={{
          backgroundColor: 'white',
          padding: '24px',
          borderRadius: '12px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
        }}>
          <p style={{ fontSize: '14px', color: '#6b7280', margin: '0 0 8px 0' }}>
            Aktywne parkingi
          </p>
          <p style={{ fontSize: '32px', fontWeight: 'bold', color: '#10b981', margin: 0 }}>
            {stats.activeParkings}
          </p>
        </div>

        <div style={{
          backgroundColor: 'white',
          padding: '24px',
          borderRadius: '12px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
        }}>
          <p style={{ fontSize: '14px', color: '#6b7280', margin: '0 0 8px 0' }}>
            Rezerwacje
          </p>
          <p style={{ fontSize: '32px', fontWeight: 'bold', color: '#6366F1', margin: 0 }}>
            {stats.totalReservations}
          </p>
        </div>

        <div style={{
          backgroundColor: 'white',
          padding: '24px',
          borderRadius: '12px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
        }}>
          <p style={{ fontSize: '14px', color: '#6b7280', margin: '0 0 8px 0' }}>
            Zarobki
          </p>
          <p style={{ fontSize: '32px', fontWeight: 'bold', color: '#059669', margin: 0 }}>
            {stats.totalEarnings} zł
          </p>
        </div>
      </div>

      {/* Lista parkingów */}
      <div style={{ marginBottom: '40px' }}>
        <h2 style={{
          fontSize: '24px',
          fontWeight: 'bold',
          marginBottom: '20px',
          color: '#1f2937'
        }}>
          Moje parkingi
        </h2>

        {myParkings.length === 0 ? (
          <div style={{
            backgroundColor: 'white',
            padding: '40px',
            borderRadius: '12px',
            textAlign: 'center',
            color: '#6b7280'
          }}>
            <p style={{ fontSize: '18px', marginBottom: '16px' }}>
              Nie masz jeszcze żadnych parkingów
            </p>
            <button
              onClick={() => navigate('/add-parking')}
              style={{
                backgroundColor: '#6366F1',
                color: 'white',
                padding: '10px 20px',
                borderRadius: '8px',
                border: 'none',
                fontWeight: 'bold',
                cursor: 'pointer'
              }}
            >
              Dodaj pierwszy parking
            </button>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gap: '16px'
          }}>
            {myParkings.map(parking => {
              const parkingReservations = allReservations.filter(r => r.lot_id === parking.id);
              const activeReservations = parkingReservations.filter(r => r.status === 'pending' || r.status === 'active');

              return (
                <div
                  key={parking.id}
                  style={{
                    backgroundColor: 'white',
                    padding: '24px',
                    borderRadius: '12px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                  }}
                >
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'start',
                    marginBottom: '16px'
                  }}>
                    <div>
                      <h3 style={{
                        fontSize: '20px',
                        fontWeight: 'bold',
                        margin: '0 0 8px 0',
                        color: '#1f2937'
                      }}>
                        {parking.name}
                      </h3>
                      <p style={{
                        fontSize: '14px',
                        color: '#6b7280',
                        margin: '0 0 8px 0'
                      }}>
                        {parking.address}
                      </p>
                      <p style={{
                        fontSize: '16px',
                        fontWeight: 'bold',
                        color: '#6366F1',
                        margin: 0
                      }}>
                        {parking.price_per_hour} zł/godz
                      </p>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <span style={{
                        display: 'inline-block',
                        padding: '6px 12px',
                        borderRadius: '6px',
                        fontSize: '14px',
                        fontWeight: 'bold',
                        backgroundColor: parking.available_spots > 0 ? '#d1fae5' : '#fee2e2',
                        color: parking.available_spots > 0 ? '#065f46' : '#991b1b'
                      }}>
                        {parking.available_spots}/{parking.total_spots} miejsc
                      </span>
                      <p style={{
                        fontSize: '14px',
                        color: '#6b7280',
                        margin: '8px 0 0 0'
                      }}>
                        {activeReservations.length} aktywnych rezerwacji
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Rezerwacje */}
      <div>
        <h2 style={{
          fontSize: '24px',
          fontWeight: 'bold',
          marginBottom: '20px',
          color: '#1f2937'
        }}>
          Rezerwacje na moich parkingach
        </h2>

        {allReservations.length === 0 ? (
          <div style={{
            backgroundColor: 'white',
            padding: '40px',
            borderRadius: '12px',
            textAlign: 'center',
            color: '#6b7280'
          }}>
            <p style={{ fontSize: '18px' }}>
              Brak rezerwacji
            </p>
          </div>
        ) : (
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            overflow: 'hidden',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
          }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: '#f9fafb' }}>
                  <th style={{
                    padding: '16px',
                    textAlign: 'left',
                    fontSize: '14px',
                    fontWeight: 'bold',
                    color: '#6b7280'
                  }}>
                    Parking
                  </th>
                  <th style={{
                    padding: '16px',
                    textAlign: 'left',
                    fontSize: '14px',
                    fontWeight: 'bold',
                    color: '#6b7280'
                  }}>
                    Użytkownik
                  </th>
                  <th style={{
                    padding: '16px',
                    textAlign: 'left',
                    fontSize: '14px',
                    fontWeight: 'bold',
                    color: '#6b7280'
                  }}>
                    Start
                  </th>
                  <th style={{
                    padding: '16px',
                    textAlign: 'left',
                    fontSize: '14px',
                    fontWeight: 'bold',
                    color: '#6b7280'
                  }}>
                    Koniec
                  </th>
                  <th style={{
                    padding: '16px',
                    textAlign: 'left',
                    fontSize: '14px',
                    fontWeight: 'bold',
                    color: '#6b7280'
                  }}>
                    Cena
                  </th>
                  <th style={{
                    padding: '16px',
                    textAlign: 'left',
                    fontSize: '14px',
                    fontWeight: 'bold',
                    color: '#6b7280'
                  }}>
                    Status
                  </th>
                </tr>
              </thead>
              <tbody>
                {allReservations.map((reservation, index) => {
                  const parking = myParkings.find(p => p.id === reservation.lot_id);

                  return (
                    <tr
                      key={reservation.id}
                      style={{
                        borderTop: index > 0 ? '1px solid #e5e7eb' : 'none'
                      }}
                    >
                      <td style={{ padding: '16px', fontSize: '14px', color: '#1f2937' }}>
                        {parking?.name || 'Nieznany'}
                      </td>
                      <td style={{ padding: '16px', fontSize: '14px', color: '#1f2937' }}>
                        {reservation.users?.full_name || reservation.users?.email || 'Nieznany'}
                      </td>
                      <td style={{ padding: '16px', fontSize: '14px', color: '#6b7280' }}>
                        {formatDate(reservation.start_time)}
                      </td>
                      <td style={{ padding: '16px', fontSize: '14px', color: '#6b7280' }}>
                        {formatDate(reservation.end_time)}
                      </td>
                      <td style={{
                        padding: '16px',
                        fontSize: '14px',
                        fontWeight: 'bold',
                        color: '#059669'
                      }}>
                        {parseFloat(reservation.price).toFixed(2)} zł
                      </td>
                      <td style={{ padding: '16px' }}>
                        <span style={{
                          display: 'inline-block',
                          padding: '4px 12px',
                          borderRadius: '6px',
                          fontSize: '12px',
                          fontWeight: 'bold',
                          backgroundColor:
                            reservation.status === 'pending' ? '#dbeafe' :
                            reservation.status === 'active' ? '#d1fae5' :
                            reservation.status === 'completed' ? '#f3f4f6' :
                            '#fee2e2',
                          color:
                            reservation.status === 'pending' ? '#1e40af' :
                            reservation.status === 'active' ? '#065f46' :
                            reservation.status === 'completed' ? '#6b7280' :
                            '#991b1b'
                        }}>
                          {reservation.status === 'pending' ? 'Oczekująca' :
                           reservation.status === 'active' ? 'Aktywna' :
                           reservation.status === 'completed' ? 'Zakończona' :
                           'Anulowana'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default OwnerDashboardPage;
