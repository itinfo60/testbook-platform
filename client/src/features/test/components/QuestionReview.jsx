import { HiCheckCircle, HiXCircle } from 'react-icons/hi';
export default function QuestionReview({ question, index, userAnswer }) {
  const correctAnswer = question.correctAnswer ?? question.correct;
  const isCorrect = userAnswer === correctAnswer;
  const wasAnswered = userAnswer !== undefined && userAnswer !== null;

  return (
    <div className={`card p-5 border-l-4 ${
      !wasAnswered ? 'border-dark-300' : isCorrect ? 'border-secondary-500' : 'border-red-500'
    }`}>
      <div className="flex items-start gap-3 mb-4">
        <span className="flex-shrink-0 h-7 w-7 rounded-lg bg-dark-100 dark:bg-dark-700 flex items-center justify-center text-sm font-bold text-dark-500">
          {index + 1}
        </span>
        <div className="flex-1">
          <p className="font-medium text-dark-900 dark:text-white">{question.question || question.text}</p>
          {!wasAnswered && <span className="text-xs text-dark-400 mt-1">Not answered</span>}
        </div>
        <div className="flex-shrink-0">
          {wasAnswered ? (
            isCorrect ? <HiCheckCircle className="h-6 w-6 text-secondary-500" /> : <HiXCircle className="h-6 w-6 text-red-500" />
          ) : (
            <span className="text-xs badge bg-dark-100 text-dark-500 dark:bg-dark-700">Skipped</span>
          )}
        </div>
      </div>

      <div className="space-y-2 ml-10">
        {(question.options || []).map((option, i) => {
          const text = typeof option === 'string' ? option : option.text || option.label;
          const isCorrectOption = i === correctAnswer;
          const isUserOption = i === userAnswer;

          return (
            <div
              key={i}
              className={`flex items-center gap-3 p-3 rounded-lg text-sm ${
                isCorrectOption ? 'bg-secondary-50 dark:bg-secondary-900/20 border border-secondary-200 dark:border-secondary-800' :
                isUserOption && !isCorrect ? 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800' :
                'bg-dark-50 dark:bg-dark-800/50'
              }`}
            >
              <span className={`h-6 w-6 rounded flex items-center justify-center text-xs font-semibold ${
                isCorrectOption ? 'bg-secondary-500 text-white' :
                isUserOption ? 'bg-red-500 text-white' :
                'bg-dark-200 dark:bg-dark-600 text-dark-500'
              }`}>
                {String.fromCharCode(65 + i)}
              </span>
              <span className={isCorrectOption ? 'text-secondary-700 dark:text-secondary-400 font-medium' : 'text-dark-600 dark:text-dark-400'}>
                {text}
              </span>
              {isCorrectOption && <HiCheckCircle className="h-4 w-4 text-secondary-500 ml-auto" />}
              {isUserOption && !isCorrect && <HiXCircle className="h-4 w-4 text-red-500 ml-auto" />}
            </div>
          );
        })}
      </div>

      {question.explanation && (
        <div className="ml-10 mt-3 p-3 bg-primary-50 dark:bg-primary-950/30 rounded-lg">
          <p className="text-xs font-semibold text-primary-600 dark:text-primary-400 mb-1">Explanation</p>
          <p className="text-sm text-dark-600 dark:text-dark-400">{question.explanation}</p>
        </div>
      )}
    </div>
  );
}
