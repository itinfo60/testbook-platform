import axios from 'axios';

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
      config.headers['X-Tenant-Subdomain'] = subdomain;
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

    return Promise.reject(error);
  }
);

export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  logout: () => api.post('/auth/logout'),
  refreshToken: (refreshToken) => api.post('/auth/refresh-token', { refreshToken }),
  forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
  resetPassword: (token, data) => api.post('/auth/reset-password', { token, ...data }),
  verifyEmail: (token) => api.get(`/auth/verify-email/${token}`),
  getProfile: () => api.get('/auth/profile'),
  updateProfile: (data) => api.put('/auth/profile', data),
  setupMfa: () => api.post('/auth/mfa/setup'),
  verifyMfa: (token) => api.post('/auth/mfa/verify', { token }),
  disableMfa: (token) => api.post('/auth/mfa/disable', { token }),
};

export const courseAPI = {
  getAll: (params) => api.get('/courses', { params }),
  getById: (id) => api.get(`/courses/${id}`),
  getFeatured: () => api.get('/courses/featured'),
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
  checkEnrollment: (courseId) => api.get(`/enrollments/check/${courseId}`),
  getProgress: (courseId) => api.get(`/enrollments/progress/${courseId}`),
  updateProgress: (courseId, data) => api.post(`/enrollments/progress/${courseId}`, data),
  completeLesson: (courseId, data) => api.post(`/enrollments/progress/${courseId}`, data),
  getTeacherStudents: () => api.get('/enrollments/teacher/students'),
  getCertificate: (courseId) => api.get(`/enrollments/certificate/${courseId}`),
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
  start: (id) => api.post(`/tests/${id}/start`),
  submit: (attemptId, data) => api.post(`/tests/submit/${attemptId}`, data),
  getAnalytics: (id) => api.get(`/tests/${id}/analytics`),
  getTeacherTests: () => api.get('/tests/teacher/my-tests'),
  getMyAttempts: () => api.get('/tests/my/attempts'),
};

export const quizAPI = {
  getCourseQuizzes: (courseId) => api.get(`/quizzes/course/${courseId}`),
  submit: (id, data) => api.post(`/quizzes/${id}/submit`, data),
  getTeacherQuizzes: () => api.get('/quizzes/teacher/my-quizzes'),
  getById: (id) => api.get(`/quizzes/teacher/${id}`),
  create: (data) => api.post('/quizzes', data),
  update: (id, data) => api.put(`/quizzes/${id}`, data),
  delete: (id) => api.delete(`/quizzes/${id}`),
};

export const paymentAPI = {
  createOrder: (data) => api.post('/payments/create-order', data),
  verify: (data) => api.post('/payments/verify', data),
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
  create: (data) => api.post('/discussions', data),
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

export const badgeAPI = {
  getAll: () => api.get('/badges'),
  getMyBadges: () => api.get('/badges/my-badges'),
};

export const leaderboardAPI = {
  get: (params) => api.get('/leaderboard', { params }),
};

export const blogAPI = {
  getAll: (params) => api.get('/blogs', { params }),
  getBySlug: (slug) => api.get(`/blogs/slug/${slug}`),
  create: (data) => api.post('/blogs', data),
  update: (id, data) => api.patch(`/blogs/${id}`, data),
  delete: (id) => api.delete(`/blogs/${id}`),
};

export const examCategoryAPI = {
  getAll: () => api.get('/categories'),
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
};

export const instituteAPI = {
  getBranding: () => api.get('/institutes/branding'),
  updateBranding: (data) => api.post('/institutes/branding', data),
};

export const auditAPI = {
  getLogs: (params) => api.get('/audit-logs', { params }),
};

export default api;
