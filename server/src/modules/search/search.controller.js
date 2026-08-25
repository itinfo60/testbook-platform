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

  const [rawExams, courses, tests, testSeries, blogs, resources, allCats] = await Promise.all([
    prisma.category.findMany({
      where: {
        isActive: true,
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { description: { contains: query, mode: 'insensitive' } },
        ],
      },
      select: {
        id: true,
        name: true,
        slug: true,
        icon: true,
        description: true,
        type: true,
        parentId: true,
      },
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
        description: true,
        duration: true,
        totalQuestions: true,
        totalMarks: true,
        categoryId: true,
        settings: true,
        category: { select: { name: true, slug: true } },
      },
      take: maxResults,
    }),

    prisma.testSeries.findMany({
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
        description: true,
        price: true,
        tests: true,
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

    prisma.category.findMany({
      select: { id: true, parentId: true, name: true, slug: true },
    }),
  ]);

  // Aggregate course and test counts for all exams & subcategories
  const [courseAgg, testAgg] = await Promise.all([
    prisma.course.groupBy({
      by: ['categoryId'],
      where: { categoryId: { not: null }, isPublished: true },
      _count: { _all: true },
    }),
    prisma.test.groupBy({
      by: ['categoryId'],
      where: { categoryId: { not: null }, isPublished: true },
      _count: { _all: true },
    }),
  ]);

  const courseCountMap = Object.fromEntries(courseAgg.map((c) => [c.categoryId, c._count._all]));
  const testCountMap = Object.fromEntries(testAgg.map((t) => [t.categoryId, t._count._all]));

  // Build recursive children map
  const getDescendantIds = (catId) => {
    const directChildren = allCats.filter((c) => c.parentId === catId);
    let ids = [catId];
    directChildren.forEach((child) => {
      ids = ids.concat(getDescendantIds(child.id));
    });
    return ids;
  };

  const catMap = Object.fromEntries(allCats.map((c) => [c.id, c]));

  const exams = rawExams.map((exam) => {
    const allRelatedIds = getDescendantIds(exam.id);
    const courseCount = allRelatedIds.reduce((sum, id) => sum + (courseCountMap[id] || 0), 0);
    const testCount = allRelatedIds.reduce((sum, id) => sum + (testCountMap[id] || 0), 0);
    const parent = exam.parentId ? catMap[exam.parentId] : null;

    return {
      ...exam,
      courseCount,
      coursesCount: courseCount,
      testCount,
      testsCount: testCount,
      parent: parent ? { id: parent.id, name: parent.name, slug: parent.slug } : null,
    };
  });

  const testSeriesAll = await prisma.testSeries.findMany({
    where: { isPublished: true },
    select: { id: true, price: true, tests: true },
  });

  const enrichedTests = tests.map((t) => {
    const parentSeries = testSeriesAll.find((s) => s.tests && s.tests.includes(t.id));
    const isFree = Boolean(
      (t.settings && t.settings.isFree === true && t.settings.isTrial === true) ||
      (parentSeries && parentSeries.price === 0)
    );
    const price = t.price || t.settings?.price || (parentSeries ? parentSeries.price : 0);
    return {
      ...t,
      isFree,
      price: isFree ? 0 : price,
    };
  });

  const totalResults =
    exams.length +
    courses.length +
    (testSeries?.length || 0) +
    tests.length +
    blogs.length +
    resources.length;

  ApiResponse.ok(res, {
    query,
    totalResults,
    exams,
    courses,
    testSeries: testSeries || [],
    tests: enrichedTests,
    blogs,
    resources,
  });
});
