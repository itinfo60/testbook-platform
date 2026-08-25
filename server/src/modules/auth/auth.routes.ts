import { Router } from 'express';
import passport from '../../config/passport.js';
import { AuthController } from './auth.controller.js';
import { authenticate } from '../../middleware/auth.js';
import validate from '../../middleware/validate-zod.js';
import {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  changePasswordSchema,
  updateProfileSchema,
  mfaVerifySchema,
  mfaLoginSchema,
} from './auth.validation.js';
import { authLimiter } from '../../middleware/rateLimiter.js';
import { checkStudentLimit, checkTeacherLimit } from '../../middleware/tenant.middleware.js';

const router = Router();
const controller = new AuthController();

// Apply limit check only when registering as student or teacher (not admin/parent)
const checkRoleLimit = (req: any, res: any, next: any) => {
  if (req.body.role === 'teacher') return checkTeacherLimit(req, res, next);
  if (!req.body.role || req.body.role === 'student') return checkStudentLimit(req, res, next);
  return next();
};

router.post(
  '/register',
  authLimiter,
  validate(registerSchema),
  checkRoleLimit,
  controller.register
);
router.post('/login', authLimiter, validate(loginSchema), controller.login);
router.post('/supabase-login', authLimiter, controller.handleSupabaseAuth);
router.get('/check-email', authLimiter, controller.checkEmail);
router.post('/logout', authenticate, controller.logout);
router.post('/refresh-token', controller.refreshToken);
router.post(
  '/forgot-password',
  authLimiter,
  validate(forgotPasswordSchema),
  controller.forgotPassword
);
router.post(
  '/reset-password',
  authLimiter,
  validate(resetPasswordSchema),
  controller.resetPassword
);
router.get('/verify-email/:token', controller.verifyEmail);
router.post('/resend-verification', authLimiter, controller.resendVerification);
router.get('/me', authenticate, controller.getMe);
router.get('/profile', authenticate, controller.getMe);
router.patch('/profile', authenticate, validate(updateProfileSchema), controller.updateProfile);
router.put('/profile', authenticate, validate(updateProfileSchema), controller.updateProfile);
router.post(
  '/change-password',
  authenticate,
  validate(changePasswordSchema),
  controller.changePassword
);
router.post('/fcm-token', authenticate, controller.registerFcmToken);
router.delete('/fcm-token', authenticate, controller.removeFcmToken);

// MFA Setup & Activation
router.post('/mfa/setup', authenticate, controller.setupMfa);
router.post('/mfa/verify', authenticate, validate(mfaVerifySchema), controller.verifyMfa);
router.post('/mfa/login', authLimiter, validate(mfaLoginSchema), controller.verifyMfaLogin);
router.post('/mfa/disable', authenticate, controller.disableMfa);

// Google OAuth
router.get(
  '/google',
  passport.authenticate('google', { scope: ['profile', 'email'], session: false })
);
router.get(
  '/google/callback',
  passport.authenticate('google', { session: false, failureRedirect: '/login?error=oauth_failed' }),
  controller.googleCallback
);

export default router;
