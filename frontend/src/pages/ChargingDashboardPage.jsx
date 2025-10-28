import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useChargingFeed } from '../hooks/useWebSocket';
import ChargingSessionQRModal from '../components/ChargingSessionQRModal';
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
  const { t } = useTranslation();
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
  const [showQRModal, setShowQRModal] = useState(false);
  const [selectedSessionForQR, setSelectedSessionForQR] = useState(null);

  useEffect(() => {
    fetchChargingData();
  }, []);

  // ========== WEBSOCKET LIVE UPDATES ==========

  // Handle charging session updates via WebSocket
  const handleChargingUpdate = useCallback((data) => {
    console.log('🔄 Live charging session update:', data);

    // Update sessions list
    setMySessions(prevSessions => {
      const sessionExists = prevSessions.some(s => s.id === data.id);

      if (sessionExists) {
        // Update existing session
        return prevSessions.map(session =>
          session.id === data.id ? { ...session, ...data } : session
        );
      } else {
        // Add new session if it belongs to my chargers
        return [data, ...prevSessions];
      }
    });

    // Recalculate stats
    setStats(prev => {
      const activeSessions = mySessions.filter(s => s.status === 'active').length;
      const pendingVerification = mySessions.filter(s => s.status === 'pending_verification').length;
      const totalEnergy = mySessions
        .filter(s => s.energy_delivered_kwh)
        .reduce((sum, s) => sum + parseFloat(s.energy_delivered_kwh || 0), 0);

      return {
        ...prev,
        activeSessions,
        pendingVerification,
        totalEnergy: totalEnergy.toFixed(2)
      };
    });
  }, [mySessions]);

  // Subscribe to charging feed for live updates
  useChargingFeed(handleChargingUpdate);

  // ========== END WEBSOCKET ==========

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
      console.error(t('console.fetchChargersDataError'), err);
      setError(t('errors.loadDataError'));
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
      addToast({ message: t('charging.provideEnergyAmount'), type: 'warning' });
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
        throw new Error(errorData.error || t('charging.verificationFailed'));
      }

      addToast({
        message: approved ? t('charging.sessionApproved') : t('charging.sessionRejected'),
        type: approved ? 'success' : 'info'
      });
      setVerifyingSession(null);
      fetchChargingData();
    } catch (err) {
      console.error(t('console.verifyError'), err);
      addToast({ message: t('charging.verificationError') + err.message, type: 'error' });
    }
  };

  const handleShowQR = (session) => {
    setSelectedSessionForQR(session);
    setShowQRModal(true);
  };

  const handleCloseQR = () => {
    setShowQRModal(false);
    setSelectedSessionForQR(null);
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
        return t('charging.statuses.active');
      case 'completed':
        return t('charging.statuses.completed');
      case 'cancelled':
        return t('charging.statuses.cancelled');
      case 'pending_verification':
        return t('charging.statuses.pending_verification');
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
      label: t('dashboard.charging.totalChargers'),
      value: stats.totalChargers,
      gradient: 'from-amber-500 to-orange-600',
      bg: 'bg-amber-500/10',
      color: 'text-amber-400'
    },
    {
      icon: FaPlug,
      label: t('dashboard.charging.activeChargers'),
      value: stats.activeChargers,
      gradient: 'from-green-500 to-emerald-500',
      bg: 'bg-green-500/10',
      color: 'text-green-400'
    },
    {
      icon: FaHistory,
      label: t('dashboard.charging.totalSessions'),
      value: stats.totalSessions,
      gradient: 'from-indigo-500 to-purple-500',
      bg: 'bg-indigo-500/10',
      color: 'text-indigo-400'
    },
    {
      icon: FaBolt,
      label: t('dashboard.charging.activeSessions'),
      value: stats.activeSessions,
      gradient: 'from-blue-500 to-cyan-500',
      bg: 'bg-blue-500/10',
      color: 'text-blue-400'
    },
    {
      icon: FaExclamationTriangle,
      label: t('dashboard.charging.pendingVerification'),
      value: stats.pendingVerification,
      gradient: 'from-yellow-500 to-orange-500',
      bg: 'bg-yellow-500/10',
      color: 'text-yellow-400',
      highlight: stats.pendingVerification > 0
    },
    {
      icon: FaCheckCircle,
      label: t('dashboard.charging.totalEnergy'),
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
            {t('dashboard.charging.title')}
          </h1>
          <Button
            onClick={() => navigate('/map')}
            variant="primary"
            size="lg"
            leftIcon={<FaPlus />}
          >
            {t('charging.addCharger')}
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
              {t('charging.sessionsAwaitingVerification')} ({stats.pendingVerification})
            </h2>

            <Card variant="glass" className="bg-yellow-900/20 border-yellow-500 mb-5">
              <p className="text-yellow-200 text-sm">
                <strong>{t('charging.important')}:</strong> {t('charging.verificationNotice')}
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
                          {session.charging_stations?.name || t('charging.unknownStation')}
                        </h3>
                        <p className="text-sm text-gray-400 mb-1">
                          📍 {session.charging_stations?.address}
                        </p>
                        <p className="text-sm text-gray-400 mb-1">
                          👤 {t('charging.user')}: {session.users?.full_name || session.users?.email || t('charging.unknownStation')}
                        </p>
                        <p className="text-sm text-gray-300 mb-2">
                          🕐 {formatDate(session.start_time)} → {formatDate(session.end_time)}
                        </p>
                        <div className="bg-slate-800/50 p-3 rounded-lg mt-3">
                          <p className="text-xs text-gray-400 mb-2">{t('charging.dataReportedByUser')}:</p>
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <p className="text-xs text-gray-400">{t('charging.energy')}</p>
                              <p className="text-base font-bold text-amber-400">{session.energy_delivered_kwh || '-'} kWh</p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-400">{t('charging.estimatedCost')}</p>
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
                          ✅ {t('charging.verifyAndApprove')}
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
                          ❌ {t('charging.reject')}
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
            {t('charging.chargersList')}
          </h2>

          {myChargers.length === 0 ? (
            <EmptyState
              icon={<FaChargingStation className="text-6xl text-amber-500" />}
              title={t('charging.noChargersYet')}
              description={t('charging.addFirstCharger')}
              action={() => navigate('/map')}
              actionLabel={t('charging.goToMap')}
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
                        {charger.available_connectors}/{charger.total_connectors} {t('charging.available_connectors')}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-2 gap-x-4 gap-y-3 pt-4 border-t border-slate-700">
                      <div>
                        <p className="text-xs text-gray-400 mb-0.5">{t('charging.chargerType')}</p>
                        <p className="text-base font-bold text-gray-100">{charger.charger_type}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400 mb-0.5">{t('charging.maxPower')}</p>
                        <p className="text-base font-bold text-amber-400">{charger.max_power_kw} kW</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400 mb-0.5">{t('charging.pricePerKwh')}</p>
                        <p className="text-base font-bold text-green-400">{charger.price_per_kwh} zł</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400 mb-0.5">{t('charging.numberOfConnectors')}</p>
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
            {t('dashboard.charging.mySessions')}
          </h2>

          {mySessions.length === 0 ? (
            <EmptyState
              icon={<FaHistory className="text-6xl text-indigo-500" />}
              title={t('charging.noSessionsYet')}
              description={t('charging.noSessionsDescription')}
            />
          ) : (
            <Card variant="glass" padding="none">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-700">
                  <thead className="bg-slate-800">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">{t('charging.tableHeaders.station')}</th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">{t('charging.tableHeaders.startDate')}</th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">{t('charging.tableHeaders.energy')}</th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">{t('charging.tableHeaders.cost')}</th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">{t('charging.tableHeaders.status')}</th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">{t('charging.tableHeaders.actions')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-700">
                    {mySessions.map((session) => (
                      <tr key={session.id} className="hover:bg-slate-800/50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="font-medium text-white">{session.charging_stations?.name || t('charging.unknownStation')}</div>
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
                        <td className="px-6 py-4 whitespace-nowrap">
                          {['active', 'pending_verification'].includes(session.status) && (
                            <Button
                              onClick={() => handleShowQR(session)}
                              variant="primary"
                              size="sm"
                            >
                              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                              </svg>
                              QR
                            </Button>
                          )}
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
        title={`⚠️ ${t('charging.sessionVerification')}`}
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
                <p className="text-xs text-yellow-400 mb-2">{t('charging.valuesReportedByUser')}:</p>
                <p className="text-sm text-gray-300">
                  {t('charging.energy')}: <strong>{verifyingSession.energy_delivered_kwh} kWh</strong>
                </p>
                <p className="text-sm text-gray-300">
                  {t('charging.cost')}: <strong>{verifyingSession.total_cost} zł</strong>
                </p>
              </div>
            </Card>

            <form onSubmit={(e) => { e.preventDefault(); handleVerifySubmit(true); }}>
              <Card variant="glass" className="bg-yellow-900/20 border-yellow-500 mb-4">
                <p className="text-sm text-yellow-200">
                  {t('charging.checkDisplayValues')}
                </p>
              </Card>

              <Input
                label={t('charging.energyDelivered')}
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
                label={t('charging.chargingDuration')}
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
                  <p className="text-xs text-gray-400 mb-1">{t('charging.finalCost')}</p>
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
                  {t('common.cancel')}
                </Button>
                <Button
                  type="submit"
                  disabled={!verifyFormData.energy_delivered_kwh}
                  variant="secondary"
                  fullWidth
                  className="bg-green-600 hover:bg-green-700"
                >
                  ✅ {t('charging.approveSession')}
                </Button>
              </div>
            </form>
          </>
        )}
      </Modal>

      {/* QR Code Modal */}
      {showQRModal && selectedSessionForQR && (
        <ChargingSessionQRModal
          session={selectedSessionForQR}
          onClose={handleCloseQR}
        />
      )}
    </div>
  );
}

export default ChargingDashboardPage;