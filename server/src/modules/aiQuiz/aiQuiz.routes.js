import { Router } from 'express';
import * as aiQuizController from './aiQuiz.controller.js';
import { authenticate, authorize } from '../../middleware/auth.js';
import validate from '../../middleware/validate-zod.js';
import { generateQuizSchema, saveQuizSchema } from './aiQuiz.validation.js';

const router = Router();

// Teacher only routes
router.post(
  '/generate',
  authenticate,
  authorize('teacher', 'admin'),
  validate(generateQuizSchema),
  aiQuizController.generateQuiz
);

router.post(
  '/save',
  authenticate,
  authorize('teacher', 'admin'),
  validate(saveQuizSchema),
  aiQuizController.saveQuiz
);

export default router;
