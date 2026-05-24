import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { HiCheckCircle, HiArrowRight } from 'react-icons/hi';

export default function CheckoutSuccess() {
  const location = useLocation();
  const { courseId, courseName, free } = location.state || {};

  return (
    <div className="max-w-lg mx-auto px-4 py-16 text-center">
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
        <h1 className="text-3xl font-bold text-dark-900 dark:text-white mb-3">
          {free ? 'Enrolled Successfully!' : 'Payment Successful!'}
        </h1>
        <p className="text-dark-500 mb-2">
          {free
            ? 'You have been enrolled in the course.'
            : 'Your payment has been processed and you are now enrolled.'}
        </p>
        {courseName && (
          <p className="text-lg font-medium text-primary-600 dark:text-primary-400 mb-8">{courseName}</p>
        )}

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          {courseId && (
            <Link to={`/courses/${courseId}/learn`} className="btn-primary flex items-center justify-center gap-2">
              Start Learning <HiArrowRight className="h-4 w-4" />
            </Link>
          )}
          <Link to="/my-courses" className="btn-secondary">My Courses</Link>
          <Link to="/dashboard" className="btn-ghost">Go to Dashboard</Link>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="mt-12"
      >
        <div className="card p-6 text-left max-w-sm mx-auto">
          <h3 className="font-semibold text-dark-900 dark:text-white mb-3">What's next?</h3>
          <ul className="space-y-2 text-sm text-dark-600 dark:text-dark-400">
            <li className="flex items-center gap-2">
              <span className="h-5 w-5 rounded-full bg-secondary-100 dark:bg-secondary-900/30 flex items-center justify-center text-secondary-600 text-xs">1</span>
              Start with the first lesson
            </li>
            <li className="flex items-center gap-2">
              <span className="h-5 w-5 rounded-full bg-secondary-100 dark:bg-secondary-900/30 flex items-center justify-center text-secondary-600 text-xs">2</span>
              Complete quizzes after each section
            </li>
            <li className="flex items-center gap-2">
              <span className="h-5 w-5 rounded-full bg-secondary-100 dark:bg-secondary-900/30 flex items-center justify-center text-secondary-600 text-xs">3</span>
              Earn your certificate upon completion
            </li>
          </ul>
        </div>
      </motion.div>
    </div>
  );
}
