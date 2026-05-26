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
} from './auth.validation.js';
import { authLimiter } from '../../middleware/rateLimiter.js';

const router = Router();
const controller = new AuthController();

router.post('/register', authLimiter, validate(registerSchema), controller.register);
router.post('/login', authLimiter, validate(loginSchema), controller.login);
router.post('/logout', authenticate, controller.logout);
router.post('/refresh-token', controller.refreshToken);
router.post(
  '/forgot-password',
  authLimiter,
  validate(forgotPasswordSchema),
  controller.forgotPassword
);
router.post('/reset-password', validate(resetPasswordSchema), controller.resetPassword);
router.get('/verify-email/:token', controller.verifyEmail);
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
router.post('/mfa/login', validate(mfaVerifySchema), controller.verifyMfaLogin);
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
