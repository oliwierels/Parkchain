// frontend/src/components/ReservationSuccessModal.jsx

import { motion } from 'framer-motion';
import { FaCheckCircle, FaQrcode, FaCalendar, FaParking, FaTimes } from 'react-icons/fa';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

function ReservationSuccessModal({ reservation, onClose, onViewQR }) {
  const { t, i18n } = useTranslation();
  const [confetti, setConfetti] = useState([]);

  useEffect(() => {
    // Generate confetti particles
    const particles = [];
    for (let i = 0; i < 50; i++) {
      particles.push({
        id: i,
        left: Math.random() * 100,
        animationDelay: Math.random() * 0.5,
        color: ['#6366F1', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'][Math.floor(Math.random() * 5)]
      });
    }
    setConfetti(particles);
  }, []);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const locale = i18n.language === 'pl' ? 'pl-PL' : 'en-US';
    return date.toLocaleDateString(locale, {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-[10000] p-4">
      {/* Confetti */}
      {confetti.map(particle => (
        <div
          key={particle.id}
          className="absolute w-2 h-2 rounded-full animate-confetti"
          style={{
            left: `${particle.left}%`,
            top: '-10px',
            backgroundColor: particle.color,
            animationDelay: `${particle.animationDelay}s`
          }}
        />
      ))}

      <motion.div
        initial={{ scale: 0.8, opacity: 0, y: 50 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        transition={{ type: 'spring', duration: 0.5, bounce: 0.4 }}
        className="bg-gradient-to-br from-white to-gray-50 rounded-2xl shadow-2xl max-w-md w-full overflow-hidden relative"
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors z-10"
        >
          <FaTimes className="text-2xl" />
        </button>

        {/* Success Icon */}
        <div className="bg-gradient-to-br from-green-400 to-emerald-500 p-8 text-center relative overflow-hidden">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
            className="inline-block"
          >
            <div className="bg-white rounded-full p-6 shadow-xl">
              <FaCheckCircle className="text-6xl text-green-500" />
            </div>
          </motion.div>

          {/* Decorative circles */}
          <div className="absolute top-0 left-0 w-32 h-32 bg-white opacity-10 rounded-full -translate-x-1/2 -translate-y-1/2"></div>
          <div className="absolute bottom-0 right-0 w-40 h-40 bg-white opacity-10 rounded-full translate-x-1/3 translate-y-1/3"></div>
        </div>

        {/* Content */}
        <div className="p-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <h2 className="text-3xl font-bold text-gray-800 mb-2 text-center">
              {t('reservations.success.title')}
            </h2>
            <p className="text-gray-600 text-center mb-6">
              {t('reservations.success.subtitle')}
            </p>

            {/* Reservation Details */}
            <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl p-6 mb-6 border border-indigo-100">
              <div className="flex items-center gap-3 mb-4">
                <div className="bg-indigo-500 rounded-lg p-3">
                  <FaParking className="text-2xl text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-gray-800 text-lg">
                    {reservation?.parking_lot_name || 'Parking'}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {reservation?.address || t('reservations.success.parkingAddress')}
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-3 text-gray-700">
                  <FaCalendar className="text-indigo-500 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-xs text-gray-500">{t('reservations.success.from')}</p>
                    <p className="font-medium text-sm">
                      {reservation?.start_time ? formatDate(reservation.start_time) : t('reservations.success.noDate')}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 text-gray-700">
                  <FaCalendar className="text-indigo-500 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-xs text-gray-500">{t('reservations.success.to')}</p>
                    <p className="font-medium text-sm">
                      {reservation?.end_time ? formatDate(reservation.end_time) : t('reservations.success.noDate')}
                    </p>
                  </div>
                </div>

                {reservation?.license_plate && (
                  <div className="flex items-center gap-3 text-gray-700 pt-3 border-t border-indigo-200">
                    <span className="text-lg">🚗</span>
                    <div>
                      <p className="text-xs text-gray-500">{t('reservations.success.licensePlate')}</p>
                      <p className="font-bold text-lg tracking-wider">
                        {reservation.license_plate}
                      </p>
                    </div>
                  </div>
                )}

                {reservation?.price && (
                  <div className="flex items-center gap-3 text-gray-700 pt-3 border-t border-indigo-200">
                    <span className="text-xl">💰</span>
                    <div>
                      <p className="text-xs text-gray-500">{t('reservations.success.cost')}</p>
                      <p className="font-bold text-2xl text-indigo-600">
                        {reservation.price} PLN
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              {onViewQR && (
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={onViewQR}
                  className="w-full px-6 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-semibold flex items-center justify-center gap-3 shadow-lg hover:shadow-xl transition-all"
                >
                  <FaQrcode className="text-xl" />
                  {t('reservations.success.showQR')}
                </motion.button>
              )}

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={onClose}
                className="w-full px-6 py-4 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition-all"
              >
                {t('reservations.success.close')}
              </motion.button>
            </div>

            {/* Info */}
            <div className="mt-6 text-center text-xs text-gray-500">
              <p>
                {t('reservations.success.findDetails')}{' '}
                <span className="font-semibold text-indigo-600">{t('reservations.success.myReservationsSection')}</span>
                {t('reservations.success.section') && ` ${t('reservations.success.section')}`}
              </p>
            </div>
          </motion.div>
        </div>
      </motion.div>

      {/* Confetti Animation Styles */}
      <style>{`
        @keyframes confetti {
          0% {
            transform: translateY(-10px) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translateY(100vh) rotate(720deg);
            opacity: 0;
          }
        }

        .animate-confetti {
          animation: confetti 3s ease-out forwards;
        }
      `}</style>
    </div>
  );
}

export default ReservationSuccessModal;
