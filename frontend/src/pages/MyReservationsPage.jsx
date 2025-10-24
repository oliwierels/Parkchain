import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { reservationAPI } from '../services/api';
import EndChargingSessionModal from '../components/EndChargingSessionModal';
import {
  Card,
  Button,
  Badge,
  EmptyStateNoReservations,
  EmptyStateError,
  SkeletonCard,
  useToast,
  ToastContainer
} from '../components/ui';

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
  const [filter, setFilter] = useState('all');
  const [showEndChargingModal, setShowEndChargingModal] = useState(false);
  const [selectedSession, setSelectedSession] = useState(null);
  const { toasts, addToast, removeToast } = useToast();

  useEffect(() => {
    if (isAuthenticated) {
      fetchData();
    }
  }, [isAuthenticated]);

  const fetchData = async () => {
    try {
      setLoading(true);

      const parkingPromise = reservationAPI.getMyReservations();

      const chargingPromise = fetch('http://localhost:3000/api/charging-sessions/my', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      }).then(res => {
        if (res.ok) return res.json();
        throw new Error('Nie udało się pobrać sesji ładowania');
      });

      const [parkingData, chargingData] = await Promise.all([
        parkingPromise,
        chargingPromise
      ]);

      const mappedParking = parkingData.map(r => ({
        id: r.id,
        type: 'parking',
        name: r.parking_lots.name,
        address: `${r.parking_lots.address}, ${r.parking_lots.city}`,
        startTime: r.start_time,
        endTime: r.end_time,
        price: r.price,
        status: r.status,
        details: `🚗 ${r.license_plate}`,
        originalData: r
      }));

      const mappedCharging = (chargingData.sessions || []).map(s => {
        let calculatedPrice = s.total_cost;
        if (!calculatedPrice && s.energy_delivered_kwh && s.charging_stations?.price_per_kwh) {
          calculatedPrice = (parseFloat(s.energy_delivered_kwh) * parseFloat(s.charging_stations.price_per_kwh)).toFixed(2);
        }

        return {
          id: s.id,
          type: 'charging',
          name: s.charging_stations?.name || 'Nieznana stacja',
          address: s.charging_stations?.address || 'Brak adresu',
          startTime: s.start_time,
          endTime: s.end_time,
          price: calculatedPrice,
          status: s.status,
          details: `⚡ ${s.energy_delivered_kwh || 0} kWh`,
          isEstimated: !s.total_cost && s.status === 'active',
          originalData: s
        };
      });

      const combinedReservations = [...mappedParking, ...mappedCharging];
      combinedReservations.sort((a, b) => new Date(b.startTime) - new Date(a.startTime));

      setReservations(combinedReservations);

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
      addToast({
        message: 'Nie udało się załadować rezerwacji',
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCancelReservation = async (id, type) => {
    try {
      if (type === 'parking') {
        await reservationAPI.cancelReservation(id);
      } else if (type === 'charging') {
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

      fetchData();
      addToast({
        message: 'Rezerwacja została anulowana',
        type: 'success'
      });
    } catch (err) {
      console.error(err);
      addToast({
        message: 'Nie udało się anulować rezerwacji',
        type: 'error'
      });
    }
  };

  const handleEndChargingSession = (reservation) => {
    setSelectedSession(reservation);
    setShowEndChargingModal(true);
  };

  const handleChargingSessionEnded = () => {
    setShowEndChargingModal(false);
    setSelectedSession(null);
    fetchData();
    addToast({
      message: 'Sesja ładowania została zakończona',
      type: 'success'
    });
  };

  const getStatusVariant = (status) => {
    switch (status) {
      case 'pending': return 'warning';
      case 'active': return 'success';
      case 'completed': return 'default';
      case 'cancelled': return 'error';
      case 'pending_verification': return 'info';
      default: return 'default';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'pending': return 'Oczekująca';
      case 'active': return 'Aktywna';
      case 'completed': return 'Zakończona';
      case 'cancelled': return 'Anulowana';
      case 'pending_verification': return 'Weryfikacja';
      default: return status;
    }
  };

  const filteredReservations = reservations.filter(r => {
    switch (filter) {
      case 'active': return r.status === 'active';
      case 'pending': return r.status === 'pending';
      case 'past': return r.status === 'completed';
      case 'cancelled': return r.status === 'cancelled';
      case 'all': default: return true;
    }
  });

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="h-10 w-64 bg-slate-800 rounded-lg mb-8 animate-pulse" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
            {[1, 2, 3].map(i => (
              <SkeletonCard key={i} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-6">
      <ToastContainer toasts={toasts} removeToast={removeToast} />

      <div className="max-w-7xl mx-auto">
        <motion.h1
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-4xl font-bold text-white mb-8"
        >
          Moje Rezerwacje
        </motion.h1>

        {/* Stats Cards */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10"
        >
          <Card variant="gradient" hoverable>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400 mb-1">Wszystkie</p>
                <p className="text-4xl font-bold text-white">{stats.totalReservations}</p>
              </div>
              <div className="p-4 bg-parkchain-500/20 rounded-xl">
                <svg className="w-8 h-8 text-parkchain-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
            </div>
          </Card>

          <Card variant="gradient" hoverable>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400 mb-1">Aktywne</p>
                <p className="text-4xl font-bold text-green-400">{stats.activeReservations}</p>
              </div>
              <div className="p-4 bg-green-500/20 rounded-xl">
                <svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </Card>

          <Card variant="gradient" hoverable>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400 mb-1">Oczekujące</p>
                <p className="text-4xl font-bold text-yellow-400">{stats.pendingReservations}</p>
              </div>
              <div className="p-4 bg-yellow-500/20 rounded-xl">
                <svg className="w-8 h-8 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="flex gap-3 mb-6 flex-wrap"
        >
          {[
            { value: 'all', label: 'Wszystkie' },
            { value: 'active', label: 'Aktywne' },
            { value: 'pending', label: 'Oczekujące' },
            { value: 'past', label: 'Historia' },
            { value: 'cancelled', label: 'Anulowane' }
          ].map(({ value, label }) => (
            <Button
              key={value}
              onClick={() => setFilter(value)}
              variant={filter === value ? 'primary' : 'secondary'}
              size="md"
            >
              {label}
            </Button>
          ))}
        </motion.div>

        {/* Content */}
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : error ? (
          <EmptyStateError onRetry={fetchData} />
        ) : filteredReservations.length === 0 ? (
          <EmptyStateNoReservations onCreateNew={() => window.location.href = '/map'} />
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="space-y-4"
          >
            {filteredReservations.map((reservation, index) => (
              <motion.div
                key={`${reservation.type}-${reservation.id}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card variant="glass" hoverable>
                  <div className="flex flex-col md:flex-row gap-6">
                    {/* Icon */}
                    <div className="flex-shrink-0">
                      <div className={`w-16 h-16 rounded-xl flex items-center justify-center text-3xl ${
                        reservation.type === 'parking'
                          ? 'bg-blue-500/20 text-blue-400'
                          : 'bg-yellow-500/20 text-yellow-400'
                      }`}>
                        {reservation.type === 'parking' ? '🚗' : '⚡'}
                      </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4 mb-3">
                        <h3 className="text-xl font-bold text-white truncate">
                          {reservation.name}
                        </h3>
                        <Badge variant={getStatusVariant(reservation.status)} size="md">
                          {getStatusText(reservation.status)}
                        </Badge>
                      </div>

                      <div className="space-y-2 text-sm">
                        <p className="text-slate-400 flex items-center gap-2">
                          <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          <span className="truncate">{reservation.address}</span>
                        </p>
                        <p className="text-slate-400 flex items-center gap-2">
                          <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          {reservation.details}
                        </p>
                        <p className="text-slate-300 flex items-center gap-2">
                          <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          {new Date(reservation.startTime).toLocaleString('pl-PL', {
                            dateStyle: 'short',
                            timeStyle: 'short'
                          })}
                          {' → '}
                          {reservation.endTime
                            ? new Date(reservation.endTime).toLocaleString('pl-PL', {
                                dateStyle: 'short',
                                timeStyle: 'short'
                              })
                            : '...'}
                        </p>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col items-end gap-3">
                      <div className="text-right">
                        <p className="text-3xl font-bold text-parkchain-400">
                          {reservation.price ? `${reservation.isEstimated ? '~' : ''}${reservation.price} zł` : '-'}
                        </p>
                        {reservation.isEstimated && (
                          <p className="text-xs text-slate-500 mt-1">
                            szacunkowy koszt
                          </p>
                        )}
                      </div>

                      {['pending', 'active'].includes(reservation.status) && (
                        <div className="flex flex-col gap-2 w-full md:w-auto">
                          {reservation.type === 'charging' && reservation.status === 'active' && (
                            <Button
                              onClick={() => handleEndChargingSession(reservation)}
                              variant="primary"
                              size="sm"
                              fullWidth
                              leftIcon={
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                              }
                            >
                              Zakończ
                            </Button>
                          )}
                          <Button
                            onClick={() => handleCancelReservation(reservation.id, reservation.type)}
                            variant="danger"
                            size="sm"
                            fullWidth
                            leftIcon={
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            }
                          >
                            Anuluj
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>

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
