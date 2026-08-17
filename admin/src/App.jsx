import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Routes, Route, Navigate } from 'react-router-dom';

// Auth & Store
import { getProfile } from '@/features/auth/authSlice';

// Components
import LoadingSpinner from '@/components/loadingSpinner';
import ProtectedRoute from '@/components/ProtectedRoute';

// Layouts
import AdminLayout from '@/layouts/AdminLayout';

// Features / Pages
import LoginPage from '@/features/auth/pages/LoginPage';
import DashboardPage from '@/features/dashboard/pages/DashboardPage';
import LibraryAdmin from '@/features/library/pages/LibraryAdmin';
import UserList from '@/features/user/pages/UserList';
import UserForm from '@/features/user/pages/UserForm';
import CourseList from '@/features/course/pages/CourseList';
import CourseOversight from '@/features/course/pages/CourseOversight';
import CourseForm from '@/features/course/pages/CourseForm';
import TestOversight from '@/features/test/pages/TestOversight';
import QuizOversight from '@/features/quiz/pages/QuizOversight';
import ReviewModeration from '@/features/review/pages/ReviewModeration';
import EnrollmentList from '@/features/enrollment/pages/EnrollmentList';
import RevenueDashboard from '@/features/revenue/pages/RevenueDashboard';
import TeacherList from '@/features/teacher/pages/TeacherList';
import CategoryList from '@/features/category/pages/CategoryList';
import CategoryForm from '@/features/category/pages/CategoryForm';
import ExamCategoryList from '@/features/examcategory/pages/ExamCategoryList';
import ExamCategoryForm from '@/features/examcategory/pages/ExamCategoryForm';
import CouponList from '@/features/coupon/pages/CouponList';
import CouponForm from '@/features/coupon/pages/CouponForm';
import BlogList from '@/features/blog/pages/BlogList';
import BlogForm from '@/features/blog/pages/BlogForm';
import JobAlertList from '@/features/blog/pages/JobAlertList';
import AnnouncementCenter from '@/features/notification/pages/AnnouncementCenter';
import BrandingSettings from '@/features/institute/pages/BrandingSettings';
import LiveClassesPage from '@/features/liveclass/pages/LiveClassesPage';

export default function App() {
  const dispatch = useDispatch();
  const { isAuthenticated, initialized } = useSelector((s) => s.auth);

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (token) {
      dispatch(getProfile());
    }
    // Only run once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!initialized) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-900 gap-4">
        <LoadingSpinner size="lg" />
        <p className="text-sm text-gray-500">Verifying session...</p>
      </div>
    );
  }

  return (
    <Routes>
      <Route
        path="/login"
        element={isAuthenticated ? <Navigate to="/" replace /> : <LoginPage />}
      />
      <Route element={<ProtectedRoute />}>
        <Route element={<AdminLayout />}>
          <Route index element={<DashboardPage />} />
          <Route path="users" element={<UserList />} />
          <Route path="users/create" element={<UserForm />} />
          <Route path="users/:id/edit" element={<UserForm />} />
          <Route path="courses" element={<CourseList />} />
          <Route path="courses/oversight" element={<CourseOversight />} />
          <Route path="courses/create" element={<CourseForm />} />
          <Route path="courses/:id/edit" element={<CourseForm />} />
          <Route path="tests" element={<TestOversight />} />
          <Route path="quizzes" element={<QuizOversight />} />
          <Route path="reviews" element={<ReviewModeration />} />
          <Route path="enrollments" element={<EnrollmentList />} />
          <Route path="revenue" element={<RevenueDashboard />} />
          <Route path="teachers" element={<TeacherList />} />
          <Route path="categories" element={<CategoryList />} />
          <Route path="categories/create" element={<CategoryForm />} />
          <Route path="categories/:id/edit" element={<CategoryForm />} />
          <Route path="exam-categories" element={<ExamCategoryList />} />
          <Route path="exam-categories/create" element={<ExamCategoryForm />} />
          <Route path="exam-categories/:id/edit" element={<ExamCategoryForm />} />
          <Route path="coupons" element={<CouponList />} />
          <Route path="coupons/create" element={<CouponForm />} />
          <Route path="coupons/:id/edit" element={<CouponForm />} />
          <Route path="blogs" element={<BlogList />} />
          <Route path="blogs/create" element={<BlogForm />} />
          <Route path="blogs/:id/edit" element={<BlogForm />} />
          <Route path="job-alerts" element={<JobAlertList />} />
          <Route path="announcements" element={<AnnouncementCenter />} />
          <Route path="library" element={<LibraryAdmin />} />
          <Route path="branding" element={<BrandingSettings />} />
          <Route path="live-classes" element={<LiveClassesPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Route>
    </Routes>
  );
}
