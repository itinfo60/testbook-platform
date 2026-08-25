import ApiError from '../../utils/ApiError.js';
import ApiResponse from '../../utils/ApiResponse.js';
import catchAsync from '../../utils/catchAsync.js';
import { runWithTenant } from '../../utils/TenantContext.js';
import { generateSlug } from '../../utils/helpers.js';
import prisma from '../../config/prisma.js';

export const getTestSeries = catchAsync(async (req, res) => {
  const { examCategory, testType, isFree, search, page = 1, limit = 20 } = req.query;

  const where: any = { isPublished: true };

  if (examCategory) {
    where.categoryId = examCategory;
  }

  if (search) {
    where.OR = [
      { title: { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } },
    ];
  }

  const result = await runWithTenant(null, true, async () => {
    const skip = (Number(page) - 1) * Number(limit);
    const [seriesList, total] = await Promise.all([
      prisma.testSeries.findMany({
        where,
        include: { category: { select: { name: true, slug: true, icon: true } } },
        orderBy: [{ createdAt: 'desc' }],
        skip,
        take: Number(limit),
      }),
      prisma.testSeries.count({ where }),
    ]);
    return { seriesList, total };
  });

  ApiResponse.ok(res, {
    testSeries: result.seriesList,
    pagination: {
      total: result.total,
      page: Number(page),
      limit: Number(limit),
      pages: Math.ceil(result.total / Number(limit)) || 1,
    },
  });
});

export const getTestSeriesBySlug = catchAsync(async (req, res) => {
  const param = req.params.slug ? req.params.slug.trim() : '';
  const cleanParam = param
    .replace(/-official-test-series$/i, '')
    .replace(/-test-series$/i, '')
    .replace(/-full_length-series$/i, '')
    .replace(/-series$/i, '')
    .trim();

  let series = await runWithTenant(null, true, async () => {
    return prisma.testSeries.findFirst({
      where: {
        OR: [
          { id: param },
          { title: { contains: cleanParam.replace(/-/g, ' '), mode: 'insensitive' } },
        ],
      },
      include: { category: { select: { id: true, name: true, slug: true, icon: true } } },
    });
  });

  if (!series && cleanParam) {
    series = await runWithTenant(null, true, async () => {
      return prisma.testSeries.findFirst({
        where: {
          title: { contains: cleanParam.split('-')[0], mode: 'insensitive' },
        },
        include: { category: { select: { id: true, name: true, slug: true, icon: true } } },
      });
    });
  }

  if (!series) {
    series = await runWithTenant(null, true, async () => {
      return prisma.testSeries.findFirst({
        where: { isPublished: true },
        include: { category: { select: { id: true, name: true, slug: true, icon: true } } },
      });
    });
  }

  if (!series) throw ApiError.notFound('Test Series not found');

  const testIds = Array.isArray(series.tests) ? series.tests : [];
  const tests =
    testIds.length > 0
      ? await runWithTenant(null, true, async () => {
          return prisma.test.findMany({
            where: {
              id: { in: testIds },
              isPublished: true,
            },
            orderBy: [{ createdAt: 'asc' }],
          });
        })
      : [];

  const isPurchased = Boolean(series.price === 0);

  const enrichedTests = tests.map((t, idx) => {
    const { questions, ...restT } = t as any;
    return {
      ...restT,
      isPurchased,
      testNumber: idx + 1,
    };
  });

  ApiResponse.ok(res, {
    testSeries: {
      ...series,
      isPurchased,
      isEnrolled: isPurchased,
      tests: enrichedTests,
      testsCount: enrichedTests.length,
    },
  });
});

export const createTestSeries = catchAsync(async (req, res) => {
  const { title, description, price, isPublished, tests, categoryId, category } = req.body;
  if (!title) throw ApiError.badRequest('Test series title is required');

  const series = await prisma.testSeries.create({
    data: {
      title,
      description: description || '',
      price: price !== undefined ? Number(price) : 0,
      isPublished: isPublished !== undefined ? Boolean(isPublished) : true,
      tests: Array.isArray(tests) ? tests : [],
      categoryId: categoryId || category || null,
      tenantId: req.tenantId || req.user?.tenantId || null,
    },
  });

  if (Array.isArray(tests) && tests.length > 0 && series.categoryId) {
    try {
      await prisma.test.updateMany({
        where: { id: { in: tests }, categoryId: null },
        data: { categoryId: series.categoryId },
      });
    } catch (err) {
      console.warn('Could not auto-link category to tests:', err);
    }
  }

  ApiResponse.created(res, { testSeries: series }, 'Test series created successfully');
});

export const updateTestSeries = catchAsync(async (req, res) => {
  const { title, description, price, isPublished, tests, categoryId, category } = req.body;
  const updateData: any = {};
  if (title) updateData.title = title;
  if (description !== undefined) updateData.description = description;
  if (price !== undefined) updateData.price = Number(price);
  if (isPublished !== undefined) updateData.isPublished = Boolean(isPublished);
  if (tests !== undefined) updateData.tests = Array.isArray(tests) ? tests : [];
  if (categoryId || category) updateData.categoryId = categoryId || category;

  const series = await prisma.testSeries.update({
    where: { id: req.params.id },
    data: updateData,
  });
  if (!series) throw ApiError.notFound('Test series not found');

  if (Array.isArray(tests) && tests.length > 0 && series.categoryId) {
    try {
      await prisma.test.updateMany({
        where: { id: { in: tests }, categoryId: null },
        data: { categoryId: series.categoryId },
      });
    } catch (err) {
      console.warn('Could not auto-link category to tests:', err);
    }
  }

  ApiResponse.ok(res, { testSeries: series }, 'Test series updated successfully');
});

export const deleteTestSeries = catchAsync(async (req, res) => {
  const series = await prisma.testSeries.delete({
    where: { id: req.params.id },
  });
  if (!series) throw ApiError.notFound('Test series not found');
  ApiResponse.ok(res, null, 'Test series deleted successfully');
});

export const getMyTestSeries = catchAsync(async (req, res) => {
  const testSeries = await prisma.testSeries.findMany({
    where: {
      authorId: (req as any).user.id,
    },
    orderBy: { createdAt: 'desc' },
  });
  res.status(200).json(new ApiResponse(200, testSeries, 'Success'));
});
