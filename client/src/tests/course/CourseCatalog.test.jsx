import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../helpers/renderWithProviders';
import CourseCatalog from '@/features/course/pages/CourseCatalog';
import { configureStore } from '@reduxjs/toolkit';
import courseReducer from '@/features/course/courseSlice';
import categoryReducer from '@/features/category/categorySlice';

// Mock data
const mockCategories = [
  { _id: 'cat-1', name: 'RAS', slug: 'ras' },
  { _id: 'cat-2', name: 'Patwari', slug: 'patwari' },
];

const mockCourses = [
  {
    _id: 'course-1',
    title: 'Target RAS Batch',
    price: 4999,
    rating: 4.5,
    enrollmentCount: 1000,
    thumbnail: '/course.jpg',
    teacher: { name: 'Dr. Sharma' },
  },
];

// Mock the API module
vi.mock('@/services/api', () => {
  const mockApi = {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  };
  return { default: mockApi };
});

import api from '@/services/api';
import { High } from 'react-icons/hi';

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({ isAuthenticated: false }),
}));

describe('CourseCatalog', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Default successful responses
    api.get.mockImplementation((url) => {
      if (url.includes('/categories')) {
        return Promise.resolve({ data: { data: mockCategories } });
      }
      if (url.includes('/courses')) {
        return Promise.resolve({ data: { data: { courses: mockCourses } } });
      }
      return Promise.resolve({ data: { data: [] } });
    });
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  const createTestStore = (preloadedState = {}) => {
    return configureStore({
      reducer: {
        courses: courseReducer,
        categories: categoryReducer,
      },
      preloadedState: {
        courses: {
          courses: [],
          loading: false,
          pagination: { page: 1, totalPages: 1, total: 0 },
          filters: { search: '', category: '', level: '', sort: 'newest' },
        },
        categories: {
          examCategories: [],
          loading: false,
          error: null,
        },
        ...preloadedState,
      },
    });
  };

  describe('COURSE-001: Page Load', () => {
    it('renders without errors', async () => {
      renderWithProviders(<CourseCatalog />, { store: createTestStore() });
      await waitFor(() => {
        expect(screen.getByText(/Explore Courses/i)).toBeInTheDocument();
      });
    });

    it('renders search bar', async () => {
      renderWithProviders(<CourseCatalog />, { store: createTestStore() });
      await waitFor(() => {
        expect(screen.getByPlaceholderText(/Search courses/i)).toBeInTheDocument();
      });
    });
  });

  describe('COURSE-002/003: Filter by Exam Category', () => {
    it('displays category filter options', async () => {
      const store = createTestStore({
        categories: {
          examCategories: [
            { _id: 'cat-1', name: 'RAS', slug: 'ras' },
            { _id: 'cat-2', name: 'Patwari', slug: 'patwari' },
          ],
          loading: false,
          error: null,
        },
      });

      renderWithProviders(<CourseCatalog />, { store });
      await waitFor(() => {
        expect(screen.getByText(/All Categories/i)).toBeInTheDocument();
        expect(screen.getByText(/RAS/i)).toBeInTheDocument();
        expect(screen.getByText(/Patwari/i)).toBeInTheDocument();
      });
    });

    it('allows filtering by category', async () => {
      const user = userEvent.setup({ delay: 100 });
      const store = createTestStore({
        categories: {
          examCategories: [
            { _id: 'cat-1', name: 'RAS', slug: 'ras' },
            { _id: 'cat-2', name: 'Patwari', slug: 'patwari' },
          ],
          loading: false,
          error: null,
        },
      });

      renderWithProviders(<CourseCatalog />, { store });
      await waitFor(() => {
        const categoryRadio = screen.getByRole('radio', { name: /RAS/i });
        user.click(categoryRadio);
      });
    });
  });

  describe('COURSE-004/005: Sort Functionality', () => {
    it('displays sort options', async () => {
      renderWithProviders(<CourseCatalog />, { store: createTestStore() });
      await waitFor(() => {
        expect(screen.getByText(/Newest/i)).toBeInTheDocument();
        expect(screen.getByText(/Price: Low to High/i)).toBeInTheDocument();
        expect(screen.getByText(/Price: High to Low/i)).toBeInTheDocument();
        expect(screen.getByText(/Highest Rated/i)).toBeInTheDocument();
        expect(screen.getByText(/Most Popular/i)).toBeInTheDocument();
      });
    });

    it('allows sorting by price low to high', async () => {
      const user = userEvent.setup({ delay: 100 });
      renderWithProviders(<CourseCatalog />, { store: createTestStore() });
      await waitFor(() => {
        const sortRadio = screen.getByRole('radio', { name: /Price: Low to High/i });
        user.click(sortRadio);
      });
    });
  });

  describe('COURSE-006: Search Functionality', () => {
    it('allows searching for courses', async () => {
      const user = userEvent.setup({ delay: 100 });
      renderWithProviders(<CourseCatalog />, { store: createTestStore() });
      await waitFor(() => {
        const searchInput = screen.getByPlaceholderText(/Search courses/i);
        user.type(searchInput, 'R');
        user.type(searchInput, 'A');
        user.type(searchInput, 'S');
        expect(searchInput).toHaveValue('RAS');
      });
    });
  });

  describe('COURSE-007: Course Card Display', () => {
    it('displays course grid with courses', async () => {
      const store = createTestStore({
        courses: {
          courses: [
            {
              _id: 'course-1',
              title: 'Target RAS Batch',
              price: 4999,
              rating: 4.5,
              enrollmentCount: 1000,
              thumbnail: '/course.jpg',
              teacher: { name: 'Dr. Sharma' },
            },
          ],
          loading: false,
          pagination: { page: 1, totalPages: 1, total: 1 },
          filters: { search: '', category: '', level: '', sort: 'newest' },
        },
      });

      renderWithProviders(<CourseCatalog />, { store });
      await waitFor(() => {
        expect(screen.getByText(/Target RAS Batch/i)).toBeInTheDocument();
        expect(screen.getByText(/₹4,999/i)).toBeInTheDocument();
        expect(screen.getByText(/Dr. Sharma/i)).toBeInTheDocument();
      });
    });
  });

  describe('COURSE-008: Navigation to Course Detail', () => {
    it('has link to course detail page', async () => {
      const store = createTestStore({
        courses: {
          courses: [
            {
              _id: 'course-1',
              title: 'Target RAS Batch',
              price: 4999,
              rating: 4.5,
              enrollmentCount: 1000,
              thumbnail: '/course.jpg',
              teacher: { name: 'Dr. Sharma' },
            },
          ],
          loading: false,
          pagination: { page: 1, totalPages: 1, total: 1 },
          filters: { search: '', category: '', level: '', sort: 'newest' },
        },
      });

      renderWithProviders(<CourseCatalog />, { store });
      await waitFor(() => {
        expect(screen.getByRole('link', { name: /Target RAS Batch/i })).toBeInTheDocument();
      });
    });
  });

  describe('Pagination', () => {
    it('displays pagination when multiple pages', async () => {
      const store = createTestStore({
        courses: {
          courses: Array.from({ length: 12 }, (_, i) => ({
            _id: `course-${i}`,
            title: `Course ${i}`,
            price: 1000,
          })),
          loading: false,
          pagination: { page: 1, totalPages: 2, total: 24 },
          filters: { search: '', category: '', level: '', sort: 'newest' },
        },
      });

      renderWithProviders(<CourseCatalog />, { store });
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /2/i })).toBeInTheDocument();
      });
    });
  });

  describe('Mobile Filter Toggle', () => {
    it('shows mobile filter button on small screens', async () => {
      renderWithProviders(<CourseCatalog />, { store: createTestStore() });
      await waitFor(() => {
        const filterButtons = screen.getAllByRole('button', { name: /Filters/i });
        expect(filterButtons.length).toBeGreaterThanOrEqual(1);
      });
    });
  });

  describe('Level Filter', () => {
    it('displays level filter options', async () => {
      renderWithProviders(<CourseCatalog />, { store: createTestStore() });
      await waitFor(() => {
        expect(screen.getByText(/All Levels/i)).toBeInTheDocument();
        expect(screen.getByText(/Beginner/i)).toBeInTheDocument();
        expect(screen.getByText(/Intermediate/i)).toBeInTheDocument();
        expect(screen.getByText(/Advanced/i)).toBeInTheDocument();
      });
    });
  });
});
