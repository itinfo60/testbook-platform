export default function QuizQuestion({ question, index, selectedAnswer, onSelect }) {
  return (
    <div>
      <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-200 dark:border-dark-800">
        <span className="inline-flex items-center justify-center h-10 w-10 rounded-xl bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-lg font-extrabold shadow-sm">
          {index + 1}
        </span>
        <span className="text-sm font-bold text-slate-500 uppercase tracking-wider">Question</span>
        {question.marks && (
          <span className="ml-auto text-xs font-bold text-green-600 bg-green-50 dark:bg-green-900/20 px-2 py-1 rounded">
            {question.marks} Marks
          </span>
        )}
      </div>

      <div className="mb-8 bg-slate-50 dark:bg-dark-800 p-6 rounded-2xl border border-slate-200 dark:border-dark-700 shadow-inner">
        <h3 className="text-lg sm:text-xl font-bold text-dark-900 dark:text-white leading-relaxed font-display">
          {question.question || question.text}
        </h3>
      </div>

      <div className="space-y-4">
        {(question.options || []).map((option, i) => {
          const text = typeof option === 'string' ? option : option.text || option.label;
          const isSelected = selectedAnswer === i;

          return (
            <button
              key={i}
              onClick={() => onSelect(i)}
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
                    : 'bg-white dark:bg-dark-900 border border-slate-200 dark:border-dark-700 text-slate-600 dark:text-slate-400 group-hover:bg-blue-100 group-hover:text-blue-600 group-hover:border-blue-200 dark:group-hover:bg-blue-900/30'
                }`}
              >
                {String.fromCharCode(65 + i)}
              </span>
              <span
                className={`text-base ${isSelected ? 'text-blue-900 dark:text-blue-100 font-bold' : 'text-slate-700 dark:text-slate-300 font-medium'}`}
              >
                {text}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
