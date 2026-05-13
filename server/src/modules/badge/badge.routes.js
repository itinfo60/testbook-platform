import { Router } from 'express';
import * as badgeController from './badge.controller.js';
import { authenticate, authorize } from '../../middleware/auth.js';

const router = Router();

router.get('/my', authenticate, badgeController.getMyBadges);

// Admin
router.get('/', authenticate, authorize('admin', 'super_admin'), badgeController.getAllBadges);
router.post('/', authenticate, authorize('admin', 'super_admin'), badgeController.createBadge);
router.put('/:id', authenticate, authorize('admin', 'super_admin'), badgeController.updateBadge);
router.delete('/:id', authenticate, authorize('admin', 'super_admin'), badgeController.deleteBadge);

export default router;
