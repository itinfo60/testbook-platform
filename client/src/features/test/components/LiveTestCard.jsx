import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  HiClock,
  HiQuestionMarkCircle,
  HiAcademicCap,
  HiGlobe,
  HiShare,
  HiInformationCircle,
  HiCalendar,
  HiPlay,
  HiX,
} from 'react-icons/hi';

export default function LiveTestCard({ liveTest, onShare }) {
  const [showSyllabusModal, setShowSyllabusModal] = useState(false);
  const [registered, setRegistered] = useState(false);

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-xl transition-all flex flex-col justify-between relative group">
      <div>
        {/* Badges Bar */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded text-[10px] font-black bg-red-600 text-white uppercase tracking-wider animate-pulse">
              Live TEST
            </span>
            <span className="px-2.5 py-0.5 rounded text-[10px] font-black bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 uppercase">
              Free
            </span>
          </div>
          <span className="text-[11px] font-extrabold text-slate-600 flex items-center gap-1">
            <HiCalendar className="h-3.5 w-3.5 text-amber-800" />{' '}
            {liveTest.dateRange || '12 Aug, 9:00 to 14 Aug, 21:00'}
          </span>
        </div>

        {/* Live Test Title */}
        <h3 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white mb-3 line-clamp-2 group-hover:text-amber-800 dark:group-hover:text-amber-400 transition-colors">
          {liveTest.title}
        </h3>

        {/* Parameters */}
        <div className="flex flex-wrap items-center gap-3 text-xs font-bold text-slate-600 dark:text-slate-400 mb-4 bg-slate-50 dark:bg-slate-800/40 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800">
          <span className="flex items-center gap-1">
            <HiQuestionMarkCircle className="h-4 w-4 text-blue-500" />{' '}
            {liveTest.questionsCount || 30} Questions
          </span>
          <span>|</span>
          <span className="flex items-center gap-1">
            <HiClock className="h-4 w-4 text-emerald-500" /> {liveTest.duration || 15} Mins.
          </span>
          <span>|</span>
          <span className="flex items-center gap-1">
            <HiAcademicCap className="h-4 w-4 text-amber-800" /> {liveTest.totalMarks || 60} Marks
          </span>
        </div>
      </div>

      <div>
        {/* Footer Languages & Action */}
        <div className="flex items-center justify-between gap-3 pt-3 border-t border-slate-100 dark:border-slate-800 mb-4">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-400">
            <HiGlobe className="h-4 w-4 text-indigo-500" />
            <span>{liveTest.languages || 'English , Hindi + 8 More'}</span>
          </div>

          <div className="flex items-center gap-3 text-xs font-bold text-slate-600 dark:text-slate-400">
            {liveTest.hasSyllabus !== false && (
              <button
                onClick={() => setShowSyllabusModal(true)}
                className="hover:text-amber-800 flex items-center gap-1 cursor-pointer transition-colors"
              >
                <HiInformationCircle className="h-4 w-4" /> Syllabus
              </button>
            )}
            <button
              onClick={() => onShare && onShare(liveTest)}
              className="hover:text-amber-800 flex items-center gap-1 cursor-pointer transition-colors"
            >
              <HiShare className="h-4 w-4" /> Share
            </button>
          </div>
        </div>

        {/* CTA Button */}
        {liveTest.isLive ? (
          <Link
            to={`/tests/${liveTest.testId || liveTest._id}`}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black py-3 rounded-xl text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all cursor-pointer"
          >
            <HiPlay className="h-4 w-4" /> Start Now
          </Link>
        ) : registered ? (
          <button
            disabled
            className="w-full bg-emerald-100 text-emerald-700 font-extrabold py-3 rounded-xl text-xs sm:text-sm cursor-default border border-emerald-300"
          >
            ✓ Registered
          </button>
        ) : (
          <button
            onClick={() => setRegistered(true)}
            className="w-full bg-amber-800 hover:bg-amber-800 text-white font-black py-3 rounded-xl text-xs sm:text-sm flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
          >
            Register
          </button>
        )}
      </div>

      {/* Syllabus Modal */}
      {showSyllabusModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-lg w-full shadow-2xl border border-slate-200 dark:border-slate-800 relative">
            <button
              onClick={() => setShowSyllabusModal(false)}
              className="absolute top-4 right-4 p-2 text-slate-600 hover:text-slate-600 rounded-full transition-colors cursor-pointer"
            >
              <HiX className="h-6 w-6" />
            </button>
            <h3 className="text-xl font-extrabold text-slate-900 dark:text-white mb-2">
              Syllabus — {liveTest.title}
            </h3>
            <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl text-xs sm:text-sm text-slate-600 dark:text-slate-300 space-y-2 mb-6">
              <p>
                • <strong>Exam Domain:</strong> All India Live Test Series
              </p>
              <p>
                • <strong>Scheduled Window:</strong> {liveTest.dateRange}
              </p>
              <p>
                • <strong>Total MCQs:</strong> {liveTest.questionsCount || 30} Questions
              </p>
              <p>
                • <strong>Max Marks:</strong> {liveTest.totalMarks || 60} Marks
              </p>
              <p>
                • <strong>Languages:</strong> {liveTest.languages || 'English, Hindi + 8 More'}
              </p>
              <p>
                • <strong>All India Percentile & Rank:</strong> Calculated automatically after test
                window completion.
              </p>
            </div>
            <button
              onClick={() => setShowSyllabusModal(false)}
              className="w-full bg-amber-800 text-white font-extrabold py-3 rounded-2xl text-sm cursor-pointer"
            >
              Close Syllabus
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
