import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { reviewsAPI } from '@/services/api';
import { extractListData } from '@/utils/extractListData';
import toast from 'react-hot-toast';

export const fetchReviews = createAsyncThunk('reviews/fetchAll', async (params, { rejectWithValue }) => {
  try { const res = await reviewsAPI.getAll(params); return res.data; }
  catch (err) { return rejectWithValue(err.response?.data); }
});

export const deleteReview = createAsyncThunk('reviews/delete', async (id, { rejectWithValue }) => {
  try { await reviewsAPI.delete(id); toast.success('Review deleted'); return id; }
  catch (err) { return rejectWithValue(err.response?.data); }
});

// This is toggle-approval, not just approve
export const toggleReviewApproval = createAsyncThunk('reviews/toggleApproval', async (id, { rejectWithValue }) => {
  try {
    const res = await reviewsAPI.approve(id); // calls /toggle-approval
    toast.success('Review approval toggled');
    const d = res.data?.data || res.data;
    return { _id: id, ...d };
  } catch (err) { return rejectWithValue(err.response?.data); }
});

const reviewSlice = createSlice({
  name: 'reviews',
  initialState: { list: [], pagination: null, loading: false, error: null },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchReviews.pending, (state) => { state.loading = true; })
      .addCase(fetchReviews.fulfilled, (state, action) => {
        state.loading = false;
        const { list, pagination } = extractListData(action.payload, 'REVIEWS');
        state.list = list;
        state.pagination = pagination;
      })
      .addCase(fetchReviews.rejected, (state, action) => { state.loading = false; state.error = action.payload?.message; })
      .addCase(deleteReview.fulfilled, (state, action) => {
        state.list = state.list.filter((r) => r._id !== action.payload);
      })
      .addCase(toggleReviewApproval.fulfilled, (state, action) => {
        if (action.payload?._id) {
          const i = state.list.findIndex((r) => r._id === action.payload._id);
          if (i >= 0) {
            // Toggle isApproved on the existing item
            state.list[i] = { ...state.list[i], isApproved: action.payload.isApproved };
          }
        }
      });
  },
});

export default reviewSlice.reducer;