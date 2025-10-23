// frontend/src/pages/HomePage.jsx

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence, useScroll, useTransform } from "framer-motion";
import { FaMapMarkedAlt, FaLock, FaBolt, FaParking, FaChevronDown, FaChargingStation, FaUsers, FaClock } from "react-icons/fa";

function HomePage() {
  const navigate = useNavigate();
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [autoRedirectCountdown, setAutoRedirectCountdown] = useState(8);
  const [autoRedirectCancelled, setAutoRedirectCancelled] = useState(false);
  const [hoveredCard, setHoveredCard] = useState(null);

  const { scrollY } = useScroll();
  const y1 = useTransform(scrollY, [0, 300], [0, 100]);
  const y2 = useTransform(scrollY, [0, 300], [0, -50]);
  const opacity = useTransform(scrollY, [0, 200], [1, 0]);

  // Auto-redirect timer (zwiększono do 8s żeby dać czas na eksplorację)
  useEffect(() => {
    if (autoRedirectCancelled || isTransitioning) return;

    const interval = setInterval(() => {
      setAutoRedirectCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setAutoRedirectCancelled(true);
          setIsTransitioning(true);
          setTimeout(() => {
            navigate('/map');
          }, 600);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [autoRedirectCancelled, isTransitioning, navigate]);

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

  const handleNavigate = (path) => {
    if (isTransitioning) return;
    setAutoRedirectCancelled(true);
    setIsTransitioning(true);
    setTimeout(() => {
      navigate(path);
    }, 600);
  };

  const features = [
    {
      id: 'map',
      icon: FaMapMarkedAlt,
      title: 'Mapa Parkingów',
      description: 'Znajdź idealne miejsce w czasie rzeczywistym',
      gradient: 'from-blue-500 to-cyan-500',
      path: '/map',
      stats: 'Real-time',
      badge: 'Popularne'
    },
    {
      id: 'charging',
      icon: FaChargingStation,
      title: 'Ładowarki EV',
      description: 'Naładuj swój elektryczny pojazd',
      gradient: 'from-green-500 to-emerald-500',
      path: '/map',
      stats: 'Ekologiczne',
      badge: 'Nowość'
    },
    {
      id: 'reservations',
      icon: FaClock,
      title: 'Moje Rezerwacje',
      description: 'Zarządzaj swoimi rezerwacjami',
      gradient: 'from-purple-500 to-pink-500',
      path: '/my-reservations',
      stats: 'Fast',
      badge: null
    },
    {
      id: 'community',
      icon: FaUsers,
      title: 'CrowdScan',
      description: 'Społeczność raportuje dostępność',
      gradient: 'from-orange-500 to-red-500',
      path: '/map',
      stats: 'Społeczność',
      badge: 'Beta'
    }
  ];

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950">
      {/* Animated background blobs */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          className="absolute -top-40 -left-40 w-[600px] h-[600px] bg-parkchain-500/10 rounded-full blur-3xl"
          animate={{
            scale: [1, 1.3, 1],
            x: [0, 50, 0],
            y: [0, 30, 0],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        <motion.div
          className="absolute top-1/2 -right-40 w-[500px] h-[500px] bg-purple-500/10 rounded-full blur-3xl"
          animate={{
            scale: [1.2, 1, 1.2],
            x: [0, -50, 0],
            y: [0, -30, 0],
          }}
          transition={{
            duration: 18,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        <motion.div
          className="absolute bottom-0 left-1/2 w-[400px] h-[400px] bg-pink-500/10 rounded-full blur-3xl"
          animate={{
            scale: [1, 1.4, 1],
            x: [0, -30, 0],
          }}
          transition={{
            duration: 15,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
      </div>

      {/* Transition overlay */}
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
                Ładowanie...
              </motion.span>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hero Section */}
      <motion.div
        className="relative z-10 min-h-screen flex flex-col items-center justify-center px-4 py-20"
        style={{ opacity }}
      >
        <div className="max-w-7xl mx-auto text-center">
          {/* Logo */}
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{
              type: "spring",
              stiffness: 300,
              damping: 20,
              delay: 0
            }}
            className="mb-8"
          >
            <motion.div
              className="inline-block w-28 h-28 bg-gradient-to-br from-parkchain-400 to-parkchain-600 rounded-3xl flex items-center justify-center shadow-2xl shadow-parkchain-500/50"
              whileHover={{
                scale: 1.1,
                rotate: 12,
                boxShadow: "0 25px 50px -12px rgba(99, 102, 241, 0.8)"
              }}
              transition={{ type: "spring", stiffness: 400, damping: 15 }}
            >
              <FaParking className="text-6xl text-white" />
            </motion.div>
          </motion.div>

          {/* Title */}
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.6, ease: [0.6, 0.01, 0.05, 0.95] }}
            className="text-6xl md:text-7xl lg:text-8xl font-black text-white mb-6 leading-tight"
            style={{ y: y2 }}
          >
            Przyszłość
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-parkchain-400 via-purple-400 to-pink-400">
              Parkowania
            </span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25, duration: 0.6 }}
            className="text-xl md:text-2xl text-gray-300 mb-12 max-w-3xl mx-auto leading-relaxed"
          >
            Inteligentna platforma łącząca parkingi, ładowarki EV i społeczność.
            <span className="block mt-2 text-parkchain-400 font-semibold">
              Wszystko w jednym miejscu.
            </span>
          </motion.p>

          {/* Auto-redirect info */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="mb-12"
          >
            <AnimatePresence mode="wait">
              {!autoRedirectCancelled && autoRedirectCountdown > 0 ? (
                <motion.div
                  key="countdown"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-white/5 backdrop-blur-xl rounded-full border border-white/10"
                >
                  <div className="w-2 h-2 bg-parkchain-400 rounded-full animate-pulse"></div>
                  <span className="text-gray-300 text-sm">
                    Auto-start za{' '}
                    <motion.span
                      key={autoRedirectCountdown}
                      initial={{ scale: 1.3, color: '#ffffff' }}
                      animate={{ scale: 1, color: '#a78bfa' }}
                      transition={{ duration: 0.3 }}
                      className="font-bold"
                    >
                      {autoRedirectCountdown}s
                    </motion.span>
                    {' • Scrolluj aby eksplorować'}
                  </span>
                </motion.div>
              ) : autoRedirectCancelled ? (
                <motion.div
                  key="cancelled"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-green-500/10 backdrop-blur-xl rounded-full border border-green-500/30"
                >
                  <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                  <span className="text-green-400 text-sm font-medium">
                    Eksploruj w swoim tempie
                  </span>
                </motion.div>
              ) : null}
            </AnimatePresence>
          </motion.div>

          {/* Main Feature Cards Grid */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.8 }}
            className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl mx-auto"
            style={{ y: y1 }}
          >
            {features.map((feature, index) => (
              <motion.div
                key={feature.id}
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 + index * 0.1, duration: 0.6 }}
                onHoverStart={() => setHoveredCard(feature.id)}
                onHoverEnd={() => setHoveredCard(null)}
                className="relative group"
              >
                {/* Glow effect */}
                <motion.div
                  className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} rounded-3xl blur-2xl opacity-0 group-hover:opacity-30 transition-opacity duration-500`}
                  animate={hoveredCard === feature.id ? { scale: 1.1 } : { scale: 1 }}
                />

                {/* Card */}
                <motion.button
                  onClick={() => handleNavigate(feature.path)}
                  disabled={isTransitioning}
                  className="relative w-full h-full bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 text-left overflow-hidden disabled:opacity-50 disabled:cursor-not-allowed"
                  whileHover={{
                    scale: 1.02,
                    y: -8,
                    borderColor: "rgba(255, 255, 255, 0.3)"
                  }}
                  whileTap={{ scale: 0.98 }}
                  transition={{ type: "spring", stiffness: 400, damping: 25 }}
                >
                  {/* Badge */}
                  {feature.badge && (
                    <motion.div
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="absolute top-6 right-6 px-3 py-1 bg-white/10 backdrop-blur-sm rounded-full text-xs font-bold text-white border border-white/20"
                    >
                      {feature.badge}
                    </motion.div>
                  )}

                  {/* Icon */}
                  <motion.div
                    className={`inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br ${feature.gradient} rounded-2xl mb-6 shadow-xl`}
                    whileHover={{ rotate: 12, scale: 1.1 }}
                    transition={{ type: "spring", stiffness: 400, damping: 15 }}
                  >
                    <feature.icon className="text-4xl text-white" />
                  </motion.div>

                  {/* Content */}
                  <h3 className="text-3xl font-bold text-white mb-3 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-white group-hover:to-gray-300 transition-all duration-300">
                    {feature.title}
                  </h3>
                  <p className="text-gray-400 text-lg mb-4 leading-relaxed">
                    {feature.description}
                  </p>

                  {/* Stats */}
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full bg-gradient-to-r ${feature.gradient}`}></div>
                    <span className="text-sm font-medium text-gray-500 group-hover:text-gray-400 transition-colors">
                      {feature.stats}
                    </span>
                  </div>

                  {/* Arrow */}
                  <motion.div
                    className="absolute bottom-8 right-8 text-white/30 group-hover:text-white transition-colors"
                    animate={hoveredCard === feature.id ? { x: 5 } : { x: 0 }}
                  >
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                  </motion.div>
                </motion.button>
              </motion.div>
            ))}
          </motion.div>

          {/* Quick Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1, duration: 0.6 }}
            className="flex flex-wrap items-center justify-center gap-8 mt-16 text-gray-400"
          >
            <motion.div
              className="flex items-center gap-3"
              whileHover={{ scale: 1.05, color: "#ffffff" }}
            >
              <FaBolt className="text-yellow-400 text-xl" />
              <span className="text-sm font-medium">Rezerwacja w 30s</span>
            </motion.div>
            <motion.div
              className="flex items-center gap-3"
              whileHover={{ scale: 1.05, color: "#ffffff" }}
            >
              <FaLock className="text-parkchain-400 text-xl" />
              <span className="text-sm font-medium">100% Bezpieczne</span>
            </motion.div>
            <motion.div
              className="flex items-center gap-3"
              whileHover={{ scale: 1.05, color: "#ffffff" }}
            >
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-sm font-medium">Dostępne 24/7</span>
            </motion.div>
          </motion.div>

          {/* Scroll indicator */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2, duration: 0.6 }}
            className="absolute bottom-10 left-1/2 transform -translate-x-1/2"
          >
            <motion.div
              animate={{ y: [0, 12, 0] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              className="text-gray-500 flex flex-col items-center gap-2 cursor-pointer"
              whileHover={{ scale: 1.2, color: "#ffffff" }}
              onClick={() => {
                window.scrollTo({ top: window.innerHeight, behavior: 'smooth' });
              }}
            >
              <span className="text-xs font-medium uppercase tracking-wider">Więcej</span>
              <FaChevronDown className="text-xl" />
            </motion.div>
          </motion.div>
        </div>
      </motion.div>

      {/* Second Section - Why Parkchain */}
      <div className="relative z-10 min-h-screen flex items-center justify-center px-4 py-20 bg-gradient-to-b from-transparent via-black/20 to-transparent">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8 }}
            className="text-center mb-20"
          >
            <h2 className="text-5xl md:text-6xl font-black text-white mb-6">
              Dlaczego <span className="text-transparent bg-clip-text bg-gradient-to-r from-parkchain-400 to-purple-400">Parkchain?</span>
            </h2>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              Łączymy technologię blockchain z inteligentną infrastrukturą parkingową
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: FaMapMarkedAlt,
                title: "Real-time Mapa",
                description: "Śledź dostępność parkingów i ładowarek w czasie rzeczywistym dzięki danym z społeczności",
                color: "from-blue-500 to-cyan-500"
              },
              {
                icon: FaLock,
                title: "Blockchain Security",
                description: "Wszystkie transakcje zabezpieczone przez blockchain. Twoje dane są w 100% bezpieczne.",
                color: "from-purple-500 to-pink-500"
              },
              {
                icon: FaUsers,
                title: "CrowdScan Network",
                description: "Społeczność zgłasza dostępność miejsc parkingowych w czasie rzeczywistym",
                color: "from-orange-500 to-red-500"
              }
            ].map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="relative group"
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${item.color} rounded-3xl blur-2xl opacity-0 group-hover:opacity-20 transition-opacity duration-500`}></div>
                <motion.div
                  className="relative bg-white/5 backdrop-blur-xl p-8 rounded-3xl border border-white/10 h-full"
                  whileHover={{ scale: 1.05, y: -5, borderColor: "rgba(255, 255, 255, 0.2)" }}
                  transition={{ type: "spring", stiffness: 400, damping: 25 }}
                >
                  <motion.div
                    className={`inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br ${item.color} rounded-2xl mb-6`}
                    whileHover={{ rotate: 12, scale: 1.1 }}
                    transition={{ type: "spring", stiffness: 400, damping: 15 }}
                  >
                    <item.icon className="text-3xl text-white" />
                  </motion.div>
                  <h3 className="text-2xl font-bold text-white mb-4">
                    {item.title}
                  </h3>
                  <p className="text-gray-400 leading-relaxed">
                    {item.description}
                  </p>
                </motion.div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default HomePage;
