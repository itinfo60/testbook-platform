import { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { io } from 'socket.io-client';

// Auth & Store
import { useAuth } from '@/hooks/useAuth';
import { getProfile } from '@/features/auth/authSlice';
import { addNotification } from '@/features/notification/notificationSlice';

// Components
import LoadingSpinner from '@/components/common/LoadingSpinner';

// Layouts
import AuthLayout from '@/layouts/AuthLayout';
import MainLayout from '@/layouts/MainLayout';
import TeacherLayout from '@/features/teacher/pages/TeacherLayout';

// Route Guards
import ProtectedRoute from '@/components/ProtectedRoute';
import GuestRoute from '@/components/GuestRoute';

// Public Pages
import HomePage from '@/features/home/pages/HomePage';
import CourseCatalog from '@/features/course/pages/CourseCatalog';
import CourseDetail from '@/features/course/pages/CourseDetail';
import TestCatalog from '@/features/test/pages/TestCatalog';
import TestDetail from '@/features/test/pages/TestDetail';
import LeaderboardPage from '@/features/leaderboard/pages/LeaderboardPage';
import CertificateVerify from '@/features/auth/pages/verify/CertificateVerify';
import UnauthorizedPage from '@/features/auth/pages/UnauthorizedPage';
import BlogList from '@/features/blog/pages/BlogList';
import BlogDetail from '@/features/blog/pages/BlogDetail';


// Auth Pages
import LoginPage from '@/features/auth/pages/LoginPage';
import RegisterPage from '@/features/auth/pages/RegisterPage';
import ForgotPasswordPage from '@/features/auth/pages/ForgotPasswordPage';
import ResetPasswordPage from '@/features/auth/pages/ResetPasswordPage';
import AuthCallbackPage from '@/features/auth/pages/AuthCallbackPage';

// Student Protected Pages
import DashboardPage from '@/features/dashboard/pages/DashboardPage';
import MyCourses from '@/features/course/pages/MyCourses';
import CourseLearning from '@/features/course/pages/CourseLearning';
import MyTestAttempts from '@/features/test/pages/MyTestAttempts';
import QuizPage from '@/features/quiz/pages/QuizPage';
import AchievementsPage from '@/features/achievement/pages/AchievementsPage';
import Wishlist from '@/features/wishlist/pages/Wishlist';
import Checkout from '@/features/enrollment/pages/checkout/Checkout';
import CheckoutSuccess from '@/features/enrollment/pages/checkout/CheckoutSuccess';
import OrderHistory from '@/features/enrollment/pages/orders/OrderHistory';
import Profile from '@/features/auth/pages/profile/Profile';
import ProfileSettingsPage from '@/features/auth/pages/settings/ProfileSettingsPage';
import NotificationsPage from '@/features/notification/pages/NotificationsPage';

// Teacher Pages
import TeacherDashboard from '@/features/teacher/pages/TeacherDashboard';
import TeacherCourses from '@/features/course/pages/teacher/TeacherCourses';
import TeacherCourseForm from '@/features/course/pages/teacher/TeacherCourseForm';
import TeacherTests from '@/features/test/pages/teacher/TeacherTests';
import TeacherTestForm from '@/features/test/pages/teacher/TeacherTestForm';
import TeacherTestAnalytics from '@/features/test/pages/teacher/TeacherTestAnalytics';
import TeacherQuizzes from '@/features/quiz/pages/teacher/TeacherQuizzes';
import TeacherQuizForm from '@/features/quiz/pages/teacher/TeacherQuizForm';
import TeacherStudents from '@/features/teacher/pages/TeacherStudents';
import TeacherRevenue from '@/features/teacher/pages/TeacherRevenue';
import TeacherDiscussions from '@/features/teacher/pages/TeacherDiscussions';

// Misc
import NotFoundPage from '@/features/home/pages/NotFoundPage';
import TestTaking from '@/features/test/pages/TestTaking';
import TestResult from '@/features/test/pages/TestResult';

let socket = null;

export default function App() {
  const dispatch = useDispatch();
  const { isAuthenticated, token, initialized } = useAuth();

  // Load profile on mount if we have a token (to verify session & set initialized)
  useEffect(() => {
    if (token) {
      dispatch(getProfile());
    }
  }, [token, dispatch]);

  // Socket.IO connection
  useEffect(() => {
    if (isAuthenticated && token) {
      const socketUrl = import.meta.env.VITE_SOCKET_URL || window.location.origin;
      socket = io(socketUrl, {
        auth: { token },
        transports: ['websocket', 'polling'],
      });

      socket.on('connect', () => {
      });

      socket.on('notification', (data) => {
        dispatch(addNotification(data));
      });

      socket.on('disconnect', () => {
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
    <Routes>
      {/* Auth Routes */}
      <Route element={<AuthLayout />}>
        <Route path="/login" element={<GuestRoute><LoginPage /></GuestRoute>} />
        <Route path="/register" element={<GuestRoute><RegisterPage /></GuestRoute>} />
        <Route path="/forgot-password" element={<GuestRoute><ForgotPasswordPage /></GuestRoute>} />
        <Route path="/reset-password/:token" element={<GuestRoute><ResetPasswordPage /></GuestRoute>} />
        <Route path="/auth/callback" element={<AuthCallbackPage />} />
      </Route>

      {/* Main Layout Routes */}
      <Route element={<MainLayout />}>
        {/* Public Routes */}
        <Route path="/" element={<HomePage />} />
        <Route path="/courses" element={<CourseCatalog />} />
        <Route path="/courses/:id" element={<CourseDetail />} />
        <Route path="/tests" element={<TestCatalog />} />
        <Route path="/tests/:id" element={<TestDetail />} />
        <Route path="/leaderboard" element={<LeaderboardPage />} />

        <Route path="/verify-certificate" element={<CertificateVerify />} />
        <Route path="/unauthorized" element={<UnauthorizedPage />} />
        <Route path="/blog" element={<BlogList />} />
        <Route path="/blog/:slug" element={<BlogDetail />} />


        {/* Protected Student Routes */}
        <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
        <Route path="/my-courses" element={<ProtectedRoute><MyCourses /></ProtectedRoute>} />
        <Route path="/courses/:id/learn" element={<ProtectedRoute><CourseLearning /></ProtectedRoute>} />
        <Route path="/my-test-attempts" element={<ProtectedRoute><MyTestAttempts /></ProtectedRoute>} />
        <Route path="/quiz/:id" element={<ProtectedRoute><QuizPage /></ProtectedRoute>} />
        <Route path="/achievements" element={<ProtectedRoute><AchievementsPage /></ProtectedRoute>} />
        <Route path="/wishlist" element={<ProtectedRoute><Wishlist /></ProtectedRoute>} />
        <Route path="/checkout/:id" element={<ProtectedRoute><Checkout /></ProtectedRoute>} />
        <Route path="/checkout/success" element={<ProtectedRoute><CheckoutSuccess /></ProtectedRoute>} />
        <Route path="/orders" element={<ProtectedRoute><OrderHistory /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
        <Route path="/settings" element={<ProtectedRoute><ProfileSettingsPage /></ProtectedRoute>} />
        <Route path="/notifications" element={<ProtectedRoute><NotificationsPage /></ProtectedRoute>} />

        {/* Teacher Routes */}
        <Route path="/teacher" element={
          <ProtectedRoute roles={['teacher', 'admin']}>
            <TeacherLayout />
          </ProtectedRoute>
        }>
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
        </Route>

        {/* 404 */}
        <Route path="*" element={<NotFoundPage />} />
      </Route>

      {/* Full-screen Test Taking (no navbar/footer) */}
      <Route path="/tests/:id/take" element={
        <ProtectedRoute><TestTaking /></ProtectedRoute>
      } />
      <Route path="/tests/:id/result" element={
        <ProtectedRoute><TestResult /></ProtectedRoute>
      } />
    </Routes>
  );
}

