import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { authAPI } from '@/api';
import toast from 'react-hot-toast';

export const login = createAsyncThunk('auth/login', async (credentials, { rejectWithValue }) => {
  try {
    const res = await authAPI.login(credentials);
    const data = res.data.data || res.data;
    const user = data.user || data;
    const accessToken = data.accessToken || data.token;
    const refreshToken = data.refreshToken;

    if (user?.role !== 'super_admin') {
      return rejectWithValue({ message: 'Access denied. Super admin credentials required.' });
    }

    if (accessToken) localStorage.setItem('platformToken', accessToken);
    if (refreshToken) localStorage.setItem('platformRefreshToken', refreshToken);
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
    if (user?.role !== 'super_admin') {
      localStorage.clear();
      return rejectWithValue({ message: 'Access denied' });
    }
    return user;
  } catch (err) {
    if (err.response?.status === 401 || err.response?.status === 403) {
      localStorage.removeItem('platformToken');
      localStorage.removeItem('platformRefreshToken');
    }
    return rejectWithValue(err.response?.data || { message: err.message });
  }
});

export const logout = createAsyncThunk('auth/logout', async () => {
  try {
    await authAPI.logout();
  } catch {}
  localStorage.removeItem('platformToken');
  localStorage.removeItem('platformRefreshToken');
});

const hasToken = !!localStorage.getItem('platformToken');

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    user: null,
    isAuthenticated: false,
    loading: hasToken,
    initialized: !hasToken,
    error: null,
  },
  reducers: {},
  extraReducers: (b) => {
    b.addCase(login.pending, (s) => {
      s.loading = true;
      s.error = null;
    })
      .addCase(login.fulfilled, (s, a) => {
        s.loading = false;
        s.isAuthenticated = true;
        s.user = a.payload;
        s.initialized = true;
        toast.success('Welcome, Platform Admin');
      })
      .addCase(login.rejected, (s, a) => {
        s.loading = false;
        s.isAuthenticated = false;
        s.initialized = true;
        s.error = a.payload?.message;
        toast.error(s.error || 'Login failed');
      })
      .addCase(getProfile.pending, (s) => {
        s.loading = true;
      })
      .addCase(getProfile.fulfilled, (s, a) => {
        s.loading = false;
        s.isAuthenticated = true;
        s.user = a.payload;
        s.initialized = true;
      })
      .addCase(getProfile.rejected, (s) => {
        s.loading = false;
        s.isAuthenticated = false;
        s.user = null;
        s.initialized = true;
      })
      .addCase(logout.fulfilled, (s) => {
        s.user = null;
        s.isAuthenticated = false;
        toast.success('Logged out');
      });
  },
});

export default authSlice.reducer;
