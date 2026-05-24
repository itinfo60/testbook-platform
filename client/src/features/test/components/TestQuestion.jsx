import { useDispatch, useSelector } from 'react-redux';
import { setAnswer, toggleMarkForReview } from '@/features/test/testSlice';
import { HiBookmark, HiArrowLeft, HiArrowRight } from 'react-icons/hi';

export default function TestQuestion({ question, index, total, onNext, onPrev }) {
  const dispatch = useDispatch();
  const { answers, markedForReview } = useSelector(state => state.tests);

  const questionId = question._id || question.id || index;
  const selectedAnswer = answers[questionId];
  const isMarked = markedForReview.includes(questionId);

  const handleSelect = optionIndex => {
    dispatch(setAnswer({ questionId, answer: optionIndex }));
  };

  const handleMark = () => {
    dispatch(toggleMarkForReview(questionId));
  };

  return (
    <div className="max-w-3xl mx-auto">
      {/* Question Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center justify-center h-8 w-8 rounded-lg bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 text-sm font-bold">
            {index + 1}
          </span>
          <span className="text-sm text-dark-400">of {total} questions</span>
        </div>
        <button
          onClick={handleMark}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
            isMarked
              ? 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400'
              : 'bg-dark-100 text-dark-500 dark:bg-dark-800 dark:text-dark-400 hover:bg-dark-200 dark:hover:bg-dark-700'
          }`}
        >
          <HiBookmark className="h-4 w-4" />
          {isMarked ? 'Marked' : 'Mark for Review'}
        </button>
      </div>

      {/* Question Text */}
      <div className="mb-8">
        <h3 className="text-lg font-medium text-dark-900 dark:text-white leading-relaxed">
          {question.question || question.text}
        </h3>
        {question.image && (
          <img src={question.image} alt="Question" className="mt-4 rounded-xl max-h-64 object-contain" />
        )}
      </div>

      {/* Options */}
      <div className="space-y-3 mb-8">
        {(question.options || []).map((option, i) => {
          const optionText = typeof option === 'string' ? option : option.text || option.label;
          const isSelected = selectedAnswer === i;

          return (
            <button
              key={i}
              onClick={() => handleSelect(i)}
              className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 text-left transition-all ${
                isSelected
                  ? 'border-primary-500 bg-primary-50 dark:bg-primary-950/30 dark:border-primary-400'
                  : 'border-dark-200 dark:border-dark-700 hover:border-dark-300 dark:hover:border-dark-600 hover:bg-dark-50 dark:hover:bg-dark-800/50'
              }`}
            >
              <span className={`flex-shrink-0 h-8 w-8 rounded-lg flex items-center justify-center text-sm font-semibold transition-colors ${
                isSelected
                  ? 'bg-primary-600 text-white'
                  : 'bg-dark-100 dark:bg-dark-700 text-dark-500 dark:text-dark-400'
              }`}>
                {String.fromCharCode(65 + i)}
              </span>
              <span className={`${isSelected ? 'text-primary-700 dark:text-primary-300 font-medium' : 'text-dark-700 dark:text-dark-300'}`}>
                {optionText}
              </span>
            </button>
          );
        })}
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={onPrev}
          disabled={index === 0}
          className="btn-secondary flex items-center gap-2 disabled:opacity-50"
        >
          <HiArrowLeft className="h-4 w-4" /> Previous
        </button>
        <button
          onClick={onNext}
          className="btn-primary flex items-center gap-2"
        >
          {index === total - 1 ? 'Review' : 'Next'} <HiArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
