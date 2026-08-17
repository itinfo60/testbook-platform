import LoadingSpinner from '@/components/common/LoadingSpinner';
import { Button, Modal } from '@/components/ui';
import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { startTest, submitTest, setAnswer, setCurrentQuestion } from '@/features/test/testSlice';
import TestTimer from '../components/TestTimer';
import TestNavigator from '../components/TestNavigator';
import TestQuestion from '../components/TestQuestion';
import toast from 'react-hot-toast';
import {
  HiX,
  HiMenu,
  HiCheckCircle,
  HiBookmark,
  HiExclamationCircle,
  HiQuestionMarkCircle,
  HiShieldCheck,
} from 'react-icons/hi';
import api, { testAPI } from '@/services/api';

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
  !!(
    document.fullscreenElement ||
    document.webkitFullscreenElement ||
    document.mozFullScreenElement
  );

export default function TestTaking() {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const {
    attempt,
    questions: storedQuestions,
    answers,
    markedForReview,
    currentQuestionIndex,
    loading,
    result,
  } = useSelector((state) => state.tests);

  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [showNav, setShowNav] = useState(false);
  const [showExitModal, setShowExitModal] = useState(false);
  const [showCloseModal, setShowCloseModal] = useState(false);
  const [isAutoSaving, setIsAutoSaving] = useState(false);
  const isExitingRef = useRef(false);
  const questions = storedQuestions.length ? storedQuestions : attempt?.questions || [];
  const currentQuestion = questions[currentQuestionIndex];
  const duration = attempt?.duration || 60;
  const isTestActive = !!attempt && !result;

  const attemptId = attempt?.attempt?._id || attempt?._id;
  const startTime = attempt?.attempt?.startedAt || attempt?.startedAt;
  const testTitle = attempt?.title || attempt?.test?.title || 'Test';

  // Start or resume test
  useEffect(() => {
    if (result || loading || attempt) return;
    dispatch(startTest(id))
      .unwrap()
      .catch((err) => {
        toast.error(err || 'Failed to start test', { duration: 5000 });
        navigate(`/tests/${id}`);
      });
  }, [dispatch, id, result, loading, attempt, navigate]);

  // Restore answers from localStorage backup on attempt load
  useEffect(() => {
    if (!attemptId || result) return;
    try {
      const backup = localStorage.getItem(`test_backup_${attemptId}`);
      if (backup) {
        const parsed = JSON.parse(backup);
        Object.entries(parsed).forEach(([qId, ans]) => {
          if (answers[qId] === undefined && ans !== undefined) {
            dispatch(setAnswer({ questionId: qId, answer: ans }));
          }
        });
      }
    } catch {}
  }, [attemptId, result, dispatch]);

  // Backup answers to localStorage on every change
  useEffect(() => {
    if (!attemptId || result || Object.keys(answers).length === 0) return;
    try {
      localStorage.setItem(`test_backup_${attemptId}`, JSON.stringify(answers));
    } catch {}
  }, [answers, attemptId, result]);

  // Fullscreen management
  useEffect(() => {
    if (!attempt) return;
    enterFullscreen().catch(() => {});
  }, [!!attempt]);

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

  // Anti-cheat protections
  useEffect(() => {
    if (!isTestActive) return;
    const handler = (e) => e.preventDefault();
    document.addEventListener('contextmenu', handler);
    return () => document.removeEventListener('contextmenu', handler);
  }, [isTestActive]);

  useEffect(() => {
    if (!isTestActive) return;
    const handler = (e) => {
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
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
      }
    };
    document.addEventListener('keydown', handler, true);
    return () => document.removeEventListener('keydown', handler, true);
  }, [isTestActive]);

  // Tab switch warning & violation logging
  useEffect(() => {
    if (!isTestActive || !attemptId) return;
    const handler = () => {
      toast('Please focus on the test window!', { icon: '⚠️', id: 'focus-warn' });
      testAPI.logViolation(attemptId).catch(() => {});
    };
    window.addEventListener('blur', handler);
    return () => window.removeEventListener('blur', handler);
  }, [isTestActive, attemptId]);

  // Auto-save heartbeat to server every 30 seconds
  useEffect(() => {
    if (!attempt || !isTestActive || !attemptId) return;
    const interval = setInterval(async () => {
      try {
        const payload = Object.entries(answers).map(([questionId, selectedOptions]) => ({
          questionId,
          selectedOptions: Array.isArray(selectedOptions) ? selectedOptions : [selectedOptions],
        }));
        if (payload.length === 0) return;
        setIsAutoSaving(true);
        await api.post(`/tests/auto-save/${attemptId}`, { answers: payload });
        setTimeout(() => setIsAutoSaving(false), 1500);
      } catch {
        setIsAutoSaving(false);
      }
    }, 30000);
    return () => clearInterval(interval);
  }, [attempt, isTestActive, answers, attemptId]);

  // Navigate to result once submitted
  useEffect(() => {
    if (result) {
      isExitingRef.current = true;
      exitFullscreen().catch(() => {});
      try {
        localStorage.removeItem(`test_backup_${attemptId}`);
      } catch {}
      navigate(`/tests/${id}/result`, { replace: true });
    }
  }, [result, navigate, id, attemptId]);

  const handleSubmit = useCallback(() => {
    setShowSubmitModal(false);
    dispatch(submitTest({ attemptId, answers }));
    toast.success('Test submitted successfully!');
  }, [dispatch, attemptId, answers]);

  const handleTimeUp = useCallback(() => {
    toast.error('Time is up! Auto-submitting test...');
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
      dispatch(setCurrentQuestion(currentQuestionIndex + 1));
    } else {
      setShowSubmitModal(true);
    }
  };

  const handlePrev = () => {
    if (currentQuestionIndex > 0) {
      dispatch(setCurrentQuestion(currentQuestionIndex - 1));
    }
  };

  // Keyboard shortcut listener for options (1-4 or A-D)
  useEffect(() => {
    if (!isTestActive || !currentQuestion) return;
    const qId = currentQuestion._id || currentQuestion.id || currentQuestionIndex;
    const handler = (e) => {
      if (['input', 'textarea'].includes(e.target.tagName.toLowerCase())) return;
      if (['1', 'a', 'A'].includes(e.key)) dispatch(setAnswer({ questionId: qId, answer: 0 }));
      else if (['2', 'b', 'B'].includes(e.key)) dispatch(setAnswer({ questionId: qId, answer: 1 }));
      else if (['3', 'c', 'C'].includes(e.key)) dispatch(setAnswer({ questionId: qId, answer: 2 }));
      else if (['4', 'd', 'D'].includes(e.key)) dispatch(setAnswer({ questionId: qId, answer: 3 }));
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isTestActive, currentQuestion, currentQuestionIndex, dispatch]);

  if (loading && !attempt) return <LoadingSpinner fullScreen text="Loading test environment..." />;

  if (!questions.length) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50 dark:bg-dark-950 p-4">
        <div className="text-center bg-white dark:bg-dark-950 p-10 rounded-3xl border border-slate-200/50 dark:border-dark-800/50 max-w-md shadow-premium transition-all duration-300">
          <div className="text-5xl mb-4">📝</div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white mb-2">
            Unable to load test
          </h2>
          <p className="text-slate-600 text-sm mb-6">
            We couldn't retrieve the questions for this test. Please try again.
          </p>
          <Button onClick={() => navigate(`/tests/${id}`)}>Go Back</Button>
        </div>
      </div>
    );
  }

  const answeredCount = Object.keys(answers).filter((k) => answers[k] !== undefined).length;
  const markedCount = markedForReview.length;
  const unansweredCount = Math.max(0, questions.length - answeredCount);

  return (
    <div className="test-fullscreen min-h-screen bg-white dark:bg-dark-950 select-none transition-colors duration-300">
      {/* ── Sticky Top Header ── */}
      <div className="sticky top-0 z-30 bg-white/80 dark:bg-dark-950/80 backdrop-blur-2xl border-b border-slate-200/50 dark:border-dark-800/50 px-4 sm:px-8 py-4 shadow-premium transition-all duration-300">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <h2 className="font-extrabold tracking-tight text-slate-900 dark:text-white truncate text-base sm:text-lg font-display">
              {testTitle}
            </h2>

            {/* Auto-Save Indicator */}
            <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 dark:bg-dark-800 text-[11px] font-bold text-slate-600">
              <span
                className={`h-2 w-2 rounded-full ${
                  isAutoSaving ? 'bg-amber-800 animate-ping' : 'bg-emerald-500'
                }`}
              />
              <span>{isAutoSaving ? 'Auto-saving...' : 'Saved'}</span>
            </div>
          </div>

          <div className="flex items-center gap-3 sm:gap-4 flex-shrink-0">
            {/* Timer */}
            <TestTimer duration={duration} onTimeUp={handleTimeUp} startTime={startTime} />

            <div className="hidden sm:block w-px h-6 bg-slate-200 dark:bg-dark-800 mx-1"></div>

            {/* Mobile Navigator Drawer Toggle */}
            <button
              onClick={() => setShowNav(!showNav)}
              className="lg:hidden bg-slate-100 dark:bg-dark-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-dark-700 font-bold text-xs py-2 px-3 rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <HiMenu className="h-4 w-4" />
              <span className="hidden xs:inline">
                {currentQuestionIndex + 1}/{questions.length}
              </span>
              <span className="xs:hidden">{currentQuestionIndex + 1}</span>
            </button>

            {/* Submit Button */}
            <button
              className="bg-amber-800 hover:bg-amber-800 text-white font-bold py-2 px-5 sm:px-6 rounded-xl transition-all shadow-md text-xs sm:text-sm active:scale-95 cursor-pointer"
              onClick={() => setShowSubmitModal(true)}
            >
              Submit Test
            </button>

            {/* Close Button */}
            <button
              onClick={() => setShowCloseModal(true)}
              title="Close Test"
              className="p-2 rounded-xl text-slate-600 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors flex items-center justify-center h-9 w-9 bg-slate-50 dark:bg-dark-800 cursor-pointer"
            >
              <HiX className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>

      {/* ── Main Layout (Question + Navigator) ── */}
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
        <div className="hidden lg:block w-72 p-6 pl-0 flex-shrink-0">
          <div className="sticky top-24">
            <TestNavigator questions={questions} onSubmit={() => setShowSubmitModal(true)} />
          </div>
        </div>
      </div>

      {/* Mobile Navigator Drawer */}
      {showNav && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowNav(false)} />
          <div className="absolute right-0 top-0 bottom-0 w-80 max-w-[85vw] bg-white dark:bg-dark-950 p-6 overflow-y-auto shadow-premium transition-transform duration-300">
            <div className="flex items-center justify-between mb-3 pb-3 border-b border-slate-100 dark:border-dark-800">
              <span className="font-bold tracking-tight text-sm text-slate-900 dark:text-white">
                Question Palette
              </span>
              <button onClick={() => setShowNav(false)} className="p-1 rounded-lg text-slate-600">
                <HiX className="h-5 w-5" />
              </button>
            </div>
            <TestNavigator
              questions={questions}
              onSubmit={() => {
                setShowNav(false);
                setShowSubmitModal(true);
              }}
            />
          </div>
        </div>
      )}

      {/* ── Submit Confirmation Modal ── */}
      <Modal
        isOpen={showSubmitModal}
        onClose={() => setShowSubmitModal(false)}
        title="Submit Test?"
        size="md"
      >
        <div className="py-2">
          <div className="text-center mb-6">
            <div className="text-5xl mb-2">📋</div>
            <h3 className="text-lg font-extrabold tracking-tight text-slate-900 dark:text-white">
              Are you ready to submit your test?
            </h3>
            <p className="text-xs text-slate-600 mt-1">
              Please review your attempt summary below before final submission.
            </p>
          </div>

          {/* Detailed Statistics Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mb-6">
            <div className="bg-slate-50 dark:bg-dark-800 p-3 rounded-2xl border border-slate-200 dark:border-dark-700 text-center">
              <div className="text-xl font-black text-dark-900 dark:text-white">
                {questions.length}
              </div>
              <div className="text-[10px] font-bold text-slate-600 uppercase tracking-wider mt-0.5">
                Total
              </div>
            </div>
            <div className="bg-success-50 dark:bg-success-950/30 p-3 rounded-2xl border border-success-200 dark:border-success-900/50 text-center">
              <div className="text-xl font-black text-success-600 dark:text-success-400">
                {answeredCount}
              </div>
              <div className="text-[10px] font-bold text-success-600 dark:text-success-400 uppercase tracking-wider mt-0.5">
                Answered
              </div>
            </div>
            <div className="bg-warning-50 dark:bg-warning-950/30 p-3 rounded-2xl border border-warning-200 dark:border-warning-900/50 text-center">
              <div className="text-xl font-black text-warning-600 dark:text-warning-400">
                {markedCount}
              </div>
              <div className="text-[10px] font-bold text-warning-600 dark:text-warning-400 uppercase tracking-wider mt-0.5">
                Marked
              </div>
            </div>
            <div className="bg-slate-100 dark:bg-slate-900/50 p-3 rounded-2xl border border-slate-200 dark:border-slate-800/50 text-center">
              <div className="text-xl font-black text-slate-600 dark:text-slate-400">
                {unansweredCount}
              </div>
              <div className="text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mt-0.5">
                Unanswered
              </div>
            </div>
          </div>

          {unansweredCount > 0 && (
            <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 p-3.5 rounded-xl text-xs text-amber-800 dark:text-amber-300 font-medium mb-6 flex items-center gap-2">
              <HiExclamationCircle className="h-5 w-5 flex-shrink-0 text-amber-800" />
              <span>
                You have <strong>{unansweredCount}</strong> unanswered questions. Once submitted,
                you cannot change your answers.
              </span>
            </div>
          )}

          <div className="flex gap-3 justify-center">
            <Button variant="secondary" onClick={() => setShowSubmitModal(false)}>
              Back to Questions
            </Button>
            <Button variant="primary" onClick={handleSubmit} loading={loading}>
              Confirm & Submit
            </Button>
          </div>
        </div>
      </Modal>

      {/* ── Close Test Confirmation ── */}
      <Modal
        isOpen={showCloseModal}
        onClose={() => setShowCloseModal(false)}
        title="Exit Test?"
        size="sm"
      >
        <div className="text-center py-4">
          <div className="text-4xl mb-3">🚪</div>
          <p className="text-slate-900 dark:text-white font-bold tracking-tight mb-1">
            Are you sure you want to exit?
          </p>
          <p className="text-xs text-slate-600 mb-6">
            Your progress will be saved, but the timer will continue running until you return.
          </p>
          <div className="flex gap-3 justify-center">
            <Button variant="secondary" onClick={() => setShowCloseModal(false)}>
              Keep Practicing
            </Button>
            <Button variant="danger" onClick={handleCloseTest}>
              Exit Test
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
