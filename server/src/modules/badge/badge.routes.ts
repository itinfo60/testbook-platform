import { Router } from 'express';
import { BadgeController } from './badge.controller.js';
import { authenticate, authorize } from '../../middleware/auth.js';
import validate from '../../middleware/validate-zod.js';
import { createBadgeSchema, updateBadgeSchema } from './badge.validation.js';

const router = Router();
const controller = new BadgeController();

router.get('/', authenticate, controller.getAllBadges);
router.get('/my', authenticate, controller.getMyBadges);

// Write operations restricted to admins
router.post(
  '/',
  authenticate,
  authorize('admin', 'super_admin'),
  validate(createBadgeSchema),
  controller.createBadge
);
router.put(
  '/:id',
  authenticate,
  authorize('admin', 'super_admin'),
  validate(updateBadgeSchema),
  controller.updateBadge
);
router.delete('/:id', authenticate, authorize('admin', 'super_admin'), controller.deleteBadge);

export default router;
