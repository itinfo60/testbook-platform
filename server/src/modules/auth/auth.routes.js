import { Router } from 'express';
import * as authController from './auth.controller.js';
import { authenticate } from '../../middleware/auth.js';
import validate from '../../middleware/validate.js';
import { authSchemas } from './auth.validation.js';
import { authLimiter } from '../../middleware/rateLimiter.js';

const router = Router();

router.post('/register', authLimiter, validate(authSchemas.register), authController.register);
router.post('/login', authLimiter, validate(authSchemas.login), authController.login);
router.post('/logout', authenticate, authController.logout);
router.post('/refresh-token', authController.refreshToken);
router.post('/forgot-password', authLimiter, validate(authSchemas.forgotPassword), authController.forgotPassword);
router.post('/reset-password', validate(authSchemas.resetPassword), authController.resetPassword);
router.get('/verify-email/:token', authController.verifyEmail);
router.get('/me', authenticate, authController.getMe);
router.get('/profile', authenticate, authController.getMe);
router.patch('/profile', authenticate, validate(authSchemas.updateProfile), authController.updateProfile);
router.put('/profile', authenticate, validate(authSchemas.updateProfile), authController.updateProfile);
router.post('/change-password', authenticate, validate(authSchemas.changePassword), authController.changePassword);

export default router;
