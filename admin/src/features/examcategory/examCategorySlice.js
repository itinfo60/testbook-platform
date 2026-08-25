import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { examCategoriesAPI } from '@/services/api';
import toast from 'react-hot-toast';

export const fetchExamCategories = createAsyncThunk(
  'examCategories/fetchAll',
  async (params, { rejectWithValue }) => {
    try {
      // Always scope to type:'exam' so the Exams section never shows plain categories
      const res = await examCategoriesAPI.getAll({ type: 'exam', ...params });
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data);
    }
  }
);

export const fetchExamCategoryById = createAsyncThunk(
  'examCategories/fetchById',
  async (id, { rejectWithValue }) => {
    try {
      const res = await examCategoriesAPI.getById(id);
      return res.data.data.category || res.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data);
    }
  }
);

export const createExamCategory = createAsyncThunk(
  'examCategories/create',
  async (data, { rejectWithValue }) => {
    try {
      // Always create as type:'exam'
      const res = await examCategoriesAPI.create({ type: 'exam', ...data });
      toast.success('Exam created');
      return res.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data);
    }
  }
);

export const updateExamCategory = createAsyncThunk(
  'examCategories/update',
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const res = await examCategoriesAPI.update(id, data);
      toast.success('Exam updated');
      return res.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data);
    }
  }
);

export const deleteExamCategory = createAsyncThunk(
  'examCategories/delete',
  async (id, { rejectWithValue }) => {
    try {
      await examCategoriesAPI.delete(id);
      toast.success('Exam deleted');
      return id;
    } catch (err) {
      return rejectWithValue(err.response?.data);
    }
  }
);

export const toggleExamCategoryStatus = createAsyncThunk(
  'examCategories/toggleStatus',
  async ({ id, isActive }, { rejectWithValue }) => {
    try {
      const res = await examCategoriesAPI.update(id, { isActive });
      toast.success(`Exam ${isActive ? 'activated' : 'deactivated'}`);
      return { id, isActive };
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update status');
      return rejectWithValue(err.response?.data);
    }
  }
);

const examCategorySlice = createSlice({
  name: 'examCategories',
  initialState: { list: [], selected: null, pagination: null, loading: false, error: null },
  reducers: {
    clearSelected: (state) => {
      state.selected = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchExamCategories.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchExamCategories.fulfilled, (state, action) => {
        state.loading = false;
        const payload = action.payload;
        // admin/list: ApiResponse.paginated → { data: [...], pagination }
        // public GET /categories: { data: { categories, allCategories } }
        const data = payload.data;
        state.list = Array.isArray(data)
          ? data
          : data?.docs || data?.categories || (Array.isArray(data) ? data : []);
        state.pagination = payload.pagination || null;
      })
      .addCase(fetchExamCategories.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message;
      })
      .addCase(fetchExamCategoryById.fulfilled, (state, action) => {
        state.selected = action.payload;
      })
      .addCase(createExamCategory.fulfilled, (state, action) => {
        state.list.unshift(action.payload);
      })
      .addCase(deleteExamCategory.fulfilled, (state, action) => {
        state.list = state.list.filter((c) => (c.id || c._id) !== action.payload);
      })
      .addCase(toggleExamCategoryStatus.fulfilled, (state, action) => {
        const item = state.list.find((c) => (c.id || c._id) === action.payload.id);
        if (item) item.isActive = action.payload.isActive;
      });
  },
});

export const { clearSelected } = examCategorySlice.actions;
export default examCategorySlice.reducer;
