import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'https://your-railway-app.up.railway.app/api/v1';

const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
});

// Inject auth token
api.interceptors.request.use(async (config) => {
  const token = await SecureStore.getItemAsync('accessToken');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Auto-refresh on 401
api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      try {
        const refreshToken = await SecureStore.getItemAsync('refreshToken');
        const { data } = await axios.post(`${API_URL}/auth/refresh-token`, { refreshToken });
        const newToken = data.data?.accessToken;
        await SecureStore.setItemAsync('accessToken', newToken);
        original.headers.Authorization = `Bearer ${newToken}`;
        return api(original);
      } catch {
        await SecureStore.deleteItemAsync('accessToken');
        await SecureStore.deleteItemAsync('refreshToken');
      }
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  login: (data) => api.post('/auth/login', data),
  register: (data) => api.post('/auth/register', data),
  logout: () => api.post('/auth/logout'),
  getProfile: () => api.get('/auth/profile'),
  registerFcmToken: (token) => api.post('/auth/fcm-token', { token }),
};

export const courseAPI = {
  getAll: (params) => api.get('/courses', { params }),
  getById: (id) => api.get(`/courses/${id}`),
  getFeatured: () => api.get('/courses/featured'),
};

export const enrollmentAPI = {
  enroll: (courseId) => api.post(`/enrollments/${courseId}`),
  getMyEnrollments: () => api.get('/enrollments/my'),
  getProgress: (courseId) => api.get(`/enrollments/progress/${courseId}`),
  updateProgress: (courseId, data) => api.post(`/enrollments/progress/${courseId}`, data),
  getCertificate: (courseId) => api.get(`/enrollments/certificate/${courseId}`),
};

export const testAPI = {
  getAll: (params) => api.get('/tests', { params }),
  getById: (id) => api.get(`/tests/${id}`),
  start: (id) => api.post(`/tests/${id}/start`),
  submit: (attemptId, data) => api.post(`/tests/submit/${attemptId}`, data),
};

export const aiAPI = {
  solveDoubt: (data) => api.post('/ai/solve-doubt', data),
  generateStudyPlan: (data) => api.post('/ai/study-plan', data),
};

export const notificationAPI = {
  getAll: () => api.get('/notifications'),
  markAsRead: (id) => api.patch(`/notifications/${id}/read`),
};

export const liveClassAPI = {
  getUpcoming: () => api.get('/live-classes/upcoming'),
  join: (id) => api.post(`/live-classes/${id}/join`),
};

export default api;
