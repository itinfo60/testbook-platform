import { configureStore } from '@reduxjs/toolkit';
import { injectStore } from '@/services/api';

// Reducers
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
import achievementReducer from '@/features/achievement/achievementSlice';
import blogReducer from '@/features/blog/blogSlice';


export const store = configureStore({
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
    achievements: achievementReducer,
    blogs: blogReducer,

  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['auth/setCredentials'],
      },
    }),
  devTools: import.meta.env.DEV,
});

injectStore(store);
