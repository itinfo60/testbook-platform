import mongoose from 'mongoose';
import ExamCategory from './examCategory.model.js';
import Course from '../course/course.model.js';
import Test from '../test/test.model.js';
import TestSeries from '../test-series/testSeries.model.js';
import Blog from '../blog/blog.model.js';
import LibraryItem from '../library/library.model.js';
import ApiError from '../../utils/ApiError.js';
import ApiResponse from '../../utils/ApiResponse.js';
import catchAsync from '../../utils/catchAsync.js';
import redis from '../../config/redis.js';
import { generateSlug } from '../../utils/helpers.js';
import { buildPaginationQuery } from '../../utils/pagination.js';
import { runWithTenant } from '../../utils/TenantContext.js';

export const getCategories = catchAsync(async (req, res) => {
  const [categories, courseCounts, testCounts] = await runWithTenant(null, true, async () => {
    return await Promise.all([
      ExamCategory.find({ isActive: true, parent: null })
        .populate({
          path: 'subcategories',
          match: { isActive: true },
          select: 'name slug description icon latestStatus courseCount testCount',
        })
        .sort('order name')
        .lean(),
      Course.aggregate([
        { $match: { isPublished: true } },
        { $group: { _id: '$category', count: { $sum: 1 } } },
      ]),
      Test.aggregate([
        { $match: { isPublished: true } },
        { $group: { _id: '$category', count: { $sum: 1 } } },
      ]),
    ]);
  });

  const courseCountMap = Object.fromEntries(courseCounts.map((c) => [c._id?.toString(), c.count]));
  const testCountMap = Object.fromEntries(testCounts.map((c) => [c._id?.toString(), c.count]));

  const enriched = categories.map((cat) => ({
    ...cat,
    courseCount: courseCountMap[cat._id.toString()] ?? cat.courseCount ?? 0,
    testCount: testCountMap[cat._id.toString()] ?? cat.testCount ?? 0,
    subcategories: (cat.subcategories || []).map((sub) => ({
      ...sub,
      courseCount: courseCountMap[sub._id.toString()] ?? sub.courseCount ?? 0,
      testCount: testCountMap[sub._id.toString()] ?? sub.testCount ?? 0,
    })),
  }));

  const data = { categories: enriched };

  ApiResponse.ok(res, data);
});

export const getCategoryBySlug = catchAsync(async (req, res) => {
  const param = req.params.slug ? req.params.slug.trim() : '';
  const cleanParam = param
    .replace(/-exams$/i, '')
    .replace(/-portal$/i, '')
    .trim();
  const isId = mongoose.Types.ObjectId.isValid(param);

  const query = isId
    ? {
        $or: [
          { _id: param },
          { slug: new RegExp(`^${param}$`, 'i') },
          { slug: new RegExp(`^${cleanParam}$`, 'i') },
          { slug: new RegExp(`^${cleanParam}-exams$`, 'i') },
        ],
      }
    : {
        $or: [
          { slug: new RegExp(`^${param}$`, 'i') },
          { slug: new RegExp(`^${cleanParam}$`, 'i') },
          { slug: new RegExp(`^${cleanParam}-exams$`, 'i') },
        ],
      };

  const category = await runWithTenant(null, true, async () => {
    return ExamCategory.findOne(query)
      .populate({ path: 'subcategories', match: { isActive: true } })
      .lean();
  });

  if (!category) throw ApiError.notFound('Category not found');

  const subIds = (category.subcategories || []).map((s) => s._id);
  const catIds = [category._id, ...subIds];

  const [courses, tests, testSeries, blogs, resources] = await runWithTenant(
    null,
    true,
    async () => {
      return Promise.all([
        Course.find({
          $or: [{ category: { $in: catIds } }, { examCategory: { $in: catIds } }],
          isPublished: true,
        })
          .populate('teacher', 'name avatar')
          .select('-sections')
          .sort('-enrollmentCount')
          .limit(12)
          .lean(),
        Test.find({
          $or: [{ category: { $in: catIds } }, { examCategory: { $in: catIds } }],
          isPublished: true,
        })
          .populate('teacher', 'name avatar')
          .select('-questions')
          .sort('-totalAttempts')
          .limit(12)
          .lean(),
        TestSeries.find({
          examCategory: { $in: catIds },
          isPublished: true,
        })
          .sort('-isFeatured -createdAt')
          .limit(12)
          .lean(),
        Blog.find({
          $or: [{ examCategory: { $in: catIds } }, { category: { $in: catIds } }],
          status: 'published',
        })
          .sort('-createdAt')
          .limit(5)
          .lean(),
        LibraryItem.find({
          $or: [{ examCategory: { $in: catIds } }, { category: { $in: catIds } }],
          isPublished: true,
        })
          .sort('-downloadsCount -createdAt')
          .limit(12)
          .lean(),
      ]);
    }
  );

  ApiResponse.ok(res, { category, courses, tests, testSeries, blogs, resources });
});

export const createCategory = catchAsync(async (req, res) => {
  const category = await ExamCategory.create({
    ...req.body,
    slug: generateSlug(req.body.name),
  });

  await redis.delPattern('categories:*');

  ApiResponse.created(res, { category }, 'Category created');
});

export const updateCategory = catchAsync(async (req, res) => {
  if (req.body.name) req.body.slug = generateSlug(req.body.name);

  const category = await ExamCategory.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  if (!category) throw ApiError.notFound('Category not found');

  await redis.delPattern('categories:*');

  ApiResponse.ok(res, { category }, 'Category updated');
});

export const deleteCategory = catchAsync(async (req, res) => {
  const category = await ExamCategory.findById(req.params.id);
  if (!category) throw ApiError.notFound('Category not found');

  // Check for courses/tests using this category
  const [courseCount, testCount] = await Promise.all([
    Course.countDocuments({ category: category._id }),
    Test.countDocuments({ category: category._id }),
  ]);

  if (courseCount > 0 || testCount > 0) {
    throw ApiError.badRequest(
      `Cannot delete: ${courseCount} courses and ${testCount} tests use this category`
    );
  }

  await ExamCategory.findByIdAndDelete(req.params.id);
  await redis.delPattern('categories:*');

  ApiResponse.ok(res, null, 'Category deleted');
});

// Admin: get all categories with pagination
export const adminGetCategories = catchAsync(async (req, res) => {
  const pagination = buildPaginationQuery(req.query);

  const filter = {};
  if (req.query.search) filter.name = { $regex: req.query.search, $options: 'i' };
  if (req.query.isActive !== undefined) filter.isActive = req.query.isActive === 'true';

  const result = await ExamCategory.paginate(filter, {
    ...pagination,
    populate: { path: 'parent', select: 'name' },
  });

  ApiResponse.paginated(res, {
    docs: result.docs,
    page: result.pagination.page,
    limit: result.pagination.limit,
    total: result.pagination.total,
  });
});
