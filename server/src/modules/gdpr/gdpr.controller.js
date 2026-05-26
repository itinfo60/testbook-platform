import User from '../user/user.model.js';
import Enrollment from '../enrollment/enrollment.model.js';
import Payment from '../payment/payment.model.js';
import ApiError from '../../utils/ApiError.js';
import ApiResponse from '../../utils/ApiResponse.js';
import catchAsync from '../../utils/catchAsync.js';
import { runWithTenant } from '../../utils/TenantContext.js';
import redis from '../../config/redis.js';

/**
 * GET /api/v1/gdpr/export — download all personal data as JSON
 */
export const exportMyData = catchAsync(async (req, res) => {
  const userId = req.userId;

  const [user, enrollments, payments] = await Promise.all([
    User.findById(userId).select('-password -refreshTokens -mfaSecret -mfaBackupCodes'),
    Enrollment.find({ student: userId }),
    runWithTenant(null, true, () => Payment.find({ user: userId })),
  ]);

  const exportPayload = {
    exportedAt: new Date().toISOString(),
    personal: {
      id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      bio: user.bio,
      role: user.role,
      createdAt: user.createdAt,
      lastActiveAt: user.lastActiveAt,
      consentGiven: user.consentGiven,
      consentAt: user.consentAt,
    },
    enrollments: enrollments.map((e) => ({
      courseId: e.course,
      enrolledAt: e.createdAt,
      completedAt: e.completedAt,
      completionPercentage: e.completionPercentage,
    })),
    payments: payments.map((p) => ({
      amount: p.amount,
      currency: p.currency,
      status: p.status,
      createdAt: p.createdAt,
    })),
  };

  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Content-Disposition', `attachment; filename="my-data-${userId}.json"`);
  res.json(exportPayload);
});

/**
 * DELETE /api/v1/gdpr/erase — GDPR right-to-erasure (soft delete + PII scrub)
 */
export const eraseMyData = catchAsync(async (req, res) => {
  const userId = req.userId;
  const { password } = req.body;

  const user = await User.findById(userId).select('+password');
  if (!user) throw ApiError.notFound('User not found');

  if (user.authProvider === 'local') {
    const isValid = await user.comparePassword(password);
    if (!isValid) throw ApiError.unauthorized('Invalid password');
  }

  // Scrub PII — keep record for audit but anonymise
  await runWithTenant(null, true, () =>
    User.findByIdAndUpdate(userId, {
      name: '[Deleted User]',
      email: `deleted_${userId}@erased.invalid`,
      phone: undefined,
      bio: undefined,
      avatar: { url: '', publicId: '' },
      isActive: false,
      fcmTokens: [],
      refreshTokens: [],
      googleId: undefined,
      mfaSecret: undefined,
      mfaEnabled: false,
    })
  );

  // Clear all caches
  await redis.del(`user_${userId}`);

  ApiResponse.ok(res, null, 'Your data has been erased. Account deactivated.');
});

/**
 * POST /api/v1/gdpr/consent — record consent
 */
export const recordConsent = catchAsync(async (req, res) => {
  const { version = '1.0' } = req.body;

  await User.findByIdAndUpdate(req.userId, {
    consentGiven: true,
    consentAt: new Date(),
    dataRetentionPolicyVersion: version,
  });

  await redis.del(`user_${req.userId}`);
  ApiResponse.ok(res, null, 'Consent recorded');
});

/**
 * GET /api/v1/gdpr/consent — get consent status
 */
export const getConsentStatus = catchAsync(async (req, res) => {
  const user = await User.findById(req.userId).select(
    'consentGiven consentAt dataRetentionPolicyVersion'
  );
  ApiResponse.ok(res, { consent: user });
});
