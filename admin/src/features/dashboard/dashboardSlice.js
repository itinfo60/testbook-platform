import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { dashboardAPI } from '@/services/api';

export const fetchDashboardStats = createAsyncThunk(
  'dashboard/fetchStats',
  async (params = {}, { rejectWithValue }) => {
    try {
      const res = await dashboardAPI.getStats(params);
      return res.data.data || res.data || {};
    } catch (err) {
      console.warn('Dashboard stats error:', err.message);
      return rejectWithValue({ message: 'Dashboard data unavailable' });
    }
  }
);

const dashboardSlice = createSlice({
  name: 'dashboard',
  initialState: { stats: null, loading: false, error: null },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchDashboardStats.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchDashboardStats.fulfilled, (state, action) => {
        state.loading = false;
        state.stats = action.payload;
      })
      .addCase(fetchDashboardStats.rejected, (state, action) => {
        state.loading = false;
        // Don't block the dashboard — just show empty
        state.stats = {};
        state.error = action.payload?.message;
      });
  },
});

export default dashboardSlice.reducer;
