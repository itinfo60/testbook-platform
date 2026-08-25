import { Request, Response } from 'express';
import crypto from 'crypto';
import { BaseController } from '../../core/base.controller.js';
import { AuthService } from './auth.service.js';
import { ApiError } from '../../core/api-error.js';
import config from '../../config/index.js';
import { IUser } from './auth.dto.js';
import { runWithTenant } from '../../core/tenant.context.js';
import prisma from '../../config/prisma.js';
import { generateAccessToken, generateRefreshToken } from '../user/user.utils.js';
import { getSupabase } from '../../config/supabase.js';

export interface CustomRequest extends Request {
  tenantId?: string | null;
  tenant?: any;
  userId?: string;
  user?: any;
}

const getCookieOptions = (rememberMe: boolean = false) => ({
  httpOnly: true,
  secure: config.env === 'production',
  sameSite: (config.env === 'production' ? 'strict' : 'lax') as 'strict' | 'lax',
  maxAge: (rememberMe ? 30 : 1) * 24 * 60 * 60 * 1000,
});

export class AuthController extends BaseController {
  private readonly authService: AuthService;

  constructor(authService = new AuthService()) {
    super();
    this.authService = authService;
  }

  register = this.catchAsync(async (req: CustomRequest, res: Response) => {
    const limits = req.tenant ? req.tenant.limits : null;
    const userAgent = req.headers['user-agent'] || 'unknown';

    const result = await this.authService.register(
      req.body,
      req.tenantId || null,
      limits,
      userAgent
    );

    res.cookie('refreshToken', result.tokens.refreshToken, getCookieOptions());

    return this.created(
      res,
      {
        user: result.user,
        accessToken: result.tokens.accessToken,
      },
      'Registration successful'
    );
  });

  login = this.catchAsync(async (req: CustomRequest, res: Response) => {
    const userAgent = req.headers['user-agent'] || 'unknown';
    const result = await this.authService.login(req.body, req.tenantId || null, userAgent);

    if ('requiresMfa' in result && result.requiresMfa) {
      return this.ok(
        res,
        { requiresMfa: true, userId: result.userId },
        'MFA verification required'
      );
    }

    const mfaResult = result as any;
    res.cookie(
      'refreshToken',
      mfaResult.tokens.refreshToken,
      getCookieOptions(req.body.rememberMe)
    );

    return this.ok(
      res,
      {
        user: mfaResult.user,
        accessToken: mfaResult.tokens.accessToken,
        refreshToken: mfaResult.tokens.refreshToken,
        tokens: {
          accessToken: mfaResult.tokens.accessToken,
          refreshToken: mfaResult.tokens.refreshToken,
        },
      },
      'Login successful'
    );
  });

  verifyMfaLogin = this.catchAsync(async (req: CustomRequest, res: Response) => {
    const { userId, token } = req.body;
    if (!userId || !token) {
      throw ApiError.badRequest('User ID and MFA token are required');
    }
    const userAgent = req.headers['user-agent'] || 'unknown';
    const result = await this.authService.verifyMfaLogin(
      userId,
      token,
      userAgent,
      req.body.rememberMe
    );

    res.cookie('refreshToken', result.tokens.refreshToken, getCookieOptions(req.body.rememberMe));

    return this.ok(
      res,
      {
        user: result.user,
        accessToken: result.tokens.accessToken,
      },
      'MFA login successful'
    );
  });

  refreshToken = this.catchAsync(async (req: CustomRequest, res: Response) => {
    const rawToken = req.cookies?.refreshToken || req.body.refreshToken;
    const userAgent = req.headers['user-agent'] || 'unknown';

    const result = await this.authService.refreshToken(rawToken, userAgent);

    res.cookie('refreshToken', result.newRefreshToken, getCookieOptions(req.body.rememberMe));

    return this.ok(res, { accessToken: result.accessToken }, 'Token refreshed');
  });

  logout = this.catchAsync(async (req: CustomRequest, res: Response) => {
    const rawRefreshToken = req.cookies?.refreshToken;
    const accessToken = req.headers.authorization?.split(' ')[1];

    if (req.userId) {
      await this.authService.logout(req.userId, rawRefreshToken, accessToken);
    }

    res.clearCookie('refreshToken', getCookieOptions());

    return this.ok(res, null, 'Logged out successfully');
  });

  forgotPassword = this.catchAsync(async (req: CustomRequest, res: Response) => {
    await this.authService.forgotPassword(req.body.email, req.tenantId || null);
    return this.ok(res, null, 'If the email exists, a reset link has been sent');
  });

  resetPassword = this.catchAsync(async (req: CustomRequest, res: Response) => {
    await this.authService.resetPassword(req.body.token, req.body.password);
    return this.ok(res, null, 'Password reset successful. Please login.');
  });

  verifyEmail = this.catchAsync(async (req: CustomRequest, res: Response) => {
    await this.authService.verifyEmail(req.params.token);
    return this.ok(res, null, 'Email verified successfully');
  });

  resendVerification = this.catchAsync(async (req: CustomRequest, res: Response) => {
    const { email } = req.body;
    if (!email || !email.trim()) {
      throw ApiError.badRequest('Email is required');
    }
    await this.authService.resendVerificationEmail(email.trim());
    return this.ok(
      res,
      null,
      'If an unverified account exists with this email, a new verification link has been sent.'
    );
  });

  getMe = this.catchAsync(async (req: CustomRequest, res: Response) => {
    if (!req.userId) {
      throw ApiError.unauthorized();
    }
    const user = await this.authService.getMe(req.userId);
    return this.ok(res, { user });
  });

  checkEmail = this.catchAsync(async (req: CustomRequest, res: Response) => {
    const email = req.query.email as string;
    if (!email) throw ApiError.badRequest('Email is required');
    const isAvailable = await this.authService.checkEmail(email, req.tenantId || null);
    return this.ok(res, { available: isAvailable });
  });

  updateProfile = this.catchAsync(async (req: CustomRequest, res: Response) => {
    if (!req.userId) {
      throw ApiError.unauthorized();
    }
    const user = await this.authService.updateProfile(req.userId, req.body);
    return this.ok(res, { user }, 'Profile updated');
  });

  changePassword = this.catchAsync(async (req: CustomRequest, res: Response) => {
    if (!req.userId) {
      throw ApiError.unauthorized();
    }
    const userAgent = req.headers['user-agent'] || 'unknown';
    const result = await this.authService.changePassword(req.userId, req.body, userAgent);

    res.cookie('refreshToken', result.newRefreshToken, getCookieOptions());

    return this.ok(res, { accessToken: result.accessToken }, 'Password changed successfully');
  });

  setupMfa = this.catchAsync(async (req: CustomRequest, res: Response) => {
    if (!req.userId) {
      throw ApiError.unauthorized();
    }
    const result = await this.authService.setupMfa(req.userId);
    return this.ok(res, result, 'Scan QR code with your authenticator app');
  });

  verifyMfa = this.catchAsync(async (req: CustomRequest, res: Response) => {
    if (!req.userId) {
      throw ApiError.unauthorized();
    }
    const result = await this.authService.enableMfa(req.userId, req.body.token);
    return this.ok(res, result, 'MFA enabled successfully. Save these backup codes.');
  });

  disableMfa = this.catchAsync(async (req: CustomRequest, res: Response) => {
    if (!req.userId) {
      throw ApiError.unauthorized();
    }
    await this.authService.disableMfa(req.userId, req.body.token);
    return this.ok(res, null, 'MFA disabled');
  });

  registerFcmToken = this.catchAsync(async (req: CustomRequest, res: Response) => {
    if (!req.userId) {
      throw ApiError.unauthorized();
    }
    const { token } = req.body;
    if (!token) throw ApiError.badRequest('FCM token required');

    const u = await runWithTenant(null, true, () =>
      prisma.user.findUnique({ where: { id: req.userId } })
    );
    if (u) {
      const tokens = (u.fcmTokens || []) as string[];
      if (!tokens.includes(token)) {
        await runWithTenant(null, true, () =>
          prisma.user.update({
            where: { id: req.userId },
            data: { fcmTokens: [...tokens, token] },
          })
        );
      }
    }

    return this.ok(res, null, 'FCM token registered');
  });

  removeFcmToken = this.catchAsync(async (req: CustomRequest, res: Response) => {
    if (!req.userId) {
      throw ApiError.unauthorized();
    }
    const { token } = req.body;
    if (!token) throw ApiError.badRequest('FCM token required');

    const u = await runWithTenant(null, true, () =>
      prisma.user.findUnique({ where: { id: req.userId } })
    );
    if (u) {
      const tokens = (u.fcmTokens || []) as string[];
      await runWithTenant(null, true, () =>
        prisma.user.update({
          where: { id: req.userId },
          data: { fcmTokens: tokens.filter((t) => t !== token) },
        })
      );
    }

    return this.ok(res, null, 'FCM token removed');
  });

  googleCallback = this.catchAsync(async (req: CustomRequest, res: Response) => {
    const user = req.user as any;
    if (!user) throw ApiError.unauthorized('Google authentication failed');

    const accessToken = generateAccessToken(user);
    const rawRefreshTokenStr = generateRefreshToken(user);

    const hashedToken = crypto.createHash('sha256').update(rawRefreshTokenStr).digest('hex');
    const newTokens = (user.refreshTokens || []).concat({
      token: hashedToken,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      device: req.headers['user-agent'] || 'unknown',
    });

    await runWithTenant(user.tenantId ? user.tenantId.toString() : null, !user.tenantId, () =>
      prisma.user.update({
        where: { id: user.id },
        data: { refreshTokens: newTokens },
      })
    );

    res.cookie('refreshToken', rawRefreshTokenStr, getCookieOptions(true));

    const redirectUrl = `${config.clientUrl}/auth/callback?token=${accessToken}`;
    return res.redirect(redirectUrl);
  });

  handleSupabaseAuth = this.catchAsync(async (req: CustomRequest, res: Response) => {
    const authHeader = req.headers.authorization;
    const token =
      req.body.accessToken ||
      req.body.token ||
      (authHeader?.startsWith('Bearer ') ? authHeader.split(' ')[1] : null);

    if (!token) {
      throw ApiError.badRequest('Supabase authentication token is required');
    }

    const supabase = getSupabase();
    const { data, error } = await supabase.auth.getUser(token);

    if (error || !data?.user) {
      throw ApiError.unauthorized(error?.message || 'Invalid or expired Supabase token');
    }

    const sbUser = data.user;
    const email = sbUser.email?.toLowerCase().trim();
    if (!email) {
      throw ApiError.badRequest('Supabase user profile is missing an email address');
    }

    const name =
      sbUser.user_metadata?.full_name ||
      sbUser.user_metadata?.name ||
      sbUser.user_metadata?.user_name ||
      email.split('@')[0];
    const avatar = sbUser.user_metadata?.avatar_url || sbUser.user_metadata?.picture || null;

    const isEmailConfirmed = Boolean(
      sbUser.email_confirmed_at ||
      sbUser.confirmed_at ||
      sbUser.app_metadata?.provider === 'google' ||
      sbUser.identities?.some((i) => i.provider === 'google')
    );

    if (!isEmailConfirmed) {
      throw ApiError.unauthorized(
        'Please verify your email address before logging in. Check your inbox for the verification link.'
      );
    }

    // Look up user by email or Supabase ID
    let user = await prisma.user.findFirst({
      where: {
        OR: [{ email }, { id: sbUser.id }],
      },
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          id: sbUser.id,
          name,
          email,
          avatar,
          role: 'student',
          isEmailVerified: isEmailConfirmed,
          isActive: true,
          tenantId: req.tenantId || null,
        },
      });
    } else {
      const updateData: any = {};
      if (isEmailConfirmed && !user.isEmailVerified) updateData.isEmailVerified = true;
      if (!user.avatar && avatar) updateData.avatar = avatar;
      if (Object.keys(updateData).length > 0) {
        user = await prisma.user.update({
          where: { id: user.id },
          data: updateData,
        });
      }
    }

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    res.cookie('refreshToken', refreshToken, getCookieOptions(true));

    const { password, ...userClean } = user;

    return this.ok(
      res,
      {
        user: userClean,
        accessToken,
        refreshToken,
        tokens: {
          accessToken,
          refreshToken,
        },
      },
      'Supabase authentication successful'
    );
  });
}
export default AuthController;
