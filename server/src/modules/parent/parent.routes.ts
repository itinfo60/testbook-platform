import { Router } from 'express';
import { ParentController } from './parent.controller.js';
import { authenticate, authorize } from '../../middleware/auth.js';

const router = Router();
const controller = new ParentController();

// Student routes (to generate code)
router.post('/generate-code', authenticate, authorize('student'), controller.generateAccessCode);

// Parent routes
router.post('/link', authenticate, authorize('parent'), controller.linkStudent);
router.get('/students', authenticate, authorize('parent'), controller.getLinkedStudents);
router.get(
  '/students/:studentId/progress',
  authenticate,
  authorize('parent'),
  controller.getStudentProgress
);

// Chat/Message routes
router.get(
  '/messages/teachers/:studentId',
  authenticate,
  authorize('parent'),
  controller.getTeachersForStudent
);
router.get(
  '/messages/thread/:threadId',
  authenticate,
  authorize('parent', 'teacher'),
  controller.getThreadMessages
);
router.get(
  '/messages/threads',
  authenticate,
  authorize('parent', 'teacher'),
  controller.getActiveThreads
);
router.post('/messages', authenticate, authorize('parent', 'teacher'), controller.sendMessage);

export default router;
