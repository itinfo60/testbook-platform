import { useDispatch, useSelector } from 'react-redux';
import { setAnswer, toggleMarkForReview } from '@/features/test/testSlice';
import { HiBookmark, HiArrowLeft, HiArrowRight } from 'react-icons/hi';

export default function TestQuestion({ question, index, total, onNext, onPrev }) {
  const dispatch = useDispatch();
  const { answers, markedForReview } = useSelector((state) => state.tests);

  const questionId = question._id || question.id || index;
  const selectedAnswer = answers[questionId];
  const isMarked = markedForReview.includes(questionId);

  const handleSelect = (optionIndex) => {
    dispatch(setAnswer({ questionId, answer: optionIndex }));
  };

  const handleMark = () => {
    dispatch(toggleMarkForReview(questionId));
  };

  return (
    <div className="max-w-3xl mx-auto">
      {/* Question Header */}
      <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-200 dark:border-dark-800">
        <div className="flex items-center gap-4">
          <span className="inline-flex items-center justify-center h-10 w-10 rounded-xl bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-lg font-extrabold shadow-sm">
            {index + 1}
          </span>
          <span className="text-sm font-bold text-slate-500 uppercase tracking-wider">
            of {total} questions
          </span>
        </div>
        <button
          onClick={handleMark}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all shadow-sm ${
            isMarked
              ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-500 border border-amber-200 dark:border-amber-900/50'
              : 'bg-white dark:bg-dark-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-dark-800 hover:bg-slate-50 dark:hover:bg-dark-800'
          }`}
        >
          <HiBookmark className={`h-5 w-5 ${isMarked ? 'fill-current' : ''}`} />
          {isMarked ? 'Marked for Review' : 'Mark for Review'}
        </button>
      </div>

      {/* Question Text */}
      <div className="mb-10 bg-slate-50 dark:bg-dark-800 p-6 rounded-2xl border border-slate-200 dark:border-dark-700 shadow-inner">
        <h3 className="text-lg sm:text-xl font-bold text-dark-900 dark:text-white leading-relaxed font-display">
          {question.question || question.text}
        </h3>
        {question.image && (
          <img
            src={question.image}
            alt="Question"
            className="mt-4 rounded-xl max-h-64 object-contain"
          />
        )}
      </div>

      {/* Options */}
      <div className="space-y-4 mb-10">
        {(question.options || []).map((option, i) => {
          const optionText = typeof option === 'string' ? option : option.text || option.label;
          const isSelected = selectedAnswer === i;

          return (
            <button
              key={i}
              onClick={() => handleSelect(i)}
              className={`w-full flex items-center gap-4 p-4 rounded-2xl border-2 text-left transition-all group ${
                isSelected
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 shadow-md'
                  : 'border-slate-200 dark:border-dark-700 hover:border-blue-300 dark:hover:border-blue-800/50 hover:bg-slate-50 dark:hover:bg-dark-800 shadow-sm'
              }`}
            >
              <span
                className={`flex-shrink-0 h-10 w-10 rounded-xl flex items-center justify-center text-base font-extrabold transition-all shadow-sm ${
                  isSelected
                    ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white scale-110'
                    : 'bg-white dark:bg-dark-900 border border-slate-200 dark:border-dark-700 text-slate-500 dark:text-slate-400 group-hover:bg-blue-100 group-hover:text-blue-600 group-hover:border-blue-200 dark:group-hover:bg-blue-900/30'
                }`}
              >
                {String.fromCharCode(65 + i)}
              </span>
              <span
                className={`text-base ${isSelected ? 'text-blue-900 dark:text-blue-100 font-bold' : 'text-slate-700 dark:text-slate-300 font-medium'}`}
              >
                {optionText}
              </span>
            </button>
          );
        })}
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between border-t border-slate-200 dark:border-dark-800 pt-6">
        <button
          onClick={onPrev}
          disabled={index === 0}
          className="bg-white dark:bg-dark-900 border border-slate-200 dark:border-dark-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-dark-800 font-bold py-3 px-6 rounded-xl flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
        >
          <HiArrowLeft className="h-5 w-5" /> Previous
        </button>
        <button
          onClick={onNext}
          className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-bold py-3 px-8 rounded-xl flex items-center gap-2 shadow-md transition-all active:scale-95"
        >
          {index === total - 1 ? 'Review & Submit' : 'Save & Next'}{' '}
          <HiArrowRight className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}
