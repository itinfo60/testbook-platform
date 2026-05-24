import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { enrollmentAPI, testAPI } from '@/services/api';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import { HiCheckCircle, HiClock, HiArrowRight, HiPlay } from 'react-icons/hi';
import toast from 'react-hot-toast';

export default function MyTestAttempts() {
  const [purchasedTests, setPurchasedTests] = useState([]);
  const [attempts, setAttempts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [enrollmentsRes, attemptsRes] = await Promise.all([
          enrollmentAPI.getMyTestEnrollments(),
          testAPI.getMyAttempts(),
        ]);
        const testEnrollments = enrollmentsRes.data.data || [];
        setPurchasedTests(Array.isArray(testEnrollments) ? testEnrollments : testEnrollments.docs || []);
        
        const testAttempts = attemptsRes.data.data || [];
        setAttempts(Array.isArray(testAttempts) ? testAttempts : testAttempts.docs || []);
      } catch (error) {
        toast.error('Failed to load your tests');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return <LoadingSpinner fullScreen />;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="section-title mb-8">My Tests</h1>

      <div className="mb-10">
        <h2 className="text-xl font-bold text-dark-900 dark:text-white mb-4">Purchased Tests</h2>
        {purchasedTests.length === 0 ? (
          <div className="card p-8 text-center bg-dark-50 dark:bg-dark-800/50 border border-dashed border-dark-200 dark:border-dark-700">
            <p className="text-dark-500 mb-4">You haven't purchased any exclusive tests yet.</p>
            <Link to="/tests" className="btn-primary text-sm">Browse Tests</Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {purchasedTests.map((enrollment) => {
              const test = enrollment.test;
              if (!test) return null;
              return (
                <div key={enrollment._id} className="card p-5 flex flex-col">
                  <h3 className="font-semibold text-lg text-dark-900 dark:text-white mb-2 truncate">
                    {test.title}
                  </h3>
                  <div className="text-sm text-dark-500 mb-4 flex gap-4">
                    <span>{test.duration} mins</span>
                    <span>{test.questionsCount} Questions</span>
                  </div>
                  <div className="mt-auto">
                    <Link to={`/tests/${test._id}`} className="btn-primary w-full justify-center">
                      <HiPlay className="mr-2" /> Open Test
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div>
        <h2 className="text-xl font-bold text-dark-900 dark:text-white mb-4">Past Attempts</h2>
        {attempts.length === 0 ? (
          <div className="card p-8 text-center bg-dark-50 dark:bg-dark-800/50 border border-dashed border-dark-200 dark:border-dark-700">
            <div className="text-4xl mb-4">📊</div>
            <p className="text-dark-500 mb-4">Your test attempts will appear here after you take a test.</p>
            <Link to="/tests" className="btn-secondary text-sm">Take a Free Test</Link>
          </div>
        ) : (
          <div className="space-y-4">
            {attempts.map((attempt) => (
              <div key={attempt._id} className="card p-5 flex flex-col md:flex-row items-center gap-4">
                <div className="flex-1 w-full">
                  <h3 className="font-semibold text-lg text-dark-900 dark:text-white mb-1">
                    {attempt.test?.title || 'Unknown Test'}
                  </h3>
                  <div className="text-sm text-dark-500 flex items-center gap-2">
                    <HiClock /> {new Date(attempt.startedAt).toLocaleDateString()}
                  </div>
                </div>
                <div className="w-full md:w-auto flex items-center justify-between gap-6 bg-dark-50 dark:bg-dark-800 rounded-lg p-3 border border-dark-100 dark:border-dark-700">
                  <div className="text-center">
                    <div className="text-xs text-dark-500 uppercase tracking-wider">Score</div>
                    <div className="font-bold text-lg text-primary-600">{attempt.score || 0}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xs text-dark-500 uppercase tracking-wider">Status</div>
                    <div className={`font-medium ${attempt.status === 'completed' ? 'text-green-600' : 'text-amber-600'}`}>
                      {attempt.status}
                    </div>
                  </div>
                  <Link to={`/tests/${attempt.test?._id}/result`} className="btn-icon">
                    <HiArrowRight />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
