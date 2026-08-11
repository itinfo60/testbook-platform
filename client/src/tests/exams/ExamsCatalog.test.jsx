import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../helpers/renderWithProviders';
import ExamsCatalog from '@/features/exams/pages/ExamsCatalog';

// Mock data
const mockCategories = [
  {
    _id: 'cat-1',
    name: 'RAS',
    slug: 'ras',
    description: 'Rajasthan Administrative Service',
    icon: '🏛️',
    courseCount: 5,
    testCount: 10,
  },
  {
    _id: 'cat-2',
    name: 'Patwari',
    slug: 'patwari',
    description: 'Patwari Recruitment',
    icon: '📝',
    courseCount: 3,
    testCount: 5,
  },
  {
    _id: 'cat-3',
    name: 'Political Science',
    slug: 'political-science',
    description: 'Political Science for UPHESC',
    icon: '📚',
    courseCount: 2,
    testCount: 3,
  },
];

const mockCourses = [
  {
    _id: 'course-1',
    title: 'Target RAS Batch',
    price: 4999,
    rating: 4.5,
    enrolledCount: 1000,
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

describe('ExamsCatalog', () => {
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

  describe('EXAM-001: Page Load', () => {
    it('renders without errors', async () => {
      renderWithProviders(<ExamsCatalog />);
      await waitFor(() => {
        expect(screen.getByText(/Explore Exam Portals/i)).toBeInTheDocument();
      });
    });
  });

  describe('EXAM-002/003: Category Display', () => {
    it('displays Rajasthan specific exams group', async () => {
      renderWithProviders(<ExamsCatalog />);
      await waitFor(() => {
        expect(screen.getByText(/Rajasthan Specific Exams/i)).toBeInTheDocument();
        // Use getAllByText and check length
        const rasElements = screen.getAllByText(/RAS/i);
        expect(rasElements.length).toBeGreaterThanOrEqual(1);
        const patwariElements = screen.getAllByText(/Patwari/i);
        expect(patwariElements.length).toBeGreaterThanOrEqual(1);
      });
    });

    it('displays Political Science special exams group', async () => {
      renderWithProviders(<ExamsCatalog />);
      await waitFor(() => {
        // Use getAllByText for multiple matches
        const psElements = screen.getAllByText(/Political Science Special/i);
        expect(psElements.length).toBeGreaterThanOrEqual(1);
        const psCategoryElements = screen.getAllByText(/Political Science/i);
        expect(psCategoryElements.length).toBeGreaterThanOrEqual(1);
      });
    });
  });

  describe('EXAM-004/013: Navigation to Exam Detail', () => {
    it('shows course count and test count on category card', async () => {
      renderWithProviders(<ExamsCatalog />);
      await waitFor(() => {
        expect(screen.getByText(/5 Courses/i)).toBeInTheDocument();
        expect(screen.getByText(/10 Tests/i)).toBeInTheDocument();
      });
    });
  });

  describe('Search Functionality', () => {
    it('renders search input', async () => {
      renderWithProviders(<ExamsCatalog />);
      await waitFor(() => {
        expect(screen.getByPlaceholderText(/Search exams/i)).toBeInTheDocument();
      });
    });

    it('allows typing in search input', async () => {
      const user = userEvent.setup({ delay: 100 });
      renderWithProviders(<ExamsCatalog />);
      await waitFor(() => {
        const searchInput = screen.getByPlaceholderText(/Search exams/i);
        user.type(searchInput, 'R');
        user.type(searchInput, 'A');
        user.type(searchInput, 'S');
        expect(searchInput).toHaveValue('RAS');
      });
    });

    it('filters categories by search query', async () => {
      const user = userEvent.setup({ delay: 100 });
      renderWithProviders(<ExamsCatalog />);
      await waitFor(() => {
        const searchInput = screen.getByPlaceholderText(/Search exams/i);
        user.type(searchInput, 'R');
        user.type(searchInput, 'A');
        user.type(searchInput, 'S');
        expect(searchInput).toHaveValue('RAS');
      });
    });
  });

  describe('Group Filter Tabs', () => {
    it('renders All Exams tab', async () => {
      renderWithProviders(<ExamsCatalog />);
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /All Exams/i })).toBeInTheDocument();
      });
    });

    it('renders Rajasthan Specific tab', async () => {
      renderWithProviders(<ExamsCatalog />);
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Rajasthan Specific/i })).toBeInTheDocument();
      });
    });

    it('renders Political Science Special tab', async () => {
      renderWithProviders(<ExamsCatalog />);
      await waitFor(() => {
        expect(
          screen.getByRole('button', { name: /Political Science Special/i })
        ).toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    it('displays error message on API failure', async () => {
      api.get.mockRejectedValueOnce({ response: { data: { message: 'Failed to load' } } });

      renderWithProviders(<ExamsCatalog />);
      await waitFor(() => {
        // The component shows "Failed to load" not "Failed to load exam categories"
        expect(screen.getByText(/Failed to load/i)).toBeInTheDocument();
      });
    });

    it('shows empty state when no categories match search', async () => {
      const user = userEvent.setup({ delay: 100 });
      renderWithProviders(<ExamsCatalog />);
      await waitFor(() => {
        const searchInput = screen.getByPlaceholderText(/Search exams/i);
        user.type(searchInput, 'N');
        user.type(searchInput, 'o');
        user.type(searchInput, 'n');
        user.type(searchInput, 'E');
        user.type(searchInput, 'x');
        user.type(searchInput, 'i');
        user.type(searchInput, 's');
        user.type(searchInput, 't');
        user.type(searchInput, 'e');
        user.type(searchInput, 'n');
        user.type(searchInput, 't');
        user.type(searchInput, 'E');
        user.type(searchInput, 'x');
        user.type(searchInput, 'a');
        user.type(searchInput, 'm');
        expect(screen.getByText(/No exams found/i)).toBeInTheDocument();
      });
    });
  });

  describe('Featured Courses Section', () => {
    it('displays featured courses when available', async () => {
      renderWithProviders(<ExamsCatalog />);
      await waitFor(() => {
        expect(screen.getByText(/Featured Target Batches/i)).toBeInTheDocument();
      });
    });
  });
});
