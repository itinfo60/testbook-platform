import { Router } from 'express';
import logController from './log.controller.js';
import { authenticate, authorize, optionalAuth } from '../../middleware/auth.js';

const router = Router();

// Ingestion endpoint (open to client & admin, optional auth to attach user info if logged in)
router.post('/', optionalAuth, logController.ingest);

// Admin-protected audit & query endpoints
router.get('/', authenticate, authorize('admin', 'super_admin'), logController.list);
router.get('/stats', authenticate, authorize('admin', 'super_admin'), logController.stats);
router.delete('/purge', authenticate, authorize('admin', 'super_admin'), logController.purge);

export default router;
