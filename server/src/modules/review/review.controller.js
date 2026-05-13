import mongoose from 'mongoose';
import Review from './review.model.js';
import Enrollment from '../enrollment/enrollment.model.js';
import ApiError from '../../utils/ApiError.js';
import ApiResponse from '../../utils/ApiResponse.js';
import catchAsync from '../../utils/catchAsync.js';
import redis from '../../config/redis.js';
import { buildPaginationQuery } from '../../utils/pagination.js';

export const getCourseReviews = catchAsync(async (req, res) => {
  const pagination = buildPaginationQuery(req.query);

  const filter = { course: req.params.courseId, isApproved: true };
  if (req.query.rating) filter.rating = parseInt(req.query.rating);

  const result = await Review.paginate(filter, {
    ...pagination,
    populate: { path: 'user', select: 'name avatar' },
    sort: req.query.sort === 'helpful' ? '-helpfulCount' : '-createdAt',
  });

  // Get rating distribution
  const distribution = await Review.aggregate([
    { $match: { course: new mongoose.Types.ObjectId(req.params.courseId), isApproved: true } },
    { $group: { _id: '$rating', count: { $sum: 1 } } },
    { $sort: { _id: -1 } },
  ]);

  ApiResponse.paginated(res, {
    docs: result.docs,
    page: result.pagination.page,
    limit: result.pagination.limit,
    total: result.pagination.total,
    distribution,
  });
});

export const createReview = catchAsync(async (req, res) => {
  const { course, rating, comment } = req.body;

  // Check if user is enrolled
  const enrollment = await Enrollment.findOne({
    user: req.userId,
    course,
    status: { $in: ['active', 'completed'] },
  });

  if (!enrollment) {
    throw ApiError.forbidden('You must be enrolled to review this course');
  }

  // Check if already reviewed
  const existing = await Review.findOne({ user: req.userId, course });
  if (existing) {
    throw ApiError.conflict('You have already reviewed this course');
  }

  const review = await Review.create({
    user: req.userId,
    course,
    rating,
    comment,
  });

  await review.populate('user', 'name avatar');

  await redis.delPattern(`course:*`);

  ApiResponse.created(res, { review }, 'Review submitted successfully');
});

export const updateReview = catchAsync(async (req, res) => {
  const review = await Review.findOne({ _id: req.params.id, user: req.userId });

  if (!review) {
    throw ApiError.notFound('Review not found');
  }

  if (req.body.rating) review.rating = req.body.rating;
  if (req.body.comment) review.comment = req.body.comment;
  await review.save();

  await redis.delPattern(`course:*`);

  ApiResponse.ok(res, { review }, 'Review updated');
});

export const deleteReview = catchAsync(async (req, res) => {
  const review = await Review.findOneAndDelete({
    _id: req.params.id,
    user: req.userId,
  });

  if (!review) {
    throw ApiError.notFound('Review not found');
  }

  await redis.delPattern(`course:*`);

  ApiResponse.ok(res, null, 'Review deleted');
});
