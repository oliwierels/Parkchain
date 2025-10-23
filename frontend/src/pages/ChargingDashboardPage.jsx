// frontend/src/pages/ChargingDashboardPage.jsx

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

  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return { bg: '#DBEAFE', text: '#1E40AF' };
      case 'completed':
        return { bg: '#D1FAE5', text: '#059669' };
      case 'cancelled':
        return { bg: '#FEE2E2', text: '#DC2626' };
      default:
        return { bg: '#F3F4F6', text: '#6B7280' };
    }
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
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '30px'
      }}>
        <h1 style={{
          fontSize: '32px',
          fontWeight: 'bold',
          color: '#1f2937',
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}>
          ⚡ Moje ładowarki
        </h1>
        <button
          onClick={() => navigate('/map')}
          style={{
            backgroundColor: '#F59E0B',
            color: 'white',
            padding: '12px 24px',
            borderRadius: '8px',
            border: 'none',
            fontWeight: 'bold',
            fontSize: '16px',
            cursor: 'pointer'
          }}
        >
          + Dodaj ładowarkę
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
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '20px',
        marginBottom: '40px'
      }}>
        <div style={{
          backgroundColor: 'white',
          padding: '24px',
          borderRadius: '12px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          border: '2px solid #F59E0B'
        }}>
          <p style={{ fontSize: '14px', color: '#6b7280', margin: '0 0 8px 0' }}>
            Moje ładowarki
          </p>
          <p style={{ fontSize: '32px', fontWeight: 'bold', color: '#F59E0B', margin: 0 }}>
            {stats.totalChargers}
          </p>
        </div>

        <div style={{
          backgroundColor: 'white',
          padding: '24px',
          borderRadius: '12px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
        }}>
          <p style={{ fontSize: '14px', color: '#6b7280', margin: '0 0 8px 0' }}>
            Aktywne złącza
          </p>
          <p style={{ fontSize: '32px', fontWeight: 'bold', color: '#059669', margin: 0 }}>
            {stats.activeChargers}
          </p>
        </div>

        <div style={{
          backgroundColor: 'white',
          padding: '24px',
          borderRadius: '12px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
        }}>
          <p style={{ fontSize: '14px', color: '#6b7280', margin: '0 0 8px 0' }}>
            Wszystkie sesje
          </p>
          <p style={{ fontSize: '32px', fontWeight: 'bold', color: '#6366F1', margin: 0 }}>
            {stats.totalSessions}
          </p>
        </div>

        <div style={{
          backgroundColor: 'white',
          padding: '24px',
          borderRadius: '12px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
        }}>
          <p style={{ fontSize: '14px', color: '#6b7280', margin: '0 0 8px 0' }}>
            Aktywne sesje
          </p>
          <p style={{ fontSize: '32px', fontWeight: 'bold', color: '#1E40AF', margin: 0 }}>
            {stats.activeSessions}
          </p>
        </div>

        <div style={{
          backgroundColor: 'white',
          padding: '24px',
          borderRadius: '12px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
        }}>
          <p style={{ fontSize: '14px', color: '#6b7280', margin: '0 0 8px 0' }}>
            Energia dostarczona
          </p>
          <p style={{ fontSize: '32px', fontWeight: 'bold', color: '#059669', margin: 0 }}>
            {stats.totalEnergy} kWh
          </p>
        </div>
      </div>

      {/* Moje ładowarki */}
      <div style={{ marginBottom: '40px' }}>
        <h2 style={{
          fontSize: '24px',
          fontWeight: 'bold',
          marginBottom: '20px',
          color: '#1f2937'
        }}>
          Lista moich ładowarek
        </h2>

        {myChargers.length === 0 ? (
          <div style={{
            backgroundColor: 'white',
            padding: '60px 40px',
            borderRadius: '12px',
            textAlign: 'center',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
          }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>⚡</div>
            <h3 style={{ fontSize: '20px', fontWeight: 'bold', color: '#1f2937', marginBottom: '8px' }}>
              Nie masz jeszcze ładowarek
            </h3>
            <p style={{ color: '#6b7280', marginBottom: '24px' }}>
              Dodaj pierwszą ładowarkę na mapie
            </p>
            <button
              onClick={() => navigate('/map')}
              style={{
                backgroundColor: '#F59E0B',
                color: 'white',
                padding: '12px 24px',
                borderRadius: '8px',
                border: 'none',
                fontWeight: 'bold',
                cursor: 'pointer'
              }}
            >
              Przejdź do mapy
            </button>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))',
            gap: '20px'
          }}>
            {myChargers.map((charger) => (
              <div
                key={charger.id}
                style={{
                  backgroundColor: 'white',
                  padding: '24px',
                  borderRadius: '12px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                  border: '1px solid #e5e7eb',
                  transition: 'transform 0.2s, box-shadow 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-4px)';
                  e.currentTarget.style.boxShadow = '0 8px 16px rgba(0,0,0,0.15)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
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
                      fontSize: '18px',
                      fontWeight: 'bold',
                      color: '#1f2937',
                      margin: '0 0 8px 0'
                    }}>
                      {charger.name}
                    </h3>
                    <p style={{
                      color: '#6b7280',
                      fontSize: '14px',
                      margin: 0
                    }}>
                      {charger.address}
                      {charger.city && `, ${charger.city}`}
                    </p>
                  </div>
                  <span style={{
                    backgroundColor: charger.available_connectors > 0 ? '#D1FAE5' : '#FEE2E2',
                    color: charger.available_connectors > 0 ? '#059669' : '#DC2626',
                    padding: '6px 12px',
                    borderRadius: '16px',
                    fontSize: '12px',
                    fontWeight: 'bold',
                    whiteSpace: 'nowrap'
                  }}>
                    {charger.available_connectors}/{charger.total_connectors} wolne
                  </span>
                </div>

                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '16px',
                  paddingTop: '16px',
                  borderTop: '1px solid #e5e7eb'
                }}>
                  <div>
                    <p style={{ fontSize: '12px', color: '#6b7280', margin: '0 0 4px 0' }}>
                      Typ ładowarki
                    </p>
                    <p style={{ fontSize: '15px', fontWeight: 'bold', color: '#1f2937', margin: 0 }}>
                      {charger.charger_type}
                    </p>
                  </div>

                  <div>
                    <p style={{ fontSize: '12px', color: '#6b7280', margin: '0 0 4px 0' }}>
                      Moc maksymalna
                    </p>
                    <p style={{ fontSize: '15px', fontWeight: 'bold', color: '#F59E0B', margin: 0 }}>
                      {charger.max_power_kw} kW
                    </p>
                  </div>

                  <div>
                    <p style={{ fontSize: '12px', color: '#6b7280', margin: '0 0 4px 0' }}>
                      Cena za kWh
                    </p>
                    <p style={{ fontSize: '15px', fontWeight: 'bold', color: '#059669', margin: 0 }}>
                      {charger.price_per_kwh} zł
                    </p>
                  </div>

                  <div>
                    <p style={{ fontSize: '12px', color: '#6b7280', margin: '0 0 4px 0' }}>
                      Liczba złączy
                    </p>
                    <p style={{ fontSize: '15px', fontWeight: 'bold', color: '#1f2937', margin: 0 }}>
                      {charger.total_connectors}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Moje sesje ładowania */}
      <div>
        <h2 style={{
          fontSize: '24px',
          fontWeight: 'bold',
          marginBottom: '20px',
          color: '#1f2937'
        }}>
          Historia sesji ładowania
        </h2>

        {mySessions.length === 0 ? (
          <div style={{
            backgroundColor: 'white',
            padding: '40px',
            borderRadius: '12px',
            textAlign: 'center',
            color: '#6b7280',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
          }}>
            Nie masz jeszcze żadnych sesji ładowania
          </div>
        ) : (
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            overflow: 'hidden'
          }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{
                width: '100%',
                borderCollapse: 'collapse'
              }}>
                <thead>
                  <tr style={{ backgroundColor: '#F9FAFB', borderBottom: '2px solid #E5E7EB' }}>
                    <th style={{ padding: '16px', textAlign: 'left', fontSize: '14px', fontWeight: '600', color: '#374151' }}>
                      Stacja
                    </th>
                    <th style={{ padding: '16px', textAlign: 'left', fontSize: '14px', fontWeight: '600', color: '#374151' }}>
                      Data rozpoczęcia
                    </th>
                    <th style={{ padding: '16px', textAlign: 'left', fontSize: '14px', fontWeight: '600', color: '#374151' }}>
                      Energia
                    </th>
                    <th style={{ padding: '16px', textAlign: 'left', fontSize: '14px', fontWeight: '600', color: '#374151' }}>
                      Koszt
                    </th>
                    <th style={{ padding: '16px', textAlign: 'left', fontSize: '14px', fontWeight: '600', color: '#374151' }}>
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {mySessions.map((session) => {
                    const statusColors = getStatusColor(session.status);
                    return (
                      <tr key={session.id} style={{ borderBottom: '1px solid #E5E7EB' }}>
                        <td style={{ padding: '16px' }}>
                          <div>
                            <div style={{ fontWeight: '600', color: '#1F2937', marginBottom: '4px' }}>
                              {session.charging_stations?.name || 'Nieznana stacja'}
                            </div>
                            <div style={{ fontSize: '14px', color: '#6B7280' }}>
                              {session.charging_stations?.address}
                            </div>
                          </div>
                        </td>
                        <td style={{ padding: '16px', fontSize: '14px', color: '#374151' }}>
                          {formatDate(session.start_time)}
                        </td>
                        <td style={{ padding: '16px', fontSize: '14px', fontWeight: '600', color: '#F59E0B' }}>
                          {session.energy_delivered_kwh ? `${session.energy_delivered_kwh} kWh` : '-'}
                        </td>
                        <td style={{ padding: '16px', fontSize: '14px', fontWeight: '600', color: '#059669' }}>
                          {session.total_cost ? `${session.total_cost} zł` : '-'}
                        </td>
                        <td style={{ padding: '16px' }}>
                          <span style={{
                            backgroundColor: statusColors.bg,
                            color: statusColors.text,
                            padding: '6px 12px',
                            borderRadius: '12px',
                            fontSize: '12px',
                            fontWeight: 'bold'
                          }}>
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
