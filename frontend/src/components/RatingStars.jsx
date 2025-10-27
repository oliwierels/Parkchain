import React from 'react';
import { FaStar, FaStarHalfAlt, FaRegStar } from 'react-icons/fa';

const RatingStars = ({ rating, size = 'md', interactive = false, onRatingChange }) => {
  const sizeClasses = {
    sm: 'text-sm',
    md: 'text-lg',
    lg: 'text-2xl',
    xl: 'text-3xl'
  };

  const renderStar = (position) => {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;

    if (position <= fullStars) {
      return <FaStar className="text-yellow-400" />;
    } else if (position === fullStars + 1 && hasHalfStar && !interactive) {
      return <FaStarHalfAlt className="text-yellow-400" />;
    } else {
      return <FaRegStar className="text-gray-300" />;
    }
  };

  const handleClick = (starValue) => {
    if (interactive && onRatingChange) {
      onRatingChange(starValue);
    }
  };

  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          onClick={() => handleClick(star)}
          disabled={!interactive}
          className={`${sizeClasses[size]} ${
            interactive ? 'cursor-pointer hover:scale-110 transition-transform' : 'cursor-default'
          }`}
          type="button"
        >
          {renderStar(star)}
        </button>
      ))}
      {rating > 0 && (
        <span className="ml-2 text-sm text-gray-600">
          {rating.toFixed(1)}
        </span>
      )}
    </div>
  );
};

export default RatingStars;
