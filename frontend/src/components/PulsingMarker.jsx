// frontend/src/components/PulsingMarker.jsx
import { motion } from 'framer-motion';

function PulsingMarker({ type = 'parking' }) {
  const colors = {
    parking: {
      primary: '#6366F1',
      secondary: '#8B5CF6',
      glow: 'rgba(99, 102, 241, 0.4)'
    },
    charging: {
      primary: '#F59E0B',
      secondary: '#EAB308',
      glow: 'rgba(245, 158, 11, 0.4)'
    }
  };

  const color = colors[type] || colors.parking;

  return (
    <div style={{ position: 'relative', width: '40px', height: '40px' }}>
      {/* Ripple rings */}
      {[0, 1, 2].map((i) => (
        <motion.div
          key={`ripple-${i}`}
          initial={{ scale: 0, opacity: 0.6 }}
          animate={{
            scale: [0, 2, 3],
            opacity: [0.6, 0.3, 0]
          }}
          transition={{
            duration: 2,
            delay: i * 0.4,
            repeat: Infinity,
            ease: 'easeOut'
          }}
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            width: '100%',
            height: '100%',
            borderRadius: '50%',
            border: `3px solid ${color.primary}`,
            transform: 'translate(-50%, -50%)',
            pointerEvents: 'none'
          }}
        />
      ))}

      {/* Main marker dot */}
      <motion.div
        animate={{
          scale: [1, 1.2, 1],
          boxShadow: [
            `0 0 20px ${color.glow}`,
            `0 0 40px ${color.glow}`,
            `0 0 20px ${color.glow}`
          ]
        }}
        transition={{
          duration: 1.5,
          repeat: Infinity,
          ease: 'easeInOut'
        }}
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          width: '20px',
          height: '20px',
          background: `linear-gradient(135deg, ${color.primary} 0%, ${color.secondary} 100%)`,
          borderRadius: '50%',
          border: '3px solid white',
          transform: 'translate(-50%, -50%)',
          cursor: 'pointer',
          zIndex: 1
        }}
      >
        {/* Inner glow */}
        <motion.div
          animate={{
            opacity: [0.5, 1, 0.5]
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: 'easeInOut'
          }}
          style={{
            position: 'absolute',
            inset: 0,
            background: 'radial-gradient(circle, rgba(255,255,255,0.8) 0%, transparent 70%)',
            borderRadius: '50%'
          }}
        />
      </motion.div>

      {/* Sparkles around marker */}
      {[0, 1, 2, 3].map((i) => (
        <motion.div
          key={`sparkle-${i}`}
          initial={{ opacity: 0, scale: 0 }}
          animate={{
            opacity: [0, 1, 0],
            scale: [0, 1, 0],
            rotate: 360
          }}
          transition={{
            duration: 2,
            delay: i * 0.5,
            repeat: Infinity,
            ease: 'easeInOut'
          }}
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            width: '6px',
            height: '6px',
            background: '#FCD34D',
            borderRadius: '50%',
            transform: `rotate(${i * 90}deg) translateX(25px)`,
            transformOrigin: '0 0'
          }}
        />
      ))}
    </div>
  );
}

export default PulsingMarker;
