import { Response, Request } from 'express';
import { BaseController } from '../../core/base.controller.js';
import { BadgeService } from './badge.service.js';

interface CustomRequest extends Request {
  userId?: string;
  tenantId?: string | null;
}

export class BadgeController extends BaseController {
  private readonly badgeService: BadgeService;

  constructor(badgeService = new BadgeService()) {
    super();
    this.badgeService = badgeService;
  }

  getMyBadges = this.catchAsync(async (req: CustomRequest, res: Response) => {
    const result = await this.badgeService.getMyBadges(req.userId!);
    return this.ok(res, result);
  });

  getAllBadges = this.catchAsync(async (req: CustomRequest, res: Response) => {
    const badges = await this.badgeService.getAllBadges();
    return this.ok(res, { badges });
  });

  createBadge = this.catchAsync(async (req: CustomRequest, res: Response) => {
    const badge = await this.badgeService.createBadge(req.body);
    return this.created(res, { badge }, 'Badge created');
  });

  updateBadge = this.catchAsync(async (req: CustomRequest, res: Response) => {
    const badge = await this.badgeService.updateBadge(req.params.id, req.body);
    return this.ok(res, { badge }, 'Badge updated');
  });

  deleteBadge = this.catchAsync(async (req: CustomRequest, res: Response) => {
    await this.badgeService.deleteBadge(req.params.id);
    return this.ok(res, null, 'Badge deleted');
  });
}

export default BadgeController;
