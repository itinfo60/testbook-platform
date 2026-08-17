import React from 'react';
import { render } from '@testing-library/react';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import { configureStore } from '@reduxjs/toolkit';
import { HelmetProvider } from 'react-helmet-async';

// All reducers — mirrors the real store.js
import authReducer from '@/features/auth/authSlice';
import courseReducer from '@/features/course/courseSlice';
import testReducer from '@/features/test/testSlice';
import quizReducer from '@/features/quiz/quizSlice';
import enrollmentReducer from '@/features/enrollment/enrollmentSlice';
import paymentReducer from '@/features/payment/paymentSlice';
import reviewReducer from '@/features/review/reviewSlice';
import notificationReducer from '@/features/notification/notificationSlice';
import wishlistReducer from '@/features/wishlist/wishlistSlice';
import discussionReducer from '@/features/discussion/discussionSlice';
import noteReducer from '@/features/note/noteSlice';
import categoryReducer from '@/features/category/categorySlice';
import leaderboardReducer from '@/features/leaderboard/leaderboardSlice';
import blogReducer from '@/features/blog/blogSlice';
import brandingReducer from '@/features/institute/brandingSlice';

export const createTestStore = (preloadedState = {}) =>
  configureStore({
    reducer: {
      auth: authReducer,
      courses: courseReducer,
      tests: testReducer,
      quizzes: quizReducer,
      enrollments: enrollmentReducer,
      payments: paymentReducer,
      reviews: reviewReducer,
      notifications: notificationReducer,
      wishlist: wishlistReducer,
      discussions: discussionReducer,
      notes: noteReducer,
      categories: categoryReducer,
      leaderboard: leaderboardReducer,
      blogs: blogReducer,
      branding: brandingReducer,
    },
    preloadedState,
    middleware: (getDefaultMiddleware) => getDefaultMiddleware({ serializableCheck: false }),
  });

// Default authenticated user state for most tests
export const defaultAuthState = {
  auth: {
    user: {
      _id: 'test-user-id',
      name: 'Test User',
      email: 'test@example.com',
      role: 'student',
      isEmailVerified: true,
    },
    token: 'mock-jwt-token',
    isAuthenticated: true,
    loading: false,
    error: null,
  },
};

export const renderWithProviders = (
  ui,
  { preloadedState = {}, store, initialEntries = ['/'], ...renderOptions } = {}
) => {
  const testStore = store || createTestStore({ ...defaultAuthState, ...preloadedState });

  const Wrapper = ({ children }) => (
    <HelmetProvider>
      <Provider store={testStore}>
        <MemoryRouter initialEntries={initialEntries}>{children}</MemoryRouter>
      </Provider>
    </HelmetProvider>
  );

  return { store: testStore, ...render(ui, { wrapper: Wrapper, ...renderOptions }) };
};
