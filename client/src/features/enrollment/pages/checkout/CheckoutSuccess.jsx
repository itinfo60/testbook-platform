import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { HiCheckCircle, HiArrowRight, HiPlay } from 'react-icons/hi';

export default function CheckoutSuccess() {
  const location = useLocation();
  const navigate = useNavigate();
  const { courseId, testId, testSeriesId, itemName, free, isTest, isSeries } = location.state || {};

  // If someone lands here directly without state, redirect home
  useEffect(() => {
    if (!courseId && !testId && !testSeriesId) {
      navigate('/', { replace: true });
    }
  }, [courseId, testId, testSeriesId, navigate]);

  if (!courseId && !testId && !testSeriesId) return null;

  return (
    <div className="max-w-lg mx-auto px-4 py-12 sm:py-16 text-center">
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', damping: 15, stiffness: 200 }}
      >
        <HiCheckCircle className="h-20 w-20 text-secondary-500 mx-auto mb-6" />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <h1 className="text-2xl sm:text-3xl font-bold text-dark-900 dark:text-white mb-3">
          {free ? 'Enrolled Successfully!' : 'Payment Successful!'}
        </h1>
        <p className="text-dark-500 mb-2 text-sm sm:text-base">
          {isSeries
            ? 'Your test series has been unlocked. You can now attempt all full-length and topic tests.'
            : isTest
              ? 'You can now start the test whenever you are ready.'
              : free
                ? 'You have been enrolled in the course.'
                : 'Your payment has been processed. You are now enrolled.'}
        </p>
        {itemName && (
          <p className="text-base sm:text-lg font-medium text-primary-600 dark:text-primary-400 mb-8">
            {itemName}
          </p>
        )}

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          {isSeries ? (
            <>
              <Link
                to={`/test-series/${testSeriesId || testId}`}
                className="btn-primary flex items-center justify-center gap-2"
              >
                <HiPlay className="h-4 w-4" />
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
                <HiPlay className="h-4 w-4" />
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
                Start Learning <HiArrowRight className="h-4 w-4" />
              </Link>
              <Link to="/my-courses" className="btn-secondary">
                My Courses
              </Link>
            </>
          ) : null}
          <Link to="/dashboard" className="btn-ghost">
            Dashboard
          </Link>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="mt-10 sm:mt-12"
      >
        <div className="card p-5 sm:p-6 text-left max-w-sm mx-auto">
          <h3 className="font-semibold text-dark-900 dark:text-white mb-3">What's next?</h3>
          {isTest ? (
            <ul className="space-y-2 text-sm text-dark-600 dark:text-dark-400">
              <li className="flex items-center gap-2">
                <span className="h-5 w-5 rounded-full bg-secondary-100 dark:bg-secondary-900/30 flex items-center justify-center text-secondary-600 text-xs flex-shrink-0">
                  1
                </span>
                Read the instructions carefully before starting
              </li>
              <li className="flex items-center gap-2">
                <span className="h-5 w-5 rounded-full bg-secondary-100 dark:bg-secondary-900/30 flex items-center justify-center text-secondary-600 text-xs flex-shrink-0">
                  2
                </span>
                Attempt all questions within the time limit
              </li>
              <li className="flex items-center gap-2">
                <span className="h-5 w-5 rounded-full bg-secondary-100 dark:bg-secondary-900/30 flex items-center justify-center text-secondary-600 text-xs flex-shrink-0">
                  3
                </span>
                Review your results and learn from mistakes
              </li>
            </ul>
          ) : (
            <ul className="space-y-2 text-sm text-dark-600 dark:text-dark-400">
              <li className="flex items-center gap-2">
                <span className="h-5 w-5 rounded-full bg-secondary-100 dark:bg-secondary-900/30 flex items-center justify-center text-secondary-600 text-xs flex-shrink-0">
                  1
                </span>
                Start with the first lesson
              </li>
              <li className="flex items-center gap-2">
                <span className="h-5 w-5 rounded-full bg-secondary-100 dark:bg-secondary-900/30 flex items-center justify-center text-secondary-600 text-xs flex-shrink-0">
                  2
                </span>
                Complete quizzes after each section
              </li>
              <li className="flex items-center gap-2">
                <span className="h-5 w-5 rounded-full bg-secondary-100 dark:bg-secondary-900/30 flex items-center justify-center text-secondary-600 text-xs flex-shrink-0">
                  3
                </span>
                Earn your certificate upon completion
              </li>
            </ul>
          )}
        </div>
      </motion.div>
    </div>
  );
}
