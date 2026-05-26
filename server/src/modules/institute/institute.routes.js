import express from 'express';
import {
  getBranding,
  onboardInstitute,
  createInstitute,
  getAllInstitutes,
  updateInstitute,
  updateBranding,
  deleteInstitute,
  checkSubdomain,
  suspendInstitute,
  activateInstitute,
  getSuperAdminStats,
} from './institute.controller.js';
import { authenticate, superAdminOnly, instituteAdminOnly } from '../../middleware/auth.js';
import { requireTenant } from '../../middleware/tenant.middleware.js';

const router = express.Router();

// Public routes
router.get('/branding', requireTenant, getBranding);
router.post('/onboard', onboardInstitute);
router.get('/check-subdomain/:subdomain', checkSubdomain);

// Institute Admin/Owner routes
router.post('/branding', requireTenant, authenticate, instituteAdminOnly, updateBranding);

// Super Admin routes (global platform administration)
router.get('/admin/stats', authenticate, superAdminOnly, getSuperAdminStats);
router.post('/admin/all', authenticate, superAdminOnly, createInstitute);
router.get('/admin/all', authenticate, superAdminOnly, getAllInstitutes);
router.put('/admin/all/:id', authenticate, superAdminOnly, updateInstitute);
router.delete('/admin/all/:id', authenticate, superAdminOnly, deleteInstitute);
router.patch('/admin/all/:id/suspend', authenticate, superAdminOnly, suspendInstitute);
router.patch('/admin/all/:id/activate', authenticate, superAdminOnly, activateInstitute);

export default router;
