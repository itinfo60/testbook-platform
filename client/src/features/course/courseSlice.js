import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { courseAPI } from '@/services/api';

export const fetchCourses = createAsyncThunk(
  'courses/fetchAll',
  async (params, { rejectWithValue }) => {
    try {
      const { data } = await courseAPI.getAll(params);
      return data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to fetch courses');
    }
  }
);

export const fetchCourseById = createAsyncThunk(
  'courses/fetchById',
  async (id, { rejectWithValue }) => {
    try {
      const { data } = await courseAPI.getById(id);
      return data.data || data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to fetch course');
    }
  }
);

export const fetchFeaturedCourses = createAsyncThunk(
  'courses/fetchFeatured',
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await courseAPI.getFeatured();
      return data.data || data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to fetch featured courses');
    }
  }
);

export const createCourse = createAsyncThunk(
  'courses/create',
  async (courseData, { rejectWithValue }) => {
    try {
      const { data } = await courseAPI.create(courseData);
      return data.data || data;
    } catch (err) {
      const res = err.response?.data;
      const detail =
        res?.errors?.map((e) => e.message).join(', ') || res?.message || 'Failed to create course';
      return rejectWithValue(detail);
    }
  }
);

export const updateCourse = createAsyncThunk(
  'courses/update',
  async ({ id, ...courseData }, { rejectWithValue }) => {
    try {
      const { data } = await courseAPI.update(id, courseData);
      return data.data || data;
    } catch (err) {
      const res = err.response?.data;
      const detail =
        res?.errors?.map((e) => e.message).join(', ') || res?.message || 'Failed to update course';
      return rejectWithValue(detail);
    }
  }
);

export const publishCourse = createAsyncThunk(
  'courses/publish',
  async (id, { rejectWithValue }) => {
    try {
      const { data } = await courseAPI.publish(id);
      return data.data?.course || data.data || data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to publish course');
    }
  }
);

export const deleteCourse = createAsyncThunk('courses/delete', async (id, { rejectWithValue }) => {
  try {
    await courseAPI.delete(id);
    return id;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Failed to delete course');
  }
});

export const fetchTeacherCourses = createAsyncThunk(
  'courses/fetchTeacher',
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await courseAPI.getTeacherCourses();
      return data.data || data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to fetch courses');
    }
  }
);

const courseSlice = createSlice({
  name: 'courses',
  initialState: {
    courses: [],
    featured: [],
    teacherCourses: [],
    currentCourse: null,
    currentCourseIsEnrolled: false,
    currentCourseReviews: [],
    pagination: { page: 1, totalPages: 1, total: 0 },
    loading: false,
    error: null,
    filters: { category: '', level: '', search: '', sort: 'newest', minPrice: '', maxPrice: '' },
  },
  reducers: {
    setFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    clearFilters: (state) => {
      state.filters = {
        category: '',
        level: '',
        search: '',
        sort: 'newest',
        minPrice: '',
        maxPrice: '',
      };
    },
    clearCurrentCourse: (state) => {
      state.currentCourse = null;
      state.currentCourseIsEnrolled = false;
      state.currentCourseReviews = [];
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchCourses.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCourses.fulfilled, (state, action) => {
        state.loading = false;
        const payload = action.payload;
        state.courses = payload.data || payload.courses || (Array.isArray(payload) ? payload : []);
        if (payload.pagination) {
          state.pagination = {
            page: payload.pagination.page || 1,
            totalPages: payload.pagination.pages || payload.pagination.totalPages || 1,
            total: payload.pagination.total || 0,
            limit: payload.pagination.limit || 12,
            hasNext: payload.pagination.hasNext,
            hasPrev: payload.pagination.hasPrev,
          };
        } else if (payload.totalPages || payload.pages) {
          state.pagination = {
            page: payload.page || 1,
            totalPages: payload.pages || payload.totalPages || 1,
            total: payload.total || 0,
            limit: payload.limit || 12,
          };
        }
      })
      .addCase(fetchCourses.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(fetchCourseById.pending, (state) => {
        state.loading = true;
        state.currentCourse = null;
        state.currentCourseIsEnrolled = false;
        state.error = null;
      })
      .addCase(fetchCourseById.fulfilled, (state, action) => {
        state.loading = false;
        state.currentCourse = action.payload.course || action.payload;
        // The server tells us whether the viewer has access. Keep it — the UI
        // must not infer the lock from missing videoUrl/content.
        state.currentCourseIsEnrolled = action.payload.isEnrolled === true;
        state.currentCourseReviews = action.payload.reviews || [];
      })
      .addCase(fetchCourseById.rejected, (state, action) => {
        state.loading = false;
        state.currentCourse = null;
        state.error = action.payload;
      })
      .addCase(fetchFeaturedCourses.fulfilled, (state, action) => {
        state.featured = Array.isArray(action.payload)
          ? action.payload
          : action.payload.courses || [];
      })
      .addCase(fetchTeacherCourses.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchTeacherCourses.fulfilled, (state, action) => {
        state.loading = false;
        state.teacherCourses = Array.isArray(action.payload)
          ? action.payload
          : action.payload.courses || [];
      })
      .addCase(fetchTeacherCourses.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(createCourse.fulfilled, (state, action) => {
        state.teacherCourses.unshift(action.payload);
      })
      .addCase(updateCourse.fulfilled, (state, action) => {
        const idx = state.teacherCourses.findIndex((c) => c._id === action.payload._id);
        if (idx >= 0) state.teacherCourses[idx] = action.payload;
        if (state.currentCourse?._id === action.payload._id) state.currentCourse = action.payload;
      })
      .addCase(deleteCourse.fulfilled, (state, action) => {
        state.teacherCourses = state.teacherCourses.filter((c) => c._id !== action.payload);
      })
      .addCase(publishCourse.fulfilled, (state, action) => {
        const idx = state.teacherCourses.findIndex((c) => c._id === action.payload._id);
        if (idx >= 0)
          state.teacherCourses[idx] = { ...state.teacherCourses[idx], ...action.payload };
      });
  },
});

export const { setFilters, clearFilters, clearCurrentCourse, clearError } = courseSlice.actions;
export default courseSlice.reducer;
