import React, { useState, useEffect } from 'react';
import { FaPlus, FaStar } from 'react-icons/fa';
import { useTranslation } from 'react-i18next';
import ReviewCard from './ReviewCard';
import ReviewModal from './ReviewModal';
import RatingStars from './RatingStars';
import axios from 'axios';

const ReviewsList = ({ targetType, targetId, targetName, ownerId }) => {
  const { t } = useTranslation();
  const [reviews, setReviews] = useState([]);
  const [statistics, setStatistics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingReview, setEditingReview] = useState(null);
  const [sortBy, setSortBy] = useState('recent');
  const [currentUserId, setCurrentUserId] = useState(null);

  useEffect(() => {
    fetchReviews();
    fetchStatistics();

    // Get current user ID from token
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        setCurrentUserId(payload.id);
      } catch (error) {
        console.error('Error parsing token:', error);
      }
    }
  }, [targetType, targetId, sortBy]);

  const fetchReviews = async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/reviews`,
        {
          params: {
            target_type: targetType,
            target_id: targetId,
            sort: sortBy,
            limit: 50
          }
        }
      );
      setReviews(response.data);
    } catch (error) {
      console.error('Error fetching reviews:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStatistics = async () => {
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/reviews/statistics/${targetType}/${targetId}`
      );
      setStatistics(response.data);
    } catch (error) {
      console.error('Error fetching statistics:', error);
    }
  };

  const handleDelete = async (reviewId) => {
    if (!confirm(t('messages.confirmDeleteReview'))) return;

    try {
      const token = localStorage.getItem('token');
      await axios.delete(
        `${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/reviews/${reviewId}`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      fetchReviews();
      fetchStatistics();
    } catch (error) {
      console.error('Error deleting review:', error);
      alert(t('messages.reviewDeleteError'));
    }
  };

  const handleEdit = (review) => {
    setEditingReview(review);
    setShowModal(true);
  };

  const handleAddReview = () => {
    setEditingReview(null);
    setShowModal(true);
  };

  const handleSuccess = () => {
    fetchReviews();
    fetchStatistics();
    setShowModal(false);
    setEditingReview(null);
  };

  const userHasReviewed = reviews.some(r => r.user_id === currentUserId);
  const isOwner = currentUserId === ownerId;

  return (
    <div className="mt-8">
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h3 className="text-2xl font-bold mb-4">{t('reviews.title')}</h3>

        {statistics && statistics.total_reviews > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <div className="flex items-center gap-4 mb-4">
                <div className="text-5xl font-bold">{statistics.average_rating}</div>
                <div>
                  <RatingStars rating={parseFloat(statistics.average_rating)} size="lg" />
                  <p className="text-sm text-gray-600 mt-1">
                    {statistics.total_reviews} {statistics.total_reviews === 1 ? t('reviews.reviewSingular') : t('reviews.reviewPlural')}
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              {[5, 4, 3, 2, 1].map((stars) => {
                const count = statistics[`${['one', 'two', 'three', 'four', 'five'][stars - 1]}_star_count`] || 0;
                const percentage = statistics.total_reviews > 0
                  ? (count / statistics.total_reviews) * 100
                  : 0;

                return (
                  <div key={stars} className="flex items-center gap-2">
                    <span className="text-sm w-12">{stars} <FaStar className="inline text-yellow-400" /></span>
                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-yellow-400 h-2 rounded-full"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <span className="text-sm text-gray-600 w-12">{count}</span>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <p className="text-gray-600 text-center py-4">
            {t('reviews.noReviews')}
          </p>
        )}

        {!isOwner && (
          <div className="mt-6">
            {!userHasReviewed ? (
              <button
                onClick={handleAddReview}
                className="w-full md:w-auto px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2 font-semibold"
              >
                <FaPlus />
                {t('reviews.addReview')}
              </button>
            ) : (
              <p className="text-sm text-gray-600">
                {t('reviews.alreadyReviewed')}
              </p>
            )}
          </div>
        )}
      </div>

      {reviews.length > 0 && (
        <>
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-xl font-semibold">{t('reviews.allReviews')} ({reviews.length})</h4>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-4 py-2 border rounded-lg"
            >
              <option value="recent">{t('reviews.sortRecent')}</option>
              <option value="highest">{t('reviews.sortHighest')}</option>
              <option value="lowest">{t('reviews.sortLowest')}</option>
              <option value="helpful">{t('reviews.sortHelpful')}</option>
            </select>
          </div>

          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            </div>
          ) : (
            <div>
              {reviews.map((review) => (
                <ReviewCard
                  key={review.id}
                  review={review}
                  onDelete={handleDelete}
                  onUpdate={handleEdit}
                  currentUserId={currentUserId}
                  isOwner={isOwner}
                />
              ))}
            </div>
          )}
        </>
      )}

      <ReviewModal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          setEditingReview(null);
        }}
        targetType={targetType}
        targetId={targetId}
        targetName={targetName}
        existingReview={editingReview}
        onSuccess={handleSuccess}
      />
    </div>
  );
};

export default ReviewsList;
