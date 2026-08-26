import * as Sentry from '@sentry/react';
import { useEffect } from 'react';
import { HiExclamationCircle, HiRefresh } from 'react-icons/hi';

function isChunkLoadError(error) {
  if (!error) return false;
  const msg = String(error.message || error).toLowerCase();
  return (
    msg.includes('failed to fetch dynamically imported module') ||
    msg.includes('importing a module script failed') ||
    msg.includes('error loading dynamically imported module') ||
    msg.includes('mime type of "text/html"')
  );
}

function FallbackUI({ error, resetError }) {
  useEffect(() => {
    if (isChunkLoadError(error)) {
      const lastReload = sessionStorage.getItem('chunk_error_reload');
      if (!lastReload || Date.now() - Number(lastReload) > 10000) {
        sessionStorage.setItem('chunk_error_reload', String(Date.now()));
        window.location.reload();
      }
    }
  }, [error]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center">
        <HiExclamationCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
        <h1 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
          {isChunkLoadError(error) ? 'New Version Available' : 'Something went wrong'}
        </h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">
          {isChunkLoadError(error)
            ? 'A new version of the app has been published. Refreshing...'
            : 'An unexpected error occurred. It has been reported automatically.'}
        </p>
        {import.meta.env.DEV && error?.message && (
          <pre className="text-left text-xs bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 mb-4 overflow-auto text-red-700 dark:text-red-300">
            {error.message}
          </pre>
        )}
        <div className="flex gap-3 justify-center">
          <button
            onClick={resetError}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary-600 text-white text-sm font-medium hover:bg-primary-700 transition-colors"
          >
            <HiRefresh className="w-4 h-4" /> Try again
          </button>
          <button
            onClick={() => window.location.assign('/')}
            className="px-4 py-2 rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-sm font-medium hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
          >
            Go home
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ErrorBoundary({ children }) {
  return (
    <Sentry.ErrorBoundary
      fallback={({ error, resetError }) => <FallbackUI error={error} resetError={resetError} />}
    >
      {children}
    </Sentry.ErrorBoundary>
  );
}
