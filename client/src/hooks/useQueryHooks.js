import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { courseAPI, testAPI, enrollmentAPI, notificationAPI, liveClassAPI } from '@/services/api';
import toast from 'react-hot-toast';

// ===== Query Keys =====
export const queryKeys = {
  courses: (params) => ['courses', params],
  course: (id) => ['course', id],
  myCourses: ['my-courses'],
  tests: (params) => ['tests', params],
  test: (id) => ['test', id],
  enrollment: (courseId) => ['enrollment', courseId],
  myEnrollments: ['my-enrollments'],
  profile: ['profile'],
  notifications: ['notifications'],
  unreadCount: ['unread-count'],
  liveClasses: (params) => ['live-classes', params],
  liveClass: (id) => ['live-class', id],
  leaderboard: (params) => ['leaderboard', params],
  wishlist: ['wishlist'],
  myOrders: ['my-orders'],
  aiUsage: ['ai-usage'],
};

// ===== Courses =====
export const useCourses = (params) =>
  useQuery({
    queryKey: queryKeys.courses(params),
    queryFn: () => courseAPI.getAll(params).then((r) => r.data),
    staleTime: 5 * 60 * 1000,
  });

export const useCourse = (id) =>
  useQuery({
    queryKey: queryKeys.course(id),
    queryFn: () => courseAPI.getById(id).then((r) => r.data),
    enabled: !!id,
    staleTime: 3 * 60 * 1000,
  });

export const useMyCourses = () =>
  useQuery({
    queryKey: queryKeys.myCourses,
    queryFn: () => enrollmentAPI.getMyEnrollments().then((r) => r.data),
    staleTime: 2 * 60 * 1000,
  });

export const useEnrollmentCheck = (courseId) =>
  useQuery({
    queryKey: queryKeys.enrollment(courseId),
    queryFn: () => enrollmentAPI.checkEnrollment(courseId).then((r) => r.data),
    enabled: !!courseId,
    staleTime: 5 * 60 * 1000,
  });

// ===== Tests =====
export const useTests = (params) =>
  useQuery({
    queryKey: queryKeys.tests(params),
    queryFn: () => testAPI.getAll(params).then((r) => r.data),
    staleTime: 5 * 60 * 1000,
  });

export const useTest = (id) =>
  useQuery({
    queryKey: queryKeys.test(id),
    queryFn: () => testAPI.getById(id).then((r) => r.data),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });

// ===== Notifications =====
export const useNotifications = () =>
  useQuery({
    queryKey: queryKeys.notifications,
    queryFn: () => notificationAPI.getAll().then((r) => r.data),
    staleTime: 60 * 1000,
    refetchInterval: 60 * 1000, // poll every minute
  });

export const useUnreadCount = () =>
  useQuery({
    queryKey: queryKeys.unreadCount,
    queryFn: () => notificationAPI.getUnreadCount().then((r) => r.data),
    staleTime: 30 * 1000,
    refetchInterval: 30 * 1000,
  });

// ===== Live Classes =====
export const useLiveClasses = (params) =>
  useQuery({
    queryKey: queryKeys.liveClasses(params),
    queryFn: () => liveClassAPI.getUpcoming(params).then((r) => r.data),
    staleTime: 2 * 60 * 1000,
  });

// ===== Mutations =====
export const useEnrollMutation = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (courseId) => enrollmentAPI.enroll({ courseId }),
    onSuccess: (_, courseId) => {
      qc.invalidateQueries({ queryKey: queryKeys.enrollment(courseId) });
      qc.invalidateQueries({ queryKey: queryKeys.myCourses });
      toast.success('Enrolled successfully!');
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Enrollment failed');
    },
  });
};

export const useMarkNotificationRead = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => notificationAPI.markAsRead(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.notifications });
      qc.invalidateQueries({ queryKey: queryKeys.unreadCount });
    },
  });
};
