import { Router } from 'express';
import { CouponController } from './coupon.controller.js';
import { authenticate, authorize } from '../../middleware/auth.js';
import validate from '../../middleware/validate-zod.js';
import {
  validateCouponSchema,
  createCouponSchema,
  updateCouponSchema,
} from './coupon.validation.js';

const router = Router();
const controller = new CouponController();

router.post('/validate', authenticate, validate(validateCouponSchema), controller.validateCoupon);

// Administrative CRUD
router.use(authenticate, authorize('admin', 'super_admin'));

router.get('/', controller.getCoupons);
router.get('/:id', controller.getCouponById);
router.post('/', validate(createCouponSchema), controller.createCoupon);
router.put('/:id', validate(updateCouponSchema), controller.updateCoupon);
router.delete('/:id', controller.deleteCoupon);

export default router;
