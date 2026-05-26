import Institute from './institute.model.js';
import User from '../user/user.model.js';
import SubscriptionPlan from '../subscription/subscriptionPlan.model.js';
import Enrollment from '../enrollment/enrollment.model.js';
import Course from '../course/course.model.js';
import ApiError from '../../utils/ApiError.js';
import ApiResponse from '../../utils/ApiResponse.js';
import catchAsync from '../../utils/catchAsync.js';
import { runWithTenant } from '../../utils/TenantContext.js';
import { invalidateTenantCache } from '../../middleware/tenant.middleware.js';

/**
 * Retrieve branding configuration for the active tenant.
 */
export const getBranding = catchAsync(async (req, res) => {
  if (!req.tenant) {
    throw ApiError.badRequest('No active institute resolved. Please check the subdomain.');
  }

  ApiResponse.ok(
    res,
    {
      name: req.tenant.name,
      subdomain: req.tenant.subdomain,
      logo: req.tenant.logo,
      theme: req.tenant.theme,
      websiteTitle: req.tenant.websiteTitle,
      contactDetails: req.tenant.contactDetails,
      limits: req.tenant.limits,
    },
    'Branding configuration retrieved'
  );
});

/**
 * Public self-service onboarding for new institutes.
 * Registers the institute and its initial owner/admin.
 */
export const onboardInstitute = catchAsync(async (req, res) => {
  const { name, subdomain, adminName, adminEmail, adminPassword } = req.body;

  // Run in global/bypassed context because we are writing across tenant boundaries
  return runWithTenant(null, true, async () => {
    // Check if subdomain is taken
    const existingSubdomain = await Institute.findOne({ subdomain: subdomain.toLowerCase() });
    if (existingSubdomain) {
      throw ApiError.conflict('This subdomain is already taken.');
    }

    // Resolve default Starter plan
    let plan = await SubscriptionPlan.findOne({ name: 'starter' });
    if (!plan) {
      // Seed starter plan on-demand if missing
      plan = await SubscriptionPlan.create({
        name: 'starter',
        price: 0,
        studentLimit: 100,
        teacherLimit: 5,
        storageLimit: 10 * 1024 * 1024 * 1024,
        features: ['custom_branding'],
      });
    }

    // 1. Create a dummy temp user or create user with a temporary tenantId
    const userId = new User()._id;
    const instituteId = new Institute()._id;

    // 2. Create owner user
    const owner = await User.create({
      _id: userId,
      name: adminName,
      email: adminEmail.toLowerCase(),
      password: adminPassword,
      role: 'admin',
      tenantId: instituteId,
      isEmailVerified: true, // Auto verify for the institute admin onboarding
    });

    // 3. Create institute
    const institute = await Institute.create({
      _id: instituteId,
      name,
      subdomain: subdomain.toLowerCase(),
      owner: userId,
      subscription: {
        plan: plan._id,
        status: 'active',
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days trial
      },
      limits: {
        studentLimit: plan.studentLimit,
        teacherLimit: plan.teacherLimit,
        storageLimit: plan.storageLimit,
      },
    });

    const token = owner.generateAccessToken();

    ApiResponse.created(
      res,
      {
        institute: {
          _id: institute._id,
          name: institute.name,
          subdomain: institute.subdomain,
        },
        admin: {
          _id: owner._id,
          name: owner.name,
          email: owner.email,
          role: owner.role,
        },
        token,
      },
      'Institute onboarded successfully'
    );
  });
});

/**
 * [SUPER ADMIN] Create a new institute.
 */
export const createInstitute = catchAsync(async (req, res) => {
  const {
    name,
    subdomain,
    customDomain,
    adminName,
    adminEmail,
    adminPassword,
    subscriptionPlanName,
  } = req.body;

  return runWithTenant(null, true, async () => {
    const existingSubdomain = await Institute.findOne({ subdomain: subdomain.toLowerCase() });
    if (existingSubdomain) {
      throw ApiError.conflict('Subdomain is already taken.');
    }

    // Resolve plan
    const planName = subscriptionPlanName || 'starter';
    const plan = await SubscriptionPlan.findOne({ name: planName.toLowerCase() });
    if (!plan) {
      throw ApiError.notFound(`Subscription plan '${planName}' not found`);
    }

    const userId = new User()._id;
    const instituteId = new Institute()._id;

    // Create Admin user
    const owner = await User.create({
      _id: userId,
      name: adminName,
      email: adminEmail.toLowerCase(),
      password: adminPassword,
      role: 'admin',
      tenantId: instituteId,
      isEmailVerified: true,
    });

    // Create Institute
    const institute = await Institute.create({
      _id: instituteId,
      name,
      subdomain: subdomain.toLowerCase(),
      customDomain: customDomain ? customDomain.toLowerCase() : undefined,
      owner: userId,
      subscription: {
        plan: plan._id,
        status: 'active',
        expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year default
      },
      limits: {
        studentLimit: plan.studentLimit,
        teacherLimit: plan.teacherLimit,
        storageLimit: plan.storageLimit,
      },
    });

    ApiResponse.created(res, { institute, admin: owner }, 'Institute created successfully');
  });
});

/**
 * [SUPER ADMIN] Get all institutes.
 */
export const getAllInstitutes = catchAsync(async (req, res) => {
  return runWithTenant(null, true, async () => {
    const institutes = await Institute.find()
      .populate('owner', 'name email')
      .populate('subscription.plan', 'name');
    ApiResponse.ok(res, { institutes });
  });
});

/**
 * [SUPER ADMIN] Update an institute (branding, subscription, limits).
 */
export const updateInstitute = catchAsync(async (req, res) => {
  const { id } = req.params;
  const updates = req.body;

  return runWithTenant(null, true, async () => {
    const institute = await Institute.findByIdAndUpdate(id, updates, {
      new: true,
      runValidators: true,
    });

    if (!institute) {
      throw ApiError.notFound('Institute not found');
    }

    ApiResponse.ok(res, { institute }, 'Institute updated successfully');
  });
});

/**
 * [SUPER ADMIN / OWNER] Update branding details.
 */
export const updateBranding = catchAsync(async (req, res) => {
  const { name, logo, theme, websiteTitle, contactDetails } = req.body;
  const instituteId = req.tenantId; // Bound from active tenant middleware

  return runWithTenant(null, true, async () => {
    const institute = await Institute.findByIdAndUpdate(
      instituteId,
      { name, logo, theme, websiteTitle, contactDetails },
      { new: true, runValidators: true }
    );

    ApiResponse.ok(res, { institute }, 'Branding updated successfully');
  });
});

/**
 * [SUPER ADMIN] Delete/suspend an institute.
 */
export const deleteInstitute = catchAsync(async (req, res) => {
  const { id } = req.params;

  return runWithTenant(null, true, async () => {
    const institute = await Institute.findByIdAndUpdate(id, { isActive: false }, { new: true });
    if (!institute) {
      throw ApiError.notFound('Institute not found');
    }
    await invalidateTenantCache(institute.subdomain, id);
    ApiResponse.ok(res, null, 'Institute deactivated successfully');
  });
});

/**
 * [PUBLIC] Check subdomain availability.
 */
export const checkSubdomain = catchAsync(async (req, res) => {
  const { subdomain } = req.params;
  const normalized = subdomain.toLowerCase().trim();

  if (!/^[a-z0-9-]{3,50}$/.test(normalized)) {
    return ApiResponse.ok(res, {
      available: false,
      reason: 'Subdomain must be 3-50 lowercase alphanumeric chars or hyphens',
    });
  }

  const reserved = [
    'www',
    'api',
    'admin',
    'app',
    'mail',
    'ftp',
    'dashboard',
    'staging',
    'dev',
    'test',
  ];
  if (reserved.includes(normalized)) {
    return ApiResponse.ok(res, { available: false, reason: 'This subdomain is reserved' });
  }

  return runWithTenant(null, true, async () => {
    const existing = await Institute.findOne({ subdomain: normalized }).select('_id').lean();
    ApiResponse.ok(res, { available: !existing, subdomain: normalized });
  });
});

/**
 * [SUPER ADMIN] Suspend an institute.
 */
export const suspendInstitute = catchAsync(async (req, res) => {
  const { id } = req.params;

  return runWithTenant(null, true, async () => {
    const institute = await Institute.findByIdAndUpdate(
      id,
      { isActive: false, 'subscription.status': 'suspended' },
      { new: true }
    );
    if (!institute) throw ApiError.notFound('Institute not found');
    await invalidateTenantCache(institute.subdomain, id);
    ApiResponse.ok(res, { institute }, 'Institute suspended');
  });
});

/**
 * [SUPER ADMIN] Activate a suspended institute.
 */
export const activateInstitute = catchAsync(async (req, res) => {
  const { id } = req.params;

  return runWithTenant(null, true, async () => {
    const institute = await Institute.findByIdAndUpdate(
      id,
      { isActive: true, 'subscription.status': 'active' },
      { new: true }
    );
    if (!institute) throw ApiError.notFound('Institute not found');
    await invalidateTenantCache(institute.subdomain, id);
    ApiResponse.ok(res, { institute }, 'Institute activated');
  });
});

/**
 * [SUPER ADMIN] Platform-wide aggregate stats.
 */
export const getSuperAdminStats = catchAsync(async (req, res) => {
  return runWithTenant(null, true, async () => {
    const [
      totalInstitutes,
      activeInstitutes,
      suspendedInstitutes,
      expiredInstitutes,
      totalUsers,
      totalCourses,
      totalEnrollments,
    ] = await Promise.all([
      Institute.countDocuments({}),
      Institute.countDocuments({ isActive: true, 'subscription.status': 'active' }),
      Institute.countDocuments({ 'subscription.status': 'suspended' }),
      Institute.countDocuments({ 'subscription.status': 'expired' }),
      User.countDocuments({}),
      Course.countDocuments({}),
      Enrollment.countDocuments({}),
    ]);

    // Revenue trend: institutes created per month for last 6 months
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const growth = await Institute.aggregate([
      { $match: { createdAt: { $gte: sixMonthsAgo } } },
      {
        $group: {
          _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } },
          count: { $sum: 1 },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]);

    ApiResponse.ok(
      res,
      {
        institutes: {
          total: totalInstitutes,
          active: activeInstitutes,
          suspended: suspendedInstitutes,
          expired: expiredInstitutes,
        },
        users: totalUsers,
        courses: totalCourses,
        enrollments: totalEnrollments,
        growth,
      },
      'Platform stats retrieved'
    );
  });
});
