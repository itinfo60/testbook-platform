import { Response, Request } from 'express';
import { BaseController } from '../../core/base.controller.js';
import { DiscussionService } from './discussion.service.js';
import { ApiError } from '../../core/api-error.js';

interface CustomRequest extends Request {
  userId?: string;
  user?: {
    role: string;
  };
  tenantId?: string | null;
}

export class DiscussionController extends BaseController {
  private readonly discussionService: DiscussionService;

  constructor(discussionService = new DiscussionService()) {
    super();
    this.discussionService = discussionService;
  }

  getDiscussions = this.catchAsync(async (req: CustomRequest, res: Response) => {
    const data = await this.discussionService.getDiscussions(req.params.courseId, req.query);
    return this.ok(res, data);
  });

  createDiscussion = this.catchAsync(async (req: CustomRequest, res: Response) => {
    if (!req.userId || !req.user?.role) {
      throw ApiError.unauthorized();
    }

    const discussion = await this.discussionService.createDiscussion(
      req.userId,
      req.user.role,
      req.params.courseId,
      {
        title: req.body.title,
        content: req.body.content,
        tags: req.body.tags,
      }
    );

    return this.created(res, { discussion }, 'Discussion created');
  });

  updateDiscussion = this.catchAsync(async (req: CustomRequest, res: Response) => {
    if (!req.userId) {
      throw ApiError.unauthorized();
    }

    const discussion = await this.discussionService.updateDiscussion(req.params.id, req.userId, {
      title: req.body.title,
      content: req.body.content,
      tags: req.body.tags,
    });

    return this.ok(res, { discussion }, 'Discussion updated');
  });

  addReply = this.catchAsync(async (req: CustomRequest, res: Response) => {
    if (!req.userId) {
      throw ApiError.unauthorized();
    }

    const reply = await this.discussionService.addReply(req.params.id, req.userId, {
      content: req.body.content,
    });

    return this.created(res, { reply }, 'Reply added');
  });

  updateReply = this.catchAsync(async (req: CustomRequest, res: Response) => {
    if (!req.userId) {
      throw ApiError.unauthorized();
    }

    const reply = await this.discussionService.updateReply(
      req.params.id,
      req.params.replyId,
      req.userId,
      {
        content: req.body.content,
      }
    );

    return this.ok(res, { reply }, 'Reply updated');
  });

  toggleLike = this.catchAsync(async (req: CustomRequest, res: Response) => {
    if (!req.userId) {
      throw ApiError.unauthorized();
    }

    const result = await this.discussionService.toggleLike(req.params.id, req.userId);
    return this.ok(res, result);
  });

  toggleResolved = this.catchAsync(async (req: CustomRequest, res: Response) => {
    if (!req.userId || !req.user?.role) {
      throw ApiError.unauthorized();
    }

    const isResolved = await this.discussionService.toggleResolved(
      req.params.id,
      req.userId,
      req.user.role
    );

    return this.ok(res, { isResolved });
  });

  deleteDiscussion = this.catchAsync(async (req: CustomRequest, res: Response) => {
    if (!req.userId || !req.user?.role) {
      throw ApiError.unauthorized();
    }

    await this.discussionService.deleteDiscussion(req.params.id, req.userId, req.user.role);
    return this.ok(res, null, 'Discussion deleted');
  });

  deleteReply = this.catchAsync(async (req: CustomRequest, res: Response) => {
    if (!req.userId || !req.user?.role) {
      throw ApiError.unauthorized();
    }

    await this.discussionService.deleteReply(
      req.params.id,
      req.params.replyId,
      req.userId,
      req.user.role
    );

    return this.ok(res, null, 'Reply deleted');
  });
}

export default DiscussionController;
