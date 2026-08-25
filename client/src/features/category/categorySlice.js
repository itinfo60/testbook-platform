import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '@/services/api';

// Fetch ONLY type:'category' records for course catalog filter
export const fetchExamCategories = createAsyncThunk(
  'categories/fetchExam',
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await api.get('/categories', { params: { type: 'category' } });
      const raw = data?.data;
      // public endpoint: { categories: [...], allCategories: [...] }
      const list = Array.isArray(raw) ? raw : raw?.allCategories || raw?.categories || [];
      return list;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed');
    }
  }
);

const categorySlice = createSlice({
  name: 'categories',
  initialState: {
    examCategories: [],
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchExamCategories.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchExamCategories.fulfilled, (state, action) => {
        state.loading = false;
        state.examCategories = Array.isArray(action.payload) ? action.payload : [];
      })
      .addCase(fetchExamCategories.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export default categorySlice.reducer;
