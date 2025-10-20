import { useState, useEffect } from 'react';
import { getParkingLots, createReservation, submitScan } from '../api/api';

function ParkingMap({ onNavigate }) {
  const [lots, setLots] = useState([]);
  const [selectedLot, setSelectedLot] = useState(null);
  const [city, setCity] = useState('');
  const [loading, setLoading] = useState(true);
  const [showReservationForm, setShowReservationForm] = useState(false);
  const [showScanForm, setShowScanForm] = useState(false);

  // Formularz rezerwacji
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');

  // Formularz scan
  const [occupiedSpots, setOccupiedSpots] = useState('');
  const [evidence, setEvidence] = useState([]);

  useEffect(() => {
    loadParkingLots();
  }, [city]);

  const loadParkingLots = async () => {
    try {
      setLoading(true);
      const response = await getParkingLots(city);
      setLots(response.data);
    } catch (error) {
      console.error('Błąd ładowania parkingów:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleReservation = async (e) => {
    e.preventDefault();
    if (!selectedLot) return;

    try {
      await createReservation(selectedLot.id, startTime, endTime);
      alert('Rezerwacja utworzona!');
      setShowReservationForm(false);
      setSelectedLot(null);
      onNavigate('dashboard');
    } catch (error) {
      alert('Błąd tworzenia rezerwacji: ' + (error.response?.data?.error || error.message));
    }
  };

  const handleScan = async (e) => {
    e.preventDefault();
    if (!selectedLot) return;

    try {
      await submitScan(selectedLot.id, parseInt(occupiedSpots), evidence);
      alert('Zgłoszenie wysłane! Otrzymasz nagrodę po weryfikacji.');
      setShowScanForm(false);
      setSelectedLot(null);
      setOccupiedSpots('');
      setEvidence([]);
    } catch (error) {
      alert('Błąd wysyłania zgłoszenia: ' + (error.response?.data?.error || error.message));
    }
  };

  const getAvailableSpots = (lot) => {
    return lot.capacity - (lot.current_occupancy || 0);
  };

  if (loading) {
    return <div className="loading">Ładowanie parkingów...</div>;
  }

  return (
    <div className="parking-map">
      <div className="map-header">
        <h1>Znajdź parking</h1>
        <div className="search-bar">
          <input
            type="text"
            placeholder="Wpisz miasto..."
            value={city}
            onChange={(e) => setCity(e.target.value)}
          />
          <button onClick={loadParkingLots} className="btn-primary">
            Szukaj
          </button>
        </div>
      </div>

      <div className="parking-list">
        {lots.length === 0 ? (
          <p className="empty-state">Nie znaleziono parkingów. Spróbuj wpisać miasto.</p>
        ) : (
          lots.map((lot) => (
            <div
              key={lot.id}
              className={`parking-card ${selectedLot?.id === lot.id ? 'selected' : ''}`}
              onClick={() => setSelectedLot(lot)}
            >
              <div className="parking-header">
                <h3>{lot.name}</h3>
                <span className="parking-distance">
                  {lot.distance ? `${lot.distance.toFixed(1)} km` : ''}
                </span>
              </div>

              <div className="parking-info">
                <p>📍 {lot.address}, {lot.city}</p>
                <p>
                  🚗 Dostępne miejsca:{' '}
                  <strong className={getAvailableSpots(lot) > 0 ? 'available' : 'full'}>
                    {getAvailableSpots(lot)} / {lot.capacity}
                  </strong>
                </p>
                <p>💰 {lot.hourly_rate} PLN/h | {lot.daily_rate} PLN/dzień</p>
                {lot.features && <p>✨ {lot.features.join(', ')}</p>}
              </div>

              {selectedLot?.id === lot.id && (
                <div className="parking-actions">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowReservationForm(true);
                      setShowScanForm(false);
                    }}
                    className="btn-primary"
                  >
                    Zarezerwuj
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowScanForm(true);
                      setShowReservationForm(false);
                    }}
                    className="btn-secondary"
                  >
                    Zgłoś zajętość
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Formularz rezerwacji */}
      {showReservationForm && selectedLot && (
        <div className="modal-overlay" onClick={() => setShowReservationForm(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>Rezerwacja: {selectedLot.name}</h2>
            <form onSubmit={handleReservation}>
              <div className="form-group">
                <label>Od kiedy:</label>
                <input
                  type="datetime-local"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label>Do kiedy:</label>
                <input
                  type="datetime-local"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  required
                />
              </div>
              <div className="modal-actions">
                <button type="submit" className="btn-primary">
                  Potwierdź rezerwację
                </button>
                <button
                  type="button"
                  onClick={() => setShowReservationForm(false)}
                  className="btn-secondary"
                >
                  Anuluj
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Formularz zgłaszania zajętości */}
      {showScanForm && selectedLot && (
        <div className="modal-overlay" onClick={() => setShowScanForm(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>Zgłoś zajętość: {selectedLot.name}</h2>
            <form onSubmit={handleScan}>
              <div className="form-group">
                <label>Ile miejsc jest zajętych?</label>
                <input
                  type="number"
                  min="0"
                  max={selectedLot.capacity}
                  value={occupiedSpots}
                  onChange={(e) => setOccupiedSpots(e.target.value)}
                  required
                />
                <small>Maksymalnie {selectedLot.capacity} miejsc</small>
              </div>
              <div className="form-group">
                <label>Zdjęcia/wideo (opcjonalnie):</label>
                <input
                  type="file"
                  accept="image/*,video/*"
                  multiple
                  onChange={(e) => setEvidence([...e.target.files])}
                />
              </div>
              <p className="info-text">
                💰 Za zweryfikowane zgłoszenie otrzymasz nagrody!
              </p>
              <div className="modal-actions">
                <button type="submit" className="btn-primary">
                  Wyślij zgłoszenie
                </button>
                <button
                  type="button"
                  onClick={() => setShowScanForm(false)}
                  className="btn-secondary"
                >
                  Anuluj
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default ParkingMap;
