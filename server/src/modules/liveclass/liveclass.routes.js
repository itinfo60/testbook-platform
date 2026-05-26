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
} from './liveclass.controller.js';
import { authenticate, teacherOnly } from '../../middleware/auth.js';

const router = Router();

router.use(authenticate);

// Teacher routes
router.post('/', teacherOnly, createLiveClass);
router.get('/my', teacherOnly, getMyLiveClasses);
router.put('/:id', teacherOnly, updateLiveClass);
router.post('/:id/start', teacherOnly, startLiveClass);
router.post('/:id/end', teacherOnly, endLiveClass);

// Student routes
router.get('/upcoming', getUpcomingClasses);
router.get('/:id', getLiveClassById);
router.post('/:id/join', joinLiveClass);

export default router;
