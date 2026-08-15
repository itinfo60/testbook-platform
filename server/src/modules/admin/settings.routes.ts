import { Router } from 'express';
import settingsController from './settings.controller.js';
import { authenticate, authorize } from '../../middleware/auth.js';

const router = Router();

// Public endpoint for frontend settings
router.get('/', (req, res, next) => settingsController.getPublicSettings(req, res, next));

// Admin endpoints
router.get('/admin', authenticate, authorize('admin', 'super_admin'), (req, res, next) =>
  settingsController.getAdminSettings(req, res, next)
);

router.put('/admin', authenticate, authorize('admin', 'super_admin'), (req, res, next) =>
  settingsController.updateAdminSettings(req, res, next)
);

router.put('/admin/banners', authenticate, authorize('admin', 'super_admin'), (req, res, next) =>
  settingsController.updateBanners(req, res, next)
);

export default router;
