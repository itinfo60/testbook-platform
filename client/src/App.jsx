import { lazy, Suspense, useEffect, memo } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import ScrollManager from '@/components/ScrollManager';
import { useDispatch } from 'react-redux';
import { io } from 'socket.io-client';
import { toast } from 'react-hot-toast';

// Auth & Store
import { useAuth } from '@/hooks/useAuth';
import useBranding from '@/hooks/useBranding';
import { getProfile } from '@/features/auth/authSlice';
import { addNotification } from '@/features/notification/notificationSlice';

// Components (always loaded — small)
import LoadingSpinner from '@/components/common/LoadingSpinner';
import ProtectedRoute from '@/components/ProtectedRoute';
import GuestRoute from '@/components/GuestRoute';

// Layouts (always loaded — structural)
import AuthLayout from '@/layouts/AuthLayout';
import MainLayout from '@/layouts/MainLayout';
import ErrorBoundary from '@/components/ErrorBoundary';
import { Outlet } from 'react-router-dom';

const FeatureBoundary = () => (
  <ErrorBoundary>
    <Suspense fallback={<FullScreenLoader />}>
      <Outlet />
    </Suspense>
  </ErrorBoundary>
);

// ===== LAZY LOADED PAGES =====
// Auth
const LoginPage = lazy(() => import('@/features/auth/pages/LoginPage'));
const RegisterPage = lazy(() => import('@/features/auth/pages/RegisterPage'));
const ForgotPasswordPage = lazy(() => import('@/features/auth/pages/ForgotPasswordPage'));
const ResetPasswordPage = lazy(() => import('@/features/auth/pages/ResetPasswordPage'));
const AuthCallbackPage = lazy(() => import('@/features/auth/pages/AuthCallbackPage'));
const VerifyEmailPage = lazy(() => import('@/features/auth/pages/verify/VerifyEmailPage'));

// Public
const HomePage = lazy(() => import('@/features/home/pages/HomePage'));
const CourseCatalog = lazy(() => import('@/features/course/pages/CourseCatalog'));
const CourseDetail = lazy(() => import('@/features/course/pages/CourseDetail'));
const TestCatalog = lazy(() => import('@/features/test/pages/TestCatalog'));
const TestSeriesCatalog = lazy(() => import('@/features/test/pages/TestSeriesCatalog'));
const TestSeriesDetail = lazy(() => import('@/features/test/pages/TestSeriesDetail'));
const TestDetail = lazy(() => import('@/features/test/pages/TestDetail'));
const LeaderboardPage = lazy(() => import('@/features/leaderboard/pages/LeaderboardPage'));
const CertificateVerify = lazy(() => import('@/features/auth/pages/verify/CertificateVerify'));
const UnauthorizedPage = lazy(() => import('@/features/auth/pages/UnauthorizedPage'));
const BlogList = lazy(() => import('@/features/blog/pages/BlogList'));
const BlogDetail = lazy(() => import('@/features/blog/pages/BlogDetail'));
const JobAlertList = lazy(() => import('@/features/blog/pages/JobAlertList'));
const PricingPage = lazy(() => import('@/features/subscription/pages/PricingPage'));
const NotFoundPage = lazy(() => import('@/features/home/pages/NotFoundPage'));

// CivicsEdu Public Pages
const ExamsCatalog = lazy(() => import('@/features/exams/pages/ExamsCatalog'));
const ExamDetail = lazy(() => import('@/features/exams/pages/ExamDetail'));
const SearchResultsPage = lazy(() => import('@/features/search/pages/SearchResultsPage'));
const FreeResourcesPage = lazy(() => import('@/features/free-zone/pages/FreeResourcesPage'));
const AboutPage = lazy(() => import('@/features/about/pages/AboutPage'));
const FacultyPage = lazy(() => import('@/features/faculty/pages/FacultyPage'));
const SuccessStoriesPage = lazy(() => import('@/features/success/pages/SuccessStoriesPage'));
const HelpCenterPage = lazy(() => import('@/features/support/pages/HelpCenterPage'));
const LegalPage = lazy(() => import('@/features/legal/pages/LegalPage'));
const DailyQuizPage = lazy(() => import('@/features/quiz/pages/DailyQuizPage'));

// Student Protected
const DashboardPage = lazy(() => import('@/features/dashboard/pages/DashboardPage'));
const MyCourses = lazy(() => import('@/features/course/pages/MyCourses'));
const CourseLearning = lazy(() => import('@/features/course/pages/CourseLearning'));
const MyTestAttempts = lazy(() => import('@/features/test/pages/MyTestAttempts'));
const QuizPage = lazy(() => import('@/features/quiz/pages/QuizPage'));

const Wishlist = lazy(() => import('@/features/wishlist/pages/Wishlist'));
const Checkout = lazy(() => import('@/features/enrollment/pages/checkout/Checkout'));
const CheckoutSuccess = lazy(() => import('@/features/enrollment/pages/checkout/CheckoutSuccess'));
const OrderHistory = lazy(() => import('@/features/enrollment/pages/orders/OrderHistory'));
const Profile = lazy(() => import('@/features/auth/pages/profile/Profile'));
const ProfileSettingsPage = lazy(
  () => import('@/features/auth/pages/settings/ProfileSettingsPage')
);
const NotificationsPage = lazy(() => import('@/features/notification/pages/NotificationsPage'));

// Teacher (heavy — lazy critical)
const TeacherLayout = lazy(() => import('@/features/teacher/pages/TeacherLayout'));
const TeacherDashboard = lazy(() => import('@/features/teacher/pages/TeacherDashboard'));
const TeacherCourses = lazy(() => import('@/features/course/pages/teacher/TeacherCourses'));
const TeacherCourseForm = lazy(() => import('@/features/course/pages/teacher/TeacherCourseForm'));
const TeacherTests = lazy(() => import('@/features/test/pages/teacher/TeacherTests'));
const TeacherTestForm = lazy(() => import('@/features/test/pages/teacher/TeacherTestForm'));
const TeacherTestAnalytics = lazy(
  () => import('@/features/test/pages/teacher/TeacherTestAnalytics')
);
const TeacherQuizzes = lazy(() => import('@/features/quiz/pages/teacher/TeacherQuizzes'));
const TeacherQuizForm = lazy(() => import('@/features/quiz/pages/teacher/TeacherQuizForm'));
const TeacherStudents = lazy(() => import('@/features/teacher/pages/TeacherStudents'));
const TeacherRevenue = lazy(() => import('@/features/teacher/pages/TeacherRevenue'));
const TeacherDiscussions = lazy(() => import('@/features/teacher/pages/TeacherDiscussions'));
const TeacherAttendance = lazy(() => import('@/features/teacher/pages/TeacherAttendance'));
const TeacherLiveClasses = lazy(() => import('@/features/liveclass/pages/TeacherLiveClasses'));
const TeacherBlogManagement = lazy(() => import('@/features/blog/pages/TeacherBlogManagement'));

// AI
const AIQuestionGenerator = lazy(() => import('@/features/ai/pages/AIQuestionGenerator'));

const AIQuizGenerator = lazy(() => import('@/features/ai/pages/AIQuizGenerator'));

// Live Classes
const LiveClassList = lazy(() => import('@/features/liveclass/pages/LiveClassList'));
const LiveClassRoom = lazy(() => import('@/features/liveclass/pages/LiveClassRoom'));

// Institute
const BrandingSettings = lazy(() => import('@/features/institute/pages/BrandingSettings'));

// Test taking
const TestTaking = lazy(() => import('@/features/test/pages/TestTaking'));
const TestResult = lazy(() => import('@/features/test/pages/TestResult'));

// Parent Portal
const ParentDashboard = lazy(() => import('@/features/parent/pages/ParentDashboard'));
const ParentMessages = lazy(() => import('@/features/parent/pages/ParentMessages'));

const FullScreenLoader = () => (
  <div className="h-screen bg-slate-950 flex items-center justify-center">
    <div className="h-10 w-10 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
  </div>
);

let socket = null;

export default function App() {
  const dispatch = useDispatch();
  const { isAuthenticated, token, initialized } = useAuth();
  useBranding();

  useEffect(() => {
    if (token) {
      dispatch(getProfile());
    }
  }, [token, dispatch]);

  useEffect(() => {
    if (isAuthenticated && token) {
      const socketUrl = import.meta.env.VITE_SOCKET_URL || window.location.origin;
      socket = io(socketUrl, {
        auth: { token },
        transports: ['websocket', 'polling'],
      });

      socket.on('notification', (data) => {
        dispatch(addNotification(data));
        toast(data.message || data.title || 'New Notification', { icon: '🔔' });
      });

      return () => {
        if (socket) {
          socket.disconnect();
          socket = null;
        }
      };
    }
  }, [isAuthenticated, token, dispatch]);

  if (!initialized) {
    return <LoadingSpinner fullScreen />;
  }

  return (
    <>
      <ScrollManager />
      <Routes>
        {/* Auth Routes */}
        <Route element={<AuthLayout />}>
          <Route element={<FeatureBoundary />}>
            <Route
              path="/login"
              element={
                <GuestRoute>
                  <LoginPage />
                </GuestRoute>
              }
            />
            <Route
              path="/register"
              element={
                <GuestRoute>
                  <RegisterPage />
                </GuestRoute>
              }
            />
            <Route
              path="/forgot-password"
              element={
                <GuestRoute>
                  <ForgotPasswordPage />
                </GuestRoute>
              }
            />
            <Route
              path="/reset-password/:token"
              element={
                <GuestRoute>
                  <ResetPasswordPage />
                </GuestRoute>
              }
            />
            <Route path="/verify-email/:token" element={<VerifyEmailPage />} />
            <Route path="/auth/callback" element={<AuthCallbackPage />} />
          </Route>
        </Route>

        {/* Main Layout Routes */}
        <Route element={<MainLayout />}>
          {/* Public */}
          <Route element={<FeatureBoundary />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/courses" element={<CourseCatalog />} />
            <Route path="/courses/:id" element={<CourseDetail />} />
            <Route path="/tests" element={<TestSeriesCatalog />} />
            <Route path="/tests/:id" element={<TestDetail />} />
            <Route path="/test-series" element={<TestSeriesCatalog />} />
            <Route path="/test-series/:seriesSlug" element={<TestSeriesDetail />} />
            <Route path="/leaderboard" element={<LeaderboardPage />} />
            <Route path="/verify-certificate" element={<CertificateVerify />} />
            <Route path="/unauthorized" element={<UnauthorizedPage />} />
            <Route path="/blog" element={<BlogList />} />
            <Route path="/blog/:slug" element={<BlogDetail />} />
            <Route path="/jobs" element={<JobAlertList />} />
            <Route path="/pricing" element={<PricingPage />} />
            <Route path="/exams" element={<ExamsCatalog />} />
            <Route path="/exams/:slug" element={<ExamDetail />} />
            <Route path="/search" element={<SearchResultsPage />} />
            <Route path="/free-resources" element={<FreeResourcesPage />} />
            <Route path="/daily-quiz" element={<DailyQuizPage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/faculty" element={<FacultyPage />} />
            <Route path="/success-stories" element={<SuccessStoriesPage />} />
            <Route path="/help" element={<HelpCenterPage />} />
            <Route path="/legal/:type" element={<LegalPage />} />
          </Route>

          {/* Protected Student */}
          <Route element={<FeatureBoundary />}>
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <DashboardPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/my-courses"
              element={
                <ProtectedRoute>
                  <MyCourses />
                </ProtectedRoute>
              }
            />
            <Route
              path="/courses/:id/learn"
              element={
                <ProtectedRoute>
                  <CourseLearning />
                </ProtectedRoute>
              }
            />
            <Route
              path="/my-test-attempts"
              element={
                <ProtectedRoute>
                  <MyTestAttempts />
                </ProtectedRoute>
              }
            />
            <Route
              path="/quiz/:id"
              element={
                <ProtectedRoute>
                  <QuizPage />
                </ProtectedRoute>
              }
            />

            <Route
              path="/wishlist"
              element={
                <ProtectedRoute>
                  <Wishlist />
                </ProtectedRoute>
              }
            />
            <Route
              path="/checkout/:id"
              element={
                <ProtectedRoute>
                  <Checkout />
                </ProtectedRoute>
              }
            />
            <Route
              path="/checkout/success"
              element={
                <ProtectedRoute>
                  <CheckoutSuccess />
                </ProtectedRoute>
              }
            />
            <Route
              path="/orders"
              element={
                <ProtectedRoute>
                  <OrderHistory />
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              }
            />
            <Route
              path="/settings"
              element={
                <ProtectedRoute>
                  <ProfileSettingsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/notifications"
              element={
                <ProtectedRoute>
                  <NotificationsPage />
                </ProtectedRoute>
              }
            />
          </Route>

          {/* AI */}
          <Route element={<FeatureBoundary />}>
            <Route
              path="/ai/questions"
              element={
                <ProtectedRoute roles={['teacher', 'admin']}>
                  <AIQuestionGenerator />
                </ProtectedRoute>
              }
            />

            <Route
              path="/ai/quiz-generator"
              element={
                <ProtectedRoute roles={['teacher', 'admin']}>
                  <AIQuizGenerator />
                </ProtectedRoute>
              }
            />
          </Route>

          {/* Live Classes */}
          <Route element={<FeatureBoundary />}>
            <Route
              path="/live-classes"
              element={
                <ProtectedRoute>
                  <LiveClassList />
                </ProtectedRoute>
              }
            />
          </Route>

          {/* Parent Routes */}
          <Route element={<FeatureBoundary />}>
            <Route
              path="/parent"
              element={
                <ProtectedRoute roles={['parent', 'admin']}>
                  <ParentDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/messages"
              element={
                <ProtectedRoute roles={['parent', 'teacher', 'admin']}>
                  <ParentMessages />
                </ProtectedRoute>
              }
            />
          </Route>

          {/* Teacher Routes */}
          <Route element={<FeatureBoundary />}>
            <Route
              path="/teacher"
              element={
                <ProtectedRoute roles={['teacher', 'admin']}>
                  <TeacherLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<TeacherDashboard />} />
              <Route path="courses" element={<TeacherCourses />} />
              <Route path="courses/new" element={<TeacherCourseForm />} />
              <Route path="courses/:id/edit" element={<TeacherCourseForm />} />
              <Route path="tests" element={<TeacherTests />} />
              <Route path="tests/new" element={<TeacherTestForm />} />
              <Route path="tests/:id/edit" element={<TeacherTestForm />} />
              <Route path="tests/:id/analytics" element={<TeacherTestAnalytics />} />
              <Route path="quizzes" element={<TeacherQuizzes />} />
              <Route path="quizzes/new" element={<TeacherQuizForm />} />
              <Route path="quizzes/:id/edit" element={<TeacherQuizForm />} />
              <Route path="students" element={<TeacherStudents />} />
              <Route path="revenue" element={<TeacherRevenue />} />
              <Route path="discussions" element={<TeacherDiscussions />} />
              <Route path="attendance" element={<TeacherAttendance />} />
              <Route path="live-classes" element={<TeacherLiveClasses />} />
              <Route path="blogs" element={<TeacherBlogManagement />} />
            </Route>
          </Route>

          <Route element={<FeatureBoundary />}>
            <Route
              path="/tests/:id/result"
              element={
                <ProtectedRoute>
                  <TestResult />
                </ProtectedRoute>
              }
            />
          </Route>

          {/* 404 */}
          <Route path="*" element={<NotFoundPage />} />
        </Route>

        {/* Institute Branding */}
        <Route element={<FeatureBoundary />}>
          <Route
            path="/institute/branding"
            element={
              <ProtectedRoute roles={['admin', 'super_admin']}>
                <Suspense fallback={<FullScreenLoader />}>
                  <BrandingSettings />
                </Suspense>
              </ProtectedRoute>
            }
          />

          {/* Full-screen Live Class Room */}
          <Route
            path="/live-classes/:id/room"
            element={
              <ProtectedRoute>
                <Suspense fallback={<FullScreenLoader />}>
                  <LiveClassRoom />
                </Suspense>
              </ProtectedRoute>
            }
          />

          {/* Full-screen Test Taking */}
          <Route
            path="/tests/:id/take"
            element={
              <ProtectedRoute>
                <Suspense fallback={<FullScreenLoader />}>
                  <TestTaking />
                </Suspense>
              </ProtectedRoute>
            }
          />
        </Route>
      </Routes>
    </>
  );
}
// force recompile
