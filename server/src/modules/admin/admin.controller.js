import prisma from '../../config/prisma.js';
import ApiResponse from '../../utils/ApiResponse.js';
import ApiError from '../../utils/ApiError.js';
import catchAsync from '../../utils/catchAsync.js';
import redis from '../../config/redis.js';
import { buildPaginationQuery, buildFilterQuery } from '../../utils/pagination.js';
import { getDateRange, generateSlug } from '../../utils/helpers.js';
import { runWithTenant } from '../../utils/TenantContext.js';
import { reminderQueue, transactionalEmailQueue } from '../../queues/index.js';
import bcrypt from 'bcryptjs';

// ===== DASHBOARD =====

export const getDashboardStats = catchAsync(async (req, res) => {
  const periodDays = parseInt(req.query.period) || 30;
  const tenantId = req.tenantId || 'global';
  const cacheKey = `admin:dashboard:${tenantId}:${periodDays}`;

  if (req.query.refresh !== 'true') {
    const cached = await redis.get(cacheKey);
    if (cached)
      return ApiResponse.ok(res, typeof cached === 'string' ? JSON.parse(cached) : cached);
  }

  const now = new Date();
  const periodStart = new Date(now.getTime() - periodDays * 86400000);
  const prevPeriodStart = new Date(now.getTime() - 2 * periodDays * 86400000);
  const prevPeriodEnd = periodStart;

  const tenantFilter = req.tenantId ? { tenantId: req.tenantId } : {};

  const [
    totalUsers,
    totalStudents,
    newUsersThisPeriod,
    newUsersPrevPeriod,
    activeUsersCount,
    totalCourseEnrollments,
    totalTSEnrollments,
    courseEnrollmentsThisPeriod,
    tsEnrollmentsThisPeriod,
    courseEnrollmentsPrevPeriod,
    tsEnrollmentsPrevPeriod,
    paidCourseEnrollments,
    paidTSEnrollments,
    freeCourseEnrollments,
    freeTSEnrollments,
    completedEnrollments,
    completedEnrollmentsThisPeriod,
    completedEnrollmentsPrevPeriod,
    activeCourseEnrollments,
    activeTSEnrollments,
    avgProgressAgg,
    allEnrollmentsLessons,
    totalTestsAttempted,
    testScoresAgg,
    passedAttemptsCount,
    totalQuizzesAttempted,
    totalCourses,
    publishedCourses,
    draftCourses,
    totalTestSeries,
    totalTests,
    draftTests,
    totalQuizzes,
    totalLibrary,
    totalLiveClasses,
    upcomingLiveClasses,
    totalBlogs,
    totalReviews,
    unapprovedReviews,
    avgRatingAgg,
    totalTeachers,
    unverifiedTeachers,
    failedPayments,
    recentUsers,
    recentCourseEnrollments,
    recentTSEnrollments,
    revenueStatsRaw,
    revenueThisPeriodAgg,
    revenuePrevPeriodAgg,
    topCoursesRaw,
    topTeachersRaw,
    topQuizRaw,
    topTestSeriesRaw,
    topTestRaw,
  ] = await Promise.all([
    prisma.user.count({ where: { ...tenantFilter, isActive: true } }),
    prisma.user.count({ where: { ...tenantFilter, role: 'student' } }),
    prisma.user.count({
      where: { ...tenantFilter, isActive: true, createdAt: { gte: periodStart } },
    }),
    prisma.user.count({
      where: {
        ...tenantFilter,
        isActive: true,
        createdAt: { gte: prevPeriodStart, lt: prevPeriodEnd },
      },
    }),
    prisma.user.count({ where: { ...tenantFilter, isActive: true } }),
    prisma.enrollment.count({ where: { ...tenantFilter } }),
    prisma.testSeriesEnrollment.count({ where: { ...tenantFilter } }),
    prisma.enrollment.count({ where: { ...tenantFilter, enrolledAt: { gte: periodStart } } }),
    prisma.testSeriesEnrollment.count({
      where: { ...tenantFilter, enrolledAt: { gte: periodStart } },
    }),
    prisma.enrollment.count({
      where: {
        ...tenantFilter,
        enrolledAt: { gte: prevPeriodStart, lt: prevPeriodEnd },
      },
    }),
    prisma.testSeriesEnrollment.count({
      where: {
        ...tenantFilter,
        enrolledAt: { gte: prevPeriodStart, lt: prevPeriodEnd },
      },
    }),
    prisma.enrollment.count({ where: { ...tenantFilter, amount: { gt: 0 } } }),
    prisma.testSeriesEnrollment.count({ where: { ...tenantFilter, amount: { gt: 0 } } }),
    prisma.enrollment.count({ where: { ...tenantFilter, amount: 0 } }),
    prisma.testSeriesEnrollment.count({ where: { ...tenantFilter, amount: 0 } }),
    prisma.enrollment.count({ where: { ...tenantFilter, status: 'completed' } }),
    prisma.enrollment.count({
      where: { ...tenantFilter, status: 'completed', completedAt: { gte: periodStart } },
    }),
    prisma.enrollment.count({
      where: {
        ...tenantFilter,
        status: 'completed',
        completedAt: { gte: prevPeriodStart, lt: prevPeriodEnd },
      },
    }),
    prisma.enrollment.count({ where: { ...tenantFilter, status: 'active' } }),
    prisma.testSeriesEnrollment.count({ where: { ...tenantFilter, status: 'active' } }),
    prisma.enrollment.aggregate({ where: { ...tenantFilter }, _avg: { progressPercentage: true } }),
    prisma.enrollment.findMany({
      where: { ...tenantFilter },
      select: { completedLessons: true },
    }),
    prisma.testAttempt.count({ where: { ...tenantFilter } }),
    prisma.testAttempt.aggregate({ where: { ...tenantFilter }, _avg: { percentage: true } }),
    prisma.testAttempt.count({ where: { ...tenantFilter, percentage: { gte: 50 } } }),
    prisma.quizAttempt
      ? prisma.quizAttempt.count({ where: { ...tenantFilter } }).catch(() => 0)
      : Promise.resolve(0),
    prisma.course.count({ where: { ...tenantFilter } }),
    prisma.course.count({ where: { ...tenantFilter, isPublished: true } }),
    prisma.course.count({ where: { ...tenantFilter, isPublished: false } }),
    prisma.testSeries.count({ where: { ...tenantFilter } }),
    prisma.test.count({ where: { ...tenantFilter } }),
    prisma.test.count({ where: { ...tenantFilter, isPublished: false } }),
    prisma.quiz.count({ where: { ...tenantFilter } }),
    prisma.library.count({ where: { ...tenantFilter } }),
    prisma.liveClass.count({ where: { ...tenantFilter } }),
    prisma.liveClass.count({ where: { ...tenantFilter, status: 'scheduled' } }),
    prisma.blog.count({ where: { ...tenantFilter } }),
    prisma.review.count({ where: { ...tenantFilter } }),
    prisma.review.count({ where: { ...tenantFilter, isApproved: false } }),
    prisma.review.aggregate({ where: { ...tenantFilter }, _avg: { rating: true } }),
    prisma.user.count({ where: { ...tenantFilter, role: 'teacher' } }),
    prisma.user.count({
      where: {
        ...tenantFilter,
        role: 'teacher',
        OR: [{ isActive: false }, { isEmailVerified: false }],
      },
    }),
    prisma.payment.count({ where: { ...tenantFilter, status: { in: ['failed', 'pending'] } } }),
    prisma.user.findMany({
      where: { ...tenantFilter, isActive: true },
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: { id: true, name: true, email: true, role: true, createdAt: true, avatar: true },
    }),
    prisma.enrollment.findMany({
      where: { ...tenantFilter },
      orderBy: { enrolledAt: 'desc' },
      take: 5,
      include: {
        user: { select: { name: true, email: true, avatar: true } },
        course: { select: { title: true, thumbnail: true, price: true } },
      },
    }),
    prisma.testSeriesEnrollment.findMany({
      where: { ...tenantFilter },
      orderBy: { enrolledAt: 'desc' },
      take: 5,
      include: {
        user: { select: { name: true, email: true, avatar: true } },
        testSeries: { select: { title: true, price: true } },
      },
    }),
    prisma.payment.aggregate({
      where: { ...tenantFilter, status: 'completed' },
      _sum: { amount: true },
      _avg: { amount: true },
      _count: { id: true },
    }),
    prisma.payment.aggregate({
      where: { ...tenantFilter, status: 'completed', createdAt: { gte: periodStart } },
      _sum: { amount: true },
    }),
    prisma.payment.aggregate({
      where: {
        ...tenantFilter,
        status: 'completed',
        createdAt: { gte: prevPeriodStart, lt: prevPeriodEnd },
      },
      _sum: { amount: true },
    }),
    prisma.course.findMany({
      where: { ...tenantFilter },
      include: {
        teacher: { select: { name: true, avatar: true } },
        _count: { select: { enrollments: true, reviews: true } },
      },
      orderBy: { enrollments: { _count: 'desc' } },
      take: 5,
    }),
    prisma.user.findMany({
      where: { ...tenantFilter, role: 'teacher', isActive: true },
      select: {
        id: true,
        name: true,
        email: true,
        avatar: true,
        courses: {
          select: {
            id: true,
            price: true,
            rating: true,
            _count: { select: { enrollments: true } },
          },
        },
      },
      take: 10,
    }),
    prisma.quiz.findFirst({
      where: { ...tenantFilter },
      include: { _count: { select: { attempts: true } } },
      orderBy: { attempts: { _count: 'desc' } },
    }),
    prisma.testSeries.findFirst({
      where: { ...tenantFilter },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.test.findFirst({
      where: { ...tenantFilter },
      include: { _count: { select: { attempts: true } } },
      orderBy: { attempts: { _count: 'desc' } },
    }),
  ]);

  const totalEnrollments = totalCourseEnrollments + totalTSEnrollments;
  const enrollmentsThisPeriod = courseEnrollmentsThisPeriod + tsEnrollmentsThisPeriod;
  const enrollmentsPrevPeriod = courseEnrollmentsPrevPeriod + tsEnrollmentsPrevPeriod;
  const paidEnrollments = paidCourseEnrollments + paidTSEnrollments;
  const freeEnrollments = freeCourseEnrollments + freeTSEnrollments;
  const activeEnrollments = activeCourseEnrollments + activeTSEnrollments;

  const recentEnrollments = [
    ...recentCourseEnrollments.map((e) => ({
      ...e,
      type: 'course',
      itemTitle: e.course?.title,
    })),
    ...recentTSEnrollments.map((e) => ({
      ...e,
      type: 'testSeries',
      itemTitle: e.testSeries?.title,
      course: { title: e.testSeries?.title, price: e.testSeries?.price },
    })),
  ]
    .sort((a, b) => new Date(b.enrolledAt).getTime() - new Date(a.enrolledAt).getTime())
    .slice(0, 5);

  // Helper: calculate growth percentage
  const calcGrowth = (current, previous) => {
    if (!previous) return current > 0 ? 100 : 0;
    return Math.round(((current - previous) / previous) * 100);
  };

  const totalRevenue = revenueStatsRaw._sum.amount || 0;
  const avgOrderValue = Math.round(revenueStatsRaw._avg.amount || 0);
  const revenueThisPeriod = revenueThisPeriodAgg._sum.amount || 0;
  const revenuePrevPeriod = revenuePrevPeriodAgg._sum.amount || 0;
  const revenueGrowth = calcGrowth(revenueThisPeriod, revenuePrevPeriod);

  const userGrowth = calcGrowth(newUsersThisPeriod, newUsersPrevPeriod);
  const enrollmentGrowth = calcGrowth(enrollmentsThisPeriod, enrollmentsPrevPeriod);
  const conversionRate =
    totalEnrollments > 0 ? Math.round((paidEnrollments / totalEnrollments) * 100) : 0;
  const courseCompletionRate =
    totalEnrollments > 0 ? Math.round((completedEnrollments / totalEnrollments) * 1000) / 10 : 0;
  const completionGrowth = calcGrowth(
    completedEnrollmentsThisPeriod,
    completedEnrollmentsPrevPeriod
  );
  const averageProgress = Math.round((avgProgressAgg._avg?.progressPercentage || 0) * 10) / 10;
  const avgTestScore = Math.round((testScoresAgg._avg?.percentage || 0) * 10) / 10;
  const passRate =
    totalTestsAttempted > 0
      ? Math.round((passedAttemptsCount / totalTestsAttempted) * 1000) / 10
      : 0;

  // Real lessons completed count from all enrollments
  const lessonsCompleted = allEnrollmentsLessons.reduce(
    (acc, e) => acc + (Array.isArray(e.completedLessons) ? e.completedLessons.length : 0),
    0
  );

  // Format Top Teachers strictly from actual DB relations
  const topTeachers = topTeachersRaw
    .map((t) => {
      const studentCount = t.courses.reduce((sum, c) => sum + (c._count?.enrollments || 0), 0);
      const revenue = t.courses.reduce(
        (sum, c) => sum + (c._count?.enrollments || 0) * (c.price || 0),
        0
      );
      const ratings = t.courses.filter((c) => c.rating > 0).map((c) => c.rating);
      const avgRating =
        ratings.length > 0
          ? Math.round((ratings.reduce((a, b) => a + b, 0) / ratings.length) * 10) / 10
          : 0;
      return {
        id: t.id,
        name: t.name,
        email: t.email,
        avatar: t.avatar,
        studentCount,
        courseCount: t.courses.length,
        rating: avgRating,
        revenue,
      };
    })
    .sort((a, b) => b.studentCount - a.studentCount)
    .slice(0, 5);

  // Format Top Courses strictly from actual DB records
  const topCourses = topCoursesRaw.map((c) => ({
    id: c.id,
    title: c.title,
    thumbnail: c.thumbnail,
    price: c.price || 0,
    rating: c.rating || 0,
    instructor: c.teacher?.name || 'Unassigned',
    enrollments: c._count?.enrollments || 0,
    revenue: (c._count?.enrollments || 0) * (c.price || 0),
  }));

  // Daily Trend for the selected period
  const dailyTrendsRaw = await prisma.$queryRaw`
    SELECT 
      TO_CHAR("createdAt", 'YYYY-MM-DD') as date,
      SUM(amount) as revenue,
      COUNT(*) as orders
    FROM "Payment"
    WHERE status = 'completed' AND "createdAt" >= ${periodStart}
    GROUP BY TO_CHAR("createdAt", 'YYYY-MM-DD')
    ORDER BY date ASC
  `;
  const trendData = dailyTrendsRaw.map((r) => ({
    date: r.date,
    revenue: Number(r.revenue),
    orders: Number(r.orders),
  }));

  // Monthly trends (last 6 months fallback)
  const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);
  const monthlyTrendsRaw = await prisma.$queryRaw`
    SELECT 
      EXTRACT(YEAR FROM "enrolledAt") as year,
      EXTRACT(MONTH FROM "enrolledAt") as month,
      COUNT(*) as count,
      COALESCE(SUM("amount"), 0) as revenue
    FROM "Enrollment"
    WHERE "enrolledAt" >= ${sixMonthsAgo}
    GROUP BY year, month
    ORDER BY year ASC, month ASC
  `;
  const monthlyTrends = monthlyTrendsRaw.map((r) => ({
    _id: { year: Number(r.year), month: Number(r.month) },
    count: Number(r.count),
    revenue: Number(r.revenue),
  }));

  const data = {
    // Executive 6 Primary KPIs
    executive: {
      revenue: {
        total: totalRevenue,
        periodRevenue: revenueThisPeriod,
        growth: revenueGrowth,
        avgOrderValue,
      },
      enrollments: {
        total: totalEnrollments,
        periodEnrollments: enrollmentsThisPeriod,
        growth: enrollmentGrowth,
        paid: paidEnrollments,
        free: freeEnrollments,
        conversionRate,
      },
      activeUsers: {
        count: activeUsersCount,
        percentageOfBase: totalUsers > 0 ? Math.round((activeUsersCount / totalUsers) * 100) : 100,
      },
      users: {
        total: totalUsers,
        newUsers: newUsersThisPeriod,
        growth: userGrowth,
      },
      learning: {
        completionRate: courseCompletionRate,
        averageProgress,
        growth: completionGrowth,
      },
      assessment: {
        avgScore: avgTestScore,
        passRate,
        totalAttempts: totalTestsAttempted,
      },
    },

    // Learning Performance Section
    learningPerformance: {
      courseCompletionRate,
      averageProgress,
      lessonsCompleted,
      testsAttempted: totalTestsAttempted,
      avgTestScore,
      passRate,
      quizAttempts: totalQuizzesAttempted,
      certificatesIssued: completedEnrollments,
    },

    // User & Enrollment Overview Section
    userOverview: {
      totalUsers,
      newUsers: newUsersThisPeriod,
      activeUsers: activeUsersCount,
      totalEnrollments,
      paidEnrollments,
      freeEnrollments,
      conversionRate,
      userGrowth,
    },

    // Action Required / Operational Alerts
    actionRequired: {
      draftCourses,
      unverifiedTeachers,
      draftTests,
      upcomingLiveClasses,
      pendingOrders: failedPayments,
      pendingReviews: unapprovedReviews,
      totalAlerts:
        draftCourses +
        unverifiedTeachers +
        draftTests +
        upcomingLiveClasses +
        failedPayments +
        unapprovedReviews,
    },

    // Academic Content Inventory
    contentInventory: {
      courses: { total: totalCourses, published: publishedCourses, draft: draftCourses },
      testSeries: totalTestSeries,
      tests: totalTests,
      quizzes: totalQuizzes,
      library: totalLibrary,
      liveClasses: totalLiveClasses,
      blogs: totalBlogs,
    },

    // Rankings & Top Performers
    topCourses,
    topTeachers,
    topPerforming: {
      teacher: topTeachers[0] || null,
      course: topCourses[0] || null,
      quiz: topQuizRaw
        ? {
            id: topQuizRaw.id,
            title: topQuizRaw.title,
            attemptsCount: topQuizRaw._count?.attempts || 0,
            questionsCount: Array.isArray(topQuizRaw.questions) ? topQuizRaw.questions.length : 0,
            isPublished: topQuizRaw.isPublished,
          }
        : null,
      testSeries: topTestSeriesRaw
        ? {
            id: topTestSeriesRaw.id,
            title: topTestSeriesRaw.title,
            price: topTestSeriesRaw.price || 0,
            testsCount: Array.isArray(topTestSeriesRaw.tests) ? topTestSeriesRaw.tests.length : 0,
            isPublished: topTestSeriesRaw.isPublished,
          }
        : null,
      test: topTestRaw
        ? {
            id: topTestRaw.id,
            title: topTestRaw.title,
            attemptsCount: topTestRaw._count?.attempts || 0,
            totalMarks: topTestRaw.totalMarks || 0,
            totalQuestions: topTestRaw.totalQuestions || 0,
            duration: topTestRaw.duration || 60,
            isPublished: topTestRaw.isPublished,
          }
        : null,
    },

    // Authoritative Platform Totals
    platformTotals: {
      totalTeachers,
      totalStudents,
      totalCourses,
      totalTestSeries,
      totalTests,
      totalQuizzes,
      totalEnrollments,
      totalRevenue,
    },

    // Trends & Activity
    trendData,
    monthlyTrends,
    recent: { users: recentUsers, enrollments: recentEnrollments },

    // Backward compatibility keys
    overview: {
      totalUsers,
      totalCourses,
      publishedCourses,
      totalEnrollments,
      activeEnrollments,
      completedEnrollments,
      totalTests,
      totalQuizzes,
      totalReviews,
      avgRating: avgRatingAgg?._avg?.rating || 0,
      revenue: totalRevenue,
    },
    revenue: {
      total: totalRevenue,
      thisMonth: revenueThisPeriod,
      lastMonth: revenuePrevPeriod,
      growth: revenueGrowth,
    },
    growth: {
      users: userGrowth,
      enrollments: enrollmentGrowth,
      usersThisMonth: newUsersThisPeriod,
      enrollmentsThisMonth: enrollmentsThisPeriod,
    },
  };

  await redis.set(cacheKey, data, 30);

  ApiResponse.ok(res, data);
});

// ===== USER MANAGEMENT =====

export const getUsers = catchAsync(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  const where = {};
  if (req.query.search) {
    where.OR = [
      { name: { contains: req.query.search, mode: 'insensitive' } },
      { email: { contains: req.query.search, mode: 'insensitive' } },
    ];
  }
  if (req.query.role) where.role = req.query.role;
  if (req.query.isActive !== undefined) where.isActive = req.query.isActive === 'true';

  const [docs, total] = await Promise.all([
    prisma.user.findMany({
      where,
      skip,
      take: limit,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        isEmailVerified: true,
        createdAt: true,
        avatar: true,
        bio: true,
        phone: true,
        teacherProfile: true,
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.user.count({ where }),
  ]);

  ApiResponse.paginated(res, { docs, page, limit, total });
});

export const getUserById = catchAsync(async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.params.id },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isActive: true,
      isEmailVerified: true,
      createdAt: true,
      avatar: true,
      bio: true,
      phone: true,
      teacherProfile: true,
    },
  });

  if (!user) throw ApiError.notFound('User not found');

  const [enrollments, testAttempts, payments, reviewsCount, totalSpentAgg] = await Promise.all([
    prisma.enrollment.findMany({
      where: { userId: user.id },
      include: {
        course: {
          select: { id: true, title: true, price: true, thumbnail: true, slug: true },
        },
      },
      orderBy: { enrolledAt: 'desc' },
    }),
    prisma.testAttempt.findMany({
      where: { userId: user.id },
      include: {
        test: {
          select: { id: true, title: true, totalMarks: true, duration: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.payment.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.review.count({ where: { userId: user.id } }),
    prisma.payment.aggregate({
      where: { userId: user.id, status: 'completed' },
      _sum: { amount: true },
    }),
  ]);

  const completedCourses = enrollments.filter((e) => e.status === 'completed').length;
  const totalSpent = totalSpentAgg._sum.amount || 0;

  ApiResponse.ok(res, {
    user,
    enrollments,
    testAttempts,
    quizAttempts: [],
    payments,
    stats: {
      totalEnrolled: enrollments.length,
      completedCourses,
      testsAttempted: testAttempts.length,
      totalSpent,
      reviews: reviewsCount,
    },
  });
});

export const createUser = catchAsync(async (req, res) => {
  const { name, email, password, role } = req.body;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) throw ApiError.conflict('Email already registered');

  const hashedPassword = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: {
      name,
      email,
      password: hashedPassword,
      role,
      isEmailVerified: true,
    },
  });

  await redis.delPattern('admin:dashboard:*').catch(() => {});

  ApiResponse.created(
    res,
    { user: { _id: user.id, id: user.id, name: user.name, email: user.email, role: user.role } },
    'User created'
  );
});

export const updateUser = catchAsync(async (req, res) => {
  const allowedFields = ['name', 'email', 'role', 'isActive', 'isEmailVerified', 'bio', 'phone'];
  const updates = {};
  allowedFields.forEach((f) => {
    if (req.body[f] !== undefined) updates[f] = req.body[f];
  });

  const user = await prisma.user.update({
    where: { id: req.params.id },
    data: updates,
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isActive: true,
      isEmailVerified: true,
      bio: true,
      phone: true,
      avatar: true,
      createdAt: true,
    },
  });

  if (!user) throw ApiError.notFound('User not found');

  await Promise.all([
    redis.del(`user_${user.id}`).catch(() => {}),
    redis.delPattern('admin:dashboard:*').catch(() => {}),
  ]);

  ApiResponse.ok(res, { user: { ...user, _id: user.id } }, 'User updated');
});

export const deleteUser = catchAsync(async (req, res) => {
  const user = await prisma.user.findUnique({ where: { id: req.params.id } });
  if (!user) throw ApiError.notFound('User not found');

  if (user.role === 'super_admin') {
    throw ApiError.forbidden('Cannot delete super admin');
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { isActive: false, refreshTokens: [] },
  });

  await Promise.all([
    redis.del(`user_${user.id}`).catch(() => {}),
    redis.delPattern('admin:dashboard:*').catch(() => {}),
  ]);

  ApiResponse.ok(res, null, 'User deactivated');
});

// ===== COURSE OVERSIGHT =====

export const adminGetCourses = catchAsync(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  const where = {};
  if (req.query.search) where.title = { contains: req.query.search, mode: 'insensitive' };
  if (req.query.isFeatured !== undefined) where.isFeatured = req.query.isFeatured === 'true';

  if (req.query.status === 'published') where.isPublished = true;
  else if (req.query.status === 'unpublished') where.isPublished = false;

  const [docs, total] = await Promise.all([
    prisma.course.findMany({
      where,
      skip,
      take: limit,
      include: {
        teacher: { select: { name: true, email: true, avatar: true } },
        category: { select: { name: true } },
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.course.count({ where }),
  ]);

  ApiResponse.paginated(res, { docs, page, limit, total });
});

export const adminUpdateCourse = catchAsync(async (req, res) => {
  const existingCourse = await prisma.course.findFirst({
    where: { OR: [{ id: req.params.id }, { slug: req.params.id }] },
  });
  if (!existingCourse) throw ApiError.notFound('Course not found');

  const {
    title,
    description,
    shortDescription,
    price,
    isPublished,
    isFeatured,
    categoryId,
    category,
    examCategory,
    teacherId,
    language,
    level,
    thumbnail,
    sections,
  } = req.body;

  const data = {};
  if (title !== undefined && String(title).trim()) {
    data.title = String(title).trim();
    if (String(title).trim() !== existingCourse.title) {
      const generatedSlug = generateSlug(String(title).trim());
      const slugExists = await prisma.course.findUnique({ where: { slug: generatedSlug } });
      data.slug =
        slugExists && slugExists.id !== existingCourse.id
          ? `${generatedSlug}-${Date.now().toString().slice(-4)}`
          : generatedSlug;
    }
  }
  if (description !== undefined) data.description = description;
  if (price !== undefined) data.price = parseFloat(price) || 0;
  if (isPublished !== undefined) data.isPublished = Boolean(isPublished);
  if (isFeatured !== undefined) data.isFeatured = Boolean(isFeatured);
  if (categoryId !== undefined || category !== undefined || examCategory !== undefined) {
    const rawCat = categoryId || category || examCategory;
    data.categoryId = rawCat && String(rawCat).trim() ? String(rawCat).trim() : null;
  }
  if (teacherId !== undefined && String(teacherId).trim()) {
    data.teacherId = String(teacherId).trim();
  }
  if (language !== undefined) data.language = language;
  if (level !== undefined) data.level = level;
  if (thumbnail !== undefined) {
    data.thumbnail = typeof thumbnail === 'object' ? thumbnail : { url: thumbnail, publicId: '' };
  }
  if (sections !== undefined) {
    data.sections = sections;
    if (Array.isArray(sections)) {
      let totalLessons = 0;
      let totalDuration = 0;
      sections.forEach((sec) => {
        if (Array.isArray(sec.lessons)) {
          totalLessons += sec.lessons.length;
          sec.lessons.forEach((les) => {
            totalDuration += Number(les.duration) || 0;
          });
        }
      });
      data.totalLessons = totalLessons;
      data.totalDuration = totalDuration;
    }
  }

  const course = await prisma.course.update({
    where: { id: existingCourse.id },
    data,
    include: {
      category: { select: { id: true, name: true, slug: true } },
      teacher: { select: { id: true, name: true, email: true, avatar: true } },
    },
  });

  await Promise.all([
    redis.delPattern('courses:*').catch(() => {}),
    redis.delPattern(`course:${course.slug}*`).catch(() => {}),
    redis.delPattern(`course:${existingCourse.slug}*`).catch(() => {}),
  ]);

  ApiResponse.ok(res, { course }, 'Course updated');
});

export const adminDeleteCourse = catchAsync(async (req, res) => {
  const course = await prisma.course.findFirst({
    where: { OR: [{ id: req.params.id }, { slug: req.params.id }] },
  });
  if (!course) throw ApiError.notFound('Course not found');

  // Remove dependent records first to avoid FK constraint errors
  await prisma.enrollment.deleteMany({ where: { courseId: course.id } });
  await prisma.review.deleteMany({ where: { courseId: course.id } });
  await prisma.course.delete({ where: { id: course.id } });

  await Promise.all([
    redis.delPattern('courses:*').catch(() => {}),
    redis.del(`course:${course.slug}`).catch(() => {}),
  ]);

  ApiResponse.ok(res, null, 'Course deleted');
});

export const toggleFeatured = catchAsync(async (req, res) => {
  const course = await prisma.course.findUnique({ where: { id: req.params.id } });
  if (!course) throw ApiError.notFound('Course not found');

  const updated = await prisma.course.update({
    where: { id: course.id },
    data: { isFeatured: !course.isFeatured },
  });

  await redis.delPattern('courses:*');

  ApiResponse.ok(
    res,
    { isFeatured: updated.isFeatured },
    `Course ${updated.isFeatured ? 'featured' : 'unfeatured'}`
  );
});

// ===== QUIZ OVERSIGHT =====

export const adminGetQuizzes = catchAsync(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  const where = {};
  if (req.query.search) where.title = { contains: req.query.search, mode: 'insensitive' };
  if (req.query.status === 'published' || req.query.isPublished === 'true') {
    where.isPublished = true;
  } else if (req.query.status === 'draft' || req.query.isPublished === 'false') {
    where.isPublished = false;
  }

  const [docs, total] = await Promise.all([
    prisma.quiz.findMany({
      where,
      skip,
      take: limit,
      include: {
        _count: { select: { attempts: true } },
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.quiz.count({ where }),
  ]);

  ApiResponse.paginated(res, { docs, page, limit, total });
});

export const adminDeleteQuiz = catchAsync(async (req, res) => {
  try {
    await prisma.quiz.delete({ where: { id: req.params.id } });
    ApiResponse.ok(res, null, 'Quiz deleted');
  } catch (err) {
    if (err.code === 'P2025') throw ApiError.notFound('Quiz not found');
    throw err;
  }
});

// ===== TEST OVERSIGHT =====

export const adminGetTests = catchAsync(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  const where = {};
  if (req.query.search) where.title = { contains: req.query.search, mode: 'insensitive' };
  if (req.query.status === 'published' || req.query.isPublished === 'true') {
    where.isPublished = true;
  } else if (req.query.status === 'draft' || req.query.isPublished === 'false') {
    where.isPublished = false;
  } else if (req.query.status) {
    where.status = req.query.status;
  }
  if (req.query.difficulty) where.difficulty = req.query.difficulty;

  const [docs, total] = await Promise.all([
    prisma.test.findMany({
      where,
      skip,
      take: limit,
      include: {
        category: { select: { name: true } },
        _count: { select: { attempts: true } },
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.test.count({ where }),
  ]);

  ApiResponse.paginated(res, { docs, page, limit, total });
});

export const adminGetTestById = catchAsync(async (req, res) => {
  const test = await prisma.test.findFirst({
    where: { id: req.params.id },
    include: {
      category: { select: { id: true, name: true, slug: true, parentId: true } },
      _count: { select: { attempts: true } },
    },
  });
  if (!test) throw ApiError.notFound('Test not found');
  ApiResponse.ok(res, { test }, 'Test fetched');
});

export const adminDeleteTest = catchAsync(async (req, res) => {
  try {
    await prisma.test.delete({ where: { id: req.params.id } });
    await prisma.testAttempt.deleteMany({ where: { testId: req.params.id } });
    ApiResponse.ok(res, null, 'Test and attempts deleted');
  } catch (err) {
    if (err.code === 'P2025') throw ApiError.notFound('Test not found');
    throw err;
  }
});

// ===== REVIEW MODERATION =====

export const adminGetReviews = catchAsync(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  const where = {};
  if (req.query.search) where.comment = { contains: req.query.search, mode: 'insensitive' };
  if (req.query.rating) where.rating = parseInt(req.query.rating);
  if (req.query.isFlagged === 'true') where.isFlagged = true;

  const [docs, total] = await Promise.all([
    prisma.review.findMany({
      where,
      skip,
      take: limit,
      include: {
        user: { select: { name: true, email: true, avatar: true } },
        course: { select: { title: true, slug: true } },
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.review.count({ where }),
  ]);

  ApiResponse.paginated(res, { docs, page, limit, total });
});

export const adminDeleteReview = catchAsync(async (req, res) => {
  try {
    await prisma.review.delete({ where: { id: req.params.id } });
    ApiResponse.ok(res, null, 'Review deleted');
  } catch (err) {
    if (err.code === 'P2025') throw ApiError.notFound('Review not found');
    throw err;
  }
});

export const adminBulkDeleteReviews = catchAsync(async (req, res) => {
  const { reviewIds } = req.body;
  if (!Array.isArray(reviewIds) || reviewIds.length === 0) {
    throw ApiError.badRequest('reviewIds array is required');
  }

  // Get affected course ratings BEFORE deletion
  const reviews = await prisma.review.findMany({
    where: { id: { in: reviewIds } },
    select: { courseId: true },
  });
  const affectedCourses = [...new Set(reviews.map((r) => r.courseId))];

  const result = await prisma.review.deleteMany({ where: { id: { in: reviewIds } } });

  // Recalculate affected course ratings
  for (const courseId of affectedCourses) {
    const aggs = await prisma.review.aggregate({
      where: { courseId },
      _avg: { rating: true },
      _count: { id: true },
    });
    await prisma.course.update({
      where: { id: courseId },
      data: {
        averageRating: aggs._avg.rating || 0,
        reviewCount: aggs._count.id,
      },
    });
  }

  await redis.delPattern('courses:*');

  ApiResponse.ok(res, { deletedCount: result.count }, `${result.count} reviews deleted`);
});

export const adminToggleReviewApproval = catchAsync(async (req, res) => {
  const review = await prisma.review.findUnique({ where: { id: req.params.id } });
  if (!review) throw ApiError.notFound('Review not found');

  const updated = await prisma.review.update({
    where: { id: review.id },
    data: { isApproved: !review.isApproved },
  });

  ApiResponse.ok(
    res,
    { isApproved: updated.isApproved },
    `Review ${updated.isApproved ? 'approved' : 'hidden'}`
  );
});

// ===== REVENUE =====

export const getRevenue = catchAsync(async (req, res) => {
  const periodDays = parseInt(req.query.period) || 30;
  const now = new Date();
  const periodStart = new Date(now.getTime() - periodDays * 86400000);
  const prevPeriodStart = new Date(now.getTime() - 2 * periodDays * 86400000);
  const prevPeriodEnd = periodStart;

  const tenantFilter = req.tenantId ? { tenantId: req.tenantId } : {};

  const [
    totalPaidEnrollments,
    totalFreeEnrollments,
    totalEnrollments,
    allCompletedRevenueRaw,
    completedInPeriodRaw,
    completedInPrevPeriodRaw,
    ordersStatusCountsRaw,
    refundedInPeriodRaw,
    topCoursesRaw,
    topTestSeriesRaw,
    couponsList,
  ] = await Promise.all([
    prisma.enrollment.count({ where: { ...tenantFilter, amount: { gt: 0 } } }),
    prisma.enrollment.count({ where: { ...tenantFilter, amount: 0 } }),
    prisma.enrollment.count({ where: { ...tenantFilter } }),
    prisma.payment.aggregate({
      where: { ...tenantFilter, status: 'completed' },
      _sum: { amount: true },
      _avg: { amount: true },
      _count: { id: true },
    }),
    prisma.payment.aggregate({
      where: { ...tenantFilter, status: 'completed', createdAt: { gte: periodStart } },
      _sum: { amount: true },
      _avg: { amount: true },
      _count: { id: true },
    }),
    prisma.payment.aggregate({
      where: {
        ...tenantFilter,
        status: 'completed',
        createdAt: { gte: prevPeriodStart, lt: prevPeriodEnd },
      },
      _sum: { amount: true },
      _avg: { amount: true },
      _count: { id: true },
    }),
    prisma.payment.groupBy({
      by: ['status'],
      where: { ...tenantFilter, createdAt: { gte: periodStart } },
      _count: { id: true },
      _sum: { amount: true },
    }),
    prisma.payment.aggregate({
      where: { ...tenantFilter, status: 'refunded', createdAt: { gte: periodStart } },
      _sum: { amount: true },
      _count: { id: true },
    }),
    prisma.course.findMany({
      where: { ...tenantFilter },
      include: {
        teacher: { select: { name: true } },
        _count: { select: { enrollments: true } },
      },
      orderBy: { enrollments: { _count: 'desc' } },
      take: 6,
    }),
    prisma.testSeries.findMany({
      where: { ...tenantFilter },
      include: {
        _count: { select: { enrollments: true } },
      },
      orderBy: { enrollments: { _count: 'desc' } },
      take: 6,
    }),
    prisma.coupon.findMany({
      where: { ...tenantFilter },
      take: 10,
    }),
  ]);

  const calcGrowth = (current, previous) => {
    if (!previous) return current > 0 ? 100 : 0;
    return Math.round(((current - previous) / previous) * 100);
  };

  const grossRevenue = completedInPeriodRaw._sum.amount || allCompletedRevenueRaw._sum.amount || 0;
  const prevGrossRevenue = completedInPrevPeriodRaw._sum.amount || 0;
  const grossRevenueGrowth = calcGrowth(grossRevenue, prevGrossRevenue);

  const refundAmount = refundedInPeriodRaw._sum.amount || 0;
  const refundCount = refundedInPeriodRaw._count.id || 0;
  const discountAmount = couponsList.reduce(
    (acc, c) => acc + (c.usedCount || 0) * (c.discount || 0),
    0
  );
  const netRevenue = Math.max(0, grossRevenue - refundAmount - discountAmount);
  const netRevenueGrowth = calcGrowth(netRevenue, prevGrossRevenue);

  const paidOrders = completedInPeriodRaw._count.id || allCompletedRevenueRaw._count.id || 0;
  const prevPaidOrders = completedInPrevPeriodRaw._count.id || 0;
  const paidOrdersGrowth = calcGrowth(paidOrders, prevPaidOrders);
  const avgOrderValue =
    paidOrders > 0
      ? Math.round(grossRevenue / paidOrders)
      : Math.round(allCompletedRevenueRaw._avg.amount || 0);

  // Orders by Status
  const statusMap = ordersStatusCountsRaw.reduce((acc, item) => {
    acc[item.status] = item._count.id;
    return acc;
  }, {});

  const ordersByStatus = {
    successful: statusMap['completed'] || paidOrders || 0,
    pending: statusMap['pending'] || 0,
    failed: statusMap['failed'] || 0,
    refunded: statusMap['refunded'] || refundCount || 0,
    total: Object.values(statusMap).reduce((a, b) => a + b, 0) || paidOrders,
  };

  // Payment Performance
  const totalPaymentAttempts =
    ordersByStatus.successful +
    ordersByStatus.pending +
    ordersByStatus.failed +
    ordersByStatus.refunded;
  const paymentSuccessRate =
    totalPaymentAttempts > 0
      ? Math.round((ordersByStatus.successful / totalPaymentAttempts) * 100)
      : 100;

  const paymentPerformance = {
    successfulPayments: ordersByStatus.successful,
    failedPayments: ordersByStatus.failed,
    pendingPayments: ordersByStatus.pending,
    refundedPayments: ordersByStatus.refunded,
    successRate: paymentSuccessRate,
  };

  // Dynamic Revenue Trend based on period
  let trendQuery;
  if (periodDays <= 30) {
    trendQuery = prisma.$queryRaw`
      SELECT 
        TO_CHAR("createdAt", 'YYYY-MM-DD') as date,
        TO_CHAR("createdAt", 'DD Mon') as label,
        SUM(amount) as revenue,
        COUNT(*) as orders
      FROM "Payment"
      WHERE status = 'completed' AND "createdAt" >= ${periodStart}
      GROUP BY TO_CHAR("createdAt", 'YYYY-MM-DD'), TO_CHAR("createdAt", 'DD Mon')
      ORDER BY date ASC
    `;
  } else if (periodDays <= 90) {
    trendQuery = prisma.$queryRaw`
      SELECT 
        TO_CHAR(DATE_TRUNC('week', "createdAt"), 'YYYY-MM-DD') as date,
        TO_CHAR(DATE_TRUNC('week', "createdAt"), 'DD Mon') as label,
        SUM(amount) as revenue,
        COUNT(*) as orders
      FROM "Payment"
      WHERE status = 'completed' AND "createdAt" >= ${periodStart}
      GROUP BY DATE_TRUNC('week', "createdAt")
      ORDER BY date ASC
    `;
  } else {
    trendQuery = prisma.$queryRaw`
      SELECT 
        TO_CHAR(DATE_TRUNC('month', "createdAt"), 'YYYY-MM') as date,
        TO_CHAR("createdAt", 'Mon YYYY') as label,
        SUM(amount) as revenue,
        COUNT(*) as orders
      FROM "Payment"
      WHERE status = 'completed' AND "createdAt" >= ${periodStart}
      GROUP BY DATE_TRUNC('month', "createdAt"), TO_CHAR("createdAt", 'Mon YYYY')
      ORDER BY date ASC
    `;
  }

  const trendRaw = await trendQuery;
  const revenueTrend = trendRaw.map((r) => ({
    date: r.label || r.date,
    revenue: Number(r.revenue),
    netRevenue: Number(r.revenue),
    orders: Number(r.orders),
  }));

  // Revenue by Product breakdown (strictly from database records)
  const completedPaymentsInPeriod = await prisma.payment.findMany({
    where: { ...tenantFilter, status: 'completed', createdAt: { gte: periodStart } },
    select: { amount: true, notes: true },
  });

  let courseRev = 0;
  let testSeriesRev = 0;
  let testSeriesOrdersCount = {};
  let testSeriesRevCount = {};

  completedPaymentsInPeriod.forEach((p) => {
    const notes = p.notes || {};
    const amt = Number(p.amount || 0);
    if (notes.testId || notes.testSeriesId) {
      testSeriesRev += amt;
      const key = notes.testSeriesId || notes.testId;
      testSeriesOrdersCount[key] = (testSeriesOrdersCount[key] || 0) + 1;
      testSeriesRevCount[key] = (testSeriesRevCount[key] || 0) + amt;
    } else {
      courseRev += amt;
    }
  });

  const liveClassRev = 0;
  const libraryRev = 0;
  const totalRevForPct = grossRevenue || courseRev + testSeriesRev || 1;

  const revenueByProduct = [
    {
      name: 'Courses',
      type: 'course',
      revenue: courseRev,
      percentage: Math.min(100, Math.round((courseRev / totalRevForPct) * 100)),
    },
    {
      name: 'Test Series',
      type: 'test-series',
      revenue: testSeriesRev,
      percentage: Math.min(100, Math.round((testSeriesRev / totalRevForPct) * 100)),
    },
    {
      name: 'Live Classes',
      type: 'live-class',
      revenue: liveClassRev,
      percentage: Math.round((liveClassRev / totalRevForPct) * 100),
    },
    {
      name: 'Digital Library',
      type: 'library',
      revenue: libraryRev,
      percentage: Math.round((libraryRev / totalRevForPct) * 100),
    },
  ];

  // Top Performing Products (strictly from database records)
  // Also include any test series that have revenue from payments but might not be in topTestSeriesRaw
  const revenueSeriesIds = Object.keys(testSeriesRevCount);
  const extraSeriesIds = revenueSeriesIds.filter(
    (id) => !topTestSeriesRaw.find((ts) => ts.id === id)
  );
  const extraSeriesRaw =
    extraSeriesIds.length > 0
      ? await prisma.testSeries.findMany({
          where: { id: { in: extraSeriesIds } },
          include: { _count: { select: { enrollments: true } } },
        })
      : [];

  const allSeriesForTop = [...topTestSeriesRaw, ...extraSeriesRaw];

  const topProducts = [
    ...topCoursesRaw.map((c) => ({
      id: c.id,
      title: c.title,
      type: 'Course',
      orders: c._count?.enrollments || 0,
      students: c._count?.enrollments || 0,
      revenue: (c._count?.enrollments || 0) * (c.price || 0),
      instructor: c.teacher?.name || 'Unassigned',
      link: `/courses/${c.id}`,
    })),
    ...allSeriesForTop.map((ts) => {
      const orders = testSeriesOrdersCount[ts.id] || ts._count?.enrollments || 0;
      const rev = testSeriesRevCount[ts.id] || orders * (ts.price || 0);
      return {
        id: ts.id,
        title: ts.title,
        type: 'Test Series',
        orders,
        students: orders,
        revenue: rev,
        instructor: 'Exam Faculty',
        link: `/test-series/${ts.id}`,
      };
    }),
  ]
    .filter((p) => p.revenue > 0 || p.orders > 0)
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 10);

  // Coupon Performance (strictly from DB)
  const totalCouponsUsed = couponsList.reduce((acc, c) => acc + (c.usedCount || 0), 0);
  const avgCouponDiscount =
    couponsList.length > 0
      ? Math.round(couponsList.reduce((acc, c) => acc + (c.discount || 0), 0) / couponsList.length)
      : 0;

  const couponPerformance = {
    couponOrders: totalCouponsUsed,
    discountGiven: discountAmount,
    revenueGenerated: totalCouponsUsed > 0 ? Math.round(grossRevenue) : 0,
    avgDiscount: avgCouponDiscount,
    couponUsageRate: paidOrders > 0 ? Math.round((totalCouponsUsed / paidOrders) * 100) : 0,
  };

  const responseData = {
    // 1. Primary 6 KPI Cards
    kpis: {
      grossRevenue: { value: grossRevenue, growth: grossRevenueGrowth },
      netRevenue: { value: netRevenue, growth: netRevenueGrowth },
      paidOrders: { value: paidOrders, growth: paidOrdersGrowth },
      avgOrderValue: { value: avgOrderValue },
      refunds: { value: refundAmount, count: refundCount },
      discounts: { value: discountAmount },
    },

    // 2. Dynamic Revenue Trend
    revenueTrend,

    // 3. Orders & Payment Performance
    ordersByStatus,

    // 4. Revenue by Product Breakdown
    revenueByProduct,

    // 5. Top Performing Products
    topProducts,

    // 6. Coupon Performance
    couponPerformance,

    // 7. Payment Gateway Performance
    paymentPerformance,

    // Backward compatibility for existing keys
    overview: {
      totalRevenue: grossRevenue,
      netRevenue,
      avgOrderValue,
      totalOrders: paidOrders,
      totalPaidEnrollments,
      totalFreeEnrollments,
      totalEnrollments,
      conversionRate:
        totalEnrollments > 0 ? Math.round((totalPaidEnrollments / totalEnrollments) * 100) : 0,
    },
    periods: {
      grossRevenue,
      netRevenue,
      growth: grossRevenueGrowth,
      monthlyGrowth: grossRevenueGrowth,
    },
    dailyRevenue: revenueTrend,
    topCourses: topCoursesRaw.map((c) => ({
      _id: c.id,
      title: c.title,
      revenue: (c._count?.enrollments || 0) * (c.price || 0),
      enrollments: c._count?.enrollments || 0,
      price: c.price || 0,
      instructor: c.teacher?.name || 'Assigned Teacher',
    })),
  };

  ApiResponse.ok(res, responseData);
});

export const getPayments = catchAsync(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  const where = {};
  if (req.query.status && req.query.status !== 'all') {
    where.status = req.query.status;
  }
  if (req.query.method && req.query.method !== 'all') {
    where.method = { contains: req.query.method, mode: 'insensitive' };
  }
  if (req.query.search) {
    where.OR = [
      { transactionId: { contains: req.query.search, mode: 'insensitive' } },
      { orderId: { contains: req.query.search, mode: 'insensitive' } },
      { user: { name: { contains: req.query.search, mode: 'insensitive' } } },
      { user: { email: { contains: req.query.search, mode: 'insensitive' } } },
    ];
  }

  const [payments, total, statsAgg, completedAgg, pendingAgg, failedAgg, refundedAgg] =
    await Promise.all([
      prisma.payment.findMany({
        where,
        skip,
        take: limit,
        include: {
          user: { select: { id: true, name: true, email: true, avatar: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.payment.count({ where }),
      prisma.payment.aggregate({
        _sum: { amount: true },
        _avg: { amount: true },
        _count: { id: true },
      }),
      prisma.payment.aggregate({
        where: { status: 'completed' },
        _sum: { amount: true },
        _count: { id: true },
      }),
      prisma.payment.aggregate({
        where: { status: 'pending' },
        _sum: { amount: true },
        _count: { id: true },
      }),
      prisma.payment.aggregate({
        where: { status: 'failed' },
        _sum: { amount: true },
        _count: { id: true },
      }),
      prisma.payment.aggregate({
        where: { status: 'refunded' },
        _sum: { amount: true },
        _count: { id: true },
      }),
    ]);

  const totalTxns = statsAgg._count.id || 0;
  const completedCount = completedAgg._count.id || 0;
  const pendingCount = pendingAgg._count.id || 0;
  const failedCount = failedAgg._count.id || 0;
  const refundedCount = refundedAgg._count.id || 0;
  const refundedSum = refundedAgg._sum.amount || 0;

  const stats = {
    grossPaymentVolume: completedAgg._sum.amount || 0,
    totalRevenue: completedAgg._sum.amount || 0,
    totalTransactions: totalTxns,
    successfulOrders: completedCount,
    successRate: totalTxns > 0 ? Math.round((completedCount / totalTxns) * 100) : 100,
    pendingPayments: pendingCount,
    failedPayments: failedCount,
    refundedOrders: refundedCount,
    refundAmount: refundedSum,
    avgOrderValue: Math.round(statsAgg._avg.amount || 0),
  };

  ApiResponse.paginated(res, { docs: payments, page, limit, total, stats });
});

export const getMonthlyRevenue = catchAsync(async (req, res) => {
  const now = new Date();
  const twelveMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 11, 1);

  const monthlyDataRaw = await prisma.$queryRaw`
    SELECT 
      EXTRACT(YEAR FROM "createdAt") as year,
      EXTRACT(MONTH FROM "createdAt") as month,
      SUM(amount) as revenue,
      COUNT(*) as orders
    FROM "Payment"
    WHERE status = 'completed' AND "createdAt" >= ${twelveMonthsAgo}
    GROUP BY year, month
    ORDER BY year ASC, month ASC
  `;

  const monthNames = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
  ];
  const formatted = monthlyDataRaw.map((d) => ({
    month: monthNames[Number(d.month) - 1],
    year: Number(d.year),
    revenue: Number(d.revenue),
    orders: Number(d.orders),
  }));

  ApiResponse.ok(res, formatted);
});

// ===== ENROLLMENT MANAGEMENT =====

export const adminGetEnrollments = catchAsync(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;
  const typeFilter = req.query.type || 'all'; // 'all' | 'course' | 'test_series'

  const courseWhere = {};
  const testSeriesWhere = {};

  if (req.query.status) {
    courseWhere.status = req.query.status;
    testSeriesWhere.status = req.query.status;
  }
  if (req.query.startDate || req.query.endDate) {
    const dateFilter = {};
    if (req.query.startDate) dateFilter.gte = new Date(req.query.startDate);
    if (req.query.endDate) dateFilter.lte = new Date(req.query.endDate);
    courseWhere.enrolledAt = dateFilter;
    testSeriesWhere.enrolledAt = dateFilter;
  }

  if (req.query.search) {
    const search = req.query.search;
    courseWhere.OR = [
      { user: { name: { contains: search, mode: 'insensitive' } } },
      { user: { email: { contains: search, mode: 'insensitive' } } },
      { course: { title: { contains: search, mode: 'insensitive' } } },
    ];
    testSeriesWhere.OR = [
      { user: { name: { contains: search, mode: 'insensitive' } } },
      { user: { email: { contains: search, mode: 'insensitive' } } },
      { testSeries: { title: { contains: search, mode: 'insensitive' } } },
    ];
  }

  const [courseDocs, courseTotal, testSeriesDocs, testSeriesTotal, courseUserIds, tsUserIds] =
    await Promise.all([
      typeFilter !== 'test_series'
        ? prisma.enrollment.findMany({
            where: courseWhere,
            include: {
              user: { select: { name: true, email: true, avatar: true } },
              course: {
                select: { id: true, title: true, thumbnail: true, price: true, slug: true },
              },
            },
            orderBy: { enrolledAt: 'desc' },
          })
        : Promise.resolve([]),
      typeFilter !== 'test_series'
        ? prisma.enrollment.count({ where: courseWhere })
        : Promise.resolve(0),
      typeFilter !== 'course'
        ? prisma.testSeriesEnrollment.findMany({
            where: testSeriesWhere,
            include: {
              user: { select: { name: true, email: true, avatar: true } },
              testSeries: { select: { id: true, title: true, price: true, tests: true } },
            },
            orderBy: { enrolledAt: 'desc' },
          })
        : Promise.resolve([]),
      typeFilter !== 'course'
        ? prisma.testSeriesEnrollment.count({ where: testSeriesWhere })
        : Promise.resolve(0),
      prisma.enrollment.findMany({
        where: courseWhere,
        select: { userId: true },
        distinct: ['userId'],
      }),
      prisma.testSeriesEnrollment.findMany({
        where: testSeriesWhere,
        select: { userId: true },
        distinct: ['userId'],
      }),
    ]);

  const uniqueStudentSet = new Set([
    ...courseUserIds.map((c) => c.userId),
    ...tsUserIds.map((t) => t.userId),
  ]);
  const uniqueStudents = uniqueStudentSet.size;

  const formattedCourses = courseDocs.map((e) => ({
    id: e.id,
    _id: e.id,
    type: 'course',
    productType: 'Course',
    user: e.user,
    userId: e.userId,
    course: e.course,
    product: {
      id: e.course?.id,
      title: e.course?.title,
      price: e.course?.price,
      thumbnail: e.course?.thumbnail,
    },
    title: e.course?.title,
    progressPercentage: e.progressPercentage || 0,
    status: e.status,
    paymentStatus: e.paymentStatus,
    amount: e.amount,
    paymentId: e.paymentId || null, // raw payment record id string
    orderId: e.orderId || null,
    enrolledAt: e.enrolledAt,
    completedAt: e.completedAt,
  }));

  // Resolve Razorpay transaction IDs for test series enrollments
  const tsPaymentIds = testSeriesDocs.map((s) => s.paymentId).filter(Boolean);
  const tsPayments =
    tsPaymentIds.length > 0
      ? await prisma.payment.findMany({
          where: { id: { in: tsPaymentIds } },
          select: {
            id: true,
            transactionId: true,
            orderId: true,
            amount: true,
            currency: true,
            notes: true,
          },
        })
      : [];
  const tsPaymentMap = new Map(tsPayments.map((p) => [p.id, p]));

  const formattedSeries = testSeriesDocs.map((s) => {
    const pay = s.paymentId ? tsPaymentMap.get(s.paymentId) : null;
    const razorpayPayId =
      pay?.transactionId ||
      (pay?.notes && typeof pay.notes === 'object' ? pay.notes.paymentId : null) ||
      null;

    return {
      id: s.id,
      _id: s.id,
      type: 'test_series',
      productType: 'Test Series',
      user: s.user,
      userId: s.userId,
      course: {
        id: s.testSeries?.id,
        title: s.testSeries?.title,
        price: s.testSeries?.price,
      },
      testSeries: s.testSeries,
      product: {
        id: s.testSeries?.id,
        title: s.testSeries?.title,
        price: s.testSeries?.price,
        testsCount: Array.isArray(s.testSeries?.tests) ? s.testSeries.tests.length : 0,
      },
      title: s.testSeries?.title,
      progressPercentage: 100,
      status: s.status,
      paymentStatus: s.paymentStatus,
      amount: s.amount,
      orderId: s.orderId || pay?.orderId || null,
      // Attach enriched payment object so modal can display Razorpay refs
      paymentId: pay
        ? {
            id: pay.id,
            paymentId: razorpayPayId,
            orderId: s.orderId || pay.orderId,
            amount: s.amount,
            provider: razorpayPayId?.startsWith('pay_') ? 'razorpay' : 'online',
          }
        : null,
      enrolledAt: s.enrolledAt,
      completedAt: s.expiresAt,
    };
  });

  const combinedDocs = [...formattedCourses, ...formattedSeries].sort(
    (a, b) => new Date(b.enrolledAt).getTime() - new Date(a.enrolledAt).getTime()
  );

  const total = courseTotal + testSeriesTotal;
  const paginatedDocs = combinedDocs.slice(skip, skip + limit);
  const totalRevenue = combinedDocs.reduce((sum, d) => sum + (Number(d.amount) || 0), 0);

  ApiResponse.paginated(res, {
    docs: paginatedDocs,
    page,
    limit,
    total,
    stats: {
      total,
      uniqueStudents,
      courses: courseTotal,
      testSeries: testSeriesTotal,
      totalRevenue,
    },
  });
});

export const adminExportEnrollments = catchAsync(async (req, res) => {
  const where = {};
  if (req.query.status) where.status = req.query.status;

  const [enrollments, testSeriesEnrollments] = await Promise.all([
    prisma.enrollment.findMany({
      where,
      include: {
        user: { select: { name: true, email: true } },
        course: { select: { title: true, price: true } },
      },
      orderBy: { enrolledAt: 'desc' },
    }),
    prisma.testSeriesEnrollment.findMany({
      where,
      include: {
        user: { select: { name: true, email: true } },
        testSeries: { select: { title: true, price: true } },
      },
      orderBy: { enrolledAt: 'desc' },
    }),
  ]);

  const headers = 'Student Name,Email,Product Type,Title,Amount Paid,Status,Enrolled Date\n';
  const courseRows = enrollments.map(
    (e) =>
      `"${e.user?.name || 'N/A'}","${e.user?.email || 'N/A'}","Course","${e.course?.title || 'N/A'}",${e.amount || 0},"${e.status}","${e.enrolledAt?.toISOString().split('T')[0] || ''}"`
  );
  const seriesRows = testSeriesEnrollments.map(
    (s) =>
      `"${s.user?.name || 'N/A'}","${s.user?.email || 'N/A'}","Test Series","${s.testSeries?.title || 'N/A'}",${s.amount || 0},"${s.status}","${s.enrolledAt?.toISOString().split('T')[0] || ''}"`
  );

  const csv = headers + [...courseRows, ...seriesRows].join('\n');
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename=enrollments-${Date.now()}.csv`);
  res.send(csv);
});

export const bulkAssignEnrollments = catchAsync(async (req, res) => {
  const { userIds, entityId, entityType } = req.body;
  if (!userIds || !Array.isArray(userIds) || !entityId || !entityType) {
    throw ApiError.badRequest('userIds array, entityId, and entityType are required');
  }

  const existing = await prisma.enrollment.findMany({
    where: {
      userId: { in: userIds },
      [entityType === 'course' ? 'courseId' : `${entityType}Id`]: entityId,
    },
  });

  const existingUserIds = existing.map((e) => e.userId);
  const toEnroll = userIds.filter((id) => !existingUserIds.includes(id));

  if (toEnroll.length === 0) {
    return ApiResponse.ok(res, { message: 'All users already enrolled' });
  }

  const enrollments = toEnroll.map((userId) => ({
    userId,
    [entityType === 'course' ? 'courseId' : `${entityType}Id`]: entityId,
    status: 'active',
    enrolledAt: new Date(),
    amount: 0,
    progressPercentage: 0,
  }));

  await prisma.enrollment.createMany({ data: enrollments });

  ApiResponse.ok(res, { message: `Successfully enrolled ${toEnroll.length} users` });
});

// ===== TEACHER MANAGEMENT =====

export const getTeachers = catchAsync(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  const where = { role: 'teacher', isActive: true };
  if (req.query.search) {
    where.OR = [
      { name: { contains: req.query.search, mode: 'insensitive' } },
      { email: { contains: req.query.search, mode: 'insensitive' } },
    ];
  }
  if (req.query.isActive !== undefined) where.isActive = req.query.isActive === 'true';
  // NOTE: teacherProfile json querying in Prisma can be tricky. Assuming simple boolean filter if possible or just skip for now:
  // if (req.query.isVerified === 'true') where.teacherProfile = { path: ['isVerified'], equals: true }; // Postgres JSONB

  const [docs, total] = await Promise.all([
    prisma.user.findMany({
      where,
      skip,
      take: limit,
      select: {
        id: true,
        name: true,
        email: true,
        avatar: true,
        role: true,
        isActive: true,
        teacherProfile: true,
        createdAt: true,
      },
    }),
    prisma.user.count({ where }),
  ]);

  const enriched = await Promise.all(
    docs.map(async (teacher) => {
      const courses = await prisma.course.findMany({
        where: { teacherId: teacher.id },
        select: { id: true },
      });
      const courseIds = courses.map((c) => c.id);

      let courseCount = courseIds.length;
      let studentCount = 0;
      let revenue = 0;

      if (courseIds.length > 0) {
        studentCount = await prisma.enrollment.count({ where: { courseId: { in: courseIds } } });
        const revAgg = await prisma.enrollment.aggregate({
          where: { courseId: { in: courseIds } },
          _sum: { amount: true },
        });
        revenue = revAgg._sum.amount || 0;
      }

      return { ...teacher, courseCount, studentCount, totalRevenue: revenue };
    })
  );

  ApiResponse.paginated(res, { docs: enriched, page, limit, total });
});

export const getTeacherById = catchAsync(async (req, res) => {
  const teacher = await prisma.user.findUnique({
    where: { id: req.params.id },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      avatar: true,
      bio: true,
      phone: true,
      isActive: true,
      isEmailVerified: true,
      teacherProfile: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  if (!teacher || teacher.role !== 'teacher') {
    throw ApiError.notFound('Teacher not found');
  }

  const [courses, liveClasses] = await Promise.all([
    prisma.course.findMany({
      where: { teacherId: teacher.id },
      include: {
        category: { select: { id: true, name: true } },
        _count: { select: { enrollments: true, reviews: true } },
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.liveClass.findMany({
      where: { teacherId: teacher.id },
      orderBy: { scheduledAt: 'desc' },
    }),
  ]);

  const courseIds = courses.map((c) => c.id);
  let totalStudents = 0;
  let totalRevenue = 0;

  if (courseIds.length > 0) {
    totalStudents = await prisma.enrollment.count({
      where: { courseId: { in: courseIds } },
    });
    const revAgg = await prisma.enrollment.aggregate({
      where: { courseId: { in: courseIds } },
      _sum: { amount: true },
    });
    totalRevenue = revAgg._sum.amount || 0;
  }

  const stats = {
    totalCourses: courses.length,
    publishedCourses: courses.filter((c) => c.isPublished).length,
    totalStudents,
    totalRevenue,
    totalLiveClasses: liveClasses.length,
  };

  ApiResponse.ok(res, {
    teacher,
    courses,
    liveClasses,
    stats,
  });
});

export const createTeacher = catchAsync(async (req, res) => {
  const {
    name,
    email,
    password,
    bio,
    phone,
    designation,
    headline,
    qualification,
    specialization,
    subjects,
    experience,
    showOnFaculty = true,
    isFeatured = false,
    headerImage,
    avatar,
    links,
  } = req.body;

  if (!name || !email || !password) {
    throw ApiError.badRequest('Name, email, and password are required');
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) throw ApiError.conflict('Email already registered');

  const hashedPassword = await bcrypt.hash(password, 10);
  const teacherProfile = {
    bio: bio || '',
    designation: designation || headline || '',
    headline: headline || designation || '',
    qualification: qualification || '',
    experience: experience || '',
    specialization: Array.isArray(specialization)
      ? specialization
      : specialization
        ? [specialization]
        : [],
    subjects: Array.isArray(subjects)
      ? subjects
      : subjects
        ? [subjects]
        : Array.isArray(specialization)
          ? specialization
          : specialization
            ? [specialization]
            : [],
    showOnFaculty: showOnFaculty !== false,
    isFeatured: !!isFeatured,
    isVerified: true,
    headerImage: headerImage || null,
    links: links || {},
  };

  const user = await prisma.user.create({
    data: {
      name,
      email,
      password: hashedPassword,
      role: 'teacher',
      bio: bio || '',
      phone: phone || '',
      avatar: avatar ? (typeof avatar === 'string' ? { url: avatar } : avatar) : null,
      teacherProfile,
      isEmailVerified: true,
      tenantId: req.tenantId || null,
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      avatar: true,
      bio: true,
      phone: true,
      isActive: true,
      teacherProfile: true,
      createdAt: true,
    },
  });

  ApiResponse.created(res, { teacher: user }, 'Teacher created successfully');
});

export const updateTeacher = catchAsync(async (req, res) => {
  const {
    name,
    bio,
    phone,
    designation,
    headline,
    qualification,
    specialization,
    subjects,
    experience,
    showOnFaculty,
    isFeatured,
    headerImage,
    avatar,
    links,
    isActive,
  } = req.body;

  const teacher = await prisma.user.findUnique({ where: { id: req.params.id } });
  if (!teacher || teacher.role !== 'teacher') throw ApiError.notFound('Teacher not found');

  const currentProfile = teacher.teacherProfile
    ? typeof teacher.teacherProfile === 'string'
      ? JSON.parse(teacher.teacherProfile)
      : teacher.teacherProfile
    : {};

  const updatedProfile = {
    ...currentProfile,
    ...(bio !== undefined && { bio }),
    ...(designation !== undefined && { designation }),
    ...(headline !== undefined && { headline }),
    ...(qualification !== undefined && { qualification }),
    ...(specialization !== undefined && {
      specialization: Array.isArray(specialization) ? specialization : [specialization],
    }),
    ...(subjects !== undefined && {
      subjects: Array.isArray(subjects) ? subjects : [subjects],
    }),
    ...(experience !== undefined && { experience }),
    ...(showOnFaculty !== undefined && { showOnFaculty: Boolean(showOnFaculty) }),
    ...(isFeatured !== undefined && { isFeatured: Boolean(isFeatured) }),
    ...(headerImage !== undefined && { headerImage }),
    ...(links !== undefined && { links }),
  };

  const data = {
    ...(name && { name }),
    ...(bio !== undefined && { bio }),
    ...(phone !== undefined && { phone }),
    ...(avatar !== undefined && {
      avatar: avatar ? (typeof avatar === 'string' ? { url: avatar } : avatar) : null,
    }),
    ...(isActive !== undefined && { isActive }),
    teacherProfile: updatedProfile,
  };

  const updated = await prisma.user.update({
    where: { id: teacher.id },
    data,
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      avatar: true,
      bio: true,
      phone: true,
      isActive: true,
      teacherProfile: true,
      updatedAt: true,
    },
  });

  await redis.del(`user_${teacher.id}`);
  ApiResponse.ok(res, { teacher: updated }, 'Teacher updated successfully');
});

export const toggleFacultyVisibility = catchAsync(async (req, res) => {
  const user = await prisma.user.findUnique({ where: { id: req.params.id } });
  if (!user || user.role !== 'teacher') throw ApiError.notFound('Teacher not found');

  const teacherProfile = user.teacherProfile
    ? typeof user.teacherProfile === 'string'
      ? JSON.parse(user.teacherProfile)
      : user.teacherProfile
    : {};

  teacherProfile.showOnFaculty = teacherProfile.showOnFaculty === false ? true : false;

  await prisma.user.update({
    where: { id: user.id },
    data: { teacherProfile },
  });

  await redis.del(`user_${user.id}`);

  ApiResponse.ok(
    res,
    { showOnFaculty: teacherProfile.showOnFaculty },
    `Teacher ${teacherProfile.showOnFaculty ? 'enabled' : 'hidden'} on Faculty page`
  );
});

export const deleteTeacher = catchAsync(async (req, res) => {
  const teacher = await prisma.user.findUnique({ where: { id: req.params.id } });
  if (!teacher || teacher.role !== 'teacher') throw ApiError.notFound('Teacher not found');

  await prisma.user.update({
    where: { id: teacher.id },
    data: { isActive: false },
  });

  await redis.del(`user_${teacher.id}`);
  ApiResponse.ok(res, null, 'Teacher deactivated successfully');
});

export const verifyTeacher = catchAsync(async (req, res) => {
  const user = await prisma.user.findUnique({ where: { id: req.params.id } });
  if (!user || user.role !== 'teacher') throw ApiError.notFound('Teacher not found');

  const teacherProfile = user.teacherProfile
    ? typeof user.teacherProfile === 'string'
      ? JSON.parse(user.teacherProfile)
      : user.teacherProfile
    : {};
  teacherProfile.isVerified = !teacherProfile.isVerified;

  await prisma.user.update({
    where: { id: user.id },
    data: { teacherProfile },
  });

  await redis.del(`user_${user.id}`);

  ApiResponse.ok(
    res,
    { isVerified: teacherProfile.isVerified },
    `Teacher ${teacherProfile.isVerified ? 'verified' : 'unverified'}`
  );
});

// ===== ANNOUNCEMENTS =====

export const getAnnouncements = catchAsync(async (req, res) => {
  const tenantId = await getAdminTenantId(req);
  const limit = parseInt(req.query.limit) || 20;

  const where = {
    type: 'announcement',
    ...(tenantId ? { tenantId } : {}),
  };

  const notifications = await prisma.notification.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: 100,
  });

  // Group broadcast notifications to avoid duplicate rows for each recipient
  const seen = new Set();
  const announcements = [];

  for (const item of notifications) {
    const timeKey = item.createdAt ? new Date(item.createdAt).toISOString().slice(0, 16) : '';
    const key = `${item.title}__${item.message}__${timeKey}`;
    if (!seen.has(key)) {
      seen.add(key);
      const dataObj = typeof item.data === 'object' && item.data ? item.data : {};
      announcements.push({
        id: item.id,
        title: item.title,
        message: item.message,
        type: dataObj.type || item.type || 'info',
        url: dataObj.url || dataObj.link || '',
        link: dataObj.link || dataObj.url || '',
        priority: dataObj.priority || 'normal',
        targetRoles: dataObj.targetRoles || ['all'],
        targetRole:
          Array.isArray(dataObj.targetRoles) && dataObj.targetRoles.length === 1
            ? dataObj.targetRoles[0]
            : dataObj.targetRole || 'all',
        sentAt: item.createdAt,
        createdAt: item.createdAt,
      });
    }
  }

  ApiResponse.ok(res, {
    announcements: announcements.slice(0, limit),
    total: announcements.length,
  });
});

export const sendAnnouncement = catchAsync(async (req, res) => {
  const { title, message, targetRoles, target, link, url, scheduledAt, priority } = req.body;
  const redirectUrl = link || url || '';

  if (!title || !message) {
    throw ApiError.badRequest('Title and message are required');
  }

  let roles = targetRoles;
  if (!roles || (Array.isArray(roles) && roles.includes('all')) || target === 'all') {
    roles = ['student', 'teacher', 'admin', 'super_admin'];
  } else if (
    target === 'students' ||
    target === 'student' ||
    (Array.isArray(roles) && roles.includes('student'))
  ) {
    roles = ['student'];
  } else if (
    target === 'teachers' ||
    target === 'teacher' ||
    (Array.isArray(roles) && roles.includes('teacher'))
  ) {
    roles = ['teacher'];
  } else if (
    target === 'admins' ||
    target === 'admin' ||
    (Array.isArray(roles) && roles.includes('admin'))
  ) {
    roles = ['admin', 'super_admin'];
  }

  if (scheduledAt) {
    const delay = new Date(scheduledAt).getTime() - Date.now();
    if (delay > 0) {
      await reminderQueue.add(
        'announcement',
        {
          type: 'announcement',
          title,
          message,
          targetRoles: roles,
          tenantId: req.tenantId,
          link: redirectUrl,
          url: redirectUrl,
          senderId: req.userId,
        },
        { delay }
      );

      return ApiResponse.created(
        res,
        { scheduled: true, scheduledAt, targetRoles: roles },
        'Announcement scheduled successfully'
      );
    }
  }

  const targetUsers = await prisma.user.findMany({
    where: { role: { in: roles }, isActive: true },
    select: { id: true, name: true, email: true },
  });

  const notifications = targetUsers.map((user) => ({
    userId: user.id,
    type: 'announcement',
    title,
    message,
    isRead: false,
    data: {
      link: redirectUrl,
      url: redirectUrl,
      actionUrl: redirectUrl,
      priority: priority || 'normal',
      isBroadcast: true,
      targetRoles: roles,
    },
    tenantId: req.tenantId || null,
  }));

  let totalCreated = 0;
  if (notifications.length > 0) {
    const batchSize = 1000;
    for (let i = 0; i < notifications.length; i += batchSize) {
      const batch = notifications.slice(i, i + batchSize);
      const result = await prisma.notification.createMany({ data: batch });
      totalCreated += result.count;
    }
  }

  for (const user of targetUsers) {
    await transactionalEmailQueue.add('send', {
      type: 'announcement',
      data: { user, title, message, link: redirectUrl, url: redirectUrl },
    });
  }

  ApiResponse.created(
    res,
    { recipientCount: totalCreated, targetRoles: roles, scheduled: false },
    `Announcement sent to ${totalCreated} users via email and in-app`
  );
});

// ===== COUPONS (Admin) =====

async function getAdminTenantId(req) {
  if (req.tenantId) return req.tenantId;
  if (req.user?.tenantId) return req.user.tenantId;
  const fresh = await runWithTenant(null, true, () =>
    prisma.user.findUnique({ where: { id: req.userId }, select: { tenantId: true } })
  );
  return fresh?.tenantId || null;
}

export const adminGetCoupons = catchAsync(async (req, res) => {
  const tenantId = await getAdminTenantId(req);
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  const where = {
    ...(tenantId ? { tenantId } : {}),
  };
  if (req.query.search) where.code = { contains: req.query.search, mode: 'insensitive' };
  if (req.query.isActive !== undefined) where.isActive = req.query.isActive === 'true';

  const [docs, total] = await Promise.all([
    prisma.coupon.findMany({ where, skip, take: limit, orderBy: { createdAt: 'desc' } }),
    prisma.coupon.count({ where }),
  ]);

  ApiResponse.paginated(res, { docs, page, limit, total });
});

export const adminGetCouponById = catchAsync(async (req, res) => {
  const tenantId = await getAdminTenantId(req);
  const where = {
    id: req.params.id,
    ...(tenantId ? { tenantId } : {}),
  };
  const coupon = await prisma.coupon.findFirst({ where });
  if (!coupon) throw ApiError.notFound('Coupon not found');
  ApiResponse.ok(res, { coupon });
});

export const adminCreateCoupon = catchAsync(async (req, res) => {
  const tenantId = await getAdminTenantId(req);
  const code = (req.body.code || '').toUpperCase();
  if (!code) throw ApiError.badRequest('Coupon code is required');

  const where = {
    code,
    ...(tenantId ? { tenantId } : {}),
  };
  const existing = await prisma.coupon.findFirst({ where });
  if (existing) throw ApiError.conflict('Coupon code already exists');

  const coupon = await prisma.coupon.create({
    data: {
      code,
      discountType: req.body.discountType || 'percentage',
      discountAmount: Number(req.body.discountAmount) || 0,
      discountPercent: Number(req.body.discountPercent) || 0,
      minOrderAmount: Number(req.body.minOrderAmount) || 0,
      maxDiscount: req.body.maxDiscount ? Number(req.body.maxDiscount) : null,
      maxUses: req.body.maxUses ? Number(req.body.maxUses) : null,
      isActive: req.body.isActive !== undefined ? Boolean(req.body.isActive) : true,
      validFrom: req.body.validFrom ? new Date(req.body.validFrom) : null,
      validUntil:
        req.body.validUntil || req.body.expiresAt
          ? new Date(req.body.validUntil || req.body.expiresAt)
          : null,
      tenantId: tenantId || null,
    },
  });
  ApiResponse.created(res, { coupon }, 'Coupon created');
});

export const adminUpdateCoupon = catchAsync(async (req, res) => {
  const tenantId = await getAdminTenantId(req);
  if (req.body.code) req.body.code = req.body.code.toUpperCase();

  const where = {
    id: req.params.id,
    ...(tenantId ? { tenantId } : {}),
  };
  const coupon = await prisma.coupon.findFirst({ where });
  if (!coupon) throw ApiError.notFound('Coupon not found');

  const updateData = {
    ...req.body,
    ...(req.body.discountAmount !== undefined && {
      discountAmount: Number(req.body.discountAmount),
    }),
    ...(req.body.discountPercent !== undefined && {
      discountPercent: Number(req.body.discountPercent),
    }),
    ...(req.body.minOrderAmount !== undefined && {
      minOrderAmount: Number(req.body.minOrderAmount),
    }),
    ...(req.body.maxDiscount !== undefined && {
      maxDiscount: req.body.maxDiscount ? Number(req.body.maxDiscount) : null,
    }),
    ...(req.body.maxUses !== undefined && {
      maxUses: req.body.maxUses ? Number(req.body.maxUses) : null,
    }),
  };

  const updated = await prisma.coupon.update({
    where: { id: coupon.id },
    data: updateData,
  });

  ApiResponse.ok(res, { coupon: updated }, 'Coupon updated');
});

export const adminDeleteCoupon = catchAsync(async (req, res) => {
  const tenantId = await getAdminTenantId(req);
  const where = {
    id: req.params.id,
    ...(tenantId ? { tenantId } : {}),
  };
  const coupon = await prisma.coupon.findFirst({ where });
  if (!coupon) throw ApiError.notFound('Coupon not found');

  await prisma.coupon.delete({ where: { id: coupon.id } });
  ApiResponse.ok(res, null, 'Coupon deleted');
});
