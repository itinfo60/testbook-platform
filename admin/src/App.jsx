import { useEffect, Suspense, lazy } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Routes, Route, Navigate } from 'react-router-dom';

// Auth & Store
import { getProfile } from '@/features/auth/authSlice';

// Components
import LoadingSpinner from '@/components/loadingSpinner';
import ProtectedRoute from '@/components/ProtectedRoute';

// Layouts
import AdminLayout from '@/layouts/AdminLayout';

// Features / Pages (Lazy Loaded)
const LoginPage = lazy(() => import('@/features/auth/pages/LoginPage'));
const DashboardPage = lazy(() => import('@/features/dashboard/pages/DashboardPage'));
const LibraryAdmin = lazy(() => import('@/features/library/pages/LibraryAdmin'));
const UserList = lazy(() => import('@/features/user/pages/UserList'));
const UserForm = lazy(() => import('@/features/user/pages/UserForm'));
const CourseList = lazy(() => import('@/features/course/pages/CourseList'));
const CourseOversight = lazy(() => import('@/features/course/pages/CourseOversight'));
const CourseForm = lazy(() => import('@/features/course/pages/CourseForm'));
const TestOversight = lazy(() => import('@/features/test/pages/TestOversight'));
const TestForm = lazy(() => import('@/features/test/pages/TestForm'));
const QuizOversight = lazy(() => import('@/features/quiz/pages/QuizOversight'));
const QuizForm = lazy(() => import('@/features/quiz/pages/QuizForm'));
const TestSeriesList = lazy(() => import('@/features/testseries/pages/TestSeriesList'));
const TestSeriesForm = lazy(() => import('@/features/testseries/pages/TestSeriesForm'));
const ReviewModeration = lazy(() => import('@/features/review/pages/ReviewModeration'));
const EnrollmentList = lazy(() => import('@/features/enrollment/pages/EnrollmentList'));
const RevenueDashboard = lazy(() => import('@/features/revenue/pages/RevenueDashboard'));
const TeacherList = lazy(() => import('@/features/teacher/pages/TeacherList'));
const CategoryList = lazy(() => import('@/features/category/pages/CategoryList'));
const CategoryForm = lazy(() => import('@/features/category/pages/CategoryForm'));
const CategoryDetail = lazy(() => import('@/features/category/pages/CategoryDetail'));
const ResourceCategoryList = lazy(() => import('@/features/category/pages/ResourceCategoryList'));
const ExamCategoryList = lazy(() => import('@/features/examcategory/pages/ExamCategoryList'));
const ExamCategoryForm = lazy(() => import('@/features/examcategory/pages/ExamCategoryForm'));
const ExamCategoryDetail = lazy(() => import('@/features/examcategory/pages/ExamCategoryDetail'));
const UserDetail = lazy(() => import('@/features/user/pages/UserDetail'));
const CourseDetail = lazy(() => import('@/features/course/pages/CourseDetail'));
const TeacherDetail = lazy(() => import('@/features/teacher/pages/TeacherDetail'));
const TestDetail = lazy(() => import('@/features/test/pages/TestDetail'));
const QuizDetail = lazy(() => import('@/features/quiz/pages/QuizDetail'));
const TestSeriesDetail = lazy(() => import('@/features/testseries/pages/TestSeriesDetail'));
const CouponList = lazy(() => import('@/features/coupon/pages/CouponList'));
const CouponForm = lazy(() => import('@/features/coupon/pages/CouponForm'));
const BlogList = lazy(() => import('@/features/blog/pages/BlogList'));
const BlogForm = lazy(() => import('@/features/blog/pages/BlogForm'));
const JobAlertList = lazy(() => import('@/features/blog/pages/JobAlertList'));
const AnnouncementCenter = lazy(() => import('@/features/notification/pages/AnnouncementCenter'));
const BrandingSettings = lazy(() => import('@/features/institute/pages/BrandingSettings'));
const LegalSettings = lazy(() => import('@/features/settings/pages/LegalSettings'));
const HelpSettings = lazy(() => import('@/features/settings/pages/HelpSettings'));
const SupportTicketsList = lazy(() => import('@/features/support/pages/SupportTicketsList'));
const SuccessStoriesSettings = lazy(
  () => import('@/features/settings/pages/SuccessStoriesSettings')
);
const LiveClassesPage = lazy(() => import('@/features/liveclass/pages/LiveClassesPage'));
const PaymentList = lazy(() => import('@/features/payment/pages/PaymentList'));
const LogsExplorer = lazy(() => import('@/features/logs/pages/LogsExplorer'));

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
    <Suspense
      fallback={
        <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-900 gap-4">
          <LoadingSpinner size="lg" />
          <p className="text-sm text-gray-500">Loading module...</p>
        </div>
      }
    >
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
            <Route path="users/:id" element={<UserDetail />} />
            <Route path="users/:id/edit" element={<UserForm />} />
            <Route path="courses" element={<CourseList />} />
            <Route path="courses/oversight" element={<CourseOversight />} />
            <Route path="courses/create" element={<CourseForm />} />
            <Route path="courses/:id" element={<CourseDetail />} />
            <Route path="courses/:id/edit" element={<CourseForm />} />
            <Route path="tests" element={<TestOversight />} />
            <Route path="tests/create" element={<TestForm />} />
            <Route path="tests/:id" element={<TestDetail />} />
            <Route path="tests/:id/edit" element={<TestForm />} />
            <Route path="test-series" element={<TestSeriesList />} />
            <Route path="test-series/create" element={<TestSeriesForm />} />
            <Route path="test-series/:id" element={<TestSeriesDetail />} />
            <Route path="test-series/:id/edit" element={<TestSeriesForm />} />
            <Route path="quizzes" element={<QuizOversight />} />
            <Route path="quizzes/create" element={<QuizForm />} />
            <Route path="quizzes/:id" element={<QuizDetail />} />
            <Route path="quizzes/:id/edit" element={<QuizForm />} />
            <Route path="reviews" element={<ReviewModeration />} />
            <Route path="enrollments" element={<EnrollmentList />} />
            <Route path="revenue" element={<RevenueDashboard />} />
            <Route path="payments" element={<PaymentList />} />
            <Route path="orders" element={<PaymentList />} />
            <Route path="teachers" element={<TeacherList />} />
            <Route path="teachers/:id" element={<TeacherDetail />} />
            <Route path="categories" element={<CategoryList />} />
            <Route path="categories/create" element={<CategoryForm />} />
            <Route path="categories/:id" element={<CategoryDetail />} />
            <Route path="categories/:id/edit" element={<CategoryForm />} />
            <Route path="resource-categories" element={<ResourceCategoryList />} />
            <Route path="exam-categories" element={<ExamCategoryList />} />
            <Route path="exam-categories/create" element={<ExamCategoryForm />} />
            <Route path="exam-categories/:id" element={<ExamCategoryDetail />} />
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
            <Route path="legal-settings" element={<LegalSettings />} />
            <Route path="help-settings" element={<HelpSettings />} />
            <Route path="support-tickets" element={<SupportTicketsList />} />
            <Route path="success-stories-settings" element={<SuccessStoriesSettings />} />
            <Route path="live-classes" element={<LiveClassesPage />} />
            <Route path="logs" element={<LogsExplorer />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Route>
      </Routes>
    </Suspense>
  );
}
