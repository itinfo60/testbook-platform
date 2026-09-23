import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../src/config/prisma.js', () => ({
  default: {
    course: { findMany: vi.fn(), findFirst: vi.fn() },
    review: { findMany: vi.fn() },
    enrollment: { findFirst: vi.fn(), findMany: vi.fn(), count: vi.fn() },
    category: { findFirst: vi.fn(), findMany: vi.fn(), findUnique: vi.fn() },
    test: { findMany: vi.fn() },
    testSeries: { findMany: vi.fn() },
    quiz: { findMany: vi.fn() },
    library: { findMany: vi.fn() },
    blog: { findMany: vi.fn() },
  },
}));
vi.mock('../../src/config/redis.js', () => ({
  default: {
    get: vi.fn(),
    set: vi.fn(),
    delPattern: vi.fn(),
  },
}));
import prisma from '../../src/config/prisma.js';
import redis from '../../src/config/redis.js';
import { CourseService } from '../../src/modules/course/course.service.js';
import {
  getMyEnrollments,
  getEnrollmentProgress,
} from '../../src/modules/enrollment/enrollment.controller.js';
import { getCategoryBySlug } from '../../src/modules/exam-category/examCategory.controller.js';

const db = prisma as any;
const paidUrl = 'https://youtube.com/watch?v=W6NZfCO5SIk';
const freeUrl = 'https://youtu.be/9bZkp7q19f0';
const course = () => ({
  id: 'course',
  slug: 'course-slug',
  isPublished: true,
  teacherId: 'teacher',
  sections: [
    {
      id: 'section',
      lessons: [
        {
          id: 'paid',
          type: 'video',
          isFree: false,
          videoUrl: paidUrl,
          content: 'paid notes',
          resources: [{ title: 'Paid recording', type: 'link', url: paidUrl }],
        },
        { id: 'free', type: 'video', isFree: true, videoUrl: freeUrl },
      ],
    },
  ],
});

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(redis.get).mockResolvedValue(null);
  vi.mocked(redis.set).mockResolvedValue(true);
  db.course.findMany.mockResolvedValue([course()]);
  db.course.findFirst.mockResolvedValue(course());
  db.review.findMany.mockResolvedValue([]);
  db.enrollment.findFirst.mockResolvedValue(null);
});

describe('video URL access boundaries', () => {
  it.each([false, true])(
    'redacts paid URLs in public catalog (JSON sections: %s)',
    async (json) => {
      const original: any = course();
      if (json) original.sections = JSON.stringify(original.sections);
      const paginateCourses = vi.fn().mockResolvedValue({ docs: [original], total: 1 });
      const service = new CourseService({ paginateCourses } as any);
      const response = await service.getCourses({ page: 1, limit: 12, status: 'draft' } as any);
      expect(paginateCourses).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'published' })
      );
      expect(JSON.stringify(response)).not.toContain(paidUrl);
      expect(JSON.stringify(response)).not.toContain('paid notes');
      expect(JSON.stringify(response)).toContain(freeUrl);
      expect(JSON.stringify(original)).toContain(paidUrl);
    }
  );

  it('only caches sanitized featured courses using a new cache namespace', async () => {
    const response = await new CourseService().getFeaturedCourses();
    expect(JSON.stringify(response)).not.toContain(paidUrl);
    expect(JSON.stringify(response)).toContain(freeUrl);
    expect(redis.get).toHaveBeenCalledWith('courses:featured:visibility-v2');
    expect(redis.set).toHaveBeenCalledWith(
      'courses:featured:visibility-v2',
      { courses: response },
      1800
    );
  });

  it('does not reuse previously cached enrollment after access is revoked', async () => {
    vi.mocked(redis.get).mockResolvedValue({ course: course(), isEnrolled: true } as any);
    const response = await new CourseService().getCourseBySlug('course-slug', 'student', 'student');
    expect(redis.get).not.toHaveBeenCalled();
    expect(db.enrollment.findFirst).toHaveBeenCalled();
    expect(response.isEnrolled).toBe(false);
    expect(JSON.stringify(response)).not.toContain(paidUrl);
  });

  it('delivers paid playback only after enrollment is checked', async () => {
    db.enrollment.findFirst.mockResolvedValue({ enrolledAt: new Date(), status: 'active' });
    const response = await new CourseService().getCourseById('course', 'student', 'student');
    expect(response.isEnrolled).toBe(true);
    expect(JSON.stringify(response)).toContain(paidUrl);
  });

  it('redacts both video and resource URLs for drip-locked lessons', async () => {
    const locked = course();
    Object.assign(locked.sections[0].lessons[0], { dripDays: 10 });
    db.course.findFirst.mockResolvedValue(locked);
    db.enrollment.findFirst.mockResolvedValue({ enrolledAt: new Date(), status: 'active' });
    const response = await new CourseService().getCourseById('course', 'student', 'student');
    expect(response.course.sections[0].lessons[0].dripLocked).toBe(true);
    expect(JSON.stringify(response)).not.toContain(paidUrl);
  });

  it('ensures getMyEnrollments strips sections from the returned course', async () => {
    const enrollmentData = {
      id: 'enr-1',
      userId: 'student-1',
      courseId: 'course',
      enrolledAt: new Date(),
      status: 'active',
      completedLessons: [],
      course: course(),
    };
    db.enrollment.findMany.mockResolvedValue([enrollmentData]);
    db.enrollment.count.mockResolvedValue(1);

    let sentJson: any;
    const req: any = { user: { id: 'student-1' }, query: {} };
    const res: any = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockImplementation((data) => {
        sentJson = data;
        return res;
      }),
    };

    await getMyEnrollments(req, res, () => {});
    expect(sentJson).toBeDefined();
    expect(JSON.stringify(sentJson)).not.toContain(paidUrl);
    expect(sentJson.data[0].course.sections).toBeUndefined();
  });

  it('ensures getEnrollmentProgress does not request or return course sections', async () => {
    db.course.findFirst.mockResolvedValue(course());
    db.enrollment.findFirst.mockResolvedValue({
      id: 'enr-1',
      userId: 'student-1',
      courseId: 'course',
      course: { title: 'course', totalLessons: 2 },
    });

    let sentJson: any;
    const req: any = { userId: 'student-1', params: { courseId: 'course' } };
    const res: any = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockImplementation((data) => {
        sentJson = data;
        return res;
      }),
    };

    await getEnrollmentProgress(req, res, () => {});
    expect(db.enrollment.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        include: { course: { select: { title: true, totalLessons: true } } },
      })
    );
    expect(JSON.stringify(sentJson)).not.toContain(paidUrl);
    expect(sentJson.data.enrollment.course.sections).toBeUndefined();
  });

  it('ensures getCategoryBySlug queries courses without sections to prevent leaks', async () => {
    db.category.findFirst.mockResolvedValue({ id: 'cat-1', name: 'Exam Cat', slug: 'exam-cat' });
    db.category.findMany.mockResolvedValue([]);
    db.course.findMany.mockResolvedValue([{ id: 'c1', title: 'Course 1' }]);
    db.test.findMany.mockResolvedValue([]);
    db.testSeries.findMany.mockResolvedValue([]);
    db.quiz.findMany.mockResolvedValue([]);
    db.library.findMany.mockResolvedValue([]);
    db.blog.findMany.mockResolvedValue([]);

    let sentJson: any;
    const req: any = { params: { slug: 'exam-cat' } };
    const res: any = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockImplementation((data) => {
        sentJson = data;
        return res;
      }),
    };

    await getCategoryBySlug(req, res, () => {});
    expect(db.course.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ isPublished: true }),
        select: expect.not.objectContaining({ sections: true }),
      })
    );
    expect(JSON.stringify(sentJson)).not.toContain(paidUrl);
  });
});
