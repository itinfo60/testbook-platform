import LoadingSpinner from '@/components/common/LoadingSpinner';
import { Button, Modal } from '@/components/ui';
import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { startTest, submitTest } from '@/features/test/testSlice';
import TestTimer from '../components/TestTimer';
import TestNavigator from '../components/TestNavigator';
import TestQuestion from '../components/TestQuestion';
import toast from 'react-hot-toast';
import { HiX, HiMenu } from 'react-icons/hi';

const enterFullscreen = () => {
  const el = document.documentElement;
  if (el.requestFullscreen) return el.requestFullscreen();
  if (el.webkitRequestFullscreen) return el.webkitRequestFullscreen();
  if (el.mozRequestFullScreen) return el.mozRequestFullScreen();
};

const exitFullscreen = () => {
  if (document.exitFullscreen) return document.exitFullscreen();
  if (document.webkitExitFullscreen) return document.webkitExitFullscreen();
  if (document.mozCancelFullScreen) return document.mozCancelFullScreen();
};

const isInFullscreen = () =>
  !!(document.fullscreenElement || document.webkitFullscreenElement || document.mozFullScreenElement);

export default function TestTaking() {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { attempt, questions: storedQuestions, answers, currentQuestionIndex, loading, result } = useSelector(state => state.tests);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [showNav, setShowNav] = useState(false);
  const [showExitModal, setShowExitModal] = useState(false);
  const [showCloseModal, setShowCloseModal] = useState(false);
  const isExitingRef = useRef(false); // true when we intentionally exit fullscreen

  const isTestActive = !!attempt && !result;

  // Start test
  useEffect(() => {
    dispatch(startTest(id));
  }, [dispatch, id]);

  // Enter fullscreen as soon as attempt is available
  useEffect(() => {
    if (!attempt) return;
    enterFullscreen().catch(() => {});
  }, [!!attempt]);

  // Restore fullscreen if user exits it unexpectedly (e.g. F11, Esc)
  useEffect(() => {
    if (!isTestActive) return;
    const handler = () => {
      if (!isInFullscreen() && !isExitingRef.current) {
        toast.error('Please stay in fullscreen during the test.', { id: 'fullscreen-warn' });
        enterFullscreen().catch(() => {});
      }
    };
    document.addEventListener('fullscreenchange', handler);
    document.addEventListener('webkitfullscreenchange', handler);
    return () => {
      document.removeEventListener('fullscreenchange', handler);
      document.removeEventListener('webkitfullscreenchange', handler);
    };
  }, [isTestActive]);

  // Disable right-click
  useEffect(() => {
    if (!isTestActive) return;
    const handler = e => e.preventDefault();
    document.addEventListener('contextmenu', handler);
    return () => document.removeEventListener('contextmenu', handler);
  }, [isTestActive]);

  // Block devtools keyboard shortcuts and Escape
  useEffect(() => {
    if (!isTestActive) return;
    const handler = e => {
      // Devtools / inspect shortcuts
      if (
        e.key === 'F12' ||
        (e.ctrlKey && e.shiftKey && ['I', 'J', 'C', 'K'].includes(e.key.toUpperCase())) ||
        (e.ctrlKey && e.key.toUpperCase() === 'U') ||
        (e.metaKey && e.altKey && ['I', 'J'].includes(e.key.toUpperCase()))
      ) {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }
      // Block Escape from doing anything (browser will still exit fullscreen but we re-enter above)
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
      }
    };
    document.addEventListener('keydown', handler, true);
    return () => document.removeEventListener('keydown', handler, true);
  }, [isTestActive]);

  // Block tab switch / window blur warning
  useEffect(() => {
    if (!isTestActive) return;
    const handler = () => toast('Please focus on the test window!', { icon: '⚠️', id: 'focus-warn' });
    window.addEventListener('blur', handler);
    return () => window.removeEventListener('blur', handler);
  }, [isTestActive]);

  // Prevent page refresh / close
  useEffect(() => {
    if (!isTestActive) return;
    const handler = e => { e.preventDefault(); e.returnValue = ''; };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [isTestActive]);

  // Back-button guard
  useEffect(() => {
    if (!isTestActive) return;
    window.history.pushState({ testGuard: true }, '');
    const handler = () => {
      window.history.pushState({ testGuard: true }, '');
      setShowExitModal(true);
    };
    window.addEventListener('popstate', handler);
    return () => window.removeEventListener('popstate', handler);
  }, [isTestActive]);

  // Navigate to result once submitted
  useEffect(() => {
    if (result) {
      isExitingRef.current = true;
      exitFullscreen().catch(() => {});
      navigate(`/tests/${id}/result`, { replace: true });
    }
  }, [result, navigate, id]);

  const questions = storedQuestions.length ? storedQuestions : (attempt?.questions || []);
  const currentQuestion = questions[currentQuestionIndex];
  const duration = attempt?.duration || 60;
  const attemptId = attempt?.attempt?._id;
  const startTime = attempt?.attempt?.startedAt;
  const testTitle = attempt?.title || 'Test';

  const handleSubmit = useCallback(() => {
    setShowSubmitModal(false);
    dispatch(submitTest({ attemptId, answers }));
    toast.success('Test submitted!');
  }, [dispatch, attemptId, answers]);

  const handleTimeUp = useCallback(() => {
    toast.error('Time is up! Auto-submitting...');
    dispatch(submitTest({ attemptId, answers }));
  }, [dispatch, attemptId, answers]);

  const handleCloseTest = () => {
    isExitingRef.current = true;
    exitFullscreen().catch(() => {});
    setShowCloseModal(false);
    navigate(`/tests/${id}`);
  };

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
    <div className="test-fullscreen min-h-screen bg-white dark:bg-dark-900 select-none">
      {/* Header */}
      <div className="sticky top-0 z-10 glass border-b border-dark-100 dark:border-dark-800 px-3 sm:px-4 py-2.5 sm:py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-2 sm:gap-3">
          <h2 className="font-semibold text-dark-900 dark:text-white truncate flex-1 text-sm sm:text-base">
            {testTitle}
          </h2>
          <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
            <TestTimer duration={duration} onTimeUp={handleTimeUp} startTime={startTime} />
            <button
              onClick={() => setShowNav(!showNav)}
              className="lg:hidden btn-secondary text-xs py-1.5 px-2.5 flex items-center gap-1"
            >
              <HiMenu className="h-3.5 w-3.5" />
              <span className="hidden xs:inline">{currentQuestionIndex + 1}/{questions.length}</span>
              <span className="xs:hidden">{currentQuestionIndex + 1}</span>
            </button>
            <Button variant="primary" size="sm" onClick={() => setShowSubmitModal(true)}>
              <span className="hidden sm:inline">Submit Test</span>
              <span className="sm:hidden">Submit</span>
            </Button>
            <button
              onClick={() => setShowCloseModal(true)}
              title="Close Test"
              className="p-1.5 sm:p-2 rounded-lg text-dark-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
            >
              <HiX className="h-4 w-4 sm:h-5 sm:w-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex max-w-7xl mx-auto">
        <div className="flex-1 p-3 sm:p-4 lg:p-6 min-w-0">
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
        <div className="hidden lg:block w-64 p-6 pl-0 flex-shrink-0">
          <div className="sticky top-24">
            <TestNavigator questions={questions} onSubmit={() => setShowSubmitModal(true)} />
          </div>
        </div>
      </div>

      {/* Mobile Navigator Drawer */}
      {showNav && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowNav(false)} />
          <div className="absolute right-0 top-0 bottom-0 w-72 bg-white dark:bg-dark-900 p-4 overflow-y-auto">
            <TestNavigator questions={questions} onSubmit={() => { setShowNav(false); setShowSubmitModal(true); }} />
          </div>
        </div>
      )}

      {/* Close Test Confirmation */}
      <Modal isOpen={showCloseModal} onClose={() => setShowCloseModal(false)} title="Close Test?" size="sm">
        <div className="text-center py-4">
          <div className="text-4xl mb-3">🚪</div>
          <p className="text-dark-600 dark:text-dark-400 mb-2 font-medium">
            Are you sure you want to close the test?
          </p>
          <p className="text-sm text-dark-400 mb-6">
            Your progress will be lost and the attempt will remain open. Submit the test to save your answers.
          </p>
          <div className="flex gap-3 justify-center">
            <Button variant="secondary" onClick={() => setShowCloseModal(false)}>Keep Taking Test</Button>
            <Button variant="danger" onClick={handleCloseTest}>Close Test</Button>
          </div>
        </div>
      </Modal>

      {/* Back Button / Navigation Guard */}
      <Modal isOpen={showExitModal} onClose={() => setShowExitModal(false)} title="Leave Test?" size="sm">
        <div className="text-center py-4">
          <div className="text-4xl mb-3">⚠️</div>
          <p className="text-dark-600 dark:text-dark-400 mb-2 font-medium">
            Your test is still in progress!
          </p>
          <p className="text-sm text-dark-400 mb-6">
            Leaving will not submit your answers. Use "Submit Test" to complete, or "Close Test" to exit.
          </p>
          <div className="flex gap-3 justify-center">
            <Button variant="secondary" onClick={() => setShowExitModal(false)}>Stay & Continue</Button>
            <Button variant="danger" onClick={handleCloseTest}>Leave Anyway</Button>
          </div>
        </div>
      </Modal>

      {/* Submit Confirmation */}
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
