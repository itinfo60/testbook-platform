import ApiResponse from '../../utils/ApiResponse.js';
import catchAsync from '../../utils/catchAsync.js';
import prisma from '../../config/prisma.js';

/**
 * Global search across all content types.
 * GET /api/v1/search?q=patwari&limit=5
 */
export const globalSearch = catchAsync(async (req, res) => {
  const { q, limit = 5 } = req.query;

  if (!q || q.trim().length < 2) {
    return ApiResponse.ok(res, {
      exams: [],
      courses: [],
      tests: [],
      blogs: [],
      resources: [],
    });
  }

  const query = q.trim();
  const maxResults = Math.min(parseInt(limit) || 5, 20);

  const [exams, courses, tests, blogs, resources] = await Promise.all([
    prisma.category.findMany({
      where: {
        isActive: true,
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { description: { contains: query, mode: 'insensitive' } },
        ],
      },
      select: { id: true, name: true, slug: true, icon: true, description: true, type: true },
      take: maxResults,
    }),

    prisma.course.findMany({
      where: {
        isPublished: true,
        OR: [
          { title: { contains: query, mode: 'insensitive' } },
          { description: { contains: query, mode: 'insensitive' } },
        ],
      },
      select: {
        id: true,
        title: true,
        slug: true,
        thumbnail: true,
        price: true,
        categoryId: true,
        rating: true,
        totalRatings: true,
        category: { select: { name: true, slug: true } },
      },
      take: maxResults,
    }),

    prisma.test.findMany({
      where: {
        isPublished: true,
        OR: [
          { title: { contains: query, mode: 'insensitive' } },
          { description: { contains: query, mode: 'insensitive' } },
        ],
      },
      select: {
        id: true,
        title: true,
        duration: true,
        totalQuestions: true,
        totalMarks: true,
        categoryId: true,
        category: { select: { name: true, slug: true } },
      },
      take: maxResults,
    }),

    prisma.blog.findMany({
      where: {
        status: 'published',
        OR: [
          { title: { contains: query, mode: 'insensitive' } },
          { excerpt: { contains: query, mode: 'insensitive' } },
        ],
      },
      select: {
        id: true,
        title: true,
        slug: true,
        excerpt: true,
        type: true,
        thumbnail: true,
        createdAt: true,
      },
      take: maxResults,
    }),

    prisma.library.findMany({
      where: {
        OR: [
          { title: { contains: query, mode: 'insensitive' } },
          { description: { contains: query, mode: 'insensitive' } },
        ],
      },
      select: {
        id: true,
        title: true,
        description: true,
        url: true,
        type: true,
        accessLevel: true,
        fileData: true,
      },
      take: maxResults,
    }),
  ]);

  const totalResults =
    exams.length + courses.length + tests.length + blogs.length + resources.length;

  ApiResponse.ok(res, {
    query,
    totalResults,
    exams,
    courses,
    tests,
    blogs,
    resources,
  });
});
