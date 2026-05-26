import { Router } from 'express';
import { InstituteController } from './institute.controller.js';
import { authenticate, superAdminOnly, instituteAdminOnly } from '../../middleware/auth.js';
import { requireTenant } from '../../middleware/tenant.middleware.js';
import validate from '../../middleware/validate-zod.js';
import {
  onboardInstituteSchema,
  createInstituteSchema,
  updateInstituteSchema,
  updateBrandingSchema,
} from './institute.validation.js';

const router = Router();
const controller = new InstituteController();

// Public routes
router.get('/branding', requireTenant, controller.getBranding);
router.post('/onboard', validate(onboardInstituteSchema), controller.onboardInstitute);
router.get('/check-subdomain/:subdomain', controller.checkSubdomain);

// Institute Admin/Owner routes
router.post(
  '/branding',
  requireTenant,
  authenticate,
  instituteAdminOnly,
  validate(updateBrandingSchema),
  controller.updateBranding
);

// Super Admin routes (global platform administration)
router.get('/admin/stats', authenticate, superAdminOnly, controller.getSuperAdminStats);
router.post(
  '/admin/all',
  authenticate,
  superAdminOnly,
  validate(createInstituteSchema),
  controller.createInstitute
);
router.get('/admin/all', authenticate, superAdminOnly, controller.getAllInstitutes);
router.put(
  '/admin/all/:id',
  authenticate,
  superAdminOnly,
  validate(updateInstituteSchema),
  controller.updateInstitute
);
router.delete('/admin/all/:id', authenticate, superAdminOnly, controller.deleteInstitute);
router.patch('/admin/all/:id/suspend', authenticate, superAdminOnly, controller.suspendInstitute);
router.patch('/admin/all/:id/activate', authenticate, superAdminOnly, controller.activateInstitute);

export default router;
