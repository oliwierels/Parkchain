import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { FaTimes } from 'react-icons/fa';
import RatingStars from './RatingStars';
import axios from 'axios';

const ReviewModal = ({ isOpen, onClose, targetType, targetId, targetName, existingReview, onSuccess }) => {
  const { t } = useTranslation();
  const [rating, setRating] = useState(existingReview?.rating || 0);
  const [title, setTitle] = useState(existingReview?.title || '');
  const [comment, setComment] = useState(existingReview?.comment || '');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (existingReview) {
      setRating(existingReview.rating);
      setTitle(existingReview.title || '');
      setComment(existingReview.comment || '');
    } else {
      setRating(0);
      setTitle('');
      setComment('');
    }
  }, [existingReview, isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (rating === 0) {
      alert(t('modals.selectRating'));
      return;
    }

    setIsSubmitting(true);

    try {
      const token = localStorage.getItem('token');
      const url = existingReview
        ? `${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/reviews/${existingReview.id}`
        : `${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/reviews`;

      const method = existingReview ? 'put' : 'post';

      const data = existingReview
        ? { rating, title, comment }
        : { target_type: targetType, target_id: targetId, rating, title, comment };

      await axios[method](url, data, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (onSuccess) onSuccess();
      onClose();

      // Reset form
      setRating(0);
      setTitle('');
      setComment('');
    } catch (error) {
      console.error('Error submitting review:', error);
      alert(error.response?.data?.error || t('messages.reviewSaveError'));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">
              {existingReview ? t('modals.editReview') : t('modals.addReview')}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
            >
              <FaTimes size={24} />
            </button>
          </div>

          {targetName && (
            <div className="mb-4 p-3 bg-gray-100 rounded-lg">
              <p className="text-sm text-gray-600">{t('modals.reviewFor')}</p>
              <p className="font-semibold">{targetName}</p>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="mb-6">
              <label className="block text-sm font-semibold mb-2">
                {t('modals.yourRating')}
              </label>
              <RatingStars
                rating={rating}
                size="lg"
                interactive={true}
                onRatingChange={setRating}
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-semibold mb-2">
                Tytuł (opcjonalnie)
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Podsumuj swoją opinię"
                maxLength={200}
                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-gray-500 mt-1">
                {title.length}/200 znaków
              </p>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-semibold mb-2">
                Twoja opinia (opcjonalnie)
              </label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Co szczególnie Ci się podobało lub nie podobało?"
                rows="6"
                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 resize-none"
              />
            </div>

            <div className="flex gap-3">
              <button
                type="submit"
                disabled={isSubmitting || rating === 0}
                className="flex-1 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 font-semibold"
              >
                {isSubmitting ? t('common.loading') : (existingReview ? t('common.save') : t('reviews.submit'))}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-3 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 font-semibold"
              >
                {t('common.cancel')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ReviewModal;
