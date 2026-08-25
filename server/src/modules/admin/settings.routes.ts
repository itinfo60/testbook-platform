import { Router } from 'express';
import settingsController from './settings.controller.js';
import { authenticate, authorize } from '../../middleware/auth.js';

const router = Router();

// Public endpoints for frontend settings & content
router.get('/', (req, res, next) => settingsController.getPublicSettings(req, res, next));
router.get('/public', (req, res, next) => settingsController.getPublicSettings(req, res, next));
router.get('/legal', (req, res, next) => settingsController.getLegalSettings(req, res, next));
router.get('/help', (req, res, next) => settingsController.getHelpSettings(req, res, next));
router.get('/success-stories', (req, res, next) =>
  settingsController.getSuccessStories(req, res, next)
);

// Admin endpoints (require admin / super_admin authentication)
router.get('/admin', authenticate, authorize('admin', 'super_admin'), (req, res, next) =>
  settingsController.getAdminSettings(req, res, next)
);

router.put('/admin', authenticate, authorize('admin', 'super_admin'), (req, res, next) =>
  settingsController.updateAdminSettings(req, res, next)
);

router.put('/legal', authenticate, authorize('admin', 'super_admin'), (req, res, next) =>
  settingsController.updateLegalSettings(req, res, next)
);

router.put('/help', authenticate, authorize('admin', 'super_admin'), (req, res, next) =>
  settingsController.updateHelpSettings(req, res, next)
);

router.put('/success-stories', authenticate, authorize('admin', 'super_admin'), (req, res, next) =>
  settingsController.updateSuccessStories(req, res, next)
);

router.put('/admin/banners', authenticate, authorize('admin', 'super_admin'), (req, res, next) =>
  settingsController.updateBanners(req, res, next)
);

export default router;
