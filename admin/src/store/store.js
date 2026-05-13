import { configureStore } from '@reduxjs/toolkit';

// Reducers
import authReducer from '@/features/auth/authSlice';
import dashboardReducer from '@/features/dashboard/dashboardSlice';
import userReducer from '@/features/user/userSlice';
import courseReducer from '@/features/course/courseSlice';
import testReducer from '@/features/test/testSlice';
import quizReducer from '@/features/quiz/quizSlice';
import reviewReducer from '@/features/review/reviewSlice';
import enrollmentReducer from '@/features/enrollment/enrollmentSlice';
import revenueReducer from '@/features/revenue/revenueSlice';
import teacherReducer from '@/features/teacher/teacherSlice';
import categoryReducer from '@/features/category/categorySlice';
import examCategoryReducer from '@/features/examcategory/examCategorySlice';
import couponReducer from '@/features/coupon/couponSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    dashboard: dashboardReducer,
    users: userReducer,
    courses: courseReducer,
    tests: testReducer,
    quizzes: quizReducer,
    reviews: reviewReducer,
    enrollments: enrollmentReducer,
    revenue: revenueReducer,
    teachers: teacherReducer,
    categories: categoryReducer,
    examCategories: examCategoryReducer,
    coupons: couponReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({ serializableCheck: false }),
  devTools: import.meta.env.DEV,
});
