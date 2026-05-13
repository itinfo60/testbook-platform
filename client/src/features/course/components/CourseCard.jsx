import { Link } from 'react-router-dom';
import { HiBookOpen, HiUser, HiClock } from 'react-icons/hi';
import PriceTag from '@/components/common/PriceTag';
import RatingStars from '@/components/common/RatingStars';
export default function CourseCard({ course }) {
  const {
    _id,
    title,
    thumbnail,
    instructor,
    price,
    originalPrice,
    rating,
    reviewCount,
    studentsEnrolled,
    duration,
    level,
    category,
    lessonsCount,
    lessons,
  } = course;

  const totalLessons = lessonsCount || lessons?.length || 0;

  const levelColors = {
    beginner: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    intermediate: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    advanced: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  };

  return (
    <Link to={`/courses/${_id}`} className="card-hover overflow-hidden group">
      {/* Thumbnail */}
      <div className="relative h-44 bg-dark-100 dark:bg-dark-700 overflow-hidden">
        {thumbnail ? (
          <img src={thumbnail} alt={title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center">
            <HiBookOpen className="h-12 w-12 text-white/50" />
          </div>
        )}
        {level && (
          <span className={`absolute top-3 left-3 badge ${levelColors[level] || levelColors.beginner}`}>
            {level}
          </span>
        )}
        {category && (
          <span className="absolute top-3 right-3 badge bg-white/90 dark:bg-dark-800/90 text-dark-700 dark:text-dark-300 backdrop-blur-sm">
            {typeof category === 'string' ? category : category.name}
          </span>
        )}
      </div>

      {/* Content */}
      <div className="p-5">
        <h3 className="font-semibold text-dark-900 dark:text-white line-clamp-2 mb-2 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
          {title}
        </h3>

        <div className="flex items-center gap-2 mb-3">
          <div className="h-5 w-5 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
            <HiUser className="h-3 w-3 text-primary-600 dark:text-primary-400" />
          </div>
          <span className="text-sm text-dark-500 dark:text-dark-400 truncate">
            {instructor?.name || 'Instructor'}
          </span>
        </div>

        <div className="flex items-center gap-3 mb-3 text-xs text-dark-400">
          {totalLessons > 0 && (
            <span className="flex items-center gap-1">
              <HiBookOpen className="h-3.5 w-3.5" />
              {totalLessons} lessons
            </span>
          )}
          {duration && (
            <span className="flex items-center gap-1">
              <HiClock className="h-3.5 w-3.5" />
              {duration}
            </span>
          )}
        </div>

        <div className="flex items-center justify-between pt-3 border-t border-dark-100 dark:border-dark-700">
          <PriceTag price={price} originalPrice={originalPrice} size="sm" />
          <RatingStars rating={rating || 0} count={reviewCount} size="sm" />
        </div>
      </div>
    </Link>
  );
}
