// frontend/src/components/NotificationCenter.jsx

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaBell, FaTimes, FaCheck, FaParking, FaBolt, FaShoppingCart, FaCheckCircle } from 'react-icons/fa';
import { useNotifications } from '../hooks/useWebSocket';

function NotificationCenter() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const dropdownRef = useRef(null);

  // WebSocket notifications
  const { notifications: wsNotifications } = useNotifications((notification) => {
    console.log('🔔 New notification:', notification);
    addNotification(notification);
  });

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Load notifications from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('notifications');
    if (saved) {
      try {
        setNotifications(JSON.parse(saved));
      } catch (err) {
        console.error('Error loading notifications:', err);
      }
    }
  }, []);

  // Save notifications to localStorage
  useEffect(() => {
    localStorage.setItem('notifications', JSON.stringify(notifications));
  }, [notifications]);

  const addNotification = (notification) => {
    const newNotification = {
      id: Date.now() + Math.random(),
      ...notification,
      read: false,
      timestamp: new Date().toISOString()
    };

    setNotifications(prev => [newNotification, ...prev].slice(0, 50)); // Keep max 50
  };

  const markAsRead = (id) => {
    setNotifications(prev =>
      prev.map(notif => notif.id === id ? { ...notif, read: true } : notif)
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(notif => ({ ...notif, read: true })));
  };

  const deleteNotification = (id) => {
    setNotifications(prev => prev.filter(notif => notif.id !== id));
  };

  const clearAll = () => {
    setNotifications([]);
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'reservation':
        return <FaParking className="text-blue-500" />;
      case 'charging':
        return <FaBolt className="text-yellow-500" />;
      case 'marketplace':
        return <FaShoppingCart className="text-purple-500" />;
      case 'payment':
        return <FaCheckCircle className="text-green-500" />;
      default:
        return <FaBell className="text-gray-500" />;
    }
  };

  const getNotificationColor = (type) => {
    switch (type) {
      case 'reservation':
        return 'bg-blue-50 border-blue-200';
      case 'charging':
        return 'bg-yellow-50 border-yellow-200';
      case 'marketplace':
        return 'bg-purple-50 border-purple-200';
      case 'payment':
        return 'bg-green-50 border-green-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;

    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Teraz';
    if (minutes < 60) return `${minutes} min temu`;
    if (hours < 24) return `${hours} godz temu`;
    if (days < 7) return `${days} dni temu`;

    return date.toLocaleDateString('pl-PL', { day: '2-digit', month: 'short' });
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Icon Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-300 hover:text-white transition-colors focus:outline-none"
      >
        <FaBell className="text-2xl" />

        {/* Unread Badge */}
        {unreadCount > 0 && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center"
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </motion.span>
        )}
      </button>

      {/* Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-2xl border border-gray-200 z-50 overflow-hidden"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg font-bold">Powiadomienia</h3>
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-white hover:text-gray-200 transition-colors"
                >
                  <FaTimes />
                </button>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span>{unreadCount} nieprzeczytanych</span>
                {notifications.length > 0 && (
                  <div className="flex gap-2">
                    <button
                      onClick={markAllAsRead}
                      className="hover:underline flex items-center gap-1"
                    >
                      <FaCheck className="text-xs" />
                      Oznacz wszystkie
                    </button>
                    <span className="text-indigo-200">|</span>
                    <button
                      onClick={clearAll}
                      className="hover:underline"
                    >
                      Wyczyść
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Notifications List */}
            <div className="max-h-96 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  <FaBell className="text-5xl mx-auto mb-3 text-gray-300" />
                  <p className="text-sm">Brak powiadomień</p>
                  <p className="text-xs mt-1">Gdy coś się stanie, zobaczysz to tutaj</p>
                </div>
              ) : (
                <div>
                  {notifications.map((notification) => (
                    <motion.div
                      key={notification.id}
                      layout
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      className={`border-b border-gray-100 p-4 hover:bg-gray-50 transition-colors ${
                        !notification.read ? 'bg-blue-50' : ''
                      }`}
                    >
                      <div className="flex gap-3">
                        {/* Icon */}
                        <div className="flex-shrink-0 mt-1">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                            getNotificationColor(notification.type)
                          } border-2`}>
                            {getNotificationIcon(notification.type)}
                          </div>
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2 mb-1">
                            <h4 className={`text-sm font-semibold ${
                              !notification.read ? 'text-gray-900' : 'text-gray-700'
                            }`}>
                              {notification.title}
                            </h4>
                            {!notification.read && (
                              <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-1"></div>
                            )}
                          </div>
                          <p className="text-sm text-gray-600 mb-2">
                            {notification.message}
                          </p>
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-gray-400">
                              {formatTime(notification.timestamp)}
                            </span>
                            <div className="flex gap-2">
                              {!notification.read && (
                                <button
                                  onClick={() => markAsRead(notification.id)}
                                  className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                                >
                                  Oznacz jako przeczytane
                                </button>
                              )}
                              <button
                                onClick={() => deleteNotification(notification.id)}
                                className="text-xs text-red-600 hover:text-red-800"
                              >
                                <FaTimes />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            {notifications.length > 0 && (
              <div className="bg-gray-50 p-3 text-center border-t border-gray-200">
                <button
                  onClick={() => {
                    setIsOpen(false);
                    // Navigate to notifications page if you have one
                  }}
                  className="text-sm text-indigo-600 hover:text-indigo-800 font-medium"
                >
                  Zobacz wszystkie powiadomienia →
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default NotificationCenter;
