import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  HiUsers,
  HiQuestionMarkCircle,
  HiClock,
  HiAcademicCap,
  HiLockClosed,
  HiPlay,
  HiCheckCircle,
  HiShare,
  HiInformationCircle,
  HiX,
} from 'react-icons/hi';

export default function TestItemCard({ test, isLocked, onShare, onUnlock }) {
  const [showSyllabusModal, setShowSyllabusModal] = useState(false);

  const attempt = test.userAttempt;
  const targetTestId = test.id || test._id || test.realTestId || test.slug;

  return (
    <div className="bg-white dark:bg-dark-900 rounded-2xl p-4 sm:p-4.5 border border-slate-200 dark:border-dark-800 shadow-sm hover:shadow-md hover:border-primary-400 dark:hover:border-primary-500 transition-all duration-200 relative group flex flex-col justify-between h-full">
      <div>
        {/* Compact Top Header Row */}
        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-1.5 min-w-0">
            {test.isFree ? (
              <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/40">
                Free
              </span>
            ) : isLocked ? (
              <span className="px-2 py-0.5 rounded-md text-[10px] font-medium uppercase tracking-wider bg-slate-50 text-slate-600 dark:bg-dark-800 dark:text-dark-400 flex items-center gap-1 border border-slate-200 dark:border-dark-700">
                <HiLockClosed className="h-2.5 w-2.5" /> Locked
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold uppercase tracking-wider bg-primary-50 text-primary-700 dark:bg-primary-950/60 dark:text-primary-300 border border-primary-100 dark:border-primary-800">
                Pro
              </span>
            )}
            {test.subjectTag && (
              <span className="text-[10px] font-medium text-slate-600 dark:text-dark-400 bg-slate-50 dark:bg-dark-800 px-2 py-0.5 rounded-md truncate max-w-[130px] border border-slate-100 dark:border-dark-700">
                {test.subjectTag}
              </span>
            )}
          </div>

          {test.userCountStr && (
            <span className="flex items-center gap-1 text-[10px] font-medium text-slate-600 dark:text-dark-400 shrink-0">
              <HiUsers className="h-3 w-3 text-slate-600" /> {test.userCountStr}
            </span>
          )}
        </div>

        {/* Test Title */}
        <h3 className="text-sm sm:text-base font-semibold text-dark-900 dark:text-white mb-2.5 line-clamp-2 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors leading-snug">
          {test.title}
        </h3>

        {/* Compact Inline Specs Bar */}
        <div className="flex items-center gap-2.5 text-xs font-normal text-slate-600 dark:text-dark-400 bg-slate-50 dark:bg-dark-950 px-3 py-1.5 rounded-xl border border-slate-100 dark:border-dark-800 mb-3">
          <span className="flex items-center gap-1 text-slate-700 dark:text-slate-300 font-medium">
            <HiQuestionMarkCircle className="h-3.5 w-3.5 text-primary-500" />
            {test.questionsCount || test.questions?.length || 15} Qs
          </span>
          <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-dark-700" />
          <span className="flex items-center gap-1 text-slate-700 dark:text-slate-300 font-medium">
            <HiAcademicCap className="h-3.5 w-3.5 text-primary-500" />
            {test.totalMarks || 20} Marks
          </span>
          <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-dark-700" />
          <span className="flex items-center gap-1 text-slate-700 dark:text-slate-300 font-medium">
            <HiClock className="h-3.5 w-3.5 text-primary-500" />
            {test.duration || 18} Mins
          </span>
        </div>

        {/* Attempt Details */}
        {attempt && (
          <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/50 rounded-xl p-2.5 mb-3 flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <HiCheckCircle className="h-4 w-4 text-emerald-500" />
              <span className="text-xs font-medium text-emerald-700 dark:text-emerald-400">
                Score: <span className="font-bold">{attempt.score || 0}</span>
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <Link
                to={`/tests/${targetTestId || test._id}/result`}
                className="bg-white dark:bg-dark-800 text-emerald-600 dark:text-emerald-400 font-semibold px-2.5 py-1 rounded-lg text-[10px] hover:bg-emerald-100 transition-colors shadow-sm"
              >
                Result
              </Link>
              <Link
                to={`/tests/${targetTestId || test._id}`}
                className="bg-emerald-600 text-white font-semibold px-2.5 py-1 rounded-lg text-[10px] hover:bg-emerald-700 transition-colors shadow-sm"
              >
                Reattempt
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* Action Footer */}
      <div className="flex items-center justify-between pt-2.5 border-t border-slate-100 dark:border-dark-800">
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setShowSyllabusModal(true)}
            className="flex items-center justify-center h-8 w-8 rounded-lg bg-slate-50 hover:bg-primary-50 dark:bg-dark-800 dark:hover:bg-primary-950/40 text-slate-600 hover:text-primary-600 dark:text-dark-400 transition-colors"
            title="Syllabus & Info"
          >
            <HiInformationCircle className="h-4 w-4" />
          </button>
          <button
            onClick={() => onShare && onShare(test)}
            className="flex items-center justify-center h-8 w-8 rounded-lg bg-slate-50 hover:bg-primary-50 dark:bg-dark-800 dark:hover:bg-primary-950/40 text-slate-600 hover:text-primary-600 dark:text-dark-400 transition-colors"
            title="Share Test"
          >
            <HiShare className="h-3.5 w-3.5" />
          </button>
        </div>

        {!attempt &&
          (isLocked ? (
            <button
              onClick={() => onUnlock && onUnlock(test)}
              className="bg-primary-50 hover:bg-primary-100 dark:bg-primary-950/40 dark:hover:bg-primary-900/60 text-primary-700 dark:text-primary-300 font-semibold px-4 py-1.5 rounded-xl text-xs flex items-center gap-1.5 border border-primary-100 dark:border-primary-800 transition-all shadow-sm"
            >
              <HiLockClosed className="h-3 w-3 text-primary-500" /> Unlock Now
            </button>
          ) : (
            <Link
              to={`/tests/${targetTestId}`}
              className="bg-primary-600 hover:bg-primary-700 text-white font-semibold px-4 py-1.5 rounded-xl text-xs flex items-center gap-1.5 shadow-sm hover:shadow transition-all"
            >
              <HiPlay className="h-3 w-3" /> Start Now
            </Link>
          ))}
      </div>

      {/* Syllabus Modal */}
      {showSyllabusModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white dark:bg-dark-900 rounded-[32px] p-8 max-w-lg w-full shadow-2xl border border-dark-100 dark:border-dark-800 relative">
            <button
              onClick={() => setShowSyllabusModal(false)}
              className="absolute top-5 right-5 p-2 bg-dark-50 hover:bg-dark-100 dark:bg-dark-800 dark:hover:bg-dark-700 text-dark-500 dark:text-white rounded-full transition-colors cursor-pointer"
            >
              <HiX className="h-5 w-5" />
            </button>
            <div className="flex items-center gap-3 mb-6 border-b border-dark-100 dark:border-dark-800 pb-4">
              <div className="h-10 w-10 rounded-2xl bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-primary-600">
                <HiInformationCircle className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-xl font-black text-dark-900 dark:text-white">Test Details</h3>
                <p className="text-[11px] font-bold text-dark-500">Syllabus & Pattern Overview</p>
              </div>
            </div>

            <p className="text-sm font-bold text-dark-900 dark:text-white mb-5">{test.title}</p>

            <div className="bg-dark-50 dark:bg-dark-950 p-5 rounded-2xl text-xs sm:text-sm text-dark-600 dark:text-dark-300 space-y-3 mb-8 border border-dark-100 dark:border-dark-800 font-medium">
              <p className="flex items-start gap-2">
                <span className="text-dark-400 mt-0.5">•</span>
                <span>
                  <strong>Subject:</strong>{' '}
                  {test.subjectTag || test.category?.name || 'General Studies'}
                </span>
              </p>
              <p className="flex items-start gap-2">
                <span className="text-dark-400 mt-0.5">•</span>
                <span>
                  <strong>Questions:</strong> {test.questionsCount || test.questions?.length || 15}{' '}
                  MCQs
                </span>
              </p>
              <p className="flex items-start gap-2">
                <span className="text-dark-400 mt-0.5">•</span>
                <span>
                  <strong>Max Marks:</strong> {test.totalMarks || 20} Marks
                </span>
              </p>
              <p className="flex items-start gap-2">
                <span className="text-dark-400 mt-0.5">•</span>
                <span>
                  <strong>Time Allowed:</strong> {test.duration || 18} Minutes
                </span>
              </p>
              <p className="flex items-start gap-2">
                <span className="text-dark-400 mt-0.5">•</span>
                <span>
                  <strong>Marking Scheme:</strong> +
                  {test.positiveMarks || (test.totalMarks / (test.questionsCount || 15)).toFixed(2)}{' '}
                  correct, -{test.negativeMarks || '0.33'} wrong
                </span>
              </p>
              <p className="flex items-start gap-2">
                <span className="text-dark-400 mt-0.5">•</span>
                <span>
                  <strong>Language:</strong> English & Hindi Medium
                </span>
              </p>
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowSyllabusModal(false)}
                className="btn-outline text-xs px-5 py-2.5 font-bold"
              >
                Close
              </button>
              {!isLocked && (
                <Link
                  to={`/tests/${targetTestId}`}
                  className="btn-primary text-xs px-6 py-2.5 flex items-center gap-1.5 shadow-md"
                >
                  <HiPlay className="h-4 w-4" /> Start Test
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
