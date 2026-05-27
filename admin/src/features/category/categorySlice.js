import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { examCategoriesAPI } from '@/services/api';
import toast from 'react-hot-toast';

export const fetchCategories = createAsyncThunk(
  'categories/fetchAll',
  async (params, { rejectWithValue }) => {
    try {
      const res = await examCategoriesAPI.getAll(params);
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
      const res = await examCategoriesAPI.create(data);
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
        const data = action.payload.data;
        state.list = data?.categories || (Array.isArray(data) ? data : []);
        state.pagination = action.payload.pagination || null;
      })
      .addCase(fetchCategories.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message;
      })
      .addCase(createCategory.fulfilled, (state, action) => {
        state.list.unshift(action.payload);
      })
      .addCase(deleteCategory.fulfilled, (state, action) => {
        state.list = state.list.filter((c) => c._id !== action.payload);
      });
  },
});

export const { clearSelected } = categorySlice.actions;
export default categorySlice.reducer;
