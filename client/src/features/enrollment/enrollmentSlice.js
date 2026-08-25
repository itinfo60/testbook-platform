import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { enrollmentAPI } from '@/services/api';

export const enrollInCourse = createAsyncThunk(
  'enrollments/enroll',
  async (data, { rejectWithValue }) => {
    try {
      const { data: res } = await enrollmentAPI.enroll(data);
      return res.data || res;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Enrollment failed');
    }
  }
);

export const fetchMyEnrollments = createAsyncThunk(
  'enrollments/fetchMy',
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await enrollmentAPI.getMyEnrollments();
      return data.data || data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to fetch enrollments');
    }
  }
);

export const fetchProgress = createAsyncThunk(
  'enrollments/progress',
  async (id, { rejectWithValue }) => {
    try {
      const { data } = await enrollmentAPI.getProgress(id);
      return data.data || data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to fetch progress');
    }
  }
);

export const completeLesson = createAsyncThunk(
  'enrollments/completeLesson',
  async ({ courseId, lessonId, sectionId, completed = true }, { rejectWithValue }) => {
    try {
      const { data } = await enrollmentAPI.completeLesson(courseId, {
        lessonId,
        sectionId,
        completed,
      });
      return data.data || data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to update progress');
    }
  }
);

const enrollmentSlice = createSlice({
  name: 'enrollments',
  initialState: {
    enrollments: [],
    currentProgress: null,
    loading: false,
    error: null,
  },
  reducers: {
    clearEnrollmentError: (state) => {
      state.error = null;
    },
    markLessonDone: (state, action) => {
      if (!state.currentProgress) return;
      const { lessonId: payloadLessonId, completed = true } =
        typeof action.payload === 'object'
          ? action.payload
          : { lessonId: action.payload, completed: true };
      const lessonId = String(payloadLessonId);

      if (!Array.isArray(state.currentProgress.completedLessons)) {
        state.currentProgress.completedLessons = [];
      }

      if (completed) {
        if (!state.currentProgress.completedLessons.includes(lessonId)) {
          state.currentProgress.completedLessons.push(lessonId);
        }
      } else {
        state.currentProgress.completedLessons = state.currentProgress.completedLessons.filter(
          (id) => String(id) !== lessonId
        );
      }

      const existing = state.currentProgress.progress?.find(
        (p) => String(p.lessonId || p.lesson) === lessonId
      );
      if (existing) {
        existing.completed = completed;
      } else {
        if (!state.currentProgress.progress) state.currentProgress.progress = [];
        state.currentProgress.progress.push({ lessonId, completed });
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(enrollInCourse.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(enrollInCourse.fulfilled, (state, action) => {
        state.loading = false;
        state.enrollments.push(action.payload);
      })
      .addCase(enrollInCourse.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(fetchMyEnrollments.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchMyEnrollments.fulfilled, (state, action) => {
        state.loading = false;
        state.enrollments = Array.isArray(action.payload)
          ? action.payload
          : action.payload.enrollments || [];
      })
      .addCase(fetchMyEnrollments.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(fetchProgress.fulfilled, (state, action) => {
        state.currentProgress = action.payload.enrollment || action.payload;
      })
      .addCase(completeLesson.fulfilled, (state, action) => {
        if (state.currentProgress) {
          const payload = action.payload?.enrollment || action.payload;
          if (Array.isArray(payload?.completedLessons)) {
            state.currentProgress.completedLessons = payload.completedLessons;
          }
          if (payload?.progress !== undefined || payload?.progressPercentage !== undefined) {
            state.currentProgress.progressPercentage =
              payload.progress ??
              payload.progressPercentage ??
              state.currentProgress.progressPercentage;
          }
        }
      });
  },
});

export const { clearEnrollmentError, markLessonDone } = enrollmentSlice.actions;
export default enrollmentSlice.reducer;
