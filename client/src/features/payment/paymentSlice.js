import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { paymentAPI, couponAPI } from '@/services/api';

export const createOrder = createAsyncThunk('payments/createOrder', async (data, { rejectWithValue }) => {
  try {
    const { data: res } = await paymentAPI.createOrder(data);
    return res.data || res;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Failed to create order');
  }
});

export const verifyPayment = createAsyncThunk('payments/verify', async (data, { rejectWithValue }) => {
  try {
    const { data: res } = await paymentAPI.verify(data);
    return res.data || res;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Payment verification failed');
  }
});

export const validateCoupon = createAsyncThunk('payments/validateCoupon', async (data, { rejectWithValue }) => {
  try {
    const { data: res } = await couponAPI.validate(data);
    return res.data || res;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Invalid coupon');
  }
});

const paymentSlice = createSlice({
  name: 'payments',
  initialState: {
    order: null,
    coupon: null,
    discount: 0,
    loading: false,
    error: null,
    paymentSuccess: false,
  },
  reducers: {
    clearPaymentState: state => {
      state.order = null;
      state.coupon = null;
      state.discount = 0;
      state.error = null;
      state.paymentSuccess = false;
    },
    clearCoupon: state => {
      state.coupon = null;
      state.discount = 0;
    },
  },
  extraReducers: builder => {
    builder
      .addCase(createOrder.pending, state => { state.loading = true; state.error = null; })
      .addCase(createOrder.fulfilled, (state, action) => {
        state.loading = false;
        state.order = action.payload;
      })
      .addCase(createOrder.rejected, (state, action) => { state.loading = false; state.error = action.payload; })
      .addCase(verifyPayment.pending, state => { state.loading = true; })
      .addCase(verifyPayment.fulfilled, (state) => {
        state.loading = false;
        state.paymentSuccess = true;
      })
      .addCase(verifyPayment.rejected, (state, action) => { state.loading = false; state.error = action.payload; })
      .addCase(validateCoupon.pending, state => { state.loading = true; })
      .addCase(validateCoupon.fulfilled, (state, action) => {
        state.loading = false;
        state.coupon = action.payload;
        state.discount = action.payload.discount || action.payload.discountAmount || 0;
      })
      .addCase(validateCoupon.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.coupon = null;
        state.discount = 0;
      });
  },
});

export const { clearPaymentState, clearCoupon } = paymentSlice.actions;
export default paymentSlice.reducer;
