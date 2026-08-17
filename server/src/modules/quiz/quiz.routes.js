import { Router } from 'express';
import * as quizController from './quiz.controller.js';
import { authenticate, authorize, optionalAuth } from '../../middleware/auth.js';

const router = Router();

// Public & Student
router.get('/', optionalAuth, quizController.getAllQuizzes);
router.get('/course/:courseId', optionalAuth, quizController.getCourseQuizzes);
router.get('/:id', optionalAuth, quizController.getQuizById);
router.post('/submit', authenticate, quizController.submitQuiz);

// Teacher
router.get(
  '/teacher/my-quizzes',
  authenticate,
  authorize('teacher', 'admin'),
  quizController.getTeacherQuizzes
);
router.get(
  '/teacher/:id',
  authenticate,
  authorize('teacher', 'admin'),
  quizController.getTeacherQuizById
);
router.post('/', authenticate, authorize('teacher', 'admin'), quizController.createQuiz);
router.put('/:id', authenticate, authorize('teacher', 'admin'), quizController.updateQuiz);
router.delete('/:id', authenticate, authorize('teacher', 'admin'), quizController.deleteQuiz);

export default router;
