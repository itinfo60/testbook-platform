import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { reviewAPI } from '@/services/api';

export const fetchCourseReviews = createAsyncThunk('reviews/fetchCourse', async ({ courseId, params }, { rejectWithValue }) => {
  try {
    const { data } = await reviewAPI.getCourseReviews(courseId, params);
    return data.data || data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Failed to fetch reviews');
  }
});

export const createReview = createAsyncThunk('reviews/create', async (reviewData, { rejectWithValue }) => {
  try {
    const { data } = await reviewAPI.create(reviewData);
    return data.data || data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Failed to create review');
  }
});

export const updateReview = createAsyncThunk('reviews/update', async ({ id, ...reviewData }, { rejectWithValue }) => {
  try {
    const { data } = await reviewAPI.update(id, reviewData);
    return data.data || data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Failed to update review');
  }
});

export const deleteReview = createAsyncThunk('reviews/delete', async (id, { rejectWithValue }) => {
  try {
    await reviewAPI.delete(id);
    return id;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Failed to delete review');
  }
});

const reviewSlice = createSlice({
  name: 'reviews',
  initialState: {
    reviews: [],
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: builder => {
    builder
      .addCase(fetchCourseReviews.pending, state => { state.loading = true; })
      .addCase(fetchCourseReviews.fulfilled, (state, action) => {
        state.loading = false;
        state.reviews = Array.isArray(action.payload) ? action.payload : action.payload.reviews || [];
      })
      .addCase(fetchCourseReviews.rejected, (state, action) => { state.loading = false; state.error = action.payload; })
      .addCase(createReview.fulfilled, (state, action) => { state.reviews.unshift(action.payload); })
      .addCase(updateReview.fulfilled, (state, action) => {
        const idx = state.reviews.findIndex(r => r._id === action.payload._id);
        if (idx >= 0) state.reviews[idx] = action.payload;
      })
      .addCase(deleteReview.fulfilled, (state, action) => {
        state.reviews = state.reviews.filter(r => r._id !== action.payload);
      });
  },
});

export default reviewSlice.reducer;
