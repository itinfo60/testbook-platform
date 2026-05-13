import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { enrollmentsAPI } from '@/services/api';

export const fetchEnrollments = createAsyncThunk('enrollments/fetchAll', async (params, { rejectWithValue }) => {
  try {
    const res = await enrollmentsAPI.getAll(params);
    return res.data.data;
  } catch (err) { return rejectWithValue(err.response?.data); }
});

export const exportEnrollments = createAsyncThunk('enrollments/export', async (params, { rejectWithValue }) => {
  try {
    const res = await enrollmentsAPI.export(params);
    const url = window.URL.createObjectURL(new Blob([res.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `enrollments-${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  } catch (err) { return rejectWithValue(err.response?.data); }
});

const enrollmentSlice = createSlice({
  name: 'enrollments',
  initialState: { list: [], pagination: null, loading: false, exporting: false, error: null },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchEnrollments.pending, (state) => { state.loading = true; })
      .addCase(fetchEnrollments.fulfilled, (state, action) => {
        state.loading = false;
        state.list = action.payload.enrollments || action.payload.docs || [];
        state.pagination = action.payload.pagination || action.payload;
      })
      .addCase(fetchEnrollments.rejected, (state, action) => { state.loading = false; state.error = action.payload?.message; })
      .addCase(exportEnrollments.pending, (state) => { state.exporting = true; })
      .addCase(exportEnrollments.fulfilled, (state) => { state.exporting = false; })
      .addCase(exportEnrollments.rejected, (state) => { state.exporting = false; });
  },
});

export default enrollmentSlice.reducer;
