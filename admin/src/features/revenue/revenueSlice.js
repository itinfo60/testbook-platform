import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { revenueAPI } from '@/services/api';

export const fetchRevenue = createAsyncThunk(
  'revenue/fetch',
  async (params, { rejectWithValue }) => {
    try {
      const res = await revenueAPI.getAnalytics(params);
      return res.data.data || res.data || {};
    } catch (err) {
      return rejectWithValue({ message: 'Revenue data unavailable' });
    }
  }
);

export const fetchMonthlyRevenue = createAsyncThunk(
  'revenue/fetchMonthly',
  async (params, { rejectWithValue }) => {
    try {
      const res = await revenueAPI.getMonthly(params);
      return res.data.data || res.data || [];
    } catch (err) {
      return rejectWithValue({ message: 'Monthly revenue data unavailable' });
    }
  }
);

const revenueSlice = createSlice({
  name: 'revenue',
  initialState: { data: null, monthly: [], loading: false, error: null },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchRevenue.pending, (state) => { state.loading = true; })
      .addCase(fetchRevenue.fulfilled, (state, action) => {
        state.loading = false;
        state.data = action.payload;
      })
      .addCase(fetchRevenue.rejected, (state) => {
        state.loading = false;
        state.data = {};
      })
      .addCase(fetchMonthlyRevenue.fulfilled, (state, action) => {
        state.monthly = Array.isArray(action.payload) ? action.payload : [];
      })
      .addCase(fetchMonthlyRevenue.rejected, (state) => {
        state.monthly = [];
      });
  },
});

export default revenueSlice.reducer;