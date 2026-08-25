import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { reviewAPI } from '@/services/api';

export const fetchCourseReviews = createAsyncThunk(
  'reviews/fetchCourse',
  async ({ courseId, params }, { rejectWithValue }) => {
    try {
      const { data } = await reviewAPI.getCourseReviews(courseId, params);
      // API returns paginated: { data: { docs: [...], total, ... } }
      const payload = data.data || data;
      return Array.isArray(payload) ? payload : payload.docs || payload.reviews || [];
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to fetch reviews');
    }
  }
);

export const createReview = createAsyncThunk(
  'reviews/create',
  async (reviewData, { rejectWithValue }) => {
    try {
      const { data } = await reviewAPI.create(reviewData);
      const payload = data.data || data;
      // Unwrap { review: {...} } if present
      return payload.review || payload;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to create review');
    }
  }
);

export const updateReview = createAsyncThunk(
  'reviews/update',
  async ({ id, ...reviewData }, { rejectWithValue }) => {
    try {
      const { data } = await reviewAPI.update(id, reviewData);
      const payload = data.data || data;
      return payload.review || payload;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to update review');
    }
  }
);

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
  extraReducers: (builder) => {
    builder
      .addCase(fetchCourseReviews.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchCourseReviews.fulfilled, (state, action) => {
        state.loading = false;
        // Thunk now always resolves to a plain array
        state.reviews = Array.isArray(action.payload) ? action.payload : [];
      })
      .addCase(fetchCourseReviews.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(createReview.fulfilled, (state, action) => {
        state.reviews.unshift(action.payload);
      })
      .addCase(updateReview.fulfilled, (state, action) => {
        const idx = state.reviews.findIndex((r) => r._id === action.payload._id);
        if (idx >= 0) {
          // Server returns the saved review but user may not be populated yet —
          // preserve the existing populated user object so the card never
          // reverts to "Anonymous".
          const existingUser = state.reviews[idx].user;
          state.reviews[idx] = {
            ...action.payload,
            user:
              action.payload.user && typeof action.payload.user === 'object'
                ? action.payload.user
                : existingUser,
          };
        }
      })
      .addCase(deleteReview.fulfilled, (state, action) => {
        state.reviews = state.reviews.filter((r) => r._id !== action.payload);
      });
  },
});

export default reviewSlice.reducer;
