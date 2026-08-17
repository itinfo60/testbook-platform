import express from 'express';
import { createTicket, getTickets } from './support.controller.js';
import { protect, authorize } from '../../middleware/auth.js';
import { requireTenant } from '../../middleware/tenant.middleware.js';

const router = express.Router();

// Public route for submitting tickets
router.post('/tickets', requireTenant, createTicket);

// Admin route for viewing tickets
router.get('/tickets', protect, authorize('admin', 'super_admin'), getTickets);

export default router;
