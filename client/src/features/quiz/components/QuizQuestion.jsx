export default function QuizQuestion({ question, index, selectedAnswer, onSelect }) {
  return (
    <div>
      <div className="flex items-center gap-3 mb-4">
        <span className="badge-primary">Q{index + 1}</span>
        {question.marks && <span className="text-xs text-dark-400">{question.marks} marks</span>}
      </div>

      <h3 className="text-lg font-medium text-dark-900 dark:text-white mb-6">
        {question.question || question.text}
      </h3>

      <div className="space-y-3">
        {(question.options || []).map((option, i) => {
          const text = typeof option === 'string' ? option : option.text || option.label;
          const isSelected = selectedAnswer === i;

          return (
            <button
              key={i}
              onClick={() => onSelect(i)}
              className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 text-left transition-all ${
                isSelected
                  ? 'border-primary-500 bg-primary-50 dark:bg-primary-950/30'
                  : 'border-dark-200 dark:border-dark-700 hover:border-dark-300 dark:hover:border-dark-600'
              }`}
            >
              <span className={`h-8 w-8 rounded-lg flex items-center justify-center text-sm font-semibold ${
                isSelected ? 'bg-primary-600 text-white' : 'bg-dark-100 dark:bg-dark-700 text-dark-500'
              }`}>
                {String.fromCharCode(65 + i)}
              </span>
              <span className={isSelected ? 'text-primary-700 dark:text-primary-300 font-medium' : 'text-dark-700 dark:text-dark-300'}>
                {text}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
