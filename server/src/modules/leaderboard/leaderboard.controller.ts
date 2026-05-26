import { Response, Request } from 'express';
import { BaseController } from '../../core/base.controller.js';
import { LeaderboardService } from './leaderboard.service.js';

interface CustomRequest extends Request {
  userId?: string;
  tenantId?: string | null;
}

export class LeaderboardController extends BaseController {
  private readonly leaderboardService: LeaderboardService;

  constructor(leaderboardService = new LeaderboardService()) {
    super();
    this.leaderboardService = leaderboardService;
  }

  getLeaderboard = this.catchAsync(async (req: CustomRequest, res: Response) => {
    const period = (req.query.period as 'all' | 'weekly' | 'monthly') || 'all';
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 50;
    const userId = req.userId;

    const data = await this.leaderboardService.getLeaderboard(period, limit, userId);

    return this.ok(res, data);
  });
}

export default LeaderboardController;
