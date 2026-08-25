import axios from 'axios';
import toast from 'react-hot-toast';

const API_BASE = import.meta.env.VITE_API_URL || '/api/v1';

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
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('adminToken');
    if (token && token !== 'cookie-auth') {
      config.headers.Authorization = `Bearer ${token}`;
    }
    const subdomain = getSubdomain();
    if (subdomain) {
      config.headers['X-Tenant-Subdomain'] = subdomain;
    } else {
      const tenantId = localStorage.getItem('adminTenantId');
      const devTenantId = import.meta.env.VITE_TENANT_ID;
      const devTenantSubdomain = import.meta.env.VITE_TENANT_SUBDOMAIN;

      if (tenantId) {
        config.headers['X-Tenant-Id'] = tenantId;
      } else if (devTenantId) {
        config.headers['X-Tenant-Id'] = devTenantId;
      } else if (devTenantSubdomain) {
        config.headers['X-Tenant-Subdomain'] = devTenantSubdomain;
      }
    }
    return config;
  },
  (err) => Promise.reject(err)
);

// ── Response Interceptor ──
let isRefreshing = false;
let failedQueue = [];
const processQueue = (error, token = null) => {
  failedQueue.forEach((p) => (error ? p.reject(error) : p.resolve(token)));
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
        const subdomain = getSubdomain();
        const res = await axios.post(
          `${API_BASE}/auth/refresh-token`,
          { refreshToken: rt },
          {
            headers: {
              ...(subdomain && { 'X-Tenant-Subdomain': subdomain }),
            },
          }
        );
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
    let msg = error.response?.data?.message;
    if (
      Array.isArray(error.response?.data?.errors) &&
      error.response.data.errors.length > 0 &&
      (!msg || msg === 'Validation failed' || msg === 'Validation Error')
    ) {
      const details = error.response.data.errors
        .map((e) => (e.field ? `${e.field}: ${e.message}` : e.message))
        .join(', ');
      msg = `Validation error: ${details}`;
    }
    msg = msg || error.message || 'Something went wrong';
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
  getStats: (params) => api.get(`/admin/dashboard${qs(params)}`),
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
// COURSES — confirmed: /admin/courses, /courses
// ══════════════════════════════════════════════
export const coursesAPI = {
  getAll: (params) => api.get(`/admin/courses${qs(params)}`),
  getById: (id) => api.get(`/courses/${id}`),
  create: (data) => api.post('/courses', data),
  update: (id, data) => api.put(`/admin/courses/${id}`, data),
  delete: (id) => api.delete(`/admin/courses/${id}`),
  togglePublish: (id) => api.patch(`/courses/${id}/publish`),
  toggleFeatured: (id) => api.patch(`/admin/courses/${id}/featured`),
};

// ══════════════════════════════════════════════
// TESTS — confirmed: /admin/tests, /tests
// ══════════════════════════════════════════════
export const testsAPI = {
  getAll: (params) => api.get(`/admin/tests${qs(params)}`),
  getById: (id) => api.get(`/admin/tests/${id}`),
  create: (data) => api.post('/tests', data),
  update: (id, data) => api.put(`/tests/${id}`, data),
  delete: (id) => api.delete(`/admin/tests/${id}`),
};

// ══════════════════════════════════════════════
// QUIZZES — confirmed: /admin/quizzes, /quizzes
// ══════════════════════════════════════════════
export const quizzesAPI = {
  getAll: (params) => api.get(`/admin/quizzes${qs(params)}`),
  getById: (id) => api.get(`/quizzes/${id}`),
  create: (data) => api.post('/quizzes', data),
  update: (id, data) => api.put(`/quizzes/${id}`, data),
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
  export: (params) =>
    api.get(`/admin/enrollments/export${qs(params)}`, {
      responseType: 'blob',
    }),
  bulkAssign: (data) => api.post('/admin/enrollments/bulk', data),
  revokeEnrollment: (id) => api.delete(`/enrollments/${id}`),
};

// ══════════════════════════════════════════════
// REVENUE — confirmed: GET /admin/revenue
export const revenueAPI = {
  getAnalytics: (params) => api.get(`/admin/revenue${qs(params)}`),
  getMonthly: (params) => api.get(`/admin/revenue/monthly${qs(params)}`),
};

// ══════════════════════════════════════════════
// PAYMENTS & ORDERS
// ══════════════════════════════════════════════
export const paymentsAPI = {
  getAll: (params) => api.get(`/admin/payments${qs(params)}`),
  getById: (id) => api.get(`/admin/payments/${id}`),
};

// ══════════════════════════════════════════════
// TEACHERS
// ══════════════════════════════════════════════
export const teachersAPI = {
  getAll: (params) => api.get(`/admin/teachers${qs(params)}`),
  getById: (id) => api.get(`/admin/teachers/${id}`),
  create: (data) => api.post('/admin/teachers', data),
  update: (id, data) => api.put(`/admin/teachers/${id}`, data),
  delete: (id) => api.delete(`/admin/teachers/${id}`),
  verify: (id) => api.patch(`/admin/teachers/${id}/verify`),
  toggleStatus: (id, isActive) => api.patch(`/admin/users/${id}/status`, { isActive }),
};

// ══════════════════════════════════════════════
// COUPONS — uses /admin/coupons (no tenant header needed)
// ══════════════════════════════════════════════
export const couponsAPI = {
  getAll: (params) => api.get(`/admin/coupons${qs(params)}`),
  getById: (id) => api.get(`/admin/coupons/${id}`),
  create: (data) => api.post('/admin/coupons', data),
  update: (id, data) => api.put(`/admin/coupons/${id}`, data),
  delete: (id) => api.delete(`/admin/coupons/${id}`),
};

// ══════════════════════════════════════════════
// CATEGORIES — /categories (public r/w, admin list at /categories/admin/list)
// ══════════════════════════════════════════════
export const examCategoriesAPI = {
  // Admin list: paginated, filterable, returns ALL categories including sub-exams
  getAll: (params) => api.get(`/categories/admin/list${qs(params)}`),
  // Single record: public detail endpoint (includes subcategories virtual)
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

// ══════════════════════════════════════════════
// TEST SERIES
// ══════════════════════════════════════════════
export const testSeriesAPI = {
  getAll: (params) => api.get(`/test-series${qs(params)}`),
  getBySlug: (slug) => api.get(`/test-series/${slug}`),
  create: (data) => api.post('/test-series', data),
  update: (id, data) => api.put(`/test-series/${id}`, data),
  delete: (id) => api.delete(`/test-series/${id}`),
};

// ══════════════════════════════════════════════
// BLOGS
// ══════════════════════════════════════════════
export const blogsAPI = {
  getAll: (params) => api.get(`/blogs${qs(params)}`),
  getById: (id) => api.get(`/blogs/${id}`),
  create: (data) => api.post('/blogs', data),
  update: (id, data) => api.put(`/blogs/${id}`, data),
  delete: (id) => api.delete(`/blogs/${id}`),
};

// ══════════════════════════════════════════════
// UPLOADS (SUPABASE STORAGE)
// ══════════════════════════════════════════════
export const uploadsAPI = {
  uploadImage: (file, folder = 'images') => {
    const fd = new FormData();
    fd.append('file', file);
    return api.post(`/uploads/image?folder=${folder}`, fd, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  uploadVideo: (file, folder = 'videos') => {
    const fd = new FormData();
    fd.append('file', file);
    return api.post(`/uploads/video?folder=${folder}`, fd, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  uploadDocument: (file, folder = 'documents') => {
    const fd = new FormData();
    fd.append('file', file);
    return api.post(`/uploads/document?folder=${folder}`, fd, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  deleteFile: (publicId, type = 'image') => {
    return api.delete(`/uploads/${encodeURIComponent(publicId)}?type=${type}`);
  },
};

export default api;
