import User from '../user/user.model.js';
import jwt from 'jsonwebtoken';
import ApiError from '../../utils/ApiError.js';
import ApiResponse from '../../utils/ApiResponse.js';
import catchAsync from '../../utils/catchAsync.js';
import { emailQueue } from '../../queues/index.js';
import redis from '../../config/redis.js';
import config from '../../config/index.js';
import crypto from 'crypto';
import { runWithTenant } from '../../utils/TenantContext.js';
import speakeasy from 'speakeasy';
import QRCode from 'qrcode';

const LOCKOUT_PREFIX = 'lockout:';
const LOCKOUT_ATTEMPTS = 5;
const LOCKOUT_TTL = 15 * 60; // 15 minutes in seconds

const hashToken = (token) => crypto.createHash('sha256').update(token).digest('hex');

const cookieOptions = {
  httpOnly: true,
  secure: config.env === 'production',
  sameSite: config.env === 'production' ? 'strict' : 'lax',
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
};

export const register = catchAsync(async (req, res) => {
  const { name, email, password, role } = req.body;

  // Enforce usage limits per subscription plan
  if (req.tenantId) {
    const actualRole = role || 'student';
    if (actualRole === 'teacher') {
      const teacherCount = await User.countDocuments({ role: 'teacher', tenantId: req.tenantId });
      if (teacherCount >= req.tenant.limits.teacherLimit) {
        throw ApiError.forbidden(
          'The teacher limit for this institute has been reached. Please contact administration to upgrade.'
        );
      }
    } else if (actualRole === 'student') {
      const studentCount = await User.countDocuments({ role: 'student', tenantId: req.tenantId });
      if (studentCount >= req.tenant.limits.studentLimit) {
        throw ApiError.forbidden(
          'The student limit for this institute has been reached. Please contact administration to upgrade.'
        );
      }
    }
  }

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw ApiError.conflict('Email is already registered');
  }

  const user = await User.create({
    name,
    email,
    password,
    role: role || 'student',
    tenantId: req.tenantId,
  });

  // Generate email verification token
  const verifyToken = user.generateEmailVerificationToken();
  await user.save({ validateBeforeSave: false });

  // Queue verification email
  await emailQueue.add('send', { type: 'verification', data: { user, token: verifyToken } });

  const accessToken = user.generateAccessToken();
  const rawRefreshToken = user.generateRefreshToken();

  // Store hashed refresh token
  user.refreshTokens.push({
    token: hashToken(rawRefreshToken),
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    device: req.headers['user-agent'] || 'unknown',
  });
  await user.save({ validateBeforeSave: false });

  res.cookie('refreshToken', rawRefreshToken, cookieOptions);

  ApiResponse.created(
    res,
    {
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        isEmailVerified: user.isEmailVerified,
        tenantId: user.tenantId,
      },
      accessToken,
    },
    'Registration successful'
  );
});

export const login = catchAsync(async (req, res) => {
  const { email, password, mfaToken } = req.body;

  // Check account lockout
  const lockoutKey = `${LOCKOUT_PREFIX}${email}`;
  const lockoutData = await redis.get(lockoutKey);
  if (lockoutData && lockoutData.attempts >= LOCKOUT_ATTEMPTS) {
    throw ApiError.tooManyRequests('Account temporarily locked. Try again in 15 minutes.');
  }

  // Retrieve user globally to determine tenant eligibility
  const user = await runWithTenant(null, true, () =>
    User.findOne({ email, isActive: true }).select('+password +mfaSecret +mfaEnabled')
  );

  if (!user) {
    throw ApiError.unauthorized('Invalid email or password');
  }

  if (user.authProvider !== 'local') {
    throw ApiError.badRequest(`Please login using ${user.authProvider}`);
  }

  // Multi-tenant check: Non-super_admins must match the active subdomain/tenant context
  if (user.role !== 'super_admin') {
    if (!req.tenantId) {
      throw ApiError.badRequest('Tenant context required to login to this account.');
    }
    if (user.tenantId && user.tenantId.toString() !== req.tenantId) {
      throw ApiError.unauthorized('Invalid email or password');
    }
  }

  const isPasswordValid = await user.comparePassword(password);
  if (!isPasswordValid) {
    // Increment lockout counter
    const attempts = (lockoutData?.attempts || 0) + 1;
    await redis.set(lockoutKey, { attempts }, LOCKOUT_TTL);
    throw ApiError.unauthorized('Invalid email or password');
  }

  // Clear lockout on success
  await redis.del(lockoutKey);

  // MFA check
  if (user.mfaEnabled) {
    if (!mfaToken) {
      return ApiResponse.ok(res, { requiresMfa: true }, 'MFA token required');
    }
    const verified = speakeasy.totp.verify({
      secret: user.mfaSecret,
      encoding: 'base32',
      token: mfaToken,
      window: 1,
    });
    if (!verified) {
      throw ApiError.unauthorized('Invalid MFA token');
    }
  }

  const accessToken = user.generateAccessToken();
  const rawRefreshToken = user.generateRefreshToken();
  const hashedRefresh = hashToken(rawRefreshToken);

  // Clean expired tokens and add new one (stored as hash)
  user.refreshTokens = user.refreshTokens.filter((t) => t.expiresAt > new Date());
  user.refreshTokens.push({
    token: hashedRefresh,
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    device: req.headers['user-agent'] || 'unknown',
  });
  user.lastActiveAt = new Date();

  // Save user globally
  await runWithTenant(null, true, () => user.save({ validateBeforeSave: false }));

  const userToCache = user.toObject();
  delete userToCache.password;
  delete userToCache.refreshTokens;
  delete userToCache.mfaSecret;

  // Cache user
  await redis.set(`user_${user._id}`, userToCache, 300);

  res.cookie('refreshToken', rawRefreshToken, cookieOptions);

  ApiResponse.ok(
    res,
    {
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        isEmailVerified: user.isEmailVerified,
        tenantId: user.tenantId,
      },
      accessToken,
    },
    'Login successful'
  );
});

export const logout = catchAsync(async (req, res) => {
  const rawRefreshToken = req.cookies?.refreshToken;
  const accessToken = req.headers.authorization?.split(' ')[1];

  if (rawRefreshToken) {
    const hashedRefresh = hashToken(rawRefreshToken);
    await User.findByIdAndUpdate(req.userId, {
      $pull: { refreshTokens: { token: hashedRefresh } },
    });
  }

  // Blacklist access token
  if (accessToken) {
    try {
      jwt.verify(accessToken, config.jwt.secret);
      await redis.set(`bl_${accessToken}`, true, 900); // 15 min
    } catch {
      // Ignored: invalid token
    }
  }

  // Clear user cache
  await redis.del(`user_${req.userId}`);

  res.clearCookie('refreshToken', cookieOptions);

  ApiResponse.ok(res, null, 'Logged out successfully');
});

export const refreshToken = catchAsync(async (req, res) => {
  const rawToken = req.cookies?.refreshToken || req.body.refreshToken;

  if (!rawToken) {
    throw ApiError.unauthorized('Refresh token required');
  }

  const hashedToken = hashToken(rawToken);

  const user = await User.findOne({
    refreshTokens: { $elemMatch: { token: hashedToken, expiresAt: { $gt: new Date() } } },
  }).select('+refreshTokens');

  if (!user) {
    throw ApiError.unauthorized('Invalid or expired refresh token');
  }

  // Remove old hashed token
  user.refreshTokens = user.refreshTokens.filter((t) => t.token !== hashedToken);

  // Generate new tokens
  const newAccessToken = user.generateAccessToken();
  const newRawRefreshToken = user.generateRefreshToken();
  const newHashedRefresh = hashToken(newRawRefreshToken);

  user.refreshTokens.push({
    token: newHashedRefresh,
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    device: req.headers['user-agent'] || 'unknown',
  });

  await user.save({ validateBeforeSave: false });

  res.cookie('refreshToken', newRawRefreshToken, cookieOptions);

  ApiResponse.ok(res, { accessToken: newAccessToken }, 'Token refreshed');
});

export const forgotPassword = catchAsync(async (req, res) => {
  const { email } = req.body;

  // Retrieve user globally to check tenant assignment
  const user = await runWithTenant(null, true, () => User.findOne({ email, isActive: true }));

  if (!user) {
    // Don't reveal if email exists
    return ApiResponse.ok(res, null, 'If the email exists, a reset link has been sent');
  }

  if (user.role !== 'super_admin') {
    if (!req.tenantId || (user.tenantId && user.tenantId.toString() !== req.tenantId)) {
      return ApiResponse.ok(res, null, 'If the email exists, a reset link has been sent');
    }
  }

  const resetToken = user.generateResetToken();
  await runWithTenant(null, true, () => user.save({ validateBeforeSave: false }));

  await emailQueue.add('send', { type: 'reset_password', data: { user, token: resetToken } });
  ApiResponse.ok(res, null, 'Password reset email sent');
});

export const resetPassword = catchAsync(async (req, res) => {
  const { token, password } = req.body;

  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

  const user = await User.findOne({
    resetPasswordToken: hashedToken,
    resetPasswordExpire: { $gt: Date.now() },
  });

  if (!user) {
    throw ApiError.badRequest('Invalid or expired reset token');
  }

  user.password = password;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpire = undefined;
  user.refreshTokens = []; // Invalidate all sessions
  await user.save();

  // Clear cache
  await redis.del(`user_${user._id}`);

  ApiResponse.ok(res, null, 'Password reset successful. Please login.');
});

export const verifyEmail = catchAsync(async (req, res) => {
  const { token } = req.params;

  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

  const user = await User.findOne({
    emailVerificationToken: hashedToken,
    emailVerificationExpire: { $gt: Date.now() },
  });

  if (!user) {
    throw ApiError.badRequest('Invalid or expired verification token');
  }

  user.isEmailVerified = true;
  user.emailVerificationToken = undefined;
  user.emailVerificationExpire = undefined;
  await user.save({ validateBeforeSave: false });

  await redis.del(`user_${user._id}`);

  ApiResponse.ok(res, null, 'Email verified successfully');
});

export const getMe = catchAsync(async (req, res) => {
  const user = await User.findById(req.userId).select(
    '-refreshTokens -resetPasswordToken -emailVerificationToken'
  );

  if (!user) {
    throw ApiError.notFound('User not found');
  }

  ApiResponse.ok(res, { user });
});

export const updateProfile = catchAsync(async (req, res) => {
  const allowedFields = ['name', 'bio', 'phone', 'avatar'];
  const updates = {};

  allowedFields.forEach((field) => {
    if (req.body[field] !== undefined) updates[field] = req.body[field];
  });

  const user = await User.findByIdAndUpdate(req.userId, updates, {
    new: true,
    runValidators: true,
  }).select('-refreshTokens');

  if (!user) {
    throw ApiError.notFound('User not found');
  }

  await redis.del(`user_${req.userId}`);

  ApiResponse.ok(res, { user }, 'Profile updated');
});

export const changePassword = catchAsync(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  const user = await User.findById(req.userId).select('+password');
  if (!user) {
    throw ApiError.notFound('User not found');
  }

  const isMatch = await user.comparePassword(currentPassword);
  if (!isMatch) {
    throw ApiError.badRequest('Current password is incorrect');
  }

  user.password = newPassword;
  user.refreshTokens = []; // Invalidate all sessions
  await user.save();

  const accessToken = user.generateAccessToken();
  const rawRefreshTokenStr = user.generateRefreshToken();

  user.refreshTokens.push({
    token: hashToken(rawRefreshTokenStr),
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    device: req.headers['user-agent'] || 'unknown',
  });
  await user.save({ validateBeforeSave: false });

  await redis.del(`user_${req.userId}`);

  res.cookie('refreshToken', rawRefreshTokenStr, cookieOptions);

  ApiResponse.ok(res, { accessToken }, 'Password changed successfully');
});

// ===== MFA =====
export const setupMfa = catchAsync(async (req, res) => {
  const user = await User.findById(req.userId);
  if (!user) throw ApiError.notFound('User not found');

  const secret = speakeasy.generateSecret({
    name: `TestBook (${user.email})`,
    length: 20,
  });

  // Store secret temporarily (not enabled yet until verified)
  user.mfaSecret = secret.base32;
  await user.save({ validateBeforeSave: false });

  const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url);

  ApiResponse.ok(
    res,
    { qrCode: qrCodeUrl, secret: secret.base32 },
    'Scan QR code with your authenticator app'
  );
});

export const verifyMfa = catchAsync(async (req, res) => {
  const { token } = req.body;
  const user = await User.findById(req.userId).select('+mfaSecret');
  if (!user || !user.mfaSecret) throw ApiError.badRequest('MFA setup required first');

  const verified = speakeasy.totp.verify({
    secret: user.mfaSecret,
    encoding: 'base32',
    token,
    window: 1,
  });

  if (!verified) throw ApiError.unauthorized('Invalid MFA token');

  // Generate backup codes
  const backupCodes = Array.from({ length: 8 }, () => crypto.randomBytes(4).toString('hex'));
  user.mfaEnabled = true;
  user.mfaBackupCodes = backupCodes.map((c) => hashToken(c));
  await user.save({ validateBeforeSave: false });
  await redis.del(`user_${req.userId}`);

  ApiResponse.ok(res, { backupCodes }, 'MFA enabled successfully. Save these backup codes.');
});

export const disableMfa = catchAsync(async (req, res) => {
  const { password } = req.body;
  const user = await User.findById(req.userId).select('+password');
  if (!user) throw ApiError.notFound('User not found');

  const isValid = await user.comparePassword(password);
  if (!isValid) throw ApiError.unauthorized('Invalid password');

  user.mfaEnabled = false;
  user.mfaSecret = undefined;
  user.mfaBackupCodes = [];
  await user.save({ validateBeforeSave: false });
  await redis.del(`user_${req.userId}`);

  ApiResponse.ok(res, null, 'MFA disabled');
});

export const registerFcmToken = catchAsync(async (req, res) => {
  const { token } = req.body;
  if (!token) throw ApiError.badRequest('FCM token required');

  await User.findByIdAndUpdate(req.userId, {
    $addToSet: { fcmTokens: token },
  });

  ApiResponse.ok(res, null, 'FCM token registered');
});

export const removeFcmToken = catchAsync(async (req, res) => {
  const { token } = req.body;
  if (!token) throw ApiError.badRequest('FCM token required');

  await User.findByIdAndUpdate(req.userId, {
    $pull: { fcmTokens: token },
  });

  ApiResponse.ok(res, null, 'FCM token removed');
});

// ===== GOOGLE OAUTH CALLBACK =====
export const googleCallback = catchAsync(async (req, res) => {
  const user = req.user;
  if (!user) throw ApiError.unauthorized('Google authentication failed');

  const accessToken = user.generateAccessToken();
  const rawRefreshTokenStr = user.generateRefreshToken();

  user.refreshTokens.push({
    token: hashToken(rawRefreshTokenStr),
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    device: req.headers['user-agent'] || 'unknown',
  });
  await user.save({ validateBeforeSave: false });

  res.cookie('refreshToken', rawRefreshTokenStr, cookieOptions);

  // Redirect to client with token in query param (client stores it, then removes from URL)
  const redirectUrl = `${config.clientUrl}/auth/callback?token=${accessToken}`;
  res.redirect(redirectUrl);
});
