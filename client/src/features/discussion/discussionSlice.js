import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { discussionAPI } from '@/services/api';

export const fetchDiscussions = createAsyncThunk(
  'discussions/fetch',
  async ({ courseId, params }, { rejectWithValue }) => {
    try {
      const { data } = await discussionAPI.getCourseDiscussions(courseId, params);
      return data.data || data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed');
    }
  }
);

export const createDiscussion = createAsyncThunk(
  'discussions/create',
  async (discussionData, { rejectWithValue }) => {
    try {
      const { data } = await discussionAPI.create(discussionData);
      return data.data?.discussion || data.discussion || data.data || data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed');
    }
  }
);

export const replyToDiscussion = createAsyncThunk(
  'discussions/reply',
  async ({ id, content }, { rejectWithValue }) => {
    try {
      const { data } = await discussionAPI.reply(id, { content });
      return { id, reply: data.data?.reply || data.reply || data.data || data };
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed');
    }
  }
);

export const likeDiscussion = createAsyncThunk(
  'discussions/like',
  async (id, { rejectWithValue }) => {
    try {
      const { data } = await discussionAPI.like(id);
      return { id, ...(data.data || data) };
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed');
    }
  }
);

export const resolveDiscussion = createAsyncThunk(
  'discussions/resolve',
  async (id, { rejectWithValue }) => {
    try {
      const { data } = await discussionAPI.resolve(id);
      return { id, ...(data.data || data) };
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed');
    }
  }
);

const discussionSlice = createSlice({
  name: 'discussions',
  initialState: {
    discussions: [],
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchDiscussions.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchDiscussions.fulfilled, (state, action) => {
        state.loading = false;
        state.discussions = Array.isArray(action.payload)
          ? action.payload
          : action.payload.docs || action.payload.discussions || [];
      })
      .addCase(fetchDiscussions.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(createDiscussion.fulfilled, (state, action) => {
        state.discussions.unshift(action.payload);
      })
      .addCase(replyToDiscussion.fulfilled, (state, action) => {
        const idx = state.discussions.findIndex((d) => d._id === action.payload.id);
        if (idx >= 0) {
          if (!state.discussions[idx].replies) state.discussions[idx].replies = [];
          state.discussions[idx].replies.push(action.payload.reply);
        }
      })
      .addCase(likeDiscussion.fulfilled, (state, action) => {
        const d = state.discussions.find((d) => d._id === action.payload.id);
        if (d) d.likes = action.payload.likes ?? (d.likes || 0) + 1;
      })
      .addCase(resolveDiscussion.fulfilled, (state, action) => {
        const d = state.discussions.find((d) => d._id === action.payload.id);
        if (d) d.isResolved = true;
      });
  },
});

export default discussionSlice.reducer;
