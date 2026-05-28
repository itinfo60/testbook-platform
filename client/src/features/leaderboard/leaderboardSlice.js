import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { leaderboardAPI } from '@/services/api';

export const fetchLeaderboard = createAsyncThunk(
  'leaderboard/fetch',
  async (params, { rejectWithValue }) => {
    try {
      // map client 'allTime' key to server 'all'
      const serverParams = {
        ...params,
        period: params.period === 'allTime' ? 'all' : params.period,
      };
      const { data } = await leaderboardAPI.get(serverParams);
      return data.data || data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed');
    }
  }
);

const leaderboardSlice = createSlice({
  name: 'leaderboard',
  initialState: {
    entries: [],
    userRank: null,
    loading: false,
    error: null,
    period: 'weekly',
  },
  reducers: {
    setPeriod: (state, action) => {
      state.period = action.payload;
      state.entries = [];
      state.userRank = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchLeaderboard.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchLeaderboard.fulfilled, (state, action) => {
        state.loading = false;
        const payload = action.payload;
        state.entries = Array.isArray(payload)
          ? payload
          : payload.leaderboard || payload.entries || [];
        // userRank is { rank, points } or null
        state.userRank = payload.userRank ?? null;
      })
      .addCase(fetchLeaderboard.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { setPeriod } = leaderboardSlice.actions;
export default leaderboardSlice.reducer;
