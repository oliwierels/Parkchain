import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FaHome,
  FaMap,
  FaBolt,
  FaGem,
  FaMedal,
  FaParking,
  FaChartLine,
  FaChevronDown,
  FaCalendarAlt,
  FaChargingStation,
  FaUser,
  FaRocket
} from 'react-icons/fa';

function Navbar() {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMyMenuOpen, setIsMyMenuOpen] = useState(false);
  const dropdownRef = useRef(null);

  const handleLogout = () => {
    logout();
    navigate('/login');
    setIsMobileMenuOpen(false);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsMyMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getLinkClasses = ({ isActive }) => {
    return isActive
      ? 'text-indigo-400 bg-gray-800/50 font-medium px-3 py-2 rounded-lg text-sm flex items-center gap-2 transition-all'
      : 'text-gray-300 hover:text-indigo-400 hover:bg-gray-800/30 px-3 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2';
  };

  const getFeaturedLinkClasses = (colors) => ({ isActive }) => {
    if (isActive) {
      return `${colors.active} text-white font-bold px-3 py-2 rounded-lg text-sm flex items-center gap-2 shadow-lg transform scale-105 transition-all`;
    }
    return `${colors.gradient} text-white hover:shadow-lg hover:scale-105 px-3 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2`;
  };

  return (
    <nav className="bg-gray-900 border-b border-gray-700 shadow-lg sticky top-0 z-50 backdrop-blur-lg bg-opacity-95">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">

          {/* Logo */}
          <div className="flex items-center flex-shrink-0">
            <NavLink to="/" className="flex items-center gap-2 group">
              <img
                className="h-8 w-auto transition-transform group-hover:scale-110"
                src="/logo-no-background.svg"
                alt="ParkChain"
              />
            </NavLink>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden lg:block flex-1">
            <div className="flex items-center justify-center gap-1">

              {/* Main Links Group */}
              <div className="flex items-center gap-1 mr-2">
                <NavLink to="/" className={getLinkClasses} end title="Strona główna">
                  <FaHome />
                  <span>Główna</span>
                </NavLink>
                <NavLink to="/map" className={getLinkClasses} title="Mapa parkingów">
                  <FaMap />
                  <span>Mapa</span>
                </NavLink>
              </div>

              {/* Divider */}
              <div className="h-8 w-px bg-gray-700 mx-2"></div>

              {/* Featured Links Group */}
              <div className="flex items-center gap-1 mr-2">
                <NavLink
                  to="/live-feed"
                  className={getFeaturedLinkClasses({
                    active: 'bg-purple-600',
                    gradient: 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700'
                  })}
                  title="Live feed aktywności"
                >
                  <FaBolt />
                  <span>Live Feed</span>
                </NavLink>
                <NavLink
                  to="/marketplace"
                  className={getFeaturedLinkClasses({
                    active: 'bg-green-600',
                    gradient: 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700'
                  })}
                  title="Marketplace DCP tokenów"
                >
                  <FaGem />
                  <span>Marketplace</span>
                </NavLink>
                <NavLink
                  to="/badges"
                  className={getFeaturedLinkClasses({
                    active: 'bg-amber-600',
                    gradient: 'bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700'
                  })}
                  title="Twoje odznaki"
                >
                  <FaMedal />
                  <span>Badges</span>
                </NavLink>
              </div>

              {/* Divider */}
              <div className="h-8 w-px bg-gray-700 mx-2"></div>

              {/* Management Links Group */}
              <div className="flex items-center gap-1 mr-2">
                <NavLink to="/add-parking" className={getLinkClasses} title="Dodaj nowy parking">
                  <FaParking />
                  <span>Dodaj parking</span>
                </NavLink>

                {/* "Moje" Dropdown */}
                <div className="relative" ref={dropdownRef}>
                  <button
                    onClick={() => setIsMyMenuOpen(!isMyMenuOpen)}
                    className="text-gray-300 hover:text-indigo-400 hover:bg-gray-800/30 px-3 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 group"
                    title="Moje zasoby"
                  >
                    <FaUser />
                    <span>Moje</span>
                    <FaChevronDown className={`text-xs transition-transform ${isMyMenuOpen ? 'rotate-180' : ''}`} />
                  </button>

                  <AnimatePresence>
                    {isMyMenuOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.15 }}
                        className="absolute top-full mt-2 right-0 w-56 bg-gray-800 border border-gray-700 rounded-lg shadow-2xl overflow-hidden z-50"
                      >
                        <div className="py-2">
                          <NavLink
                            to="/my-reservations"
                            onClick={() => setIsMyMenuOpen(false)}
                            className={({ isActive }) =>
                              isActive
                                ? 'bg-indigo-600 text-white px-4 py-2.5 text-sm font-medium flex items-center gap-3 transition-colors'
                                : 'text-gray-300 hover:bg-gray-700 hover:text-indigo-400 px-4 py-2.5 text-sm font-medium flex items-center gap-3 transition-colors'
                            }
                          >
                            <FaCalendarAlt className="text-base" />
                            <span>Moje Rezerwacje</span>
                          </NavLink>
                          <NavLink
                            to="/my-parkings"
                            onClick={() => setIsMyMenuOpen(false)}
                            className={({ isActive }) =>
                              isActive
                                ? 'bg-indigo-600 text-white px-4 py-2.5 text-sm font-medium flex items-center gap-3 transition-colors'
                                : 'text-gray-300 hover:bg-gray-700 hover:text-indigo-400 px-4 py-2.5 text-sm font-medium flex items-center gap-3 transition-colors'
                            }
                          >
                            <FaParking className="text-base" />
                            <span>Moje Parkingi</span>
                          </NavLink>
                          <NavLink
                            to="/my-chargers"
                            onClick={() => setIsMyMenuOpen(false)}
                            className={({ isActive }) =>
                              isActive
                                ? 'bg-indigo-600 text-white px-4 py-2.5 text-sm font-medium flex items-center gap-3 transition-colors'
                                : 'text-gray-300 hover:bg-gray-700 hover:text-indigo-400 px-4 py-2.5 text-sm font-medium flex items-center gap-3 transition-colors'
                            }
                          >
                            <FaChargingStation className="text-base" />
                            <span>Moje ładowarki</span>
                          </NavLink>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <NavLink to="/analytics" className={getLinkClasses} title="Analytics i statystyki">
                  <FaChartLine />
                  <span>Analytics</span>
                </NavLink>
                <NavLink
                  to="/advanced-gateway"
                  className={getFeaturedLinkClasses({
                    active: 'bg-blue-600',
                    gradient: 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700'
                  })}
                  title="Advanced Gateway - Premium Features & Analytics"
                >
                  <FaRocket />
                  <span>Gateway Pro</span>
                </NavLink>
              </div>
            </div>
          </div>

          {/* User Section */}
          <div className="hidden lg:flex items-center gap-4 flex-shrink-0">
            {isAuthenticated && user ? (
              <>
                <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-800/50 rounded-lg border border-gray-700">
                  <FaUser className="text-indigo-400 text-sm" />
                  <span className="text-gray-300 text-sm font-medium">
                    {user.full_name || user.email}
                  </span>
                </div>
                <button
                  onClick={handleLogout}
                  className="bg-indigo-600 text-white hover:bg-indigo-700 px-4 py-2 rounded-lg text-sm font-medium transition-all hover:shadow-lg hover:scale-105"
                >
                  Wyloguj
                </button>
              </>
            ) : (
              <NavLink
                to="/login"
                className="bg-indigo-600 text-white hover:bg-indigo-700 px-4 py-2 rounded-lg text-sm font-medium transition-all hover:shadow-lg hover:scale-105"
              >
                Zaloguj
              </NavLink>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="flex lg:hidden">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="bg-gray-800 inline-flex items-center justify-center p-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-700 transition-all focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500"
            >
              <span className="sr-only">
                {isMobileMenuOpen ? 'Zamknij menu' : 'Otwórz menu'}
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
                  Główne
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
                  <span>Strona Główna</span>
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
                  <span>Mapa</span>
                </NavLink>
              </div>

              {/* Featured Section */}
              <div className="mb-3">
                <div className="text-xs font-bold text-gray-500 uppercase tracking-wider px-3 mb-2">
                  Wyróżnione
                </div>
                <NavLink
                  to="/live-feed"
                  onClick={closeMobileMenu}
                  className={({ isActive }) =>
                    isActive
                      ? 'bg-purple-600 text-white font-bold flex items-center gap-3 px-3 py-2.5 rounded-lg text-base shadow-lg'
                      : 'bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:from-purple-700 hover:to-blue-700 flex items-center gap-3 px-3 py-2.5 rounded-lg text-base font-bold transition-all'
                  }
                >
                  <FaBolt />
                  <span>Live Feed</span>
                </NavLink>
                <NavLink
                  to="/marketplace"
                  onClick={closeMobileMenu}
                  className={({ isActive }) =>
                    isActive
                      ? 'bg-green-600 text-white font-bold flex items-center gap-3 px-3 py-2.5 rounded-lg text-base shadow-lg mt-1'
                      : 'bg-gradient-to-r from-green-600 to-emerald-600 text-white hover:from-green-700 hover:to-emerald-700 flex items-center gap-3 px-3 py-2.5 rounded-lg text-base font-bold transition-all mt-1'
                  }
                >
                  <FaGem />
                  <span>Marketplace</span>
                </NavLink>
                <NavLink
                  to="/badges"
                  onClick={closeMobileMenu}
                  className={({ isActive }) =>
                    isActive
                      ? 'bg-amber-600 text-white font-bold flex items-center gap-3 px-3 py-2.5 rounded-lg text-base shadow-lg mt-1'
                      : 'bg-gradient-to-r from-amber-600 to-orange-600 text-white hover:from-amber-700 hover:to-orange-700 flex items-center gap-3 px-3 py-2.5 rounded-lg text-base font-bold transition-all mt-1'
                  }
                >
                  <FaMedal />
                  <span>Badges</span>
                </NavLink>
              </div>

              {/* Management Section */}
              <div className="mb-3">
                <div className="text-xs font-bold text-gray-500 uppercase tracking-wider px-3 mb-2">
                  Zarządzanie
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
                  <span>Dodaj parking</span>
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
                  <span>Moje Rezerwacje</span>
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
                  <span>Moje Parkingi</span>
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
                  <span>Moje ładowarki</span>
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
                  <span>Analytics</span>
                </NavLink>
                <NavLink
                  to="/advanced-gateway"
                  onClick={closeMobileMenu}
                  className={({ isActive }) =>
                    isActive
                      ? 'bg-blue-600 text-white font-bold flex items-center gap-3 px-3 py-2.5 rounded-lg text-base shadow-lg mt-1'
                      : 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700 flex items-center gap-3 px-3 py-2.5 rounded-lg text-base font-bold transition-all mt-1'
                  }
                >
                  <FaRocket />
                  <span>Gateway Dashboard</span>
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
                    Wyloguj
                  </button>
                </div>
              ) : (
                <NavLink
                  to="/login"
                  onClick={closeMobileMenu}
                  className="block w-full bg-indigo-600 text-white hover:bg-indigo-700 px-4 py-2.5 rounded-lg text-sm font-medium text-center transition-colors"
                >
                  Zaloguj
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
