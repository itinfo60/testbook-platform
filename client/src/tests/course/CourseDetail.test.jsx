import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../helpers/renderWithProviders';
import CourseDetail from '@/features/course/pages/CourseDetail';
import { configureStore } from '@reduxjs/toolkit';
import courseReducer from '@/features/course/courseSlice';
import reviewReducer from '@/features/review/reviewSlice';
import wishlistReducer from '@/features/wishlist/wishlistSlice';
import authReducer from '@/features/auth/authSlice';

// Mock data
const mockCourse = {
  _id: 'course-1',
  title: 'Target Patwari Batch 2024',
  description: 'Complete Patwari preparation',
  price: 4999,
  effectivePrice: 2499,
  discountPrice: 2499,
  category: { name: 'Patwari' },
  level: 'beginner',
  language: 'Hindi & English',
  teacher: { name: 'Dr. Sharma', bio: 'Expert faculty' },
  enrollmentCount: 5000,
  averageRating: 4.5,
  totalReviews: 120,
  totalLessons: 50,
  totalDuration: 3600,
  sections: [
    {
      title: 'Module 1',
      lessons: [
        { title: 'Lesson 1', isFree: true },
        { title: 'Lesson 2', isFree: false },
      ],
    },
  ],
  whatYouLearn: ['Syllabus coverage', 'Mock tests', 'Notes'],
  requirements: ['Graduation'],
  thumbnail: '/course.jpg',
};

// Mock the API module
vi.mock('@/services/api', () => {
  const mockApi = {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  };
  return {
    default: mockApi,
    enrollmentAPI: {
      checkEnrollment: vi.fn().mockResolvedValue({ data: { data: { isEnrolled: false } } }),
    },
  };
});

import api from '@/services/api';

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({ isAuthenticated: true }),
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useParams: vi.fn(() => ({ id: 'course-1' })),
    useNavigate: () => vi.fn(),
  };
});

describe('CourseDetail', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  const createTestStore = (preloadedState = {}) => {
    return configureStore({
      reducer: {
        courses: courseReducer,
        reviews: reviewReducer,
        wishlist: wishlistReducer,
        auth: authReducer,
      },
      preloadedState: {
        courses: {
          currentCourse: null,
          loading: false,
        },
        reviews: {
          reviews: [],
        },
        wishlist: {
          wishlistMap: {},
        },
        auth: {
          isAuthenticated: true,
        },
        ...preloadedState,
      },
    });
  };

  describe('COURSE-DETAIL-001: Page Load', () => {
    it('renders course detail page', async () => {
      const store = createTestStore({
        courses: {
          currentCourse: mockCourse,
          loading: false,
        },
      });

      renderWithProviders(<CourseDetail />, { store });
      await waitFor(() => {
        expect(screen.getByText(/Target Patwari Batch 2024/i)).toBeInTheDocument();
      });
    });
  });

  describe('COURSE-DETAIL-002: Exam Mapping', () => {
    it('displays exam category', async () => {
      const store = createTestStore({
        courses: {
          currentCourse: mockCourse,
          loading: false,
        },
      });

      renderWithProviders(<CourseDetail />, { store });
      await waitFor(() => {
        expect(screen.getAllByText(/Patwari/i).length).toBeGreaterThanOrEqual(1);
      });
    });
  });

  describe('COURSE-DETAIL-003: Faculty Display', () => {
    it('displays instructor name', async () => {
      const store = createTestStore({
        courses: {
          currentCourse: mockCourse,
          loading: false,
        },
      });

      renderWithProviders(<CourseDetail />, { store });
      await waitFor(() => {
        expect(screen.getByText(/Dr. Sharma/i)).toBeInTheDocument();
      });
    });
  });

  describe('COURSE-DETAIL-004: Curriculum Display', () => {
    it('displays course curriculum with sections and lessons', async () => {
      const user = userEvent.setup();
      const store = createTestStore({
        courses: {
          currentCourse: mockCourse,
          loading: false,
        },
      });

      renderWithProviders(<CourseDetail />, { store });
      const curriculumTab = await screen.findByRole('button', { name: /Curriculum/i });
      await user.click(curriculumTab);
      await waitFor(() => {
        expect(screen.getByText(/General Knowledge/i)).toBeInTheDocument();
        expect(screen.getByText(/Lesson 1/i)).toBeInTheDocument();
      });
    });
  });

  describe('COURSE-DETAIL-005/006: Pricing Display', () => {
    it('displays original price and discounted price', async () => {
      const store = createTestStore({
        courses: {
          currentCourse: mockCourse,
          loading: false,
        },
      });

      renderWithProviders(<CourseDetail />, { store });
      await waitFor(() => {
        expect(screen.getByText(/2,499/)).toBeInTheDocument();
        expect(screen.getByText(/4,999/)).toBeInTheDocument();
      });
    });

    it('shows limited time offer badge', async () => {
      const store = createTestStore({
        courses: {
          currentCourse: mockCourse,
          loading: false,
        },
      });

      renderWithProviders(<CourseDetail />, { store });
      await waitFor(() => {
        expect(screen.getByText(/Limited Time Offer/i)).toBeInTheDocument();
      });
    });
  });

  describe('COURSE-DETAIL-007: Demo Class Access', () => {
    it('shows free lessons marked as Demo Class', async () => {
      const user = userEvent.setup();
      const store = createTestStore({
        courses: {
          currentCourse: mockCourse,
          loading: false,
        },
      });

      renderWithProviders(<CourseDetail />, { store });
      const curriculumTab = await screen.findByRole('button', { name: /Curriculum/i });
      await user.click(curriculumTab);
      await waitFor(() => {
        expect(screen.getByText(/Demo Class/i)).toBeInTheDocument();
      });
    });
  });

  describe('COURSE-DETAIL-009: Notes Display', () => {
    it('displays downloadable notes in features', async () => {
      const store = createTestStore({
        courses: {
          currentCourse: mockCourse,
          loading: false,
        },
      });

      renderWithProviders(<CourseDetail />, { store });
      await waitFor(() => {
        expect(screen.getByText(/Downloadable PDFs & Notes/i)).toBeInTheDocument();
      });
    });
  });

  describe('COURSE-DETAIL-010: Reviews Display', () => {
    it('displays reviews tab with review count', async () => {
      const user = userEvent.setup();
      const store = createTestStore({
        courses: {
          currentCourse: mockCourse,
          loading: false,
        },
        reviews: {
          reviews: [
            {
              _id: 'r1',
              user: { name: 'Student 1' },
              rating: 5,
              comment: 'Excellent course!',
              createdAt: '2024-01-01',
            },
          ],
        },
      });

      renderWithProviders(<CourseDetail />, { store });
      const reviewsTab = await screen.findByRole('button', { name: /^Reviews/i });
      await user.click(reviewsTab);
      await waitFor(() => {
        expect(screen.getByText(/Excellent course!/i)).toBeInTheDocument();
      });
    });

    it('shows empty state when no reviews', async () => {
      const user = userEvent.setup();
      const store = createTestStore({
        courses: {
          currentCourse: { ...mockCourse, averageRating: 0, totalReviews: 0 },
          loading: false,
        },
        reviews: {
          reviews: [],
        },
      });

      renderWithProviders(<CourseDetail />, { store });
      const reviewsTab = await screen.findByRole('button', { name: /^Reviews/i });
      await user.click(reviewsTab);
      await waitFor(() => {
        expect(screen.getByText(/No reviews yet/i)).toBeInTheDocument();
      });
    });
  });

  describe('COURSE-DETAIL-011: FAQ Accordion', () => {
    it('displays what you learn section', async () => {
      const store = createTestStore({
        courses: {
          currentCourse: mockCourse,
          loading: false,
        },
      });

      renderWithProviders(<CourseDetail />, { store });
      await waitFor(() => {
        expect(screen.getByText(/What You'll Learn/i)).toBeInTheDocument();
        expect(screen.getByText(/Syllabus coverage/i)).toBeInTheDocument();
        expect(screen.getByText(/Requirements/i)).toBeInTheDocument();
      });
    });
  });

  describe('COURSE-DETAIL-012: Buy Course Flow', () => {
    it('shows Buy Course Now button for paid course', async () => {
      const store = createTestStore({
        courses: {
          currentCourse: mockCourse,
          loading: false,
        },
      });

      renderWithProviders(<CourseDetail />, { store });
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Buy Course Now/i })).toBeInTheDocument();
      });
    });

    it('shows Enroll for Free button for free course', async () => {
      const store = createTestStore({
        courses: {
          currentCourse: { ...mockCourse, price: 0, effectivePrice: 0, discountPrice: 0 },
          loading: false,
        },
      });

      renderWithProviders(<CourseDetail />, { store });
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Enroll for Free/i })).toBeInTheDocument();
      });
    });
  });

  describe('Wishlist Functionality', () => {
    it('shows Add to Wishlist button', async () => {
      const store = createTestStore({
        courses: {
          currentCourse: mockCourse,
          loading: false,
        },
        wishlist: {
          wishlistMap: { 'course-1': false },
        },
      });

      renderWithProviders(<CourseDetail />, { store });
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Add to Wishlist/i })).toBeInTheDocument();
      });
    });

    it('shows Wishlisted when already in wishlist', async () => {
      const store = createTestStore({
        courses: {
          currentCourse: mockCourse,
          loading: false,
        },
        wishlist: {
          wishlistMap: { 'course-1': true },
        },
      });

      renderWithProviders(<CourseDetail />, { store });
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Wishlisted/i })).toBeInTheDocument();
      });
    });
  });
});
