import { Router } from 'express';
import * as testSeriesController from './testSeries.controller.js';
import { authenticate, authorize, optionalAuth } from '../../middleware/auth.js';

const router = Router();

// Public / optionalAuth routes
router.get('/', optionalAuth, testSeriesController.getTestSeries);
router.get('/:slug', optionalAuth, testSeriesController.getTestSeriesBySlug);

// Teacher / Admin management routes
router.post(
  '/',
  authenticate,
  authorize('teacher', 'admin', 'super_admin'),
  testSeriesController.createTestSeries
);
router.put(
  '/:id',
  authenticate,
  authorize('teacher', 'admin', 'super_admin'),
  testSeriesController.updateTestSeries
);
router.delete(
  '/:id',
  authenticate,
  authorize('teacher', 'admin', 'super_admin'),
  testSeriesController.deleteTestSeries
);

export default router;
