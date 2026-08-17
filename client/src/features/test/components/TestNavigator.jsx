import { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { setCurrentQuestion } from '@/features/test/testSlice';
import { HiCheck, HiBookmark, HiSparkles } from 'react-icons/hi';

export default function TestNavigator({ questions, onSubmit }) {
  const dispatch = useDispatch();
  const { answers, markedForReview, currentQuestionIndex } = useSelector((state) => state.tests);
  const [filter, setFilter] = useState('all'); // 'all' | 'answered' | 'marked' | 'unanswered'

  const getStatus = (question, index) => {
    const qId = question._id || question.id || index;
    const answered = answers[qId] !== undefined;
    const marked = markedForReview.includes(qId);
    const current = index === currentQuestionIndex;

    if (current) return 'current';
    if (marked && answered) return 'marked-answered';
    if (marked) return 'marked';
    if (answered) return 'answered';
    return 'unanswered';
  };

  const statusStyles = {
    current:
      'bg-primary-600 text-white ring-4 ring-primary-600/30 font-black shadow-premium scale-105 z-10',
    answered: 'bg-success-600 hover:bg-success-700 text-white font-bold shadow-sm',
    marked: 'bg-warning-500 hover:bg-warning-600 text-white font-bold shadow-sm',
    'marked-answered':
      'bg-warning-500 hover:bg-warning-600 text-white font-bold shadow-sm ring-2 ring-success-400',
    unanswered:
      'bg-slate-100 hover:bg-slate-200 dark:bg-dark-800 dark:hover:bg-dark-700 text-slate-600 dark:text-slate-400 font-semibold',
  };

  const answeredCount = Object.keys(answers).filter((k) => answers[k] !== undefined).length;
  const markedCount = markedForReview.length;
  const total = questions.length;
  const unansweredCount = Math.max(0, total - answeredCount);

  const filteredQuestions = questions
    .map((q, i) => ({ q, index: i }))
    .filter(({ q, index }) => {
      const qId = q._id || q.id || index;
      const isAns = answers[qId] !== undefined;
      const isMkd = markedForReview.includes(qId);

      if (filter === 'answered') return isAns;
      if (filter === 'marked') return isMkd;
      if (filter === 'unanswered') return !isAns;
      return true;
    });

  return (
    <div className="bg-white dark:bg-dark-900 rounded-3xl p-4 sm:p-5 border border-slate-200 dark:border-dark-800 shadow-sm flex flex-col">
      <div className="flex items-center justify-between mb-3 pb-3 border-b border-slate-100 dark:border-dark-800">
        <h4 className="font-extrabold text-dark-900 dark:text-white text-sm sm:text-base font-display">
          Question Palette
        </h4>
        <span className="text-xs font-bold text-slate-600">
          {answeredCount}/{total}
        </span>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-1 mb-3 overflow-x-auto pb-1 text-[11px] font-bold">
        {[
          { id: 'all', label: `All (${total})` },
          { id: 'answered', label: `Ans (${answeredCount})` },
          { id: 'marked', label: `Mkd (${markedCount})` },
          { id: 'unanswered', label: `Left (${unansweredCount})` },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setFilter(tab.id)}
            className={`px-2 py-1 rounded-lg transition-all flex-shrink-0 cursor-pointer ${
              filter === tab.id
                ? 'bg-dark-900 text-white dark:bg-white dark:text-dark-900'
                : 'text-slate-600 hover:bg-slate-100 dark:hover:bg-dark-800'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Question Grid */}
      <div className="grid grid-cols-5 gap-2 mb-5 max-h-60 sm:max-h-72 overflow-y-auto pr-1">
        {filteredQuestions.map(({ q, index }) => (
          <button
            key={index}
            onClick={() => dispatch(setCurrentQuestion(index))}
            title={`Question ${index + 1}`}
            className={`h-9 w-full rounded-xl text-xs flex items-center justify-center transition-all cursor-pointer ${
              statusStyles[getStatus(q, index)]
            }`}
          >
            {index + 1}
          </button>
        ))}
      </div>

      {/* Legend */}
      <div className="space-y-2 text-xs border-t border-slate-100 dark:border-dark-800 pt-4 mb-4">
        <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
          <div className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-md bg-emerald-500 flex-shrink-0" />
            <span>Answered</span>
          </div>
          <span className="font-bold">{answeredCount}</span>
        </div>
        <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
          <div className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-md bg-purple-500 flex-shrink-0" />
            <span>Marked for Review</span>
          </div>
          <span className="font-bold">{markedCount}</span>
        </div>
        <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
          <div className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-md bg-slate-200 dark:bg-dark-700 flex-shrink-0" />
            <span>Not Answered</span>
          </div>
          <span className="font-bold">{unansweredCount}</span>
        </div>
      </div>

      {/* Submit Test Button */}
      <button
        onClick={onSubmit}
        className="w-full bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-bold py-3 px-4 rounded-xl shadow-md transition-all active:scale-95 text-xs sm:text-sm flex items-center justify-center gap-2 cursor-pointer mt-auto"
      >
        <HiCheck className="h-4 w-4" /> Submit Test
      </button>
    </div>
  );
}
