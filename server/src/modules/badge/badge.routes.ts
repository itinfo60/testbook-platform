import { Router } from 'express';
import { BadgeController } from './badge.controller.js';
import { authenticate, authorize } from '../../middleware/auth.js';
import validate from '../../middleware/validate-zod.js';
import { createBadgeSchema, updateBadgeSchema } from './badge.validation.js';

const router = Router();
const controller = new BadgeController();

router.get('/my', authenticate, controller.getMyBadges);

// Administrative CRUD
router.use(authenticate, authorize('admin', 'super_admin'));

router.get('/', controller.getAllBadges);
router.post('/', validate(createBadgeSchema), controller.createBadge);
router.put('/:id', validate(updateBadgeSchema), controller.updateBadge);
router.delete('/:id', controller.deleteBadge);

export default router;
