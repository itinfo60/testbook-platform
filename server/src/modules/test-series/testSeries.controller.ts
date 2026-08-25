import ApiError from '../../utils/ApiError.js';
import ApiResponse from '../../utils/ApiResponse.js';
import catchAsync from '../../utils/catchAsync.js';
import { runWithTenant } from '../../utils/TenantContext.js';
import { generateSlug } from '../../utils/helpers.js';
import prisma from '../../config/prisma.js';

export const getTestSeries = catchAsync(async (req, res) => {
  const {
    examCategory,
    testType,
    isFree,
    search,
    isPublished,
    sort,
    order = 'desc',
    page = 1,
    limit = 20,
  } = req.query;

  const where: any = {};

  if (isPublished !== undefined && isPublished !== 'all') {
    where.isPublished = isPublished === 'true' || isPublished === true;
  } else if (
    !req.user ||
    (req.user.role !== 'admin' && req.user.role !== 'teacher' && req.user.role !== 'super_admin')
  ) {
    where.isPublished = true;
  }

  if (examCategory) {
    where.categoryId = examCategory;
  }

  if (search) {
    where.OR = [
      { title: { contains: String(search), mode: 'insensitive' } },
      { description: { contains: String(search), mode: 'insensitive' } },
    ];
  }

  const sortDirection = String(order).toLowerCase() === 'asc' ? 'asc' : 'desc';
  let orderBy: any = [{ createdAt: 'desc' }];
  if (sort) {
    const sField = String(sort);
    if (sField === 'enrollmentCount' || sField === 'enrollmentsCount' || sField === 'enrollments') {
      orderBy = [{ enrollments: { _count: sortDirection } }];
    } else if (['title', 'price', 'isPublished', 'createdAt', 'updatedAt'].includes(sField)) {
      orderBy = [{ [sField]: sortDirection }];
    }
  }

  const result = await runWithTenant(null, true, async () => {
    const skip = (Number(page) - 1) * Number(limit);
    const [seriesList, total] = await Promise.all([
      prisma.testSeries.findMany({
        where,
        include: {
          category: { select: { name: true, slug: true, icon: true } },
          _count: { select: { enrollments: true } },
        },
        orderBy,
        skip,
        take: Number(limit),
      }),
      prisma.testSeries.count({ where }),
    ]);
    return { seriesList, total };
  });

  let userPayments: any[] = [];
  if (req.userId) {
    userPayments = await prisma.payment.findMany({
      where: {
        userId: req.userId,
        status: { in: ['captured', 'success', 'completed', 'paid'] },
      },
      select: { notes: true },
    });
  }

  const enrichedSeriesList = result.seriesList.map((s: any) => {
    const isFree = s.price === 0;
    const testIds = Array.isArray(s.tests) ? s.tests : [];
    const targetIds = [s.id, ...testIds];

    const hasPaid = userPayments.some((p) => {
      const notes: any = p.notes;
      if (!notes) return false;
      return (
        targetIds.includes(notes.testId) ||
        targetIds.includes(notes.testSeriesId) ||
        targetIds.includes(notes.itemId)
      );
    });

    const isPurchased = isFree || hasPaid;
    const enrollmentCount = s._count?.enrollments || 0;

    return {
      ...s,
      isPurchased,
      isEnrolled: isPurchased,
      testsCount: testIds.length,
      enrollmentCount,
      enrollmentsCount: enrollmentCount,
      totalEnrollments: enrollmentCount,
    };
  });

  ApiResponse.ok(res, {
    testSeries: enrichedSeriesList,
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

  let isPurchased = Boolean(series.price === 0);

  if (req.userId && !isPurchased) {
    const targetIds = [series.id, ...testIds];
    const payments = await prisma.payment.findMany({
      where: {
        userId: req.userId,
        status: { in: ['captured', 'success', 'completed', 'paid'] },
      },
      select: { notes: true },
    });

    const hasPaid = payments.some((p) => {
      const notes: any = p.notes;
      if (!notes) return false;
      return (
        targetIds.includes(notes.testId) ||
        targetIds.includes(notes.testSeriesId) ||
        targetIds.includes(notes.itemId)
      );
    });

    if (hasPaid) {
      isPurchased = true;
    }
  }

  const enrichedTests = tests.map((t, idx) => {
    const { questions, ...restT } = t as any;
    const testIsFree = Boolean(
      (t.settings && (t.settings as any).isFree === true) || series.price === 0 || isPurchased
    );
    return {
      ...restT,
      isPurchased: isPurchased || testIsFree,
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
