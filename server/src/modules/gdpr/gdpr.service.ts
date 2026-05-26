import User from '../user/user.model.js';
import Enrollment from '../enrollment/enrollment.model.js';
import Payment from '../payment/payment.model.js';
import { runWithTenant } from '../../core/tenant.context.js';
import { ApiError } from '../../core/api-error.js';
import redis from '../../config/redis.js';
import { IGdprExportPayload } from './gdpr.dto.js';

export class GdprService {
  async exportMyData(userId: string): Promise<IGdprExportPayload> {
    const [user, enrollments, payments] = await Promise.all([
      User.findById(userId).select('-password -refreshTokens -mfaSecret -mfaBackupCodes'),
      Enrollment.find({ user: userId }),
      runWithTenant(null, true, () => Payment.find({ user: userId })),
    ]);

    if (!user) {
      throw ApiError.notFound('User not found');
    }

    return {
      exportedAt: new Date().toISOString(),
      personal: {
        id: user._id.toString(),
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
      enrollments: enrollments.map((e: any) => ({
        courseId: e.course?.toString() || e.test?.toString() || '',
        enrolledAt: e.createdAt,
        completedAt: e.completedAt,
        completionPercentage: e.progressPercentage || 0,
      })),
      payments: payments.map((p: any) => ({
        amount: p.amount,
        currency: p.currency,
        status: p.status,
        createdAt: p.createdAt,
      })),
    };
  }

  async eraseMyData(userId: string, password?: string): Promise<void> {
    const user = await User.findById(userId).select('+password');
    if (!user) {
      throw ApiError.notFound('User not found');
    }

    if (user.authProvider === 'local') {
      if (!password) {
        throw ApiError.badRequest('Password is required to confirm data erasure');
      }
      const isValid = await user.comparePassword(password);
      if (!isValid) {
        throw ApiError.unauthorized('Invalid password');
      }
    }

    // Scrub PII — keep record for audit/analytics but anonymize personal details
    await runWithTenant(null, true, async () => {
      await User.findByIdAndUpdate(userId, {
        $set: {
          name: '[Deleted User]',
          email: `deleted_${userId}@erased.invalid`,
          avatar: { url: '', publicId: '' },
          isActive: false,
          fcmTokens: [],
          refreshTokens: [],
          googleId: undefined,
          mfaSecret: undefined,
          mfaEnabled: false,
        },
        $unset: {
          phone: 1,
          bio: 1,
        },
      });
    });

    // Clear user cache
    await redis.del(`user_${userId}`);
  }

  async recordConsent(userId: string, version: string = '1.0'): Promise<void> {
    const user = await User.findByIdAndUpdate(userId, {
      consentGiven: true,
      consentAt: new Date(),
      dataRetentionPolicyVersion: version,
    });

    if (!user) {
      throw ApiError.notFound('User not found');
    }

    await redis.del(`user_${userId}`);
  }

  async getConsentStatus(userId: string): Promise<any> {
    const user = await User.findById(userId).select(
      'consentGiven consentAt dataRetentionPolicyVersion'
    );
    if (!user) {
      throw ApiError.notFound('User not found');
    }
    return user;
  }
}

export default GdprService;
