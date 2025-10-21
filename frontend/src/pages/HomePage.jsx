// frontend/src/pages/HomePage.jsx

import { Link } from 'react-router-dom';

function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16">
        <div className="text-center">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            Znajdź parking <span className="text-parkchain-500">łatwiej</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Rezerwuj miejsca parkingowe z wyprzedzeniem i oszczędzaj czas. 
            Blockchain gwarantuje bezpieczeństwo transakcji.
          </p>
          <div className="flex justify-center gap-4">
            <Link 
              to="/map"
              className="bg-parkchain-500 hover:bg-parkchain-600 text-white px-8 py-3 rounded-lg font-semibold text-lg transition-colors shadow-lg hover:shadow-xl"
            >
              Zobacz mapę
            </Link>
            <button className="bg-white hover:bg-gray-50 text-gray-900 px-8 py-3 rounded-lg font-semibold text-lg transition-colors border-2 border-gray-200">
              Dowiedz się więcej
            </button>
          </div>
        </div>
      </div>

      {/* Features */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid md:grid-cols-3 gap-8">
          <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow">
            <div className="text-4xl mb-4">🗺️</div>
            <h3 className="text-xl font-bold mb-2">Interaktywna mapa</h3>
            <p className="text-gray-600">
              Zobacz wszystkie dostępne miejsca parkingowe w Twojej okolicy
            </p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow">
            <div className="text-4xl mb-4">🔒</div>
            <h3 className="text-xl font-bold mb-2">Bezpieczne płatności</h3>
            <p className="text-gray-600">
              Blockchain zapewnia transparentność i bezpieczeństwo transakcji
            </p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow">
            <div className="text-4xl mb-4">⚡</div>
            <h3 className="text-xl font-bold mb-2">Szybka rezerwacja</h3>
            <p className="text-gray-600">
              Zarezerwuj miejsce w kilka sekund i zaoszczędź czas
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default HomePage;