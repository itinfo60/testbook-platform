
export default function QuizResults({ result }) {
  const { score, totalScore, percentage, correctAnswers, totalQuestions } = result || {};

  return (
    <div className="text-center py-8">
      <div className="text-5xl mb-4">{(percentage || 0) >= 60 ? '🎉' : '💪'}</div>
      <h2 className="text-2xl font-bold text-dark-900 dark:text-white mb-2">
        {(percentage || 0) >= 60 ? 'Well Done!' : 'Keep Practicing!'}
      </h2>
      <p className="text-dark-500 mb-6">
        You scored {score || 0} out of {totalScore || totalQuestions || 0}
      </p>

      <div className="inline-flex items-center gap-8 mb-6">
        <div className="flex items-center gap-2">
          <HiCheckCircle className="h-5 w-5 text-secondary-500" />
          <span className="font-medium">{correctAnswers || 0} Correct</span>
        </div>
        <div className="flex items-center gap-2">
          <HiXCircle className="h-5 w-5 text-red-500" />
          <span className="font-medium">{(totalQuestions || 0) - (correctAnswers || 0)} Wrong</span>
        </div>
      </div>

      <div className="bg-dark-50 dark:bg-dark-800 rounded-2xl p-6 inline-block">
        <div className="text-4xl font-bold text-primary-600">{Math.round(percentage || 0)}%</div>
        <div className="text-sm text-dark-400 mt-1">Score</div>
      </div>
    </div>
  );
}
