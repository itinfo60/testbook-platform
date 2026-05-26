import axios from 'axios';
import toast from 'react-hot-toast';

const api = axios.create({
  baseURL: '/api/v1',
  timeout: 30000,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('platformToken');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const orig = error.config;
    if (error.response?.status === 401 && !orig._retry) {
      orig._retry = true;
      const rt = localStorage.getItem('platformRefreshToken');
      if (rt) {
        try {
          const res = await axios.post('/api/v1/auth/refresh-token', { refreshToken: rt });
          const d = res.data.data || res.data;
          const newToken = d.accessToken || d.token;
          if (newToken) {
            localStorage.setItem('platformToken', newToken);
            orig.headers.Authorization = `Bearer ${newToken}`;
            return api(orig);
          }
        } catch {
          localStorage.clear();
          window.location.href = '/login';
        }
      }
    }
    const msg = error.response?.data?.message || error.message;
    if (error.response?.status !== 401) toast.error(msg);
    return Promise.reject(error);
  }
);

// Platform-specific APIs
export const authAPI = {
  login: (data) => api.post('/auth/login', data),
  logout: () => api.post('/auth/logout').catch(() => {}),
  getProfile: () => api.get('/auth/profile'),
};

export const institutesAPI = {
  getAll: (params) => api.get('/institutes/admin/all', { params }),
  create: (data) => api.post('/institutes/admin/all', data),
  update: (id, data) => api.put(`/institutes/admin/all/${id}`, data),
  delete: (id) => api.delete(`/institutes/admin/all/${id}`),
  suspend: (id) => api.patch(`/institutes/admin/all/${id}/suspend`),
  activate: (id) => api.patch(`/institutes/admin/all/${id}/activate`),
};

export const platformAPI = {
  getStats: () => api.get('/institutes/admin/stats'),
};

export const subscriptionPlansAPI = {
  getAll: () => api.get('/subscriptions'),
};

export default api;
