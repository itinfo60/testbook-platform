import { useSelector, useDispatch } from 'react-redux';
import { setCurrentQuestion } from '@/features/test/testSlice';

export default function TestNavigator({ questions, onSubmit }) {
  const dispatch = useDispatch();
  const { answers, markedForReview, currentQuestionIndex } = useSelector(state => state.tests);

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

  const statusColors = {
    current: 'ring-2 ring-primary-500 bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400',
    answered: 'bg-secondary-500 text-white',
    marked: 'bg-amber-500 text-white',
    'marked-answered': 'bg-purple-500 text-white',
    unanswered: 'bg-dark-100 dark:bg-dark-700 text-dark-500 dark:text-dark-400',
  };

  const answeredCount = Object.keys(answers).length;
  const markedCount = markedForReview.length;
  const total = questions.length;

  return (
    <div className="card p-3 sm:p-4">
      <h4 className="font-semibold text-dark-900 dark:text-white mb-3 text-sm sm:text-base">Question Navigator</h4>

      <div className="grid grid-cols-6 sm:grid-cols-5 gap-1.5 sm:gap-2 mb-4">
        {questions.map((q, i) => (
          <button
            key={i}
            onClick={() => dispatch(setCurrentQuestion(i))}
            className={`h-8 sm:h-9 w-full rounded-lg text-xs sm:text-sm font-medium transition-all ${statusColors[getStatus(q, i)]}`}
          >
            {i + 1}
          </button>
        ))}
      </div>

      {/* Legend */}
      <div className="space-y-1.5 sm:space-y-2 text-xs border-t border-dark-100 dark:border-dark-700 pt-3">
        <div className="flex items-center gap-2">
          <span className="h-3.5 w-3.5 sm:h-4 sm:w-4 rounded bg-secondary-500 flex-shrink-0" />
          <span className="text-dark-500">Answered ({answeredCount})</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="h-3.5 w-3.5 sm:h-4 sm:w-4 rounded bg-dark-100 dark:bg-dark-700 flex-shrink-0" />
          <span className="text-dark-500">Unanswered ({total - answeredCount})</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="h-3.5 w-3.5 sm:h-4 sm:w-4 rounded bg-amber-500 flex-shrink-0" />
          <span className="text-dark-500">Marked ({markedCount})</span>
        </div>
      </div>

      {/* Submit Button */}
      <button
        onClick={onSubmit}
        className="btn-success w-full mt-4 text-sm"
      >
        Submit Test
      </button>
    </div>
  );
}
