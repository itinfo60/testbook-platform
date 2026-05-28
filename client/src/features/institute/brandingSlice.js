import { createSlice } from '@reduxjs/toolkit';

const brandingSlice = createSlice({
  name: 'branding',
  initialState: {
    name: '',
    websiteTitle: '',
    logoUrl: '',
    primaryColor: '',
    faviconUrl: '',
    loaded: false,
  },
  reducers: {
    setBranding(state, action) {
      return { ...state, ...action.payload, loaded: true };
    },
  },
});

export const { setBranding } = brandingSlice.actions;
export default brandingSlice.reducer;
