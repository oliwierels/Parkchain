import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function Navbar() {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
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
            <button className="bg-gray-800 inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-white hover:bg-gray-700">
              <span className="sr-only">Otwórz menu</span>
              <svg className="block h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;