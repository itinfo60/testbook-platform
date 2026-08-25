import * as crypto from 'crypto';
import * as jwt from 'jsonwebtoken';
import speakeasy from 'speakeasy';
import QRCode from 'qrcode';
import config from '../../config/index.js';
import redis from '../../config/redis.js';
import { AuthRepository } from './auth.repository.js';
import { RegisterInput, LoginInput, UpdateProfileInput } from './auth.validation.js';
import { AuthResponseDto, IUser } from './auth.dto.js';
import { ApiError } from '../../core/api-error.js';
import { runWithTenant } from '../../core/tenant.context.js';
import { transactionalEmailQueue } from '../../queues/index.js';
import prisma from '../../config/prisma.js';
import { getSupabase } from '../../config/supabase.js';
import logger from '../../utils/logger.js';
import {
  hashPassword,
  generateEmailVerificationToken,
  generateAccessToken,
  generateRefreshToken,
  comparePassword,
  generateResetToken,
  sanitizeUser,
} from '../user/user.utils.js';

const LOCKOUT_PREFIX = 'lockout:';
const LOCKOUT_ATTEMPTS = 5;
const LOCKOUT_TTL = 15 * 60; // 15 minutes

const hashToken = (token: string) => crypto.createHash('sha256').update(token).digest('hex');

export class AuthService {
  private readonly authRepository: AuthRepository;

  constructor(authRepository = new AuthRepository()) {
    this.authRepository = authRepository;
  }

  async checkEmail(email: string, tenantId: string | null): Promise<boolean> {
    const existingUser = await runWithTenant(null, true, () =>
      this.authRepository.findOne({ email })
    );
    return !existingUser;
  }

  async register(
    input: RegisterInput,
    tenantId: string | null,
    tenantLimits: { teacherLimit: number; studentLimit: number } | null,
    userAgent: string
  ): Promise<AuthResponseDto> {
    const { name, email, password, role } = input;
    const actualRole = role || 'student';

    // Enforce multi-tenant subscription limits
    if (tenantId && tenantLimits) {
      if (actualRole === 'teacher') {
        const teacherCount = await runWithTenant(tenantId, false, () =>
          this.authRepository.countDocuments({ role: 'teacher' })
        );
        if (teacherCount >= tenantLimits.teacherLimit) {
          throw ApiError.forbidden(
            'The teacher limit for this institute has been reached. Please contact administration to upgrade.'
          );
        }
      } else if (actualRole === 'student') {
        const studentCount = await runWithTenant(tenantId, false, () =>
          this.authRepository.countDocuments({ role: 'student' })
        );
        if (studentCount >= tenantLimits.studentLimit) {
          throw ApiError.forbidden(
            'The student limit for this institute has been reached. Please contact administration to upgrade.'
          );
        }
      }
    }

    const existingUser = await runWithTenant(null, true, () =>
      this.authRepository.findOne({ email })
    );
    if (existingUser) {
      throw ApiError.conflict('Email is already registered');
    }

    const hashedPassword = await hashPassword(password);
    const {
      token: verifyToken,
      hashedToken: emailVerificationToken,
      expire: emailVerificationExpire,
    } = generateEmailVerificationToken();

    // Create user in the appropriate tenant context
    const user = await runWithTenant(tenantId, tenantId === null, () =>
      this.authRepository.create({
        name,
        email,
        password: hashedPassword,
        role: actualRole,
        tenantId: tenantId ? tenantId : undefined,
        emailVerificationToken,
        emailVerificationExpire,
      })
    );

    // Queue verification email
    await transactionalEmailQueue.add('send', {
      type: 'verification',
      data: { user, token: verifyToken },
    });

    try {
      const supabase = getSupabase();
      const linkRes = await supabase.auth.admin.generateLink({
        type: 'signup',
        email: user.email,
        options: {
          redirectTo: `${config.clientUrl}/login`,
        },
      });
      if (linkRes.data?.properties?.action_link) {
        logger.info(`
══════════════════════════════════════════════════════════════════
✨ [SUPABASE VERIFY LINK] Email: ${user.email}
🔗 ${linkRes.data.properties.action_link}
══════════════════════════════════════════════════════════════════`);
      }
    } catch (e) {
      // ignore
    }

    const accessToken = generateAccessToken(user);
    const rawRefreshToken = generateRefreshToken(user);

    // Store hashed refresh token
    const newRefreshToken = {
      token: hashToken(rawRefreshToken),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      device: userAgent,
    };

    const updatedRefreshTokens = ((user.refreshTokens as any[]) || []).concat(newRefreshToken);

    const updatedUser = await runWithTenant(tenantId, tenantId === null, () =>
      this.authRepository.updateById(user.id, { refreshTokens: updatedRefreshTokens })
    );

    return {
      user: {
        id: updatedUser!.id,
        name: updatedUser!.name,
        email: updatedUser!.email,
        role: updatedUser!.role,
        tenantId: tenantId,
        avatar: updatedUser!.avatar as any,
        mfaEnabled: updatedUser!.mfaEnabled,
      },
      tokens: {
        accessToken,
        refreshToken: rawRefreshToken,
      },
    };
  }

  async login(
    input: LoginInput,
    tenantId: string | null,
    userAgent: string
  ): Promise<{ requiresMfa: boolean; mfaSetup?: boolean; userId?: string } | AuthResponseDto> {
    const { email, password } = input;

    // Check account lockout
    const lockoutKey = `${LOCKOUT_PREFIX}${email}`;
    const lockoutData: any = await redis.get(lockoutKey);
    if (lockoutData && lockoutData.attempts >= LOCKOUT_ATTEMPTS) {
      throw ApiError.tooManyRequests('Account temporarily locked. Try again in 15 minutes.');
    }

    // Retrieve user globally to verify credentials and tenant context
    const user = await runWithTenant(null, true, () =>
      this.authRepository.findByEmailWithMfa(email)
    );

    if (!user || !user.isActive) {
      throw ApiError.unauthorized('Invalid email or password');
    }

    if (user.authProvider !== 'local' && !user.password) {
      throw ApiError.badRequest(`Please login using ${user.authProvider}`);
    }

    if (user.role !== 'super_admin') {
      const userTenantId = user.tenantId ? user.tenantId.toString() : null;

      if (tenantId) {
        if (userTenantId && userTenantId !== tenantId) {
          throw ApiError.unauthorized('Invalid email or password');
        }
      }
    }

    const isPasswordValid = await comparePassword(password, user.password || null);
    if (!isPasswordValid) {
      const attempts = (lockoutData?.attempts || 0) + 1;
      await redis.set(lockoutKey, { attempts }, LOCKOUT_TTL);
      throw ApiError.unauthorized('Invalid email or password');
    }

    // Clear lockout on success
    await redis.del(lockoutKey);

    // Enforce Email Verification for standard user accounts
    if (!user.isEmailVerified && user.role !== 'super_admin' && user.role !== 'admin') {
      throw ApiError.unauthorized(
        'Please verify your email address before logging in. Check your inbox for the verification link.'
      );
    }

    // MFA Enforcement Check
    if (user.mfaEnabled) {
      return { requiresMfa: true, userId: user.id };
    }

    const accessToken = generateAccessToken(user);
    const rawRefreshToken = generateRefreshToken(user);

    // Rotate refresh tokens
    let currentTokens = (user.refreshTokens as any[]) || [];
    currentTokens = currentTokens.filter((t) => new Date(t.expiresAt) > new Date());
    currentTokens.push({
      token: hashToken(rawRefreshToken),
      expiresAt: new Date(Date.now() + (input.rememberMe ? 30 : 1) * 24 * 60 * 60 * 1000),
      device: userAgent,
    });

    await runWithTenant(user.tenantId ? user.tenantId.toString() : null, !user.tenantId, () =>
      this.authRepository.updateById(user.id, {
        refreshTokens: currentTokens,
        lastActiveAt: new Date(),
      })
    );

    // Cache user object in Redis
    const userToCache = sanitizeUser(user);

    await redis.set(`user_${user.id}`, userToCache, 300);

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        tenantId: user.tenantId ? user.tenantId.toString() : null,
        avatar: user.avatar as any,
        mfaEnabled: user.mfaEnabled,
      },
      tokens: {
        accessToken,
        refreshToken: rawRefreshToken,
      },
    };
  }

  async verifyMfaLogin(
    userId: string,
    token: string,
    userAgent: string,
    rememberMe: boolean = false
  ): Promise<AuthResponseDto> {
    const user = await runWithTenant(null, true, () => this.authRepository.findByIdWithMfa(userId));

    if (!user || !user.isActive || !user.mfaEnabled || !user.mfaSecret) {
      throw ApiError.unauthorized('MFA not enabled or user not found');
    }

    const verified = speakeasy.totp.verify({
      secret: user.mfaSecret,
      encoding: 'base32',
      token,
      window: 1,
    });

    if (!verified) {
      throw ApiError.unauthorized('Invalid MFA token');
    }

    const accessToken = generateAccessToken(user);
    const rawRefreshToken = generateRefreshToken(user);

    let currentTokens = (user.refreshTokens as any[]) || [];
    currentTokens = currentTokens.filter((t) => new Date(t.expiresAt) > new Date());
    currentTokens.push({
      token: hashToken(rawRefreshToken),
      expiresAt: new Date(Date.now() + (rememberMe ? 30 : 1) * 24 * 60 * 60 * 1000),
      device: userAgent,
    });

    await runWithTenant(user.tenantId ? user.tenantId.toString() : null, !user.tenantId, () =>
      this.authRepository.updateById(user.id, {
        refreshTokens: currentTokens,
        lastActiveAt: new Date(),
      })
    );

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        tenantId: user.tenantId ? user.tenantId.toString() : null,
        avatar: user.avatar as any,
        mfaEnabled: user.mfaEnabled,
      },
      tokens: {
        accessToken,
        refreshToken: rawRefreshToken,
      },
    };
  }

  async refreshToken(
    rawToken: string,
    userAgent: string
  ): Promise<{ accessToken: string; newRefreshToken: string }> {
    if (!rawToken) {
      throw ApiError.unauthorized('Refresh token required');
    }

    const hashedToken = hashToken(rawToken);

    // Lookup user globally with matching refresh token
    const users = await runWithTenant(
      null,
      true,
      () =>
        prisma.$queryRaw<
          any[]
        >`SELECT * FROM "User" WHERE "refreshTokens"::jsonb @> ${JSON.stringify([{ token: hashedToken }])}::jsonb LIMIT 1`
    );
    const user = users && users.length > 0 ? users[0] : null;

    if (!user) {
      // Re-use detection: Verify token structure, if valid but token doesn't exist, clear all tokens!
      try {
        const decoded = jwt.verify(rawToken, config.jwt.secret!) as { id: string };
        if (decoded && decoded.id) {
          await runWithTenant(null, true, () =>
            this.authRepository.updateById(decoded.id, { refreshTokens: [] })
          );
          await redis.del(`user_${decoded.id}`);
        }
      } catch {
        // Suppress decode error
      }
      throw ApiError.unauthorized('Invalid or expired refresh token');
    }

    // Check expiration
    const refreshTokens = (user.refresh_tokens || []) as any[];
    const foundToken = refreshTokens.find((t) => t.token === hashedToken);

    if (!foundToken || new Date(foundToken.expiresAt) < new Date()) {
      const filtered = refreshTokens.filter((t) => t.token !== hashedToken);
      await runWithTenant(user.tenant_id ? user.tenant_id.toString() : null, !user.tenant_id, () =>
        this.authRepository.updateById(user.id, { refreshTokens: filtered })
      );
      throw ApiError.unauthorized('Invalid or expired refresh token');
    }

    // Rotate: filter out old token
    let currentTokens = refreshTokens.filter((t) => t.token !== hashedToken);

    // Generate new family member
    const newAccessToken = generateAccessToken({ id: user.id, role: user.role, email: user.email });
    const newRawRefreshToken = generateRefreshToken({ id: user.id });

    currentTokens.push({
      token: hashToken(newRawRefreshToken),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      device: userAgent,
    });

    await runWithTenant(user.tenant_id ? user.tenant_id.toString() : null, !user.tenant_id, () =>
      this.authRepository.updateById(user.id, { refreshTokens: currentTokens })
    );

    return { accessToken: newAccessToken, newRefreshToken: newRawRefreshToken };
  }

  async logout(
    userId: string,
    rawRefreshToken: string | undefined,
    accessToken: string | undefined
  ): Promise<void> {
    if (rawRefreshToken) {
      const hashedRefresh = hashToken(rawRefreshToken);
      await runWithTenant(null, true, async () => {
        const user = await this.authRepository.findById(userId);
        if (user) {
          const currentTokens = (user.refreshTokens as any[]) || [];
          const filtered = currentTokens.filter((t) => t.token !== hashedRefresh);
          await this.authRepository.updateById(userId, { refreshTokens: filtered });
        }
      });
    }

    if (accessToken) {
      try {
        jwt.verify(accessToken, config.jwt.secret!);
        await redis.set(`bl_${accessToken}`, true, 900); // blacklist for 15m
      } catch {
        // Token was invalid, skip blacklist
      }
    }

    await redis.del(`user_${userId}`);
  }

  async forgotPassword(email: string, tenantId: string | null): Promise<void> {
    const user = await runWithTenant(null, true, () =>
      this.authRepository.findOne({ email, isActive: true })
    );

    if (!user) return; // Silent error to prevent email harvesting

    // Only block if the user belongs to a different tenant
    if (user.role !== 'super_admin' && user.tenantId && tenantId) {
      if (user.tenantId.toString() !== tenantId) {
        return; // Different tenant — silent fail
      }
    }

    const { token: resetToken, hashedToken, expire } = generateResetToken();

    await runWithTenant(null, true, () =>
      this.authRepository.updateById(user.id, {
        resetPasswordToken: hashedToken,
        resetPasswordExpire: expire,
      })
    );

    // Send reset password email via backend SMTP (Gmail)
    await transactionalEmailQueue.add('send', {
      type: 'reset_password',
      data: { user, token: resetToken },
    });

    // Also generate a Supabase recovery link and log it (dev fallback)
    try {
      const supabase = getSupabase();
      const linkRes = await supabase.auth.admin.generateLink({
        type: 'recovery',
        email: user.email,
        options: { redirectTo: `${config.clientUrl}/reset-password` },
      });
      if (linkRes.data?.properties?.action_link) {
        logger.info(`
══════════════════════════════════════════════════════════════════
🔑 [SUPABASE RECOVERY LINK] Email: ${user.email}
🔗 ${linkRes.data.properties.action_link}
══════════════════════════════════════════════════════════════════`);
      }
    } catch (e) {
      // ignore
    }
  }

  async resetPassword(token: string, password: string): Promise<void> {
    const hashedToken = hashToken(token);

    const user = await runWithTenant(null, true, () =>
      this.authRepository.findByResetToken(hashedToken)
    );

    if (!user) {
      throw ApiError.badRequest('Invalid or expired reset token');
    }

    const hashedPassword = await hashPassword(password);

    await runWithTenant(user.tenantId ? user.tenantId.toString() : null, !user.tenantId, () =>
      this.authRepository.updateById(user.id, {
        password: hashedPassword,
        resetPasswordToken: null,
        resetPasswordExpire: null,
        refreshTokens: [],
      })
    );

    await redis.del(`user_${user.id}`);
  }

  async verifyEmail(token: string): Promise<void> {
    const hashedToken = hashToken(token);

    const user = await runWithTenant(null, true, () =>
      this.authRepository.findByVerificationToken(hashedToken)
    );

    if (!user) {
      throw ApiError.badRequest('Invalid or expired verification token');
    }

    await runWithTenant(user.tenantId ? user.tenantId.toString() : null, !user.tenantId, () =>
      this.authRepository.updateById(user.id, {
        isEmailVerified: true,
        emailVerificationToken: null,
        emailVerificationExpire: null,
      })
    );

    await redis.del(`user_${user.id}`);
  }

  async resendVerificationEmail(email: string): Promise<void> {
    const user = await runWithTenant(null, true, () =>
      this.authRepository.findOne({ email: email.trim().toLowerCase(), isActive: true })
    );

    if (!user || user.isEmailVerified) {
      return; // Return silently for security & idempotency
    }

    const {
      token: verifyToken,
      hashedToken: emailVerificationToken,
      expire: emailVerificationExpire,
    } = generateEmailVerificationToken();

    await runWithTenant(user.tenantId ? user.tenantId.toString() : null, !user.tenantId, () =>
      this.authRepository.updateById(user.id, {
        emailVerificationToken,
        emailVerificationExpire,
      })
    );

    await transactionalEmailQueue.add('send', {
      type: 'verification',
      data: { user, token: verifyToken },
    });

    // Also generate a Supabase verification link and log it (dev fallback)
    try {
      const supabase = getSupabase();
      const linkRes = await supabase.auth.admin.generateLink({
        type: 'signup',
        email: user.email,
        options: { redirectTo: `${config.clientUrl}/login` },
      });
      if (linkRes.data?.properties?.action_link) {
        logger.info(`
══════════════════════════════════════════════════════════════════
📧 [SUPABASE RESEND VERIFY LINK] Email: ${user.email}
🔗 ${linkRes.data.properties.action_link}
══════════════════════════════════════════════════════════════════`);
      }
    } catch (e) {
      // ignore
    }
  }

  async getMe(userId: string): Promise<IUser> {
    const cachedUser = await redis.get(`user_${userId}`);
    if (cachedUser) {
      return cachedUser as IUser;
    }

    const user = await runWithTenant(null, true, () => this.authRepository.findById(userId));

    if (!user) {
      throw ApiError.notFound('User not found');
    }

    const userObj = sanitizeUser(user);

    await redis.set(`user_${userId}`, userObj, 300);
    return user as IUser;
  }

  async updateProfile(userId: string, input: UpdateProfileInput): Promise<IUser> {
    const user = await runWithTenant(null, true, () =>
      this.authRepository.updateById(userId, input)
    );

    if (!user) {
      throw ApiError.notFound('User not found');
    }

    await redis.del(`user_${userId}`);
    return user;
  }

  async changePassword(
    userId: string,
    input: { currentPassword: string; newPassword: string },
    userAgent: string
  ): Promise<{ accessToken: string; newRefreshToken: string }> {
    const user = await runWithTenant(null, true, () => this.authRepository.findById(userId));

    if (!user) {
      throw ApiError.notFound('User not found');
    }

    if (user.password) {
      const isMatch = await comparePassword(input.currentPassword, user.password);
      if (!isMatch) {
        throw ApiError.badRequest('Current password is incorrect');
      }
    }

    const hashedPassword = await hashPassword(input.newPassword);

    const accessToken = generateAccessToken(user);
    const rawRefreshToken = generateRefreshToken(user);

    const currentTokens = [
      {
        token: hashToken(rawRefreshToken),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        device: userAgent,
      },
    ];

    await runWithTenant(user.tenantId ? user.tenantId.toString() : null, !user.tenantId, () =>
      this.authRepository.updateById(user.id, {
        password: hashedPassword,
        refreshTokens: currentTokens,
      })
    );

    await redis.del(`user_${userId}`);

    return { accessToken, newRefreshToken: rawRefreshToken };
  }

  async setupMfa(userId: string): Promise<{ qrCode: string; secret: string }> {
    const user = await runWithTenant(null, true, () => this.authRepository.findById(userId));

    if (!user) throw ApiError.notFound('User not found');

    const secret = speakeasy.generateSecret({
      name: `CivicsEdu (${user.email})`,
      length: 20,
    });

    await runWithTenant(user.tenantId ? user.tenantId.toString() : null, !user.tenantId, () =>
      this.authRepository.updateById(user.id, { mfaSecret: secret.base32 })
    );

    const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url || '');

    return { qrCode: qrCodeUrl, secret: secret.base32 };
  }

  async enableMfa(userId: string, token: string): Promise<{ backupCodes: string[] }> {
    const user = await runWithTenant(null, true, () => this.authRepository.findByIdWithMfa(userId));

    if (!user || !user.mfaSecret) {
      throw ApiError.badRequest('MFA setup required first');
    }

    const verified = speakeasy.totp.verify({
      secret: user.mfaSecret,
      encoding: 'base32',
      token,
      window: 1,
    });

    if (!verified) {
      throw ApiError.unauthorized('Invalid MFA token');
    }

    const backupCodes = Array.from({ length: 8 }, () => crypto.randomBytes(4).toString('hex'));

    await runWithTenant(user.tenantId ? user.tenantId.toString() : null, !user.tenantId, () =>
      this.authRepository.updateById(user.id, {
        mfaEnabled: true,
        mfaBackupCodes: backupCodes.map((c) => hashToken(c)),
      })
    );

    await redis.del(`user_${userId}`);

    return { backupCodes };
  }

  async disableMfa(userId: string, token: string): Promise<void> {
    const user = await runWithTenant(null, true, () => this.authRepository.findByIdWithMfa(userId));

    if (!user) throw ApiError.notFound('User not found');
    if (!user.mfaEnabled || !user.mfaSecret) throw ApiError.badRequest('MFA is not enabled');

    const verified = speakeasy.totp.verify({
      secret: user.mfaSecret,
      encoding: 'base32',
      token,
      window: 1,
    });

    if (!verified) throw ApiError.unauthorized('Invalid authenticator code');

    await runWithTenant(user.tenantId ? user.tenantId.toString() : null, !user.tenantId, () =>
      this.authRepository.updateById(user.id, {
        mfaEnabled: false,
        mfaSecret: null,
        mfaBackupCodes: [],
      })
    );

    await redis.del(`user_${userId}`);
  }
}
