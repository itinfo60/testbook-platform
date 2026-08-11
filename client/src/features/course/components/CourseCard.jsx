import { Link } from 'react-router-dom';
import { HiBookOpen, HiUser, HiClock } from 'react-icons/hi';
import PriceTag from '@/components/common/PriceTag';
import RatingStars from '@/components/common/RatingStars';
export default function CourseCard({ course }) {
  const {
    _id,
    title,
    thumbnail,
    teacher,
    price,
    discountPrice,
    effectivePrice,
    averageRating,
    totalReviews,
    totalDuration,
    level,
    category,
    totalLessons,
  } = course;

  const displayThumbnail = thumbnail?.url || thumbnail;
  const displayPrice = effectivePrice ?? price;
  const originalPrice = discountPrice > 0 ? price : undefined;

  const formatDuration = (secs) => {
    if (!secs) return null;
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    return h > 0 ? `${h}h ${m}m` : `${m} min`;
  };

  const levelColors = {
    beginner: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    intermediate: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    advanced: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  };

  return (
    <Link to={`/courses/${_id}`} className="card-hover overflow-hidden group">
      {/* Thumbnail */}
      <div className="relative h-40 sm:h-44 bg-dark-100 dark:bg-dark-700 overflow-hidden">
        {displayThumbnail ? (
          <img
            src={displayThumbnail}
            alt={title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            onError={(e) => {
              e.currentTarget.onerror = null;
              e.currentTarget.style.display = 'none';
              e.currentTarget.parentNode
                .querySelector('.fallback-icon')
                ?.classList.remove('hidden');
            }}
          />
        ) : null}
        <div
          className={`fallback-icon w-full h-full bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center absolute inset-0 ${displayThumbnail ? 'hidden' : ''}`}
        >
          <HiBookOpen className="h-10 w-10 sm:h-12 sm:w-12 text-white/50" />
        </div>
        {level && (
          <span
            className={`absolute top-2 sm:top-3 left-2 sm:left-3 badge ${levelColors[level] || levelColors.beginner} text-xs`}
          >
            {level}
          </span>
        )}
        {category && (
          <span className="absolute top-2 sm:top-3 right-2 sm:right-3 badge bg-white/90 dark:bg-dark-800/90 text-dark-700 dark:text-dark-300 backdrop-blur-sm text-xs truncate max-w-[100px]">
            {typeof category === 'string' ? category : category.name}
          </span>
        )}
      </div>

      {/* Content */}
      <div className="p-4 sm:p-5">
        <h3 className="font-semibold text-dark-900 dark:text-white line-clamp-2 mb-2 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors text-sm sm:text-base">
          {title}
        </h3>

        <div className="flex items-center gap-2 mb-2 sm:mb-3">
          <div className="h-5 w-5 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center flex-shrink-0">
            <HiUser className="h-3 w-3 text-primary-600 dark:text-primary-400" />
          </div>
          <span className="text-xs sm:text-sm text-dark-500 dark:text-dark-400 truncate">
            {teacher?.name || 'Instructor'}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-2 sm:mb-3 text-xs text-dark-400">
          {totalLessons > 0 && (
            <span className="flex items-center gap-1">
              <HiBookOpen className="h-3.5 w-3.5" />
              {totalLessons} lessons
            </span>
          )}
          {formatDuration(totalDuration) && (
            <span className="flex items-center gap-1">
              <HiClock className="h-3.5 w-3.5" />
              {formatDuration(totalDuration)}
            </span>
          )}
        </div>

        <div className="flex items-center justify-between pt-2 sm:pt-3 border-t border-dark-100 dark:border-dark-700">
          <PriceTag price={displayPrice} originalPrice={originalPrice} size="sm" />
          <RatingStars rating={averageRating || 0} count={totalReviews} size="sm" />
        </div>
      </div>
    </Link>
  );
}
