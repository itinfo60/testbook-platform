import { Link } from 'react-router-dom';
import { HiClipboardList, HiClock, HiUsers, HiArrowRight } from 'react-icons/hi';
export default function TestCard({ test }) {
  const {
    _id, title, description, duration, questionsCount, totalQuestions, questions,
    totalAttempts, attemptCount, category, difficulty, isFree, price
  } = test;

  const qCount = questionsCount || totalQuestions || questions?.length || 0;

  const difficultyColors = {
    easy: 'badge-success',
    medium: 'badge-warning',
    hard: 'badge-danger',
  };

  return (
    <Link to={`/tests/${_id}`} className="card-hover p-5 group">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="badge-primary">{typeof category === 'object' ? category?.name : category || 'General'}</span>
          {difficulty && <span className={difficultyColors[difficulty] || 'badge-primary'}>{difficulty}</span>}
        </div>
        {isFree === true && !price ? (
          <span className="badge-success">Free</span>
        ) : price > 0 ? (
          <span className="text-sm font-semibold text-dark-900 dark:text-white">₹{price}</span>
        ) : (
          <span className="badge-success">Free</span>
        )}
      </div>

      <h3 className="font-semibold text-dark-900 dark:text-white mb-2 line-clamp-2 group-hover:text-primary-600 transition-colors">
        {title}
      </h3>
      {description && (
        <p className="text-sm text-dark-500 dark:text-dark-400 line-clamp-2 mb-3">{description}</p>
      )}

      <div className="flex flex-wrap items-center gap-4 text-xs text-dark-400 mb-4">
        <span className="flex items-center gap-1"><HiClipboardList className="h-3.5 w-3.5" />{qCount} Questions</span>
        <span className="flex items-center gap-1"><HiClock className="h-3.5 w-3.5" />{duration || 60} min</span>
        <span className="flex items-center gap-1"><HiUsers className="h-3.5 w-3.5" />{totalAttempts || attemptCount || 0} attempts</span>
      </div>

      <div className="flex items-center justify-end text-sm text-primary-600 dark:text-primary-400 font-medium opacity-0 group-hover:opacity-100 transition-opacity">
        {(Number(price) > 0 && !test.isPurchased) ? 'Buy Test' : 'Start Test'} <HiArrowRight className="h-3.5 w-3.5 ml-1" />
      </div>
    </Link>
  );
}
