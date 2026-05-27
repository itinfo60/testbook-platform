import {
  User,
  Course,
  Enrollment,
  Review,
  Test,
  TestAttempt,
  Quiz,
  Payment,
  Notification,
  Coupon,
} from '../../models/index.js';
import ApiResponse from '../../utils/ApiResponse.js';
import ApiError from '../../utils/ApiError.js';
import catchAsync from '../../utils/catchAsync.js';
import redis from '../../config/redis.js';
import { buildPaginationQuery, buildFilterQuery } from '../../utils/pagination.js';
import { getDateRange } from '../../utils/helpers.js';
import { runWithTenant } from '../../utils/TenantContext.js';
import { reminderQueue, transactionalEmailQueue } from '../../queues/index.js';

// ===== DASHBOARD =====

export const getDashboardStats = catchAsync(async (req, res) => {
  const cached = await redis.get('admin:dashboard');
  if (cached) return ApiResponse.ok(res, cached);

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
  const startOfWeek = new Date(now.getTime() - 7 * 86400000);

  const [
    totalUsers,
    totalCourses,
    totalEnrollments,
    totalTests,
    totalReviews,
    usersThisMonth,
    usersLastMonth,
    enrollmentsThisMonth,
    enrollmentsLastMonth,
    publishedCourses,
    activeEnrollments,
    completedEnrollments,
    recentUsers,
    recentEnrollments,
  ] = await Promise.all([
    User.countDocuments({ isActive: true }),
    Course.countDocuments(),
    Enrollment.countDocuments(),
    Test.countDocuments(),
    Review.countDocuments(),
    User.countDocuments({ createdAt: { $gte: startOfMonth } }),
    User.countDocuments({ createdAt: { $gte: startOfLastMonth, $lte: endOfLastMonth } }),
    Enrollment.countDocuments({ enrolledAt: { $gte: startOfMonth } }),
    Enrollment.countDocuments({ enrolledAt: { $gte: startOfLastMonth, $lte: endOfLastMonth } }),
    Course.countDocuments({ isPublished: true }),
    Enrollment.countDocuments({ status: 'active' }),
    Enrollment.countDocuments({ status: 'completed' }),
    User.find().sort('-createdAt').limit(5).select('name email role createdAt avatar').lean(),
    Enrollment.find()
      .sort('-enrolledAt')
      .limit(5)
      .populate('user', 'name email avatar')
      .populate('course', 'title thumbnail price')
      .lean(),
  ]);

  // Revenue calculation
  const revenueAgg = await Payment.aggregate([
    { $match: { status: 'completed' } },
    {
      $group: {
        _id: null,
        totalRevenue: { $sum: '$amount' },
        thisMonthRevenue: {
          $sum: { $cond: [{ $gte: ['$createdAt', startOfMonth] }, '$amount', 0] },
        },
        lastMonthRevenue: {
          $sum: {
            $cond: [
              {
                $and: [
                  { $gte: ['$createdAt', startOfLastMonth] },
                  { $lte: ['$createdAt', endOfLastMonth] },
                ],
              },
              '$amount',
              0,
            ],
          },
        },
        thisWeekRevenue: {
          $sum: { $cond: [{ $gte: ['$createdAt', startOfWeek] }, '$amount', 0] },
        },
      },
    },
  ]);

  const revenue = revenueAgg[0] || {
    totalRevenue: 0,
    thisMonthRevenue: 0,
    lastMonthRevenue: 0,
    thisWeekRevenue: 0,
  };

  // Monthly trends (last 6 months)
  const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);
  const monthlyTrends = await Enrollment.aggregate([
    { $match: { enrolledAt: { $gte: sixMonthsAgo } } },
    {
      $group: {
        _id: { year: { $year: '$enrolledAt' }, month: { $month: '$enrolledAt' } },
        count: { $sum: 1 },
        revenue: { $sum: '$amountPaid' },
      },
    },
    { $sort: { '_id.year': 1, '_id.month': 1 } },
  ]);

  // Role distribution
  const roleDistribution = await User.aggregate([
    { $match: { isActive: true } },
    { $group: { _id: '$role', count: { $sum: 1 } } },
  ]);

  // Helper: calculate growth percentage
  const calcGrowth = (current, previous) => {
    if (!previous) return current > 0 ? 100 : 0;
    return Math.round(((current - previous) / previous) * 100);
  };

  const data = {
    overview: {
      totalUsers,
      totalCourses,
      publishedCourses,
      totalEnrollments,
      activeEnrollments,
      completedEnrollments,
      totalTests,
      totalReviews,
    },
    revenue: {
      total: revenue.totalRevenue,
      thisMonth: revenue.thisMonthRevenue,
      lastMonth: revenue.lastMonthRevenue,
      thisWeek: revenue.thisWeekRevenue,
      growth: calcGrowth(revenue.thisMonthRevenue, revenue.lastMonthRevenue),
    },
    growth: {
      users: calcGrowth(usersThisMonth, usersLastMonth),
      enrollments: calcGrowth(enrollmentsThisMonth, enrollmentsLastMonth),
      usersThisMonth,
      enrollmentsThisMonth,
    },
    roleDistribution: roleDistribution.reduce((acc, r) => {
      acc[r._id] = r.count;
      return acc;
    }, {}),
    monthlyTrends,
    recent: { users: recentUsers, enrollments: recentEnrollments },
  };

  await redis.set('admin:dashboard', data, 300); // 5 min cache

  ApiResponse.ok(res, data);
});

// ===== USER MANAGEMENT =====

export const getUsers = catchAsync(async (req, res) => {
  const pagination = buildPaginationQuery(req.query);

  const filter = buildFilterQuery(req.query, {
    search: { type: 'search', field: 'name' },
    role: { type: 'exact' },
    isActive: { type: 'boolean' },
  });

  // Also search by email
  if (req.query.search) {
    filter.$or = [
      { name: { $regex: req.query.search, $options: 'i' } },
      { email: { $regex: req.query.search, $options: 'i' } },
    ];
    delete filter.name;
  }

  const result = await User.paginate(filter, {
    ...pagination,
    select: '-refreshTokens -resetPasswordToken -emailVerificationToken',
  });

  ApiResponse.paginated(res, {
    docs: result.docs,
    page: result.pagination.page,
    limit: result.pagination.limit,
    total: result.pagination.total,
  });
});

export const getUserById = catchAsync(async (req, res) => {
  const user = await User.findById(req.params.id)
    .select('-refreshTokens -resetPasswordToken -emailVerificationToken')
    .lean();

  if (!user) throw ApiError.notFound('User not found');

  // Get user stats
  const [enrollments, completedCourses, testAttempts, reviews] = await Promise.all([
    Enrollment.countDocuments({ user: user._id }),
    Enrollment.countDocuments({ user: user._id, status: 'completed' }),
    TestAttempt.countDocuments({ user: user._id, status: 'completed' }),
    Review.countDocuments({ user: user._id }),
  ]);

  ApiResponse.ok(res, {
    user,
    stats: { enrollments, completedCourses, testAttempts, reviews },
  });
});

export const createUser = catchAsync(async (req, res) => {
  const { name, email, password, role } = req.body;

  const existing = await User.findOne({ email });
  if (existing) throw ApiError.conflict('Email already registered');

  const user = await User.create({
    name,
    email,
    password,
    role,
    isEmailVerified: true, // Admin-created users are auto-verified
  });

  ApiResponse.created(
    res,
    {
      user: { _id: user._id, name: user.name, email: user.email, role: user.role },
    },
    'User created'
  );
});

export const updateUser = catchAsync(async (req, res) => {
  const allowedFields = ['name', 'email', 'role', 'isActive', 'isEmailVerified', 'bio', 'phone'];
  const updates = {};
  allowedFields.forEach((f) => {
    if (req.body[f] !== undefined) updates[f] = req.body[f];
  });

  const user = await User.findByIdAndUpdate(req.params.id, updates, {
    new: true,
    runValidators: true,
  }).select('-refreshTokens');

  if (!user) throw ApiError.notFound('User not found');

  await redis.del(`user_${user._id}`);

  ApiResponse.ok(res, { user }, 'User updated');
});

export const deleteUser = catchAsync(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) throw ApiError.notFound('User not found');

  // Prevent deleting super_admin
  if (user.role === 'super_admin') {
    throw ApiError.forbidden('Cannot delete super admin');
  }

  // Soft delete: deactivate instead of hard delete
  user.isActive = false;
  user.refreshTokens = [];
  await user.save();

  await redis.del(`user_${user._id}`);

  ApiResponse.ok(res, null, 'User deactivated');
});

// ===== COURSE OVERSIGHT =====

export const adminGetCourses = catchAsync(async (req, res) => {
  const pagination = buildPaginationQuery(req.query);

  const filter = buildFilterQuery(req.query, {
    search: { type: 'search', field: 'title' },
    status: { type: 'exact' },
    isFeatured: { type: 'boolean' },
  });

  // Handle published/unpublished status
  if (req.query.status === 'published') {
    delete filter.status;
    filter.isPublished = true;
  } else if (req.query.status === 'unpublished') {
    delete filter.status;
    filter.isPublished = false;
  }

  const result = await Course.paginate(filter, {
    ...pagination,
    populate: [
      { path: 'teacher', select: 'name email avatar' },
      { path: 'category', select: 'name' },
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

export const adminUpdateCourse = catchAsync(async (req, res) => {
  const course = await Course.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  if (!course) throw ApiError.notFound('Course not found');

  await redis.delPattern('courses:*');
  await redis.del(`course:${course.slug}`);

  ApiResponse.ok(res, { course }, 'Course updated');
});

export const adminDeleteCourse = catchAsync(async (req, res) => {
  const course = await Course.findById(req.params.id);
  if (!course) throw ApiError.notFound('Course not found');

  await course.softDelete(req.userId);

  await redis.delPattern('courses:*');
  await redis.del(`course:${course.slug}`);

  ApiResponse.ok(res, null, 'Course deleted');
});

export const toggleFeatured = catchAsync(async (req, res) => {
  const course = await Course.findById(req.params.id);
  if (!course) throw ApiError.notFound('Course not found');

  course.isFeatured = !course.isFeatured;
  await course.save();

  await redis.delPattern('courses:*');

  ApiResponse.ok(
    res,
    { isFeatured: course.isFeatured },
    `Course ${course.isFeatured ? 'featured' : 'unfeatured'}`
  );
});

// ===== QUIZ OVERSIGHT =====

export const adminGetQuizzes = catchAsync(async (req, res) => {
  const pagination = buildPaginationQuery(req.query);

  const filter = {};
  if (req.query.search) filter.title = { $regex: req.query.search, $options: 'i' };

  const result = await Quiz.paginate(filter, {
    ...pagination,
    populate: [
      { path: 'course', select: 'title' },
      { path: 'teacher', select: 'name' },
    ],
  });

  ApiResponse.paginated(res, {
    docs: result.docs,
    page: result.pagination.page,
    limit: result.pagination.limit,
    total: result.pagination.total,
  });
});

export const adminDeleteQuiz = catchAsync(async (req, res) => {
  const quiz = await Quiz.findByIdAndDelete(req.params.id);
  if (!quiz) throw ApiError.notFound('Quiz not found');

  ApiResponse.ok(res, null, 'Quiz deleted');
});

// ===== TEST OVERSIGHT =====

export const adminGetTests = catchAsync(async (req, res) => {
  const pagination = buildPaginationQuery(req.query);

  const filter = buildFilterQuery(req.query, {
    search: { type: 'search', field: 'title' },
    status: { type: 'exact' },
    difficulty: { type: 'exact' },
  });

  const result = await Test.paginate(filter, {
    ...pagination,
    populate: [
      { path: 'teacher', select: 'name email' },
      { path: 'category', select: 'name' },
    ],
    select: '-questions',
  });

  ApiResponse.paginated(res, {
    docs: result.docs,
    page: result.pagination.page,
    limit: result.pagination.limit,
    total: result.pagination.total,
  });
});

export const adminDeleteTest = catchAsync(async (req, res) => {
  const test = await Test.findByIdAndDelete(req.params.id);
  if (!test) throw ApiError.notFound('Test not found');

  await TestAttempt.deleteMany({ test: test._id });

  ApiResponse.ok(res, null, 'Test and attempts deleted');
});

// ===== REVIEW MODERATION =====

export const adminGetReviews = catchAsync(async (req, res) => {
  const pagination = buildPaginationQuery(req.query);

  const filter = {};
  if (req.query.search) {
    filter.comment = { $regex: req.query.search, $options: 'i' };
  }
  if (req.query.rating) filter.rating = parseInt(req.query.rating);
  if (req.query.isFlagged === 'true') filter.isFlagged = true;

  const result = await Review.paginate(filter, {
    ...pagination,
    populate: [
      { path: 'user', select: 'name email avatar' },
      { path: 'course', select: 'title slug' },
    ],
  });

  ApiResponse.paginated(res, {
    docs: result.docs,
    page: result.pagination.page,
    limit: result.pagination.limit,
    total: result.pagination.total,
  });
});

export const adminDeleteReview = catchAsync(async (req, res) => {
  const review = await Review.findByIdAndDelete(req.params.id);
  if (!review) throw ApiError.notFound('Review not found');

  ApiResponse.ok(res, null, 'Review deleted');
});

export const adminBulkDeleteReviews = catchAsync(async (req, res) => {
  const { reviewIds } = req.body;

  if (!Array.isArray(reviewIds) || reviewIds.length === 0) {
    throw ApiError.badRequest('reviewIds array is required');
  }

  // Get affected course ratings BEFORE deletion
  const affectedCourses = await Review.distinct('course', { _id: { $in: reviewIds } });

  const result = await Review.deleteMany({ _id: { $in: reviewIds } });

  // Recalculate affected course ratings
  for (const courseId of affectedCourses) {
    await Review.calculateAverageRating(courseId);
  }

  await redis.delPattern('courses:*');

  ApiResponse.ok(
    res,
    { deletedCount: result.deletedCount },
    `${result.deletedCount} reviews deleted`
  );
});

export const adminToggleReviewApproval = catchAsync(async (req, res) => {
  const review = await Review.findById(req.params.id);
  if (!review) throw ApiError.notFound('Review not found');

  review.isApproved = !review.isApproved;
  await review.save();

  ApiResponse.ok(
    res,
    { isApproved: review.isApproved },
    `Review ${review.isApproved ? 'approved' : 'hidden'}`
  );
});

// ===== REVENUE =====

export const getRevenue = catchAsync(async (req, res) => {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
  const startOfWeek = new Date(now.getTime() - 7 * 86400000);
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  // Overall stats
  const [totalPaid, totalFree, totalEnrollments] = await Promise.all([
    Enrollment.countDocuments({ amountPaid: { $gt: 0 } }),
    Enrollment.countDocuments({ $or: [{ amountPaid: 0 }, { amountPaid: { $exists: false } }] }),
    Enrollment.countDocuments(),
  ]);

  // Revenue aggregation
  const revenueStats = await Payment.aggregate([
    { $match: { status: 'completed' } },
    {
      $group: {
        _id: null,
        totalRevenue: { $sum: '$amount' },
        avgOrderValue: { $avg: '$amount' },
        totalOrders: { $sum: 1 },
      },
    },
  ]);

  // Period-wise revenue
  const periodRevenue = await Payment.aggregate([
    { $match: { status: 'completed' } },
    {
      $group: {
        _id: null,
        today: { $sum: { $cond: [{ $gte: ['$createdAt', startOfDay] }, '$amount', 0] } },
        thisWeek: { $sum: { $cond: [{ $gte: ['$createdAt', startOfWeek] }, '$amount', 0] } },
        thisMonth: { $sum: { $cond: [{ $gte: ['$createdAt', startOfMonth] }, '$amount', 0] } },
        lastMonth: {
          $sum: {
            $cond: [
              {
                $and: [
                  { $gte: ['$createdAt', startOfLastMonth] },
                  { $lte: ['$createdAt', endOfLastMonth] },
                ],
              },
              '$amount',
              0,
            ],
          },
        },
      },
    },
  ]);

  // Daily revenue (last 30 days)
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 86400000);
  const dailyRevenue = await Payment.aggregate([
    { $match: { status: 'completed', createdAt: { $gte: thirtyDaysAgo } } },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
        revenue: { $sum: '$amount' },
        orders: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  // Top courses by revenue
  const topCourses = await Payment.aggregate([
    { $match: { status: 'completed' } },
    {
      $group: {
        _id: '$course',
        revenue: { $sum: '$amount' },
        orders: { $sum: 1 },
      },
    },
    { $sort: { revenue: -1 } },
    { $limit: 10 },
    {
      $lookup: {
        from: 'courses',
        localField: '_id',
        foreignField: '_id',
        as: 'course',
      },
    },
    { $unwind: '$course' },
    {
      $project: {
        revenue: 1,
        orders: 1,
        'course.title': 1,
        'course.thumbnail': 1,
        'course.price': 1,
      },
    },
  ]);

  const stats = revenueStats[0] || { totalRevenue: 0, avgOrderValue: 0, totalOrders: 0 };
  const periods = periodRevenue[0] || { today: 0, thisWeek: 0, thisMonth: 0, lastMonth: 0 };

  const calcGrowth = (current, previous) => {
    if (!previous) return current > 0 ? 100 : 0;
    return Math.round(((current - previous) / previous) * 100);
  };

  ApiResponse.ok(res, {
    overview: {
      totalRevenue: stats.totalRevenue,
      avgOrderValue: Math.round(stats.avgOrderValue || 0),
      totalOrders: stats.totalOrders,
      totalPaidEnrollments: totalPaid,
      totalFreeEnrollments: totalFree,
      totalEnrollments,
      conversionRate: totalEnrollments > 0 ? Math.round((totalPaid / totalEnrollments) * 100) : 0,
    },
    periods: {
      ...periods,
      monthlyGrowth: calcGrowth(periods.thisMonth, periods.lastMonth),
    },
    dailyRevenue,
    topCourses,
  });
});

// ===== ENROLLMENT MANAGEMENT =====

export const adminGetEnrollments = catchAsync(async (req, res) => {
  const pagination = buildPaginationQuery(req.query);

  const filter = buildFilterQuery(req.query, {
    status: { type: 'exact' },
    date: { type: 'dateRange', field: 'enrolledAt' },
  });

  if (req.query.search) {
    const searchRegex = new RegExp(req.query.search, 'i');

    // Find matching users and courses
    const [matchingUsers, matchingCourses] = await Promise.all([
      User.find({
        $or: [{ name: searchRegex }, { email: searchRegex }],
      }).distinct('_id'),
      Course.find({ title: searchRegex }).distinct('_id'),
    ]);

    filter.$or = [{ user: { $in: matchingUsers } }, { course: { $in: matchingCourses } }];
  }

  const result = await Enrollment.paginate(filter, {
    ...pagination,
    populate: [
      { path: 'user', select: 'name email avatar' },
      { path: 'course', select: 'title thumbnail price' },
    ],
    sort: '-enrolledAt',
  });

  const docs = result.docs;

  // Stats
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const [activeCount, completedCount, thisMonthCount] = await Promise.all([
    Enrollment.countDocuments({ status: { $ne: 'completed' } }),
    Enrollment.countDocuments({ status: 'completed' }),
    Enrollment.countDocuments({ enrolledAt: { $gte: startOfMonth } }),
  ]);

  ApiResponse.paginated(res, {
    docs,
    page: result.pagination.page,
    limit: result.pagination.limit,
    total: result.pagination.total,
    stats: {
      total: result.pagination.total,
      active: activeCount,
      completed: completedCount,
      thisMonth: thisMonthCount,
    },
  });
});

export const adminExportEnrollments = catchAsync(async (req, res) => {
  const filter = buildFilterQuery(req.query, {
    status: { type: 'exact' },
    date: { type: 'dateRange', field: 'enrolledAt' },
  });

  const enrollments = await Enrollment.find(filter)
    .populate('user', 'name email')
    .populate('course', 'title price')
    .sort('-enrolledAt')
    .lean();

  // Generate CSV
  const headers = 'Student Name,Email,Course,Amount Paid,Status,Enrolled Date,Progress\n';
  const rows = enrollments
    .map(
      (e) =>
        `"${e.user?.name || 'N/A'}","${e.user?.email || 'N/A'}","${e.course?.title || 'N/A'}",${e.amountPaid || 0},"${e.status}","${e.enrolledAt?.toISOString().split('T')[0] || ''}",${e.progressPercentage || 0}%`
    )
    .join('\n');

  const csv = headers + rows;

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename=enrollments-${Date.now()}.csv`);
  res.send(csv);
});

// ===== TEACHER MANAGEMENT =====

export const getTeachers = catchAsync(async (req, res) => {
  const pagination = buildPaginationQuery(req.query);

  const filter = { role: 'teacher' };
  if (req.query.search) {
    filter.$or = [
      { name: { $regex: req.query.search, $options: 'i' } },
      { email: { $regex: req.query.search, $options: 'i' } },
    ];
  }
  if (req.query.isActive !== undefined) filter.isActive = req.query.isActive === 'true';
  if (req.query.isVerified === 'true') filter['teacherProfile.isVerified'] = true;

  const result = await User.paginate(filter, {
    ...pagination,
    select: 'name email avatar role isActive teacherProfile createdAt',
  });

  // Enrich with course/student counts
  const enriched = await Promise.all(
    result.docs.map(async (teacher) => {
      const courseIds = await Course.find({ teacher: teacher._id }).distinct('_id');
      const [courseCount, studentCount, revenue] = await Promise.all([
        Course.countDocuments({ teacher: teacher._id }),
        Enrollment.countDocuments({
          course: { $in: courseIds },
        }),
        Payment.aggregate([
          {
            $match: {
              course: { $in: courseIds },
              status: 'completed',
            },
          },
          { $group: { _id: null, total: { $sum: '$amount' } } },
        ]),
      ]);

      return {
        ...teacher,
        courseCount,
        studentCount,
        totalRevenue: revenue[0]?.total || 0,
      };
    })
  );

  ApiResponse.paginated(res, {
    docs: enriched,
    page: result.pagination.page,
    limit: result.pagination.limit,
    total: result.pagination.total,
  });
});

export const verifyTeacher = catchAsync(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user || user.role !== 'teacher') throw ApiError.notFound('Teacher not found');

  user.teacherProfile.isVerified = !user.teacherProfile.isVerified;
  await user.save();

  await redis.del(`user_${user._id}`);

  ApiResponse.ok(
    res,
    { isVerified: user.teacherProfile.isVerified },
    `Teacher ${user.teacherProfile.isVerified ? 'verified' : 'unverified'}`
  );
});

// ===== ANNOUNCEMENTS =====

export const sendAnnouncement = catchAsync(async (req, res) => {
  const { title, message, targetRoles, link, scheduledAt } = req.body;

  if (!title || !message) {
    throw ApiError.badRequest('Title and message are required');
  }

  const roles = targetRoles || ['student', 'teacher'];

  // Handle scheduling
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
          link: link || '',
          senderId: req.userId,
        },
        { delay }
      );

      return ApiResponse.created(
        res,
        {
          scheduled: true,
          scheduledAt,
          targetRoles: roles,
        },
        'Announcement scheduled successfully'
      );
    }
  }

  // Get target users (instant send)
  const targetUsers = await User.find({
    role: { $in: roles },
    isActive: true,
  })
    .select('_id name email')
    .lean();

  // Create notifications in bulk (In-App)
  const notifications = targetUsers.map((user) => ({
    recipient: user._id,
    sender: req.userId,
    type: 'announcement',
    title,
    message,
    link: link || '',
    isBroadcast: true,
    targetRoles: roles,
  }));

  // Insert in batches of 1000
  const batchSize = 1000;
  let totalCreated = 0;
  for (let i = 0; i < notifications.length; i += batchSize) {
    const batch = notifications.slice(i, i + batchSize);
    const result = await Notification.insertMany(batch, { ordered: false });
    totalCreated += result.length;
  }

  // Queue emails for each user (Multi-channel)
  for (const user of targetUsers) {
    await transactionalEmailQueue.add('send', {
      type: 'announcement',
      data: {
        user,
        title,
        message,
      },
    });
  }

  ApiResponse.created(
    res,
    {
      recipientCount: totalCreated,
      targetRoles: roles,
      scheduled: false,
    },
    `Announcement sent to ${totalCreated} users via email and in-app`
  );
});

// ===== COUPONS (Admin — no requireTenant needed) =====

// Helper: get tenantId from req.user, falling back to a fresh DB lookup in case the cache is stale
async function getAdminTenantId(req) {
  // 1. Tenant middleware already resolved it from X-Tenant-Id / subdomain header
  if (req.tenantId) return req.tenantId;
  // 2. Attached from JWT/user object
  if (req.user?.tenantId) return req.user.tenantId.toString();
  // 3. Redis cache may be stale — re-fetch in bypass mode so the tenant plugin
  //    doesn't add a tenantId filter that would exclude this user
  const fresh = await runWithTenant(null, true, () =>
    User.findById(req.userId).select('tenantId').lean()
  );
  if (!fresh?.tenantId) {
    throw ApiError.forbidden(
      'Your account is not linked to an institute. Super-admin accounts must supply an X-Tenant-Id header.'
    );
  }
  return fresh.tenantId.toString();
}

export const adminGetCoupons = catchAsync(async (req, res) => {
  const tenantId = await getAdminTenantId(req);
  const filter = { tenantId };
  if (req.query.search) filter.code = { $regex: req.query.search, $options: 'i' };
  if (req.query.isActive !== undefined) filter.isActive = req.query.isActive === 'true';

  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const total = await Coupon.countDocuments(filter);
  const docs = await Coupon.find(filter)
    .sort('-createdAt')
    .skip((page - 1) * limit)
    .limit(limit)
    .lean();

  ApiResponse.paginated(res, { docs, page, limit, total });
});

export const adminGetCouponById = catchAsync(async (req, res) => {
  const tenantId = await getAdminTenantId(req);
  const coupon = await Coupon.findOne({ _id: req.params.id, tenantId }).lean();
  if (!coupon) throw ApiError.notFound('Coupon not found');
  ApiResponse.ok(res, { coupon });
});

export const adminCreateCoupon = catchAsync(async (req, res) => {
  const tenantId = await getAdminTenantId(req);
  const code = req.body.code?.toUpperCase();
  const existing = await Coupon.findOne({ code, tenantId });
  if (existing) throw ApiError.conflict('Coupon code already exists');
  const coupon = await Coupon.create({ ...req.body, code, tenantId });
  ApiResponse.created(res, { coupon }, 'Coupon created');
});

export const adminUpdateCoupon = catchAsync(async (req, res) => {
  const tenantId = await getAdminTenantId(req);
  if (req.body.code) req.body.code = req.body.code.toUpperCase();
  const coupon = await Coupon.findOneAndUpdate({ _id: req.params.id, tenantId }, req.body, {
    new: true,
    runValidators: true,
  });
  if (!coupon) throw ApiError.notFound('Coupon not found');
  ApiResponse.ok(res, { coupon }, 'Coupon updated');
});

export const adminDeleteCoupon = catchAsync(async (req, res) => {
  const tenantId = await getAdminTenantId(req);
  const coupon = await Coupon.findOneAndDelete({ _id: req.params.id, tenantId });
  if (!coupon) throw ApiError.notFound('Coupon not found');
  ApiResponse.ok(res, null, 'Coupon deleted');
});
