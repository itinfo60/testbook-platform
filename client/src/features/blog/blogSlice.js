import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { blogAPI } from '@/services/api';

export const fetchBlogs = createAsyncThunk('blogs/fetchAll', async (params, { rejectWithValue }) => {
  try {
    const { data } = await blogAPI.getAll(params);
    return data.data || data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Failed to fetch blogs');
  }
});

export const fetchBlogBySlug = createAsyncThunk('blogs/fetchBySlug', async (slug, { rejectWithValue }) => {
  try {
    const { data } = await blogAPI.getBySlug(slug);
    return data.data || data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Failed to fetch blog post');
  }
});

export const createBlog = createAsyncThunk('blogs/create', async (blogData, { rejectWithValue }) => {
  try {
    const { data } = await blogAPI.create(blogData);
    return data.data || data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Failed to create blog post');
  }
});

const blogSlice = createSlice({
  name: 'blogs',
  initialState: {
    blogs: [],
    currentBlog: null,
    pagination: { page: 1, totalPages: 1, total: 0 },
    loading: false,
    error: null,
    filters: { search: '', tag: '', sort: 'newest' },
  },
  reducers: {
    setBlogFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    clearBlogFilters: state => {
      state.filters = { search: '', tag: '', sort: 'newest' };
    },
    clearCurrentBlog: state => {
      state.currentBlog = null;
    },
  },
  extraReducers: builder => {
    builder
      .addCase(fetchBlogs.pending, state => { state.loading = true; state.error = null; })
      .addCase(fetchBlogs.fulfilled, (state, action) => {
        state.loading = false;
        const payload = action.payload;
        state.blogs = payload.blogs || payload.docs || payload;
        if (payload.pagination) state.pagination = payload.pagination;
        else if (payload.totalPages) state.pagination = { page: payload.page, totalPages: payload.totalPages, total: payload.total };
      })
      .addCase(fetchBlogs.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(fetchBlogBySlug.pending, state => { state.loading = true; state.error = null; })
      .addCase(fetchBlogBySlug.fulfilled, (state, action) => {
        state.loading = false;
        state.currentBlog = action.payload.blog || action.payload;
      })
      .addCase(fetchBlogBySlug.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { setBlogFilters, clearBlogFilters, clearCurrentBlog } = blogSlice.actions;
export default blogSlice.reducer;
