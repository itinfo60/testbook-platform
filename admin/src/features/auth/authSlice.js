import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api, { authAPI } from '@/services/api';
import toast from 'react-hot-toast';

const ADMIN_ROLES = ['admin', 'super_admin', 'superadmin'];

const isAdminRole = (role) => ADMIN_ROLES.includes((role || '').toLowerCase().trim());

export const loginWithSupabase = createAsyncThunk(
  'auth/loginWithSupabase',
  async ({ accessToken }, { rejectWithValue }) => {
    try {
      const res = await api.post('/auth/supabase-login', { accessToken });

      const data = res.data.data || res.data;
      const user = data.user || data;
      const token = data.accessToken || data.token;
      const refreshToken = data.refreshToken;

      if (!isAdminRole(user?.role)) {
        return rejectWithValue({ message: `Access denied. Role "${user?.role}" is not admin.` });
      }

      if (token) localStorage.setItem('adminToken', token);
      if (refreshToken) localStorage.setItem('adminRefreshToken', refreshToken);
      if (user?.tenantId) localStorage.setItem('adminTenantId', user.tenantId);

      return user;
    } catch (err) {
      return rejectWithValue(err.response?.data || { message: err.message });
    }
  }
);

export const login = createAsyncThunk('auth/login', async (credentials, { rejectWithValue }) => {
  try {
    const res = await authAPI.login(credentials);

    const data = res.data.data || res.data;
    const user = data.user || data;
    const accessToken = data.accessToken || data.token || res.data.token;
    const refreshToken = data.refreshToken || res.data.refreshToken;

    if (!isAdminRole(user?.role)) {
      return rejectWithValue({ message: `Access denied. Role "${user?.role}" is not admin.` });
    }

    if (accessToken) localStorage.setItem('adminToken', accessToken);
    if (refreshToken) localStorage.setItem('adminRefreshToken', refreshToken);
    if (user?.tenantId) localStorage.setItem('adminTenantId', user.tenantId);

    // If tokens come via cookies (no token in body), mark as cookie-auth
    if (!accessToken) localStorage.setItem('adminToken', 'cookie-auth');

    return user;
  } catch (err) {
    return rejectWithValue(err.response?.data || { message: err.message });
  }
});

export const getProfile = createAsyncThunk('auth/getProfile', async (_, { rejectWithValue }) => {
  try {
    const res = await authAPI.getProfile();

    const data = res.data.data || res.data;
    const user = data.user || data;

    if (!isAdminRole(user?.role)) {
      console.warn('Profile loaded but role is not admin:', user?.role);
      localStorage.removeItem('adminToken');
      localStorage.removeItem('adminRefreshToken');
      return rejectWithValue({ message: 'Access denied' });
    }

    const tenantId = user?.tenantId || data?.tenantId;
    if (tenantId) localStorage.setItem('adminTenantId', tenantId);

    return user;
  } catch (err) {
    console.error('getProfile FAILED:', err.response?.status, err.response?.data || err.message);

    // DON'T clear tokens on network errors — only on 401/403
    if (err.response?.status === 401 || err.response?.status === 403) {
      localStorage.removeItem('adminToken');
      localStorage.removeItem('adminRefreshToken');
    }

    return rejectWithValue(err.response?.data || { message: err.message });
  }
});

export const logout = createAsyncThunk('auth/logout', async () => {
  try {
    await authAPI.logout();
  } catch (e) {
    /* ignore */
  } finally {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminRefreshToken');
    localStorage.removeItem('adminTenantId');
  }
});

const hasToken = !!localStorage.getItem('adminToken');

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    user: null,
    isAuthenticated: false,
    loading: hasToken,
    error: null,
    initialized: !hasToken,
  },
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loginWithSupabase.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginWithSupabase.fulfilled, (state, action) => {
        state.loading = false;
        state.isAuthenticated = true;
        state.user = action.payload;
        state.initialized = true;
        toast.success('Welcome back!');
      })
      .addCase(loginWithSupabase.rejected, (state, action) => {
        state.loading = false;
        state.isAuthenticated = false;
        state.initialized = true;
        state.error = action.payload?.message || 'Supabase authentication failed';
        toast.error(state.error);
      })
      .addCase(login.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.loading = false;
        state.isAuthenticated = true;
        state.user = action.payload;
        state.initialized = true;
        toast.success('Welcome back!');
      })
      .addCase(login.rejected, (state, action) => {
        state.loading = false;
        state.isAuthenticated = false;
        state.initialized = true;
        state.error = action.payload?.message || 'Login failed';
        toast.error(state.error);
      })
      .addCase(getProfile.pending, (state) => {
        state.loading = true;
      })
      .addCase(getProfile.fulfilled, (state, action) => {
        state.loading = false;
        state.isAuthenticated = true;
        state.user = action.payload;
        state.initialized = true;
      })
      .addCase(getProfile.rejected, (state, action) => {
        state.loading = false;
        state.isAuthenticated = false;
        state.user = null;
        state.initialized = true;
        // Don't toast on profile check failure (silent)
      })
      .addCase(logout.fulfilled, (state) => {
        state.user = null;
        state.isAuthenticated = false;
        toast.success('Logged out');
      });
  },
});

export const { clearError } = authSlice.actions;
export default authSlice.reducer;
