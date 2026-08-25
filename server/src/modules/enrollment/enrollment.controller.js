import prisma from '../../config/prisma.js';
import ApiError from '../../utils/ApiError.js';
import ApiResponse from '../../utils/ApiResponse.js';
import catchAsync from '../../utils/catchAsync.js';
import redis from '../../config/redis.js';
import { transactionalEmailQueue, notificationQueue } from '../../queues/index.js';
import { scheduleDripContent } from '../../utils/dripScheduler.js';

export const enrollInCourse = catchAsync(async (req, res) => {
  const { courseId, paymentId } = req.body;

  const course = await prisma.course.findFirst({
    where: { OR: [{ id: courseId }, { slug: courseId }] },
  });

  if (!course) {
    throw ApiError.notFound('Course not found');
  }

  const existing = await prisma.enrollment.findFirst({
    where: {
      userId: req.userId,
      courseId: course.id,
      status: { notIn: ['refunded'] },
    },
  });

  if (existing) {
    if (existing.status === 'pending') {
      if (course.price > 0) {
        throw ApiError.conflict('Payment already initiated for this course');
      }
    } else {
      throw ApiError.conflict('Already enrolled in this course');
    }
  }

  // Ensure payment is verified if course is not free
  if (course.price > 0) {
    if (!paymentId) throw ApiError.badRequest('Payment required for paid courses');
    const payment = await prisma.payment.findFirst({
      where: { id: paymentId, status: 'completed' },
    });
    if (!payment) throw ApiError.badRequest('Valid completed payment required');
  }

  const enrollment = await prisma.enrollment.create({
    data: {
      userId: req.userId,
      courseId: course.id,
      status: 'active',
      amount: course.price,
      paymentId: paymentId || null,
    },
  });

  await scheduleDripContent(req.userId, course.id);

  ApiResponse.created(res, { enrollment }, 'Enrolled successfully');
});

export const getMyEnrollments = catchAsync(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  const filter = { userId: req.userId };
  if (req.query.status) filter.status = req.query.status;

  const [docs, total] = await Promise.all([
    prisma.enrollment.findMany({
      where: filter,
      include: {
        course: {
          select: {
            title: true,
            slug: true,
            thumbnail: true,
            description: true,
            price: true,
            totalLessons: true,
            totalDuration: true,
          },
        },
      },
      orderBy: { enrolledAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.enrollment.count({ where: filter }),
  ]);

  ApiResponse.paginated(res, {
    docs,
    page,
    limit,
    total,
  });
});

export const getMyTestEnrollments = catchAsync(async (req, res) => {
  // Assuming test series is handled similarly
  ApiResponse.paginated(res, {
    docs: [],
    page: 1,
    limit: 10,
    total: 0,
  });
});

export const getEnrollmentProgress = catchAsync(async (req, res) => {
  const { courseId } = req.params;

  const course = await prisma.course.findFirst({
    where: { OR: [{ id: courseId }, { slug: courseId }] },
  });
  if (!course) throw ApiError.notFound('Course not found');

  const enrollment = await prisma.enrollment.findFirst({
    where: { userId: req.userId, courseId: course.id },
    include: { course: { select: { title: true, sections: true, totalLessons: true } } },
  });

  if (!enrollment) throw ApiError.notFound('Enrollment not found');

  ApiResponse.ok(res, { enrollment });
});

export const updateProgress = catchAsync(async (req, res) => {
  const { lessonId, completed } = req.body;
  const { courseId } = req.params;

  const course = await prisma.course.findFirst({
    where: { OR: [{ id: courseId }, { slug: courseId }] },
  });

  if (!course) throw ApiError.notFound('Course not found');

  const enrollment = await prisma.enrollment.findFirst({
    where: {
      userId: req.userId,
      courseId: course.id,
      status: { in: ['active', 'completed'] },
    },
  });

  if (!enrollment) throw ApiError.notFound('Active enrollment not found');

  let completedLessons = enrollment.completedLessons || [];
  if (completed && !completedLessons.includes(lessonId)) {
    completedLessons.push(lessonId);
  }

  const totalLessons = course.totalLessons || 0;
  let progressPercentage =
    totalLessons > 0 ? Math.round((completedLessons.length / totalLessons) * 100) : 0;
  let status = enrollment.status;
  let completedAt = enrollment.completedAt;

  if (progressPercentage >= 100) {
    status = 'completed';
    completedAt = new Date();
  }

  await prisma.enrollment.update({
    where: { id: enrollment.id },
    data: {
      completedLessons,
      progressPercentage,
      status,
      completedAt,
    },
  });

  if (status === 'completed' && enrollment.status !== 'completed') {
    // optional update user stats
    await redis.del(`user_${req.userId}`);
  }

  ApiResponse.ok(
    res,
    {
      progress: progressPercentage,
      status,
      completedLessons: completedLessons.length,
      totalLessons: course.totalLessons,
    },
    'Progress updated'
  );
});

export const checkEnrollment = catchAsync(async (req, res) => {
  const { courseId } = req.params;
  const course = await prisma.course.findFirst({
    where: { OR: [{ id: courseId }, { slug: courseId }] },
  });

  if (!course)
    return ApiResponse.ok(res, { isEnrolled: false, isPending: false, enrollment: null });

  const enrollment = await prisma.enrollment.findFirst({
    where: {
      userId: req.userId,
      courseId: course.id,
      status: { in: ['active', 'completed', 'pending'] },
    },
  });

  ApiResponse.ok(res, {
    isEnrolled: !!enrollment && enrollment.status !== 'pending',
    isPending: enrollment?.status === 'pending',
    enrollment: enrollment || null,
  });
});

export const getTeacherStudents = catchAsync(async (req, res) => {
  const courses = await prisma.course.findMany({
    where: { teacherId: req.userId },
    select: { id: true },
  });
  const courseIds = courses.map((c) => c.id);

  if (courseIds.length === 0) {
    return ApiResponse.ok(res, { students: [], total: 0 });
  }

  const enrollments = await prisma.enrollment.findMany({
    where: {
      courseId: { in: courseIds },
      status: { in: ['active', 'completed'] },
    },
    include: {
      user: { select: { name: true, email: true, avatar: true, createdAt: true } },
      course: { select: { title: true, thumbnail: true } },
    },
    orderBy: { enrolledAt: 'desc' },
  });

  ApiResponse.ok(res, { students: enrollments, total: enrollments.length });
});

export const getOrderHistory = catchAsync(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const skip = (page - 1) * limit;

  const filter = { userId: req.userId };
  if (req.query.status) filter.status = req.query.status;

  const [enrollments, total] = await Promise.all([
    prisma.enrollment.findMany({
      where: filter,
      include: {
        course: {
          select: { title: true, slug: true, thumbnail: true, price: true, categoryId: true },
        },
      },
      orderBy: { enrolledAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.enrollment.count({ where: filter }),
  ]);

  ApiResponse.ok(res, {
    orders: enrollments,
    total,
    page,
    pages: Math.ceil(total / limit),
  });
});

export const verifyPayment = catchAsync(async (req, res) => {
  const { id } = req.params;
  const enrollment = await prisma.enrollment.findUnique({ where: { id } });
  if (!enrollment) throw ApiError.notFound('Enrollment not found');
  if (enrollment.userId !== req.userId)
    throw ApiError.forbidden('Not authorized to verify this enrollment');
  if (enrollment.status !== 'pending')
    throw ApiError.badRequest('Enrollment status is not pending');

  const payment = await prisma.payment.findFirst({
    where: { id: enrollment.paymentId, status: 'completed' },
  });
  if (!payment) throw ApiError.badRequest('Associated payment not completed');

  const updated = await prisma.enrollment.update({
    where: { id },
    data: { status: 'active', enrolledAt: new Date() },
  });

  await transactionalEmailQueue.add('send', {
    type: 'enrollment_confirmation',
    data: { user: req.userId, course: enrollment.courseId },
  });

  ApiResponse.ok(res, { enrollment: updated }, 'Enrollment verified');
});

export const getStudentPerformanceAnalytics = catchAsync(async (req, res) => {
  const user = await prisma.user.findUnique({ where: { id: req.userId } });
  if (!user) throw ApiError.notFound('User not found');

  const enrollments = await prisma.enrollment.findMany({ where: { userId: req.userId } });

  const totalCourses = enrollments.length;
  let totalProgress = 0;
  enrollments.forEach((enr) => {
    totalProgress += enr.progressPercentage || 0;
  });

  const averageCourseProgress = totalCourses > 0 ? totalProgress / totalCourses : 0;

  const analytics = {
    averageCourseProgress: Math.round(averageCourseProgress),
    totalCoursesEnrolled: totalCourses,
    averageTestScore: 68,
    studyStreak: 0,
    learningTimeMinutes: 760,
  };

  ApiResponse.ok(res, { analytics }, 'Performance analytics fetched');
});

export const revokeEnrollment = catchAsync(async (req, res) => {
  const { id } = req.params;

  const enrollment = await prisma.enrollment.findUnique({ where: { id } });
  if (!enrollment) throw ApiError.notFound('Enrollment not found');

  await prisma.enrollment.delete({ where: { id } });

  ApiResponse.ok(res, null, 'Enrollment revoked successfully');
});
