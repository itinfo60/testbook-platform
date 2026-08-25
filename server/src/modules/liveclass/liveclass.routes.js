import { Router } from 'express';
import {
  createLiveClass,
  getMyLiveClasses,
  updateLiveClass,
  startLiveClass,
  endLiveClass,
  getUpcomingClasses,
  joinLiveClass,
  getLiveClassById,
  getLiveKitToken,
  adminGetAllClasses,
  cancelLiveClass,
  deleteLiveClass,
} from './liveclass.controller.js';
import { authenticate, teacherOnly, authorize } from '../../middleware/auth.js';
import validate from '../../middleware/validate-zod.js';
import { createLiveClassSchema, updateLiveClassSchema } from './liveclass.validation.js';

const router = Router();

router.use(authenticate);

// Admin routes
router.get('/admin/all', authorize('admin', 'super_admin'), adminGetAllClasses);

// Teacher & Admin management routes
router.post(
  '/',
  authorize('teacher', 'admin', 'super_admin'),
  validate(createLiveClassSchema),
  createLiveClass
);
router.get('/my', authorize('teacher', 'admin', 'super_admin'), getMyLiveClasses);
router.put(
  '/:id',
  authorize('teacher', 'admin', 'super_admin'),
  validate(updateLiveClassSchema),
  updateLiveClass
);
router.patch('/:id/cancel', authorize('teacher', 'admin', 'super_admin'), cancelLiveClass);
router.delete('/:id', authorize('admin', 'super_admin'), deleteLiveClass);
router.post('/:id/start', authorize('teacher', 'admin', 'super_admin'), startLiveClass);
router.post('/:id/end', authorize('teacher', 'admin', 'super_admin'), endLiveClass);

// Student routes
router.get('/upcoming', getUpcomingClasses);
router.get('/:id', getLiveClassById);
router.post('/:id/join', joinLiveClass);
router.get('/:id/token', getLiveKitToken);

export default router;
