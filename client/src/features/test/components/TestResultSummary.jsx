import { Link } from 'react-router-dom';
import {
  HiCheckCircle,
  HiXCircle,
  HiMinusCircle,
  HiAcademicCap,
  HiRefresh,
  HiArrowRight,
} from 'react-icons/hi';

export default function TestResultSummary({ result, onViewSolutions, testId }) {
  // Support both nested and flat result structure
  const attempt = result?.attempt || result || {};
  const score = attempt.score;
  const totalMarks = attempt.totalMarks;
  const passed = attempt.passed !== undefined ? attempt.passed : attempt.isPassed;
  const timeTaken = attempt.timeTaken;
  const attemptId = attempt.attemptId || attempt._id;
  const rank = attempt.rank || result?.rank;
  const resolvedTestId =
    testId || attempt.test?._id || attempt.test || result?.test?._id || result?.test;

  // If stats aren't provided (e.g. when fetching a past attempt), compute them from answers
  let stats = result?.stats || {};
  if ((stats.correct === undefined || stats.correct === null) && attempt.answers) {
    const questionsList = result?.questions || attempt.test?.questions || [];
    const correctCount = attempt.answers.filter((a) => a.isCorrect).length;
    const incorrectCount = attempt.answers.filter(
      (a) => !a.isCorrect && ((a.selectedOptions && a.selectedOptions.length > 0) || a.textAnswer)
    ).length;
    const unansweredCount = Math.max(0, questionsList.length - correctCount - incorrectCount);
    stats = {
      correct: correctCount,
      incorrect: incorrectCount,
      unanswered: unansweredCount,
      percentile: stats.percentile || 0,
    };
  }
  const { correct, incorrect, unanswered, percentile } = stats;
  const hasRank = rank !== undefined && rank !== null && rank !== '';
  const hasPercentile = percentile !== undefined && percentile !== null && percentile !== '';

  const getGrade = (pct) => {
    if (pct >= 90)
      return {
        label: 'Excellent!',
        color: 'text-green-500',
        emoji: '🏆',
        message: 'Outstanding performance!',
      };
    if (pct >= 75)
      return {
        label: 'Great Job!',
        color: 'text-blue-500',
        emoji: '🎯',
        message: 'You are on the right track.',
      };
    if (pct >= 60)
      return {
        label: 'Good',
        color: 'text-amber-500',
        emoji: '👍',
        message: 'Keep practicing to improve.',
      };
    if (pct >= 40)
      return {
        label: 'Average',
        color: 'text-orange-500',
        emoji: '📚',
        message: 'Focus on your weak areas.',
      };
    return {
      label: 'Needs Improvement',
      color: 'text-red-500',
      emoji: '💪',
      message: "Don't give up, review the syllabus.",
    };
  };

  const pct = totalMarks ? (score / totalMarks) * 100 : 0;
  const grade = getGrade(pct);
  const accuracy =
    correct + incorrect > 0 ? Math.round((correct / (correct + incorrect)) * 100) : 0;

  return (
    <div className="max-w-3xl mx-auto">
      {/* Score Card */}
      <div className="bg-white dark:bg-dark-900 rounded-3xl p-6 sm:p-10 text-center mb-6 shadow-sm border border-slate-200 dark:border-dark-800">
        <div className="text-5xl sm:text-6xl mb-4 animate-bounce-short">{grade.emoji}</div>
        <h2 className={`text-2xl sm:text-3xl font-extrabold ${grade.color} mb-2 font-display`}>
          {grade.label}
        </h2>
        <p className="text-slate-500 text-sm font-medium mb-6">{grade.message}</p>

        <div className="relative inline-flex items-center justify-center my-4 sm:my-6 bg-slate-50 dark:bg-dark-800 p-6 rounded-full shadow-inner border border-slate-100 dark:border-dark-700">
          <svg className="h-32 w-32 sm:h-40 sm:w-40" viewBox="0 0 100 100">
            <circle
              cx="50"
              cy="50"
              r="45"
              fill="none"
              stroke="currentColor"
              strokeWidth="8"
              className="text-slate-200 dark:text-dark-700"
            />
            <circle
              cx="50"
              cy="50"
              r="45"
              fill="none"
              stroke="currentColor"
              strokeWidth="8"
              strokeDasharray={`${2 * Math.PI * 45}`}
              strokeDashoffset={`${2 * Math.PI * 45 * (1 - pct / 100)}`}
              strokeLinecap="round"
              className={grade.color}
              transform="rotate(-90 50 50)"
            />
          </svg>
          <div className="absolute text-center flex flex-col items-center justify-center">
            <div className="text-3xl sm:text-4xl font-extrabold text-dark-900 dark:text-white">
              {Math.round(pct)}%
            </div>
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mt-1">
              Score
            </div>
          </div>
        </div>

        <div className="mt-4 inline-flex items-center gap-2 bg-slate-100 dark:bg-dark-800 px-4 py-2 rounded-xl text-sm sm:text-base font-bold text-slate-700 dark:text-slate-300">
          Total Score: <span className={grade.color}>{score || 0}</span>{' '}
          <span className="text-slate-400 font-medium">out of {totalMarks || 0}</span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 sm:gap-4 mb-6">
        <div className="bg-white dark:bg-dark-900 rounded-2xl border border-slate-200 dark:border-dark-800 p-4 text-center shadow-sm">
          <HiCheckCircle className="h-6 w-6 text-green-500 mx-auto mb-2" />
          <div className="text-xl sm:text-2xl font-extrabold text-dark-900 dark:text-white">
            {correct || 0}
          </div>
          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mt-1">
            Correct
          </div>
        </div>
        <div className="bg-white dark:bg-dark-900 rounded-2xl border border-slate-200 dark:border-dark-800 p-4 text-center shadow-sm">
          <HiXCircle className="h-6 w-6 text-red-500 mx-auto mb-2" />
          <div className="text-xl sm:text-2xl font-extrabold text-dark-900 dark:text-white">
            {incorrect || 0}
          </div>
          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mt-1">
            Incorrect
          </div>
        </div>
        <div className="bg-white dark:bg-dark-900 rounded-2xl border border-slate-200 dark:border-dark-800 p-4 text-center shadow-sm">
          <HiMinusCircle className="h-6 w-6 text-slate-400 mx-auto mb-2" />
          <div className="text-xl sm:text-2xl font-extrabold text-dark-900 dark:text-white">
            {unanswered || 0}
          </div>
          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mt-1">
            Skipped
          </div>
        </div>
        <div className="bg-white dark:bg-dark-900 rounded-2xl border border-slate-200 dark:border-dark-800 p-4 text-center shadow-sm">
          <div className="text-xl sm:text-2xl mb-2 h-6 flex items-center justify-center">🎯</div>
          <div className="text-xl sm:text-2xl font-extrabold text-blue-600">{accuracy}%</div>
          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mt-1">
            Accuracy
          </div>
        </div>
        <div className="bg-white dark:bg-dark-900 rounded-2xl border border-slate-200 dark:border-dark-800 p-4 text-center shadow-sm col-span-2 sm:col-span-1">
          <div className="text-xl sm:text-2xl mb-2 h-6 flex items-center justify-center">⏱️</div>
          <div className="text-xl sm:text-2xl font-extrabold text-amber-600">
            {timeTaken || '-'}
          </div>
          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mt-1">
            Time
          </div>
        </div>
      </div>

      {/* Accuracy Donut Chart */}
      {correct !== undefined && incorrect !== undefined && (
        <div className="bg-white dark:bg-dark-900 rounded-2xl border border-slate-200 dark:border-dark-800 p-6 shadow-sm mb-6">
          <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-5 text-center">
            Performance Breakdown
          </h3>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-8">
            {/* Donut SVG */}
            {(() => {
              const total = (correct || 0) + (incorrect || 0) + (unanswered || 0);
              if (total === 0) return null;
              const r = 60;
              const circ = 2 * Math.PI * r;
              const correctPct = (correct || 0) / total;
              const incorrectPct = (incorrect || 0) / total;
              const correctDash = correctPct * circ;
              const incorrectDash = incorrectPct * circ;
              const skippedDash = circ - correctDash - incorrectDash;
              return (
                <svg width="160" height="160" viewBox="0 0 160 160" className="flex-shrink-0">
                  {/* Background */}
                  <circle cx="80" cy="80" r={r} fill="none" stroke="#f1f5f9" strokeWidth="18" />
                  {/* Skipped (slate) */}
                  <circle
                    cx="80"
                    cy="80"
                    r={r}
                    fill="none"
                    stroke="#94a3b8"
                    strokeWidth="18"
                    strokeDasharray={`${skippedDash} ${circ - skippedDash}`}
                    strokeDashoffset={-correctDash - incorrectDash}
                    strokeLinecap="butt"
                    transform="rotate(-90 80 80)"
                  />
                  {/* Incorrect (red) */}
                  <circle
                    cx="80"
                    cy="80"
                    r={r}
                    fill="none"
                    stroke="#ef4444"
                    strokeWidth="18"
                    strokeDasharray={`${incorrectDash} ${circ - incorrectDash}`}
                    strokeDashoffset={-correctDash}
                    strokeLinecap="butt"
                    transform="rotate(-90 80 80)"
                  />
                  {/* Correct (green) */}
                  <circle
                    cx="80"
                    cy="80"
                    r={r}
                    fill="none"
                    stroke="#22c55e"
                    strokeWidth="18"
                    strokeDasharray={`${correctDash} ${circ - correctDash}`}
                    strokeDashoffset={0}
                    strokeLinecap="butt"
                    transform="rotate(-90 80 80)"
                  />
                  {/* Center text */}
                  <text
                    x="80"
                    y="74"
                    textAnchor="middle"
                    className="text-3xl"
                    fontSize="26"
                    fontWeight="800"
                    fill="currentColor"
                  >
                    {Math.round((correct / total) * 100)}%
                  </text>
                  <text
                    x="80"
                    y="94"
                    textAnchor="middle"
                    fontSize="10"
                    fontWeight="600"
                    fill="#94a3b8"
                  >
                    ACCURACY
                  </text>
                </svg>
              );
            })()}
            {/* Legend */}
            <div className="space-y-3">
              {[
                { color: 'bg-green-500', label: 'Correct', value: correct || 0 },
                { color: 'bg-red-500', label: 'Incorrect', value: incorrect || 0 },
                { color: 'bg-slate-400', label: 'Skipped', value: unanswered || 0 },
              ].map((item) => (
                <div key={item.label} className="flex items-center gap-3">
                  <div className={`h-3 w-3 rounded-full ${item.color} flex-shrink-0`}></div>
                  <span className="text-sm font-bold text-dark-700 dark:text-dark-300 w-20">
                    {item.label}
                  </span>
                  <span className="text-sm font-extrabold text-dark-900 dark:text-white">
                    {item.value}
                  </span>
                  <span className="text-xs text-slate-400">
                    (
                    {(
                      (item.value / ((correct || 0) + (incorrect || 0) + (unanswered || 0))) *
                        100 || 0
                    ).toFixed(0)}
                    %)
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Advanced Analytics (Rank, Percentile, Strong/Weak) */}
      <div className="grid sm:grid-cols-2 gap-4 mb-8">
        {(hasRank || hasPercentile) && (
          <div className="bg-white dark:bg-dark-900 rounded-2xl border border-slate-200 dark:border-dark-800 p-6 flex flex-col justify-center gap-6 shadow-sm">
            {hasRank && (
              <div className="flex items-center justify-between">
                <div className="text-sm font-bold text-slate-500 uppercase tracking-wider">
                  Your Rank
                </div>
                <div className="text-2xl font-extrabold text-dark-900 dark:text-white bg-slate-100 dark:bg-dark-800 px-3 py-1 rounded-lg">
                  #{rank}
                </div>
              </div>
            )}
            {hasPercentile && (
              <div className="flex items-center justify-between border-t border-slate-100 dark:border-dark-800 pt-6">
                <div className="text-sm font-bold text-slate-500 uppercase tracking-wider">
                  Percentile
                </div>
                <div className="text-2xl font-extrabold text-blue-600 bg-blue-50 dark:bg-blue-900/20 px-3 py-1 rounded-lg">
                  {percentile}%
                </div>
              </div>
            )}
          </div>
        )}

        {/* Mock Topic Analysis */}
        <div className="bg-white dark:bg-dark-900 rounded-2xl border border-slate-200 dark:border-dark-800 p-6 shadow-sm flex-1">
          <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4 border-b border-slate-100 dark:border-dark-800 pb-2">
            Topic Analysis
          </h3>
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between text-xs font-bold mb-1.5">
                <span className="text-green-600">Strong Area: Indian Polity</span>
                <span className="text-slate-500">85%</span>
              </div>
              <div className="h-2 w-full bg-slate-100 dark:bg-dark-800 rounded-full overflow-hidden">
                <div className="h-full bg-green-500 w-[85%] rounded-full"></div>
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between text-xs font-bold mb-1.5">
                <span className="text-orange-500">Average: Current Affairs</span>
                <span className="text-slate-500">60%</span>
              </div>
              <div className="h-2 w-full bg-slate-100 dark:bg-dark-800 rounded-full overflow-hidden">
                <div className="h-full bg-orange-400 w-[60%] rounded-full"></div>
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between text-xs font-bold mb-1.5">
                <span className="text-red-500">Weak Area: Rajasthan Geography</span>
                <span className="text-slate-500">30%</span>
              </div>
              <div className="h-2 w-full bg-slate-100 dark:bg-dark-800 rounded-full overflow-hidden">
                <div className="h-full bg-red-500 w-[30%] rounded-full"></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap items-center justify-center gap-3">
        {onViewSolutions && (
          <button
            onClick={onViewSolutions}
            className="bg-primary-600 hover:bg-primary-700 text-white font-bold py-3 px-8 rounded-xl shadow-md transition-all flex items-center gap-2 text-sm cursor-pointer"
          >
            <HiAcademicCap className="h-4 w-4" /> View Detailed Solutions
          </button>
        )}
        {resolvedTestId && (
          <Link
            to={`/tests/${resolvedTestId}`}
            className="bg-amber-500 hover:bg-amber-600 text-white font-bold py-3 px-6 rounded-xl transition-all shadow-md flex items-center gap-2 text-sm"
          >
            <HiRefresh className="h-4 w-4" /> Reattempt Test
          </Link>
        )}
        <Link
          to="/tests"
          className="bg-white dark:bg-dark-900 border border-slate-200 dark:border-dark-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-dark-800 font-bold py-3 px-6 rounded-xl transition-colors shadow-sm text-center text-sm"
        >
          Browse Tests
        </Link>
        <Link
          to="/leaderboard"
          className="bg-slate-100 dark:bg-dark-800 hover:bg-slate-200 dark:hover:bg-dark-700 text-slate-700 dark:text-slate-300 font-bold py-3 px-6 rounded-xl transition-colors text-center text-sm"
        >
          Leaderboard
        </Link>
      </div>
    </div>
  );
}
