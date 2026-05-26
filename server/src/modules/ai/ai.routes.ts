import { Router } from 'express';
import { AiController } from './ai.controller.js';
import { authenticate, authorize } from '../../middleware/auth.js';
import validate from '../../middleware/validate-zod.js';
import { createRateLimiter } from '../../middleware/rateLimiter.js';
import {
  generateQuestionsSchema,
  solveDoubtSchema,
  generateStudyPlanSchema,
  detectWeakTopicsSchema,
  indexCourseContentSchema,
} from './ai.validation.js';

const router = Router();
const controller = new AiController();

const aiLimiter = createRateLimiter(
  60 * 60 * 1000,
  60,
  'Too many AI requests. Limit: 60/hour.',
  'ai'
);

// All AI routes require authentication and are subject to rate limits
router.use(authenticate, aiLimiter);

router.post(
  '/generate-questions',
  authorize('teacher', 'admin', 'super_admin'),
  validate(generateQuestionsSchema),
  controller.generateQuestions
);

router.post('/solve-doubt', validate(solveDoubtSchema), controller.solveDoubt);
router.post('/solve-doubt/stream', validate(solveDoubtSchema), controller.solveDoubt);
router.post('/rag/solve-doubt', validate(solveDoubtSchema), controller.ragSolveDoubt);

router.post(
  '/rag/index',
  authorize('teacher', 'admin', 'super_admin'),
  validate(indexCourseContentSchema),
  controller.indexCourseContent
);

router.post('/study-plan', validate(generateStudyPlanSchema), controller.generateStudyPlan);
router.post('/weak-topics', validate(detectWeakTopicsSchema), controller.detectWeakTopics);
router.get('/usage', authorize('admin', 'super_admin'), controller.getAiUsageStats);

export default router;
