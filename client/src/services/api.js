import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api/v1';

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
  failedQueue.forEach(prom => {
    if (error) prom.reject(error);
    else prom.resolve(token);
  });
  failedQueue = [];
};

api.interceptors.request.use(
  config => {
    const token = _store?.getState()?.auth?.token;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  error => Promise.reject(error)
);

api.interceptors.response.use(
  response => response,
  async error => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then(token => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return api(originalRequest);
        }).catch(err => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // Use the api instance (withCredentials:true) so the httpOnly refreshToken cookie is sent.
        // Also pass the refreshToken from Redux as a fallback in the body.
        const storedRefreshToken = _store?.getState()?.auth?.refreshToken;
        const { data } = await api.post('/auth/refresh-token', { refreshToken: storedRefreshToken });

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
  register: data => api.post('/auth/register', data),
  login: data => api.post('/auth/login', data),
  logout: () => api.post('/auth/logout'),
  refreshToken: refreshToken => api.post('/auth/refresh-token', { refreshToken }),
  forgotPassword: email => api.post('/auth/forgot-password', { email }),
  resetPassword: (token, data) => api.post('/auth/reset-password', { token, ...data }),
  verifyEmail: token => api.get(`/auth/verify-email/${token}`),
  getProfile: () => api.get('/auth/profile'),
  updateProfile: data => api.put('/auth/profile', data),
};

export const courseAPI = {
  getAll: params => api.get('/courses', { params }),
  getById: id => api.get(`/courses/${id}`),
  getFeatured: () => api.get('/courses/featured'),
  create: data => api.post('/courses', data),
  update: (id, data) => api.put(`/courses/${id}`, data),
  delete: id => api.delete(`/courses/${id}`),
  publish: id => api.patch(`/courses/${id}/publish`),
  getTeacherCourses: () => api.get('/courses/teacher/my-courses'),
};

export const enrollmentAPI = {
  enroll: data => api.post('/enrollments', data),
  getMyEnrollments: () => api.get('/enrollments/my'),
  getMyTestEnrollments: () => api.get('/enrollments/my-tests'),
  checkEnrollment: courseId => api.get(`/enrollments/check/${courseId}`),
  getProgress: courseId => api.get(`/enrollments/progress/${courseId}`),
  updateProgress: (courseId, data) => api.post(`/enrollments/progress/${courseId}`, data),
  completeLesson: (courseId, data) => api.post(`/enrollments/progress/${courseId}`, data),
  getTeacherStudents: () => api.get('/enrollments/teacher/students'),
};

export const reviewAPI = {
  getCourseReviews: (courseId, params) => api.get(`/reviews/course/${courseId}`, { params }),
  create: data => api.post('/reviews', data),
  update: (id, data) => api.put(`/reviews/${id}`, data),
  delete: id => api.delete(`/reviews/${id}`),
};

export const testAPI = {
  getAll: params => api.get('/tests', { params }),
  getById: id => api.get(`/tests/${id}`),
  create: data => api.post('/tests', data),
  update: (id, data) => api.put(`/tests/${id}`, data),
  start: id => api.post(`/tests/${id}/start`),
  submit: (attemptId, data) => api.post(`/tests/submit/${attemptId}`, data),
  getAnalytics: id => api.get(`/tests/${id}/analytics`),
  getTeacherTests: () => api.get('/tests/teacher/my-tests'),
  getMyAttempts: () => api.get('/tests/my/attempts'),
};

export const quizAPI = {
  getCourseQuizzes: courseId => api.get(`/quizzes/course/${courseId}`),
  submit: (id, data) => api.post(`/quizzes/${id}/submit`, data),
  getTeacherQuizzes: () => api.get('/quizzes/teacher/my-quizzes'),
  getById: id => api.get(`/quizzes/teacher/${id}`),
  create: data => api.post('/quizzes', data),
  update: (id, data) => api.put(`/quizzes/${id}`, data),
  delete: id => api.delete(`/quizzes/${id}`),
};

export const paymentAPI = {
  createOrder: data => api.post('/payments/create-order', data),
  verify: data => api.post('/payments/verify', data),
  dummyCheckout: data => api.post('/payments/dummy-checkout', data),
  getMyOrders: () => api.get('/payments/my-orders'),
  getTeacherRevenue: () => api.get('/payments/teacher/revenue'),
};

export const couponAPI = {
  validate: data => api.post('/coupons/validate', data),
};

export const notificationAPI = {
  getAll: () => api.get('/notifications'),
  markAsRead: id => api.patch(`/notifications/${id}/read`),
  getUnreadCount: () => api.get('/notifications/unread-count'),
};

export const wishlistAPI = {
  toggle: courseId => api.post('/wishlist/toggle', { courseId }),
  getAll: () => api.get('/wishlist'),
  check: courseId => api.get(`/wishlist/check/${courseId}`),
};

export const discussionAPI = {
  getCourseDiscussions: (courseId, params) => api.get(`/discussions/course/${courseId}`, { params }),
  create: data => api.post('/discussions', data),
  update: (id, data) => api.put(`/discussions/${id}`, data),
  reply: (id, data) => api.post(`/discussions/${id}/reply`, data),
  updateReply: (id, replyId, data) => api.put(`/discussions/${id}/reply/${replyId}`, data),
  deleteReply: (id, replyId) => api.delete(`/discussions/${id}/reply/${replyId}`),
  like: id => api.post(`/discussions/${id}/like`),
  resolve: id => api.patch(`/discussions/${id}/resolve`),
  delete: id => api.delete(`/discussions/${id}`),
};

export const noteAPI = {
  getCourseNotes: courseId => api.get(`/notes/course/${courseId}`),
  create: data => api.post('/notes', data),
  update: (id, data) => api.put(`/notes/${id}`, data),
  delete: id => api.delete(`/notes/${id}`),
};

export const badgeAPI = {
  getAll: () => api.get('/badges'),
  getMyBadges: () => api.get('/badges/my-badges'),
};

export const leaderboardAPI = {
  get: params => api.get('/leaderboard', { params }),
};

export const blogAPI = {
  getAll: params => api.get('/blogs', { params }),
  getBySlug: slug => api.get(`/blogs/slug/${slug}`),
  create: data => api.post('/blogs', data),
  update: (id, data) => api.patch(`/blogs/${id}`, data),
  delete: id => api.delete(`/blogs/${id}`),
};


export const examCategoryAPI = {
  getAll: () => api.get('/categories'),
};

export default api;
