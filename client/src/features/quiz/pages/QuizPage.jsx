import { Button } from '@/components/ui';
import { useState, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { submitQuiz, setQuizAnswer } from '@/features/quiz/quizSlice';

export default function QuizPage() {
  const dispatch = useDispatch();
  const { currentQuiz, answers, result, loading } = useSelector(state => state.quizzes);
  const [currentIndex, setCurrentIndex] = useState(0);

  const questions = currentQuiz?.questions || [];
  const question = questions[currentIndex];

  const handleSelect = optionIndex => {
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
        <h2 className="text-xl font-semibold text-dark-900 dark:text-white mb-2">No Quiz Selected</h2>
        <p className="text-dark-500">Select a quiz from the course to begin</p>
      </div>
    );
  }

  const qId = question?._id || question?.id || currentIndex;

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-dark-900 dark:text-white">{currentQuiz.title}</h2>
        {currentQuiz.duration && <QuizTimer duration={currentQuiz.duration} onTimeUp={handleTimeUp} />}
      </div>

      <div className="card p-6 mb-6">
        <QuizQuestion
          question={question}
          index={currentIndex}
          selectedAnswer={answers[qId]}
          onSelect={handleSelect}
        />
      </div>

      <div className="flex items-center justify-between">
        <Button
          variant="secondary"
          onClick={() => setCurrentIndex(Math.max(0, currentIndex - 1))}
          disabled={currentIndex === 0}
        >
          Previous
        </Button>

        {currentIndex === questions.length - 1 ? (
          <Button variant="primary" onClick={handleSubmit} loading={loading}>Submit Quiz</Button>
        ) : (
          <Button variant="primary" onClick={() => setCurrentIndex(currentIndex + 1)}>Next</Button>
        )}
      </div>

      <div className="flex justify-center gap-1.5 mt-6">
        {questions.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrentIndex(i)}
            className={`h-2.5 w-2.5 rounded-full transition-colors ${
              i === currentIndex ? 'bg-primary-600' :
              answers[questions[i]?._id || i] !== undefined ? 'bg-secondary-500' :
              'bg-dark-200 dark:bg-dark-700'
            }`}
          />
        ))}
      </div>
    </div>
  );
}
