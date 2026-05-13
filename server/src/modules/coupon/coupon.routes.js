import { Router } from 'express';
import * as couponController from './coupon.controller.js';
import { authenticate, authorize } from '../../middleware/auth.js';

const router = Router();

router.post('/validate', authenticate, couponController.validateCoupon);

// Admin
router.get('/', authenticate, authorize('admin', 'super_admin'), couponController.getCoupons);
router.post('/', authenticate, authorize('admin', 'super_admin'), couponController.createCoupon);
router.put('/:id', authenticate, authorize('admin', 'super_admin'), couponController.updateCoupon);
router.delete('/:id', authenticate, authorize('admin', 'super_admin'), couponController.deleteCoupon);

export default router;
