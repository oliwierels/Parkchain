// frontend/src/pages/HomePage.jsx

import { Link } from 'react-router-dom';
import { motion } from "framer-motion";
import { FaMapMarkedAlt, FaLock, FaBolt } from "react-icons/fa";
function HomePage() {
  return (
    // Cały layout i design pochodzi z obu wersji,
    // ponieważ były identyczne.
    <div 
      className="min-h-screen relative" // Dodajemy 'relative' dla pozycjonowania tła
      style={{
        backgroundImage: 'url(/tło.png)', // Ścieżka do Twojego obrazu
        backgroundSize: 'cover',           // Obraz pokryje cały obszar
        backgroundPosition: 'center',      // Obraz będzie wyśrodkowany
        backgroundAttachment: 'fixed',     // Obraz będzie nieruchomy przy przewijaniu
        zIndex: 0                          // Upewniamy się, że tło jest na spodzie
      }}
    >
      {/* Overlay - dodaje półprzezroczystą warstwę na tle */}
      <div 
        className="absolute inset-0" 
        style={{ 
          backgroundColor: 'rgba(0,0,0,0.5)', // Czarny kolor z 50% przezroczystością
          zIndex: 1 // Wyżej niż tło, ale niżej niż zawartość
        }}
      ></div>
      <div className="max-w-7xl px-8 sm:px-10 lg:px-40 pt-20 pb-16 relative z-10">
        <motion.div 
          className="text-left"S
          initial={{ opacity: 0, y: -20 }} // Zacznij przezroczysty i 20px wyżej
          animate={{ opacity: 1, y: 0 }}    // Animuj do pełnej widoczności
          transition={{ duration: 0.8 }}   // Czas trwania animSacji
        >
          <h1 className="text-5xl font-bold text-white mb-6">
            Znajdź parking <span className="text-parkchain-500">łatwiej!</span>
          </h1>
          <p className="text-xl text-white mb-20 mt-10 max-w-2xl">
            Rezerwuj miejsca parkingowe z wyprzedzeniem i oszczędzaj czas.
            <br />
            Blockchain gwarantuje bezpieczeństwo transakcji.
          </p>
          <div className="flex justify-start gap-4">
            <Link
              to="/map"
              className="bg-parkchain-500 hover:bg-parkchain-600 text-white px-8 py-3 rounded-lg font-semibold text-lg transition-colors shadow-lg hover:shadow-xl"
            >
              Zobacz mapę
            </Link>
            <button className="bg-transparent hover:bg-white/10 text-white px-8 py-3 rounded-lg font-semibold text-lg transition-colors border-2 border-white">
              Dowiedz się więcej
            </button>
          </div>
        </motion.div>
      </div>

      {/* Features */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 relative z-10">
        <div className="grid md:grid-cols-3 gap-8">
          <motion.div 
            className="bg-white/10 backdrop-blur-md p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow border border-white/20"
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <div className="text-4xl mb-4 text-parkchain-500"><FaMapMarkedAlt /></div>
            <h3 className="text-xl font-bold mb-2">Interaktywna mapa</h3>
            <p className="text-gray-600">
              Zobacz wszystkie dostępne miejsca parkingowe w Twojej okolicy
            </p>
          </motion.div>
          <motion.div 
            className="bg-white/10 backdrop-blur-md p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow border border-white/20"
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <div className="text-4xl mb-4 text-parkchain-500"><FaLock /></div>
            <h3 className="text-xl font-bold mb-2">Bezpieczne płatności</h3>
            <p className="text-gray-600">
              Blockchain zapewnia transparentność i bezpieczeństwo transakcji
            </p>
          </motion.div>
          <motion.div 
            className="bg-white/10 backdrop-blur-md p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow border border-white/20"
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <div className="text-4xl mb-4 text-parkchain-500"><FaBolt /></div>
            <h3 className="text-xl font-bold mb-2">Szybka rezerwacja</h3>
            <p className="text-white">
              Zarezerwuj miejsce w kilka sekund i zaoszczędź czas
            </p>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

export default HomePage;