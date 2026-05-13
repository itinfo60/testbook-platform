import User from '../user/user.model.js';
import jwt from 'jsonwebtoken';
import ApiError from '../../utils/ApiError.js';
import ApiResponse from '../../utils/ApiResponse.js';
import catchAsync from '../../utils/catchAsync.js';
import emailService from '../../utils/email.js';
import redis from '../../config/redis.js';
import config from '../../config/index.js';
import crypto from 'crypto';

const cookieOptions = {
  httpOnly: true,
  secure: config.env === 'production',
  sameSite: config.env === 'production' ? 'strict' : 'lax',
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
};

export const register = catchAsync(async (req, res) => {
  const { name, email, password, role } = req.body;

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw ApiError.conflict('Email is already registered');
  }

  const user = await User.create({ name, email, password, role: role || 'student' });

  // Generate email verification token
  const verifyToken = user.generateEmailVerificationToken();
  await user.save({ validateBeforeSave: false });

  // Send verification email (non-blocking)
  emailService.sendVerificationEmail(user, verifyToken).catch(() => {});

  const accessToken = user.generateAccessToken();
  const refreshToken = user.generateRefreshToken();

  // Save refresh token
  user.refreshTokens.push({
    token: refreshToken,
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    device: req.headers['user-agent'] || 'unknown',
  });
  await user.save({ validateBeforeSave: false });

  res.cookie('refreshToken', refreshToken, cookieOptions);

  ApiResponse.created(res, {
    user: {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatar: user.avatar,
      isEmailVerified: user.isEmailVerified,
    },
    accessToken,
  }, 'Registration successful');
});

export const login = catchAsync(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email, isActive: true }).select('+password');
  if (!user) {
    throw ApiError.unauthorized('Invalid email or password');
  }

  if (user.authProvider !== 'local') {
    throw ApiError.badRequest(`Please login using ${user.authProvider}`);
  }

  const isPasswordValid = await user.comparePassword(password);
  if (!isPasswordValid) {
    throw ApiError.unauthorized('Invalid email or password');
  }

  const accessToken = user.generateAccessToken();
  const refreshToken = user.generateRefreshToken();

  // Clean expired tokens and add new one
  user.refreshTokens = user.refreshTokens.filter((t) => t.expiresAt > new Date());
  user.refreshTokens.push({
    token: refreshToken,
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    device: req.headers['user-agent'] || 'unknown',
  });
  user.lastActiveAt = new Date();
  await user.save({ validateBeforeSave: false });

  const userToCache = user.toObject();
  delete userToCache.password;
  delete userToCache.refreshTokens;

  // Cache user
  await redis.set(`user_${user._id}`, userToCache, 300);

  res.cookie('refreshToken', refreshToken, cookieOptions);

  ApiResponse.ok(res, {
    user: {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatar: user.avatar,
      isEmailVerified: user.isEmailVerified,
    },
    accessToken,
  }, 'Login successful');
});

export const logout = catchAsync(async (req, res) => {
  const refreshToken = req.cookies?.refreshToken;
  const accessToken = req.headers.authorization?.split(' ')[1];

  if (refreshToken) {
    await User.findByIdAndUpdate(req.userId, {
      $pull: { refreshTokens: { token: refreshToken } },
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
  const token = req.cookies?.refreshToken || req.body.refreshToken;

  if (!token) {
    throw ApiError.unauthorized('Refresh token required');
  }

  const user = await User.findOne({
    refreshTokens: { $elemMatch: { token, expiresAt: { $gt: new Date() } } },
  }).select('+refreshTokens');

  if (!user) {
    throw ApiError.unauthorized('Invalid or expired refresh token');
  }

  // Remove old token
  user.refreshTokens = user.refreshTokens.filter((t) => t.token !== token);

  // Generate new tokens
  const newAccessToken = user.generateAccessToken();
  const newRefreshToken = user.generateRefreshToken();

  user.refreshTokens.push({
    token: newRefreshToken,
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    device: req.headers['user-agent'] || 'unknown',
  });

  await user.save({ validateBeforeSave: false });

  res.cookie('refreshToken', newRefreshToken, cookieOptions);

  ApiResponse.ok(res, { accessToken: newAccessToken }, 'Token refreshed');
});

export const forgotPassword = catchAsync(async (req, res) => {
  const { email } = req.body;

  const user = await User.findOne({ email, isActive: true });
  if (!user) {
    // Don't reveal if email exists
    return ApiResponse.ok(res, null, 'If the email exists, a reset link has been sent');
  }

  const resetToken = user.generateResetToken();
  await user.save({ validateBeforeSave: false });

  try {
    await emailService.sendResetPasswordEmail(user, resetToken);
    ApiResponse.ok(res, null, 'Password reset email sent');
  } catch (error) {
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save({ validateBeforeSave: false });
    throw ApiError.internal('Failed to send email. Please try again.');
  }
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
  const user = await User.findById(req.userId)
    .select('-refreshTokens -resetPasswordToken -emailVerificationToken');

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
  const refreshTokenStr = user.generateRefreshToken();

  user.refreshTokens.push({
    token: refreshTokenStr,
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    device: req.headers['user-agent'] || 'unknown',
  });
  await user.save({ validateBeforeSave: false });

  await redis.del(`user_${req.userId}`);

  res.cookie('refreshToken', refreshTokenStr, cookieOptions);

  ApiResponse.ok(res, { accessToken }, 'Password changed successfully');
});
