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
  const isValidId =
    (test._id && /^[0-9a-fA-F]{24}$/.test(test._id)) ||
    (test.realTestId && /^[0-9a-fA-F]{24}$/.test(test.realTestId));
  const targetTestId = test._id && /^[0-9a-fA-F]{24}$/.test(test._id) ? test._id : test.realTestId;

  return (
    <div className="bg-white dark:bg-dark-900 rounded-3xl p-5 border border-dark-100 dark:border-dark-800 shadow-sm hover:shadow-md transition-all relative group flex flex-col justify-between">
      <div>
        {/* Top Header Badge */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            {test.isFree ? (
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                Free
              </span>
            ) : isLocked ? (
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-dark-100 text-dark-600 dark:bg-dark-800 dark:text-dark-400 flex items-center gap-1">
                <HiLockClosed className="h-3 w-3" /> Locked
              </span>
            ) : (
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-primary-100 text-primary-700 dark:bg-primary-950 dark:text-primary-300">
                Pro
              </span>
            )}
            {test.subjectTag && (
              <span className="text-[11px] font-bold text-dark-500 dark:text-dark-400">
                • {test.subjectTag}
              </span>
            )}
          </div>
          {test.userCountStr && (
            <span className="flex items-center gap-1 text-[11px] font-bold text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-950/40 px-2 py-0.5 rounded-md">
              <HiUsers className="h-3.5 w-3.5" /> {test.userCountStr}
            </span>
          )}
        </div>

        {/* Test Title */}
        <h3 className="text-base font-extrabold text-dark-900 dark:text-white mb-3 line-clamp-2 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors leading-snug">
          {test.title}
        </h3>

        {/* Test Parameters Bar (Users, Qs, Marks, Mins) */}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-bold text-dark-500 dark:text-dark-400 mb-4 bg-dark-50 dark:bg-dark-800/50 p-2.5 rounded-2xl border border-dark-100 dark:border-dark-700/50">
          <span className="flex items-center gap-1">
            <HiQuestionMarkCircle className="h-3.5 w-3.5 text-blue-500" />{' '}
            {test.questionsCount || test.questions?.length || 15} Questions
          </span>
          <span className="w-px h-3 bg-dark-200 dark:bg-dark-700" />
          <span className="flex items-center gap-1">
            <HiAcademicCap className="h-3.5 w-3.5 text-amber-500" /> {test.totalMarks || 20} Marks
          </span>
          <span className="w-px h-3 bg-dark-200 dark:bg-dark-700" />
          <span className="flex items-center gap-1">
            <HiClock className="h-3.5 w-3.5 text-emerald-500" /> {test.duration || 18} Mins
          </span>
        </div>
      </div>

      {/* Action Footer Bar */}
      <div className="flex items-center justify-between gap-3 pt-3 border-t border-dark-100 dark:border-dark-800">
        <div className="flex items-center gap-2">
          {attempt?.status === 'submitted' ? (
            <div className="flex items-center gap-2">
              <Link
                to={`/tests/${targetTestId || test._id}/result`}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-3.5 py-2 rounded-xl text-xs flex items-center gap-1 shadow-sm transition-all cursor-pointer"
              >
                <HiCheckCircle className="h-4 w-4" /> Result
              </Link>
              <Link
                to={`/tests/${targetTestId || test._id}`}
                className="bg-dark-100 dark:bg-dark-800 hover:bg-dark-200 dark:hover:bg-dark-700 text-dark-700 dark:text-dark-200 font-bold px-3 py-2 rounded-xl text-xs transition-colors cursor-pointer"
              >
                Reattempt
              </Link>
            </div>
          ) : isLocked ? (
            <button
              onClick={() => onUnlock && onUnlock(test)}
              className="bg-primary-50 dark:bg-primary-950/60 hover:bg-primary-100 dark:hover:bg-primary-900/80 text-primary-700 dark:text-primary-300 font-extrabold px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 border border-primary-200 dark:border-primary-800 transition-all cursor-pointer shadow-sm"
            >
              <HiLockClosed className="h-3.5 w-3.5" /> Unlock Now
            </button>
          ) : isValidId ? (
            <Link
              to={`/tests/${targetTestId}`}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-black px-5 py-2 rounded-xl text-xs flex items-center gap-1.5 shadow-md hover:shadow-lg transition-all cursor-pointer"
            >
              <HiPlay className="h-3.5 w-3.5" /> Start Now
            </Link>
          ) : (
            <button
              onClick={() => setShowSyllabusModal(true)}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-black px-5 py-2 rounded-xl text-xs flex items-center gap-1.5 shadow-md hover:shadow-lg transition-all cursor-pointer"
            >
              <HiPlay className="h-3.5 w-3.5" /> Start Now
            </button>
          )}
        </div>

        <div className="flex items-center gap-3 text-xs font-bold text-dark-500 dark:text-dark-400">
          <button
            onClick={() => setShowSyllabusModal(true)}
            className="hover:text-primary-600 dark:hover:text-primary-400 flex items-center gap-1 transition-colors cursor-pointer"
          >
            <HiInformationCircle className="h-3.5 w-3.5" /> Syllabus
          </button>
          <button
            onClick={() => onShare && onShare(test)}
            className="hover:text-primary-600 dark:hover:text-primary-400 flex items-center gap-1 transition-colors cursor-pointer"
          >
            <HiShare className="h-3.5 w-3.5" /> Share
          </button>
        </div>
      </div>

      {/* Syllabus Modal */}
      {showSyllabusModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white dark:bg-dark-900 rounded-3xl p-6 max-w-lg w-full shadow-2xl border border-dark-100 dark:border-dark-800 relative">
            <button
              onClick={() => setShowSyllabusModal(false)}
              className="absolute top-4 right-4 p-2 text-dark-400 hover:text-dark-600 dark:hover:text-white rounded-full transition-colors cursor-pointer"
            >
              <HiX className="h-5 w-5" />
            </button>
            <h3 className="text-lg font-extrabold text-dark-900 dark:text-white mb-2 flex items-center gap-2">
              <HiInformationCircle className="h-5 w-5 text-primary-500" />
              Syllabus & Pattern Details
            </h3>
            <p className="text-sm font-bold text-dark-800 dark:text-dark-200 mb-3">{test.title}</p>
            <div className="bg-dark-50 dark:bg-dark-800/50 p-4 rounded-2xl text-xs sm:text-sm text-dark-600 dark:text-dark-300 space-y-2 mb-6 border border-dark-100 dark:border-dark-700">
              <p>
                • <strong>Subject Domain:</strong>{' '}
                {test.subjectTag || test.category?.name || 'General Studies'}
              </p>
              <p>
                • <strong>Total Questions:</strong>{' '}
                {test.questionsCount || test.questions?.length || 15} MCQs
              </p>
              <p>
                • <strong>Max Marks:</strong> {test.totalMarks || 20} Marks
              </p>
              <p>
                • <strong>Time Allowed:</strong> {test.duration || 18} Minutes
              </p>
              <p>
                • <strong>Marking Scheme:</strong> +
                {test.positiveMarks || (test.totalMarks / (test.questionsCount || 15)).toFixed(2)}{' '}
                for correct, -{test.negativeMarks || '0.33'} for wrong
              </p>
              <p>
                • <strong>Language:</strong> English & Hindi Medium
              </p>
            </div>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowSyllabusModal(false)}
                className="btn-outline text-xs px-4 py-2"
              >
                Close
              </button>
              {!isLocked && (
                <Link
                  to={`/tests/${test._id}`}
                  className="btn-primary text-xs px-5 py-2 flex items-center gap-1"
                >
                  <HiPlay className="h-3.5 w-3.5" /> Start Test
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
