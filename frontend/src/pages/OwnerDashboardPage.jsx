import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { FaParking, FaCheckCircle, FaClipboardList, FaMoneyBillWave, FaPlus } from 'react-icons/fa';
import {
  Card,
  Button,
  Badge,
  SkeletonCard,
  EmptyStateNoParkingSpots,
  EmptyState,
  useToast,
  ToastContainer
} from '../components/ui';

function OwnerDashboardPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();
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
  const { toasts, addToast, removeToast } = useToast();

  useEffect(() => {
    fetchOwnerData();
  }, []);

  const fetchOwnerData = async () => {
    try {
      setLoading(true);

      const parkingsResponse = await fetch('http://localhost:3000/api/parking-lots/my', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!parkingsResponse.ok) {
        throw new Error(t('dashboard.owner.fetchError'));
      }

      const parkingsData = await parkingsResponse.json();
      setMyParkings(parkingsData || []);

      const reservationsResponse = await fetch('http://localhost:3000/api/reservations', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (reservationsResponse.ok) {
        const reservationsData = await reservationsResponse.json();

        const myParkingIds = parkingsData.map(p => p.id);
        const myReservations = (reservationsData || []).filter(r =>
          myParkingIds.includes(r.lot_id)
        );

        setAllReservations(myReservations);

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
      console.error(t('console.fetchOwnerDataError'), err);
      setError(t('errors.loadDataError'));
      addToast({
        message: t('errors.loadDataError'),
        type: 'error'
      });
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

  const getStatusVariant = (status) => {
    switch (status) {
      case 'pending': return 'info';
      case 'active': return 'success';
      case 'completed': return 'default';
      case 'cancelled': return 'error';
      default: return 'default';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'pending': return t('dashboard.owner.statusText.pending');
      case 'active': return t('dashboard.owner.statusText.active');
      case 'completed': return t('dashboard.owner.statusText.completed');
      case 'cancelled': return t('dashboard.owner.statusText.cancelled');
      default: return status;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-6">
        <ToastContainer toasts={toasts} removeToast={removeToast} />
        <div className="max-w-7xl mx-auto">
          <div className="h-10 w-64 bg-slate-800 rounded-lg mb-8 animate-pulse" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
            {[1, 2, 3, 4].map(i => (
              <SkeletonCard key={i} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  const statCards = [
    {
      icon: FaParking,
      label: t('dashboard.owner.totalParkings'),
      value: stats.totalParkings,
      gradient: 'from-blue-500 to-cyan-500',
      bg: 'bg-blue-500/10',
      color: 'text-blue-400'
    },
    {
      icon: FaCheckCircle,
      label: t('dashboard.owner.activeParkings'),
      value: stats.activeParkings,
      gradient: 'from-green-500 to-emerald-500',
      bg: 'bg-green-500/10',
      color: 'text-green-400'
    },
    {
      icon: FaClipboardList,
      label: t('dashboard.owner.totalReservations'),
      value: stats.totalReservations,
      gradient: 'from-purple-500 to-pink-500',
      bg: 'bg-purple-500/10',
      color: 'text-purple-400'
    },
    {
      icon: FaMoneyBillWave,
      label: t('dashboard.owner.totalEarnings'),
      value: `${stats.totalEarnings} zł`,
      gradient: 'from-yellow-500 to-orange-500',
      bg: 'bg-yellow-500/10',
      color: 'text-yellow-400'
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
          className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8"
        >
          <h1 className="text-4xl font-bold text-white">
            {t('dashboard.owner.title')}
          </h1>
          <Button
            onClick={() => navigate('/add-parking')}
            variant="primary"
            size="lg"
            leftIcon={<FaPlus />}
          >
            {t('dashboard.owner.addParking')}
          </Button>
        </motion.div>

        {/* Stats Cards */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10"
        >
          {statCards.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + index * 0.05 }}
            >
              <Card variant="gradient" hoverable className={stat.bg}>
                <div className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-br ${stat.gradient} opacity-10 blur-2xl`} />
                <div className="relative">
                  <stat.icon className={`text-3xl ${stat.color} mb-3`} />
                  <div className={`text-3xl font-black ${stat.color} mb-2`}>
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

        {/* Lista parkingów */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="mb-10"
        >
          <h2 className="text-2xl font-bold mb-5 text-white">
            {t('dashboard.owner.title')}
          </h2>

          {myParkings.length === 0 ? (
            <EmptyStateNoParkingSpots onAddNew={() => navigate('/add-parking')} />
          ) : (
            <div className="grid gap-4">
              {myParkings.map((parking, index) => {
                const activeReservations = allReservations.filter(
                  r => r.lot_id === parking.id && (r.status === 'pending' || r.status === 'active')
                );

                return (
                  <motion.div
                    key={parking.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Card variant="glass" hoverable>
                      <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                        {/* Icon */}
                        <div className="flex items-start gap-4 flex-1">
                          <div className="w-16 h-16 rounded-xl bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                            <FaParking className="text-3xl text-blue-400" />
                          </div>

                          {/* Info */}
                          <div className="min-w-0 flex-1">
                            <h3 className="text-xl font-bold text-white mb-2 truncate">
                              {parking.name}
                            </h3>
                            <p className="text-sm text-gray-400 mb-2 truncate">
                              {parking.address}
                            </p>
                            <p className="text-lg font-bold text-parkchain-400">
                              {parking.price_per_hour} zł/godz
                            </p>
                          </div>
                        </div>

                        {/* Status */}
                        <div className="flex flex-col items-start sm:items-end gap-2">
                          <Badge
                            variant={parking.available_spots > 0 ? 'success' : 'error'}
                            size="md"
                          >
                            {parking.available_spots}/{parking.total_spots} {t('dashboard.owner.spaces')}
                          </Badge>
                          <p className="text-sm text-gray-400">
                            {activeReservations.length} {t('dashboard.owner.activeReservations')}
                          </p>
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          )}
        </motion.div>

        {/* Rezerwacje */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <h2 className="text-2xl font-bold mb-5 text-white">
            {t('dashboard.owner.recentReservations')}
          </h2>

          {allReservations.length === 0 ? (
            <EmptyState
              icon={<FaClipboardList className="text-6xl" />}
              title={t('dashboard.owner.noReservations')}
              description={t('dashboard.owner.noReservationsDescription')}
            />
          ) : (
            <Card variant="glass" padding="none">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-700">
                  <thead className="bg-slate-800/50">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">{t('dashboard.owner.tableHeaders.parking')}</th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">{t('dashboard.owner.tableHeaders.user')}</th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">{t('dashboard.owner.tableHeaders.start')}</th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">{t('dashboard.owner.tableHeaders.end')}</th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">{t('dashboard.owner.tableHeaders.price')}</th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">{t('dashboard.owner.tableHeaders.status')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-700">
                    {allReservations.map((reservation) => {
                      const parking = myParkings.find(p => p.id === reservation.lot_id);

                      return (
                        <motion.tr
                          key={reservation.id}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="hover:bg-slate-800/50 transition-colors"
                        >
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">
                            {parking?.name || t('dashboard.owner.unknown')}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                            {reservation.users?.full_name || reservation.users?.email || t('dashboard.owner.unknown')}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                            {formatDate(reservation.start_time)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                            {formatDate(reservation.end_time)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-400">
                            {parseFloat(reservation.price).toFixed(2)} zł
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <Badge variant={getStatusVariant(reservation.status)} size="sm">
                              {getStatusText(reservation.status)}
                            </Badge>
                          </td>
                        </motion.tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </motion.div>
      </div>
    </div>
  );
}

export default OwnerDashboardPage;
