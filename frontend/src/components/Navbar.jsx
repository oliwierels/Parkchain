import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

function Navbar() {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
    setIsMobileMenuOpen(false);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  const getLinkClasses = ({ isActive }) => {
    return isActive
      ? 'text-indigo-400 font-medium px-3 py-2 rounded-md text-sm'
      : 'text-gray-300 hover:text-indigo-400 px-3 py-2 rounded-md text-sm font-medium transition-colors';
  };

  return (
    <nav className="bg-gray-900 border-b border-gray-700 shadow-sm">
      {/* Layout na całą szerokość (bez "max-w-7xl mx-auto") */}
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          <div className="flex items-center">
            
            <NavLink to="/" className="flex-shrink-0 flex items-center gap-2">
              {/* Ta ścieżka jest POPRAWNA, bo plik jest w /public */}
              <img 
                className="h-8 w-auto" 
                src="/logo-no-background.svg" 
                alt="ParkChain" 
              />
            </NavLink>

            {/* Linki */}
            <div className="hidden md:block">
              <div className="ml-10 flex items-baseline space-x-4">
                <NavLink to="/" className={getLinkClasses} end>
                  Strona Główna
                </NavLink>
                <NavLink to="/map" className={getLinkClasses}>
                  Mapa
                </NavLink>

                {/* DeCharge Hackathon - Featured Links */}
                <NavLink
                  to="/live-feed"
                  className={({ isActive }) =>
                    isActive
                      ? 'bg-purple-600 text-white font-bold px-3 py-2 rounded-md text-sm'
                      : 'bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:from-purple-700 hover:to-blue-700 px-3 py-2 rounded-md text-sm font-bold transition-all'
                  }
                >
                  ⚡ Live Feed
                </NavLink>
                <NavLink
                  to="/marketplace"
                  className={({ isActive }) =>
                    isActive
                      ? 'bg-green-600 text-white font-bold px-3 py-2 rounded-md text-sm'
                      : 'bg-gradient-to-r from-green-600 to-emerald-600 text-white hover:from-green-700 hover:to-emerald-700 px-3 py-2 rounded-md text-sm font-bold transition-all'
                  }
                >
                  💎 Marketplace
                </NavLink>
                <NavLink
                  to="/badges"
                  className={({ isActive }) =>
                    isActive
                      ? 'bg-amber-600 text-white font-bold px-3 py-2 rounded-md text-sm'
                      : 'bg-gradient-to-r from-amber-600 to-orange-600 text-white hover:from-amber-700 hover:to-orange-700 px-3 py-2 rounded-md text-sm font-bold transition-all'
                  }
                >
                  🏅 Badges
                </NavLink>

                <NavLink to="/add-parking" className={getLinkClasses}>
                  Dodaj parking
                </NavLink>
                <NavLink to="/my-reservations" className={getLinkClasses}>
                  Moje Rezerwacje
                </NavLink>
                <NavLink to="/my-parkings" className={getLinkClasses}>
                  Moje Parkingi
                </NavLink>
                <NavLink to="/my-chargers" className={getLinkClasses}>
                  Moje ładowarki
                </NavLink>
                <NavLink to="/analytics" className={getLinkClasses}>
                  Analytics
                </NavLink>
              </div>
            </div>
          </div>

          {/* Sekcja Użytkownika */}
          <div className="hidden md:block">
            <div className="ml-4 flex items-center md:ml-6">
              {isAuthenticated && user ? (
                <>
                  <span className="text-gray-300 text-sm font-medium mr-4">
                    {user.full_name || user.email} 
                  </span>
                  <button
                    onClick={handleLogout}
                    className="bg-indigo-600 text-white hover:bg-indigo-700 px-4 py-2 rounded-md text-sm font-medium transition-colors"
                  >
                    Wyloguj
                  </button>
                </>
              ) : (
                <NavLink
                  to="/login"
                  className="bg-indigo-600 text-white hover:bg-indigo-700 px-4 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  Zaloguj
                </NavLink>
              )}
            </div>
          </div>

          {/* Menu mobilne (hamburger) */}
          <div className="-mr-2 flex md:hidden">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="bg-gray-800 inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-white hover:bg-gray-700 transition-colors focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500"
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
            className="md:hidden border-t border-gray-700 overflow-hidden"
          >
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
              <NavLink
                to="/"
                onClick={closeMobileMenu}
                className={({ isActive }) =>
                  isActive
                    ? 'bg-gray-800 text-indigo-400 block px-3 py-2 rounded-md text-base font-medium'
                    : 'text-gray-300 hover:bg-gray-800 hover:text-indigo-400 block px-3 py-2 rounded-md text-base font-medium transition-colors'
                }
                end
              >
                Strona Główna
              </NavLink>
              <NavLink
                to="/map"
                onClick={closeMobileMenu}
                className={({ isActive }) =>
                  isActive
                    ? 'bg-gray-800 text-indigo-400 block px-3 py-2 rounded-md text-base font-medium'
                    : 'text-gray-300 hover:bg-gray-800 hover:text-indigo-400 block px-3 py-2 rounded-md text-base font-medium transition-colors'
                }
              >
                Mapa
              </NavLink>

              {/* Featured Links */}
              <NavLink
                to="/live-feed"
                onClick={closeMobileMenu}
                className={({ isActive }) =>
                  isActive
                    ? 'bg-purple-600 text-white font-bold block px-3 py-2 rounded-md text-base'
                    : 'bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:from-purple-700 hover:to-blue-700 block px-3 py-2 rounded-md text-base font-bold transition-all'
                }
              >
                ⚡ Live Feed
              </NavLink>
              <NavLink
                to="/marketplace"
                onClick={closeMobileMenu}
                className={({ isActive }) =>
                  isActive
                    ? 'bg-green-600 text-white font-bold block px-3 py-2 rounded-md text-base'
                    : 'bg-gradient-to-r from-green-600 to-emerald-600 text-white hover:from-green-700 hover:to-emerald-700 block px-3 py-2 rounded-md text-base font-bold transition-all'
                }
              >
                💎 Marketplace
              </NavLink>
              <NavLink
                to="/badges"
                onClick={closeMobileMenu}
                className={({ isActive }) =>
                  isActive
                    ? 'bg-amber-600 text-white font-bold block px-3 py-2 rounded-md text-base'
                    : 'bg-gradient-to-r from-amber-600 to-orange-600 text-white hover:from-amber-700 hover:to-orange-700 block px-3 py-2 rounded-md text-base font-bold transition-all'
                }
              >
                🏅 Badges
              </NavLink>

              <NavLink
                to="/add-parking"
                onClick={closeMobileMenu}
                className={({ isActive }) =>
                  isActive
                    ? 'bg-gray-800 text-indigo-400 block px-3 py-2 rounded-md text-base font-medium'
                    : 'text-gray-300 hover:bg-gray-800 hover:text-indigo-400 block px-3 py-2 rounded-md text-base font-medium transition-colors'
                }
              >
                Dodaj parking
              </NavLink>
              <NavLink
                to="/my-reservations"
                onClick={closeMobileMenu}
                className={({ isActive }) =>
                  isActive
                    ? 'bg-gray-800 text-indigo-400 block px-3 py-2 rounded-md text-base font-medium'
                    : 'text-gray-300 hover:bg-gray-800 hover:text-indigo-400 block px-3 py-2 rounded-md text-base font-medium transition-colors'
                }
              >
                Moje Rezerwacje
              </NavLink>
              <NavLink
                to="/my-parkings"
                onClick={closeMobileMenu}
                className={({ isActive }) =>
                  isActive
                    ? 'bg-gray-800 text-indigo-400 block px-3 py-2 rounded-md text-base font-medium'
                    : 'text-gray-300 hover:bg-gray-800 hover:text-indigo-400 block px-3 py-2 rounded-md text-base font-medium transition-colors'
                }
              >
                Moje Parkingi
              </NavLink>
              <NavLink
                to="/my-chargers"
                onClick={closeMobileMenu}
                className={({ isActive }) =>
                  isActive
                    ? 'bg-gray-800 text-indigo-400 block px-3 py-2 rounded-md text-base font-medium'
                    : 'text-gray-300 hover:bg-gray-800 hover:text-indigo-400 block px-3 py-2 rounded-md text-base font-medium transition-colors'
                }
              >
                Moje ładowarki
              </NavLink>
              <NavLink
                to="/analytics"
                onClick={closeMobileMenu}
                className={({ isActive }) =>
                  isActive
                    ? 'bg-gray-800 text-indigo-400 block px-3 py-2 rounded-md text-base font-medium'
                    : 'text-gray-300 hover:bg-gray-800 hover:text-indigo-400 block px-3 py-2 rounded-md text-base font-medium transition-colors'
                }
              >
                Analytics
              </NavLink>
            </div>

            {/* Mobile User Section */}
            <div className="pt-4 pb-3 border-t border-gray-700">
              {isAuthenticated && user ? (
                <div className="px-5">
                  <div className="text-base font-medium text-white mb-3">
                    {user.full_name || user.email}
                  </div>
                  <button
                    onClick={handleLogout}
                    className="w-full bg-indigo-600 text-white hover:bg-indigo-700 px-4 py-2 rounded-md text-sm font-medium transition-colors"
                  >
                    Wyloguj
                  </button>
                </div>
              ) : (
                <div className="px-5">
                  <NavLink
                    to="/login"
                    onClick={closeMobileMenu}
                    className="block w-full bg-indigo-600 text-white hover:bg-indigo-700 px-4 py-2 rounded-md text-sm font-medium text-center transition-colors"
                  >
                    Zaloguj
                  </NavLink>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}

export default Navbar;