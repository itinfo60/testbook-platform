import { Link, useLocation, useSearchParams } from 'react-router-dom';
import { useMemo, useEffect, useRef } from 'react';
import { useDispatch } from 'react-redux';
import { motion } from 'framer-motion';
import { HiCheckCircle, HiArrowRight, HiPlay, HiBookOpen, HiAcademicCap } from 'react-icons/hi';
import { clearApiCache } from '@/services/api';
import { fetchMyEnrollments } from '@/features/enrollment/enrollmentSlice';
import { getProfile } from '@/features/auth/authSlice';

export default function CheckoutSuccess() {
  const dispatch = useDispatch();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const fetchedRef = useRef(false);

  useEffect(() => {
    if (fetchedRef.current) return;
    fetchedRef.current = true;

    clearApiCache('courses');
    clearApiCache('enrollment');
    clearApiCache('tests');
    dispatch(fetchMyEnrollments());
    dispatch(getProfile());
  }, [dispatch]);

  const checkoutData = useMemo(() => {
    // 1. Check location state
    if (
      location.state &&
      (location.state.courseId || location.state.testId || location.state.testSeriesId)
    ) {
      return location.state;
    }

    // 2. Check query parameters
    const qType = searchParams.get('type');
    const qId = searchParams.get('id');
    const qName = searchParams.get('name');

    if (qId) {
      return {
        courseId: qType === 'course' ? qId : null,
        testId: qType === 'test' ? qId : null,
        testSeriesId: qType === 'series' ? qId : null,
        itemName: qName || '',
        isTest: qType === 'test' || qType === 'series',
        isSeries: qType === 'series',
      };
    }

    // 3. Check sessionStorage fallback
    try {
      const stored = sessionStorage.getItem('last_checkout_state');
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {}

    return {};
  }, [location.state, searchParams]);

  const { courseId, testId, testSeriesId, itemName, free, isTest, isSeries } = checkoutData;

  return (
    <div className="max-w-lg mx-auto px-4 py-12 sm:py-16 text-center">
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', damping: 15, stiffness: 200 }}
      >
        <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 mb-6 shadow-inner border border-emerald-200 dark:border-emerald-800">
          <HiCheckCircle className="h-16 w-16" />
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <h1 className="text-2xl sm:text-3xl font-extrabold text-dark-900 dark:text-white mb-3 tracking-tight">
          {free ? 'Enrolled Successfully!' : 'Payment Successful! 🎉'}
        </h1>
        <p className="text-dark-600 dark:text-dark-300 mb-3 text-sm sm:text-base leading-relaxed">
          {isSeries
            ? 'Your test series has been unlocked! You can now attempt all full-length and topic mock tests.'
            : isTest
              ? 'Your test is ready! You can begin whenever you are prepared.'
              : free
                ? 'You have been enrolled in the course successfully.'
                : 'Your payment was verified and processed. Your learning materials are now unlocked.'}
        </p>

        {itemName && (
          <div className="inline-block px-4 py-2 bg-primary-50 dark:bg-primary-950/40 border border-primary-200 dark:border-primary-800/60 rounded-xl text-primary-700 dark:text-primary-300 font-semibold text-sm sm:text-base mb-8 shadow-sm">
            {itemName}
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3 justify-center mt-2">
          {isSeries ? (
            <>
              <Link
                to={`/test-series/${testSeriesId || testId}`}
                className="btn-primary flex items-center justify-center gap-2"
              >
                <HiPlay className="h-5 w-5" />
                View Test Series
              </Link>
              <Link to="/test-series" className="btn-secondary">
                Browse More Series
              </Link>
            </>
          ) : isTest && testId ? (
            <>
              <Link
                to={`/tests/${testId}/take`}
                className="btn-primary flex items-center justify-center gap-2"
              >
                <HiPlay className="h-5 w-5" />
                Start Test Now
              </Link>
              <Link to="/tests" className="btn-secondary">
                Browse More Tests
              </Link>
            </>
          ) : courseId ? (
            <>
              <Link
                to={`/courses/${courseId}/learn`}
                className="btn-primary flex items-center justify-center gap-2"
              >
                Start Learning <HiArrowRight className="h-5 w-5" />
              </Link>
              <Link
                to="/my-courses"
                className="btn-secondary flex items-center justify-center gap-2"
              >
                <HiBookOpen className="h-5 w-5" /> My Courses
              </Link>
            </>
          ) : (
            <>
              <Link to="/my-courses" className="btn-primary flex items-center justify-center gap-2">
                <HiAcademicCap className="h-5 w-5" /> My Enrolled Courses
              </Link>
              <Link to="/courses" className="btn-secondary">
                Browse Courses
              </Link>
            </>
          )}
          <Link to="/dashboard" className="btn-ghost">
            Dashboard
          </Link>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="mt-10 sm:mt-12"
      >
        <div className="card p-5 sm:p-6 text-left max-w-sm mx-auto border border-gray-100 dark:border-gray-800 shadow-sm rounded-2xl">
          <h3 className="font-semibold text-dark-900 dark:text-white mb-3 text-sm flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-500"></span> What's next?
          </h3>
          {isTest ? (
            <ul className="space-y-2.5 text-xs sm:text-sm text-dark-600 dark:text-dark-400">
              <li className="flex items-start gap-2.5">
                <span className="h-5 w-5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-600 text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                  1
                </span>
                <span>Read the instructions carefully before starting</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="h-5 w-5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-600 text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                  2
                </span>
                <span>Attempt all questions within the allocated time</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="h-5 w-5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-600 text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                  3
                </span>
                <span>Review detailed solutions and performance analytics</span>
              </li>
            </ul>
          ) : (
            <ul className="space-y-2.5 text-xs sm:text-sm text-dark-600 dark:text-dark-400">
              <li className="flex items-start gap-2.5">
                <span className="h-5 w-5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-600 text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                  1
                </span>
                <span>Access all video lectures and downloadable PDFs</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="h-5 w-5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-600 text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                  2
                </span>
                <span>Practice section quizzes and topic-wise mock tests</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="h-5 w-5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-600 text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                  3
                </span>
                <span>Track your progress toward exam completion</span>
              </li>
            </ul>
          )}
        </div>
      </motion.div>
    </div>
  );
}
