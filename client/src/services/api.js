import axios from 'axios';
import clientLogger from './logger';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api/v1';

const getSubdomain = () => {
  if (typeof window === 'undefined') return null;
  const host = window.location.host;
  const parts = host.split('.');

  if (host.includes('localhost') || host.includes('127.0.0.1')) {
    if (parts.length > 1 && parts[0] !== 'localhost') {
      return parts[0];
    }
    return null;
  }

  if (parts.length > 2) {
    if (parts[0] === 'www') return parts[1];
    return parts[0];
  }

  return null;
};

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
});

// ===== SWR CACHE & REQUEST DEDUPLICATION (FOR LIGHTNING-FAST BROWSING) =====
const defaultAdapter = axios.defaults.adapter;
const apiMemoryCache = new Map();
const inFlightRequests = new Map();

const FRESH_TTL = 30 * 1000; // 30 seconds fresh
const STALE_TTL = 5 * 60 * 1000; // 5 minutes stale-while-revalidate

const SWR_PATTERNS = [
  /\/courses/i,
  /\/exam-categories/i,
  /\/categories/i,
  /\/test-series/i,
  /\/tests/i,
  /\/blogs/i,
  /\/library/i,
  /\/institutes/i,
  /\/branding/i,
  /\/quizzes\/daily/i,
  /\/faculty/i,
  /\/settings/i,
];

function isCacheableGetRequest(config) {
  if (config.method && config.method.toLowerCase() !== 'get') return false;
  if (config.cache === false || config.headers?.['Cache-Control'] === 'no-cache') return false;
  const url = config.url || '';
  return SWR_PATTERNS.some((pattern) => pattern.test(url));
}

function getCacheKey(config) {
  const url = config.url || '';
  const params = config.params ? JSON.stringify(config.params) : '';
  const tenant = config.headers?.['X-Tenant-Subdomain'] || config.headers?.['X-Tenant-Id'] || '';
  return `${config.baseURL || ''}${url}?${params}&tenant=${tenant}`;
}

export function clearApiCache(pattern) {
  if (!pattern) {
    apiMemoryCache.clear();
    return;
  }
  for (const key of apiMemoryCache.keys()) {
    if (key.includes(pattern)) {
      apiMemoryCache.delete(key);
    }
  }
}

if (typeof defaultAdapter === 'function') {
  api.defaults.adapter = async (config) => {
    if (isCacheableGetRequest(config)) {
      const key = getCacheKey(config);
      const cached = apiMemoryCache.get(key);
      const now = Date.now();

      if (inFlightRequests.has(key)) {
        return inFlightRequests.get(key);
      }

      if (cached) {
        const age = now - cached.timestamp;
        if (age < FRESH_TTL) {
          return Promise.resolve({ ...cached.response, config });
        }

        if (age < STALE_TTL) {
          defaultAdapter(config)
            .then((res) => {
              apiMemoryCache.set(key, { timestamp: Date.now(), response: res });
              return res;
            })
            .catch(() => {});

          return Promise.resolve({ ...cached.response, config });
        }
      }

      const fetchPromise = defaultAdapter(config)
        .then((res) => {
          apiMemoryCache.set(key, { timestamp: Date.now(), response: res });
          inFlightRequests.delete(key);
          return res;
        })
        .catch((err) => {
          inFlightRequests.delete(key);
          if (cached) {
            return { ...cached.response, config };
          }
          return Promise.reject(err);
        });

      inFlightRequests.set(key, fetchPromise);
      return fetchPromise;
    }

    if (config.method && config.method.toLowerCase() !== 'get') {
      const url = config.url || '';
      if (url.includes('/courses')) clearApiCache('courses');
      if (url.includes('/tests')) clearApiCache('tests');
      if (url.includes('/blogs')) clearApiCache('blogs');
      if (url.includes('/library')) clearApiCache('library');
      if (url.includes('/enrollments')) {
        clearApiCache('courses');
        clearApiCache('enrollment');
      }
    }

    return defaultAdapter(config);
  };
}

let _store = null;

export function injectStore(storeRef) {
  _store = storeRef;
}

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) prom.reject(error);
    else prom.resolve(token);
  });
  failedQueue = [];
};

api.interceptors.request.use(
  (config) => {
    const token = _store?.getState()?.auth?.token;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    const subdomain = getSubdomain();
    if (subdomain) {
      // Running on a real subdomain (e.g. demo.localhost or abc.platform.com)
      config.headers['X-Tenant-Subdomain'] = subdomain;
    } else {
      // Fallback: use explicit env vars or primary default institute ID
      const devTenantId = import.meta.env.VITE_TENANT_ID || '6a82a18008198c8684413371';
      const devTenantSubdomain = import.meta.env.VITE_TENANT_SUBDOMAIN;
      if (devTenantId) {
        config.headers['X-Tenant-Id'] = devTenantId;
      } else if (devTenantSubdomain) {
        config.headers['X-Tenant-Subdomain'] = devTenantSubdomain;
      }
    }

    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const requestUrl = originalRequest?.url || '';

    // Only attempt token refresh when:
    // 1. Response is 401
    // 2. Not already retried
    // 3. Not a refresh-token or login/register request (those 401s are credential errors, not expired sessions)
    // 4. We actually have a token in the store (otherwise there's nothing to refresh)
    const hasToken = !!_store?.getState()?.auth?.token;
    const isAuthEndpoint =
      requestUrl.includes('/auth/refresh-token') ||
      requestUrl.includes('/auth/login') ||
      requestUrl.includes('/auth/register');

    if (error.response?.status === 401 && !originalRequest._retry && hasToken && !isAuthEndpoint) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return api(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // Use raw axios (not the `api` instance) so this call bypasses this interceptor
        // and cannot deadlock via re-entry.
        const storedRefreshToken = _store?.getState()?.auth?.refreshToken;
        const subdomain = getSubdomain();
        const { data } = await axios.post(
          `${API_BASE_URL}/auth/refresh-token`,
          { refreshToken: storedRefreshToken },
          {
            withCredentials: true,
            headers: {
              ...(subdomain && { 'X-Tenant-Subdomain': subdomain }),
            },
          }
        );

        const newToken = data.data?.accessToken || data.accessToken || data.token;
        const newRefreshToken = data.data?.refreshToken || data.refreshToken;

        if (_store) {
          _store.dispatch({
            type: 'auth/setCredentials',
            payload: { token: newToken, ...(newRefreshToken && { refreshToken: newRefreshToken }) },
          });
        }

        processQueue(null, newToken);
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        if (_store) _store.dispatch({ type: 'auth/logout' });
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    if (error.response?.data) {
      const data = error.response.data;
      if (
        Array.isArray(data.errors) &&
        data.errors.length > 0 &&
        (!data.message ||
          data.message === 'Validation failed' ||
          data.message === 'Validation Error')
      ) {
        const details = data.errors
          .map((e) => (e.field ? `${e.field}: ${e.message}` : e.message))
          .join(', ');
        data.message = `Validation error: ${details}`;
      }
    }

    const reqUrl = error.config?.url || '';
    if (reqUrl && !reqUrl.includes('/logs') && !reqUrl.includes('/auth/refresh-token')) {
      clientLogger.error(
        'API_ERROR',
        `${error.config?.method?.toUpperCase() || 'GET'} ${reqUrl} failed: ${error.response?.status || 'Network Error'}`,
        {
          status: error.response?.status,
          url: reqUrl,
          method: error.config?.method,
          message: error.response?.data?.message || error.message,
        }
      );
    }

    return Promise.reject(error);
  }
);

export function getErrorMessage(err, fallback = 'Something went wrong') {
  if (!err) return fallback;
  if (typeof err === 'string') return err;
  const data = err.response?.data;
  if (data?.message) {
    if (Array.isArray(data.errors) && data.errors.length > 0 && !data.message.includes(':')) {
      const details = data.errors
        .map((e) => (e.field ? `${e.field}: ${e.message}` : e.message))
        .join(', ');
      return `${data.message} (${details})`;
    }
    return data.message;
  }
  if (data?.error) return data.error;
  if (err.message) return err.message;
  return fallback;
}

export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  logout: () => api.post('/auth/logout'),
  refreshToken: (refreshToken) => api.post('/auth/refresh-token', { refreshToken }),
  changePassword: (data) => api.post('/auth/change-password', data),
  forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
  resetPassword: (token, data) => api.post('/auth/reset-password', { token, ...data }),
  verifyEmail: (token) => api.get(`/auth/verify-email/${token}`),
  resendVerification: (email) => api.post('/auth/resend-verification', { email }),
  getProfile: () => api.get('/auth/profile'),
  updateProfile: (data) => api.put('/auth/profile', data),
  setupMfa: () => api.post('/auth/mfa/setup'),
  verifyMfa: (token) => api.post('/auth/mfa/verify', { token }),
  verifyMfaLogin: (data) => api.post('/auth/mfa/login', data),
  disableMfa: (token) => api.post('/auth/mfa/disable', { token }),
  checkEmail: (email) => api.get('/auth/check-email', { params: { email } }),
};

export const attendanceAPI = {
  getAttendance: (courseId, date) =>
    api.get(`/attendance/course/${courseId}`, { params: { date } }),
  saveAttendance: (courseId, data) => api.post(`/attendance/course/${courseId}`, data),
};

export const courseAPI = {
  getAll: (params) => api.get('/courses', { params }),
  getById: (id) => api.get(`/courses/${id}`),
  getFeatured: () => api.get('/courses/featured'),
  getSamples: () => api.get('/courses/samples'),
  create: (data) => api.post('/courses', data),
  update: (id, data) => api.put(`/courses/${id}`, data),
  delete: (id) => api.delete(`/courses/${id}`),
  publish: (id) => api.patch(`/courses/${id}/publish`),
  getTeacherCourses: () => api.get('/courses/teacher/my-courses'),
};

export const enrollmentAPI = {
  enroll: (data) => api.post('/enrollments', data),
  getMyEnrollments: () => api.get('/enrollments/my'),
  getMyTestEnrollments: () => api.get('/enrollments/my-tests'),
  getStudentAnalytics: () => api.get('/enrollments/analytics/performance'),
  getProgress: (courseId) => api.get(`/enrollments/progress/${courseId}`),
  updateProgress: (courseId, data) => api.post(`/enrollments/progress/${courseId}`, data),
  completeLesson: (courseId, data) => api.post(`/enrollments/progress/${courseId}`, data),
  getCertificate: (courseId) => api.get(`/enrollments/certificate/${courseId}`),
  verifyPayment: (id) => api.patch(`/enrollments/${id}/verify`),
  getTeacherStudents: () => api.get('/enrollments/teacher/students'),
  checkEnrollment: (courseId) => api.get(`/enrollments/check/${courseId}`),
  getOrderHistory: (params) => api.get('/enrollments/orders', { params }),
};

export const reviewAPI = {
  getCourseReviews: (courseId, params) => api.get(`/reviews/course/${courseId}`, { params }),
  create: (data) => api.post('/reviews', data),
  update: (id, data) => api.put(`/reviews/${id}`, data),
  delete: (id) => api.delete(`/reviews/${id}`),
};

export const testAPI = {
  getAll: (params) => api.get('/tests', { params }),
  getById: (id) => api.get(`/tests/${id}`),
  create: (data) => api.post('/tests', data),
  update: (id, data) => api.put(`/tests/${id}`, data),
  delete: (id) => api.delete(`/tests/${id}`),
  start: (id) => api.post(`/tests/${id}/start`),
  submit: (attemptId, data) => api.post(`/tests/submit/${attemptId}`, data),
  logViolation: (attemptId) => api.post(`/tests/violation/${attemptId}`),
  getAnalytics: (id) => api.get(`/tests/${id}/analytics`),
  getTeacherTests: () => api.get('/tests/teacher/my-tests'),
  getMyAttempts: (params) => api.get('/tests/my/attempts', { params }),
  getAttemptResult: (attemptId) => api.get(`/tests/result/${attemptId}`),
};

export const testSeriesAPI = {
  getAll: (params) => api.get('/test-series', { params }),
  getMySeriesList: () => api.get('/test-series/teacher/my-series'),
  getBySlug: (slug) => api.get(`/test-series/${slug}`),
  create: (data) => api.post('/test-series', data),
  update: (id, data) => api.put(`/test-series/${id}`, data),
  delete: (id) => api.delete(`/test-series/${id}`),
};

export const quizAPI = {
  getAll: (params) => api.get('/quizzes', { params }),
  getCourseQuizzes: (courseId) => api.get(`/quizzes/course/${courseId}`),
  submit: (id, data) => api.post('/quizzes/submit', data),
  getTeacherQuizzes: () => api.get('/quizzes/teacher/my-quizzes'),
  getById: (id) => api.get(`/quizzes/teacher/${id}`),
  getStudentQuizById: (id) => api.get(`/quizzes/${id}`),
  create: (data) => api.post('/quizzes', data),
  update: (id, data) => api.put(`/quizzes/${id}`, data),
  delete: (id) => api.delete(`/quizzes/${id}`),
};

export const paymentAPI = {
  createOrder: (data) => api.post('/payments/create-order', data),
  verify: (data) => api.post('/payments/verify', data),
  recordFailure: (data) => api.post('/payments/record-failure', data),
  dummyCheckout: (data) => api.post('/payments/dummy-checkout', data),
  getMyOrders: () => api.get('/payments/my-orders'),
  myOrders: () => api.get('/payments/my-orders'),
  getTeacherRevenue: () => api.get('/payments/teacher/revenue'),
  getInvoice: (id) => api.get(`/payments/invoice/${id}`),
  refund: (id, data) => api.post(`/payments/refund/${id}`, data),
};

export const couponAPI = {
  validate: (data) => api.post('/coupons/validate', data),
};

export const notificationAPI = {
  getAll: () => api.get('/notifications'),
  markAsRead: (id) => api.patch(`/notifications/${id}/read`),
  getUnreadCount: () => api.get('/notifications/unread-count'),
};

export const wishlistAPI = {
  toggle: (courseId) => api.post('/wishlist/toggle', { courseId }),
  getAll: () => api.get('/wishlist'),
  check: (courseId) => api.get(`/wishlist/check/${courseId}`),
};

export const discussionAPI = {
  getCourseDiscussions: (courseId, params) =>
    api.get(`/discussions/course/${courseId}`, { params }),
  create: (data) => api.post(`/discussions/course/${data.course}`, data),
  update: (id, data) => api.put(`/discussions/${id}`, data),
  reply: (id, data) => api.post(`/discussions/${id}/reply`, data),
  updateReply: (id, replyId, data) => api.put(`/discussions/${id}/reply/${replyId}`, data),
  deleteReply: (id, replyId) => api.delete(`/discussions/${id}/reply/${replyId}`),
  like: (id) => api.post(`/discussions/${id}/like`),
  resolve: (id) => api.patch(`/discussions/${id}/resolve`),
  delete: (id) => api.delete(`/discussions/${id}`),
};

export const noteAPI = {
  getCourseNotes: (courseId) => api.get(`/notes/course/${courseId}`),
  create: (data) => api.post('/notes', data),
  update: (id, data) => api.put(`/notes/${id}`, data),
  delete: (id) => api.delete(`/notes/${id}`),
};

export const leaderboardAPI = {
  get: (params) => api.get('/leaderboard', { params }),
};

export const blogAPI = {
  getAll: (params) => api.get('/blogs', { params }),
  getBySlug: (slug) => api.get(`/blogs/slug/${slug}`),
  getFeaturedArticles: (params) => api.get('/blogs', { params: { ...params, type: 'article' } }),
  getJobAlerts: (params) => api.get('/blogs', { params: { ...params, type: 'job_alert' } }),
  create: (data) => api.post('/blogs', data),
  update: (id, data) => api.patch(`/blogs/${id}`, data),
  delete: (id) => api.delete(`/blogs/${id}`),
};

export const libraryAPI = {
  getAll: (params) => api.get('/library', { params }),
  getFreeResources: (params) => api.get('/library', { params: { ...params, accessLevel: 'free' } }),
  download: (id) => api.get(`/library/${id}/download`),
};

export const examCategoryAPI = {
  // Pass { type: 'exam' } or { type: 'category' } to scope the result.
  // Omitting type returns both (legacy behaviour).
  getAll: (params) => api.get('/categories', { params }),
  getExams: () => api.get('/categories', { params: { type: 'exam' } }),
  getCategories: () => api.get('/categories', { params: { type: 'category' } }),
};

export const subscriptionAPI = {
  getPlans: () => api.get('/subscriptions'),
  getMySubscription: () => api.get('/subscriptions/my'),
  upgrade: (planId) => api.post('/subscriptions/upgrade', { planId }),
};

export const aiAPI = {
  generateQuestions: (data) => api.post('/ai/generate-questions', data),
  solveDoubt: (data) => api.post('/ai/solve-doubt', data),
  generateStudyPlan: (data) => api.post('/ai/study-plan', data),
  detectWeakTopics: (data) => api.post('/ai/weak-topics', data),
};

export const liveClassAPI = {
  create: (data) => api.post('/live-classes', data),
  getMy: () => api.get('/live-classes/my'),
  getUpcoming: (params) => api.get('/live-classes/upcoming', { params }),
  getById: (id) => api.get(`/live-classes/${id}`),
  start: (id) => api.post(`/live-classes/${id}/start`),
  end: (id, data) => api.post(`/live-classes/${id}/end`, data),
  join: (id) => api.post(`/live-classes/${id}/join`),
  update: (id, data) => api.put(`/live-classes/${id}`, data),
  getToken: (id) => api.get(`/live-classes/${id}/token`),
};

export const instituteAPI = {
  getBranding: () => api.get('/institutes/branding'),
  updateBranding: (data) => api.post('/institutes/branding', data),
};

export const auditAPI = {
  getLogs: (params) => api.get('/audit-logs', { params }),
};

export const supportAPI = {
  createTicket: (data) => api.post('/support/tickets', data),
};

export default api;
