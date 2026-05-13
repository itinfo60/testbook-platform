import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { leaderboardAPI } from '@/services/api';

export const fetchLeaderboard = createAsyncThunk('leaderboard/fetch', async (params, { rejectWithValue }) => {
  try {
    const { data } = await leaderboardAPI.get(params);
    return data.data || data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Failed');
  }
});

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
    setPeriod: (state, action) => { state.period = action.payload; },
  },
  extraReducers: builder => {
    builder
      .addCase(fetchLeaderboard.pending, state => { state.loading = true; })
      .addCase(fetchLeaderboard.fulfilled, (state, action) => {
        state.loading = false;
        state.entries = Array.isArray(action.payload) ? action.payload : action.payload.leaderboard || action.payload.entries || [];
        if (action.payload.userRank) state.userRank = action.payload.userRank;
      })
      .addCase(fetchLeaderboard.rejected, (state, action) => { state.loading = false; state.error = action.payload; });
  },
});

export const { setPeriod } = leaderboardSlice.actions;
export default leaderboardSlice.reducer;
