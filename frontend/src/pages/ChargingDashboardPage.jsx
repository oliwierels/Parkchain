import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Card,
  Button,
  Badge,
  Input,
  Modal,
  SkeletonCard,
  EmptyState,
  useToast,
  ToastContainer
} from '../components/ui';
import {
  FaBolt,
  FaPlug,
  FaChargingStation,
  FaCheckCircle,
  FaExclamationTriangle,
  FaHistory,
  FaPlus
} from 'react-icons/fa';

function ChargingDashboardPage() {
  const navigate = useNavigate();
  const { toasts, addToast, removeToast } = useToast();
  const [myChargers, setMyChargers] = useState([]);
  const [mySessions, setMySessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({
    totalChargers: 0,
    activeChargers: 0,
    totalSessions: 0,
    activeSessions: 0,
    totalEnergy: 0,
    pendingVerification: 0
  });
  const [verifyingSession, setVerifyingSession] = useState(null);
  const [verifyFormData, setVerifyFormData] = useState({
    energy_delivered_kwh: '',
    charging_duration_minutes: ''
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
        const pendingVerification = sessionsData.sessions?.filter(s => s.status === 'pending_verification').length || 0;
        const totalEnergy = sessionsData.sessions
          ?.filter(s => s.energy_delivered_kwh)
          .reduce((sum, s) => sum + parseFloat(s.energy_delivered_kwh || 0), 0) || 0;

        setStats(prev => ({
          ...prev,
          totalSessions: sessionsData.sessions?.length || 0,
          activeSessions,
          pendingVerification,
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

  const handleVerifySession = (session) => {
    setVerifyingSession(session);
    setVerifyFormData({
      energy_delivered_kwh: session.energy_delivered_kwh || '',
      charging_duration_minutes: session.charging_duration_minutes || ''
    });
  };

  const handleVerifySubmit = async (approved) => {
    if (approved && !verifyFormData.energy_delivered_kwh) {
      addToast({ message: 'Podaj ilość dostarczonej energii', type: 'warning' });
      return;
    }

    try {
      const response = await fetch(`http://localhost:3000/api/charging-sessions/${verifyingSession.id}/verify`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          energy_delivered_kwh: parseFloat(verifyFormData.energy_delivered_kwh),
          charging_duration_minutes: verifyFormData.charging_duration_minutes ? parseInt(verifyFormData.charging_duration_minutes) : null,
          approved
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Nie udało się zweryfikować sesji');
      }

      addToast({
        message: approved ? 'Sesja zatwierdzona pomyślnie!' : 'Sesja została odrzucona',
        type: approved ? 'success' : 'info'
      });
      setVerifyingSession(null);
      fetchChargingData();
    } catch (err) {
      console.error('Błąd weryfikacji:', err);
      addToast({ message: 'Nie udało się zweryfikować sesji: ' + err.message, type: 'error' });
    }
  };

  const getStatusVariant = (status) => {
    switch (status) {
      case 'active':
        return 'info';
      case 'completed':
        return 'success';
      case 'cancelled':
        return 'error';
      case 'pending_verification':
        return 'warning';
      default:
        return 'default';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'active':
        return 'Aktywna';
      case 'completed':
        return 'Zakończona';
      case 'cancelled':
        return 'Anulowana';
      case 'pending_verification':
        return 'Oczekuje weryfikacji';
      default:
        return status;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-6">
        <ToastContainer toasts={toasts} removeToast={removeToast} />
        <div className="max-w-7xl mx-auto">
          <div className="h-10 w-64 bg-slate-800 rounded-lg mb-8 animate-pulse" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-6 mb-10">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <SkeletonCard key={i} />
            ))}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <SkeletonCard key={i} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  const statCards = [
    {
      icon: FaChargingStation,
      label: 'Moje ładowarki',
      value: stats.totalChargers,
      gradient: 'from-amber-500 to-orange-600',
      bg: 'bg-amber-500/10',
      color: 'text-amber-400'
    },
    {
      icon: FaPlug,
      label: 'Aktywne złącza',
      value: stats.activeChargers,
      gradient: 'from-green-500 to-emerald-500',
      bg: 'bg-green-500/10',
      color: 'text-green-400'
    },
    {
      icon: FaHistory,
      label: 'Wszystkie sesje',
      value: stats.totalSessions,
      gradient: 'from-indigo-500 to-purple-500',
      bg: 'bg-indigo-500/10',
      color: 'text-indigo-400'
    },
    {
      icon: FaBolt,
      label: 'Aktywne sesje',
      value: stats.activeSessions,
      gradient: 'from-blue-500 to-cyan-500',
      bg: 'bg-blue-500/10',
      color: 'text-blue-400'
    },
    {
      icon: FaExclamationTriangle,
      label: 'Do weryfikacji',
      value: stats.pendingVerification,
      gradient: 'from-yellow-500 to-orange-500',
      bg: 'bg-yellow-500/10',
      color: 'text-yellow-400',
      highlight: stats.pendingVerification > 0
    },
    {
      icon: FaCheckCircle,
      label: 'Energia dostarczona',
      value: `${stats.totalEnergy} kWh`,
      gradient: 'from-green-500 to-teal-500',
      bg: 'bg-green-500/10',
      color: 'text-green-400'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-6">
      <ToastContainer toasts={toasts} removeToast={removeToast} />

      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4"
        >
          <h1 className="text-3xl md:text-4xl font-bold text-white flex items-center gap-3">
            <FaChargingStation className="text-amber-500" />
            Moje ładowarki
          </h1>
          <Button
            onClick={() => navigate('/map')}
            variant="primary"
            size="lg"
            leftIcon={<FaPlus />}
          >
            Dodaj ładowarkę
          </Button>
        </motion.div>

        {error && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-6"
          >
            <Card variant="glass" className="bg-red-900/20 border-red-600">
              <p className="text-red-200">{error}</p>
            </Card>
          </motion.div>
        )}

        {/* Stats Cards */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-6 mb-10"
        >
          {statCards.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + index * 0.05 }}
            >
              <Card
                variant="gradient"
                hoverable
                className={`${stat.bg} ${stat.highlight ? 'border-2 border-yellow-500 animate-pulse' : ''}`}
              >
                <div className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-br ${stat.gradient} opacity-10 blur-2xl`} />
                <div className="relative">
                  <stat.icon className={`text-3xl ${stat.color} mb-3`} />
                  <div className={`text-4xl font-black ${stat.color} mb-2`}>
                    {stat.value}
                  </div>
                  <div className="text-gray-400 text-sm font-medium">
                    {stat.label}
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </motion.div>

        {/* Sesje do weryfikacji */}
        {stats.pendingVerification > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mb-10"
          >
            <h2 className="text-2xl font-bold mb-5 text-yellow-400 flex items-center gap-3">
              <FaExclamationTriangle />
              Sesje oczekujące na weryfikację ({stats.pendingVerification})
            </h2>

            <Card variant="glass" className="bg-yellow-900/20 border-yellow-500 mb-5">
              <p className="text-yellow-200 text-sm">
                <strong>Ważne:</strong> Zweryfikuj wartości podane przez użytkowników przed zatwierdzeniem.
                Możesz skorygować ilość pobranej energii jeśli użytkownik podał nieprawdziwe dane.
              </p>
            </Card>

            <div className="flex flex-col gap-4">
              {mySessions.filter(s => s.status === 'pending_verification').map((session, index) => (
                <motion.div
                  key={session.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 + index * 0.1 }}
                >
                  <Card variant="glass" className="border-2 border-yellow-500">
                    <div className="flex flex-col md:flex-row justify-between items-start gap-4">
                      <div className="flex-1">
                        <h3 className="text-lg font-bold text-white mb-2">
                          {session.charging_stations?.name || 'Nieznana stacja'}
                        </h3>
                        <p className="text-sm text-gray-400 mb-1">
                          📍 {session.charging_stations?.address}
                        </p>
                        <p className="text-sm text-gray-400 mb-1">
                          👤 Użytkownik: {session.users?.full_name || session.users?.email || 'Nieznany'}
                        </p>
                        <p className="text-sm text-gray-300 mb-2">
                          🕐 {formatDate(session.start_time)} → {formatDate(session.end_time)}
                        </p>
                        <div className="bg-slate-800/50 p-3 rounded-lg mt-3">
                          <p className="text-xs text-gray-400 mb-2">Dane zgłoszone przez użytkownika:</p>
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <p className="text-xs text-gray-400">Energia</p>
                              <p className="text-base font-bold text-amber-400">{session.energy_delivered_kwh || '-'} kWh</p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-400">Szacowany koszt</p>
                              <p className="text-base font-bold text-green-400">{session.total_cost || '-'} zł</p>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col gap-2 w-full md:w-auto">
                        <Button
                          onClick={() => handleVerifySession(session)}
                          variant="secondary"
                          size="md"
                          className="bg-green-600 hover:bg-green-700 whitespace-nowrap"
                        >
                          ✅ Weryfikuj i zatwierdź
                        </Button>
                        <Button
                          onClick={() => {
                            setVerifyingSession(session);
                            handleVerifySubmit(false);
                          }}
                          variant="danger"
                          size="md"
                          className="whitespace-nowrap"
                        >
                          ❌ Odrzuć
                        </Button>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Moje ładowarki */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mb-10"
        >
          <h2 className="text-2xl font-bold mb-5 text-white">
            Lista moich ładowarek
          </h2>

          {myChargers.length === 0 ? (
            <EmptyState
              icon={<FaChargingStation className="text-6xl text-amber-500" />}
              title="Nie masz jeszcze ładowarek"
              description="Dodaj pierwszą ładowarkę na mapie"
              action={() => navigate('/map')}
              actionLabel="Przejdź do mapy"
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {myChargers.map((charger, index) => (
                <motion.div
                  key={charger.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.6 + index * 0.05 }}
                >
                  <Card variant="glass" hoverable>
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-bold text-white mb-1 truncate">
                          {charger.name}
                        </h3>
                        <p className="text-gray-400 text-sm truncate">
                          {charger.address}
                          {charger.city && `, ${charger.city}`}
                        </p>
                      </div>
                      <Badge
                        variant={charger.available_connectors > 0 ? 'success' : 'error'}
                        size="sm"
                        className="whitespace-nowrap ml-2"
                      >
                        {charger.available_connectors}/{charger.total_connectors} wolne
                      </Badge>
                    </div>

                    <div className="grid grid-cols-2 gap-x-4 gap-y-3 pt-4 border-t border-slate-700">
                      <div>
                        <p className="text-xs text-gray-400 mb-0.5">Typ ładowarki</p>
                        <p className="text-base font-bold text-gray-100">{charger.charger_type}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400 mb-0.5">Moc maksymalna</p>
                        <p className="text-base font-bold text-amber-400">{charger.max_power_kw} kW</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400 mb-0.5">Cena za kWh</p>
                        <p className="text-base font-bold text-green-400">{charger.price_per_kwh} zł</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400 mb-0.5">Liczba złączy</p>
                        <p className="text-base font-bold text-gray-100">{charger.total_connectors}</p>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>

        {/* Moje sesje ładowania */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
        >
          <h2 className="text-2xl font-bold mb-5 text-white">
            Historia sesji ładowania
          </h2>

          {mySessions.length === 0 ? (
            <EmptyState
              icon={<FaHistory className="text-6xl text-indigo-500" />}
              title="Brak sesji ładowania"
              description="Nie masz jeszcze żadnych sesji ładowania"
            />
          ) : (
            <Card variant="glass" padding="none">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-700">
                  <thead className="bg-slate-800">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Stacja</th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Data rozpoczęcia</th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Energia</th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Koszt</th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-700">
                    {mySessions.map((session) => (
                      <tr key={session.id} className="hover:bg-slate-800/50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="font-medium text-white">{session.charging_stations?.name || 'Nieznana stacja'}</div>
                          <div className="text-sm text-gray-400">{session.charging_stations?.address}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                          {formatDate(session.start_time)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-amber-400">
                          {session.energy_delivered_kwh ? `${session.energy_delivered_kwh} kWh` : '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-400">
                          {session.total_cost ? `${session.total_cost} zł` : '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Badge variant={getStatusVariant(session.status)} size="md">
                            {getStatusText(session.status)}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </motion.div>
      </div>

      {/* Modal weryfikacji sesji */}
      <Modal
        isOpen={!!verifyingSession}
        onClose={() => setVerifyingSession(null)}
        title="⚠️ Weryfikacja sesji"
        size="md"
      >
        {verifyingSession && (
          <>
            <Card variant="glass" className="bg-slate-800/50 mb-5">
              <h3 className="text-sm font-bold text-white mb-3">
                {verifyingSession.charging_stations?.name}
              </h3>
              <p className="text-xs text-gray-400 mb-1">
                👤 {verifyingSession.users?.full_name || verifyingSession.users?.email}
              </p>
              <p className="text-xs text-gray-400 mb-1">
                🕐 {formatDate(verifyingSession.start_time)} → {formatDate(verifyingSession.end_time)}
              </p>
              <div className="mt-3 pt-3 border-t border-slate-700">
                <p className="text-xs text-yellow-400 mb-2">Wartości zgłoszone przez użytkownika:</p>
                <p className="text-sm text-gray-300">
                  Energia: <strong>{verifyingSession.energy_delivered_kwh} kWh</strong>
                </p>
                <p className="text-sm text-gray-300">
                  Koszt: <strong>{verifyingSession.total_cost} zł</strong>
                </p>
              </div>
            </Card>

            <form onSubmit={(e) => { e.preventDefault(); handleVerifySubmit(true); }}>
              <Card variant="glass" className="bg-yellow-900/20 border-yellow-500 mb-4">
                <p className="text-sm text-yellow-200">
                  Sprawdź wartości na wyświetlaczu ładowarki. Możesz je skorygować jeśli użytkownik podał nieprawdziwe dane.
                </p>
              </Card>

              <Input
                label="Dostarczona energia (kWh)"
                type="number"
                value={verifyFormData.energy_delivered_kwh}
                onChange={(e) => setVerifyFormData({ ...verifyFormData, energy_delivered_kwh: e.target.value })}
                placeholder="np. 42.5"
                min="0"
                step="0.1"
                required
                fullWidth
                className="mb-4"
              />

              <Input
                label="Czas ładowania (minuty)"
                type="number"
                value={verifyFormData.charging_duration_minutes}
                onChange={(e) => setVerifyFormData({ ...verifyFormData, charging_duration_minutes: e.target.value })}
                placeholder="np. 45"
                min="0"
                fullWidth
                className="mb-4"
              />

              {verifyFormData.energy_delivered_kwh && (
                <Card variant="glass" className="bg-green-900/20 border-green-700 mb-5">
                  <p className="text-xs text-gray-400 mb-1">Finalny koszt</p>
                  <p className="text-2xl font-bold text-green-400">
                    {(parseFloat(verifyFormData.energy_delivered_kwh) * parseFloat(verifyingSession.charging_stations?.price_per_kwh || 0)).toFixed(2)} zł
                  </p>
                </Card>
              )}

              <div className="flex gap-3">
                <Button
                  type="button"
                  onClick={() => setVerifyingSession(null)}
                  variant="ghost"
                  fullWidth
                >
                  Anuluj
                </Button>
                <Button
                  type="submit"
                  disabled={!verifyFormData.energy_delivered_kwh}
                  variant="secondary"
                  fullWidth
                  className="bg-green-600 hover:bg-green-700"
                >
                  ✅ Zatwierdź sesję
                </Button>
              </div>
            </form>
          </>
        )}
      </Modal>
    </div>
  );
}

export default ChargingDashboardPage;