import prisma from '../../config/prisma.js';
import ApiError from '../../utils/ApiError.js';
import ApiResponse from '../../utils/ApiResponse.js';
import catchAsync from '../../utils/catchAsync.js';
import redis from '../../config/redis.js';
import { generateSlug } from '../../utils/helpers.js';
import { runWithTenant } from '../../utils/TenantContext.js';

export const getCategories = catchAsync(async (req, res) => {
  const isFlat = req.query.flat === 'true';
  const typeFilter = req.query.type ? String(req.query.type) : 'all';
  const cacheKey = `categories:${isFlat ? 'flat' : 'tree'}:${typeFilter}`;

  const cached = await redis.get(cacheKey);
  if (cached) {
    return ApiResponse.ok(res, cached);
  }

  const [allCatsRaw, courses, tests, testSeries] = await runWithTenant(null, true, async () => {
    return await Promise.all([
      prisma.category.findMany({
        where: { isActive: true },
        orderBy: [{ name: 'asc' }],
      }),
      prisma.course.groupBy({
        by: ['categoryId'],
        where: { categoryId: { not: null } },
        _count: { _all: true },
      }),
      prisma.test.groupBy({
        by: ['categoryId'],
        where: { categoryId: { not: null } },
        _count: { _all: true },
      }),
      prisma.testSeries.groupBy({
        by: ['categoryId'],
        where: { categoryId: { not: null } },
        _count: { _all: true },
      }),
    ]);
  });

  const courseCountMap = Object.fromEntries(courses.map((c) => [c.categoryId, c._count._all]));
  const testCountMap = Object.fromEntries(tests.map((t) => [t.categoryId, t._count._all]));
  const seriesCountMap = Object.fromEntries(testSeries.map((s) => [s.categoryId, s._count._all]));

  // Recursive function to build descendants list for count rollups
  const getDescendantIds = (catId: string): string[] => {
    const directChildren = allCatsRaw.filter((c) => c.parentId === catId);
    let ids = [catId];
    directChildren.forEach((child) => {
      ids = ids.concat(getDescendantIds(child.id));
    });
    return ids;
  };

  // Build recursive subcategories tree
  const buildSubcategoryTree = (parentId: string | null): any[] => {
    const children = allCatsRaw.filter((c) => c.parentId === parentId);
    return children.map((cat) => {
      const allDescendantIds = getDescendantIds(cat.id);
      const courseCount = allDescendantIds.reduce((sum, id) => sum + (courseCountMap[id] || 0), 0);
      const testCount = allDescendantIds.reduce((sum, id) => sum + (testCountMap[id] || 0), 0);
      const testSeriesCount = allDescendantIds.reduce(
        (sum, id) => sum + (seriesCountMap[id] || 0),
        0
      );
      const nestedSubs = buildSubcategoryTree(cat.id);
      return {
        ...cat,
        courseCount,
        coursesCount: courseCount,
        testCount,
        testsCount: testCount,
        testSeriesCount,
        examsCount: nestedSubs.length,
        subcategories: nestedSubs,
        _count: {
          courses: courseCount,
          tests: testCount,
          testSeries: testSeriesCount,
        },
      };
    });
  };

  const parentMap = Object.fromEntries(
    allCatsRaw.map((c) => [c.id, { id: c.id, name: c.name, slug: c.slug, icon: c.icon }])
  );

  const enrichedAll = allCatsRaw.map((cat) => {
    const allDescendantIds = getDescendantIds(cat.id);
    const courseCount = allDescendantIds.reduce((sum, id) => sum + (courseCountMap[id] || 0), 0);
    const testCount = allDescendantIds.reduce((sum, id) => sum + (testCountMap[id] || 0), 0);
    const testSeriesCount = allDescendantIds.reduce(
      (sum, id) => sum + (seriesCountMap[id] || 0),
      0
    );
    const subTree = buildSubcategoryTree(cat.id);

    return {
      ...cat,
      parentId: cat.parentId || null,
      parent: cat.parentId
        ? parentMap[cat.parentId] || { id: cat.parentId, name: 'Category' }
        : null,
      courseCount,
      coursesCount: courseCount,
      testCount,
      testsCount: testCount,
      testSeriesCount,
      examsCount: subTree.length,
      subcategories: subTree,
      _count: {
        courses: courseCount,
        tests: testCount,
        testSeries: testSeriesCount,
      },
    };
  });

  // Filter for output if type filter requested
  let outputCategories = enrichedAll;
  const nonResourceAll = enrichedAll.filter((c) => c.type !== 'resource');

  if (req.query.type) {
    outputCategories = enrichedAll.filter((c) => c.type === req.query.type);
  } else if (!isFlat) {
    // Default public hierarchy: ONLY parent academic categories (strictly exclude resource categories and sub-exams)
    outputCategories = enrichedAll.filter((c) => !c.parentId && c.type !== 'resource');
  } else {
    // Flat list without type: default to academic categories only
    outputCategories = nonResourceAll;
  }

  const data = {
    categories: outputCategories,
    allCategories: req.query.type === 'resource' ? outputCategories : nonResourceAll,
  };

  await redis.set(cacheKey, data, 600); // 10 minutes cache

  ApiResponse.ok(res, data);
});

export const getCategoryBySlug = catchAsync(async (req, res) => {
  const param = req.params.slug ? req.params.slug.trim() : '';
  const cleanParam = param
    .replace(/-exams$/i, '')
    .replace(/-portal$/i, '')
    .trim();

  const isId = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(param);

  const whereClause = isId
    ? {
        OR: [
          { id: param },
          { slug: { equals: param, mode: 'insensitive' as const } },
          { slug: { equals: cleanParam, mode: 'insensitive' as const } },
        ],
      }
    : {
        OR: [
          { slug: { equals: param, mode: 'insensitive' as const } },
          { slug: { equals: cleanParam, mode: 'insensitive' as const } },
          { slug: { equals: `${cleanParam}-exams`, mode: 'insensitive' as const } },
        ],
      };

  let category = await prisma.category.findFirst({ where: whereClause });

  if (!category) {
    category = await prisma.category.findFirst({
      where: {
        OR: [
          { slug: { startsWith: cleanParam, mode: 'insensitive' as const } },
          { slug: { contains: cleanParam, mode: 'insensitive' as const } },
          { name: { contains: cleanParam, mode: 'insensitive' as const } },
        ],
      },
    });
  }

  if (!category) throw ApiError.notFound('Category not found');

  // Find sub-categories (e.g. specific exams under a main category)
  const subCategories = await prisma.category.findMany({
    where: { parentId: category.id },
    orderBy: { name: 'asc' },
  });

  const catIds = [category.id, ...subCategories.map((s) => s.id)];

  const [courses, tests, testSeries, quizzes, library, blogs] = await runWithTenant(
    null,
    true,
    async () => {
      return Promise.all([
        prisma.course.findMany({
          where: { categoryId: { in: catIds } },
          include: {
            teacher: { select: { id: true, name: true, email: true, avatar: true } },
            _count: { select: { enrollments: true, reviews: true } },
          },
          orderBy: { createdAt: 'desc' },
        }),
        prisma.test.findMany({
          where: { categoryId: { in: catIds } },
          include: {
            _count: { select: { attempts: true } },
          },
          orderBy: { createdAt: 'desc' },
        }),
        prisma.testSeries.findMany({
          where: { categoryId: { in: catIds } },
          orderBy: { createdAt: 'desc' },
        }),
        prisma.quiz.findMany({
          where: category.tenantId ? { tenantId: category.tenantId } : {},
          orderBy: { createdAt: 'desc' },
        }),
        prisma.library.findMany({
          where: category.tenantId ? { tenantId: category.tenantId } : {},
          orderBy: { createdAt: 'desc' },
        }),
        prisma.blog.findMany({
          where: {
            tags: {
              hasSome: [
                category.name,
                category.slug,
                ...subCategories.map((s) => s.name),
                ...subCategories.map((s) => s.slug),
              ],
            },
          },
          orderBy: { createdAt: 'desc' },
        }),
      ]);
    }
  );

  const stats = {
    totalCourses: courses.length,
    totalTests: tests.length,
    totalTestSeries: testSeries.length,
    totalQuizzes: quizzes.length,
    totalResources: library.length,
    totalBlogs: blogs.length,
  };

  // Build parent info if this is a sub-exam
  let parent = null;
  if (category.parentId) {
    parent = await prisma.category.findUnique({
      where: { id: category.parentId },
      select: { id: true, name: true, slug: true, icon: true },
    });
  }

  ApiResponse.ok(res, {
    category: {
      ...category,
      parent,
    },
    subCategories,
    courses,
    tests,
    testSeries,
    quizzes,
    resources: library,
    blogs,
    stats,
  });
});

export const createCategory = catchAsync(async (req, res) => {
  if (!req.body.name || !req.body.name.trim()) {
    throw ApiError.badRequest('Category name is required');
  }

  const baseSlug = req.body.slug ? generateSlug(req.body.slug) : generateSlug(req.body.name);
  let slug = baseSlug;
  const existing = await prisma.category.findUnique({ where: { slug } });
  if (existing) {
    slug = `${baseSlug}-${Date.now().toString().slice(-4)}`;
  }

  const rawParent = req.body.parentId !== undefined ? req.body.parentId : req.body.parent;
  const parentId = rawParent && String(rawParent).trim() ? String(rawParent).trim() : null;

  const category = await prisma.category.create({
    data: {
      name: req.body.name.trim(),
      slug,
      description: req.body.description || null,
      icon: req.body.icon || null,
      parentId,
      type: req.body.type || (parentId ? 'exam' : 'category'),
      isActive: req.body.isActive !== undefined ? Boolean(req.body.isActive) : true,
      tenantId: req.tenantId || req.body.tenantId || null,
    },
  });

  await redis.delPattern('categories:*');
  ApiResponse.created(res, { category }, 'Category created');
});

export const updateCategory = catchAsync(async (req, res) => {
  const existing = await prisma.category.findUnique({ where: { id: req.params.id } });
  if (!existing) throw ApiError.notFound('Category not found');

  const updateData: any = {};
  if (req.body.name) {
    updateData.name = req.body.name.trim();
    updateData.slug = generateSlug(req.body.name);
  }
  if (req.body.description !== undefined) updateData.description = req.body.description;
  if (req.body.icon !== undefined) updateData.icon = req.body.icon;
  if (req.body.parentId !== undefined || req.body.parent !== undefined) {
    const rawParent = req.body.parentId !== undefined ? req.body.parentId : req.body.parent;
    updateData.parentId = rawParent && String(rawParent).trim() ? String(rawParent).trim() : null;
  }
  if (req.body.type !== undefined) updateData.type = req.body.type;
  if (req.body.isActive !== undefined) updateData.isActive = Boolean(req.body.isActive);

  const category = await prisma.category.update({
    where: { id: req.params.id },
    data: updateData,
  });

  await redis.delPattern('categories:*');
  ApiResponse.ok(res, { category }, 'Category updated');
});

export const deleteCategory = catchAsync(async (req, res) => {
  const category = await prisma.category.findUnique({ where: { id: req.params.id } });
  if (!category) throw ApiError.notFound('Category not found');

  const [courseCount, testCount] = await Promise.all([
    prisma.course.count({ where: { categoryId: category.id } }),
    prisma.test.count({ where: { categoryId: category.id } }),
  ]);

  if (courseCount > 0 || testCount > 0) {
    throw ApiError.badRequest(
      `Cannot delete: ${courseCount} courses and ${testCount} tests use this category`
    );
  }

  await prisma.category.delete({ where: { id: req.params.id } });
  await redis.delPattern('categories:*');
  ApiResponse.ok(res, null, 'Category deleted');
});

export const adminGetCategories = catchAsync(async (req, res) => {
  const { page = 1, limit = 50, search, isActive, tenantId, type } = req.query;
  const skip = (Number(page) - 1) * Number(limit);

  const where: any = {};
  if (search) where.name = { contains: search, mode: 'insensitive' };
  if (isActive !== undefined) where.isActive = isActive === 'true';
  if (tenantId) where.tenantId = tenantId;
  if (type) where.type = type;

  const [docs, total, allSubCats, coursesAgg, testsAgg, seriesAgg] = await Promise.all([
    prisma.category.findMany({
      where,
      orderBy: [{ name: 'asc' }],
      skip,
      take: Number(limit),
    }),
    prisma.category.count({ where }),
    prisma.category.findMany({
      select: { id: true, parentId: true },
    }),
    prisma.course.groupBy({
      by: ['categoryId'],
      where: { categoryId: { not: null } },
      _count: { _all: true },
    }),
    prisma.test.groupBy({
      by: ['categoryId'],
      where: { categoryId: { not: null } },
      _count: { _all: true },
    }),
    prisma.testSeries.groupBy({
      by: ['categoryId'],
      where: { categoryId: { not: null } },
      _count: { _all: true },
    }),
  ]);

  const courseCountMap = Object.fromEntries(coursesAgg.map((c) => [c.categoryId, c._count._all]));
  const testCountMap = Object.fromEntries(testsAgg.map((t) => [t.categoryId, t._count._all]));
  const seriesCountMap = Object.fromEntries(seriesAgg.map((s) => [s.categoryId, s._count._all]));

  // Map subcategory IDs to parents for rollup
  const subCatsByParent: Record<string, string[]> = {};
  allSubCats.forEach((sc) => {
    if (sc.parentId) {
      if (!subCatsByParent[sc.parentId]) subCatsByParent[sc.parentId] = [];
      subCatsByParent[sc.parentId].push(sc.id);
    }
  });

  const parentIds = [...new Set(docs.filter((d) => d.parentId).map((d) => d.parentId))];
  const parents = parentIds.length
    ? await prisma.category.findMany({
        where: { id: { in: parentIds } },
        select: { id: true, name: true, slug: true, icon: true },
      })
    : [];
  const parentMap = Object.fromEntries(parents.map((p) => [p.id, p]));

  const enriched = docs.map((d) => {
    const subIds = subCatsByParent[d.id] || [];
    const directAndSubIds = [d.id, ...subIds];

    const courseCount = directAndSubIds.reduce((sum, id) => sum + (courseCountMap[id] || 0), 0);
    const testCount = directAndSubIds.reduce((sum, id) => sum + (testCountMap[id] || 0), 0);
    const testSeriesCount = directAndSubIds.reduce((sum, id) => sum + (seriesCountMap[id] || 0), 0);

    return {
      ...d,
      parentId: d.parentId || null,
      parent: d.parentId ? parentMap[d.parentId] || { id: d.parentId, name: 'Category' } : null,
      courseCount,
      coursesCount: courseCount,
      testCount,
      testsCount: testCount,
      testSeriesCount,
      examsCount: subIds.length,
      _count: {
        courses: courseCount,
        tests: testCount,
        testSeries: testSeriesCount,
      },
    };
  });

  ApiResponse.paginated(res, {
    docs: enriched,
    page: Number(page),
    limit: Number(limit),
    total,
  });
});
