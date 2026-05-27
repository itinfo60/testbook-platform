import { Request, Response } from 'express';
import { BaseController } from '../../core/base.controller.js';
import { AuthService } from './auth.service.js';
import { ApiError } from '../../core/api-error.js';
import config from '../../config/index.js';
import { IUser } from './auth.dto.ts';
import User from '../user/user.model.js';
import { runWithTenant } from '../../core/tenant.context.js';

interface CustomRequest extends Request {
  tenantId?: string | null;
  tenant?: any;
  userId?: string;
  user?: any;
}

const cookieOptions = {
  httpOnly: true,
  secure: config.env === 'production',
  sameSite: (config.env === 'production' ? 'strict' : 'lax') as 'strict' | 'lax',
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
};

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

    res.cookie('refreshToken', result.tokens.refreshToken, cookieOptions);

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
    console.log('Login result:', result);

    if ('requiresMfa' in result && result.requiresMfa) {
      return this.ok(
        res,
        { requiresMfa: true, userId: result.userId },
        'MFA verification required'
      );
    }

    const mfaResult = result as any;
    res.cookie('refreshToken', mfaResult.tokens.refreshToken, cookieOptions);

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
    const result = await this.authService.verifyMfaLogin(userId, token, userAgent);

    res.cookie('refreshToken', result.tokens.refreshToken, cookieOptions);

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

    res.cookie('refreshToken', result.newRefreshToken, cookieOptions);

    return this.ok(res, { accessToken: result.accessToken }, 'Token refreshed');
  });

  logout = this.catchAsync(async (req: CustomRequest, res: Response) => {
    const rawRefreshToken = req.cookies?.refreshToken;
    const accessToken = req.headers.authorization?.split(' ')[1];

    if (req.userId) {
      await this.authService.logout(req.userId, rawRefreshToken, accessToken);
    }

    res.clearCookie('refreshToken', cookieOptions);

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

    res.cookie('refreshToken', result.newRefreshToken, cookieOptions);

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
    await this.authService.disableMfa(req.userId, req.body.password);
    return this.ok(res, null, 'MFA disabled');
  });

  registerFcmToken = this.catchAsync(async (req: CustomRequest, res: Response) => {
    if (!req.userId) {
      throw ApiError.unauthorized();
    }
    const { token } = req.body;
    if (!token) throw ApiError.badRequest('FCM token required');

    await runWithTenant(null, true, () =>
      User.findByIdAndUpdate(req.userId, {
        $addToSet: { fcmTokens: token },
      })
    );

    return this.ok(res, null, 'FCM token registered');
  });

  removeFcmToken = this.catchAsync(async (req: CustomRequest, res: Response) => {
    if (!req.userId) {
      throw ApiError.unauthorized();
    }
    const { token } = req.body;
    if (!token) throw ApiError.badRequest('FCM token required');

    await runWithTenant(null, true, () =>
      User.findByIdAndUpdate(req.userId, {
        $pull: { fcmTokens: token },
      })
    );

    return this.ok(res, null, 'FCM token removed');
  });

  googleCallback = this.catchAsync(async (req: CustomRequest, res: Response) => {
    const user = req.user as IUser;
    if (!user) throw ApiError.unauthorized('Google authentication failed');

    const accessToken = user.generateAccessToken();
    const rawRefreshTokenStr = user.generateRefreshToken();

    const hashedToken = crypto.createHash('sha256').update(rawRefreshTokenStr).digest('hex');
    user.refreshTokens.push({
      token: hashedToken,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      device: req.headers['user-agent'] || 'unknown',
    });

    await runWithTenant(user.tenantId ? user.tenantId.toString() : null, !user.tenantId, () =>
      user.save({ validateBeforeSave: false })
    );

    res.cookie('refreshToken', rawRefreshTokenStr, cookieOptions);

    const redirectUrl = `${config.clientUrl}/auth/callback?token=${accessToken}`;
    return res.redirect(redirectUrl);
  });
}
export default AuthController;
