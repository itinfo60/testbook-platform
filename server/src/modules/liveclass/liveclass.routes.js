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
} from './liveclass.controller.js';
import { authenticate, teacherOnly, authorize } from '../../middleware/auth.js';
import validate from '../../middleware/validate-zod.js';
import { createLiveClassSchema, updateLiveClassSchema } from './liveclass.validation.js';

const router = Router();

router.use(authenticate);

// Admin routes
router.get('/admin/all', authorize('admin', 'super_admin'), adminGetAllClasses);

// Teacher routes
router.post('/', teacherOnly, validate(createLiveClassSchema), createLiveClass);
router.get('/my', teacherOnly, getMyLiveClasses);
router.put('/:id', teacherOnly, validate(updateLiveClassSchema), updateLiveClass);
router.post('/:id/start', teacherOnly, startLiveClass);
router.post('/:id/end', teacherOnly, endLiveClass);

// Student routes
router.get('/upcoming', getUpcomingClasses);
router.get('/:id', getLiveClassById);
router.post('/:id/join', joinLiveClass);
router.get('/:id/token', getLiveKitToken);

export default router;
