import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import speakeasy from 'speakeasy';
import QRCode from 'qrcode';
import config from '../../config/index.js';
import redis from '../../config/redis.js';
import { AuthRepository } from './auth.repository.js';
import { RegisterInput, LoginInput, UpdateProfileInput } from './auth.validation.js';
import { IUser, AuthResponseDto } from './auth.dto.js';
import { ApiError } from '../../core/api-error.js';
import { runWithTenant } from '../../core/tenant.context.js';
import { transactionalEmailQueue } from '../../queues/index.js';
import User from '../user/user.model.js';

const LOCKOUT_PREFIX = 'lockout:';
const LOCKOUT_ATTEMPTS = 5;
const LOCKOUT_TTL = 15 * 60; // 15 minutes

const hashToken = (token: string) => crypto.createHash('sha256').update(token).digest('hex');

export class AuthService {
  private readonly authRepository: AuthRepository;

  constructor(authRepository = new AuthRepository()) {
    this.authRepository = authRepository;
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

    // Check if email already registered (needs bypass tenant check to ensure global uniqueness)
    const existingUser = await runWithTenant(null, true, () =>
      this.authRepository.findOne({ email })
    );
    if (existingUser) {
      throw ApiError.conflict('Email is already registered');
    }

    // Create user in the appropriate tenant context
    const user = await runWithTenant(tenantId, tenantId === null, () =>
      this.authRepository.create({
        name,
        email,
        password,
        role: actualRole,
        tenantId: tenantId ? tenantId : undefined,
      })
    );

    // Generate email verification token
    const verifyToken = user.generateEmailVerificationToken();
    await runWithTenant(tenantId, tenantId === null, () =>
      user.save({ validateBeforeSave: false })
    );

    // Queue verification email
    await transactionalEmailQueue.add('send', {
      type: 'verification',
      data: { user, token: verifyToken },
    });

    const accessToken = user.generateAccessToken();
    const rawRefreshToken = user.generateRefreshToken();

    // Store hashed refresh token
    user.refreshTokens.push({
      token: hashToken(rawRefreshToken),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      device: userAgent,
    });
    await runWithTenant(tenantId, tenantId === null, () =>
      user.save({ validateBeforeSave: false })
    );

    return {
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
        tenantId: tenantId,
        avatar: user.avatar,
        mfaEnabled: user.mfaEnabled,
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

    if (user.authProvider !== 'local') {
      throw ApiError.badRequest(`Please login using ${user.authProvider}`);
    }

    // ── Tenant isolation check ────────────────────────────────────────────
    // super_admin has no tenant — always allowed.
    // For all other roles:
    //   a) If a tenantId was resolved from the request (subdomain / header) →
    //      verify it matches the user's own tenantId.
    //   b) If NO tenantId was resolved (plain localhost / direct API) →
    //      allow login using the user's own stored tenantId as the context.
    //      This prevents the bootstrap chicken-and-egg problem.
    if (user.role !== 'super_admin') {
      const userTenantId = user.tenantId ? user.tenantId.toString() : null;

      if (tenantId) {
        // A tenant was detected from the request — enforce it matches the user's tenant
        if (userTenantId && userTenantId !== tenantId) {
          throw ApiError.unauthorized('Invalid email or password');
        }
      } else if (!userTenantId) {
        // User has no tenant AND request has no tenant — this is a platform-level
        // account without a tenant (shouldn't normally exist, but be safe)
        throw ApiError.badRequest(
          'No institute context found. Please access this platform via your institute URL or provide X-Tenant-Id.'
        );
      }
      // else: tenantId is null but user.tenantId is set — self-identifying login ✓
    }

    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      const attempts = (lockoutData?.attempts || 0) + 1;
      await redis.set(lockoutKey, { attempts }, LOCKOUT_TTL);
      throw ApiError.unauthorized('Invalid email or password');
    }

    // Clear lockout on success
    await redis.del(lockoutKey);

    // MFA Enforcement Check
    if (user.mfaEnabled) {
      return { requiresMfa: true, userId: user._id.toString() };
    }

    const accessToken = user.generateAccessToken();
    const rawRefreshToken = user.generateRefreshToken();

    // Rotate refresh tokens
    user.refreshTokens = user.refreshTokens.filter((t) => t.expiresAt > new Date());
    user.refreshTokens.push({
      token: hashToken(rawRefreshToken),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      device: userAgent,
    });
    user.lastActiveAt = new Date();

    await runWithTenant(user.tenantId ? user.tenantId.toString() : null, !user.tenantId, () =>
      user.save({ validateBeforeSave: false })
    );

    // Cache user object in Redis
    const userToCache = user.toObject();
    delete userToCache.password;
    delete userToCache.refreshTokens;
    delete userToCache.mfaSecret;

    await redis.set(`user_${user._id}`, userToCache, 300);

    return {
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
        tenantId: user.tenantId ? user.tenantId.toString() : null,
        avatar: user.avatar,
        mfaEnabled: user.mfaEnabled,
      },
      tokens: {
        accessToken,
        refreshToken: rawRefreshToken,
      },
    };
  }

  async verifyMfaLogin(userId: string, token: string, userAgent: string): Promise<AuthResponseDto> {
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

    const accessToken = user.generateAccessToken();
    const rawRefreshToken = user.generateRefreshToken();

    user.refreshTokens = user.refreshTokens.filter((t) => t.expiresAt > new Date());
    user.refreshTokens.push({
      token: hashToken(rawRefreshToken),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      device: userAgent,
    });
    user.lastActiveAt = new Date();

    await runWithTenant(user.tenantId ? user.tenantId.toString() : null, !user.tenantId, () =>
      user.save({ validateBeforeSave: false })
    );

    return {
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
        tenantId: user.tenantId ? user.tenantId.toString() : null,
        avatar: user.avatar,
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
    const user = await runWithTenant(null, true, () =>
      User.findOne({
        refreshTokens: { $elemMatch: { token: hashedToken } },
      }).select('+refreshTokens')
    );

    if (!user) {
      // Re-use detection: Verify token structure, if valid but token doesn't exist, clear all tokens!
      try {
        const decoded = jwt.verify(rawToken, config.jwt.secret!) as { id: string };
        if (decoded && decoded.id) {
          await runWithTenant(null, true, () =>
            User.findByIdAndUpdate(decoded.id, { $set: { refreshTokens: [] } })
          );
          await redis.del(`user_${decoded.id}`);
        }
      } catch {
        // Suppress decode error
      }
      throw ApiError.unauthorized('Invalid or expired refresh token');
    }

    // Check expiration
    const foundToken = user.refreshTokens.find((t) => t.token === hashedToken);
    if (!foundToken || foundToken.expiresAt < new Date()) {
      user.refreshTokens = user.refreshTokens.filter((t) => t.token !== hashedToken);
      await runWithTenant(user.tenantId ? user.tenantId.toString() : null, !user.tenantId, () =>
        user.save({ validateBeforeSave: false })
      );
      throw ApiError.unauthorized('Invalid or expired refresh token');
    }

    // Rotate: filter out old token
    user.refreshTokens = user.refreshTokens.filter((t) => t.token !== hashedToken);

    // Generate new family member
    const newAccessToken = user.generateAccessToken();
    const newRawRefreshToken = user.generateRefreshToken();

    user.refreshTokens.push({
      token: hashToken(newRawRefreshToken),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      device: userAgent,
    });

    await runWithTenant(user.tenantId ? user.tenantId.toString() : null, !user.tenantId, () =>
      user.save({ validateBeforeSave: false })
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
      await runWithTenant(null, true, () =>
        User.findByIdAndUpdate(userId, {
          $pull: { refreshTokens: { token: hashedRefresh } },
        })
      );
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

    if (user.role !== 'super_admin') {
      if (!tenantId || (user.tenantId && user.tenantId.toString() !== tenantId)) {
        return; // Silent fail
      }
    }

    const resetToken = user.generateResetToken();
    await runWithTenant(null, true, () => user.save({ validateBeforeSave: false }));

    await transactionalEmailQueue.add('send', {
      type: 'reset_password',
      data: { user, token: resetToken },
    });
  }

  async resetPassword(token: string, password: string): Promise<void> {
    const hashedToken = hashToken(token);

    const user = await runWithTenant(null, true, () =>
      this.authRepository.findByResetToken(hashedToken)
    );

    if (!user) {
      throw ApiError.badRequest('Invalid or expired reset token');
    }

    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    user.refreshTokens = []; // Clear all active sessions
    await runWithTenant(user.tenantId ? user.tenantId.toString() : null, !user.tenantId, () =>
      user.save()
    );

    await redis.del(`user_${user._id}`);
  }

  async verifyEmail(token: string): Promise<void> {
    const hashedToken = hashToken(token);

    const user = await runWithTenant(null, true, () =>
      this.authRepository.findByVerificationToken(hashedToken)
    );

    if (!user) {
      throw ApiError.badRequest('Invalid or expired verification token');
    }

    user.isEmailVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpire = undefined;
    await runWithTenant(user.tenantId ? user.tenantId.toString() : null, !user.tenantId, () =>
      user.save({ validateBeforeSave: false })
    );

    await redis.del(`user_${user._id}`);
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

    const userObj = user.toObject();
    delete userObj.password;
    delete userObj.refreshTokens;
    delete userObj.mfaSecret;

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
    const user = await runWithTenant(null, true, () => User.findById(userId).select('+password'));

    if (!user) {
      throw ApiError.notFound('User not found');
    }

    const isMatch = await user.comparePassword(input.currentPassword);
    if (!isMatch) {
      throw ApiError.badRequest('Current password is incorrect');
    }

    user.password = input.newPassword;
    user.refreshTokens = []; // Log out all other devices

    const accessToken = user.generateAccessToken();
    const rawRefreshToken = user.generateRefreshToken();

    user.refreshTokens.push({
      token: hashToken(rawRefreshToken),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      device: userAgent,
    });

    await runWithTenant(user.tenantId ? user.tenantId.toString() : null, !user.tenantId, () =>
      user.save()
    );

    await redis.del(`user_${userId}`);

    return { accessToken, newRefreshToken: rawRefreshToken };
  }

  async setupMfa(userId: string): Promise<{ qrCode: string; secret: string }> {
    const user = await runWithTenant(null, true, () => User.findById(userId));

    if (!user) throw ApiError.notFound('User not found');

    const secret = speakeasy.generateSecret({
      name: `TestBook (${user.email})`,
      length: 20,
    });

    user.mfaSecret = secret.base32;
    await runWithTenant(user.tenantId ? user.tenantId.toString() : null, !user.tenantId, () =>
      user.save({ validateBeforeSave: false })
    );

    const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url || '');

    return { qrCode: qrCodeUrl, secret: secret.base32 };
  }

  async enableMfa(userId: string, token: string): Promise<{ backupCodes: string[] }> {
    const user = await runWithTenant(null, true, () => User.findById(userId).select('+mfaSecret'));

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
    user.mfaEnabled = true;
    user.mfaBackupCodes = backupCodes.map((c) => hashToken(c));

    await runWithTenant(user.tenantId ? user.tenantId.toString() : null, !user.tenantId, () =>
      user.save({ validateBeforeSave: false })
    );

    await redis.del(`user_${userId}`);

    return { backupCodes };
  }

  async disableMfa(userId: string, password: string): Promise<void> {
    const user = await runWithTenant(null, true, () => User.findById(userId).select('+password'));

    if (!user) throw ApiError.notFound('User not found');

    const isValid = await user.comparePassword(password);
    if (!isValid) {
      throw ApiError.unauthorized('Invalid password');
    }

    user.mfaEnabled = false;
    user.mfaSecret = undefined;
    user.mfaBackupCodes = [];

    await runWithTenant(user.tenantId ? user.tenantId.toString() : null, !user.tenantId, () =>
      user.save({ validateBeforeSave: false })
    );

    await redis.del(`user_${userId}`);
  }
}
