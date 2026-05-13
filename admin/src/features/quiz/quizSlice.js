import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { quizzesAPI } from '@/services/api';
import toast from 'react-hot-toast';

export const fetchQuizzes = createAsyncThunk('quizzes/fetchAll', async (params, { rejectWithValue }) => {
  try {
    const res = await quizzesAPI.getAll(params);
    return res.data.data;
  } catch (err) { return rejectWithValue(err.response?.data); }
});

export const deleteQuiz = createAsyncThunk('quizzes/delete', async (id, { rejectWithValue }) => {
  try {
    await quizzesAPI.delete(id);
    toast.success('Quiz deleted');
    return id;
  } catch (err) { return rejectWithValue(err.response?.data); }
});

const quizSlice = createSlice({
  name: 'quizzes',
  initialState: { list: [], pagination: null, loading: false, error: null },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchQuizzes.pending, (state) => { state.loading = true; })
      .addCase(fetchQuizzes.fulfilled, (state, action) => {
        state.loading = false;
        state.list = action.payload.quizzes || action.payload.docs || [];
        state.pagination = action.payload.pagination || action.payload;
      })
      .addCase(fetchQuizzes.rejected, (state, action) => { state.loading = false; state.error = action.payload?.message; })
      .addCase(deleteQuiz.fulfilled, (state, action) => {
        state.list = state.list.filter((q) => q._id !== action.payload);
      });
  },
});

export default quizSlice.reducer;
