import { vi } from 'vitest';
import {
  mockExams,
  mockCourses,
  mockTestSeries,
  mockTests,
  mockResources,
  mockBlogs,
  mockUsers,
  mockAuthTokens,
  mockEnrollment,
  mockTestAttempt,
} from './testData';

export function createMockApi() {
  const mockGet = vi.fn();
  const mockPost = vi.fn();
  const mockPut = vi.fn();
  const mockPatch = vi.fn();
  const mockDelete = vi.fn();

  const mockApi = {
    get: mockGet,
    post: mockPost,
    put: mockPut,
    patch: mockPatch,
    delete: mockDelete,
    defaults: { baseURL: '/api/v1' },
    interceptors: {
      request: { use: vi.fn(), eject: vi.fn() },
      response: { use: vi.fn(), eject: vi.fn() },
    },
  };

  return { mockApi, mockGet, mockPost, mockPut, mockPatch, mockDelete };
}

export function setupApiMocks({ mockGet, mockPost, mockPut, mockPatch, mockDelete }) {
  // Exam endpoints
  mockGet.mockImplementation((url) => {
    if (url === '/exams' || url === '/api/v1/exams') {
      return Promise.resolve({ data: { success: true, data: mockExams } });
    }
    if (url?.includes('/exams/') && !url.includes('/exams/patwari')) {
      const slug = url.split('/exams/')[1];
      const exam = mockExams.find((e) => e.slug === slug);
      return Promise.resolve({ data: { success: true, data: exam } });
    }
    if (url === '/exams/patwari' || url === '/api/v1/exams/patwari') {
      return Promise.resolve({
        data: {
          success: true,
          data: {
            ...mockExams[0],
            courses: mockCourses.filter((c) => c.examCategory === 'exam-1'),
            testSeries: mockTestSeries.filter((t) => t.examCategory === 'exam-1'),
            resources: mockResources.filter((r) => r.examCategory === 'exam-1'),
            blogs: mockBlogs.filter((b) => b.examCategory === 'exam-1' && b.type === 'article'),
            jobAlerts: mockBlogs.filter(
              (b) => b.examCategory === 'exam-1' && b.type === 'job_alert'
            ),
          },
        },
      });
    }
    if (url === '/courses' || url === '/api/v1/courses') {
      return Promise.resolve({
        data: {
          success: true,
          data: mockCourses,
          pagination: { page: 1, limit: 10, total: mockCourses.length },
        },
      });
    }
    if (url?.includes('/courses/')) {
      const id = url.split('/courses/')[1];
      const course = mockCourses.find((c) => c._id === id || c.slug === id);
      return Promise.resolve({ data: { success: true, data: course } });
    }
    if (url === '/test-series' || url === '/api/v1/test-series') {
      return Promise.resolve({ data: { success: true, data: mockTestSeries } });
    }
    if (url?.includes('/test-series/')) {
      const id = url.split('/test-series/')[1];
      const series = mockTestSeries.find((t) => t._id === id);
      return Promise.resolve({ data: { success: true, data: series } });
    }
    if (url === '/tests' || url === '/api/v1/tests') {
      return Promise.resolve({ data: { success: true, data: mockTests } });
    }
    if (url?.includes('/tests/')) {
      const id = url.split('/tests/')[1];
      const test = mockTests.find((t) => t._id === id);
      return Promise.resolve({ data: { success: true, data: test } });
    }
    if (url === '/resources' || url === '/api/v1/resources') {
      return Promise.resolve({ data: { success: true, data: mockResources } });
    }
    if (url?.includes('/resources/')) {
      const id = url.split('/resources/')[1];
      const resource = mockResources.find((r) => r._id === id);
      return Promise.resolve({ data: { success: true, data: resource } });
    }
    if (url === '/blogs' || url === '/api/v1/blogs') {
      return Promise.resolve({ data: { success: true, data: mockBlogs } });
    }
    if (url?.includes('/blogs/')) {
      const id = url.split('/blogs/')[1];
      const blog = mockBlogs.find((b) => b._id === id);
      return Promise.resolve({ data: { success: true, data: blog } });
    }
    if (url === '/auth/me' || url === '/api/v1/auth/me') {
      return Promise.resolve({ data: { success: true, data: mockUsers.student } });
    }
    if (url === '/enrollments/my' || url === '/api/v1/enrollments/my') {
      return Promise.resolve({ data: { success: true, data: [mockEnrollment] } });
    }
    if (url?.includes('/enrollments/')) {
      return Promise.resolve({ data: { success: true, data: mockEnrollment } });
    }
    if (url === '/test-attempts/my' || url === '/api/v1/test-attempts/my') {
      return Promise.resolve({ data: { success: true, data: [mockTestAttempt] } });
    }
    if (url?.includes('/test-attempts/')) {
      return Promise.resolve({ data: { success: true, data: mockTestAttempt } });
    }
    if (url === '/payments/create-order' || url === '/api/v1/payments/create-order') {
      return Promise.resolve({
        data: { success: true, data: { orderId: 'order-1', amount: 4999 } },
      });
    }
    if (url === '/leaderboard' || url === '/api/v1/leaderboard') {
      return Promise.resolve({ data: { success: true, data: { leaderboard: [] } } });
    }
    if (url === '/free-resources' || url === '/api/v1/free-resources') {
      return Promise.resolve({
        data: { success: true, data: mockResources.filter((r) => r.isFree) },
      });
    }
    if (url === '/current-affairs' || url === '/api/v1/current-affairs') {
      return Promise.resolve({ data: { success: true, data: [] } });
    }
    if (url === '/quiz/daily' || url === '/api/v1/quiz/daily') {
      return Promise.resolve({ data: { success: true, data: { questions: [] } } });
    }

    return Promise.reject({ response: { status: 404, data: { message: 'Not found' } } });
  });

  mockPost.mockImplementation((url, data) => {
    if (url === '/auth/login' || url === '/api/v1/auth/login') {
      const { email } = data;
      if (email === 'arjun@student.com')
        return Promise.resolve({
          data: {
            success: true,
            data: { user: mockUsers.student, tokens: { accessToken: mockAuthTokens.student } },
          },
        });
      if (email === 'teacher@civicshub.com')
        return Promise.resolve({
          data: {
            success: true,
            data: { user: mockUsers.teacher, tokens: { accessToken: mockAuthTokens.teacher } },
          },
        });
      if (email === 'admin@civicshub.com')
        return Promise.resolve({
          data: {
            success: true,
            data: { user: mockUsers.admin, tokens: { accessToken: mockAuthTokens.admin } },
          },
        });
      return Promise.reject({
        response: { status: 401, data: { message: 'Invalid credentials' } },
      });
    }
    if (url === '/auth/register' || url === '/api/v1/auth/register') {
      return Promise.resolve({
        data: {
          success: true,
          data: {
            user: { ...mockUsers.student, email: data.email },
            tokens: { accessToken: mockAuthTokens.student },
          },
        },
      });
    }
    if (url === '/enrollments' || url === '/api/v1/enrollments') {
      return Promise.resolve({
        data: { success: true, data: { ...mockEnrollment, course: data.courseId } },
      });
    }
    if (url === '/test-attempts' || url === '/api/v1/test-attempts') {
      return Promise.resolve({
        data: { success: true, data: { ...mockTestAttempt, test: data.testId } },
      });
    }
    if (url?.includes('/test-attempts/') && url.includes('/submit')) {
      return Promise.resolve({ data: { success: true, data: { ...mockTestAttempt, score: 120 } } });
    }
    if (url === '/payments/verify' || url === '/api/v1/payments/verify') {
      return Promise.resolve({ data: { success: true, data: { enrollment: mockEnrollment } } });
    }
    if (url === '/auth/forgot-password' || url === '/api/v1/auth/forgot-password') {
      return Promise.resolve({ data: { success: true, message: 'OTP sent' } });
    }
    if (url === '/auth/verify-otp' || url === '/api/v1/auth/verify-otp') {
      return Promise.resolve({ data: { success: true, message: 'OTP verified' } });
    }

    return Promise.reject({ response: { status: 404, data: { message: 'Not found' } } });
  });

  mockPut.mockImplementation((url) => {
    if (url?.includes('/enrollments/progress/')) {
      return Promise.resolve({
        data: { success: true, data: { ...mockEnrollment, progressPercentage: 50 } },
      });
    }
    return Promise.reject({ response: { status: 404, data: { message: 'Not found' } } });
  });

  mockPatch.mockImplementation((url) => {
    if (url?.includes('/courses/') && url.includes('/featured')) {
      return Promise.resolve({
        data: { success: true, data: { ...mockCourses[0], isFeatured: true } },
      });
    }
    return Promise.reject({ response: { status: 404, data: { message: 'Not found' } } });
  });

  mockDelete.mockImplementation((url) => {
    if (url?.includes('/bookmarks/')) {
      return Promise.resolve({ data: { success: true, message: 'Removed' } });
    }
    return Promise.reject({ response: { status: 404, data: { message: 'Not found' } } });
  });
}

export function mockApiError({ mockGet, mockPost, status = 500, message = 'Server error' }) {
  mockGet.mockRejectedValue({ response: { status, data: { message } } });
  mockPost.mockRejectedValue({ response: { status, data: { message } } });
}

export function mockAuthFailure({ mockGet, mockPost }) {
  mockGet.mockRejectedValue({ response: { status: 401, data: { message: 'Unauthorized' } } });
  mockPost.mockRejectedValue({ response: { status: 401, data: { message: 'Unauthorized' } } });
}

export function mockForbidden({ mockGet, mockPost }) {
  mockGet.mockRejectedValue({ response: { status: 403, data: { message: 'Forbidden' } } });
  mockPost.mockRejectedValue({ response: { status: 403, data: { message: 'Forbidden' } } });
}
