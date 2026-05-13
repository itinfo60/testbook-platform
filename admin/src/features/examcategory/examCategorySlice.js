import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { examCategoriesAPI } from '@/services/api';
import toast from 'react-hot-toast';

export const fetchExamCategories = createAsyncThunk('examCategories/fetchAll', async (params, { rejectWithValue }) => {
  try {
    const res = await examCategoriesAPI.getAll(params);
    return res.data.data;
  } catch (err) { return rejectWithValue(err.response?.data); }
});

export const fetchExamCategoryById = createAsyncThunk('examCategories/fetchById', async (id, { rejectWithValue }) => {
  try {
    const res = await examCategoriesAPI.getById(id);
    return res.data.data.category || res.data.data;
  } catch (err) { return rejectWithValue(err.response?.data); }
});

export const createExamCategory = createAsyncThunk('examCategories/create', async (data, { rejectWithValue }) => {
  try {
    const res = await examCategoriesAPI.create(data);
    toast.success('Exam category created');
    return res.data.data;
  } catch (err) { return rejectWithValue(err.response?.data); }
});

export const updateExamCategory = createAsyncThunk('examCategories/update', async ({ id, data }, { rejectWithValue }) => {
  try {
    const res = await examCategoriesAPI.update(id, data);
    toast.success('Exam category updated');
    return res.data.data;
  } catch (err) { return rejectWithValue(err.response?.data); }
});

export const deleteExamCategory = createAsyncThunk('examCategories/delete', async (id, { rejectWithValue }) => {
  try {
    await examCategoriesAPI.delete(id);
    toast.success('Exam category deleted');
    return id;
  } catch (err) { return rejectWithValue(err.response?.data); }
});

const examCategorySlice = createSlice({
  name: 'examCategories',
  initialState: { list: [], selected: null, pagination: null, loading: false, error: null },
  reducers: { clearSelected: (state) => { state.selected = null; } },
  extraReducers: (builder) => {
    builder
      .addCase(fetchExamCategories.pending, (state) => { state.loading = true; })
      .addCase(fetchExamCategories.fulfilled, (state, action) => {
        state.loading = false;
        state.list = action.payload.categories || action.payload.docs || action.payload || [];
        state.pagination = action.payload.pagination || action.payload;
      })
      .addCase(fetchExamCategories.rejected, (state, action) => { state.loading = false; state.error = action.payload?.message; })
      .addCase(fetchExamCategoryById.fulfilled, (state, action) => { state.selected = action.payload; })
      .addCase(createExamCategory.fulfilled, (state, action) => { state.list.unshift(action.payload); })
      .addCase(deleteExamCategory.fulfilled, (state, action) => {
        state.list = state.list.filter((c) => c._id !== action.payload);
      });
  },
});

export const { clearSelected } = examCategorySlice.actions;
export default examCategorySlice.reducer;
