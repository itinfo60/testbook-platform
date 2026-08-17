import { useDispatch, useSelector } from 'react-redux';
import { setAnswer, clearAnswer, toggleMarkForReview } from '@/features/test/testSlice';
import { HiBookmark, HiArrowLeft, HiArrowRight, HiTrash, HiCheck } from 'react-icons/hi';

export default function TestQuestion({ question, index, total, onNext, onPrev }) {
  const dispatch = useDispatch();
  const { answers, markedForReview } = useSelector((state) => state.tests);

  const questionId = question._id || question.id || index;
  const selectedAnswer = answers[questionId];
  const isMarked = markedForReview.includes(questionId);

  const handleSelect = (optionIndex) => {
    dispatch(setAnswer({ questionId, answer: optionIndex }));
  };

  const handleClear = () => {
    dispatch(clearAnswer(questionId));
  };

  const handleMark = () => {
    dispatch(toggleMarkForReview(questionId));
  };

  return (
    <div className="max-w-3xl mx-auto">
      {/* Question Top Header Bar */}
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-200 dark:border-dark-800">
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center justify-center h-10 w-10 rounded-xl bg-amber-800 text-white text-base font-extrabold shadow-sm">
            {index + 1}
          </span>
          <div>
            <span className="text-xs font-bold text-slate-600 uppercase tracking-wider block">
              Question {index + 1} of {total}
            </span>
            {question.subjectTag && (
              <span className="text-[11px] font-bold text-amber-800 dark:text-amber-400">
                {question.subjectTag}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {selectedAnswer !== undefined && (
            <button
              onClick={handleClear}
              className="text-xs font-bold text-slate-600 hover:text-rose-500 px-3 py-2 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors flex items-center gap-1 cursor-pointer"
            >
              <HiTrash className="h-3.5 w-3.5" /> Clear Response
            </button>
          )}

          <button
            onClick={handleMark}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all shadow-sm cursor-pointer ${
              isMarked
                ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300 border border-purple-200 dark:border-purple-800'
                : 'bg-white dark:bg-dark-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-dark-800 hover:bg-slate-50 dark:hover:bg-dark-800'
            }`}
          >
            <HiBookmark className={`h-4 w-4 ${isMarked ? 'fill-current' : ''}`} />
            {isMarked ? 'Marked for Review' : 'Mark for Review'}
          </button>
        </div>
      </div>

      {/* Question Box */}
      <div className="mb-6 bg-slate-50 dark:bg-dark-800 p-6 sm:p-7 rounded-3xl border border-slate-200 dark:border-dark-700 shadow-inner">
        <h3 className="text-base sm:text-lg lg:text-xl font-bold text-dark-900 dark:text-white leading-relaxed font-display">
          {question.question || question.text}
        </h3>
        {question.image && (
          <img
            src={question.image}
            alt="Question Diagram"
            className="mt-4 rounded-2xl max-h-64 object-contain border border-slate-200 dark:border-dark-700"
          />
        )}
      </div>

      {/* Options */}
      <div className="space-y-3.5 mb-8">
        {(question.options || []).map((option, i) => {
          const optionText = typeof option === 'string' ? option : option.text || option.label;
          const isSelected = selectedAnswer === i;

          return (
            <button
              key={i}
              onClick={() => handleSelect(i)}
              className={`w-full flex items-center gap-3.5 p-4 rounded-2xl border-2 text-left transition-all group cursor-pointer ${
                isSelected
                  ? 'border-amber-500 bg-amber-50 dark:bg-amber-950/30 shadow-md ring-2 ring-amber-500/20'
                  : 'border-slate-200 dark:border-dark-700 hover:border-amber-300 dark:hover:border-amber-700 hover:bg-slate-50 dark:hover:bg-dark-800 shadow-sm'
              }`}
            >
              <span
                className={`flex-shrink-0 h-9 w-9 rounded-xl flex items-center justify-center text-sm font-black transition-all shadow-sm ${
                  isSelected
                    ? 'bg-amber-800 text-white scale-105'
                    : 'bg-white dark:bg-dark-900 border border-slate-200 dark:border-dark-700 text-slate-600 dark:text-slate-400 group-hover:border-amber-400 group-hover:text-amber-800'
                }`}
              >
                {String.fromCharCode(65 + i)}
              </span>
              <span
                className={`text-sm sm:text-base leading-snug flex-1 ${
                  isSelected
                    ? 'text-amber-900 dark:text-amber-100 font-bold'
                    : 'text-slate-700 dark:text-slate-300 font-medium'
                }`}
              >
                {optionText}
              </span>
              {isSelected && (
                <span className="h-6 w-6 rounded-full bg-amber-800 text-white flex items-center justify-center flex-shrink-0 shadow-sm">
                  <HiCheck className="h-4 w-4" />
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Navigation Buttons */}
      <div className="flex items-center justify-between border-t border-slate-200 dark:border-dark-800 pt-6">
        <button
          onClick={onPrev}
          disabled={index === 0}
          className="bg-white dark:bg-dark-900 border border-slate-200 dark:border-dark-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-dark-800 font-bold py-3 px-6 rounded-xl flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-sm text-sm cursor-pointer"
        >
          <HiArrowLeft className="h-4 w-4" /> Previous
        </button>

        <button
          onClick={onNext}
          className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-bold py-3 px-8 rounded-xl flex items-center gap-2 shadow-md transition-all active:scale-95 text-sm cursor-pointer"
        >
          {index === total - 1 ? 'Review & Submit' : 'Save & Next'}{' '}
          <HiArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
