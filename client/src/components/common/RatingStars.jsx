import { HiStar } from 'react-icons/hi';

export default function RatingStars({ rating = 0, maxRating = 5, size = 'md', showValue = true, count, interactive, onChange }) {
  const sizes = { sm: 'h-3.5 w-3.5', md: 'h-5 w-5', lg: 'h-6 w-6' };

  return (
    <div className="flex items-center gap-1">
      <div className="flex">
        {Array.from({ length: maxRating }, (_, i) => {
          const filled = i < Math.floor(rating);
          const partial = !filled && i < rating;

          return (
            <button
              key={i}
              type="button"
              disabled={!interactive}
              onClick={() => interactive && onChange?.(i + 1)}
              className={`${interactive ? 'cursor-pointer hover:scale-110' : 'cursor-default'} transition-transform`}
            >
              <HiStar
                className={`${sizes[size]} ${
                  filled ? 'text-amber-400' : partial ? 'text-amber-300' : 'text-dark-200 dark:text-dark-600'
                }`}
              />
            </button>
          );
        })}
      </div>
      {showValue && <span className="text-sm font-medium text-dark-700 dark:text-dark-300 ml-1">{rating.toFixed(1)}</span>}
      {count !== undefined && <span className="text-sm text-dark-400">({count})</span>}
    </div>
  );
}
