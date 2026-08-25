import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { coursesAPI } from '@/services/api';
import toast from 'react-hot-toast';

export const fetchCourses = createAsyncThunk(
  'courses/fetchAll',
  async (params, { rejectWithValue }) => {
    try {
      const res = await coursesAPI.getAll(params);
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data);
    }
  }
);

export const fetchCourseById = createAsyncThunk(
  'courses/fetchById',
  async (id, { rejectWithValue }) => {
    try {
      const res = await coursesAPI.getById(id);
      return res.data.data.course || res.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data);
    }
  }
);

export const deleteCourse = createAsyncThunk('courses/delete', async (id, { rejectWithValue }) => {
  try {
    await coursesAPI.delete(id);
    toast.success('Course deleted');
    return id;
  } catch (err) {
    return rejectWithValue(err.response?.data);
  }
});

export const togglePublish = createAsyncThunk(
  'courses/togglePublish',
  async (id, { rejectWithValue }) => {
    try {
      const res = await coursesAPI.togglePublish(id);
      toast.success('Publish status updated');
      return res.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data);
    }
  }
);

export const toggleFeatured = createAsyncThunk(
  'courses/toggleFeatured',
  async (id, { rejectWithValue }) => {
    try {
      const res = await coursesAPI.toggleFeatured(id);
      toast.success('Featured status updated');
      return res.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data);
    }
  }
);

const courseSlice = createSlice({
  name: 'courses',
  initialState: { list: [], selected: null, pagination: null, loading: false, error: null },
  reducers: {
    clearSelected: (state) => {
      state.selected = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchCourses.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchCourses.fulfilled, (state, action) => {
        state.loading = false;
        const data = action.payload.data;
        state.list = Array.isArray(data) ? data : data?.courses || data?.docs || [];
        state.pagination = action.payload.pagination || null;
      })
      .addCase(fetchCourses.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message;
      })
      .addCase(fetchCourseById.fulfilled, (state, action) => {
        state.selected = action.payload;
      })
      .addCase(deleteCourse.fulfilled, (state, action) => {
        state.list = state.list.filter((c) => (c.id || c._id) !== action.payload);
      })
      .addCase(togglePublish.fulfilled, (state, action) => {
        const payloadId =
          action.payload?.course?.id ||
          action.payload?.course?._id ||
          action.payload?.id ||
          action.payload?._id;
        const updatedCourse = action.payload?.course || action.payload;
        const idx = state.list.findIndex((c) => (c.id || c._id) === payloadId);
        if (idx >= 0) state.list[idx] = { ...state.list[idx], ...updatedCourse };
      })
      .addCase(toggleFeatured.fulfilled, (state, action) => {
        const payloadId = action.payload?.id || action.payload?._id || action.meta?.arg;
        const idx = state.list.findIndex((c) => (c.id || c._id) === payloadId);
        if (idx >= 0)
          state.list[idx] = {
            ...state.list[idx],
            isFeatured: action.payload?.isFeatured ?? !state.list[idx].isFeatured,
          };
      });
  },
});

export const { clearSelected } = courseSlice.actions;
export default courseSlice.reducer;
