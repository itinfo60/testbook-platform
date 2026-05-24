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

export const fetchQuizById = createAsyncThunk('quizzes/fetchById', async (id, { rejectWithValue }) => {
  try {
    const { data } = await quizAPI.getById(id);
    return data.data || data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Failed to fetch quiz');
  }
});

export const createQuiz = createAsyncThunk('quizzes/create', async (quizData, { rejectWithValue }) => {
  try {
    const { data } = await quizAPI.create(quizData);
    return data.data || data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Failed to create quiz');
  }
});

export const updateQuiz = createAsyncThunk('quizzes/update', async ({ id, ...quizData }, { rejectWithValue }) => {
  try {
    const { data } = await quizAPI.update(id, quizData);
    return data.data || data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Failed to update quiz');
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
    clearCurrentQuiz: state => {
      state.currentQuiz = null;
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
        state.teacherQuizzes = Array.isArray(action.payload) ? action.payload : action.payload?.quizzes || [];
      })
      .addCase(fetchQuizById.pending, state => { state.loading = true; })
      .addCase(fetchQuizById.fulfilled, (state, action) => {
        state.loading = false;
        state.currentQuiz = action.payload.quiz || action.payload;
      })
      .addCase(fetchQuizById.rejected, (state, action) => { state.loading = false; state.error = action.payload; })
      .addCase(createQuiz.fulfilled, (state, action) => {
        const quiz = action.payload.quiz || action.payload;
        state.teacherQuizzes.unshift(quiz);
      })
      .addCase(updateQuiz.fulfilled, (state, action) => {
        const quiz = action.payload.quiz || action.payload;
        const idx = state.teacherQuizzes.findIndex(q => q._id === quiz._id);
        if (idx >= 0) state.teacherQuizzes[idx] = quiz;
      });
  },
});

export const { setQuizAnswer, setCurrentQuiz, setQuizQuestion, clearQuizState, clearCurrentQuiz } = quizSlice.actions;
export default quizSlice.reducer;
