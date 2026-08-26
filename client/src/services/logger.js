/**
 * CivicsEdu Client Telemetry & Action Logger
 * Lightweight, non-blocking batched log dispatcher to the backend
 */

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';

class FrontendLogger {
  constructor(app = 'client') {
    this.app = app;
    this.queue = [];
    this.flushInterval = 3000; // flush every 3s
    this.maxBatchSize = 20;
    this.timer = null;
    this.initialized = false;
  }

  init() {
    if (this.initialized || typeof window === 'undefined') return;
    this.initialized = true;

    // Start background flush loop
    this.startFlushTimer();

    // Capture global uncaught JS errors
    window.addEventListener('error', (event) => {
      this.error('UNCAUGHT_EXCEPTION', event.message, {
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        stack: event.error?.stack,
      });
    });

    // Capture unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      const reason = event.reason;
      this.error(
        'UNHANDLED_PROMISE',
        typeof reason === 'string' ? reason : reason?.message || 'Unhandled Promise Rejection',
        {
          stack: reason?.stack,
        }
      );
    });

    // Flush remaining logs on page unload
    window.addEventListener('beforeunload', () => {
      this.flush(true);
    });

    window.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') {
        this.flush(true);
      }
    });

    this.info('APP_START', `${this.app.toUpperCase()} application session initialized`, {
      userAgent: navigator.userAgent,
      screen: `${window.innerWidth}x${window.innerHeight}`,
    });
  }

  startFlushTimer() {
    if (this.timer) clearInterval(this.timer);
    this.timer = setInterval(() => this.flush(), this.flushInterval);
  }

  getUserContext() {
    try {
      const authStr = localStorage.getItem('auth') || localStorage.getItem('user');
      if (authStr) {
        const parsed = JSON.parse(authStr);
        const u = parsed.user || parsed;
        if (u) {
          return {
            userId: u.id || u._id || null,
            userEmail: u.email || null,
            userName: u.name || null,
          };
        }
      }
    } catch (_) {}
    return {};
  }

  log(level, event, message, details = {}) {
    const userCtx = this.getUserContext();
    const entry = {
      app: this.app,
      level,
      event: String(event).toUpperCase(),
      message: typeof message === 'string' ? message : JSON.stringify(message),
      details,
      path: typeof window !== 'undefined' ? window.location.pathname + window.location.search : '',
      timestamp: new Date().toISOString(),
      ...userCtx,
    };

    this.queue.push(entry);

    // If critical error, flush immediately
    if (level === 'error' || this.queue.length >= this.maxBatchSize) {
      this.flush();
    }
  }

  info(event, message, details) {
    this.log('info', event, message, details);
  }

  warn(event, message, details) {
    this.log('warn', event, message, details);
  }

  error(event, message, details) {
    this.log('error', event, message, details);
  }

  action(event, message, details) {
    this.log('action', event, message, details);
  }

  pageView(path, title) {
    this.action('PAGE_VIEW', `Visited ${path}`, { title: title || document.title, path });
  }

  async flush(useBeacon = true) {
    if (!this.queue.length) return;

    const batch = [...this.queue];
    this.queue = [];

    const endpoint = `${API_BASE}/logs`;
    const payload = JSON.stringify({ logs: batch, app: this.app });

    if (useBeacon && typeof navigator !== 'undefined' && navigator.sendBeacon) {
      try {
        const blob = new Blob([payload], { type: 'application/json' });
        if (navigator.sendBeacon(endpoint, blob)) {
          return;
        }
      } catch (_) {}
    }

    try {
      await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: payload,
        keepalive: true,
      });
    } catch (err) {
      if (this.queue.length < 50) {
        this.queue = [...batch, ...this.queue];
      }
    }
  }
}

const clientLogger = new FrontendLogger('client');
export default clientLogger;
