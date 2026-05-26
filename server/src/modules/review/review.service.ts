import mongoose from 'mongoose';
import { ReviewRepository } from './review.repository.js';
import Review from './review.model.js';
import Enrollment from '../enrollment/enrollment.model.js';
import { ICreateReviewInput, IUpdateReviewInput, IReview } from './review.dto.js';
import { ApiError } from '../../core/api-error.js';
import redis from '../../config/redis.js';
import { getTenantId } from '../../core/tenant.context.js';
import { buildPaginationQuery } from '../../utils/pagination.js';

export class ReviewService {
  private readonly reviewRepository: ReviewRepository;

  constructor(reviewRepository = new ReviewRepository()) {
    this.reviewRepository = reviewRepository;
  }

  async getCourseReviews(
    courseId: string,
    query: any
  ): Promise<{
    docs: IReview[];
    page: number;
    limit: number;
    total: number;
    distribution: any[];
  }> {
    const pagination = buildPaginationQuery(query);
    const filter: any = { course: courseId, isApproved: true };
    if (query.rating) filter.rating = parseInt(query.rating, 10);

    const result = await (Review as any).paginate(filter, {
      ...pagination,
      populate: { path: 'user', select: 'name avatar' },
      sort: query.sort === 'helpful' ? '-helpfulCount' : '-createdAt',
    });

    const distribution = await Review.aggregate([
      { $match: { course: new mongoose.Types.ObjectId(courseId), isApproved: true } },
      { $group: { _id: '$rating', count: { $sum: 1 } } },
      { $sort: { _id: -1 } },
    ]);

    return {
      docs: result.docs,
      page: result.pagination.page,
      limit: result.pagination.limit,
      total: result.pagination.total,
      distribution,
    };
  }

  async createReview(userId: string, body: ICreateReviewInput): Promise<IReview> {
    const { course, rating, comment } = body;

    // Check if user is enrolled
    const enrollment = await Enrollment.findOne({
      user: userId,
      course,
      status: { $in: ['active', 'completed'] },
    });

    if (!enrollment) {
      throw ApiError.forbidden('You must be enrolled to review this course');
    }

    // Check if already reviewed
    const existing = await this.reviewRepository.findOne({ user: userId, course });
    if (existing) {
      throw ApiError.conflict('You have already reviewed this course');
    }

    const review = await this.reviewRepository.create({
      user: userId,
      course,
      rating,
      comment,
    });

    await review.populate('user', 'name avatar');

    // Invalidate course cache key pattern (e.g. tenant:${tenantId}:course:*)
    const tenantId = getTenantId();
    await redis.delPattern(tenantId ? `tenant:${tenantId}:course:*` : 'course:*');

    return review;
  }

  async updateReview(id: string, userId: string, body: IUpdateReviewInput): Promise<IReview> {
    const review = await this.reviewRepository.findOne({ _id: id, user: userId });
    if (!review) {
      throw ApiError.notFound('Review not found');
    }

    if (body.rating !== undefined) review.rating = body.rating;
    if (body.comment !== undefined) review.comment = body.comment;
    await review.save();

    const tenantId = getTenantId();
    await redis.delPattern(tenantId ? `tenant:${tenantId}:course:*` : 'course:*');

    return review;
  }

  async deleteReview(id: string, userId: string): Promise<void> {
    const review = await this.reviewRepository.findOne({ _id: id, user: userId });
    if (!review) {
      throw ApiError.notFound('Review not found');
    }

    await this.reviewRepository.deleteById(id);

    const tenantId = getTenantId();
    await redis.delPattern(tenantId ? `tenant:${tenantId}:course:*` : 'course:*');
  }
}

export default ReviewService;
