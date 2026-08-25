import { Response, Request } from 'express';
import { BaseController } from '../../core/base.controller.js';
import { ReviewService } from './review.service.js';
import { ApiError } from '../../core/api-error.js';

interface CustomRequest extends Request {
  userId?: string;
  tenantId?: string | null;
}

export class ReviewController extends BaseController {
  private readonly reviewService: ReviewService;

  constructor(reviewService = new ReviewService()) {
    super();
    this.reviewService = reviewService;
  }

  getCourseReviews = this.catchAsync(async (req: CustomRequest, res: Response) => {
    const data = await this.reviewService.getCourseReviews(req.params.courseId, req.query);
    return this.ok(res, data);
  });

  createReview = this.catchAsync(async (req: CustomRequest, res: Response) => {
    if (!req.userId) {
      throw ApiError.unauthorized();
    }

    const courseId = req.body.courseId || req.body.course;

    const review = await this.reviewService.createReview(req.userId, {
      course: courseId,
      rating: req.body.rating,
      comment: req.body.comment,
    });

    return this.created(res, { review }, 'Review submitted successfully');
  });

  updateReview = this.catchAsync(async (req: CustomRequest, res: Response) => {
    if (!req.userId) {
      throw ApiError.unauthorized();
    }

    const review = await this.reviewService.updateReview(req.params.id, req.userId, {
      rating: req.body.rating,
      comment: req.body.comment,
    });

    return this.ok(res, { review }, 'Review updated');
  });

  deleteReview = this.catchAsync(async (req: CustomRequest, res: Response) => {
    if (!req.userId) {
      throw ApiError.unauthorized();
    }

    await this.reviewService.deleteReview(req.params.id, req.userId);

    return this.ok(res, null, 'Review deleted');
  });
}

export default ReviewController;
