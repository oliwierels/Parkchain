import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Navigate, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import {
  FaUser,
  FaShieldAlt,
  FaBell,
  FaCreditCard,
  FaSignOutAlt,
  FaEnvelope,
  FaPhone,
  FaIdCard,
  FaParking,
  FaChargingStation,
  FaStar,
  FaCoins,
  FaWallet,
  FaTrophy,
  FaMedal,
  FaBuilding,
  FaBolt,
  FaWarehouse
} from 'react-icons/fa';
import { Card, Button, Avatar, Badge, SkeletonProfile } from '../components/ui';
import AchievementsPage from './AchievementsPage';
import BadgesPage from './BadgesPage';
import InstitutionalOperatorDashboard from './InstitutionalOperatorDashboard';
import AdvancedGatewayDashboard from './AdvancedGatewayDashboard';
import ParkingMarketplacePage from './ParkingMarketplacePage';

function ProfilePage() {
  const { user, loading, isAuthenticated, logout } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('profile');
  const [stats, setStats] = useState({
    reservations: 0,
    chargingSessions: 0,
    dcpPoints: 0
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Fetch user stats from API
        const token = localStorage.getItem('token');

        // Get reservations count
        const resRes = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/reservations`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const resData = await resRes.json();

        // Get charging sessions count
        const chargeRes = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/charging-sessions/my-sessions`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const chargeData = await chargeRes.json();

        setStats({
          reservations: resData.reservations?.length || 0,
          chargingSessions: chargeData.sessions?.length || 0,
          dcpPoints: 0 // TODO: implement points API
        });
      } catch (err) {
        console.error('Error fetching stats:', err);
      }
    };

    if (isAuthenticated) {
      fetchStats();
    }
  }, [isAuthenticated]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950">
        <div className="max-w-md w-full p-6">
          <SkeletonProfile />
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  const menuItems = [
    { id: 'profile', label: t('profilePage.profile'), icon: FaUser },
    { id: 'achievements', label: t('profilePage.achievements') || 'Achievements', icon: FaTrophy },
    { id: 'badges', label: t('profilePage.badges') || 'Badges', icon: FaMedal },
    { id: 'parkfi', label: t('profilePage.parkfi') || '🅿️ ParkFi', icon: FaWarehouse },
    { id: 'operator', label: t('profilePage.operator') || 'Operator', icon: FaBuilding },
    { id: 'gateway', label: t('profilePage.gateway') || 'Gateway Pro', icon: FaBolt },
    { id: 'security', label: t('profilePage.security'), icon: FaShieldAlt },
    { id: 'notifications', label: t('profilePage.notifications'), icon: FaBell },
    { id: 'billing', label: t('profilePage.billing'), icon: FaCreditCard },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950">
      <div className="flex flex-col md:flex-row h-screen">
        {/* Sidebar */}
        <motion.div
          initial={{ x: -300 }}
          animate={{ x: 0 }}
          transition={{ type: "spring", stiffness: 100, damping: 20 }}
          className="w-full md:w-72 bg-white/5 backdrop-blur-xl border-b md:border-r border-white/10 flex flex-col"
        >
          {/* User Info */}
          <div className="p-6 border-b border-white/10">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="flex items-center gap-4 md:flex-col"
            >
              <Avatar
                fallback={user.full_name}
                size="2xl"
                className="mx-auto"
              />
              <div className="md:text-center">
                <h2 className="text-white font-bold text-lg mb-1">
                  {user.full_name}
                </h2>
                <p className="text-gray-400 text-sm mb-2">{user.email}</p>
                <Badge variant="primary" size="sm">
                  {user.role === 'driver' ? t('profilePage.driver') : user.role}
                </Badge>
              </div>
            </motion.div>
          </div>

          {/* Menu Items */}
          <nav className="flex-1 p-4 overflow-y-auto">
            {menuItems.map((item, index) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 * index }}
              >
                <button
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl mb-2 transition-all ${
                    activeTab === item.id
                      ? 'bg-gradient-to-r from-parkchain-500 to-parkchain-600 text-white shadow-lg'
                      : 'text-gray-400 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <item.icon className="text-xl" />
                  <span className="font-medium">{item.label}</span>
                </button>
              </motion.div>
            ))}
          </nav>

          {/* Logout Button */}
          <div className="p-4 border-t border-white/10">
            <Button
              onClick={handleLogout}
              variant="ghost"
              fullWidth
              leftIcon={<FaSignOutAlt />}
              className="text-red-400 hover:bg-red-500/10"
            >
              {t('profilePage.logout')}
            </Button>
          </div>
        </motion.div>

        {/* Main Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-6xl mx-auto p-4 md:p-8">
            <AnimatePresence mode="wait">
              {/* Profile Tab */}
              {activeTab === 'profile' && (
                <motion.div
                  key="profile"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  <h1 className="text-3xl md:text-4xl font-black text-white mb-8">
                    {t('profilePage.myProfile')}
                  </h1>

                  {/* Info Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.1 }}
                    >
                      <Card variant="glass">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center flex-shrink-0">
                            <FaIdCard className="text-white text-xl" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-gray-400 text-sm">{t('profilePage.fullNameLabel')}</p>
                            <p className="text-white font-semibold text-lg truncate">{user.full_name}</p>
                          </div>
                        </div>
                      </Card>
                    </motion.div>

                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.15 }}
                    >
                      <Card variant="glass">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center flex-shrink-0">
                            <FaEnvelope className="text-white text-xl" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-gray-400 text-sm">{t('profilePage.emailLabel')}</p>
                            <p className="text-white font-semibold text-lg truncate">{user.email}</p>
                          </div>
                        </div>
                      </Card>
                    </motion.div>

                    {user.phone && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.2 }}
                      >
                        <Card variant="glass">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center flex-shrink-0">
                              <FaPhone className="text-white text-xl" />
                            </div>
                            <div className="min-w-0">
                              <p className="text-gray-400 text-sm">{t('profilePage.phoneLabel')}</p>
                              <p className="text-white font-semibold text-lg truncate">{user.phone}</p>
                            </div>
                          </div>
                        </Card>
                      </motion.div>
                    )}

                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.25 }}
                    >
                      <Card variant="glass">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-500 rounded-xl flex items-center justify-center flex-shrink-0">
                            <FaShieldAlt className="text-white text-xl" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-gray-400 text-sm">{t('profilePage.roleLabel')}</p>
                            <Badge variant="primary" size="md">
                              {user.role === 'driver' ? t('profilePage.driver') : user.role}
                            </Badge>
                          </div>
                        </div>
                      </Card>
                    </motion.div>
                  </div>

                  {/* Stats Section */}
                  <h2 className="text-2xl font-bold text-white mb-4 mt-8">
                    {t('profilePage.statistics') || 'Statystyki'}
                  </h2>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.3 }}
                    >
                      <Card variant="glass" padding="lg" className="text-center">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center mx-auto mb-3">
                          <FaParking className="text-white text-2xl" />
                        </div>
                        <p className="text-3xl font-bold text-white mb-1">{stats.reservations}</p>
                        <p className="text-gray-400 text-sm">Rezerwacji</p>
                      </Card>
                    </motion.div>

                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.35 }}
                    >
                      <Card variant="glass" padding="lg" className="text-center">
                        <div className="w-12 h-12 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-xl flex items-center justify-center mx-auto mb-3">
                          <FaChargingStation className="text-white text-2xl" />
                        </div>
                        <p className="text-3xl font-bold text-white mb-1">{stats.chargingSessions}</p>
                        <p className="text-gray-400 text-sm">Ładowań</p>
                      </Card>
                    </motion.div>

                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.45 }}
                    >
                      <Card variant="glass" padding="lg" className="text-center">
                        <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center mx-auto mb-3">
                          <FaCoins className="text-white text-2xl" />
                        </div>
                        <p className="text-3xl font-bold text-white mb-1">{stats.dcpPoints}</p>
                        <p className="text-gray-400 text-sm">DCP Points</p>
                      </Card>
                    </motion.div>
                  </div>

                  {/* Wallet Section */}
                  {user.wallet_address && (
                    <>
                      <h2 className="text-2xl font-bold text-white mb-4 mt-8">
                        Portfel Solana
                      </h2>
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.5 }}
                      >
                        <Card variant="glass" padding="lg">
                          <div className="flex items-center gap-4">
                            <div className="w-14 h-14 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center flex-shrink-0">
                              <FaWallet className="text-white text-2xl" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-gray-400 text-sm mb-1">Adres portfela</p>
                              <p className="text-white font-mono text-sm truncate">
                                {user.wallet_address}
                              </p>
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                navigator.clipboard.writeText(user.wallet_address);
                                alert('Skopiowano adres!');
                              }}
                            >
                              Kopiuj
                            </Button>
                          </div>
                        </Card>
                      </motion.div>
                    </>
                  )}
                </motion.div>
              )}

              {/* Achievements Tab */}
              {activeTab === 'achievements' && (
                <motion.div
                  key="achievements"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  <AchievementsPage />
                </motion.div>
              )}

              {/* Badges Tab */}
              {activeTab === 'badges' && (
                <motion.div
                  key="badges"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  <BadgesPage />
                </motion.div>
              )}

              {/* ParkFi Tab */}
              {activeTab === 'parkfi' && (
                <motion.div
                  key="parkfi"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  <ParkingMarketplacePage />
                </motion.div>
              )}

              {/* Operator Tab */}
              {activeTab === 'operator' && (
                <motion.div
                  key="operator"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  <InstitutionalOperatorDashboard />
                </motion.div>
              )}

              {/* Gateway Pro Tab */}
              {activeTab === 'gateway' && (
                <motion.div
                  key="gateway"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  <AdvancedGatewayDashboard />
                </motion.div>
              )}

              {/* Other Tabs */}
              {(activeTab === 'security' || activeTab === 'notifications' || activeTab === 'billing') && (
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  <Card variant="glass" padding="lg" className="text-center">
                    <div className="text-6xl mb-4">
                      {activeTab === 'security' && <FaShieldAlt className="text-gray-600 mx-auto" />}
                      {activeTab === 'notifications' && <FaBell className="text-gray-600 mx-auto" />}
                      {activeTab === 'billing' && <FaCreditCard className="text-gray-600 mx-auto" />}
                    </div>
                    <h2 className="text-2xl font-bold text-white mb-2">
                      {menuItems.find(item => item.id === activeTab)?.label}
                    </h2>
                    <p className="text-gray-400">
                      {t('profilePage.comingSoon')}
                    </p>
                  </Card>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProfilePage;
