// Live Notifications Component
// Shows real-time notifications for transactions, tier upgrades, etc.

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FaCheckCircle, FaExclamationCircle, FaInfoCircle,
  FaTimes, FaCrown, FaRocket, FaCoins, FaLayerGroup, FaTrophy
} from 'react-icons/fa';

const NOTIFICATION_DURATION = 5000; // 5 seconds

const LiveNotifications = () => {
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    // Set up global notification function
    window.addGatewayNotification = (notification) => {
      const id = `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const newNotif = { ...notification, id, timestamp: Date.now() };

      setNotifications(prev => [newNotif, ...prev]);

      // Auto-remove after duration
      setTimeout(() => {
        removeNotification(id);
      }, NOTIFICATION_DURATION);
    };

    return () => {
      delete window.addGatewayNotification;
    };
  }, []);

  const removeNotification = (id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const getTypeStyles = (type) => {
    switch (type) {
      case 'success':
        return {
          bg: 'bg-green-900/90',
          border: 'border-green-600',
          icon: FaCheckCircle,
          iconColor: 'text-green-400'
        };
      case 'error':
        return {
          bg: 'bg-red-900/90',
          border: 'border-red-600',
          icon: FaExclamationCircle,
          iconColor: 'text-red-400'
        };
      case 'tier_upgrade':
        return {
          bg: 'bg-purple-900/90',
          border: 'border-purple-600',
          icon: FaCrown,
          iconColor: 'text-purple-400'
        };
      case 'batch':
        return {
          bg: 'bg-blue-900/90',
          border: 'border-blue-600',
          icon: FaLayerGroup,
          iconColor: 'text-blue-400'
        };
      case 'savings':
        return {
          bg: 'bg-yellow-900/90',
          border: 'border-yellow-600',
          icon: FaCoins,
          iconColor: 'text-yellow-400'
        };
      case 'achievement':
        return {
          bg: 'bg-gradient-to-br from-purple-900/90 to-pink-900/90',
          border: 'border-purple-500',
          icon: FaTrophy,
          iconColor: 'text-yellow-400'
        };
      default:
        return {
          bg: 'bg-gray-900/90',
          border: 'border-gray-600',
          icon: FaInfoCircle,
          iconColor: 'text-gray-400'
        };
    }
  };

  return (
    <div className="fixed top-20 right-6 z-[100] flex flex-col gap-3 max-w-sm">
      <AnimatePresence>
        {notifications.map((notif) => {
          const styles = getTypeStyles(notif.type);
          const Icon = styles.icon;

          return (
            <motion.div
              key={notif.id}
              initial={{ opacity: 0, x: 300, scale: 0.8 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 300, scale: 0.8 }}
              className={`${styles.bg} ${styles.border} border-2 rounded-xl p-4 shadow-2xl backdrop-blur-sm`}
            >
              <div className="flex items-start gap-3">
                <Icon className={`text-2xl ${styles.iconColor} mt-0.5`} />
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-white mb-1">
                    {notif.title}
                  </div>
                  <div className="text-sm text-gray-300">
                    {notif.message}
                  </div>
                  {notif.details && (
                    <div className="mt-2 text-xs text-gray-400 space-y-0.5">
                      {notif.details.map((detail, idx) => (
                        <div key={idx}>• {detail}</div>
                      ))}
                    </div>
                  )}
                </div>
                <button
                  onClick={() => removeNotification(notif.id)}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <FaTimes />
                </button>
              </div>

              {/* Progress bar */}
              <motion.div
                initial={{ width: '100%' }}
                animate={{ width: '0%' }}
                transition={{ duration: NOTIFICATION_DURATION / 1000, ease: 'linear' }}
                className="h-1 bg-white/20 rounded-full mt-3"
              />
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
};

// Helper function to trigger notifications from anywhere
export const notify = {
  success: (title, message, details) => {
    if (window.addGatewayNotification) {
      window.addGatewayNotification({ type: 'success', title, message, details });
    }
  },
  error: (title, message, details) => {
    if (window.addGatewayNotification) {
      window.addGatewayNotification({ type: 'error', title, message, details });
    }
  },
  tierUpgrade: (title, message, details) => {
    if (window.addGatewayNotification) {
      window.addGatewayNotification({ type: 'tier_upgrade', title, message, details });
    }
  },
  batch: (title, message, details) => {
    if (window.addGatewayNotification) {
      window.addGatewayNotification({ type: 'batch', title, message, details });
    }
  },
  savings: (title, message, details) => {
    if (window.addGatewayNotification) {
      window.addGatewayNotification({ type: 'savings', title, message, details });
    }
  },
  info: (title, message, details) => {
    if (window.addGatewayNotification) {
      window.addGatewayNotification({ type: 'info', title, message, details });
    }
  },
  achievement: (title, message, details) => {
    if (window.addGatewayNotification) {
      window.addGatewayNotification({ type: 'achievement', title, message, details });
    }
  }
};

export default LiveNotifications;
