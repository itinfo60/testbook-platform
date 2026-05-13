import { Router } from 'express';
import * as leaderboardController from './leaderboard.controller.js';
import { optionalAuth } from '../../middleware/auth.js';

const router = Router();

router.get('/', optionalAuth, leaderboardController.getLeaderboard);

export default router;
