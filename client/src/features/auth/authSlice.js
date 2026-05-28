import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { authAPI } from '@/services/api';

const getStoredAuth = () => {
  try {
    return {
      token: localStorage.getItem('token'),
      refreshToken: localStorage.getItem('refreshToken'),
      user: JSON.parse(localStorage.getItem('user') || 'null'),
    };
  } catch {
    return { token: null, refreshToken: null, user: null };
  }
};

const stored = getStoredAuth();

const extractAuthData = (data) => {
  const payload = data.data || data;
  return {
    user: payload.user || payload.userData || null,
    token: payload.accessToken || payload.token || payload.access_token || null,
    refreshToken: payload.refreshToken || payload.refresh_token || null,
  };
};

export const login = createAsyncThunk('auth/login', async (credentials, { rejectWithValue }) => {
  try {
    const response = await authAPI.login(credentials);
    const payload = response.data?.data || response.data;

    // MFA intermediate step — server intentionally sends no tokens yet
    if (payload?.requiresMfa) {
      return { requiresMfa: true, userId: payload.userId };
    }

    const { user, token, refreshToken } = extractAuthData(response.data);

    if (!token) {
      return rejectWithValue('No token in response. Check server response format.');
    }

    localStorage.setItem('token', token);
    if (refreshToken) localStorage.setItem('refreshToken', refreshToken);
    if (user) localStorage.setItem('user', JSON.stringify(user));

    return { user, token, accessToken: token, refreshToken };
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || err.message || 'Login failed');
  }
});

export const verifyMfaLogin = createAsyncThunk(
  'auth/verifyMfaLogin',
  async ({ userId, token }, { rejectWithValue }) => {
    try {
      const response = await authAPI.verifyMfaLogin({ userId, token });
      const { user, token: accessToken, refreshToken } = extractAuthData(response.data);

      if (!accessToken) return rejectWithValue('No token in MFA response.');

      localStorage.setItem('token', accessToken);
      if (refreshToken) localStorage.setItem('refreshToken', refreshToken);
      if (user) localStorage.setItem('user', JSON.stringify(user));

      return { user, token: accessToken, accessToken, refreshToken };
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message || err.message || 'MFA verification failed'
      );
    }
  }
);

export const register = createAsyncThunk('auth/register', async (userData, { rejectWithValue }) => {
  try {
    const response = await authAPI.register(userData);
    const { user, token, refreshToken } = extractAuthData(response.data);

    if (!token) return rejectWithValue('No token in response.');

    localStorage.setItem('token', token);
    if (refreshToken) localStorage.setItem('refreshToken', refreshToken);
    if (user) localStorage.setItem('user', JSON.stringify(user));

    return { user, token, accessToken: token, refreshToken };
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Registration failed');
  }
});

export const getProfile = createAsyncThunk('auth/getProfile', async (_, { rejectWithValue }) => {
  try {
    const { data } = await authAPI.getProfile();
    const user = data.data?.user || data.data || data.user || data;
    localStorage.setItem('user', JSON.stringify(user));
    return user;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Failed to get profile');
  }
});

export const updateProfile = createAsyncThunk(
  'auth/updateProfile',
  async (userData, { rejectWithValue }) => {
    try {
      const { data } = await authAPI.updateProfile(userData);
      const user = data.data?.user || data.data || data.user || data;
      localStorage.setItem('user', JSON.stringify(user));
      return user;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Update failed');
    }
  }
);

export const forgotPassword = createAsyncThunk(
  'auth/forgotPassword',
  async (email, { rejectWithValue }) => {
    try {
      const { data } = await authAPI.forgotPassword(email);
      return data.message || 'Reset link sent';
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed');
    }
  }
);

export const resetPassword = createAsyncThunk(
  'auth/resetPassword',
  async ({ token, ...rest }, { rejectWithValue }) => {
    try {
      const { data } = await authAPI.resetPassword(token, rest);
      return data.message || 'Password reset successful';
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed');
    }
  }
);

export const logoutUser = createAsyncThunk('auth/logoutUser', async () => {
  try {
    await authAPI.logout();
  } catch {
    /* ignore */
  }
  localStorage.removeItem('token');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('user');
});

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    user: stored.user,
    token: stored.token,
    refreshToken: stored.refreshToken,
    isAuthenticated: !!stored.token,
    loading: false,
    error: null,
    message: null,
    initialized: !stored.token, // If no token, we are initialized (as guest)
  },
  reducers: {
    setCredentials: (state, action) => {
      const { token, refreshToken, user } = action.payload;
      if (token) {
        state.token = token;
        localStorage.setItem('token', token);
      }
      if (refreshToken) {
        state.refreshToken = refreshToken;
        localStorage.setItem('refreshToken', refreshToken);
      }
      if (user) {
        state.user = user;
        localStorage.setItem('user', JSON.stringify(user));
      }
      state.isAuthenticated = true;
    },
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.refreshToken = null;
      state.isAuthenticated = false;
      state.error = null;
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
    },
    clearError: (state) => {
      state.error = null;
    },
    clearMessage: (state) => {
      state.message = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(login.pending, (s) => {
        s.loading = true;
        s.error = null;
      })
      .addCase(login.fulfilled, (s, a) => {
        s.loading = false;
        if (a.payload.requiresMfa) return; // MFA step — not authenticated yet
        s.isAuthenticated = true;
        s.user = a.payload.user;
        s.token = a.payload.accessToken || a.payload.token;
        s.refreshToken = a.payload.refreshToken;
      })
      .addCase(login.rejected, (s, a) => {
        s.loading = false;
        s.error = a.payload;
      })
      .addCase(verifyMfaLogin.pending, (s) => {
        s.loading = true;
        s.error = null;
      })
      .addCase(verifyMfaLogin.fulfilled, (s, a) => {
        s.loading = false;
        s.isAuthenticated = true;
        s.user = a.payload.user;
        s.token = a.payload.accessToken || a.payload.token;
        s.refreshToken = a.payload.refreshToken;
      })
      .addCase(verifyMfaLogin.rejected, (s, a) => {
        s.loading = false;
        s.error = a.payload;
      })
      .addCase(register.pending, (s) => {
        s.loading = true;
        s.error = null;
      })
      .addCase(register.fulfilled, (s, a) => {
        s.loading = false;
        s.isAuthenticated = true;
        s.user = a.payload.user;
        s.token = a.payload.accessToken || a.payload.token;
        s.refreshToken = a.payload.refreshToken;
      })
      .addCase(register.rejected, (s, a) => {
        s.loading = false;
        s.error = a.payload;
      })
      .addCase(updateProfile.pending, (s) => {
        s.loading = true;
      })
      .addCase(updateProfile.fulfilled, (s, a) => {
        s.loading = false;
        s.user = a.payload;
        s.message = 'Profile updated';
      })
      .addCase(updateProfile.rejected, (s, a) => {
        s.loading = false;
        s.error = a.payload;
      })
      .addCase(forgotPassword.pending, (s) => {
        s.loading = true;
        s.error = null;
      })
      .addCase(forgotPassword.fulfilled, (s, a) => {
        s.loading = false;
        s.message = a.payload;
      })
      .addCase(forgotPassword.rejected, (s, a) => {
        s.loading = false;
        s.error = a.payload;
      })
      .addCase(resetPassword.rejected, (s, a) => {
        s.loading = false;
        s.error = a.payload;
      })
      .addCase(getProfile.pending, (s) => {
        s.loading = true;
      })
      .addCase(getProfile.fulfilled, (s, a) => {
        s.loading = false;
        s.user = a.payload;
        s.initialized = true;
      })
      .addCase(getProfile.rejected, (s, a) => {
        s.loading = false;
        s.initialized = true;
      })
      .addCase(logoutUser.fulfilled, (s) => {
        s.user = null;
        s.token = null;
        s.refreshToken = null;
        s.isAuthenticated = false;
      });
  },
});

export const { setCredentials, logout, clearError, clearMessage } = authSlice.actions;
export default authSlice.reducer;
