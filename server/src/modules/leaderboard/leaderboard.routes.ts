import { Router } from 'express';
import { LeaderboardController } from './leaderboard.controller.js';
import { optionalAuth } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate-zod.js';
import { getLeaderboardSchema } from './leaderboard.validation.js';

const router = Router();
const controller = new LeaderboardController();

router.get('/', optionalAuth, validate(getLeaderboardSchema, 'query'), controller.getLeaderboard);

export default router;
