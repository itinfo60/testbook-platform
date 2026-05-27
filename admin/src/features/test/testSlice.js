import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { testsAPI } from '@/services/api';
import toast from 'react-hot-toast';

export const fetchTests = createAsyncThunk(
  'tests/fetchAll',
  async (params, { rejectWithValue }) => {
    try {
      const res = await testsAPI.getAll(params);
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data);
    }
  }
);

export const deleteTest = createAsyncThunk('tests/delete', async (id, { rejectWithValue }) => {
  try {
    await testsAPI.delete(id);
    toast.success('Test deleted');
    return id;
  } catch (err) {
    return rejectWithValue(err.response?.data);
  }
});

const testSlice = createSlice({
  name: 'tests',
  initialState: { list: [], pagination: null, loading: false, error: null },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchTests.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchTests.fulfilled, (state, action) => {
        state.loading = false;
        const data = action.payload.data;
        state.list = Array.isArray(data) ? data : data?.tests || data?.docs || [];
        state.pagination = action.payload.pagination || null;
      })
      .addCase(fetchTests.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message;
      })
      .addCase(deleteTest.fulfilled, (state, action) => {
        state.list = state.list.filter((t) => t._id !== action.payload);
      });
  },
});

export default testSlice.reducer;
