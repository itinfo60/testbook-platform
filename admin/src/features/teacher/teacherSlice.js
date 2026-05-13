import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { teachersAPI, usersAPI } from '@/services/api';
import { extractListData } from '@/utils/extractListData';
import toast from 'react-hot-toast';

export const fetchTeachers = createAsyncThunk(
  'teachers/fetchAll',
  async (params, { rejectWithValue }) => {
    // Try /admin/teachers first, fallback to /admin/users?role=teacher
    try {
      const res = await teachersAPI.getAll(params);
      return { source: 'teachers', data: res.data };
    } catch (err) {
      if (err.response?.status === 404) {
        try {
          const res = await usersAPI.getAll({ ...params, role: 'teacher' });
          return { source: 'users', data: res.data };
        } catch (err2) {
          return rejectWithValue(err2.response?.data || { message: err2.message });
        }
      }
      return rejectWithValue(err.response?.data || { message: err.message });
    }
  }
);

export const verifyTeacher = createAsyncThunk(
  'teachers/verify',
  async (id, { rejectWithValue }) => {
    try {
      const res = await teachersAPI.verify(id);
      toast.success('Teacher verified');
      const d = res.data?.data || res.data;
      return d?.teacher || d?.user || d;
    } catch (err) {
      return rejectWithValue(err.response?.data);
    }
  }
);

export const rejectTeacher = createAsyncThunk(
  'teachers/reject',
  async (id, { rejectWithValue }) => {
    try {
      const res = await teachersAPI.reject(id);
      toast.success('Teacher rejected');
      const d = res.data?.data || res.data;
      return d?.teacher || d?.user || d;
    } catch (err) {
      return rejectWithValue(err.response?.data);
    }
  }
);

const teacherSlice = createSlice({
  name: 'teachers',
  initialState: { list: [], pagination: null, loading: false, error: null },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchTeachers.pending, (state) => { 
        state.loading = true; 
        state.error = null;
      })
      .addCase(fetchTeachers.fulfilled, (state, action) => {
        state.loading = false;
        const { list, pagination } = extractListData(action.payload.data, 'TEACHERS');
        state.list = list;
        state.pagination = pagination;
      })
      .addCase(fetchTeachers.rejected, (state, action) => { 
        state.loading = false; 
        state.error = action.payload?.message;
      })
      .addCase(verifyTeacher.fulfilled, (state, action) => {
        if (action.payload?._id) {
          const i = state.list.findIndex((t) => t._id === action.payload._id);
          if (i >= 0) state.list[i] = { ...state.list[i], ...action.payload };
        }
      })
      .addCase(rejectTeacher.fulfilled, (state, action) => {
        if (action.payload?._id) {
          const i = state.list.findIndex((t) => t._id === action.payload._id);
          if (i >= 0) state.list[i] = { ...state.list[i], ...action.payload };
        }
      });
  },
});

export default teacherSlice.reducer;