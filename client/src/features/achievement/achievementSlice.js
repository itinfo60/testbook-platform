import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { badgeAPI } from '@/services/api';

export const fetchAllBadges = createAsyncThunk('achievements/fetchAll', async (_, { rejectWithValue }) => {
  try {
    const { data } = await badgeAPI.getAll();
    return data.data || data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Failed');
  }
});

export const fetchMyBadges = createAsyncThunk('achievements/fetchMy', async (_, { rejectWithValue }) => {
  try {
    const { data } = await badgeAPI.getMyBadges();
    return data.data || data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Failed');
  }
});

const achievementSlice = createSlice({
  name: 'achievements',
  initialState: {
    allBadges: [],
    myBadges: [],
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: builder => {
    builder
      .addCase(fetchAllBadges.pending, state => { state.loading = true; })
      .addCase(fetchAllBadges.fulfilled, (state, action) => {
        state.loading = false;
        state.allBadges = Array.isArray(action.payload) ? action.payload : action.payload.badges || [];
      })
      .addCase(fetchAllBadges.rejected, (state, action) => { state.loading = false; state.error = action.payload; })
      .addCase(fetchMyBadges.pending, state => { state.loading = true; })
      .addCase(fetchMyBadges.fulfilled, (state, action) => {
        state.loading = false;
        state.myBadges = Array.isArray(action.payload) ? action.payload : action.payload.badges || [];
      })
      .addCase(fetchMyBadges.rejected, (state, action) => { state.loading = false; state.error = action.payload; });
  },
});

export default achievementSlice.reducer;
