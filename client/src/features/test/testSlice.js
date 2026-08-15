import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { testAPI } from '@/services/api';

export const fetchTests = createAsyncThunk(
  'tests/fetchAll',
  async (params, { rejectWithValue }) => {
    try {
      const { data } = await testAPI.getAll(params);
      return data.data || data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to fetch tests');
    }
  }
);

export const fetchTestById = createAsyncThunk(
  'tests/fetchById',
  async (id, { rejectWithValue }) => {
    try {
      const { data } = await testAPI.getById(id);
      return data.data || data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to fetch test');
    }
  }
);

export const startTest = createAsyncThunk('tests/start', async (id, { rejectWithValue }) => {
  try {
    const { data } = await testAPI.start(id);
    return data.data || data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Failed to start test');
  }
});

export const submitTest = createAsyncThunk(
  'tests/submit',
  async ({ attemptId, answers }, { rejectWithValue }) => {
    try {
      const formattedAnswers = Object.entries(answers).map(([questionId, optionIndex]) => ({
        questionId,
        selectedOptions: [optionIndex],
      }));
      const { data } = await testAPI.submit(attemptId, { answers: formattedAnswers });
      return data.data || data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to submit test');
    }
  }
);

export const fetchLatestTestResult = createAsyncThunk(
  'tests/fetchLatestResult',
  async (testId, { rejectWithValue }) => {
    try {
      const { data: attemptsData } = await testAPI.getMyAttempts({ testId });
      const attempts = attemptsData.data || attemptsData;
      const docs = Array.isArray(attempts) ? attempts : attempts.docs || [];

      const completedAttempts = docs.filter(
        (a) => a.status === 'completed' || a.status === 'timed_out'
      );
      if (completedAttempts.length === 0) {
        return rejectWithValue('No completed attempts found for this test');
      }

      const latestAttempt = completedAttempts[0];
      const { data: resultData } = await testAPI.getAttemptResult(latestAttempt._id);
      return resultData.data || resultData;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to fetch test result');
    }
  }
);

export const fetchTestAnalytics = createAsyncThunk(
  'tests/analytics',
  async (id, { rejectWithValue }) => {
    try {
      const { data } = await testAPI.getAnalytics(id);
      return data.data || data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to fetch analytics');
    }
  }
);

export const fetchTeacherTests = createAsyncThunk(
  'tests/fetchTeacher',
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await testAPI.getTeacherTests();
      return data.data || data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to fetch tests');
    }
  }
);

export const createTest = createAsyncThunk(
  'tests/create',
  async (testData, { rejectWithValue }) => {
    try {
      const { data } = await testAPI.create(testData);
      return data.data || data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to create test');
    }
  }
);

export const updateTest = createAsyncThunk(
  'tests/update',
  async ({ id, ...testData }, { rejectWithValue }) => {
    try {
      const { data } = await testAPI.update(id, testData);
      return data.data || data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to update test');
    }
  }
);

const testSlice = createSlice({
  name: 'tests',
  initialState: {
    tests: [],
    teacherTests: [],
    currentTest: null,
    attemptCount: 0,
    isPurchased: false,
    activeAttempt: null,
    attempt: null,
    questions: [],
    result: null,
    analytics: null,
    loading: false,
    error: null,
    answers: {},
    markedForReview: [],
    currentQuestionIndex: 0,
  },
  reducers: {
    setAnswer: (state, action) => {
      const { questionId, answer } = action.payload;
      if (answer === undefined || answer === null) {
        delete state.answers[questionId];
      } else {
        state.answers[questionId] = answer;
      }
    },
    clearAnswer: (state, action) => {
      const questionId = action.payload;
      delete state.answers[questionId];
    },
    toggleMarkForReview: (state, action) => {
      const qId = action.payload;
      if (state.markedForReview.includes(qId)) {
        state.markedForReview = state.markedForReview.filter((id) => id !== qId);
      } else {
        state.markedForReview.push(qId);
      }
    },
    setCurrentQuestion: (state, action) => {
      state.currentQuestionIndex = action.payload;
    },
    clearTestState: (state) => {
      state.answers = {};
      state.markedForReview = [];
      state.currentQuestionIndex = 0;
      state.attempt = null;
      state.activeAttempt = null;
      state.questions = [];
      state.result = null;
    },
    clearCurrentTest: (state) => {
      state.currentTest = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchTests.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchTests.fulfilled, (state, action) => {
        state.loading = false;
        state.tests = Array.isArray(action.payload) ? action.payload : action.payload.tests || [];
      })
      .addCase(fetchTests.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(fetchTestById.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchTestById.fulfilled, (state, action) => {
        state.loading = false;
        state.currentTest = action.payload.test || action.payload;
        state.attemptCount = action.payload.attemptCount ?? 0;
        state.isPurchased = action.payload.isPurchased ?? false;
        state.activeAttempt = action.payload.activeAttempt || null;
      })
      .addCase(fetchTestById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(startTest.pending, (state) => {
        state.loading = true;
        state.answers = {};
        state.markedForReview = [];
        state.currentQuestionIndex = 0;
        state.result = null;
        state.error = null;
      })
      .addCase(startTest.fulfilled, (state, action) => {
        state.loading = false;
        state.attempt = action.payload;
        state.questions = action.payload.questions || [];
        state.activeAttempt = null;
      })
      .addCase(startTest.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(submitTest.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(submitTest.fulfilled, (state, action) => {
        state.loading = false;
        state.result = action.payload;
      })
      .addCase(submitTest.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(fetchLatestTestResult.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchLatestTestResult.fulfilled, (state, action) => {
        state.loading = false;
        state.result = action.payload;
        state.questions =
          action.payload?.attempt?.test?.questions || action.payload?.questions || [];
      })
      .addCase(fetchLatestTestResult.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(fetchTestAnalytics.fulfilled, (state, action) => {
        state.analytics = action.payload;
      })
      .addCase(fetchTeacherTests.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchTeacherTests.fulfilled, (state, action) => {
        state.loading = false;
        state.teacherTests = Array.isArray(action.payload)
          ? action.payload
          : action.payload.tests || [];
      })
      .addCase(fetchTeacherTests.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(createTest.fulfilled, (state, action) => {
        state.teacherTests.unshift(action.payload);
      })
      .addCase(updateTest.fulfilled, (state, action) => {
        const idx = state.teacherTests.findIndex((t) => t._id === action.payload._id);
        if (idx >= 0) state.teacherTests[idx] = action.payload;
      });
  },
});

export const {
  setAnswer,
  clearAnswer,
  toggleMarkForReview,
  setCurrentQuestion,
  clearTestState,
  clearCurrentTest,
} = testSlice.actions;
export default testSlice.reducer;
