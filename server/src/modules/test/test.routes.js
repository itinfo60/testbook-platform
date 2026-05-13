import { Router } from 'express';
import * as testController from './test.controller.js';
import { authenticate, authorize, optionalAuth } from '../../middleware/auth.js';

const router = Router();

// Public
router.get('/', testController.getTests);
router.get('/:id', optionalAuth, testController.getTestById);

// Student
router.post('/:id/start', authenticate, testController.startTest);
router.post('/submit/:attemptId', authenticate, testController.submitTest);
router.get('/result/:attemptId', authenticate, testController.getTestResult);
router.get('/my/attempts', authenticate, testController.getMyAttempts);

// Teacher
router.post('/', authenticate, authorize('teacher', 'admin'), testController.createTest);
router.put('/:id', authenticate, authorize('teacher', 'admin'), testController.updateTest);
router.delete('/:id', authenticate, authorize('teacher', 'admin'), testController.deleteTest);
router.get('/teacher/my-tests', authenticate, authorize('teacher', 'admin'), testController.getTeacherTests);
router.get('/teacher/analytics/:id', authenticate, authorize('teacher', 'admin'), testController.getTestAnalytics);

export default router;
