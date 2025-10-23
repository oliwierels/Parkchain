// frontend/src/pages/HomePage.jsx

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from "framer-motion";
import { FaMapMarkedAlt, FaLock, FaBolt, FaParking, FaChevronDown } from "react-icons/fa";

function HomePage() {
  const navigate = useNavigate();
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [autoRedirectCountdown, setAutoRedirectCountdown] = useState(5);
  const [autoRedirectCancelled, setAutoRedirectCancelled] = useState(false);

  // Auto-redirect timer
  useEffect(() => {
    if (autoRedirectCancelled) return;

    const interval = setInterval(() => {
      setAutoRedirectCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          handleGoToMap();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [autoRedirectCancelled]);

  // Cancel auto-redirect on scroll
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 50 && !autoRedirectCancelled) {
        setAutoRedirectCancelled(true);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [autoRedirectCancelled]);

  const handleGoToMap = () => {
    if (isTransitioning) return;
    setAutoRedirectCancelled(true);
    setIsTransitioning(true);
    setTimeout(() => {
      navigate('/map');
    }, 600);
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
            className="fixed inset-0 bg-gradient-to-br from-parkchain-500 via-parkchain-600 to-purple-600 z-50 flex items-center justify-center"
            initial={{ clipPath: 'circle(0% at 50% 50%)' }}
            animate={{ clipPath: 'circle(150% at 50% 50%)' }}
            transition={{ duration: 0.6, ease: [0.87, 0, 0.13, 1] }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.5, rotate: -10 }}
              animate={{ opacity: 1, scale: 1, rotate: 0 }}
              transition={{ delay: 0.1, duration: 0.3, ease: "easeOut" }}
              className="text-white text-4xl font-bold flex flex-col items-center"
            >
              <motion.div
                animate={{
                  scale: [1, 1.1, 1],
                  rotate: [0, 5, -5, 0]
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              >
                <FaMapMarkedAlt className="text-7xl mb-4" />
              </motion.div>
              <motion.span
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                Ładowanie mapy...
              </motion.span>
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
              stiffness: 300,
              damping: 25,
              delay: 0
            }}
            className="mb-8 inline-block"
          >
            <motion.div
              className="w-24 h-24 mx-auto bg-gradient-to-br from-parkchain-400 to-parkchain-600 rounded-3xl flex items-center justify-center shadow-2xl cursor-pointer"
              whileHover={{
                scale: 1.1,
                rotate: 12,
                boxShadow: "0 25px 50px -12px rgba(99, 102, 241, 0.5)"
              }}
              transition={{ type: "spring", stiffness: 400, damping: 15 }}
            >
              <FaParking className="text-5xl text-white" />
            </motion.div>
          </motion.div>

          {/* Główny tytuł */}
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.6, ease: [0.6, 0.01, 0.05, 0.95] }}
            className="text-6xl md:text-7xl lg:text-8xl font-black text-white mb-6 leading-tight"
          >
            Parkowanie.
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-parkchain-400 via-purple-400 to-pink-400 animate-gradient">
              Uproszczone.
            </span>
          </motion.h1>

          {/* Podtytuł */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25, duration: 0.6, ease: [0.6, 0.01, 0.05, 0.95] }}
            className="text-xl md:text-2xl text-gray-300 mb-12 max-w-2xl mx-auto leading-relaxed"
          >
            Znajdź i zarezerwuj miejsce parkingowe w sekundach.
            Bezpiecznie. Szybko. Bez stresu.
          </motion.p>

          {/* Główny CTA Button */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.6, ease: [0.6, 0.01, 0.05, 0.95] }}
            className="mb-4"
          >
            <motion.button
              onClick={handleGoToMap}
              disabled={isTransitioning}
              className="group relative inline-flex items-center justify-center gap-3 px-12 py-6 text-2xl font-bold text-white bg-gradient-to-r from-parkchain-500 to-parkchain-600 rounded-2xl shadow-2xl overflow-hidden disabled:opacity-50 disabled:cursor-not-allowed"
              whileHover={{
                scale: 1.05,
                boxShadow: "0 25px 50px -12px rgba(99, 102, 241, 0.6)"
              }}
              whileTap={{ scale: 0.98 }}
              transition={{ type: "spring", stiffness: 400, damping: 25 }}
            >
              <span className="relative z-10 flex items-center gap-3">
                <div className="relative">
                  <motion.div
                    animate={isTransitioning ? { rotate: 360 } : {}}
                    transition={{ duration: 0.6, ease: "easeInOut" }}
                  >
                    <FaMapMarkedAlt className="text-3xl" />
                  </motion.div>

                  {/* Circular countdown progress */}
                  {!autoRedirectCancelled && autoRedirectCountdown > 0 && (
                    <svg className="absolute -inset-2 w-14 h-14" style={{ transform: 'rotate(-90deg)' }}>
                      <circle
                        cx="28"
                        cy="28"
                        r="24"
                        stroke="rgba(255, 255, 255, 0.2)"
                        strokeWidth="3"
                        fill="none"
                      />
                      <motion.circle
                        cx="28"
                        cy="28"
                        r="24"
                        stroke="white"
                        strokeWidth="3"
                        fill="none"
                        strokeLinecap="round"
                        initial={{ pathLength: 1 }}
                        animate={{ pathLength: autoRedirectCountdown / 5 }}
                        transition={{ duration: 0.3, ease: "linear" }}
                        style={{
                          strokeDasharray: "150.8",
                          filter: "drop-shadow(0 0 4px rgba(255, 255, 255, 0.8))"
                        }}
                      />
                    </svg>
                  )}
                </div>
                Zobacz mapę parkingów
              </span>

              {/* Animowany gradient w tle */}
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-parkchain-600 to-purple-600"
                initial={{ opacity: 0 }}
                whileHover={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
              />
            </motion.button>
          </motion.div>

          {/* Auto-redirect info */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.55, duration: 0.6 }}
            className="mb-8"
          >
            <AnimatePresence mode="wait">
              {!autoRedirectCancelled && autoRedirectCountdown > 0 ? (
                <motion.p
                  key="countdown"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="text-gray-400 text-sm"
                >
                  Automatyczne przejście za{' '}
                  <motion.span
                    key={autoRedirectCountdown}
                    initial={{ scale: 1.3, color: '#ffffff' }}
                    animate={{ scale: 1, color: '#9ca3af' }}
                    transition={{ duration: 0.3 }}
                    className="font-bold"
                  >
                    {autoRedirectCountdown}s
                  </motion.span>
                  {' '}• Scrolluj aby anulować
                </motion.p>
              ) : autoRedirectCancelled ? (
                <motion.p
                  key="cancelled"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="text-green-400 text-sm"
                >
                  ✓ Automatyczne przekierowanie anulowane
                </motion.p>
              ) : null}
            </AnimatePresence>
          </motion.div>

          {/* Dodatkowe info */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.55, duration: 0.6 }}
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
            transition={{ delay: 0.7, duration: 0.6 }}
            className="absolute bottom-10 left-1/2 transform -translate-x-1/2"
          >
            <motion.div
              animate={{ y: [0, 12, 0] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              className="text-gray-400 flex flex-col items-center gap-2 cursor-pointer"
              whileHover={{ scale: 1.1, color: "#ffffff" }}
              onClick={() => {
                window.scrollTo({ top: window.innerHeight, behavior: 'smooth' });
              }}
            >
              <span className="text-sm font-medium">Dowiedz się więcej</span>
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
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5, delay: 0.1, ease: [0.6, 0.01, 0.05, 0.95] }}
              className="relative group"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-parkchain-500/20 to-purple-500/20 rounded-3xl blur-xl group-hover:blur-2xl transition-all duration-500"></div>
              <motion.div
                className="relative bg-white/5 backdrop-blur-xl p-8 rounded-3xl border border-white/10 hover:border-parkchain-400/50 transition-all duration-300 cursor-pointer"
                whileHover={{ scale: 1.05, y: -5 }}
                transition={{ type: "spring", stiffness: 400, damping: 25 }}
              >
                <motion.div
                  className="w-16 h-16 bg-gradient-to-br from-parkchain-400 to-parkchain-600 rounded-2xl flex items-center justify-center mb-6"
                  whileHover={{ rotate: 12, scale: 1.1 }}
                  transition={{ type: "spring", stiffness: 400, damping: 15 }}
                >
                  <FaMapMarkedAlt className="text-3xl text-white" />
                </motion.div>
                <h3 className="text-2xl font-bold text-white mb-4">
                  Znajdź miejsce
                </h3>
                <p className="text-gray-300 leading-relaxed">
                  Przeglądaj interaktywną mapę i wybierz najlepsze miejsce parkingowe w swojej okolicy z real-time dostępnością.
                </p>
              </motion.div>
            </motion.div>

            {/* Feature 2 */}
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5, delay: 0.2, ease: [0.6, 0.01, 0.05, 0.95] }}
              className="relative group"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-3xl blur-xl group-hover:blur-2xl transition-all duration-500"></div>
              <motion.div
                className="relative bg-white/5 backdrop-blur-xl p-8 rounded-3xl border border-white/10 hover:border-purple-400/50 transition-all duration-300 cursor-pointer"
                whileHover={{ scale: 1.05, y: -5 }}
                transition={{ type: "spring", stiffness: 400, damping: 25 }}
              >
                <motion.div
                  className="w-16 h-16 bg-gradient-to-br from-purple-400 to-purple-600 rounded-2xl flex items-center justify-center mb-6"
                  whileHover={{ rotate: 12, scale: 1.1 }}
                  transition={{ type: "spring", stiffness: 400, damping: 15 }}
                >
                  <FaBolt className="text-3xl text-white" />
                </motion.div>
                <h3 className="text-2xl font-bold text-white mb-4">
                  Zarezerwuj szybko
                </h3>
                <p className="text-gray-300 leading-relaxed">
                  Wybierz czas parkowania i potwierdź rezerwację w kilka sekund. Prosty formularz, zero komplikacji.
                </p>
              </motion.div>
            </motion.div>

            {/* Feature 3 */}
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5, delay: 0.3, ease: [0.6, 0.01, 0.05, 0.95] }}
              className="relative group"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-pink-500/20 to-parkchain-500/20 rounded-3xl blur-xl group-hover:blur-2xl transition-all duration-500"></div>
              <motion.div
                className="relative bg-white/5 backdrop-blur-xl p-8 rounded-3xl border border-white/10 hover:border-pink-400/50 transition-all duration-300 cursor-pointer"
                whileHover={{ scale: 1.05, y: -5 }}
                transition={{ type: "spring", stiffness: 400, damping: 25 }}
              >
                <motion.div
                  className="w-16 h-16 bg-gradient-to-br from-pink-400 to-pink-600 rounded-2xl flex items-center justify-center mb-6"
                  whileHover={{ rotate: 12, scale: 1.1 }}
                  transition={{ type: "spring", stiffness: 400, damping: 15 }}
                >
                  <FaLock className="text-3xl text-white" />
                </motion.div>
                <h3 className="text-2xl font-bold text-white mb-4">
                  Zaparkuj bezpiecznie
                </h3>
                <p className="text-gray-300 leading-relaxed">
                  Blockchain zapewnia pełną transparentność i bezpieczeństwo. Twoje płatności są chronione w 100%.
                </p>
              </motion.div>
            </motion.div>
          </div>

          {/* CTA na końcu */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, ease: [0.6, 0.01, 0.05, 0.95] }}
            className="text-center"
          >
            <motion.button
              onClick={handleGoToMap}
              disabled={isTransitioning}
              className="inline-flex items-center gap-3 px-10 py-5 text-xl font-bold text-white bg-gradient-to-r from-parkchain-500 to-purple-600 rounded-2xl shadow-2xl disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden relative"
              whileHover={{
                scale: 1.05,
                boxShadow: "0 25px 50px -12px rgba(99, 102, 241, 0.6)"
              }}
              whileTap={{ scale: 0.98 }}
              transition={{ type: "spring", stiffness: 400, damping: 25 }}
            >
              <span className="relative z-10 flex items-center gap-3">
                <motion.div
                  animate={isTransitioning ? { rotate: 360 } : {}}
                  transition={{ duration: 0.6, ease: "easeInOut" }}
                >
                  <FaMapMarkedAlt className="text-2xl" />
                </motion.div>
                Rozpocznij teraz
              </span>
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-600"
                initial={{ opacity: 0 }}
                whileHover={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
              />
            </motion.button>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

export default HomePage;
