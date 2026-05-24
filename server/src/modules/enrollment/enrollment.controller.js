import Enrollment from './enrollment.model.js';
import Course from '../course/course.model.js';
import User from '../user/user.model.js';
import Payment from '../payment/payment.model.js';
import ApiError from '../../utils/ApiError.js';
import ApiResponse from '../../utils/ApiResponse.js';
import catchAsync from '../../utils/catchAsync.js';
import redis from '../../config/redis.js';
import emailService from '../../utils/email.js';
import { buildPaginationQuery } from '../../utils/pagination.js';

export const enrollInCourse = catchAsync(async (req, res) => {
  const { courseId, paymentId } = req.body;

  const course = await Course.findById(courseId);
  if (!course) {
    throw ApiError.notFound('Course not found');
  }

  // Check if already enrolled
  const existing = await Enrollment.findOne({ user: req.userId, course: courseId });
  if (existing) {
    if (existing.status === 'refunded') {
      existing.status = 'active';
      existing.enrolledAt = new Date();
      await existing.save();
      return ApiResponse.ok(res, { enrollment: existing }, 'Re-enrolled successfully');
    }
    throw ApiError.conflict('Already enrolled in this course');
  }

  let amountPaid = 0;

  // If paid course, verify payment
  if (course.effectivePrice > 0) {
    if (!paymentId) {
      throw ApiError.badRequest('Payment is required for this course');
    }
    const payment = await Payment.findOne({
      _id: paymentId,
      user: req.userId,
      course: courseId,
      status: 'completed',
    });
    if (!payment) {
      throw ApiError.badRequest('Valid payment not found');
    }
    amountPaid = payment.amount;
  }

  const enrollment = await Enrollment.create({
    user: req.userId,
    course: courseId,
    amountPaid,
    paymentId: paymentId || undefined,
  });

  // Update course enrollment count
  await Course.findByIdAndUpdate(courseId, { $inc: { enrollmentCount: 1 } });

  // Update user enrolled courses count
  await User.findByIdAndUpdate(req.userId, { $inc: { enrolledCourses: 1 } });

  // Clear caches
  await redis.delPattern('courses:*');

  // Send confirmation email (non-blocking)
  const user = await User.findById(req.userId);
  emailService.sendEnrollmentConfirmation(user, course).catch(() => {});

  ApiResponse.created(res, { enrollment }, 'Enrolled successfully');
});

export const getMyEnrollments = catchAsync(async (req, res) => {
  const pagination = buildPaginationQuery(req.query);

  const filter = { user: req.userId, course: { $exists: true } };
  if (req.query.status) filter.status = req.query.status;

  const result = await Enrollment.paginate(filter, {
    ...pagination,
    populate: [
      { path: 'course', select: 'title slug thumbnail teacher totalLessons totalDuration averageRating' },
    ],
    sort: '-enrolledAt',
  });

  ApiResponse.paginated(res, {
    docs: result.docs,
    page: result.pagination.page,
    limit: result.pagination.limit,
    total: result.pagination.total,
  });
});

export const getMyTestEnrollments = catchAsync(async (req, res) => {
  const pagination = buildPaginationQuery(req.query);

  const filter = { user: req.userId, test: { $exists: true } };
  if (req.query.status) filter.status = req.query.status;

  const result = await Enrollment.paginate(filter, {
    ...pagination,
    populate: [
      { path: 'test', select: 'title slug thumbnail description price isFree duration totalMarks questionsCount' },
    ],
    sort: '-enrolledAt',
  });

  ApiResponse.paginated(res, {
    docs: result.docs,
    page: result.pagination.page,
    limit: result.pagination.limit,
    total: result.pagination.total,
  });
});

export const getEnrollmentProgress = catchAsync(async (req, res) => {
  const enrollment = await Enrollment.findOne({
    user: req.userId,
    course: req.params.courseId,
  }).populate('course', 'title sections totalLessons');

  if (!enrollment) {
    throw ApiError.notFound('Enrollment not found');
  }

  ApiResponse.ok(res, { enrollment });
});

export const updateProgress = catchAsync(async (req, res) => {
  const { sectionId, lessonId, completed, watchTime, lastPosition } = req.body;

  const enrollment = await Enrollment.findOne({
    user: req.userId,
    course: req.params.courseId,
    status: 'active',
  });

  if (!enrollment) {
    throw ApiError.notFound('Active enrollment not found');
  }

  const course = await Course.findById(req.params.courseId);
  if (!course) {
    throw ApiError.notFound('Course not found');
  }

  enrollment.updateLessonProgress(sectionId, lessonId, {
    completed,
    watchTime,
    lastPosition,
  });

  enrollment.recalculateProgress(course.totalLessons);
  enrollment.lastAccessedAt = new Date();
  await enrollment.save();

  // Update user stats if course completed
  if (enrollment.status === 'completed') {
    await User.findByIdAndUpdate(req.userId, { $inc: { completedCourses: 1 } });
    await redis.del(`user_${req.userId}`);
  }

  ApiResponse.ok(res, {
    progress: enrollment.progressPercentage,
    status: enrollment.status,
    completedLessons: enrollment.progress.filter((p) => p.completed).length,
    totalLessons: course.totalLessons,
  }, 'Progress updated');
});

export const checkEnrollment = catchAsync(async (req, res) => {
  const enrollment = await Enrollment.findOne({
    user: req.userId,
    course: req.params.courseId,
    status: { $in: ['active', 'completed'] },
  });

  ApiResponse.ok(res, {
    isEnrolled: !!enrollment,
    enrollment: enrollment || null,
  });
});

export const getTeacherStudents = catchAsync(async (req, res) => {
  // Get all courses by this teacher
  const courses = await Course.find({ teacher: req.userId }, '_id title').lean();
  const courseIds = courses.map(c => c._id);

  if (courseIds.length === 0) {
    return ApiResponse.ok(res, { students: [], total: 0 });
  }

  const enrollments = await Enrollment.find({ course: { $in: courseIds }, status: { $in: ['active', 'completed'] } })
    .populate('user', 'name email avatar createdAt')
    .populate('course', 'title thumbnail')
    .sort('-enrolledAt')
    .lean();

  ApiResponse.ok(res, { students: enrollments, total: enrollments.length });
});
