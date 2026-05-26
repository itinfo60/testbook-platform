import { Router } from 'express';
import {
  generateQuestions,
  solveDoubt,
  generateStudyPlan,
  detectWeakTopics,
  indexCourseContent,
  ragSolveDoubt,
  getAiUsageStats,
} from './ai.controller.js';
import { authenticate, authorize } from '../../middleware/auth.js';
import { createRateLimiter } from '../../middleware/rateLimiter.js';

const router = Router();
const aiLimiter = createRateLimiter(
  60 * 60 * 1000,
  60,
  'Too many AI requests. Limit: 60/hour.',
  'ai'
);

router.use(authenticate, aiLimiter);

router.post('/generate-questions', authorize('teacher', 'admin', 'super_admin'), generateQuestions);
router.post('/solve-doubt', solveDoubt);
router.post('/solve-doubt/stream', solveDoubt); // SSE streaming (send stream:true in body)
router.post('/rag/solve-doubt', ragSolveDoubt); // RAG-enhanced doubt solver
router.post('/rag/index', authorize('teacher', 'admin', 'super_admin'), indexCourseContent);
router.post('/study-plan', generateStudyPlan);
router.post('/weak-topics', detectWeakTopics);
router.get('/usage', authorize('admin', 'super_admin'), getAiUsageStats);

export default router;
