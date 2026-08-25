import prisma from '../../config/prisma.js';
import { runWithTenant } from '../../core/tenant.context.js';
import { ApiError } from '../../core/api-error.js';
import redis from '../../config/redis.js';
import { IGdprExportPayload } from './gdpr.dto.js';
import { comparePassword } from '../user/user.utils.js';

export class GdprService {
  async exportMyData(userId: string): Promise<IGdprExportPayload> {
    const [user, enrollments, payments] = await Promise.all([
      prisma.user.findUnique({
        where: { id: userId },
      }),
      prisma.enrollment.findMany({ where: { userId } }),
      runWithTenant(null, true, () => prisma.payment.findMany({ where: { userId } })),
    ]);

    if (!user) {
      throw ApiError.notFound('User not found');
    }

    return {
      exportedAt: new Date().toISOString(),
      personal: {
        id: user.id,
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
        courseId: e.courseId || e.testId || '',
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
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw ApiError.notFound('User not found');
    }

    if (user.authProvider === 'local') {
      if (!password) {
        throw ApiError.badRequest('Password is required to confirm data erasure');
      }
      const isValid = await comparePassword(user.password, password);
      if (!isValid) {
        throw ApiError.unauthorized('Invalid password');
      }
    }

    // Scrub PII — keep record for audit/analytics but anonymize personal details
    await runWithTenant(null, true, async () => {
      await prisma.user.update({
        where: { id: userId },
        data: {
          name: '[Deleted User]',
          email: `deleted_${userId}@erased.invalid`,
          avatar: '',
          isActive: false,
          fcmTokens: [],
          refreshTokens: [],
          googleId: null,
          mfaSecret: null,
          mfaEnabled: false,
          phone: null,
          bio: null,
        },
      });
    });

    // Clear user cache
    await redis.del(`user_${userId}`);
  }

  async recordConsent(userId: string, version: string = '1.0'): Promise<void> {
    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        consentGiven: true,
        consentAt: new Date(),
        dataRetentionPolicyVersion: version,
      },
    });

    if (!user) {
      throw ApiError.notFound('User not found');
    }

    await redis.del(`user_${userId}`);
  }

  async getConsentStatus(userId: string): Promise<any> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        consentGiven: true,
        consentAt: true,
        dataRetentionPolicyVersion: true,
      },
    });
    if (!user) {
      throw ApiError.notFound('User not found');
    }
    return user;
  }
}

export default GdprService;
