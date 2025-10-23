// frontend/src/pages/HomePage.jsx

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from "framer-motion";
import { FaMapMarkedAlt, FaLock, FaBolt, FaParking, FaChevronDown } from "react-icons/fa";

function HomePage() {
  const navigate = useNavigate();
  const [isTransitioning, setIsTransitioning] = useState(false);

  const handleGoToMap = () => {
    setIsTransitioning(true);
    // Po animacji przejdź do mapy
    setTimeout(() => {
      navigate('/map');
    }, 800);
  };

  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Animowane tło z efektem */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute inset-0 bg-[url('/tło.png')] bg-cover bg-center bg-fixed"></div>
      </div>

      {/* Animowane kółka w tle */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          className="absolute top-20 left-20 w-72 h-72 bg-parkchain-500/20 rounded-full blur-3xl"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        <motion.div
          className="absolute bottom-20 right-20 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl"
          animate={{
            scale: [1.2, 1, 1.2],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
      </div>

      {/* Overlay podczas przejścia */}
      <AnimatePresence>
        {isTransitioning && (
          <motion.div
            className="fixed inset-0 bg-parkchain-500 z-50 flex items-center justify-center"
            initial={{ clipPath: 'circle(0% at 50% 50%)' }}
            animate={{ clipPath: 'circle(150% at 50% 50%)' }}
            transition={{ duration: 0.8, ease: [0.76, 0, 0.24, 1] }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2, duration: 0.4 }}
              className="text-white text-4xl font-bold"
            >
              <FaMapMarkedAlt className="text-6xl mx-auto mb-4 animate-pulse" />
              Ładowanie mapy...
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hero Section - Pełny ekran */}
      <div className="min-h-screen flex items-center justify-center relative z-10 px-4">
        <div className="max-w-4xl mx-auto text-center">
          {/* Logo/Ikona */}
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{
              type: "spring",
              stiffness: 260,
              damping: 20,
              delay: 0.1
            }}
            className="mb-8 inline-block"
          >
            <div className="w-24 h-24 mx-auto bg-gradient-to-br from-parkchain-400 to-parkchain-600 rounded-3xl flex items-center justify-center shadow-2xl transform rotate-3 hover:rotate-6 transition-transform duration-300">
              <FaParking className="text-5xl text-white" />
            </div>
          </motion.div>

          {/* Główny tytuł */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.8 }}
            className="text-6xl md:text-7xl lg:text-8xl font-black text-white mb-6 leading-tight"
          >
            Parkowanie.
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-parkchain-400 via-purple-400 to-pink-400">
              Uproszczone.
            </span>
          </motion.h1>

          {/* Podtytuł */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.8 }}
            className="text-xl md:text-2xl text-gray-300 mb-12 max-w-2xl mx-auto leading-relaxed"
          >
            Znajdź i zarezerwuj miejsce parkingowe w sekundach.
            Bezpiecznie. Szybko. Bez stresu.
          </motion.p>

          {/* Główny CTA Button */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7, duration: 0.8 }}
            className="mb-8"
          >
            <button
              onClick={handleGoToMap}
              className="group relative inline-flex items-center justify-center gap-3 px-12 py-6 text-2xl font-bold text-white bg-gradient-to-r from-parkchain-500 to-parkchain-600 rounded-2xl shadow-2xl hover:shadow-parkchain-500/50 transition-all duration-300 hover:scale-105 active:scale-95 overflow-hidden"
            >
              <span className="relative z-10 flex items-center gap-3">
                <FaMapMarkedAlt className="text-3xl" />
                Zobacz mapę parkingów
              </span>

              {/* Animowany gradient w tle */}
              <div className="absolute inset-0 bg-gradient-to-r from-parkchain-600 to-purple-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </button>
          </motion.div>

          {/* Dodatkowe info */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.9, duration: 0.8 }}
            className="flex flex-wrap items-center justify-center gap-8 text-gray-400"
          >
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-sm">Dostępne teraz</span>
            </div>
            <div className="flex items-center gap-2">
              <FaLock className="text-parkchain-400" />
              <span className="text-sm">100% bezpieczne</span>
            </div>
            <div className="flex items-center gap-2">
              <FaBolt className="text-yellow-400" />
              <span className="text-sm">Rezerwacja w 30 sek</span>
            </div>
          </motion.div>

          {/* Scroll indicator */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2, duration: 0.8 }}
            className="absolute bottom-10 left-1/2 transform -translate-x-1/2"
          >
            <motion.div
              animate={{ y: [0, 10, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="text-gray-400 flex flex-col items-center gap-2 cursor-pointer hover:text-white transition-colors"
              onClick={() => {
                window.scrollTo({ top: window.innerHeight, behavior: 'smooth' });
              }}
            >
              <span className="text-sm">Dowiedz się więcej</span>
              <FaChevronDown className="text-2xl" />
            </motion.div>
          </motion.div>
        </div>
      </div>

      {/* Features Section - Druga strona po scrollu */}
      <div className="min-h-screen flex items-center justify-center relative z-10 px-4 py-20">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <h2 className="text-5xl md:text-6xl font-bold text-white mb-6">
              Jak to działa?
            </h2>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto">
              Parkowanie nigdy nie było tak proste. Trzy kroki i gotowe.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8 mb-16">
            {/* Feature 1 */}
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="relative group"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-parkchain-500/20 to-purple-500/20 rounded-3xl blur-xl group-hover:blur-2xl transition-all duration-300"></div>
              <div className="relative bg-white/5 backdrop-blur-xl p-8 rounded-3xl border border-white/10 hover:border-parkchain-400/50 transition-all duration-300 hover:transform hover:scale-105">
                <div className="w-16 h-16 bg-gradient-to-br from-parkchain-400 to-parkchain-600 rounded-2xl flex items-center justify-center mb-6 transform group-hover:rotate-6 transition-transform duration-300">
                  <FaMapMarkedAlt className="text-3xl text-white" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-4">
                  Znajdź miejsce
                </h3>
                <p className="text-gray-300 leading-relaxed">
                  Przeglądaj interaktywną mapę i wybierz najlepsze miejsce parkingowe w swojej okolicy z real-time dostępnością.
                </p>
              </div>
            </motion.div>

            {/* Feature 2 */}
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="relative group"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-3xl blur-xl group-hover:blur-2xl transition-all duration-300"></div>
              <div className="relative bg-white/5 backdrop-blur-xl p-8 rounded-3xl border border-white/10 hover:border-purple-400/50 transition-all duration-300 hover:transform hover:scale-105">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-400 to-purple-600 rounded-2xl flex items-center justify-center mb-6 transform group-hover:rotate-6 transition-transform duration-300">
                  <FaBolt className="text-3xl text-white" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-4">
                  Zarezerwuj szybko
                </h3>
                <p className="text-gray-300 leading-relaxed">
                  Wybierz czas parkowania i potwierdź rezerwację w kilka sekund. Prosty formularz, zero komplikacji.
                </p>
              </div>
            </motion.div>

            {/* Feature 3 */}
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="relative group"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-pink-500/20 to-parkchain-500/20 rounded-3xl blur-xl group-hover:blur-2xl transition-all duration-300"></div>
              <div className="relative bg-white/5 backdrop-blur-xl p-8 rounded-3xl border border-white/10 hover:border-pink-400/50 transition-all duration-300 hover:transform hover:scale-105">
                <div className="w-16 h-16 bg-gradient-to-br from-pink-400 to-pink-600 rounded-2xl flex items-center justify-center mb-6 transform group-hover:rotate-6 transition-transform duration-300">
                  <FaLock className="text-3xl text-white" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-4">
                  Zaparkuj bezpiecznie
                </h3>
                <p className="text-gray-300 leading-relaxed">
                  Blockchain zapewnia pełną transparentność i bezpieczeństwo. Twoje płatności są chronione w 100%.
                </p>
              </div>
            </motion.div>
          </div>

          {/* CTA na końcu */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="text-center"
          >
            <button
              onClick={handleGoToMap}
              className="inline-flex items-center gap-3 px-10 py-5 text-xl font-bold text-white bg-gradient-to-r from-parkchain-500 to-purple-600 rounded-2xl shadow-2xl hover:shadow-parkchain-500/50 transition-all duration-300 hover:scale-105 active:scale-95"
            >
              <FaMapMarkedAlt className="text-2xl" />
              Rozpocznij teraz
            </button>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

export default HomePage;
