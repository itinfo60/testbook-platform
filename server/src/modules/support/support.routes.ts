import express from 'express';
import {
  createTicket,
  getTickets,
  updateTicket,
  replyTicket,
  deleteTicket,
} from './support.controller.js';
import { authenticate, authorize, optionalAuth } from '../../middleware/auth.js';

const router = express.Router();

// Public / Student route for submitting support tickets
router.post('/tickets', optionalAuth, createTicket);

// Admin routes for managing tickets
router.get('/tickets', authenticate, authorize('admin', 'super_admin'), getTickets);
router.put('/tickets/:id', authenticate, authorize('admin', 'super_admin'), updateTicket);
router.post('/tickets/:id/reply', authenticate, authorize('admin', 'super_admin'), replyTicket);
router.delete('/tickets/:id', authenticate, authorize('admin', 'super_admin'), deleteTicket);

export default router;
