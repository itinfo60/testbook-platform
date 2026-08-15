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
        setPurchasedTests(
          Array.isArray(testEnrollments) ? testEnrollments : testEnrollments.docs || []
        );

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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      <h1 className="text-3xl font-extrabold text-dark-900 dark:text-white font-display mb-8">
        My Tests & Progress
      </h1>

      <div className="mb-12">
        <h2 className="text-xl font-bold text-dark-900 dark:text-white mb-6 flex items-center gap-2">
          <span className="h-6 w-1.5 bg-primary-500 rounded-full"></span>
          Purchased Test Series
        </h2>
        {purchasedTests.length === 0 ? (
          <div className="bg-white dark:bg-dark-900 p-8 sm:p-12 text-center rounded-3xl border border-dashed border-slate-300 dark:border-dark-700 shadow-sm">
            <div className="text-5xl mb-4">📚</div>
            <p className="text-dark-900 dark:text-white font-bold text-lg mb-2">
              You haven't unlocked any exclusive tests.
            </p>
            <p className="text-slate-500 mb-6 font-medium">
              Get a test series pass to unlock premium mock tests and PYQs.
            </p>
            <Link
              to="/test-series"
              className="bg-primary-600 hover:bg-primary-700 text-white font-bold py-3 px-6 rounded-xl transition-colors inline-block"
            >
              Explore Test Series
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {purchasedTests.map((enrollment) => {
              const test = enrollment.test;
              if (!test) return null;
              return (
                <div
                  key={enrollment._id}
                  className="bg-white dark:bg-dark-900 p-6 rounded-3xl border border-slate-200 dark:border-dark-800 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all flex flex-col group relative overflow-hidden"
                >
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary-400 to-secondary-500 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  <h3 className="font-extrabold text-lg text-dark-900 dark:text-white mb-3 line-clamp-2 group-hover:text-primary-600 transition-colors">
                    {test.title}
                  </h3>
                  <div className="text-sm font-bold text-slate-500 dark:text-slate-400 mb-6 flex flex-wrap items-center gap-3">
                    <span className="flex items-center gap-1 bg-slate-50 dark:bg-dark-800 px-2 py-1 rounded-md">
                      <HiClock className="h-4 w-4 text-amber-500" /> {test.duration} mins
                    </span>
                    <span className="flex items-center gap-1 bg-slate-50 dark:bg-dark-800 px-2 py-1 rounded-md">
                      <HiCheckCircle className="h-4 w-4 text-emerald-500" /> {test.questionsCount}{' '}
                      Qs
                    </span>
                  </div>
                  <div className="mt-auto pt-4 border-t border-slate-100 dark:border-dark-800">
                    <Link
                      to={`/tests/${test._id}`}
                      className="flex items-center justify-center gap-2 w-full py-2.5 bg-primary-50 hover:bg-primary-100 dark:bg-primary-900/30 dark:hover:bg-primary-900/50 text-primary-700 dark:text-primary-300 font-bold rounded-xl transition-colors"
                    >
                      <HiPlay className="h-4 w-4" /> Start Practicing
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div>
        <h2 className="text-xl font-bold text-dark-900 dark:text-white mb-6 flex items-center gap-2">
          <span className="h-6 w-1.5 bg-secondary-500 rounded-full"></span>
          Attempt History
        </h2>
        {attempts.length === 0 ? (
          <div className="bg-white dark:bg-dark-900 p-8 sm:p-12 text-center rounded-3xl border border-dashed border-slate-300 dark:border-dark-700 shadow-sm">
            <div className="text-5xl mb-4 text-slate-300">📊</div>
            <p className="text-dark-900 dark:text-white font-bold text-lg mb-2">
              No attempt history found.
            </p>
            <p className="text-slate-500 mb-6 font-medium">
              Your test attempts and performance analysis will appear here.
            </p>
            <Link
              to="/tests"
              className="bg-secondary-500 hover:bg-secondary-600 text-white font-bold py-3 px-6 rounded-xl transition-colors inline-block"
            >
              Take a Free Test
            </Link>
          </div>
        ) : (
          <div className="space-y-3 sm:space-y-4">
            {attempts.map((attempt) => (
              <div
                key={attempt._id}
                className="bg-white dark:bg-dark-900 p-5 rounded-3xl border border-slate-200 dark:border-dark-800 shadow-sm hover:shadow-md flex flex-col sm:flex-row sm:items-center gap-4 transition-all group"
              >
                <div className="flex-1 min-w-0">
                  <h3 className="font-extrabold text-lg text-dark-900 dark:text-white mb-1.5 truncate group-hover:text-secondary-600 transition-colors">
                    {attempt.test?.title || 'Unknown Test'}
                  </h3>
                  <div className="text-sm font-bold text-slate-500 dark:text-slate-400 flex items-center gap-2">
                    <HiClock className="h-4 w-4 flex-shrink-0 text-slate-400" />
                    {new Date(attempt.startedAt).toLocaleDateString()} •{' '}
                    {new Date(attempt.startedAt).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </div>
                </div>
                <div className="flex items-center justify-between sm:justify-end gap-6 bg-slate-50 dark:bg-dark-800/50 rounded-2xl p-4 border border-slate-100 dark:border-dark-700 flex-shrink-0 w-full sm:w-auto">
                  <div className="text-center">
                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
                      Score
                    </div>
                    <div className="font-extrabold text-2xl text-dark-900 dark:text-white">
                      {attempt.score || 0}
                    </div>
                  </div>
                  <div className="w-px h-10 bg-slate-200 dark:bg-dark-700"></div>
                  <div className="text-center">
                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
                      Status
                    </div>
                    <div
                      className={`font-black text-sm uppercase tracking-wider px-2 py-0.5 rounded-md ${attempt.status === 'completed' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'}`}
                    >
                      {attempt.status}
                    </div>
                  </div>
                  <Link
                    to={`/tests/${attempt.test?._id}/result`}
                    className="h-10 w-10 flex items-center justify-center rounded-xl bg-white dark:bg-dark-700 border border-slate-200 dark:border-dark-600 hover:bg-secondary-50 hover:text-secondary-600 hover:border-secondary-200 transition-colors text-slate-500 shadow-sm flex-shrink-0"
                  >
                    <HiArrowRight className="h-5 w-5" />
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
