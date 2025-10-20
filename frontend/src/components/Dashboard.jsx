import { useState, useEffect } from 'react';
import { getMyReservations, getMyRewards } from '../api/api';

function Dashboard({ user, onNavigate }) {
  const [reservations, setReservations] = useState([]);
  const [rewards, setRewards] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [reservationsRes, rewardsRes] = await Promise.all([
        getMyReservations(),
        getMyRewards(),
      ]);
      setReservations(reservationsRes.data);
      setRewards(rewardsRes.data);
    } catch (error) {
      console.error('Błąd ładowania danych:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('pl-PL');
  };

  const getStatusColor = (status) => {
    const colors = {
      active: '#4CAF50',
      completed: '#9E9E9E',
      cancelled: '#F44336',
    };
    return colors[status] || '#2196F3';
  };

  if (loading) {
    return <div className="loading">Ładowanie...</div>;
  }

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1>Witaj, {user.full_name || user.email}!</h1>
        <p>Twój dashboard Parkchain</p>
      </div>

      <div className="dashboard-stats">
        <div className="stat-card">
          <h3>Aktywne rezerwacje</h3>
          <div className="stat-number">
            {reservations.filter(r => r.status === 'active').length}
          </div>
        </div>
        <div className="stat-card">
          <h3>Dostępne nagrody</h3>
          <div className="stat-number">
            {rewards.filter(r => r.status === 'available').length}
          </div>
        </div>
        <div className="stat-card">
          <h3>Punkty reputacji</h3>
          <div className="stat-number">{user.reputation_score || 0}</div>
        </div>
      </div>

      <div className="dashboard-section">
        <div className="section-header">
          <h2>Moje rezerwacje</h2>
          <button onClick={() => onNavigate('parking')} className="btn-primary">
            Znajdź parking
          </button>
        </div>

        {reservations.length === 0 ? (
          <p className="empty-state">Nie masz jeszcze żadnych rezerwacji</p>
        ) : (
          <div className="reservations-list">
            {reservations.map((reservation) => (
              <div key={reservation.id} className="reservation-card">
                <div className="reservation-header">
                  <h3>{reservation.lot_name || `Parking #${reservation.lot_id}`}</h3>
                  <span
                    className="status-badge"
                    style={{ backgroundColor: getStatusColor(reservation.status) }}
                  >
                    {reservation.status === 'active' ? 'Aktywna' :
                     reservation.status === 'completed' ? 'Zakończona' : 'Anulowana'}
                  </span>
                </div>
                <div className="reservation-details">
                  <p>📅 Od: {formatDate(reservation.start_time)}</p>
                  <p>📅 Do: {formatDate(reservation.end_time)}</p>
                  <p>💰 Cena: {reservation.total_price} PLN</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="dashboard-section">
        <h2>Moje nagrody</h2>
        {rewards.length === 0 ? (
          <p className="empty-state">Nie masz jeszcze żadnych nagród. Zgłaszaj zajętość parkingów aby je zdobyć!</p>
        ) : (
          <div className="rewards-list">
            {rewards.map((reward) => (
              <div key={reward.id} className="reward-card">
                <div className="reward-amount">+{reward.amount} credits</div>
                <div className="reward-reason">{reward.reason}</div>
                <div className="reward-date">{formatDate(reward.created_at)}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default Dashboard;
