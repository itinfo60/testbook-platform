import { Link } from 'react-router-dom';
import { HiCheckCircle, HiXCircle, HiMinusCircle } from 'react-icons/hi';
export default function TestResultSummary({ result }) {
  const {
    score, totalScore, percentage, correctAnswers, incorrectAnswers,
    unanswered, totalQuestions, timeTaken, rank, percentile
  } = result || {};

  const getGrade = pct => {
    if (pct >= 90) return { label: 'Excellent!', color: 'text-secondary-500', emoji: '🏆' };
    if (pct >= 75) return { label: 'Great Job!', color: 'text-primary-500', emoji: '🎯' };
    if (pct >= 60) return { label: 'Good', color: 'text-amber-500', emoji: '👍' };
    if (pct >= 40) return { label: 'Average', color: 'text-orange-500', emoji: '📚' };
    return { label: 'Needs Improvement', color: 'text-red-500', emoji: '💪' };
  };

  const pct = percentage || (totalScore ? (score / totalScore) * 100 : 0);
  const grade = getGrade(pct);

  return (
    <div className="max-w-2xl mx-auto">
      {/* Score Card */}
      <div className="card p-8 text-center mb-6">
        <div className="text-5xl mb-3">{grade.emoji}</div>
        <h2 className={`text-2xl font-bold ${grade.color} mb-2`}>{grade.label}</h2>

        <div className="relative inline-flex items-center justify-center my-6">
          <svg className="h-36 w-36" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="8" className="text-dark-100 dark:text-dark-700" />
            <circle
              cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="8"
              strokeDasharray={`${2 * Math.PI * 45}`}
              strokeDashoffset={`${2 * Math.PI * 45 * (1 - pct / 100)}`}
              strokeLinecap="round"
              className={grade.color}
              transform="rotate(-90 50 50)"
            />
          </svg>
          <div className="absolute text-center">
            <div className="text-3xl font-bold text-dark-900 dark:text-white">{Math.round(pct)}%</div>
            <div className="text-xs text-dark-400">Score</div>
          </div>
        </div>

        <p className="text-dark-500">
          You scored <span className="font-semibold text-dark-900 dark:text-white">{score || 0}</span> out of <span className="font-semibold">{totalScore || totalQuestions || 0}</span>
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <div className="card p-4 text-center">
          <HiCheckCircle className="h-6 w-6 text-secondary-500 mx-auto mb-1" />
          <div className="text-xl font-bold text-dark-900 dark:text-white">{correctAnswers || 0}</div>
          <div className="text-xs text-dark-400">Correct</div>
        </div>
        <div className="card p-4 text-center">
          <HiXCircle className="h-6 w-6 text-red-500 mx-auto mb-1" />
          <div className="text-xl font-bold text-dark-900 dark:text-white">{incorrectAnswers || 0}</div>
          <div className="text-xs text-dark-400">Incorrect</div>
        </div>
        <div className="card p-4 text-center">
          <HiMinusCircle className="h-6 w-6 text-dark-400 mx-auto mb-1" />
          <div className="text-xl font-bold text-dark-900 dark:text-white">{unanswered || 0}</div>
          <div className="text-xs text-dark-400">Skipped</div>
        </div>
        <div className="card p-4 text-center">
          <div className="text-2xl mb-1">⏱️</div>
          <div className="text-xl font-bold text-dark-900 dark:text-white">{timeTaken || '-'}</div>
          <div className="text-xs text-dark-400">Time</div>
        </div>
      </div>

      {(rank || percentile) && (
        <div className="card p-4 flex items-center justify-around mb-6">
          {rank && (
            <div className="text-center">
              <div className="text-sm text-dark-400">Your Rank</div>
              <div className="text-2xl font-bold text-dark-900 dark:text-white">#{rank}</div>
            </div>
          )}
          {percentile && (
            <div className="text-center">
              <div className="text-sm text-dark-400">Percentile</div>
              <div className="text-2xl font-bold text-primary-600">{percentile}%</div>
            </div>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3 justify-center">
        <Link to="/tests" className="btn-outline">Back to Tests</Link>
        <Link to="/leaderboard" className="btn-primary">View Leaderboard</Link>
      </div>
    </div>
  );
}
