import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { usersAPI } from '@/services/api';
import toast from 'react-hot-toast';

// ── Helper: extract array + pagination from any response shape ──
const extractListData = (responseData, key) => {
  const data = responseData?.data || responseData;

  let list = [];
  let pagination = null;

  // Pattern 1: { users: [...], pagination: {...} }
  // Pattern 2: { docs: [...], totalDocs, page, ... } (mongoose-paginate)
  // Pattern 3: { data: [...] }
  // Pattern 4: { results: [...] }
  // Pattern 5: Direct array
  // Pattern 6: { users: [...], total, page, ... }

  if (Array.isArray(data)) {
    list = data;
  } else if (data) {
    // Try to find the array
    list = data.users || data.docs || data.data || data.results || data.items || data.records || [];

    // If still not an array, check if data itself has user properties (single user)
    if (!Array.isArray(list)) {
      // Maybe the entire data object IS the paginate result
      if (data.docs) {
        list = data.docs;
      } else {
        list = [];
      }
    }

    // Extract pagination
    pagination = data.pagination || {
      page: data.page || data.currentPage || 1,
      totalPages: data.totalPages || data.pages || 1,
      total: data.total || data.totalDocs || data.totalResults || data.count || list.length,
      limit: data.limit || data.perPage || 10,
    };
  }

  return { list, pagination };
};

export const fetchUsers = createAsyncThunk(
  'users/fetchAll',
  async (params, { rejectWithValue }) => {
    try {
      const res = await usersAPI.getAll(params);
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data || { message: err.message });
    }
  }
);

export const fetchUserById = createAsyncThunk(
  'users/fetchById',
  async (id, { rejectWithValue }) => {
    try {
      const res = await usersAPI.getById(id);
      const data = res.data?.data || res.data;
      return data?.user || data;
    } catch (err) {
      return rejectWithValue(err.response?.data);
    }
  }
);

export const createUser = createAsyncThunk('users/create', async (data, { rejectWithValue }) => {
  try {
    const res = await usersAPI.create(data);
    toast.success('User created successfully');
    const d = res.data?.data || res.data;
    return d?.user || d;
  } catch (err) {
    return rejectWithValue(err.response?.data);
  }
});

export const updateUser = createAsyncThunk(
  'users/update',
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const res = await usersAPI.update(id, data);
      toast.success('User updated successfully');
      const d = res.data?.data || res.data;
      return d?.user || d;
    } catch (err) {
      return rejectWithValue(err.response?.data);
    }
  }
);

export const deleteUser = createAsyncThunk('users/delete', async (id, { rejectWithValue }) => {
  try {
    await usersAPI.delete(id);
    toast.success('User deleted');
    return id;
  } catch (err) {
    return rejectWithValue(err.response?.data);
  }
});

export const toggleUserStatus = createAsyncThunk(
  'users/toggleStatus',
  async (user, { rejectWithValue }) => {
    try {
      const userId = user.id || user._id;
      const newIsActive = !(user.isActive ?? user.status === 'active');
      const res = await usersAPI.update(userId, { isActive: newIsActive });
      toast.success('Status updated');
      const data = res.data?.data || res.data;
      return data?.user || data;
    } catch (err) {
      return rejectWithValue(err.response?.data);
    }
  }
);

const userSlice = createSlice({
  name: 'users',
  initialState: {
    list: [],
    selected: null,
    pagination: null,
    loading: false,
    error: null,
  },
  reducers: {
    clearSelected: (state) => {
      state.selected = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch all
      .addCase(fetchUsers.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUsers.fulfilled, (state, action) => {
        state.loading = false;
        const { list, pagination } = extractListData(action.payload, 'USERS');
        state.list = list;
        state.pagination = pagination;
      })
      .addCase(fetchUsers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message;
      })
      // Fetch by ID
      .addCase(fetchUserById.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchUserById.fulfilled, (state, action) => {
        state.loading = false;
        state.selected = action.payload;
      })
      .addCase(fetchUserById.rejected, (state) => {
        state.loading = false;
      })
      // Create - refetch will happen from component
      .addCase(createUser.fulfilled, (state, action) => {
        if (action.payload) {
          state.list.unshift(action.payload);
        }
      })
      // Delete
      .addCase(deleteUser.fulfilled, (state, action) => {
        state.list = state.list.filter((u) => (u.id || u._id) !== action.payload);
      })
      // Toggle Status
      .addCase(toggleUserStatus.fulfilled, (state, action) => {
        const payloadId = action.payload?.id || action.payload?._id;
        if (payloadId) {
          const idx = state.list.findIndex((u) => (u.id || u._id) === payloadId);
          if (idx >= 0) state.list[idx] = { ...state.list[idx], ...action.payload };
        }
      });
  },
});

export const { clearSelected } = userSlice.actions;
export default userSlice.reducer;
