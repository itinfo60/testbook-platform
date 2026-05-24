import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { HiPlay, HiClipboardList, HiClock, HiUsers, HiShieldCheck } from 'react-icons/hi';
import { useAuth } from '@/hooks/useAuth';
import { fetchTestById, clearTestState } from '@/features/test/testSlice';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import Button from '@/components/ui/Button';

export default function TestDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { currentTest: test, attemptCount, isPurchased, loading } = useSelector(state => state.tests);
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    dispatch(fetchTestById(id));
    dispatch(clearTestState());
  }, [dispatch, id]);

  const handleAction = () => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: { pathname: `/tests/${id}` } } });
      return;
    }

    if (test.isFree === false && test.price > 0 && !isPurchased) {
      navigate(`/checkout/${id}?type=test`);
      return;
    }

    navigate(`/tests/${id}/take`);
  };

  if (loading || !test) return <LoadingSpinner fullScreen />;

  const isPaidAndUnpurchased = !test.isFree && test.price > 0 && !isPurchased;

  const totalQ = test.questionsCount || test.totalQuestions || test.questions?.length || 0;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="card p-8">
        <div className="flex flex-wrap gap-2 mb-4">
          {test.category && <span className="badge-primary">{typeof test.category === 'object' ? test.category.name : test.category}</span>}
          {test.difficulty && <span className="badge-warning capitalize">{test.difficulty}</span>}
          {test.price > 0 ? (
            <span className="text-sm font-semibold text-dark-900 dark:text-white">₹{test.price}</span>
          ) : test.isFree === true ? (
            <span className="badge-success">Free</span>
          ) : null}
        </div>

        <h1 className="text-2xl md:text-3xl font-bold text-dark-900 dark:text-white mb-3">{test.title}</h1>
        {test.description && <p className="text-dark-600 dark:text-dark-400 mb-6">{test.description}</p>}

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          <div className="card p-4 text-center bg-dark-50 dark:bg-dark-800/50">
            <HiClipboardList className="h-6 w-6 text-primary-500 mx-auto mb-1" />
            <div className="text-lg font-bold text-dark-900 dark:text-white">{totalQ}</div>
            <div className="text-xs text-dark-400">Questions</div>
          </div>
          <div className="card p-4 text-center bg-dark-50 dark:bg-dark-800/50">
            <HiClock className="h-6 w-6 text-accent-500 mx-auto mb-1" />
            <div className="text-lg font-bold text-dark-900 dark:text-white">{test.duration || 60}</div>
            <div className="text-xs text-dark-400">Minutes</div>
          </div>
          <div className="card p-4 text-center bg-dark-50 dark:bg-dark-800/50">
            <HiUsers className="h-6 w-6 text-secondary-500 mx-auto mb-1" />
            <div className="text-lg font-bold text-dark-900 dark:text-white">{attemptCount}</div>
            <div className="text-xs text-dark-400">Attempts</div>
          </div>
          <div className="card p-4 text-center bg-dark-50 dark:bg-dark-800/50">
            <HiShieldCheck className="h-6 w-6 text-amber-500 mx-auto mb-1" />
            <div className="text-lg font-bold text-dark-900 dark:text-white">{test.totalMarks || totalQ}</div>
            <div className="text-xs text-dark-400">Total Marks</div>
          </div>
        </div>

        {/* Instructions */}
        <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800 rounded-xl p-5 mb-6">
          <h3 className="font-semibold text-amber-800 dark:text-amber-400 mb-2">📋 Instructions</h3>
          <ul className="text-sm text-amber-700 dark:text-amber-300 space-y-1.5">
            <li>• This test has {totalQ} questions to be completed in {test.duration || 60} minutes.</li>
            <li>• Each correct answer carries {test.marksPerQuestion || 1} mark(s).</li>
            {test.negativeMarking && <li>• Negative marking: {test.negativeMarks || 0.25} marks per wrong answer.</li>}
            <li>• You can mark questions for review and come back later.</li>
            <li>• The test will auto-submit when time runs out.</li>
            <li>• Make sure you have a stable internet connection.</li>
          </ul>
        </div>

        <div className="flex gap-3 justify-center">
          <Button variant="primary" size="lg" icon={isPaidAndUnpurchased ? null : HiPlay} onClick={handleAction}>
            {isPaidAndUnpurchased ? `Buy Test - ₹${test.price}` : 'Start Test'}
          </Button>
        </div>
      </div>
    </div>
  );
}
