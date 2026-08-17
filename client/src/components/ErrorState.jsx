import { HiExclamationCircle, HiRefresh } from 'react-icons/hi';
/**
 * ErrorState — unified error state component
 *
 * Props:
 *  title       string  — heading
 *  message     string  — error detail
 *  onRetry     func    — optional retry callback
 */
export default function ErrorState({ title = 'Something went wrong', message, onRetry }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center bg-red-50 dark:bg-red-950/20 rounded-3xl border border-red-200 dark:border-red-900/50 shadow-sm">
      <HiExclamationCircle className="h-14 w-14 text-red-400 mb-4" />
      <h3 className="text-xl font-extrabold text-dark-900 dark:text-white mb-2">{title}</h3>
      {message && (
        <p className="text-slate-500 dark:text-slate-400 text-sm max-w-sm leading-relaxed mb-6">
          {message}
        </p>
      )}
      {onRetry && (
        <button
          onClick={onRetry}
          className="flex items-center gap-2 bg-red-500 hover:bg-red-600 text-white font-bold py-2.5 px-6 rounded-xl transition-colors shadow-sm"
        >
          <HiRefresh className="h-4 w-4" /> Try Again
        </button>
      )}
    </div>
  );
}
