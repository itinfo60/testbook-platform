import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  HiBadgeCheck,
  HiBookOpen,
  HiClock,
  HiGlobe,
  HiStar,
  HiUser,
  HiVideoCamera,
} from 'react-icons/hi';
import PriceTag from '@/components/common/PriceTag';
import RatingStars from '@/components/common/RatingStars';
export default function CourseCard({ course }) {
  const {
    _id,
    id,
    slug,
    title,
    thumbnail,
    teacher,
    author,
    creator,
    price,
    discountPrice,
    effectivePrice,
    averageRating,
    totalReviews,
    totalDuration,
    category,
    totalLessons,
    description,
    shortDescription,
  } = course;

  const displayThumbnail = thumbnail?.url || thumbnail;
  const displayPrice = effectivePrice ?? price;
  const originalPrice = discountPrice > 0 ? price : undefined;

  const displayDesc =
    shortDescription ||
    description ||
    'Comprehensive course material and expert guidance to help you master this subject.';
  const rawAuthorName = author?.name || creator?.name || teacher?.name;
  const authorName = rawAuthorName || 'Instructor';

  const instructorsList = useMemo(() => {
    const list = [];
    if (teacher && teacher.name) {
      list.push(teacher);
    }
    if (Array.isArray(course.instructors)) {
      course.instructors.forEach((ins) => {
        if (
          ins &&
          ins.name &&
          !list.some(
            (existing) => (existing.id && existing.id === ins.id) || existing.name === ins.name
          )
        ) {
          list.push(ins);
        }
      });
    }
    if (list.length === 0 && rawAuthorName) {
      list.push({ name: rawAuthorName });
    }
    return list;
  }, [teacher, course.instructors, rawAuthorName]);

  const formatDuration = (secs) => {
    if (!secs) return null;
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    return h > 0 ? `${h}h ${m}m` : `${m} min`;
  };

  return (
    <Link
      to={`/courses/${slug || id || _id}`}
      className="group bg-white dark:bg-dark-900 rounded-[20px] border border-dark-200 dark:border-dark-800 overflow-hidden shadow-sm hover:shadow-premium hover:-translate-y-1 transition-all duration-300 flex flex-col h-full relative"
    >
      {/* Thumbnail */}
      <div className="relative aspect-[16/9] w-full bg-dark-50 dark:bg-dark-950 overflow-hidden shrink-0 border-b border-dark-100 dark:border-dark-800">
        {displayThumbnail ? (
          <img
            src={displayThumbnail}
            alt={title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
            onError={(e) => {
              e.currentTarget.onerror = null;
              e.currentTarget.style.display = 'none';
              e.currentTarget.parentNode
                .querySelector('.fallback-icon')
                ?.classList.remove('hidden');
            }}
          />
        ) : null}

        {/* Fallback Icon */}
        <div
          className={`fallback-icon w-full h-full bg-gradient-to-br from-primary-900 via-primary-800 to-primary-950 flex flex-col items-center justify-center absolute inset-0 ${displayThumbnail ? 'hidden' : ''}`}
        >
          <HiBookOpen className="h-10 w-10 text-white/40 mb-2" />
          <span className="text-white/30 text-[10px] font-black tracking-widest uppercase">
            Course
          </span>
        </div>

        {/* Floating Rating Badge */}
        {averageRating > 0 && (
          <div className="absolute top-3 left-3 bg-white/95 dark:bg-dark-900/95 backdrop-blur-md px-2.5 py-1 rounded-lg flex items-center gap-1 shadow-sm border border-dark-200/50 dark:border-dark-700/50">
            <HiStar className="h-3.5 w-3.5 text-amber-500" />
            <span className="text-[11px] font-black text-dark-900 dark:text-white">
              {Number(averageRating).toFixed(1)}
            </span>
            <span className="text-[10px] font-bold text-dark-400">({totalReviews || 0})</span>
          </div>
        )}
      </div>

      {/* Content Body */}
      <div className="p-5 flex flex-col flex-1">
        {/* Category */}
        {category && (
          <span className="text-[11px] font-bold text-primary-600 dark:text-primary-400 uppercase tracking-wider mb-2 block truncate">
            {typeof category === 'string' ? category : category.name}
          </span>
        )}

        {/* Title */}
        <h3 className="text-[17px] sm:text-lg font-black text-dark-900 dark:text-white line-clamp-2 mb-2 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors leading-tight">
          {title}
        </h3>

        {/* Description */}
        <p className="text-[13px] text-dark-500 dark:text-dark-400 line-clamp-2 mb-4 leading-relaxed">
          {displayDesc}
        </p>

        {/* Meta Stats: Teachers, Duration, Lessons */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-[12px] font-medium text-dark-500 dark:text-dark-400 mb-4">
          <div className="flex items-center gap-1.5 flex-wrap max-w-full">
            {instructorsList.map((ins, idx) => {
              const insName = ins.name || 'Instructor';
              const insAvatar = ins.avatar?.url || ins.avatar;
              return (
                <button
                  key={ins.id || ins._id || idx}
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    window.location.href = `/courses?search=${encodeURIComponent(insName)}`;
                  }}
                  className="inline-flex items-center gap-1 text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-semibold transition-colors group/teacher cursor-pointer text-xs"
                  title={`Filter courses by ${insName}`}
                >
                  {insAvatar ? (
                    <img
                      src={insAvatar}
                      alt={insName}
                      className="w-4 h-4 rounded-full object-cover shrink-0 border border-primary-400/40"
                    />
                  ) : (
                    <HiUser className="h-3.5 w-3.5 shrink-0 text-primary-500" />
                  )}
                  <span className="truncate group-hover/teacher:underline">
                    {insName}
                    {idx < instructorsList.length - 1 ? ',' : ''}
                  </span>
                </button>
              );
            })}
          </div>
          {formatDuration(totalDuration) && (
            <div className="flex items-center gap-1.5">
              <HiClock className="h-3.5 w-3.5 shrink-0" />
              {formatDuration(totalDuration)}
            </div>
          )}
          {totalLessons > 0 && (
            <div className="flex items-center gap-1.5">
              <HiBookOpen className="h-3.5 w-3.5 shrink-0" />
              {totalLessons} lessons
            </div>
          )}
        </div>

        {/* Course Includes (Grid Layout spanning full width of the container) */}
        <div className="mt-auto border-t border-dark-100 dark:border-dark-800 pt-4 mb-4">
          <p className="text-[11px] font-bold text-dark-400 dark:text-dark-500 uppercase tracking-wider mb-3">
            This course includes
          </p>
          <div className="grid grid-cols-2 gap-y-3 gap-x-4 w-full">
            <div className="flex items-center gap-2 text-[12px] text-dark-700 dark:text-dark-300 font-medium w-full">
              <HiGlobe className="h-4 w-4 text-emerald-500 shrink-0" />
              <span className="truncate">{course.language || 'English & Hindi'}</span>
            </div>
            <div className="flex items-center gap-2 text-[12px] text-dark-700 dark:text-dark-300 font-medium w-full">
              <HiVideoCamera className="h-4 w-4 text-blue-500 shrink-0" />
              <span className="truncate">{totalLessons || '40+'} Lectures</span>
            </div>
            <div className="flex items-center gap-2 text-[12px] text-dark-700 dark:text-dark-300 font-medium w-full">
              <HiBookOpen className="h-4 w-4 text-indigo-500 shrink-0" />
              <span className="truncate">Mock Tests</span>
            </div>
            <div className="flex items-center gap-2 text-[12px] text-dark-700 dark:text-dark-300 font-medium w-full">
              <HiBadgeCheck className="h-4 w-4 text-amber-500 shrink-0" />
              <span className="truncate">Certificate</span>
            </div>
          </div>
        </div>

        {/* Footer: Price */}
        <div className="pt-4 border-t border-dashed border-dark-200 dark:border-dark-800 flex items-center justify-between gap-3">
          <PriceTag price={displayPrice} originalPrice={originalPrice} size="sm" />
        </div>
      </div>
    </Link>
  );
}
