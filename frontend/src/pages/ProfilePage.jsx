import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Navigate, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { inspectionAPI } from '../services/api';
import { useTranslation } from 'react-i18next';
import {
  FaUser,
  FaShieldAlt,
  FaChartLine,
  FaBell,
  FaCreditCard,
  FaSignOutAlt,
  FaEnvelope,
  FaPhone,
  FaIdCard,
  FaCheckCircle,
  FaTimesCircle,
  FaClipboardList,
  FaTrophy
} from 'react-icons/fa';
import { Card, Button, Avatar, Badge, SkeletonProfile } from '../components/ui';

function ProfilePage() {
  const { user, loading, isAuthenticated, logout } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [reputation, setReputation] = useState(null);
  const [loadingReputation, setLoadingReputation] = useState(true);
  const [activeTab, setActiveTab] = useState('profile');

  useEffect(() => {
    if (isAuthenticated) {
      fetchReputation();
    }
  }, [isAuthenticated]);

  const fetchReputation = async () => {
    try {
      setLoadingReputation(true);
      const data = await inspectionAPI.getMyReputation();
      setReputation(data);
    } catch (err) {
      console.error(t('console.fetchReputationError'), err);
    } finally {
      setLoadingReputation(false);
    }
  };

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
    { id: 'activity', label: t('profilePage.activity'), icon: FaChartLine },
    { id: 'security', label: t('profilePage.security'), icon: FaShieldAlt },
    { id: 'notifications', label: t('profilePage.notifications'), icon: FaBell },
    { id: 'billing', label: t('profilePage.billing'), icon: FaCreditCard },
  ];

  const stats = [
    {
      icon: FaTrophy,
      label: t('profilePage.reputationPoints'),
      value: reputation?.score || 0,
      gradient: 'from-blue-500 to-cyan-500',
      bg: 'bg-blue-500/10',
      color: 'text-blue-400'
    },
    {
      icon: FaCheckCircle,
      label: t('profilePage.approved'),
      value: reputation?.reports_confirmed || 0,
      gradient: 'from-green-500 to-emerald-500',
      bg: 'bg-green-500/10',
      color: 'text-green-400'
    },
    {
      icon: FaTimesCircle,
      label: t('profilePage.rejected'),
      value: reputation?.reports_rejected || 0,
      gradient: 'from-red-500 to-pink-500',
      bg: 'bg-red-500/10',
      color: 'text-red-400'
    },
    {
      icon: FaClipboardList,
      label: t('profilePage.totalReports'),
      value: reputation?.reports_total || 0,
      gradient: 'from-purple-500 to-pink-500',
      bg: 'bg-purple-500/10',
      color: 'text-purple-400'
    }
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
                </motion.div>
              )}

              {/* Activity Tab */}
              {activeTab === 'activity' && (
                <motion.div
                  key="activity"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  <h1 className="text-3xl md:text-4xl font-black text-white mb-8">
                    {t('profilePage.crowdscanActivity')}
                  </h1>

                  {loadingReputation ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                      {[1, 2, 3, 4].map(i => (
                        <div key={i} className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 animate-pulse">
                          <div className="h-8 bg-slate-700 rounded mb-4" />
                          <div className="h-12 bg-slate-700 rounded mb-2" />
                          <div className="h-4 bg-slate-700 rounded w-2/3" />
                        </div>
                      ))}
                    </div>
                  ) : reputation ? (
                    <>
                      {/* Stats Grid */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                        {stats.map((stat, index) => (
                          <motion.div
                            key={stat.label}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.1 * index }}
                          >
                            <Card variant="glass" hoverable className={stat.bg}>
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
                      </div>

                      {/* Info Box */}
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                      >
                        <Card variant="glass" className="bg-gradient-to-br from-parkchain-500/10 to-purple-500/10 border-parkchain-400/20">
                          <h3 className="text-white font-bold text-lg mb-4 flex items-center gap-2">
                            <FaChartLine className="text-parkchain-400" />
                            {t('profilePage.howItWorks')}
                          </h3>
                          <ul className="space-y-3 text-gray-300 text-sm md:text-base">
                            <li className="flex items-start gap-3">
                              <FaCheckCircle className="text-green-400 mt-1 flex-shrink-0" />
                              <span>{t('profilePage.howItWorksSteps.step1')}</span>
                            </li>
                            <li className="flex items-start gap-3">
                              <FaCheckCircle className="text-green-400 mt-1 flex-shrink-0" />
                              <span>{t('profilePage.howItWorksSteps.step2')}</span>
                            </li>
                            <li className="flex items-start gap-3">
                              <FaCheckCircle className="text-green-400 mt-1 flex-shrink-0" />
                              <span>{t('profilePage.howItWorksSteps.step3')}</span>
                            </li>
                            <li className="flex items-start gap-3">
                              <FaCheckCircle className="text-green-400 mt-1 flex-shrink-0" />
                              <span>{t('profilePage.howItWorksSteps.step4')}</span>
                            </li>
                          </ul>
                        </Card>
                      </motion.div>
                    </>
                  ) : (
                    <Card variant="glass" padding="lg" className="text-center">
                      <FaChartLine className="text-6xl text-gray-600 mx-auto mb-4" />
                      <p className="text-gray-400 text-lg">
                        {t('profilePage.noReputationData')}
                      </p>
                    </Card>
                  )}
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
