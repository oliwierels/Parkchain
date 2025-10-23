import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Navigate, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { inspectionAPI } from '../services/api';
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

function ProfilePage() {
  const { user, loading, isAuthenticated, logout } = useAuth();
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
      console.error('Błąd pobierania reputacji:', err);
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
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-white text-xl"
        >
          Ładowanie...
        </motion.div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  const menuItems = [
    { id: 'profile', label: 'Profil', icon: FaUser },
    { id: 'activity', label: 'Aktywność', icon: FaChartLine },
    { id: 'security', label: 'Bezpieczeństwo', icon: FaShieldAlt },
    { id: 'notifications', label: 'Powiadomienia', icon: FaBell },
    { id: 'billing', label: 'Płatności', icon: FaCreditCard },
  ];

  const stats = [
    {
      icon: FaTrophy,
      label: 'Punkty Reputacji',
      value: reputation?.score || 0,
      gradient: 'from-blue-500 to-cyan-500',
      bg: 'bg-blue-500/10',
      color: 'text-blue-400'
    },
    {
      icon: FaCheckCircle,
      label: 'Zatwierdzone',
      value: reputation?.reports_confirmed || 0,
      gradient: 'from-green-500 to-emerald-500',
      bg: 'bg-green-500/10',
      color: 'text-green-400'
    },
    {
      icon: FaTimesCircle,
      label: 'Odrzucone',
      value: reputation?.reports_rejected || 0,
      gradient: 'from-red-500 to-pink-500',
      bg: 'bg-red-500/10',
      color: 'text-red-400'
    },
    {
      icon: FaClipboardList,
      label: 'Razem zgłoszeń',
      value: reputation?.reports_total || 0,
      gradient: 'from-purple-500 to-pink-500',
      bg: 'bg-purple-500/10',
      color: 'text-purple-400'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950">
      <div className="flex h-screen">
        {/* Sidebar */}
        <motion.div
          initial={{ x: -300 }}
          animate={{ x: 0 }}
          transition={{ type: "spring", stiffness: 100, damping: 20 }}
          className="w-72 bg-white/5 backdrop-blur-xl border-r border-white/10 flex flex-col"
        >
          {/* User Info */}
          <div className="p-6 border-b border-white/10">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="w-20 h-20 mx-auto bg-gradient-to-br from-parkchain-400 to-parkchain-600 rounded-2xl flex items-center justify-center mb-4"
            >
              <FaUser className="text-3xl text-white" />
            </motion.div>
            <h2 className="text-white text-center font-bold text-lg mb-1">
              {user.full_name}
            </h2>
            <p className="text-gray-400 text-center text-sm">{user.email}</p>
          </div>

          {/* Menu Items */}
          <nav className="flex-1 p-4">
            {menuItems.map((item, index) => (
              <motion.button
                key={item.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 * index }}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl mb-2 transition-all ${
                  activeTab === item.id
                    ? 'bg-gradient-to-r from-parkchain-500 to-parkchain-600 text-white shadow-lg'
                    : 'text-gray-400 hover:bg-white/5 hover:text-white'
                }`}
                whileHover={{ scale: 1.02, x: 4 }}
                whileTap={{ scale: 0.98 }}
              >
                <item.icon className="text-xl" />
                <span className="font-medium">{item.label}</span>
              </motion.button>
            ))}
          </nav>

          {/* Logout Button */}
          <div className="p-4 border-t border-white/10">
            <motion.button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-400 hover:bg-red-500/10 transition-all"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <FaSignOutAlt className="text-xl" />
              <span className="font-medium">Wyloguj</span>
            </motion.button>
          </div>
        </motion.div>

        {/* Main Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-6xl mx-auto p-8">
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
                  <h1 className="text-4xl font-black text-white mb-8">
                    Mój Profil
                  </h1>

                  {/* Info Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.1 }}
                      className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6"
                    >
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center">
                          <FaIdCard className="text-white text-xl" />
                        </div>
                        <div>
                          <p className="text-gray-400 text-sm">Imię i nazwisko</p>
                          <p className="text-white font-semibold text-lg">{user.full_name}</p>
                        </div>
                      </div>
                    </motion.div>

                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.15 }}
                      className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6"
                    >
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                          <FaEnvelope className="text-white text-xl" />
                        </div>
                        <div>
                          <p className="text-gray-400 text-sm">Email</p>
                          <p className="text-white font-semibold text-lg">{user.email}</p>
                        </div>
                      </div>
                    </motion.div>

                    {user.phone && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.2 }}
                        className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6"
                      >
                        <div className="flex items-center gap-3 mb-4">
                          <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center">
                            <FaPhone className="text-white text-xl" />
                          </div>
                          <div>
                            <p className="text-gray-400 text-sm">Telefon</p>
                            <p className="text-white font-semibold text-lg">{user.phone}</p>
                          </div>
                        </div>
                      </motion.div>
                    )}

                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.25 }}
                      className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6"
                    >
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-500 rounded-xl flex items-center justify-center">
                          <FaShieldAlt className="text-white text-xl" />
                        </div>
                        <div>
                          <p className="text-gray-400 text-sm">Rola</p>
                          <p className="text-white font-semibold text-lg">
                            {user.role === 'driver' ? 'Kierowca' : user.role}
                          </p>
                        </div>
                      </div>
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
                  <h1 className="text-4xl font-black text-white mb-8">
                    Aktywność CrowdScan
                  </h1>

                  {loadingReputation ? (
                    <div className="text-center py-20">
                      <div className="text-gray-400 text-lg">Ładowanie statystyk...</div>
                    </div>
                  ) : reputation ? (
                    <>
                      {/* Stats Grid */}
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                        {stats.map((stat, index) => (
                          <motion.div
                            key={stat.label}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.1 * index }}
                            className={`${stat.bg} backdrop-blur-xl border border-white/10 rounded-2xl p-6 relative overflow-hidden`}
                            whileHover={{ scale: 1.05, y: -5 }}
                          >
                            <div className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-br ${stat.gradient} opacity-10 blur-2xl`}></div>
                            <div className="relative">
                              <stat.icon className={`text-3xl ${stat.color} mb-3`} />
                              <div className={`text-4xl font-black ${stat.color} mb-2`}>
                                {stat.value}
                              </div>
                              <div className="text-gray-400 text-sm font-medium">
                                {stat.label}
                              </div>
                            </div>
                          </motion.div>
                        ))}
                      </div>

                      {/* Info Box */}
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                        className="bg-gradient-to-br from-parkchain-500/10 to-purple-500/10 backdrop-blur-xl border border-parkchain-400/20 rounded-2xl p-6"
                      >
                        <h3 className="text-white font-bold text-lg mb-4 flex items-center gap-2">
                          <FaChartLine className="text-parkchain-400" />
                          Jak to działa?
                        </h3>
                        <ul className="space-y-3 text-gray-300">
                          <li className="flex items-start gap-3">
                            <FaCheckCircle className="text-green-400 mt-1 flex-shrink-0" />
                            <span>Zgłaszaj zajętość parkingów na mapie (przycisk CrowdScan)</span>
                          </li>
                          <li className="flex items-start gap-3">
                            <FaCheckCircle className="text-green-400 mt-1 flex-shrink-0" />
                            <span>Inspektorzy weryfikują Twoje zgłoszenia</span>
                          </li>
                          <li className="flex items-start gap-3">
                            <FaCheckCircle className="text-green-400 mt-1 flex-shrink-0" />
                            <span>Za potwierdzone zgłoszenia otrzymujesz punkty i nagrody (5 PLN)</span>
                          </li>
                          <li className="flex items-start gap-3">
                            <FaCheckCircle className="text-green-400 mt-1 flex-shrink-0" />
                            <span>Buduj swoją reputację i pomagaj społeczności!</span>
                          </li>
                        </ul>
                      </motion.div>
                    </>
                  ) : (
                    <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-12 text-center">
                      <FaChartLine className="text-6xl text-gray-600 mx-auto mb-4" />
                      <p className="text-gray-400 text-lg">
                        Brak danych o reputacji. Zacznij zgłaszać zajętość parkingów na mapie!
                      </p>
                    </div>
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
                  className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-12 text-center"
                >
                  <div className="text-6xl mb-4">
                    {activeTab === 'security' && <FaShieldAlt className="text-gray-600 mx-auto" />}
                    {activeTab === 'notifications' && <FaBell className="text-gray-600 mx-auto" />}
                    {activeTab === 'billing' && <FaCreditCard className="text-gray-600 mx-auto" />}
                  </div>
                  <h2 className="text-2xl font-bold text-white mb-2">
                    {menuItems.find(item => item.id === activeTab)?.label}
                  </h2>
                  <p className="text-gray-400">
                    Ta sekcja będzie dostępna wkrótce
                  </p>
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
