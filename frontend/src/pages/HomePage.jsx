// frontend/src/pages/HomePage.jsx

import { Link } from 'react-router-dom';
import { motion } from "framer-motion";

function HomePage() {
  return (
    // Cały layout i design pochodzi z obu wersji,
    // ponieważ były identyczne.
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16">
        <motion.div 
          className="text-center"
          initial={{ opacity: 0, y: -20 }} // Zacznij przezroczysty i 20px wyżej
          animate={{ opacity: 1, y: 0 }}    // Animuj do pełnej widoczności
          transition={{ duration: 0.8 }}   // Czas trwania animacji
        >
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
        </motion.div>
      </div>

      {/* Features */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid md:grid-cols-3 gap-8">
          <motion.div 
            className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow"
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <div className="text-4xl mb-4">🗺️</div>
            <h3 className="text-xl font-bold mb-2">Interaktywna mapa</h3>
            <p className="text-gray-600">
              Zobacz wszystkie dostępne miejsca parkingowe w Twojej okolicy
            </p>
          </motion.div>
          <motion.div 
            className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow"
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <div className="text-4xl mb-4">🔒</div>
            <h3 className="text-xl font-bold mb-2">Bezpieczne płatności</h3>
            <p className="text-gray-600">
              Blockchain zapewnia transparentność i bezpieczeństwo transakcji
            </p>
          </motion.div>
          <motion.div 
            className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow"
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <div className="text-4xl mb-4">⚡</div>
            <h3 className="text-xl font-bold mb-2">Szybka rezerwacja</h3>
            <p className="text-gray-600">
              Zarezerwuj miejsce w kilka sekund i zaoszczędź czas
            </p>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

export default HomePage;