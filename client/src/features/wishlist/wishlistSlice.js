import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { wishlistAPI } from '@/services/api';

export const fetchWishlist = createAsyncThunk('wishlist/fetchAll', async (_, { rejectWithValue }) => {
  try {
    const { data } = await wishlistAPI.getAll();
    return data.data || data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Failed to fetch wishlist');
  }
});

export const toggleWishlist = createAsyncThunk('wishlist/toggle', async (courseId, { rejectWithValue }) => {
  try {
    const { data } = await wishlistAPI.toggle(courseId);
    return { courseId, ...(data.data || data) };
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Failed');
  }
});

export const checkWishlist = createAsyncThunk('wishlist/check', async (courseId, { rejectWithValue }) => {
  try {
    const { data } = await wishlistAPI.check(courseId);
    return { courseId, isWishlisted: data.data?.isWishlisted ?? data.isWishlisted ?? false };
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Failed');
  }
});

const wishlistSlice = createSlice({
  name: 'wishlist',
  initialState: {
    items: [],
    wishlistMap: {},
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: builder => {
    builder
      .addCase(fetchWishlist.pending, state => { state.loading = true; })
      .addCase(fetchWishlist.fulfilled, (state, action) => {
        state.loading = false;
        const items = Array.isArray(action.payload) ? action.payload : action.payload.wishlist || [];
        state.items = items;
        state.wishlistMap = {};
        items.forEach(item => {
          const id = item.course?._id || item.course || item._id;
          if (id) state.wishlistMap[id] = true;
        });
      })
      .addCase(fetchWishlist.rejected, (state, action) => { state.loading = false; state.error = action.payload; })
      .addCase(toggleWishlist.fulfilled, (state, action) => {
        const { courseId } = action.payload;
        if (state.wishlistMap[courseId]) {
          delete state.wishlistMap[courseId];
          state.items = state.items.filter(i => (i.course?._id || i.course || i._id) !== courseId);
        } else {
          state.wishlistMap[courseId] = true;
        }
      })
      .addCase(checkWishlist.fulfilled, (state, action) => {
        state.wishlistMap[action.payload.courseId] = action.payload.isWishlisted;
      });
  },
});

export default wishlistSlice.reducer;
