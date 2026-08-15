import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../helpers/renderWithProviders';
import EduPortalHome from '@/features/home/pages/EduPortalHome';

// Mock data
const mockExams = [
  {
    _id: 'exam-1',
    name: 'Patwari',
    slug: 'patwari',
    description: 'Patwari exam',
    icon: '📝',
    testCount: 5,
    courseCount: 3,
  },
  {
    _id: 'exam-2',
    name: 'RAS',
    slug: 'ras',
    description: 'RAS exam',
    icon: '🏛️',
    testCount: 10,
    courseCount: 5,
  },
];

const mockCourses = [
  {
    _id: 'course-1',
    title: 'Target Patwari Batch 2024',
    price: 4999,
    salePrice: 2499,
    rating: 4.5,
    enrolledCount: 5000,
    category: { name: 'Patwari' },
    features: ['Live Classes', 'Notes', 'Mock Tests'],
    badge: 'Best Seller',
    thumbnail: '/course.jpg',
    teacher: { name: 'Dr. Sharma' },
  },
];

const mockTestSeries = [
  {
    _id: 'ts-1',
    title: 'Patwari Mock Test Series',
    category: 'Patwari',
    description: '10 tests',
    price: 999,
    icon: '📝',
    totalTests: 10,
    testCount: 10,
  },
];

const mockResources = [
  {
    _id: 'res-1',
    title: 'Patwari Syllabus',
    description: 'Official syllabus',
    count: '10 PDFs',
    icon: '📚',
    fileUrl: '/patwari-syllabus.pdf',
  },
];

const mockBlogs = [
  {
    _id: 'blog-1',
    title: 'Patwari Preparation Strategy',
    excerpt: 'How to prepare',
    category: 'Patwari',
    type: 'article',
    publishedAt: '2024-01-15',
  },
  {
    _id: 'blog-2',
    title: 'Patwari Recruitment 2026',
    excerpt: 'New notification',
    category: 'Patwari',
    type: 'job_alert',
    publishedAt: '2024-02-01',
    jobAlert: { organization: 'RPSC', totalVacancies: 5000 },
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
  return {
    default: mockApi,
    examCategoryAPI: { getAll: mockApi.get },
    courseAPI: { getAll: mockApi.get },
    blogAPI: { getAll: mockApi.get },
    testAPI: { getAll: mockApi.get },
  };
});

import api from '@/services/api';

describe('EduPortalHome', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Default successful responses for all API calls
    api.get.mockImplementation((url = '') => {
      const urlStr = typeof url === 'string' ? url : String(url || '');
      if (urlStr.includes('/blogs') && urlStr.includes('job_alert')) {
        return Promise.resolve({
          data: { data: { blogs: mockBlogs.filter((b) => b.type === 'job_alert') } },
        });
      }
      if (urlStr.includes('/blogs') && urlStr.includes('article')) {
        return Promise.resolve({
          data: { data: { blogs: mockBlogs.filter((b) => b.type === 'article') } },
        });
      }
      if (urlStr.includes('/categories')) {
        return Promise.resolve({ data: { data: mockExams } });
      }
      if (urlStr.includes('/courses')) {
        return Promise.resolve({ data: { data: { courses: mockCourses } } });
      }
      if (urlStr.includes('/tests')) {
        return Promise.resolve({ data: { data: { tests: mockTestSeries } } });
      }
      if (urlStr.includes('/library')) {
        return Promise.resolve({ data: { data: { resources: mockResources } } });
      }
      return Promise.resolve({ data: { data: [] } });
    });
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('HOME-001: Page Load', () => {
    it('renders without errors', async () => {
      renderWithProviders(<EduPortalHome />);
      await waitFor(() => {
        // Check for hero section elements that should always render
        expect(screen.getByText(/Rajasthan's #1 Dedicated Portal/i)).toBeInTheDocument();
      });
    });
  });

  describe('HOME-002: Logo and Navigation', () => {
    it('displays brand title in hero section', async () => {
      renderWithProviders(<EduPortalHome />);
      await waitFor(() => {
        expect(screen.getByText(/Academy & Exam Portal/i)).toBeInTheDocument();
      });
    });

    it('has link to register page', async () => {
      renderWithProviders(<EduPortalHome />);
      await waitFor(() => {
        expect(screen.getByRole('link', { name: /Create Free Account/i })).toBeInTheDocument();
        expect(screen.getByRole('link', { name: /Student Login/i })).toBeInTheDocument();
      });
    });
  });

  describe('HOME-003/004: Search Functionality', () => {
    it('renders search input with placeholder', async () => {
      renderWithProviders(<EduPortalHome />);
      await waitFor(() => {
        expect(screen.getByPlaceholderText(/Search courses, exams/i)).toBeInTheDocument();
      });
    });

    it('allows typing in search input', async () => {
      const user = userEvent.setup();
      renderWithProviders(<EduPortalHome />);
      const searchInput = await screen.findByPlaceholderText(/Search courses, exams/i);
      await user.type(searchInput, 'RAS');
      expect(searchInput).toHaveValue('RAS');
    });

    it('HOME-005: shows popular search tags', async () => {
      renderWithProviders(<EduPortalHome />);
      await waitFor(() => {
        // Use specific button elements for popular searches
        expect(screen.getByRole('button', { name: /RPSC RAS/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /EO\/RO Part-B/i })).toBeInTheDocument();
        expect(
          screen.getByRole('button', { name: /Political Science Asst\. Professor/i })
        ).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /1st Grade Teacher/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Patwari/i })).toBeInTheDocument();
      });
    });
  });

  describe('HOME-007/008: Trending Alerts Ticker', () => {
    it('renders alerts ticker section', async () => {
      renderWithProviders(<EduPortalHome />);
      await waitFor(() => {
        expect(screen.getByText(/Job & Exam Alerts/i)).toBeInTheDocument();
      });
    });

    it('shows "All Alerts" link', async () => {
      renderWithProviders(<EduPortalHome />);
      await waitFor(() => {
        expect(screen.getByRole('link', { name: /All Alerts/i })).toBeInTheDocument();
      });
    });
  });

  describe('HOME-009: Free Resources Section', () => {
    it('renders Free Study Material Zone section', async () => {
      renderWithProviders(<EduPortalHome />);
      await waitFor(() => {
        expect(screen.getByText(/Free Study Material Zone/i)).toBeInTheDocument();
      });
    });

    it('has link to full free library', async () => {
      renderWithProviders(<EduPortalHome />);
      await waitFor(() => {
        expect(screen.getByRole('link', { name: /Open Full Free Library/i })).toBeInTheDocument();
      });
    });
  });

  describe('HOME-010/011: Top-Selling Courses Section', () => {
    it('renders Paid Courses section', async () => {
      renderWithProviders(<EduPortalHome />);
      await waitFor(() => {
        expect(screen.getByText(/Top Selling Premium Batches/i)).toBeInTheDocument();
        expect(screen.getByText(/Paid Target Batches & Handwritten Notes/i)).toBeInTheDocument();
      });
    });

    it('shows demo classes section', async () => {
      renderWithProviders(<EduPortalHome />);
      await waitFor(() => {
        expect(screen.getByText(/Demo Classes/i)).toBeInTheDocument();
        expect(screen.getByText(/Watch Sample Lectures Before Enrolling/i)).toBeInTheDocument();
      });
    });
  });

  describe('HOME-012: Responsive Layout', () => {
    it('renders stats highlights grid', async () => {
      renderWithProviders(<EduPortalHome />);
      await waitFor(() => {
        expect(screen.getByText(/Selected Candidates/i)).toBeInTheDocument();
        expect(screen.getByText(/Practice Questions/i)).toBeInTheDocument();
        expect(screen.getByText(/Free Study Materials/i)).toBeInTheDocument();
        expect(screen.getByText(/Active Aspirants/i)).toBeInTheDocument();
        // Use getAllByText for multiple matches
        const stats = screen.getAllByText(/25,000\+/i);
        expect(stats.length).toBeGreaterThanOrEqual(1);
      });
    });
  });

  describe('HOME-013: Data Consistency', () => {
    it('displays exam categories section', async () => {
      renderWithProviders(<EduPortalHome />);
      await waitFor(() => {
        expect(screen.getByText(/Targeted Exam Categories/i)).toBeInTheDocument();
      });
    });

    it('displays test series section', async () => {
      renderWithProviders(<EduPortalHome />);
      await waitFor(() => {
        expect(screen.getByText(/Proctored Online Test Series/i)).toBeInTheDocument();
      });
    });

    it('displays blog section', async () => {
      renderWithProviders(<EduPortalHome />);
      await waitFor(() => {
        expect(screen.getByText(/Latest Updates & Articles/i)).toBeInTheDocument();
      });
    });
  });

  describe('HOME-014: API Failure Handling', () => {
    it('handles API errors gracefully', async () => {
      api.get.mockRejectedValue(new Error('Network error'));

      renderWithProviders(<EduPortalHome />);
      await waitFor(() => {
        // Should still render the hero section even with API errors
        expect(screen.getByText(/Rajasthan's #1 Dedicated Portal/i)).toBeInTheDocument();
      });
    });

    it('shows empty states when no data', async () => {
      api.get.mockResolvedValue({ data: { data: [] } });

      renderWithProviders(<EduPortalHome />);
      await waitFor(() => {
        expect(screen.getByText(/Rajasthan's #1 Dedicated Portal/i)).toBeInTheDocument();
      });
    });
  });

  describe('CTA Section', () => {
    it('renders student dashboard CTA', async () => {
      renderWithProviders(<EduPortalHome />);
      await waitFor(() => {
        expect(screen.getByText(/Join.*Aspirants Today/i)).toBeInTheDocument();
        expect(screen.getByRole('link', { name: /Create Free Account/i })).toBeInTheDocument();
        expect(screen.getByRole('link', { name: /Student Login/i })).toBeInTheDocument();
      });
    });
  });
});
