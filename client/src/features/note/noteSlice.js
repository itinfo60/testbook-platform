import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { noteAPI } from '@/services/api';

export const fetchNotes = createAsyncThunk('notes/fetch', async (courseId, { rejectWithValue }) => {
  try {
    const { data } = await noteAPI.getCourseNotes(courseId);
    return data.data || data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Failed');
  }
});

export const createNote = createAsyncThunk('notes/create', async (noteData, { rejectWithValue }) => {
  try {
    const { data } = await noteAPI.create(noteData);
    return data.data || data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Failed');
  }
});

export const updateNote = createAsyncThunk('notes/update', async ({ id, ...noteData }, { rejectWithValue }) => {
  try {
    const { data } = await noteAPI.update(id, noteData);
    return data.data || data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Failed');
  }
});

export const deleteNote = createAsyncThunk('notes/delete', async (id, { rejectWithValue }) => {
  try {
    await noteAPI.delete(id);
    return id;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Failed');
  }
});

const noteSlice = createSlice({
  name: 'notes',
  initialState: {
    notes: [],
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: builder => {
    builder
      .addCase(fetchNotes.pending, state => { state.loading = true; })
      .addCase(fetchNotes.fulfilled, (state, action) => {
        state.loading = false;
        state.notes = Array.isArray(action.payload) ? action.payload : action.payload.notes || [];
      })
      .addCase(fetchNotes.rejected, (state, action) => { state.loading = false; state.error = action.payload; })
      .addCase(createNote.fulfilled, (state, action) => { state.notes.unshift(action.payload); })
      .addCase(updateNote.fulfilled, (state, action) => {
        const idx = state.notes.findIndex(n => n._id === action.payload._id);
        if (idx >= 0) state.notes[idx] = action.payload;
      })
      .addCase(deleteNote.fulfilled, (state, action) => {
        state.notes = state.notes.filter(n => n._id !== action.payload);
      });
  },
});

export default noteSlice.reducer;
