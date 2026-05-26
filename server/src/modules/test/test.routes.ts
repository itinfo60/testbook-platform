import { Router } from 'express';
import { TestController } from './test.controller.js';
import { authenticate, authorize, optionalAuth } from '../../middleware/auth.js';
import validate from '../../middleware/validate-zod.js';
import {
  createTestSchema,
  updateTestSchema,
  autoSaveSchema,
  submitTestSchema,
  gradeSubjectiveSchema,
} from './test.validation.js';

const router = Router();
const controller = new TestController();

// Public / optional auth
router.get('/', optionalAuth, controller.getTests);
router.get('/:id', optionalAuth, controller.getTestById);

// Student actions
router.post('/:id/start', authenticate, controller.startTest);
router.post('/auto-save/:attemptId', authenticate, validate(autoSaveSchema), controller.autoSave);
router.post('/violation/:attemptId', authenticate, controller.logViolation);
router.post('/submit/:attemptId', authenticate, validate(submitTestSchema), controller.submitTest);
router.get('/result/:attemptId', authenticate, controller.getTestResult);
router.get('/my/attempts', authenticate, controller.getMyAttempts);

// Teacher / Admin actions
router.post(
  '/',
  authenticate,
  authorize('teacher', 'admin'),
  validate(createTestSchema),
  controller.createTest
);
router.put(
  '/:id',
  authenticate,
  authorize('teacher', 'admin'),
  validate(updateTestSchema),
  controller.updateTest
);
router.delete('/:id', authenticate, authorize('teacher', 'admin'), controller.deleteTest);
router.get(
  '/teacher/my-tests',
  authenticate,
  authorize('teacher', 'admin'),
  controller.getTeacherTests
);
router.post(
  '/attempt/:attemptId/grade',
  authenticate,
  authorize('teacher', 'admin'),
  validate(gradeSubjectiveSchema),
  controller.gradeSubjective
);
router.get(
  '/teacher/analytics/:id',
  authenticate,
  authorize('teacher', 'admin'),
  controller.getTestAnalytics
);

export default router;
