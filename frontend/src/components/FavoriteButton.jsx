import React, { useState, useEffect } from 'react';
import { FaHeart, FaRegHeart } from 'react-icons/fa';
import axios from 'axios';

const FavoriteButton = ({ targetType, targetId, size = 'md', showText = false }) => {
  const [isFavorite, setIsFavorite] = useState(false);
  const [favoriteId, setFavoriteId] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const sizeClasses = {
    sm: 'text-lg',
    md: 'text-xl',
    lg: 'text-2xl',
    xl: 'text-3xl'
  };

  useEffect(() => {
    checkFavoriteStatus();
  }, [targetType, targetId]);

  const checkFavoriteStatus = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/favorites/check/${targetType}/${targetId}`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      setIsFavorite(response.data.isFavorite);
      setFavoriteId(response.data.favoriteId);
    } catch (error) {
      console.error('Error checking favorite status:', error);
    }
  };

  const toggleFavorite = async (e) => {
    e.stopPropagation(); // Prevent parent click events

    const token = localStorage.getItem('token');
    if (!token) {
      alert('Musisz być zalogowany, aby dodać do ulubionych');
      return;
    }

    setIsLoading(true);

    try {
      if (isFavorite) {
        // Remove from favorites
        await axios.delete(
          `${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/favorites/target/${targetType}/${targetId}`,
          {
            headers: { Authorization: `Bearer ${token}` }
          }
        );
        setIsFavorite(false);
        setFavoriteId(null);
      } else {
        // Add to favorites
        const response = await axios.post(
          `${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/favorites`,
          { target_type: targetType, target_id: targetId },
          {
            headers: { Authorization: `Bearer ${token}` }
          }
        );
        setIsFavorite(true);
        setFavoriteId(response.data.id);
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
      alert(error.response?.data?.error || 'Nie udało się zmienić statusu ulubionych');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={toggleFavorite}
      disabled={isLoading}
      className={`
        ${sizeClasses[size]}
        ${isFavorite ? 'text-red-500' : 'text-gray-400'}
        hover:scale-110 transition-all
        disabled:opacity-50 disabled:cursor-not-allowed
        flex items-center gap-2
      `}
      title={isFavorite ? 'Usuń z ulubionych' : 'Dodaj do ulubionych'}
    >
      {isFavorite ? <FaHeart /> : <FaRegHeart />}
      {showText && (
        <span className="text-sm font-medium">
          {isFavorite ? 'Ulubione' : 'Dodaj do ulubionych'}
        </span>
      )}
    </button>
  );
};

export default FavoriteButton;
