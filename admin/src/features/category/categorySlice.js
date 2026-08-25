import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { examCategoriesAPI } from '@/services/api';
import toast from 'react-hot-toast';

export const fetchCategories = createAsyncThunk(
  'categories/fetchAll',
  async (params, { rejectWithValue }) => {
    try {
      // Always scope to type:'category' so the Categories section never shows exams
      const res = await examCategoriesAPI.getAll({ type: 'category', ...params });
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data);
    }
  }
);

export const createCategory = createAsyncThunk(
  'categories/create',
  async (data, { rejectWithValue }) => {
    try {
      // Always create as type:'category'
      const res = await examCategoriesAPI.create({ type: 'category', ...data });
      toast.success('Category created');
      return res.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data);
    }
  }
);

export const updateCategory = createAsyncThunk(
  'categories/update',
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const res = await examCategoriesAPI.update(id, data);
      toast.success('Category updated');
      return res.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data);
    }
  }
);

export const deleteCategory = createAsyncThunk(
  'categories/delete',
  async (id, { rejectWithValue }) => {
    try {
      await examCategoriesAPI.delete(id);
      toast.success('Category deleted');
      return id;
    } catch (err) {
      return rejectWithValue(err.response?.data);
    }
  }
);

export const toggleCategoryStatus = createAsyncThunk(
  'categories/toggleStatus',
  async ({ id, isActive }, { rejectWithValue }) => {
    try {
      const res = await examCategoriesAPI.update(id, { isActive });
      toast.success(`Category ${isActive ? 'activated' : 'deactivated'}`);
      return { id, isActive };
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update status');
      return rejectWithValue(err.response?.data);
    }
  }
);

const categorySlice = createSlice({
  name: 'categories',
  initialState: { list: [], selected: null, pagination: null, loading: false, error: null },
  reducers: {
    clearSelected: (state) => {
      state.selected = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchCategories.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchCategories.fulfilled, (state, action) => {
        state.loading = false;
        const payload = action.payload;
        const data = payload.data;
        // admin/list: ApiResponse.paginated → { data: [...], pagination }
        // public GET /categories: { data: { categories, allCategories } }
        state.list = Array.isArray(data) ? data : data?.docs || data?.categories || [];
        state.pagination = payload.pagination || null;
      })
      .addCase(fetchCategories.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message;
      })
      .addCase(createCategory.fulfilled, (state, action) => {
        state.list.unshift(action.payload);
      })
      .addCase(deleteCategory.fulfilled, (state, action) => {
        state.list = state.list.filter((c) => (c.id || c._id) !== action.payload);
      })
      .addCase(toggleCategoryStatus.fulfilled, (state, action) => {
        const item = state.list.find((c) => (c.id || c._id) === action.payload.id);
        if (item) item.isActive = action.payload.isActive;
      });
  },
});

export const { clearSelected } = categorySlice.actions;
export default categorySlice.reducer;
