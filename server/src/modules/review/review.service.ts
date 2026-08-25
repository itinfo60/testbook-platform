import { ReviewRepository } from './review.repository.js';
import { ICreateReviewInput, IUpdateReviewInput, IReview } from './review.dto.js';
import { ApiError } from '../../core/api-error.js';
import redis from '../../config/redis.js';
import { getTenantId } from '../../core/tenant.context.js';
import { buildPaginationQuery } from '../../utils/pagination.js';
import prisma from '../../config/prisma.js';

export class ReviewService {
  private readonly reviewRepository: ReviewRepository;

  constructor(reviewRepository = new ReviewRepository()) {
    this.reviewRepository = reviewRepository;
  }

  async getCourseReviews(
    courseId: string,
    query: any
  ): Promise<{
    docs: any[];
    page: number;
    limit: number;
    total: number;
    distribution: any[];
  }> {
    const pagination = buildPaginationQuery(query);

    let resolvedId = courseId;
    if (
      courseId.includes('-') &&
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(courseId)
    ) {
      const course = await prisma.course.findFirst({
        where: { slug: courseId },
        select: { id: true },
      });
      if (!course) throw ApiError.badRequest(`Invalid course: ${courseId}`);
      resolvedId = course.id;
    }

    const where: any = { courseId: resolvedId, isApproved: true };
    if (query.rating) where.rating = parseInt(query.rating, 10);

    const [total, docs] = await Promise.all([
      prisma.review.count({ where }),
      prisma.review.findMany({
        where,
        include: { user: { select: { id: true, name: true, avatar: true } } },
        orderBy: query.sort === 'helpful' ? { rating: 'desc' } : { createdAt: 'desc' },
        skip: pagination.skip,
        take: pagination.limit,
      }),
    ]);

    const distGroups = await prisma.review.groupBy({
      by: ['rating'],
      where: { courseId: resolvedId, isApproved: true },
      _count: { rating: true },
      orderBy: { rating: 'desc' },
    });

    const distribution = distGroups.map((d) => ({ _id: d.rating, count: d._count.rating }));

    return {
      docs,
      page: pagination.page,
      limit: pagination.limit,
      total,
      distribution,
    };
  }

  async createReview(userId: string, body: ICreateReviewInput): Promise<any> {
    const { course: courseInput, rating, comment } = body;

    // Resolve course by UUID or slug
    let course = await prisma.course.findFirst({
      where: {
        OR: [{ id: courseInput }, { slug: courseInput }],
      },
      select: { id: true, tenantId: true },
    });

    if (!course) {
      throw ApiError.badRequest('Course not found');
    }

    const courseId = course.id;

    // Check enrollment
    const enrollment = await prisma.enrollment.findFirst({
      where: {
        userId,
        courseId,
        status: { in: ['active', 'completed'] },
      },
    });

    if (!enrollment) {
      throw ApiError.forbidden('You must be enrolled to review this course');
    }

    // Check if review already exists for this user and course
    const existing = await prisma.review.findFirst({
      where: { userId, courseId },
    });

    let review;
    if (existing) {
      // Gracefully update existing review instead of throwing duplicate constraint error
      review = await prisma.review.update({
        where: { id: existing.id },
        data: {
          rating,
          comment,
          isApproved: true,
        },
        include: { user: { select: { id: true, name: true, avatar: true } } },
      });
    } else {
      review = await prisma.review.create({
        data: {
          userId,
          courseId,
          rating,
          comment,
          isApproved: true,
          tenantId: course.tenantId || null,
        },
        include: { user: { select: { id: true, name: true, avatar: true } } },
      });
    }

    // Recalculate Course rating
    const avg = await prisma.review.aggregate({
      where: { courseId, isApproved: true },
      _avg: { rating: true },
    });
    if (avg._avg.rating !== null) {
      await prisma.course.update({
        where: { id: courseId },
        data: { rating: Math.round(avg._avg.rating * 10) / 10 },
      });
    }

    const tenantId = getTenantId();
    await redis.delPattern(tenantId ? `tenant:${tenantId}:course:*` : 'course:*');

    return review;
  }

  async updateReview(id: string, userId: string, body: IUpdateReviewInput): Promise<any> {
    let review = await prisma.review.findFirst({
      where: {
        OR: [{ id, userId }, { id }],
      },
    });

    if (!review) {
      throw ApiError.notFound('Review not found');
    }

    // Permission check
    if (review.userId !== userId) {
      const user = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
      if (user?.role !== 'admin' && user?.role !== 'super_admin') {
        throw ApiError.forbidden('You can only edit your own review');
      }
    }

    const updateData: any = {};
    if (body.rating !== undefined) updateData.rating = body.rating;
    if (body.comment !== undefined) updateData.comment = body.comment;
    updateData.isApproved = true;

    const updatedReview = await prisma.review.update({
      where: { id: review.id },
      data: updateData,
      include: { user: { select: { id: true, name: true, avatar: true } } },
    });

    // Recalculate Course rating
    const avg = await prisma.review.aggregate({
      where: { courseId: review.courseId, isApproved: true },
      _avg: { rating: true },
    });
    if (avg._avg.rating !== null) {
      await prisma.course.update({
        where: { id: review.courseId },
        data: { rating: Math.round(avg._avg.rating * 10) / 10 },
      });
    }

    const tenantId = getTenantId();
    await redis.delPattern(tenantId ? `tenant:${tenantId}:course:*` : 'course:*');

    return updatedReview;
  }

  async deleteReview(id: string, userId: string): Promise<void> {
    const review = await prisma.review.findFirst({ where: { id, userId } });
    if (!review) {
      throw ApiError.notFound('Review not found');
    }

    await prisma.review.delete({ where: { id } });

    // Recalculate Course rating
    const avg = await prisma.review.aggregate({
      where: { courseId: review.courseId, isApproved: true },
      _avg: { rating: true },
    });
    await prisma.course.update({
      where: { id: review.courseId },
      data: { rating: avg._avg.rating !== null ? Math.round(avg._avg.rating * 10) / 10 : 0 },
    });

    const tenantId = getTenantId();
    await redis.delPattern(tenantId ? `tenant:${tenantId}:course:*` : 'course:*');
  }
}

export default ReviewService;
