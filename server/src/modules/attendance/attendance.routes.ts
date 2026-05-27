import { Router } from 'express';
import { AttendanceController } from './attendance.controller.js';
import { authenticate, authorize } from '../../middleware/auth.js';

const router = Router();
const controller = new AttendanceController();

router.get(
  '/course/:courseId',
  authenticate,
  authorize('teacher', 'admin'),
  controller.getAttendance
);

router.post(
  '/course/:courseId',
  authenticate,
  authorize('teacher', 'admin'),
  controller.saveAttendance
);

export default router;
