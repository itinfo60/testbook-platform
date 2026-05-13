import Course from './course.model.js';
import Enrollment from '../enrollment/enrollment.model.js';
import Review from '../review/review.model.js';
import ApiError from '../../utils/ApiError.js';
import ApiResponse from '../../utils/ApiResponse.js';
import catchAsync from '../../utils/catchAsync.js';
import redis from '../../config/redis.js';
import { generateSlug } from '../../utils/helpers.js';
import { buildFilterQuery, buildPaginationQuery } from '../../utils/pagination.js';

// ===== PUBLIC =====

export const getCourses = catchAsync(async (req, res) => {
  const pagination = buildPaginationQuery(req.query);

  const filter = buildFilterQuery(req.query, {
    search: { type: 'search', field: 'title' },
    category: { type: 'exact' },
    level: { type: 'exact' },
    price: { type: 'range', field: 'price' },
    isFeatured: { type: 'boolean' },
  });

  // Only show published courses publicly
  filter.isPublished = true;
  filter.isDeleted = { $ne: true };

  // Sort mapping
  const sortMap = {
    newest: '-createdAt',
    oldest: 'createdAt',
    price_low: 'price',
    price_high: '-price',
    rating: '-averageRating',
    popular: '-enrollmentCount',
  };

  const sort = sortMap[req.query.sort] || '-createdAt';

  const result = await Course.paginate(filter, {
    ...pagination,
    sort,
    populate: [
      { path: 'teacher', select: 'name avatar' },
      { path: 'category', select: 'name slug' },
    ],
    select: '-sections',
  });

  ApiResponse.paginated(res, {
    docs: result.docs,
    page: result.pagination.page,
    limit: result.pagination.limit,
    total: result.pagination.total,
  });
});

export const getCourseBySlug = catchAsync(async (req, res) => {
  const { slug } = req.params;

  // Check cache
  const cached = await redis.get(`course:${slug}`);
  if (cached) return ApiResponse.ok(res, cached);

  const course = await Course.findOne({ slug, isPublished: true })
    .populate('teacher', 'name avatar bio teacherProfile')
    .populate('category', 'name slug')
    .lean();

  if (!course) {
    throw ApiError.notFound('Course not found');
  }

  // Get review stats
  const reviews = await Review.find({ course: course._id, isApproved: true })
    .populate('user', 'name avatar')
    .sort('-createdAt')
    .limit(10)
    .lean();

  // Check enrollment status if user is logged in
  let isEnrolled = false;
  if (req.user) {
    const enrollment = await Enrollment.findOne({
      user: req.userId,
      course: course._id,
      status: { $in: ['active', 'completed'] },
    });
    isEnrolled = !!enrollment;
  }

  // Hide lesson content for non-enrolled users (except free previews)
  if (!isEnrolled) {
    course.sections = course.sections.map((section) => ({
      ...section,
      lessons: section.lessons.map((lesson) => ({
        _id: lesson._id,
        title: lesson.title,
        type: lesson.type,
        duration: lesson.duration,
        isFree: lesson.isFree,
        content: lesson.isFree ? lesson.content : undefined,
        videoUrl: lesson.isFree ? lesson.videoUrl : undefined,
      })),
    }));
  }

  const data = { course, reviews, isEnrolled };

  // Cache for 5 minutes
  await redis.set(`course:${slug}`, data, 300);

  ApiResponse.ok(res, data);
});

export const getCourseById = catchAsync(async (req, res) => {
  const course = await Course.findById(req.params.id)
    .populate('teacher', 'name avatar')
    .populate('category', 'name slug');

  if (!course) {
    throw ApiError.notFound('Course not found');
  }

  ApiResponse.ok(res, { course });
});

// ===== TEACHER =====

export const createCourse = catchAsync(async (req, res) => {
  const slug = generateSlug(req.body.title);

  const course = await Course.create({
    ...req.body,
    slug,
    teacher: req.userId,
    status: 'draft',
    isPublished: false,
  });

  await redis.delPattern('courses:*');

  ApiResponse.created(res, { course }, 'Course created successfully');
});

export const updateCourse = catchAsync(async (req, res) => {
  const course = await Course.findOne({
    _id: req.params.id,
    teacher: req.userId,
  });

  if (!course) {
    throw ApiError.notFound('Course not found or unauthorized');
  }

  // If title changed, update slug
  if (req.body.title && req.body.title !== course.title) {
    req.body.slug = generateSlug(req.body.title);
  }

  Object.assign(course, req.body);
  await course.save();

  // Clear caches
  await redis.delPattern('courses:*');
  await redis.del(`course:${course.slug}`);

  ApiResponse.ok(res, { course }, 'Course updated successfully');
});

export const deleteCourse = catchAsync(async (req, res) => {
  const course = await Course.findOne({
    _id: req.params.id,
    teacher: req.userId,
  });

  if (!course) {
    throw ApiError.notFound('Course not found or unauthorized');
  }

  // Check if anyone is enrolled
  const enrollmentCount = await Enrollment.countDocuments({ course: course._id });
  if (enrollmentCount > 0) {
    // Soft delete instead
    await course.softDelete(req.userId);
  } else {
    await Course.findByIdAndDelete(course._id);
  }

  await redis.delPattern('courses:*');
  await redis.del(`course:${course.slug}`);

  ApiResponse.ok(res, null, 'Course deleted successfully');
});

export const getTeacherCourses = catchAsync(async (req, res) => {
  const pagination = buildPaginationQuery(req.query);

  const filter = { teacher: req.userId };
  if (req.query.status) filter.status = req.query.status;
  if (req.query.search) filter.title = { $regex: req.query.search, $options: 'i' };

  const result = await Course.paginate(filter, {
    ...pagination,
    populate: { path: 'category', select: 'name' },
  });

  ApiResponse.paginated(res, {
    docs: result.docs,
    page: result.pagination.page,
    limit: result.pagination.limit,
    total: result.pagination.total,
  });
});

export const publishCourse = catchAsync(async (req, res) => {
  const course = await Course.findOne({ _id: req.params.id, teacher: req.userId });

  if (!course) {
    throw ApiError.notFound('Course not found');
  }

  // Validate course is ready for publishing
  if (!course.sections.length) {
    throw ApiError.badRequest('Course must have at least one section');
  }

  const hasLessons = course.sections.some((s) => s.lessons.length > 0);
  if (!hasLessons) {
    throw ApiError.badRequest('Course must have at least one lesson');
  }

  if (!course.thumbnail?.url) {
    throw ApiError.badRequest('Course must have a thumbnail');
  }

  course.status = 'published';
  course.isPublished = true;
  course.publishedAt = new Date();
  await course.save();

  await redis.delPattern('courses:*');

  ApiResponse.ok(res, { course }, 'Course published successfully');
});

export const getFeaturedCourses = catchAsync(async (req, res) => {
  const cached = await redis.get('courses:featured');
  if (cached) return ApiResponse.ok(res, cached);

  const courses = await Course.find({
    isPublished: true,
    isFeatured: true,
    isDeleted: { $ne: true },
  })
    .populate('teacher', 'name avatar')
    .populate('category', 'name slug')
    .select('-sections')
    .sort('-enrollmentCount')
    .limit(8)
    .lean();

  await redis.set('courses:featured', { courses }, 1800); // 30 min cache

  ApiResponse.ok(res, { courses });
});
