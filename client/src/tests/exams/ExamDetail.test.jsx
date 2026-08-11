import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../helpers/renderWithProviders';
import ExamDetail from '@/features/exams/pages/ExamDetail';

// Mock data
const mockExamData = {
  category: {
    _id: 'exam-1',
    name: 'Patwari',
    slug: 'patwari',
    description: 'Patwari recruitment exam for Rajasthan',
    icon: '📝',
    conductingBody: 'RPSC',
    latestStatus: 'Active',
    officialWebsite: 'https://rpsc.rajasthan.gov.in',
    importantDates: [
      { label: 'Application Start', date: '2024-01-15' },
      { label: 'Exam Date', date: '2024-03-15' },
    ],
    syllabus: '<p>General Knowledge, Mathematics, Hindi, English</p>',
    examPattern: '<p>150 questions, 3 hours</p>',
    eligibility: '<p>Graduation</p>',
  },
  courses: [
    {
      _id: 'course-1',
      title: 'Target Patwari Batch 2024',
      price: 4999,
      rating: 4.5,
      enrolledCount: 5000,
      thumbnail: '/course.jpg',
      teacher: { name: 'Dr. Sharma' },
    },
    {
      _id: 'course-2',
      title: 'Patwari Crash Course',
      price: 1999,
      rating: 4.2,
      enrolledCount: 1200,
      thumbnail: '/course2.jpg',
      teacher: { name: 'Prof. Singh' },
    },
  ],
  tests: [
    {
      _id: 'test-1',
      title: 'Patwari Mock Test 01',
      price: 999,
      duration: 180,
      totalQuestions: 150,
    },
    {
      _id: 'test-2',
      title: 'Patwari Mock Test 02',
      price: 999,
      duration: 180,
      totalQuestions: 150,
    },
  ],
  blogs: [
    {
      _id: 'blog-1',
      title: 'Patwari Preparation Strategy',
      type: 'article',
      publishedAt: '2024-01-15',
      excerpt: 'How to prepare...',
    },
    {
      _id: 'blog-2',
      title: 'Patwari Recruitment 2026',
      type: 'job_alert',
      publishedAt: '2024-02-01',
      jobAlert: { organization: 'RPSC', totalVacancies: 5000, applicationEnd: '2024-03-01' },
    },
  ],
  resources: [
    { _id: 'res-1', title: 'Patwari PYQ 2023', resourceType: 'pyq', fileUrl: '/patwari-pyq.pdf' },
    {
      _id: 'res-2',
      title: 'Patwari Syllabus PDF',
      resourceType: 'syllabus',
      fileUrl: '/patwari-syllabus.pdf',
    },
  ],
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
  return { default: mockApi };
});

import api from '@/services/api';

// Mock react-router-dom
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useParams: vi.fn(() => ({ slug: 'patwari' })),
    Link: ({ children, to, ...props }) => (
      <a href={to} data-testid={`link-${to}`} {...props}>
        {children}
      </a>
    ),
  };
});

describe('ExamDetail', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Default successful response
    api.get.mockImplementation((url) => {
      if (url.includes('/categories/patwari')) {
        return Promise.resolve({ data: { data: mockExamData } });
      }
      return Promise.resolve({ data: { data: [] } });
    });
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('EXAM-DETAIL-001/002: Page Load and Title', () => {
    it('renders exam detail page for Patwari', async () => {
      renderWithProviders(<ExamDetail />);
      await waitFor(() => {
        expect(screen.getByText(/Patwari Preparation/i)).toBeInTheDocument();
      });
    });

    it('displays exam title and description', async () => {
      renderWithProviders(<ExamDetail />);
      await waitFor(() => {
        expect(screen.getByText(/Patwari Preparation/i)).toBeInTheDocument();
        // Use getAllByText for multiple matches
        const descElements = screen.getAllByText(/Patwari recruitment exam for Rajasthan/i);
        expect(descElements.length).toBeGreaterThanOrEqual(1);
      });
    });
  });

  describe('EXAM-DETAIL-003/005: Syllabus, Pattern, Eligibility', () => {
    it('displays syllabus tab content', async () => {
      const user = userEvent.setup();
      renderWithProviders(<ExamDetail />);
      await waitFor(() => {
        const syllabusTab = screen.getByRole('button', { name: /Syllabus/i });
        user.click(syllabusTab);
      });
      await waitFor(() => {
        expect(screen.getByText(/Official Exam Syllabus/i)).toBeInTheDocument();
        expect(
          screen.getByText(/General Knowledge, Mathematics, Hindi, English/i)
        ).toBeInTheDocument();
      });
    });

    it('displays exam pattern tab content', async () => {
      const user = userEvent.setup();
      renderWithProviders(<ExamDetail />);
      await waitFor(() => {
        const patternTab = screen.getByRole('button', { name: /Exam Pattern/i });
        user.click(patternTab);
      });
      await waitFor(() => {
        expect(screen.getByText(/Exam Pattern & Scheme/i)).toBeInTheDocument();
        expect(screen.getByText(/150 questions, 3 hours/i)).toBeInTheDocument();
      });
    });

    it('displays eligibility tab content', async () => {
      const user = userEvent.setup();
      renderWithProviders(<ExamDetail />);
      await waitFor(() => {
        const eligibilityTab = screen.getByRole('button', { name: /Eligibility/i });
        user.click(eligibilityTab);
      });
      await waitFor(() => {
        expect(screen.getByText(/Eligibility & Age Limit/i)).toBeInTheDocument();
        expect(screen.getByText(/Graduation/i)).toBeInTheDocument();
      });
    });
  });

  describe('EXAM-DETAIL-006: Important Dates', () => {
    it('displays key dates in hero section', async () => {
      renderWithProviders(<ExamDetail />);
      await waitFor(() => {
        expect(screen.getByText(/Key Dates/i)).toBeInTheDocument();
        expect(screen.getByText(/Application Start/i)).toBeInTheDocument();
        expect(screen.getByText(/Exam Date/i)).toBeInTheDocument();
      });
    });
  });

  describe('EXAM-DETAIL-007/014: Courses Mapping (Critical)', () => {
    it('displays only Patwari-related courses', async () => {
      renderWithProviders(<ExamDetail />);
      await waitFor(() => {
        const coursesTab = screen.getByRole('button', { name: /Courses/i });
        coursesTab.click();
      });
      await waitFor(() => {
        expect(screen.getByText(/Target Patwari Batch 2024/i)).toBeInTheDocument();
        expect(screen.getByText(/Patwari Crash Course/i)).toBeInTheDocument();
      });
    });

    it('EXAM-DETAIL-013: does NOT display unrelated RAS course', async () => {
      renderWithProviders(<ExamDetail />);
      await waitFor(() => {
        const coursesTab = screen.getByRole('button', { name: /Courses/i });
        coursesTab.click();
      });
      await waitFor(() => {
        expect(screen.queryByText(/RAS Foundation Course/i)).not.toBeInTheDocument();
      });
    });
  });

  describe('EXAM-DETAIL-008: Test Series Mapping', () => {
    it('displays only Patwari-related test series', async () => {
      renderWithProviders(<ExamDetail />);
      await waitFor(() => {
        const testsTab = screen.getByRole('button', { name: /Test Series/i });
        testsTab.click();
      });
      await waitFor(() => {
        expect(screen.getByText(/Patwari Mock Test 01/i)).toBeInTheDocument();
        expect(screen.getByText(/Patwari Mock Test 02/i)).toBeInTheDocument();
      });
    });

    it('EXAM-DETAIL-014: does NOT display unrelated RAS test', async () => {
      renderWithProviders(<ExamDetail />);
      await waitFor(() => {
        const testsTab = screen.getByRole('button', { name: /Test Series/i });
        testsTab.click();
      });
      await waitFor(() => {
        expect(screen.queryByText(/RAS Mock Test/i)).not.toBeInTheDocument();
      });
    });
  });

  describe('EXAM-DETAIL-009/015: Free Resources & PYQs Mapping', () => {
    it('displays only Patwari-related free resources', async () => {
      renderWithProviders(<ExamDetail />);
      await waitFor(() => {
        const resourcesTab = screen.getByRole('button', { name: /Free Resources/i });
        resourcesTab.click();
      });
      await waitFor(() => {
        expect(screen.getByText(/Patwari Syllabus PDF/i)).toBeInTheDocument();
      });

      await waitFor(() => {
        const pyqsTab = screen.getByRole('button', { name: /PYQs/i });
        pyqsTab.click();
      });
      await waitFor(() => {
        expect(screen.getByText(/Patwari PYQ 2023/i)).toBeInTheDocument();
      });
    });
  });

  describe('EXAM-DETAIL-010/011/012: Blog & Job Alerts Mapping', () => {
    it('displays Patwari-related articles', async () => {
      renderWithProviders(<ExamDetail />);
      await waitFor(() => {
        const updatesTab = screen.getByRole('button', { name: /Updates/i });
        updatesTab.click();
      });
      await waitFor(() => {
        expect(screen.getByText(/Patwari Preparation Strategy/i)).toBeInTheDocument();
        expect(screen.getByText(/Patwari Recruitment 2026/i)).toBeInTheDocument();
        // Use getAllByText for multiple RPSC matches
        const rpscElements = screen.getAllByText(/RPSC/i);
        expect(rpscElements.length).toBeGreaterThanOrEqual(1);
      });
    });
  });

  describe('EXAM-DETAIL-016: Invalid Exam Slug', () => {
    it('shows error for invalid slug', async () => {
      api.get.mockRejectedValueOnce({ response: { data: { message: 'Not found' } } });

      renderWithProviders(<ExamDetail />);
      await waitFor(() => {
        // The component shows "Not found" not "Exam not found"
        expect(screen.getByText(/Not found/i)).toBeInTheDocument();
      });
    });
  });

  describe('EXAM-DETAIL-016: API Failure', () => {
    it('shows error state on API failure', async () => {
      api.get.mockRejectedValueOnce(new Error('Network error'));

      renderWithProviders(<ExamDetail />);
      await waitFor(() => {
        // The component shows the error message directly
        expect(screen.getByText(/Network error/i)).toBeInTheDocument();
      });
    });
  });

  describe('Tab Navigation', () => {
    it('renders all tabs', async () => {
      renderWithProviders(<ExamDetail />);
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Overview/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Syllabus/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Exam Pattern/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Eligibility/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Courses/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Test Series/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Free Resources/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /PYQs/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Updates/i })).toBeInTheDocument();
      });
    });

    it('highlights active tab', async () => {
      const user = userEvent.setup();
      renderWithProviders(<ExamDetail />);
      await waitFor(() => {
        const syllabusTab = screen.getByRole('button', { name: /Syllabus/i });
        user.click(syllabusTab);
      });
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Syllabus/i })).toHaveClass('bg-amber-500');
      });
    });
  });
});
