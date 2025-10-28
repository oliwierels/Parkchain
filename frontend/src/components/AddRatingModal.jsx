// frontend/src/components/AddRatingModal.jsx
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaStar, FaTimes, FaCheckCircle } from 'react-icons/fa';

function AddRatingModal({ type, itemId, itemName, onClose, onSuccess }) {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (rating === 0) {
      setError('Wybierz ocenę (1-5 gwiazdek)');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const endpoint = type === 'parking'
        ? '/api/parking-ratings'
        : '/api/charging-ratings';

      const body = type === 'parking'
        ? { lot_id: itemId, rating, comment }
        : { station_id: itemId, rating, comment };

      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(body)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Nie udało się dodać oceny');
      }

      setSuccess(true);
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1500);

    } catch (err) {
      console.error('Błąd dodawania oceny:', err);
      setError(err.message || 'Nie udało się dodać oceny');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/70 flex justify-center items-center z-[2000] p-4 backdrop-blur-sm"
        onClick={success ? undefined : onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-gray-800 rounded-2xl p-6 max-w-md w-full shadow-2xl border border-gray-700"
          onClick={(e) => e.stopPropagation()}
        >
          {success ? (
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="text-center py-8"
            >
              <FaCheckCircle className="text-green-400 text-6xl mx-auto mb-4" />
              <h3 className="text-2xl font-bold text-white mb-2">Dziękujemy!</h3>
              <p className="text-gray-300">Twoja ocena została zapisana</p>
            </motion.div>
          ) : (
            <>
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-white">
                  Oceń {type === 'parking' ? 'parking' : 'ładowarkę'}
                </h2>
                <button
                  onClick={onClose}
                  className="text-gray-400 hover:text-white transition-colors p-2 hover:bg-gray-700 rounded-lg"
                >
                  <FaTimes size={20} />
                </button>
              </div>

              <p className="text-gray-300 text-sm mb-4">{itemName}</p>

              {error && (
                <div className="bg-red-900/30 border border-red-600 text-red-400 px-4 py-3 rounded-lg mb-4 text-sm">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit}>
                {/* Star Rating */}
                <div className="mb-6">
                  <label className="block text-sm font-semibold text-gray-300 mb-3">
                    Twoja ocena
                  </label>
                  <div className="flex gap-2 justify-center">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setRating(star)}
                        onMouseEnter={() => setHoverRating(star)}
                        onMouseLeave={() => setHoverRating(0)}
                        className="transition-transform hover:scale-110"
                      >
                        <FaStar
                          className={`text-4xl ${
                            star <= (hoverRating || rating)
                              ? 'text-yellow-400'
                              : 'text-gray-600'
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                  {rating > 0 && (
                    <p className="text-center text-gray-400 mt-2 text-sm">
                      {rating === 1 && 'Bardzo źle'}
                      {rating === 2 && 'Źle'}
                      {rating === 3 && 'Średnio'}
                      {rating === 4 && 'Dobrze'}
                      {rating === 5 && 'Świetnie!'}
                    </p>
                  )}
                </div>

                {/* Comment */}
                <div className="mb-6">
                  <label className="block text-sm font-semibold text-gray-300 mb-2">
                    Komentarz (opcjonalnie)
                  </label>
                  <textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Opisz swoje doświadczenie..."
                    rows={4}
                    className="w-full px-4 py-3 bg-gray-700 text-white border border-gray-600 rounded-lg focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 resize-none"
                  />
                </div>

                {/* Buttons */}
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={onClose}
                    disabled={loading}
                    className="flex-1 px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-medium transition-all disabled:opacity-50"
                  >
                    Anuluj
                  </button>
                  <button
                    type="submit"
                    disabled={loading || rating === 0}
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white rounded-lg font-bold transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Zapisywanie...
                      </>
                    ) : (
                      <>
                        <FaStar />
                        Dodaj ocenę
                      </>
                    )}
                  </button>
                </div>
              </form>
            </>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

export default AddRatingModal;
