import { useState, useCallback, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  submitQuiz,
  setQuizAnswer,
  fetchQuizById,
  clearQuizState,
} from '@/features/quiz/quizSlice';
import QuizQuestion from '../components/QuizQuestion';
import QuizResults from '../components/QuizResults';
import QuizTimer from '../components/QuizTimer';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import { Modal, Button } from '@/components/ui';
import { HiArrowLeft, HiArrowRight, HiCheck, HiShieldCheck } from 'react-icons/hi';
import toast from 'react-hot-toast';

export default function QuizPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { currentQuiz, answers, result, loading, error } = useSelector((state) => state.quizzes);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showSubmitModal, setShowSubmitModal] = useState(false);

  // Fetch quiz if id in URL and not loaded
  useEffect(() => {
    if (id && (!currentQuiz || currentQuiz._id !== id)) {
      dispatch(fetchQuizById(id));
    }
  }, [dispatch, id, currentQuiz]);

  const questions = currentQuiz?.questions || [];
  const question = questions[currentIndex];
  const quizId = currentQuiz?._id || id;

  // Restore answers from localStorage on mount if available
  useEffect(() => {
    if (!quizId || result) return;
    try {
      const saved = localStorage.getItem(`quiz_answers_${quizId}`);
      if (saved) {
        const parsed = JSON.parse(saved);
        Object.entries(parsed).forEach(([qId, ans]) => {
          if (answers[qId] === undefined) {
            dispatch(setQuizAnswer({ questionId: qId, answer: ans }));
          }
        });
      }
    } catch {}
  }, [quizId, result, dispatch]);

  // Sync answers to localStorage on change
  useEffect(() => {
    if (!quizId || result || Object.keys(answers).length === 0) return;
    try {
      localStorage.setItem(`quiz_answers_${quizId}`, JSON.stringify(answers));
    } catch {}
  }, [answers, quizId, result]);

  // Prevent accidental tab close when quiz is in progress
  useEffect(() => {
    if (!currentQuiz || result) return;
    const handler = (e) => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [currentQuiz, result]);

  const handleSelect = (optionIndex) => {
    const qId = question?._id || question?.id || currentIndex;
    dispatch(setQuizAnswer({ questionId: qId, answer: optionIndex }));
  };

  const handleClearResponse = () => {
    const qId = question?._id || question?.id || currentIndex;
    const newAnswers = { ...answers };
    delete newAnswers[qId];
    localStorage.setItem(`quiz_answers_${quizId}`, JSON.stringify(newAnswers));
    dispatch(setQuizAnswer({ questionId: qId, answer: undefined }));
  };

  const executeSubmit = useCallback(async () => {
    setShowSubmitModal(false);
    if (!currentQuiz?._id) return;
    try {
      // Format answers for server payload
      const formattedAnswers = Object.entries(answers).map(([qId, selectedOption]) => ({
        questionId: qId,
        selectedOption,
      }));
      await dispatch(submitQuiz({ id: currentQuiz._id, answers: formattedAnswers })).unwrap();
      // Clean up localStorage backup
      try {
        localStorage.removeItem(`quiz_answers_${currentQuiz._id}`);
      } catch {}
      toast.success('Quiz submitted successfully!');
    } catch (err) {
      toast.error(err || 'Failed to submit quiz');
    }
  }, [dispatch, currentQuiz, answers]);

  const handleTimeUp = useCallback(() => {
    toast.error('Time is up! Submitting quiz automatically...');
    executeSubmit();
  }, [executeSubmit]);

  const handleRetry = () => {
    try {
      localStorage.removeItem(`quiz_answers_${quizId}`);
    } catch {}
    dispatch(clearQuizState());
    if (id) {
      dispatch(fetchQuizById(id));
    }
    setCurrentIndex(0);
  };

  // Keyboard navigation & quick answer selection
  useEffect(() => {
    if (result || !question) return;
    const handler = (e) => {
      if (['input', 'textarea'].includes(e.target.tagName.toLowerCase())) return;
      if (['1', 'a', 'A'].includes(e.key)) handleSelect(0);
      else if (['2', 'b', 'B'].includes(e.key)) handleSelect(1);
      else if (['3', 'c', 'C'].includes(e.key)) handleSelect(2);
      else if (['4', 'd', 'D'].includes(e.key)) handleSelect(3);
      else if (e.key === 'ArrowRight') {
        if (currentIndex < questions.length - 1) setCurrentIndex((i) => i + 1);
      } else if (e.key === 'ArrowLeft') {
        if (currentIndex > 0) setCurrentIndex((i) => i - 1);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [result, question, currentIndex, questions.length]);

  if (loading && !currentQuiz) return <LoadingSpinner fullScreen text="Loading quiz..." />;

  if (result) {
    return (
      <QuizResults result={result} quiz={currentQuiz} userAnswers={answers} onRetry={handleRetry} />
    );
  }

  if (error || !currentQuiz || !questions.length) {
    return (
      <div className="max-w-md mx-auto my-20 p-8 bg-white dark:bg-dark-900 rounded-3xl border border-slate-200 dark:border-dark-800 text-center shadow-sm">
        <div className="text-5xl mb-4">🧩</div>
        <h2 className="text-xl font-bold text-dark-900 dark:text-white mb-2">
          {error || 'Quiz Not Found'}
        </h2>
        <p className="text-slate-500 text-sm mb-6">
          This quiz is either unavailable or has not been published yet.
        </p>
        <button
          onClick={() => navigate(-1)}
          className="bg-primary-600 hover:bg-primary-700 text-white font-bold py-2.5 px-6 rounded-xl transition-all text-sm inline-flex items-center gap-2"
        >
          <HiArrowLeft className="h-4 w-4" /> Go Back
        </button>
      </div>
    );
  }

  const qId = question?._id || question?.id || currentIndex;
  const answeredCount = Object.keys(answers).filter((k) => answers[k] !== undefined).length;
  const unansweredCount = questions.length - answeredCount;

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
      {/* ── Quiz Header ── */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8 pb-4 border-b border-slate-200 dark:border-dark-800">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider mb-1">
            <HiShieldCheck className="h-4 w-4" /> Interactive Quiz Practice
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-dark-900 dark:text-white font-display tracking-tight">
            {currentQuiz.title}
          </h2>
        </div>

        <div className="flex items-center gap-4">
          {/* Answered Counter Pill */}
          <div className="bg-slate-100 dark:bg-dark-800 px-3.5 py-1.5 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300">
            <span className="text-emerald-600 font-black">{answeredCount}</span>/{questions.length}{' '}
            Answered
          </div>

          {currentQuiz.duration > 0 && (
            <QuizTimer duration={currentQuiz.duration} onTimeUp={handleTimeUp} />
          )}
        </div>
      </div>

      {/* ── Question Card ── */}
      <div className="mb-8">
        <QuizQuestion
          question={question}
          index={currentIndex}
          selectedAnswer={answers[qId]}
          onSelect={handleSelect}
        />
      </div>

      {/* ── Clear Response & Navigation ── */}
      <div className="flex items-center justify-between border-t border-slate-200 dark:border-dark-800 pt-6">
        <div className="flex items-center gap-2">
          <button
            className="bg-white dark:bg-dark-900 border border-slate-200 dark:border-dark-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-dark-800 font-bold py-3 px-5 rounded-xl flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-sm text-sm cursor-pointer"
            onClick={() => setCurrentIndex(Math.max(0, currentIndex - 1))}
            disabled={currentIndex === 0}
          >
            <HiArrowLeft className="h-4 w-4" /> Previous
          </button>

          {answers[qId] !== undefined && (
            <button
              onClick={handleClearResponse}
              className="text-xs font-bold text-slate-400 hover:text-rose-500 px-3 py-2 transition-colors cursor-pointer"
            >
              Clear Choice
            </button>
          )}
        </div>

        {currentIndex === questions.length - 1 ? (
          <button
            className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-bold py-3 px-8 rounded-xl shadow-md transition-all active:scale-95 text-sm flex items-center gap-2 cursor-pointer"
            onClick={() => setShowSubmitModal(true)}
            disabled={loading}
          >
            <HiCheck className="h-5 w-5" />
            {loading ? 'Submitting...' : 'Submit Quiz'}
          </button>
        ) : (
          <button
            className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-bold py-3 px-8 rounded-xl shadow-md transition-all active:scale-95 text-sm flex items-center gap-2 cursor-pointer"
            onClick={() => setCurrentIndex(currentIndex + 1)}
          >
            Save & Next <HiArrowRight className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* ── Question Step Indicator Palette ── */}
      <div className="flex justify-center items-center gap-2 mt-8 flex-wrap">
        {questions.map((q, i) => {
          const isCurrent = i === currentIndex;
          const isAnswered = answers[q?._id || i] !== undefined;

          return (
            <button
              key={i}
              onClick={() => setCurrentIndex(i)}
              aria-label={`Jump to question ${i + 1}`}
              className={`h-8 w-8 rounded-xl text-xs font-black transition-all flex items-center justify-center cursor-pointer ${
                isCurrent
                  ? 'bg-amber-500 text-white ring-4 ring-amber-500/20 shadow-md scale-110'
                  : isAnswered
                    ? 'bg-emerald-500 text-white shadow-sm'
                    : 'bg-slate-100 dark:bg-dark-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-dark-700'
              }`}
            >
              {i + 1}
            </button>
          );
        })}
      </div>

      {/* ── Submission Confirmation Modal ── */}
      <Modal
        isOpen={showSubmitModal}
        onClose={() => setShowSubmitModal(false)}
        title="Submit Quiz?"
        size="sm"
      >
        <div className="text-center py-4">
          <div className="text-5xl mb-3">📋</div>
          <h3 className="text-lg font-bold text-dark-900 dark:text-white mb-2">
            Ready to submit your answers?
          </h3>
          <p className="text-sm text-slate-500 mb-6">
            You answered <strong className="text-emerald-600">{answeredCount}</strong> out of{' '}
            <strong>{questions.length}</strong> questions.{' '}
            {unansweredCount > 0 && (
              <span className="text-rose-500 font-bold block mt-1">
                ({unansweredCount} questions are still unanswered)
              </span>
            )}
          </p>
          <div className="flex gap-3 justify-center">
            <Button variant="secondary" onClick={() => setShowSubmitModal(false)}>
              Review Questions
            </Button>
            <Button variant="primary" onClick={executeSubmit} loading={loading}>
              Confirm Submission
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
