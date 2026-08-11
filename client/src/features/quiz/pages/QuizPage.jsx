import { Button } from '@/components/ui';
import { useState, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { submitQuiz, setQuizAnswer } from '@/features/quiz/quizSlice';

export default function QuizPage() {
  const dispatch = useDispatch();
  const { currentQuiz, answers, result, loading } = useSelector((state) => state.quizzes);
  const [currentIndex, setCurrentIndex] = useState(0);

  const questions = currentQuiz?.questions || [];
  const question = questions[currentIndex];

  const handleSelect = (optionIndex) => {
    const qId = question?._id || question?.id || currentIndex;
    dispatch(setQuizAnswer({ questionId: qId, answer: optionIndex }));
  };

  const handleSubmit = useCallback(() => {
    if (currentQuiz?._id) {
      dispatch(submitQuiz({ id: currentQuiz._id, answers }));
    }
  }, [dispatch, currentQuiz, answers]);

  const handleTimeUp = useCallback(() => {
    handleSubmit();
  }, [handleSubmit]);

  if (result) return <QuizResults result={result} />;

  if (!currentQuiz || !questions.length) {
    return (
      <div className="text-center py-16">
        <div className="text-5xl mb-4">🧩</div>
        <h2 className="text-xl font-semibold text-dark-900 dark:text-white mb-2">
          No Quiz Selected
        </h2>
        <p className="text-dark-500">Select a quiz from the course to begin</p>
      </div>
    );
  }

  const qId = question?._id || question?.id || currentIndex;

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
      <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-200 dark:border-dark-800">
        <div>
          <h2 className="text-2xl font-extrabold text-dark-900 dark:text-white font-display tracking-tight">
            {currentQuiz.title}
          </h2>
          <p className="text-slate-500 font-medium mt-1 text-sm">Attempting Daily Free Quiz</p>
        </div>
        {currentQuiz.duration && (
          <QuizTimer duration={currentQuiz.duration} onTimeUp={handleTimeUp} />
        )}
      </div>

      <div className="mb-8">
        <QuizQuestion
          question={question}
          index={currentIndex}
          selectedAnswer={answers[qId]}
          onSelect={handleSelect}
        />
      </div>

      <div className="flex items-center justify-between border-t border-slate-200 dark:border-dark-800 pt-6">
        <button
          className="bg-white dark:bg-dark-900 border border-slate-200 dark:border-dark-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-dark-800 font-bold py-3 px-6 rounded-xl flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
          onClick={() => setCurrentIndex(Math.max(0, currentIndex - 1))}
          disabled={currentIndex === 0}
        >
          Previous
        </button>

        {currentIndex === questions.length - 1 ? (
          <button
            className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-bold py-3 px-8 rounded-xl shadow-md transition-all active:scale-95"
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading ? 'Submitting...' : 'Submit Quiz'}
          </button>
        ) : (
          <button
            className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-bold py-3 px-8 rounded-xl shadow-md transition-all active:scale-95"
            onClick={() => setCurrentIndex(currentIndex + 1)}
          >
            Save & Next
          </button>
        )}
      </div>

      <div className="flex justify-center gap-2 mt-8 flex-wrap">
        {questions.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrentIndex(i)}
            className={`h-3 w-3 rounded-full transition-all ${
              i === currentIndex
                ? 'bg-blue-600 scale-125 shadow-sm shadow-blue-500/50'
                : answers[questions[i]?._id || i] !== undefined
                  ? 'bg-green-500 shadow-sm shadow-green-500/30'
                  : 'bg-slate-200 dark:bg-dark-700 hover:bg-slate-300 dark:hover:bg-dark-600'
            }`}
          />
        ))}
      </div>
    </div>
  );
}
