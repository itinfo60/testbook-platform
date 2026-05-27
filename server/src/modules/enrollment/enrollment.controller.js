import Enrollment from './enrollment.model.js';
import Course from '../course/course.model.js';
import User from '../user/user.model.js';
import Payment from '../payment/payment.model.js';
import ApiError from '../../utils/ApiError.js';
import ApiResponse from '../../utils/ApiResponse.js';
import catchAsync from '../../utils/catchAsync.js';
import redis from '../../config/redis.js';
import { transactionalEmailQueue, notificationQueue } from '../../queues/index.js';
import { scheduleDripContent } from '../../utils/dripScheduler.js';
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

  // Schedule drip content unlocks
  await scheduleDripContent({ enrollment, course, tenantId: req.tenantId });

  // Queue confirmation email + in-app notification
  const user = await User.findById(req.userId);
  await transactionalEmailQueue.add('send', {
    type: 'enrollment_confirmation',
    data: { user, course },
  });
  await notificationQueue.add('send', {
    type: 'enrollment',
    userId: req.userId,
    tenantId: req.tenantId,
    title: 'Enrolled Successfully',
    message: `You are now enrolled in "${course.title}"`,
    data: { courseId: course._id },
  });

  ApiResponse.created(res, { enrollment }, 'Enrolled successfully');
});

export const getMyEnrollments = catchAsync(async (req, res) => {
  const pagination = buildPaginationQuery(req.query);

  const filter = { user: req.userId, course: { $exists: true } };
  if (req.query.status) filter.status = req.query.status;

  const result = await Enrollment.paginate(filter, {
    ...pagination,
    populate: [
      {
        path: 'course',
        select: 'title slug thumbnail teacher totalLessons totalDuration averageRating',
      },
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
      {
        path: 'test',
        select: 'title slug thumbnail description price isFree duration totalMarks questionsCount',
      },
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

  ApiResponse.ok(
    res,
    {
      progress: enrollment.progressPercentage,
      status: enrollment.status,
      completedLessons: enrollment.progress.filter((p) => p.completed).length,
      totalLessons: course.totalLessons,
    },
    'Progress updated'
  );
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
  const courseIds = courses.map((c) => c._id);

  if (courseIds.length === 0) {
    return ApiResponse.ok(res, { students: [], total: 0 });
  }

  const enrollments = await Enrollment.find({
    course: { $in: courseIds },
    status: { $in: ['active', 'completed'] },
  })
    .populate('user', 'name email avatar createdAt')
    .populate('course', 'title thumbnail')
    .sort('-enrolledAt')
    .lean();

  ApiResponse.ok(res, { students: enrollments, total: enrollments.length });
});

export const verifyPayment = catchAsync(async (req, res) => {
  const { id } = req.params; // enrollment id
  const enrollment = await Enrollment.findById(id);
  if (!enrollment) {
    throw ApiError.notFound('Enrollment not found');
  }
  if (String(enrollment.user) !== String(req.userId)) {
    throw ApiError.forbidden('Not authorized to verify this enrollment');
  }
  if (enrollment.status !== 'pending') {
    throw ApiError.badRequest('Enrollment status is not pending');
  }
  // Ensure payment is completed
  const payment = await Payment.findOne({ _id: enrollment.paymentId, status: 'completed' });
  if (!payment) {
    throw ApiError.badRequest('Associated payment not completed');
  }
  enrollment.status = 'active';
  enrollment.enrolledAt = new Date();
  await enrollment.save();

  // Optional notifications
  await transactionalEmailQueue.add('send', {
    type: 'enrollment_confirmation',
    data: { user: req.userId, course: enrollment.course },
  });
  await notificationQueue.add('send', {
    type: 'enrollment',
    userId: req.userId,
    tenantId: req.tenantId,
    title: 'Enrollment Verified',
    message: `Your enrollment has been verified and is now active`,
    data: { enrollmentId: enrollment._id },
  });

  ApiResponse.ok(res, { enrollment }, 'Enrollment verified');
});
