import React, { useState } from 'react';
import { FaThumbsUp, FaReply, FaEdit, FaTrash } from 'react-icons/fa';
import { useTranslation } from 'react-i18next';
import RatingStars from './RatingStars';
import axios from 'axios';

const ReviewCard = ({ review, onDelete, onUpdate, currentUserId, isOwner }) => {
  const { t } = useTranslation();
  const [showResponse, setShowResponse] = useState(false);
  const [responseText, setResponseText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isHelpful, setIsHelpful] = useState(false);
  const [helpfulCount, setHelpfulCount] = useState(review.helpful_count || 0);

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('pl-PL', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const handleHelpful = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/reviews/${review.id}/helpful`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      setIsHelpful(response.data.helpful);
      setHelpfulCount(prev => response.data.helpful ? prev + 1 : prev - 1);
    } catch (error) {
      console.error('Error marking as helpful:', error);
    }
  };

  const handleResponse = async () => {
    if (!responseText.trim()) return;

    setIsSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/reviews/${review.id}/response`,
        { response_text: responseText },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      setResponseText('');
      setShowResponse(false);
      if (onUpdate) onUpdate();
    } catch (error) {
      console.error('Error adding response:', error);
      alert(error.response?.data?.error || t('messages.replyAddError'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-4">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold">
              {review.users?.full_name?.charAt(0) || 'U'}
            </div>
            <div>
              <p className="font-semibold">{review.users?.full_name || 'Anonimowy'}</p>
              <p className="text-sm text-gray-500">{formatDate(review.created_at)}</p>
            </div>
          </div>

          <RatingStars rating={review.rating} size="sm" />

          {review.title && (
            <h4 className="font-semibold mt-3 mb-2">{review.title}</h4>
          )}

          {review.comment && (
            <p className="text-gray-700 mb-3">{review.comment}</p>
          )}

          {review.review_photos && review.review_photos.length > 0 && (
            <div className="flex gap-2 mb-3">
              {review.review_photos.map((photo, idx) => (
                <img
                  key={idx}
                  src={photo.photo_url}
                  alt="Review photo"
                  className="w-24 h-24 object-cover rounded"
                />
              ))}
            </div>
          )}

          <div className="flex items-center gap-4 text-sm text-gray-600">
            <button
              onClick={handleHelpful}
              className={`flex items-center gap-1 hover:text-blue-600 transition ${
                isHelpful ? 'text-blue-600 font-semibold' : ''
              }`}
            >
              <FaThumbsUp />
              {t('reviews.helpful')} ({helpfulCount})
            </button>

            {isOwner && !review.review_responses?.length && (
              <button
                onClick={() => setShowResponse(!showResponse)}
                className="flex items-center gap-1 hover:text-blue-600 transition"
              >
                <FaReply />
                {t('reviews.reply')}
              </button>
            )}

            {currentUserId === review.user_id && (
              <>
                <button
                  onClick={() => onUpdate && onUpdate(review)}
                  className="flex items-center gap-1 hover:text-blue-600 transition"
                >
                  <FaEdit />
                  {t('common.edit')}
                </button>
                <button
                  onClick={() => onDelete && onDelete(review.id)}
                  className="flex items-center gap-1 hover:text-red-600 transition"
                >
                  <FaTrash />
                  {t('common.delete')}
                </button>
              </>
            )}
          </div>

          {showResponse && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <textarea
                value={responseText}
                onChange={(e) => setResponseText(e.target.value)}
                placeholder={t('reviews.writeReply')}
                className="w-full p-2 border rounded-lg resize-none"
                rows="3"
              />
              <div className="flex gap-2 mt-2">
                <button
                  onClick={handleResponse}
                  disabled={isSubmitting || !responseText.trim()}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
                >
                  {isSubmitting ? t('common.loading') : t('reviews.sendReply')}
                </button>
                <button
                  onClick={() => setShowResponse(false)}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
                >
                  {t('common.cancel')}
                </button>
              </div>
            </div>
          )}

          {review.review_responses && review.review_responses.length > 0 && (
            <div className="mt-4 p-4 bg-blue-50 rounded-lg border-l-4 border-blue-500">
              <p className="font-semibold text-blue-900 mb-2">
                {t('reviews.ownerResponse')}
              </p>
              <p className="text-gray-700">{review.review_responses[0].response_text}</p>
              <p className="text-sm text-gray-500 mt-2">
                {formatDate(review.review_responses[0].created_at)}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReviewCard;
