import LoadingSpinner from '@/components/common/LoadingSpinner';
import { Button } from '@/components/ui';
import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { startTest, submitTest } from '@/features/test/testSlice';
import toast from 'react-hot-toast';

export default function TestTaking() {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { attempt, answers, currentQuestionIndex, loading, result } = useSelector(state => state.tests);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [showNav, setShowNav] = useState(false);

  useEffect(() => {
    dispatch(startTest(id));
    return () => {};
  }, [dispatch, id]);

  useEffect(() => {
    if (result) navigate(`/tests/${id}/result`, { replace: true });
  }, [result, navigate, id]);

  const questions = attempt?.questions || attempt?.test?.questions || [];
  const currentQuestion = questions[currentQuestionIndex];
  const duration = attempt?.duration || attempt?.test?.duration || 60;

  const handleSubmit = useCallback(() => {
    setShowSubmitModal(false);
    dispatch(submitTest({ id, answers }));
    toast.success('Test submitted!');
  }, [dispatch, id, answers]);

  const handleTimeUp = useCallback(() => {
    toast.error('Time is up!');
    dispatch(submitTest({ id, answers }));
  }, [dispatch, id, answers]);

  const handleNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      dispatch({ type: 'tests/setCurrentQuestion', payload: currentQuestionIndex + 1 });
    } else {
      setShowSubmitModal(true);
    }
  };

  const handlePrev = () => {
    if (currentQuestionIndex > 0) {
      dispatch({ type: 'tests/setCurrentQuestion', payload: currentQuestionIndex - 1 });
    }
  };

  if (loading && !attempt) return <LoadingSpinner fullScreen text="Loading test..." />;

  if (!questions.length) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="text-5xl mb-4">📝</div>
          <h2 className="text-xl font-semibold mb-2">Unable to load test</h2>
          <p className="text-dark-500 mb-4">Please try again</p>
          <Button onClick={() => navigate(`/tests/${id}`)}>Go Back</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="test-fullscreen">
      {/* Header */}
      <div className="sticky top-0 z-10 glass border-b border-dark-100 dark:border-dark-800 px-4 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <h2 className="font-semibold text-dark-900 dark:text-white truncate">
            {attempt?.test?.title || 'Test'}
          </h2>
          <div className="flex items-center gap-3">
            <TestTimer duration={duration} onTimeUp={handleTimeUp} startTime={attempt?.startTime} />
            <button onClick={() => setShowNav(!showNav)} className="lg:hidden btn-secondary text-sm py-1.5 px-3">
              {currentQuestionIndex + 1}/{questions.length}
            </button>
            <Button variant="danger" size="sm" onClick={() => setShowSubmitModal(true)}>Submit</Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex max-w-7xl mx-auto">
        <div className="flex-1 p-6">
          {currentQuestion && (
            <TestQuestion
              question={currentQuestion}
              index={currentQuestionIndex}
              total={questions.length}
              onNext={handleNext}
              onPrev={handlePrev}
            />
          )}
        </div>

        {/* Desktop Navigator */}
        <div className="hidden lg:block w-64 p-6 pl-0">
          <div className="sticky top-24">
            <TestNavigator questions={questions} onSubmit={() => setShowSubmitModal(true)} />
          </div>
        </div>
      </div>

      {/* Mobile Navigator Drawer */}
      {showNav && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowNav(false)} />
          <div className="absolute right-0 top-0 bottom-0 w-72 bg-white dark:bg-dark-900 p-4 overflow-y-auto animate-slide-down">
            <TestNavigator questions={questions} onSubmit={() => { setShowNav(false); setShowSubmitModal(true); }} />
          </div>
        </div>
      )}

      {/* Submit Confirmation Modal */}
      <Modal isOpen={showSubmitModal} onClose={() => setShowSubmitModal(false)} title="Submit Test?" size="sm">
        <div className="text-center py-4">
          <div className="text-4xl mb-3">📋</div>
          <p className="text-dark-600 dark:text-dark-400 mb-2">
            You have answered <strong>{Object.keys(answers).length}</strong> out of <strong>{questions.length}</strong> questions.
          </p>
          <p className="text-sm text-dark-400 mb-6">
            {questions.length - Object.keys(answers).length} questions are unanswered.
          </p>
          <div className="flex gap-3 justify-center">
            <Button variant="secondary" onClick={() => setShowSubmitModal(false)}>Review Again</Button>
            <Button variant="primary" onClick={handleSubmit} loading={loading}>Submit Test</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
