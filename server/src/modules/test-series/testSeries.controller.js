import mongoose from 'mongoose';
import TestSeries from './testSeries.model.js';
import Test from '../test/test.model.js';
import TestAttempt from '../test/testAttempt.model.js';
import Enrollment from '../enrollment/enrollment.model.js';
import ExamCategory from '../exam-category/examCategory.model.js';
import ApiError from '../../utils/ApiError.js';
import ApiResponse from '../../utils/ApiResponse.js';
import catchAsync from '../../utils/catchAsync.js';
import { runWithTenant } from '../../utils/TenantContext.js';
import { generateSlug } from '../../utils/helpers.js';

export const getTestSeries = catchAsync(async (req, res) => {
  const { examCategory, testType, isFree, search, page = 1, limit = 20 } = req.query;

  const filter = { isPublished: true };

  if (examCategory) {
    const isId = mongoose.Types.ObjectId.isValid(examCategory);
    if (isId) {
      filter.examCategory = examCategory;
    } else {
      const catObj = await runWithTenant(null, true, async () =>
        ExamCategory.findOne({ slug: examCategory })
      );
      if (catObj) filter.examCategory = catObj._id;
    }
  }

  if (testType && testType !== 'all') {
    filter.testType = testType;
  }

  if (isFree !== undefined && isFree !== '') {
    filter.isFree = isFree === 'true';
  }

  if (search) {
    filter.$or = [
      { title: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } },
    ];
  }

  const result = await runWithTenant(null, true, async () => {
    const skip = (Number(page) - 1) * Number(limit);
    const [seriesList, total] = await Promise.all([
      TestSeries.find(filter)
        .populate('examCategory', 'name slug icon')
        .sort('-isFeatured -createdAt')
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      TestSeries.countDocuments(filter),
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
  const isId = mongoose.Types.ObjectId.isValid(param);

  // 1. Direct query by ID or exact slug
  let series = await runWithTenant(null, true, async () => {
    return TestSeries.findOne({
      $or: [
        ...(isId ? [{ _id: param }] : []),
        { slug: new RegExp(`^${param}$`, 'i') },
        { slug: new RegExp(`^${cleanParam}$`, 'i') },
        { slug: new RegExp(`^${cleanParam}-full_length-series$`, 'i') },
        { slug: new RegExp(`^${cleanParam}-series$`, 'i') },
      ],
    })
      .populate('examCategory', 'name slug icon')
      .lean();
  });

  // 2. Partial / Keyword search by title or slug regex
  if (!series && cleanParam) {
    series = await runWithTenant(null, true, async () => {
      return TestSeries.findOne({
        $or: [
          { slug: { $regex: cleanParam.split('-')[0], $options: 'i' } },
          { title: { $regex: cleanParam.replace(/-/g, ' '), $options: 'i' } },
          { title: { $regex: cleanParam.split('-')[0], $options: 'i' } },
        ],
      })
        .populate('examCategory', 'name slug icon')
        .lean();
    });
  }

  let targetCatIds = [];

  // 3. Category match search
  if (!series) {
    const category = await runWithTenant(null, true, async () => {
      return ExamCategory.findOne({
        $or: [
          ...(isId ? [{ _id: param }] : []),
          { slug: new RegExp(`^${param}$`, 'i') },
          { slug: new RegExp(`^${cleanParam}$`, 'i') },
          { slug: { $regex: cleanParam.split('-')[0], $options: 'i' } },
          { name: { $regex: cleanParam.replace(/-/g, ' '), $options: 'i' } },
        ],
      })
        .populate('subcategories')
        .lean();
    });

    if (category) {
      const subIds = (category.subcategories || []).map((s) => s._id);
      targetCatIds = [category._id, ...subIds];

      series = await runWithTenant(null, true, async () => {
        return TestSeries.findOne({ examCategory: { $in: targetCatIds } })
          .populate('examCategory', 'name slug icon')
          .lean();
      });
    }
  }

  // 4. Default fallback to top test series if not found
  if (!series) {
    series = await runWithTenant(null, true, async () => {
      return TestSeries.findOne({ isPublished: true })
        .populate('examCategory', 'name slug icon')
        .lean();
    });
  }

  if (!series) throw ApiError.notFound('Test Series not found');

  if (series.examCategory) {
    const catId = series.examCategory._id || series.examCategory;
    targetCatIds = [catId];
  }

  const tests = await runWithTenant(null, true, async () => {
    return Test.find({
      $or: [
        { testSeries: series._id },
        { category: { $in: targetCatIds } },
        { examCategory: { $in: targetCatIds } },
      ],
      isPublished: true,
    })
      .select('-questions')
      .sort('testNumber createdAt')
      .lean();
  });

  let userAttemptsMap = {};
  let isPurchased = Boolean(series.isFree || series.price === 0);

  const currentUserId = req.user?._id || req.userId;
  if (currentUserId) {
    const isEnrolled = await Enrollment.exists({
      user: currentUserId,
      $or: [{ testSeries: series._id }, { test: series._id }],
      status: { $in: ['active', 'completed'] },
    });
    if (isEnrolled) {
      isPurchased = true;
    }

    const testIds = tests.map((t) => t._id);
    const attempts = await TestAttempt.find({
      user: currentUserId,
      test: { $in: testIds },
    })
      .sort('-createdAt')
      .lean();

    attempts.forEach((att) => {
      const tId = att.test.toString();
      if (!userAttemptsMap[tId] || att.status === 'submitted') {
        userAttemptsMap[tId] = {
          attemptId: att._id,
          status: att.status,
          score: att.score,
          accuracy: att.accuracy,
          totalMarks: att.totalMarks,
          submittedAt: att.submittedAt,
        };
      }
    });
  }

  const enrichedTests = tests.map((t, idx) => ({
    ...t,
    isPurchased: isPurchased || t.isPurchased || false,
    testNumber: t.testNumber || idx + 1,
    userAttempt: userAttemptsMap[t._id.toString()] || null,
  }));

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
  const series = await TestSeries.create({
    ...req.body,
    slug: generateSlug(req.body.title),
    tenantId: req.user.tenantId || new mongoose.Types.ObjectId('6a7aad3a7ad4fc7bce698ffd'),
  });
  ApiResponse.created(res, { testSeries: series }, 'Test series created successfully');
});

export const updateTestSeries = catchAsync(async (req, res) => {
  const series = await TestSeries.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });
  if (!series) throw ApiError.notFound('Test series not found');
  ApiResponse.ok(res, { testSeries: series }, 'Test series updated successfully');
});

export const deleteTestSeries = catchAsync(async (req, res) => {
  const series = await TestSeries.findByIdAndDelete(req.params.id);
  if (!series) throw ApiError.notFound('Test series not found');
  ApiResponse.ok(res, null, 'Test series deleted successfully');
});
