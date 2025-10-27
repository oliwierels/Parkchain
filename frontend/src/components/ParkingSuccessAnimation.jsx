// frontend/src/components/ParkingSuccessAnimation.jsx
import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState } from 'react';
import { FaParking, FaStar, FaCheckCircle } from 'react-icons/fa';

function ParkingSuccessAnimation({ show, onComplete }) {
  const [particles, setParticles] = useState([]);

  useEffect(() => {
    if (show) {
      // Generate sparkle particles
      const newParticles = Array.from({ length: 30 }, (_, i) => ({
        id: i,
        x: Math.random() * 100 - 50,
        y: Math.random() * 100 - 50,
        delay: Math.random() * 0.3,
        duration: 0.8 + Math.random() * 0.4,
        rotation: Math.random() * 360,
        scale: 0.5 + Math.random() * 0.5
      }));
      setParticles(newParticles);

      // Auto complete after animation
      const timer = setTimeout(onComplete, 2500);
      return () => clearTimeout(timer);
    }
  }, [show, onComplete]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[10000] flex items-center justify-center pointer-events-none"
        >
          {/* Background blur overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/30 backdrop-blur-sm"
          />

          {/* Center success icon */}
          <div className="relative">
            {/* Ripple effect */}
            <motion.div
              initial={{ scale: 0, opacity: 0.8 }}
              animate={{ scale: 3, opacity: 0 }}
              transition={{ duration: 1, ease: 'easeOut' }}
              className="absolute inset-0 bg-green-500 rounded-full"
              style={{ filter: 'blur(20px)' }}
            />

            {/* Main success circle */}
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: 'spring', stiffness: 200, damping: 15 }}
              className="relative w-32 h-32 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center shadow-2xl"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.3, type: 'spring', stiffness: 300 }}
              >
                <FaCheckCircle className="text-6xl text-white" />
              </motion.div>
            </motion.div>

            {/* Sparkle particles */}
            {particles.map((particle) => (
              <motion.div
                key={particle.id}
                initial={{
                  opacity: 0,
                  scale: 0,
                  x: 0,
                  y: 0,
                  rotate: 0
                }}
                animate={{
                  opacity: [0, 1, 0],
                  scale: [0, particle.scale, 0],
                  x: particle.x * 3,
                  y: particle.y * 3,
                  rotate: particle.rotation
                }}
                transition={{
                  duration: particle.duration,
                  delay: particle.delay,
                  ease: 'easeOut'
                }}
                className="absolute top-1/2 left-1/2"
                style={{ transformOrigin: 'center' }}
              >
                <FaStar className="text-yellow-400 text-2xl drop-shadow-lg" />
              </motion.div>
            ))}

            {/* Orbiting parking icons */}
            {[0, 1, 2].map((i) => (
              <motion.div
                key={`orbit-${i}`}
                initial={{ opacity: 0, scale: 0 }}
                animate={{
                  opacity: [0, 1, 0],
                  scale: [0, 1, 0],
                  rotate: 360
                }}
                transition={{
                  duration: 2,
                  delay: i * 0.2,
                  ease: 'easeInOut'
                }}
                className="absolute top-1/2 left-1/2"
                style={{
                  transform: `rotate(${i * 120}deg) translateX(80px)`
                }}
              >
                <FaParking className="text-3xl text-indigo-400" />
              </motion.div>
            ))}
          </div>

          {/* Success text */}
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, type: 'spring' }}
            className="absolute bottom-1/3 text-center"
          >
            <motion.h2
              initial={{ scale: 0.8 }}
              animate={{ scale: [0.8, 1.1, 1] }}
              transition={{ delay: 0.6, duration: 0.5 }}
              className="text-4xl font-bold text-white drop-shadow-lg"
            >
              Parking dodany! 🎉
            </motion.h2>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
              className="text-lg text-gray-200 mt-2 drop-shadow"
            >
              Twój parking jest już dostępny na mapie
            </motion.p>
          </motion.div>

          {/* Confetti rain */}
          {Array.from({ length: 50 }).map((_, i) => (
            <motion.div
              key={`confetti-${i}`}
              initial={{
                opacity: 1,
                x: Math.random() * window.innerWidth,
                y: -20,
                rotate: Math.random() * 360
              }}
              animate={{
                y: window.innerHeight + 20,
                rotate: Math.random() * 360 + 720,
                opacity: [1, 1, 0]
              }}
              transition={{
                duration: 2 + Math.random() * 2,
                delay: Math.random() * 0.5,
                ease: 'linear'
              }}
              className="absolute w-3 h-3 rounded-sm"
              style={{
                backgroundColor: ['#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6'][i % 5]
              }}
            />
          ))}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default ParkingSuccessAnimation;
