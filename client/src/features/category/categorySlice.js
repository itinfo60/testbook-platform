import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { examCategoryAPI } from '@/services/api';

export const fetchExamCategories = createAsyncThunk('categories/fetchExam', async (_, { rejectWithValue }) => {
  try {
    const { data } = await examCategoryAPI.getAll();
    return data.data || data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Failed');
  }
});

const categorySlice = createSlice({
  name: 'categories',
  initialState: {
    examCategories: [],
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: builder => {
    builder
      .addCase(fetchExamCategories.pending, state => { state.loading = true; })
      .addCase(fetchExamCategories.fulfilled, (state, action) => {
        state.loading = false;
        state.examCategories = Array.isArray(action.payload) ? action.payload : action.payload.categories || [];
      })
      .addCase(fetchExamCategories.rejected, (state, action) => { state.loading = false; state.error = action.payload; });
  },
});

export default categorySlice.reducer;
