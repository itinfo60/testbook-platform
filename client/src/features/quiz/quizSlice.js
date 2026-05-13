import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { quizAPI } from '@/services/api';

export const fetchCourseQuizzes = createAsyncThunk('quizzes/fetchCourse', async (courseId, { rejectWithValue }) => {
  try {
    const { data } = await quizAPI.getCourseQuizzes(courseId);
    return data.data || data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Failed to fetch quizzes');
  }
});

export const submitQuiz = createAsyncThunk('quizzes/submit', async ({ id, answers }, { rejectWithValue }) => {
  try {
    const { data } = await quizAPI.submit(id, { answers });
    return data.data || data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Failed to submit quiz');
  }
});

export const fetchTeacherQuizzes = createAsyncThunk('quizzes/fetchTeacher', async (_, { rejectWithValue }) => {
  try {
    const { data } = await quizAPI.getTeacherQuizzes();
    return data.data || data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Failed to fetch quizzes');
  }
});

const quizSlice = createSlice({
  name: 'quizzes',
  initialState: {
    quizzes: [],
    teacherQuizzes: [],
    currentQuiz: null,
    result: null,
    loading: false,
    error: null,
    answers: {},
    currentQuestionIndex: 0,
  },
  reducers: {
    setQuizAnswer: (state, action) => {
      const { questionId, answer } = action.payload;
      state.answers[questionId] = answer;
    },
    setCurrentQuiz: (state, action) => {
      state.currentQuiz = action.payload;
    },
    setQuizQuestion: (state, action) => {
      state.currentQuestionIndex = action.payload;
    },
    clearQuizState: state => {
      state.answers = {};
      state.currentQuestionIndex = 0;
      state.result = null;
      state.currentQuiz = null;
    },
  },
  extraReducers: builder => {
    builder
      .addCase(fetchCourseQuizzes.pending, state => { state.loading = true; })
      .addCase(fetchCourseQuizzes.fulfilled, (state, action) => {
        state.loading = false;
        state.quizzes = Array.isArray(action.payload) ? action.payload : action.payload.quizzes || [];
      })
      .addCase(fetchCourseQuizzes.rejected, (state, action) => { state.loading = false; state.error = action.payload; })
      .addCase(submitQuiz.pending, state => { state.loading = true; })
      .addCase(submitQuiz.fulfilled, (state, action) => {
        state.loading = false;
        state.result = action.payload;
      })
      .addCase(submitQuiz.rejected, (state, action) => { state.loading = false; state.error = action.payload; })
      .addCase(fetchTeacherQuizzes.fulfilled, (state, action) => {
        state.teacherQuizzes = Array.isArray(action.payload) ? action.payload : [];
      });
  },
});

export const { setQuizAnswer, setCurrentQuiz, setQuizQuestion, clearQuizState } = quizSlice.actions;
export default quizSlice.reducer;
