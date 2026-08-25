import { Link } from 'react-router-dom';
import { HiClipboardList, HiClock, HiUsers, HiArrowRight } from 'react-icons/hi';
export default function TestCard({ test }) {
  const {
    _id,
    id,
    title,
    description,
    duration,
    questionsCount,
    totalQuestions,
    questions,
    totalAttempts,
    attemptCount,
    category,
    difficulty,
    isFree,
    price,
    testType,
  } = test;

  const qCount = questionsCount || totalQuestions || questions?.length || 0;

  const typeLabels = {
    full_length: '🏆 Test Series',
    subject_wise: '📚 Subject Wise',
    topic_wise: '📖 Topic Wise',
    pyq: '📜 PYQ Paper',
  };

  const difficultyColors = {
    easy: 'badge-success',
    medium: 'badge-warning',
    hard: 'badge-danger',
  };

  return (
    <Link to={`/tests/${_id}`} className="card-hover p-4 sm:p-5 group">
      <div className="flex items-start justify-between mb-3 gap-2">
        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 min-w-0">
          <span className="badge-primary truncate max-w-[120px] sm:max-w-none">
            {typeof category === 'object' ? category?.name : category || 'General'}
          </span>
          {testType && (
            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
              {typeLabels[testType] || testType}
            </span>
          )}
          {difficulty && (
            <span className={difficultyColors[difficulty] || 'badge-primary'}>{difficulty}</span>
          )}
        </div>
        <div className="flex-shrink-0">
          {isFree === true && !price ? (
            <span className="badge-success">Free</span>
          ) : price > 0 ? (
            <span className="text-sm font-semibold text-dark-900 dark:text-white">₹{price}</span>
          ) : (
            <span className="badge-success">Free</span>
          )}
        </div>
      </div>

      <h3 className="font-semibold text-dark-900 dark:text-white mb-2 line-clamp-2 group-hover:text-primary-600 transition-colors text-sm sm:text-base">
        {title}
      </h3>
      {description && (
        <p className="text-xs sm:text-sm text-dark-500 dark:text-dark-400 line-clamp-2 mb-3">
          {description}
        </p>
      )}

      <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs text-dark-400 mb-3 sm:mb-4">
        <span className="flex items-center gap-1">
          <HiClipboardList className="h-3.5 w-3.5" />
          {qCount} Qs
        </span>
        <span className="flex items-center gap-1">
          <HiClock className="h-3.5 w-3.5" />
          {duration || 60} min
        </span>
        <span className="flex items-center gap-1">
          <HiUsers className="h-3.5 w-3.5" />
          {totalAttempts || attemptCount || 0}
        </span>
      </div>

      <div className="flex items-center justify-end text-xs sm:text-sm text-primary-600 dark:text-primary-400 font-medium sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
        {Number(price) > 0 && !test.isPurchased ? 'Buy Test' : 'Start Test'}{' '}
        <HiArrowRight className="h-3.5 w-3.5 ml-1" />
      </div>
    </Link>
  );
}
