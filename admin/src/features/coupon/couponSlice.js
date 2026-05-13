import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { couponsAPI } from '@/services/api';
import toast from 'react-hot-toast';

export const fetchCoupons = createAsyncThunk('coupons/fetchAll', async (params, { rejectWithValue }) => {
  try {
    const res = await couponsAPI.getAll(params);
    return res.data.data;
  } catch (err) { return rejectWithValue(err.response?.data); }
});

export const fetchCouponById = createAsyncThunk('coupons/fetchById', async (id, { rejectWithValue }) => {
  try {
    const res = await couponsAPI.getById(id);
    return res.data.data.coupon || res.data.data;
  } catch (err) { return rejectWithValue(err.response?.data); }
});

export const createCoupon = createAsyncThunk('coupons/create', async (data, { rejectWithValue }) => {
  try {
    const res = await couponsAPI.create(data);
    toast.success('Coupon created');
    return res.data.data;
  } catch (err) { return rejectWithValue(err.response?.data); }
});

export const updateCoupon = createAsyncThunk('coupons/update', async ({ id, data }, { rejectWithValue }) => {
  try {
    const res = await couponsAPI.update(id, data);
    toast.success('Coupon updated');
    return res.data.data;
  } catch (err) { return rejectWithValue(err.response?.data); }
});

export const deleteCoupon = createAsyncThunk('coupons/delete', async (id, { rejectWithValue }) => {
  try {
    await couponsAPI.delete(id);
    toast.success('Coupon deleted');
    return id;
  } catch (err) { return rejectWithValue(err.response?.data); }
});

const couponSlice = createSlice({
  name: 'coupons',
  initialState: { list: [], selected: null, pagination: null, loading: false, error: null },
  reducers: { clearSelected: (state) => { state.selected = null; } },
  extraReducers: (builder) => {
    builder
      .addCase(fetchCoupons.pending, (state) => { state.loading = true; })
      .addCase(fetchCoupons.fulfilled, (state, action) => {
        state.loading = false;
        state.list = action.payload.coupons || action.payload.docs || action.payload || [];
        state.pagination = action.payload.pagination || action.payload;
      })
      .addCase(fetchCoupons.rejected, (state, action) => { state.loading = false; state.error = action.payload?.message; })
      .addCase(fetchCouponById.fulfilled, (state, action) => { state.selected = action.payload; })
      .addCase(createCoupon.fulfilled, (state, action) => { state.list.unshift(action.payload); })
      .addCase(deleteCoupon.fulfilled, (state, action) => {
        state.list = state.list.filter((c) => c._id !== action.payload);
      });
  },
});

export const { clearSelected } = couponSlice.actions;
export default couponSlice.reducer;
