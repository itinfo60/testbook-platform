import axios from 'axios';
import toast from 'react-hot-toast';

const API_BASE = import.meta.env.VITE_API_URL || '/api/v1';

const api = axios.create({
  baseURL: API_BASE,
  timeout: 30000,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

const qs = (params) => {
  if (!params) return '';
  const q = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') q.append(k, v);
  });
  const s = q.toString();
  return s ? `?${s}` : '';
};

// ── Request Interceptor ──
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('adminToken');
  if (token && token !== 'cookie-auth') {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (err) => Promise.reject(err));

// ── Response Interceptor ──
let isRefreshing = false;
let failedQueue = [];
const processQueue = (error, token = null) => {
  failedQueue.forEach((p) => error ? p.reject(error) : p.resolve(token));
  failedQueue = [];
};

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const orig = error.config;
    if (error.response?.status === 401 && !orig._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then((token) => {
          orig.headers.Authorization = `Bearer ${token}`;
          return api(orig);
        });
      }
      orig._retry = true;
      isRefreshing = true;
      try {
        const rt = localStorage.getItem('adminRefreshToken');
        if (!rt) throw new Error('No refresh token');
        const res = await axios.post(`${API_BASE}/auth/refresh-token`, { refreshToken: rt });
        const d = res.data.data || res.data;
        const at = d.accessToken || d.token;
        const nrt = d.refreshToken;
        if (at) localStorage.setItem('adminToken', at);
        if (nrt) localStorage.setItem('adminRefreshToken', nrt);
        processQueue(null, at);
        orig.headers.Authorization = `Bearer ${at}`;
        return api(orig);
      } catch (e) {
        processQueue(e, null);
        localStorage.removeItem('adminToken');
        localStorage.removeItem('adminRefreshToken');
        window.location.href = '/login';
        return Promise.reject(e);
      } finally {
        isRefreshing = false;
      }
    }
    const msg = error.response?.data?.message || error.message || 'Something went wrong';
    if (error.response?.status !== 401 && error.response?.status !== 404) {
      toast.error(msg);
    }
    return Promise.reject(error);
  }
);

// ══════════════════════════════════════════════
// AUTH
// ══════════════════════════════════════════════
export const authAPI = {
  login: (data) => api.post('/auth/login', data),
  logout: () => api.post('/auth/logout').catch(() => {}),
  refreshToken: (data) => api.post('/auth/refresh-token', data),
  getProfile: async () => {
    return await api.get('/auth/profile');
  },
};

// ══════════════════════════════════════════════
// DASHBOARD — confirmed: GET /admin/dashboard
// ══════════════════════════════════════════════
export const dashboardAPI = {
  getStats: () => api.get('/admin/dashboard'),
};

// ══════════════════════════════════════════════
// USERS — confirmed: /admin/users
// ══════════════════════════════════════════════
export const usersAPI = {
  getAll: (params) => api.get(`/admin/users${qs(params)}`),
  getById: (id) => api.get(`/admin/users/${id}`),
  create: (data) => api.post('/admin/users', data),
  update: (id, data) => api.put(`/admin/users/${id}`, data),
  delete: (id) => api.delete(`/admin/users/${id}`),
};

// ══════════════════════════════════════════════
// COURSES — confirmed: /admin/courses
// ══════════════════════════════════════════════
export const coursesAPI = {
  getAll: (params) => api.get(`/admin/courses${qs(params)}`),
  getById: (id) => api.get(`/courses/${id}`),
  create: (data) => api.post('/courses', data, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  update: (id, data) => api.put(`/courses/${id}`, data, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  delete: (id) => api.delete(`/admin/courses/${id}`),
  togglePublish: (id) => api.patch(`/courses/${id}/publish`),
  toggleFeatured: (id) => api.patch(`/admin/courses/${id}/featured`),
};

// ══════════════════════════════════════════════
// TESTS — confirmed: /admin/tests
// ══════════════════════════════════════════════
export const testsAPI = {
  getAll: (params) => api.get(`/admin/tests${qs(params)}`),
  getById: (id) => api.get(`/tests/${id}`),
  delete: (id) => api.delete(`/admin/tests/${id}`),
};

// ══════════════════════════════════════════════
// QUIZZES — confirmed: /admin/quizzes
// ══════════════════════════════════════════════
export const quizzesAPI = {
  getAll: (params) => api.get(`/admin/quizzes${qs(params)}`),
  getById: (id) => api.get(`/quizzes/${id}`),
  delete: (id) => api.delete(`/admin/quizzes/${id}`),
};

// ══════════════════════════════════════════════
// REVIEWS — confirmed: /admin/reviews
// toggle-approval NOT /approve
// ══════════════════════════════════════════════
export const reviewsAPI = {
  getAll: (params) => api.get(`/admin/reviews${qs(params)}`),
  delete: (id) => api.delete(`/admin/reviews/${id}`),
  approve: (id) => api.patch(`/admin/reviews/${id}/toggle-approval`),
  bulkDelete: (ids) => api.post('/admin/reviews/bulk-delete', { ids }),
};

// ══════════════════════════════════════════════
// ENROLLMENTS
// ══════════════════════════════════════════════
export const enrollmentsAPI = {
  getAll: (params) => api.get(`/admin/enrollments${qs(params)}`),
  export: (params) => api.get(`/admin/enrollments/export${qs(params)}`, {
    responseType: 'blob',
  }),
};

// ══════════════════════════════════════════════
// REVENUE — confirmed: GET /admin/revenue
// NO /admin/revenue/monthly endpoint!
// ══════════════════════════════════════════════
export const revenueAPI = {
  getAnalytics: (params) => api.get(`/admin/revenue${qs(params)}`),
  // monthly doesn't exist — return empty
  getMonthly: async () => ({ data: { data: [] } }),
};

// ══════════════════════════════════════════════
// TEACHERS
// ══════════════════════════════════════════════
export const teachersAPI = {
  getAll: (params) => api.get(`/admin/teachers${qs(params)}`),
  verify: (id) => api.patch(`/admin/teachers/${id}/verify`),
};

// ══════════════════════════════════════════════
// COUPONS — confirmed: /coupons
// ══════════════════════════════════════════════
export const couponsAPI = {
  getAll: (params) => api.get(`/coupons${qs(params)}`),
  getById: (id) => api.get(`/coupons/${id}`),
  create: (data) => api.post('/coupons', data),
  update: (id, data) => api.put(`/coupons/${id}`, data),
  delete: (id) => api.delete(`/coupons/${id}`),
};

// ══════════════════════════════════════════════
// CATEGORIES — confirmed: /categories (NOT /exam-categories)
// ══════════════════════════════════════════════
export const examCategoriesAPI = {
  getAll: (params) => api.get(`/categories${qs(params)}`),
  getById: (id) => api.get(`/categories/${id}`),
  create: (data) => api.post('/categories', data),
  update: (id, data) => api.put(`/categories/${id}`, data),
  delete: (id) => api.delete(`/categories/${id}`),
};

// ══════════════════════════════════════════════
// NOTIFICATIONS — confirmed: POST /admin/announcements
// ══════════════════════════════════════════════
export const notificationsAPI = {
  send: (data) => api.post('/admin/announcements', data),
  getAll: (params) => api.get(`/notifications${qs(params)}`),
};

export default api;