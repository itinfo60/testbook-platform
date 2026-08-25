import logger from './services/logger';
import ReactDOM from 'react-dom/client';

logger.init();
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { Toaster, ToastBar, toast } from 'react-hot-toast';
import { store } from '@/store/store';
import ErrorBoundary from '@/components/ErrorBoundary';
import App from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <Provider store={store}>
    <BrowserRouter>
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 5000,
          style: {
            background: 'var(--toast-bg, #fff)',
            color: 'var(--toast-color, #1f2937)',
            border: '1px solid var(--toast-border, #e5e7eb)',
          },
        }}
      >
        {(t) => (
          <ToastBar toast={t}>
            {({ icon, message }) => (
              <>
                {icon}
                {message}
                <button
                  onClick={() => toast.dismiss(t.id)}
                  style={{
                    marginLeft: 8,
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: '#9ca3af',
                    fontSize: 16,
                    lineHeight: 1,
                    padding: '0 2px',
                  }}
                  aria-label="Dismiss"
                >
                  ✕
                </button>
              </>
            )}
          </ToastBar>
        )}
      </Toaster>
    </BrowserRouter>
  </Provider>
);
