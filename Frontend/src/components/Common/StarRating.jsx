import React from 'react';
import { Star } from 'lucide-react';

export const StarRating = ({
  rating,
  maxStars = 5,
  size = 'md', // sm, md, lg
  interactive = false,
  onChange,
  className = ''
}) => {
  const sizeClasses = {
    sm: 'w-3.5 h-3.5',
    md: 'w-4.5 h-4.5',
    lg: 'w-6 h-6'
  };

  const handleStarClick = (index) => {
    if (interactive && onChange) {
      onChange(index + 1);
    }
  };

  return (
    <div className={`flex items-center gap-0.5 ${className}`}>
      {[...Array(maxStars)].map((_, index) => {
        const starValue = index + 1;
        const isFilled = starValue <= rating;
        
        return (
          <button
            key={index}
            type="button"
            disabled={!interactive}
            onClick={() => handleStarClick(index)}
            className={`
              transition-colors duration-150 p-0 text-amber-400
              ${interactive ? 'cursor-pointer hover:scale-110 active:scale-95' : 'pointer-events-none'}
            `}
          >
            <Star
              className={`${sizeClasses[size]} ${isFilled ? 'fill-current' : 'text-slate-200'}`}
            />
          </button>
        );
      })}
    </div>
  );
};

export default StarRating;
