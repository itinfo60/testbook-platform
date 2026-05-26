import { Router } from 'express';
import { authenticate, authorize } from '../../middleware/auth.js';
import * as affiliateController from './affiliate.controller.js';

const router = Router();

router.get('/validate/:code', affiliateController.validateReferralCode); // public

router.use(authenticate);
router.post('/register', affiliateController.registerAffiliate);
router.get('/me', affiliateController.getMyAffiliate);

// Admin routes
router.get('/admin', authorize('admin', 'super_admin'), affiliateController.listAffiliates);
router.post(
  '/admin/:id/payout',
  authorize('admin', 'super_admin'),
  affiliateController.processPayout
);

export default router;
