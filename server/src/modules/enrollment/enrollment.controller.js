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
  await redis.delPattern('admin:dashboard:*').catch(() => {});

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
            sections: true,
          },
        },
      },
      orderBy: { enrolledAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.enrollment.count({ where: filter }),
  ]);

  const docsWithProgress = docs.map((enrollment) => {
    const course = enrollment.course || {};
    let sections = [];
    if (typeof course.sections === 'string') {
      try {
        sections = JSON.parse(course.sections);
      } catch (e) {}
    } else if (Array.isArray(course.sections)) {
      sections = course.sections;
    }

    const allLessonCount = sections.reduce(
      (acc, s) => acc + (s.lessons || []).filter((l) => l.type !== 'quiz').length,
      0
    );
    const totalLessons = allLessonCount || course.totalLessons || 0;
    const completedCount = Array.isArray(enrollment.completedLessons)
      ? enrollment.completedLessons.length
      : 0;

    const computedProgress =
      totalLessons > 0 ? Math.min(100, Math.round((completedCount / totalLessons) * 100)) : 0;
    const progressPercentage =
      typeof enrollment.progressPercentage === 'number' && enrollment.progressPercentage > 0
        ? enrollment.progressPercentage
        : computedProgress;

    return {
      ...enrollment,
      progressPercentage,
      progress: progressPercentage,
    };
  });

  ApiResponse.paginated(res, {
    docs: docsWithProgress,
    page,
    limit,
    total,
  });
});

export const getMyTestEnrollments = catchAsync(async (req, res) => {
  const payments = await prisma.payment.findMany({
    where: {
      userId: req.userId,
      status: { in: ['captured', 'success', 'completed', 'paid'] },
    },
    orderBy: { createdAt: 'desc' },
  });

  const purchasedTestIds = new Set();
  const purchasedSeriesIds = new Set();

  payments.forEach((p) => {
    const notes = p.notes;
    if (!notes) return;
    if (notes.testId) purchasedTestIds.add(notes.testId);
    if (notes.testSeriesId) purchasedSeriesIds.add(notes.testSeriesId);
    if (notes.itemId) {
      purchasedTestIds.add(notes.itemId);
      purchasedSeriesIds.add(notes.itemId);
    }
  });

  const allPurchasedIds = Array.from(new Set([...purchasedTestIds, ...purchasedSeriesIds]));

  // Fetch corresponding test series and tests
  const [seriesList, testsList] = await Promise.all([
    prisma.testSeries.findMany({
      where: { id: { in: allPurchasedIds } },
      include: { category: { select: { name: true, slug: true } } },
    }),
    prisma.test.findMany({
      where: { id: { in: allPurchasedIds } },
      include: { category: { select: { name: true, slug: true } } },
    }),
  ]);

  const docs = [
    ...seriesList.map((s) => ({
      id: s.id,
      type: 'test_series',
      isSeries: true,
      title: s.title,
      description: s.description,
      testsCount: Array.isArray(s.tests) ? s.tests.length : 0,
      test: {
        id: s.id,
        _id: s.id,
        title: s.title,
        isSeries: true,
        questionsCount: (Array.isArray(s.tests) ? s.tests.length : 0) + ' Tests',
        duration: 'Multiple Tests',
      },
    })),
    ...testsList.map((t) => ({
      id: t.id,
      type: 'test',
      isSeries: false,
      title: t.title,
      description: t.description,
      test: {
        id: t.id,
        _id: t.id,
        title: t.title,
        isSeries: false,
        questionsCount: t.totalQuestions || (Array.isArray(t.questions) ? t.questions.length : 0),
        duration: t.duration,
      },
    })),
  ];

  ApiResponse.paginated(res, {
    docs,
    page: 1,
    limit: docs.length || 10,
    total: docs.length,
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

  let completedLessons = Array.isArray(enrollment.completedLessons)
    ? enrollment.completedLessons.filter((id) => typeof id === 'string' && id.trim().length > 0)
    : [];

  let sections = [];
  if (typeof course.sections === 'string') {
    try {
      sections = JSON.parse(course.sections);
    } catch (e) {}
  } else if (Array.isArray(course.sections)) {
    sections = course.sections;
  }
  const allLessonIds = sections
    .flatMap((s) => (s.lessons || []).map((l) => String(l.id || l._id || '').trim()))
    .filter((id) => id.length > 0);

  let status = enrollment.status;
  let completedAt = enrollment.completedAt;

  if (req.body.completedCourse === true || req.body.markAllComplete === true) {
    completedLessons = Array.from(new Set([...completedLessons, ...allLessonIds]));
  } else if (lessonId !== undefined && lessonId !== null) {
    const lid = String(lessonId).trim();
    if (lid.length > 0) {
      if (completed === false) {
        completedLessons = completedLessons.filter((id) => id !== lid);
      } else if (!completedLessons.includes(lid)) {
        completedLessons.push(lid);
      }
    }
  }

  const totalLessons = allLessonIds.length || course.totalLessons || 0;
  let progressPercentage =
    totalLessons > 0
      ? Math.min(100, Math.round((completedLessons.length / totalLessons) * 100))
      : 0;

  if (progressPercentage >= 100 || req.body.completedCourse === true) {
    status = 'completed';
    progressPercentage = 100;
    if (!completedAt) completedAt = new Date();
  } else if (status === 'completed' && progressPercentage < 100) {
    status = 'active';
    completedAt = null;
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
      completedLessons,
      completedLessonsCount: completedLessons.length,
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

  const [enrollments, allUserPayments] = await Promise.all([
    prisma.enrollment.findMany({
      where: filter,
      include: {
        course: {
          select: {
            id: true,
            title: true,
            slug: true,
            thumbnail: true,
            price: true,
            categoryId: true,
          },
        },
      },
      orderBy: { enrolledAt: 'desc' },
    }),
    prisma.payment.findMany({
      where: {
        userId: req.userId,
        status: { in: ['captured', 'success', 'completed', 'paid'] },
      },
      orderBy: { createdAt: 'desc' },
    }),
  ]);

  const paymentMap = new Map(allUserPayments.map((p) => [p.id, p]));

  // Track which payments are linked to course enrollments
  const linkedPaymentIds = new Set(enrollments.map((e) => e.paymentId).filter(Boolean));

  // Build course orders
  const courseOrders = enrollments.map((e) => {
    const payment = e.paymentId ? paymentMap.get(e.paymentId) : null;
    const paidAmount =
      e.amount !== null && e.amount !== undefined
        ? e.amount
        : payment?.amount || e.course?.price || 0;

    return {
      ...e,
      id: e.id,
      itemType: 'course',
      course: e.course,
      finalPrice: paidAmount,
      amountPaid: paidAmount,
      createdAt: e.enrolledAt,
      paymentId: payment
        ? {
            id: payment.id,
            amount: payment.amount,
            currency: payment.currency,
            status: payment.status,
            orderId: payment.orderId,
            paymentId:
              payment.transactionId ||
              (payment.notes && typeof payment.notes === 'object'
                ? payment.notes.paymentId
                : null) ||
              payment.id,
            provider: payment.transactionId ? 'razorpay' : 'free',
            createdAt: payment.createdAt,
          }
        : null,
    };
  });

  // Find standalone test / test series payments that don't have a course enrollment
  const standalonePayments = allUserPayments.filter((p) => !linkedPaymentIds.has(p.id));

  // Extract target test/series IDs
  const targetSeriesOrTestIds = standalonePayments
    .map((p) => {
      const notes = p.notes || {};
      return notes.testSeriesId || notes.testId || notes.itemId;
    })
    .filter(Boolean);

  const [seriesList, testList] = await Promise.all([
    prisma.testSeries.findMany({
      where: { id: { in: targetSeriesOrTestIds } },
      select: { id: true, title: true, description: true, price: true },
    }),
    prisma.test.findMany({
      where: { id: { in: targetSeriesOrTestIds } },
      select: { id: true, title: true, description: true, duration: true, totalMarks: true },
    }),
  ]);

  const seriesMap = new Map(seriesList.map((s) => [s.id, s]));
  const testMap = new Map(testList.map((t) => [t.id, t]));

  const testOrders = standalonePayments.map((p) => {
    const notes = p.notes || {};
    const targetId = notes.testSeriesId || notes.testId || notes.itemId;
    const series = seriesMap.get(targetId);
    const test = testMap.get(targetId);
    const itemTitle = notes.itemTitle || series?.title || test?.title || 'Test Series Package';

    return {
      id: p.id,
      itemType: series ? 'test_series' : 'test',
      status: 'active',
      progressPercentage: 0,
      amount: p.amount,
      finalPrice: p.amount,
      amountPaid: p.amount,
      createdAt: p.createdAt,
      enrolledAt: p.createdAt,
      test: {
        id: targetId,
        _id: targetId,
        title: itemTitle,
        isSeries: Boolean(series || notes.testSeriesId || notes.testId),
      },
      testSeries: series || null,
      paymentId: {
        id: p.id,
        amount: p.amount,
        currency: p.currency,
        status: p.status,
        orderId: p.orderId,
        paymentId: p.transactionId || notes.paymentId || p.id,
        provider: p.transactionId ? 'razorpay' : 'online',
        createdAt: p.createdAt,
        notes: p.notes,
      },
    };
  });

  const allOrders = [...courseOrders, ...testOrders].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  const paginatedOrders = allOrders.slice(skip, skip + limit);

  ApiResponse.ok(res, {
    orders: paginatedOrders,
    total: allOrders.length,
    page,
    pages: Math.ceil(allOrders.length / limit),
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
