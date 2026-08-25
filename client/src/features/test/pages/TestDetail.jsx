import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  HiPlay,
  HiClipboardList,
  HiClock,
  HiUsers,
  HiShieldCheck,
  HiLockClosed,
} from 'react-icons/hi';
import { useAuth } from '@/hooks/useAuth';
import { fetchTestById, clearTestState } from '@/features/test/testSlice';
import api from '@/services/api';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import Button from '@/components/ui/Button';

export default function TestDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const {
    currentTest: test,
    attemptCount,
    isPurchased,
    loading,
    activeAttempt,
  } = useSelector((state) => state.tests);
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    if (id && id !== 'undefined') {
      dispatch(fetchTestById(id))
        .unwrap()
        .catch((err) => {
          // If the ID was a Test Series instead of a standalone test, redirect smoothly
          api
            .get(`/test-series/${id}`)
            .then(() => navigate(`/test-series/${id}`, { replace: true }))
            .catch(() => {});
        });
    }
    return () => dispatch(clearTestState());
  }, [dispatch, id, navigate]);

  const handleAction = () => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: { pathname: `/tests/${id}` } } });
      return;
    }

    if (!test.isFree && !isPurchased) {
      const targetSeriesId =
        test.associatedSeries?.id || test.associatedSeries?._id || test.associatedSeries?.slug;

      if (targetSeriesId && targetSeriesId !== 'undefined') {
        // Test is part of a series pack -> redirect to series checkout
        navigate(`/checkout/${targetSeriesId}?type=test_series`);
      } else {
        // Individual standalone test checkout
        const testTargetId = test.id || test._id || id;
        navigate(`/checkout/${testTargetId}?type=test`);
      }
      return;
    }

    navigate(`/tests/${id}/take`);
  };

  if (loading || !test) return <LoadingSpinner fullScreen />;

  const isPaidAndUnpurchased = !test.isFree && !isPurchased;
  const hasReachedLimit = test.maxAttempts > 0 && attemptCount >= test.maxAttempts;
  const isButtonDisabled = hasReachedLimit && !isPaidAndUnpurchased;

  let buttonText = attemptCount > 0 ? 'Retake Test' : 'Start Test';
  if (isPaidAndUnpurchased) {
    if (test.associatedSeries?.id) {
      buttonText = `Unlock via ${test.associatedSeries.title} — ₹${test.associatedSeries.price || test.price}`;
    } else {
      buttonText = `Unlock Test — ₹${test.price}`;
    }
  } else if (hasReachedLimit) {
    buttonText = 'Attempts Limit Reached';
  }

  const totalQ = test.questionsCount || test.totalQuestions || test.questions?.length || 0;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      <div className="card p-4 sm:p-6 lg:p-8">
        <div className="flex flex-wrap gap-2 mb-4">
          {test.category && (
            <span className="badge-primary">
              {typeof test.category === 'object' ? test.category.name : test.category}
            </span>
          )}
          {test.difficulty && <span className="badge-warning capitalize">{test.difficulty}</span>}
          {test.price > 0 ? (
            <span className="text-sm font-semibold text-dark-900 dark:text-white">
              ₹{test.price}
            </span>
          ) : test.isFree === true ? (
            <span className="badge-success">Free</span>
          ) : null}
        </div>

        <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-dark-900 dark:text-white mb-3 leading-tight">
          {test.title}
        </h1>
        {test.description && (
          <p className="text-dark-600 dark:text-dark-400 mb-4 text-sm sm:text-base">
            {test.description}
          </p>
        )}

        {test.associatedSeries && (
          <div className="mb-6 p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950/40 dark:to-purple-950/30 border border-indigo-200 dark:border-indigo-800/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="inline-flex items-center gap-1 text-[11px] font-extrabold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                📦 Included in Full Test Series
              </span>
              <h4 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white mt-1">
                {test.associatedSeries.title}
              </h4>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                Complete package with all mock tests, PYQs & All India Rankings for ₹
                {test.associatedSeries.price || test.price}
              </p>
            </div>
            <button
              onClick={() =>
                navigate(`/test-series/${test.associatedSeries.slug || test.associatedSeries.id}`)
              }
              className="px-4 py-2.5 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-indigo-600 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-700 rounded-xl font-bold text-xs sm:text-sm shrink-0 transition-colors shadow-sm cursor-pointer"
            >
              View Test Series →
            </button>
          </div>
        )}

        {/* Test Meta Info */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          <div className="flex items-center gap-3">
            <HiClock className="h-6 w-6 text-primary-500 flex-shrink-0" />
            <div>
              <p className="text-xs text-dark-500 dark:text-dark-400">Duration</p>
              <p className="text-sm font-semibold text-dark-900 dark:text-white">
                {test.duration || 60} mins
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <HiClipboardList className="h-6 w-6 text-primary-500 flex-shrink-0" />
            <div>
              <p className="text-xs text-dark-500 dark:text-dark-400">Questions</p>
              <p className="text-sm font-semibold text-dark-900 dark:text-white">{totalQ}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <HiShieldCheck className="h-6 w-6 text-primary-500 flex-shrink-0" />
            <div>
              <p className="text-xs text-dark-500 dark:text-dark-400">Total Marks</p>
              <p className="text-sm font-semibold text-dark-900 dark:text-white">
                {test.totalMarks || 100}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <HiUsers className="h-6 w-6 text-primary-500 flex-shrink-0" />
            <div>
              <p className="text-xs text-dark-500 dark:text-dark-400">Attempts Taken</p>
              <p className="text-sm font-semibold text-dark-900 dark:text-white">
                {attemptCount}
                {test.maxAttempts > 0 && (
                  <span className="text-xs font-normal text-dark-400">
                    {' '}
                    / {test.maxAttempts} max
                  </span>
                )}
              </p>
            </div>
          </div>
        </div>

        {/* Instructions */}
        {test.instructions && test.instructions.length > 0 && (
          <div className="mb-8">
            <h3 className="text-base font-semibold text-dark-900 dark:text-white mb-3">
              Instructions
            </h3>
            <ul className="list-disc list-inside space-y-1 text-sm text-dark-600 dark:text-dark-400">
              {Array.isArray(test.instructions) ? (
                test.instructions.map((inst, i) => <li key={i}>{inst}</li>)
              ) : (
                <li>{test.instructions}</li>
              )}
            </ul>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center justify-end gap-3 pt-4 border-t border-dark-100 dark:border-dark-700">
          {attemptCount > 0 && (
            <Button variant="outline" size="lg" onClick={() => navigate(`/tests/${id}/result`)}>
              View Previous Result
            </Button>
          )}

          {isPaidAndUnpurchased ? (
            <div className="w-full sm:w-auto flex flex-col items-center sm:items-end gap-1.5">
              <button
                onClick={handleAction}
                className="w-full sm:w-auto px-8 py-3.5 bg-gradient-to-r from-primary-600 to-indigo-600 hover:from-primary-700 hover:to-indigo-700 text-white rounded-xl font-bold text-base transition-all shadow-lg shadow-primary-500/25 flex items-center justify-center gap-2 cursor-pointer"
              >
                <HiLockClosed className="h-5 w-5" />
                <span>
                  {test.associatedSeries?.id
                    ? `Unlock Full Series — ₹${test.associatedSeries.price || test.price}`
                    : `Unlock Test — ₹${test.price}`}
                </span>
              </button>
            </div>
          ) : (
            <Button
              variant="primary"
              size="lg"
              icon={hasReachedLimit ? null : HiPlay}
              onClick={handleAction}
              disabled={isButtonDisabled}
              className="min-w-[200px]"
            >
              {hasReachedLimit
                ? 'Attempts Limit Reached'
                : attemptCount > 0
                  ? 'Retake Test'
                  : 'Start Test'}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
