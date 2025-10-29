import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import NotificationCenter from './NotificationCenter';
import LanguageSwitcher from './LanguageSwitcher';
import {
  FaHome,
  FaMap,
  FaMedal,
  FaParking,
  FaChartLine,
  FaChevronDown,
  FaCalendarAlt,
  FaChargingStation,
  FaUser,
  FaRocket,
  FaTrophy,
  FaLandmark,
  FaWarehouse,
  FaHeart,
  FaTicketAlt,
  FaHistory
} from 'react-icons/fa';

function Navbar() {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMyMenuOpen, setIsMyMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const myDropdownRef = useRef(null);
  const userDropdownRef = useRef(null);
  const handleLogout = () => {
    logout();
    navigate('/login');
    setIsMobileMenuOpen(false);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  // Close dropdown when clicking outside
  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      // Zamknij menu "Moje"
      if (myDropdownRef.current && !myDropdownRef.current.contains(event.target)) {
        setIsMyMenuOpen(false);
      }
      // Zamknij menu Użytkownika
      if (userDropdownRef.current && !userDropdownRef.current.contains(event.target)) {
        setIsUserMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []); // Usuń refy z tablicy zależności, aby useEffect uruchamiał się tylko raz

  const getLinkClasses = ({ isActive }) => {
    return isActive
      ? 'text-indigo-400 bg-gray-800/50 font-medium px-3 py-2 rounded-lg text-sm flex items-center gap-2 transition-all'
      : 'text-gray-300 hover:text-indigo-400 hover:bg-gray-800/30 px-3 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2';
  };

  return (
    <nav className="bg-gray-900 border-b border-gray-700 shadow-lg sticky top-0 z-50 backdrop-blur-lg bg-opacity-95">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">

          {/* Logo */}
          <div className="flex items-center flex-shrink-0">
            <NavLink to="/" className="flex items-center gap-2 group">
              <img
                className="h-40 w-auto transition-transform group-hover:scale-110"
                src="/Parkchain.png"
                alt="ParkChain"
              />
            </NavLink>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex flex-1 items-center gap-1 ml-8">
            <NavLink to="/" className={getLinkClasses} end title={t('nav.home')}>
              <FaHome />
              <span>{t('nav.home')}</span>
            </NavLink>
            <NavLink to="/map" className={getLinkClasses} title={t('nav.map')}>
              <FaMap />
              <span>{t('nav.map')}</span>
            </NavLink>

            <div className="h-8 w-px bg-gray-700 mx-2"></div>

            <NavLink to="/analytics" className={getLinkClasses} title="Analytics i statystyki">
              <FaChartLine />
              <span>Analytics</span>
            </NavLink>
          </div>

          {isAuthenticated && user ? (
            <div className="flex items-center gap-4">
              {/* Language Switcher */}
              <LanguageSwitcher />

              {/* Notification Center */}
              <NotificationCenter />

              {/* User Menu */}
              <div className="relative" ref={userDropdownRef}>
              <button
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className="flex items-center gap-2 px-3 py-1.5 bg-gray-800/50 rounded-lg border border-gray-700 hover:border-indigo-500 transition-colors"
              >
                <FaUser className="text-indigo-400 text-sm" />
                <span className="text-gray-300 text-sm font-medium">
                  {user.full_name || user.email}
                </span>
                <FaChevronDown className={`text-xs text-gray-500 transition-transform ${isUserMenuOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* Dropdown użytkownika (skopiowany z menu "Moje") */}
              <AnimatePresence>
                {isUserMenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.15 }}
                    className="absolute top-full mt-2 right-0 w-56 bg-gray-800 border border-gray-700 rounded-lg shadow-2xl overflow-hidden z-50"
                  >
                    <div className="py-2">
                      <NavLink
                          to="/profile"
                          onClick={() => setIsUserMenuOpen(false)}
                          className={({ isActive }) =>
                            isActive
                              ? 'bg-indigo-600 text-white px-4 py-2.5 text-sm font-medium flex items-center gap-3 transition-colors'
                              : 'text-gray-300 hover:bg-gray-700 hover:text-indigo-400 px-4 py-2.5 text-sm font-medium flex items-center gap-3 transition-colors'
                          }
                        >
                          <FaUser className="text-base" />
                          <span>{t('nav.profile')}</span>
                        </NavLink>
                      <NavLink
                        to="/my-reservations"
                        onClick={() => setIsUserMenuOpen(false)}
                        className={({ isActive }) =>
                          isActive
                            ? 'bg-indigo-600 text-white px-4 py-2.5 text-sm font-medium flex items-center gap-3 transition-colors'
                            : 'text-gray-300 hover:bg-gray-700 hover:text-indigo-400 px-4 py-2.5 text-sm font-medium flex items-center gap-3 transition-colors'
                        }
                      >
                        <FaCalendarAlt className="text-base" />
                        <span>{t('nav.myReservations')}</span>
                      </NavLink>
                      <NavLink
                        to="/my-parkings"
                        onClick={() => setIsUserMenuOpen(false)}
                        className={({ isActive }) =>
                          isActive
                            ? 'bg-indigo-600 text-white px-4 py-2.5 text-sm font-medium flex items-center gap-3 transition-colors'
                            : 'text-gray-300 hover:bg-gray-700 hover:text-indigo-400 px-4 py-2.5 text-sm font-medium flex items-center gap-3 transition-colors'
                        }
                      >
                        <FaParking className="text-base" />
                        <span>{t('nav.myParkings')}</span>
                      </NavLink>
                      <NavLink
                        to="/my-chargers"
                        onClick={() => setIsUserMenuOpen(false)}
                        className={({ isActive }) =>
                          isActive
                            ? 'bg-indigo-600 text-white px-4 py-2.5 text-sm font-medium flex items-center gap-3 transition-colors'
                            : 'text-gray-300 hover:bg-gray-700 hover:text-indigo-400 px-4 py-2.5 text-sm font-medium flex items-center gap-3 transition-colors'
                        }
                      >
                        <FaChargingStation className="text-base" />
                        <span>{t('nav.myChargers')}</span>
                      </NavLink>

                      {/* New Features */}
                      <div className="border-t border-gray-700 my-2"></div>
                      <NavLink
                        to="/activity"
                        onClick={() => setIsUserMenuOpen(false)}
                        className={({ isActive }) =>
                          isActive
                            ? 'bg-indigo-600 text-white px-4 py-2.5 text-sm font-medium flex items-center gap-3 transition-colors'
                            : 'text-gray-300 hover:bg-gray-700 hover:text-indigo-400 px-4 py-2.5 text-sm font-medium flex items-center gap-3 transition-colors'
                        }
                      >
                        <FaHistory className="text-base" />
                        <span>{t('nav.activity')}</span>
                      </NavLink>
                      <NavLink
                        to="/support"
                        onClick={() => setIsUserMenuOpen(false)}
                        className={({ isActive }) =>
                          isActive
                            ? 'bg-indigo-600 text-white px-4 py-2.5 text-sm font-medium flex items-center gap-3 transition-colors'
                            : 'text-gray-300 hover:bg-gray-700 hover:text-indigo-400 px-4 py-2.5 text-sm font-medium flex items-center gap-3 transition-colors'
                        }
                      >
                        <FaTicketAlt className="text-base" />
                        <span>{t('nav.support')}</span>
                      </NavLink>

                      {/* Separator i przycisk wylogowania */}
                      <div className="border-t border-gray-700 my-2"></div>
                      <button
                        onClick={handleLogout}
                        className="w-full text-left text-red-400 hover:bg-red-900/50 hover:text-red-300 px-4 py-2.5 text-sm font-medium flex items-center gap-3 transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                        <span>{t('nav.logout')}</span>
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-4">
              {/* Language Switcher for non-authenticated users */}
              <LanguageSwitcher />

              <NavLink
                to="/login"
                className="bg-indigo-600 text-white hover:bg-indigo-700 px-4 py-2 rounded-lg text-sm font-medium transition-all hover:shadow-lg hover:scale-105"
              >
                {t('nav.login')}
              </NavLink>
            </div>
          )}

          {/* Mobile Menu Button */}
          <div className="flex lg:hidden">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="bg-gray-800 inline-flex items-center justify-center p-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-700 transition-all focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500"
            >
              <span className="sr-only">
                {isMobileMenuOpen ? t('nav.closeMenu') : t('nav.openMenu')}
              </span>
              {isMobileMenuOpen ? (
                <svg className="block h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="block h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="lg:hidden border-t border-gray-700 overflow-hidden bg-gray-900/95 backdrop-blur-lg"
          >
            <div className="px-4 pt-2 pb-3 space-y-1">
              {/* Main Section */}
              <div className="mb-3">
                <div className="text-xs font-bold text-gray-500 uppercase tracking-wider px-3 mb-2">
                  {t('nav.mainSection')}
                </div>
                <NavLink
                  to="/"
                  onClick={closeMobileMenu}
                  className={({ isActive }) =>
                    isActive
                      ? 'bg-gray-800 text-indigo-400 flex items-center gap-3 px-3 py-2.5 rounded-lg text-base font-medium'
                      : 'text-gray-300 hover:bg-gray-800 hover:text-indigo-400 flex items-center gap-3 px-3 py-2.5 rounded-lg text-base font-medium transition-colors'
                  }
                  end
                >
                  <FaHome />
                  <span>{t('nav.home')}</span>
                </NavLink>
                <NavLink
                  to="/map"
                  onClick={closeMobileMenu}
                  className={({ isActive }) =>
                    isActive
                      ? 'bg-gray-800 text-indigo-400 flex items-center gap-3 px-3 py-2.5 rounded-lg text-base font-medium'
                      : 'text-gray-300 hover:bg-gray-800 hover:text-indigo-400 flex items-center gap-3 px-3 py-2.5 rounded-lg text-base font-medium transition-colors'
                  }
                >
                  <FaMap />
                  <span>{t('nav.map')}</span>
                </NavLink>
              </div>

              {/* Management Section */}
              <div className="mb-3">
                <div className="text-xs font-bold text-gray-500 uppercase tracking-wider px-3 mb-2">
                  {t('nav.managementSection')}
                </div>
                <NavLink
                  to="/add-parking"
                  onClick={closeMobileMenu}
                  className={({ isActive }) =>
                    isActive
                      ? 'bg-gray-800 text-indigo-400 flex items-center gap-3 px-3 py-2.5 rounded-lg text-base font-medium'
                      : 'text-gray-300 hover:bg-gray-800 hover:text-indigo-400 flex items-center gap-3 px-3 py-2.5 rounded-lg text-base font-medium transition-colors'
                  }
                >
                  <FaParking />
                  <span>{t('nav.addParking')}</span>
                </NavLink>
                <NavLink
                  to="/my-reservations"
                  onClick={closeMobileMenu}
                  className={({ isActive }) =>
                    isActive
                      ? 'bg-gray-800 text-indigo-400 flex items-center gap-3 px-3 py-2.5 rounded-lg text-base font-medium'
                      : 'text-gray-300 hover:bg-gray-800 hover:text-indigo-400 flex items-center gap-3 px-3 py-2.5 rounded-lg text-base font-medium transition-colors'
                  }
                >
                  <FaCalendarAlt />
                  <span>{t('nav.myReservations')}</span>
                </NavLink>
                <NavLink
                  to="/my-parkings"
                  onClick={closeMobileMenu}
                  className={({ isActive }) =>
                    isActive
                      ? 'bg-gray-800 text-indigo-400 flex items-center gap-3 px-3 py-2.5 rounded-lg text-base font-medium'
                      : 'text-gray-300 hover:bg-gray-800 hover:text-indigo-400 flex items-center gap-3 px-3 py-2.5 rounded-lg text-base font-medium transition-colors'
                  }
                >
                  <FaParking />
                  <span>{t('nav.myParkings')}</span>
                </NavLink>
                <NavLink
                  to="/my-chargers"
                  onClick={closeMobileMenu}
                  className={({ isActive }) =>
                    isActive
                      ? 'bg-gray-800 text-indigo-400 flex items-center gap-3 px-3 py-2.5 rounded-lg text-base font-medium'
                      : 'text-gray-300 hover:bg-gray-800 hover:text-indigo-400 flex items-center gap-3 px-3 py-2.5 rounded-lg text-base font-medium transition-colors'
                  }
                >
                  <FaChargingStation />
                  <span>{t('nav.myChargers')}</span>
                </NavLink>
                <NavLink
                  to="/analytics"
                  onClick={closeMobileMenu}
                  className={({ isActive }) =>
                    isActive
                      ? 'bg-gray-800 text-indigo-400 flex items-center gap-3 px-3 py-2.5 rounded-lg text-base font-medium'
                      : 'text-gray-300 hover:bg-gray-800 hover:text-indigo-400 flex items-center gap-3 px-3 py-2.5 rounded-lg text-base font-medium transition-colors'
                  }
                >
                  <FaChartLine />
                  <span>{t('nav.analytics')}</span>
                </NavLink>
              </div>
            </div>

            {/* Mobile User Section */}
            <div className="pt-4 pb-4 border-t border-gray-700 px-4">
              {isAuthenticated && user ? (
                <div>
                  <div className="flex items-center gap-2 px-3 py-2 bg-gray-800/50 rounded-lg border border-gray-700 mb-3">
                    <FaUser className="text-indigo-400" />
                    <div className="text-base font-medium text-white">
                      {user.full_name || user.email}
                    </div>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="w-full bg-indigo-600 text-white hover:bg-indigo-700 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors"
                  >
                    {t('nav.logout')}
                  </button>
                </div>
              ) : (
                <NavLink
                  to="/login"
                  onClick={closeMobileMenu}
                  className="block w-full bg-indigo-600 text-white hover:bg-indigo-700 px-4 py-2.5 rounded-lg text-sm font-medium text-center transition-colors"
                >
                  {t('nav.login')}
                </NavLink>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}

export default Navbar;
