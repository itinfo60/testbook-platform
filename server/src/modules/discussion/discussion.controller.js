import Discussion from './discussion.model.js';
import Enrollment from '../enrollment/enrollment.model.js';
import ApiError from '../../utils/ApiError.js';
import ApiResponse from '../../utils/ApiResponse.js';
import catchAsync from '../../utils/catchAsync.js';
import { buildPaginationQuery } from '../../utils/pagination.js';

export const getDiscussions = catchAsync(async (req, res) => {
  const pagination = buildPaginationQuery(req.query);

  const filter = { course: req.params.courseId };
  if (req.query.search) {
    filter.$or = [
      { title: { $regex: req.query.search, $options: 'i' } },
      { content: { $regex: req.query.search, $options: 'i' } },
    ];
  }
  if (req.query.isResolved !== undefined) filter.isResolved = req.query.isResolved === 'true';

  const result = await Discussion.paginate(filter, {
    ...pagination,
    populate: [
      { path: 'user', select: 'name avatar role' },
      { path: 'replies.user', select: 'name avatar role' },
    ],
    sort: req.query.sort === 'popular' ? '-likes' : '-createdAt',
  });

  ApiResponse.paginated(res, {
    docs: result.docs,
    page: result.pagination.page,
    limit: result.pagination.limit,
    total: result.pagination.total,
  });
});

export const createDiscussion = catchAsync(async (req, res) => {
  const { courseId } = req.params;
  const { title, content, tags } = req.body;

  // Verify enrollment
  const enrollment = await Enrollment.findOne({
    user: req.userId,
    course: courseId,
    status: { $in: ['active', 'completed'] },
  });

  if (!enrollment && req.user?.role === 'student') {
    throw ApiError.forbidden('You must be enrolled to participate in discussions');
  }

  const discussion = await Discussion.create({
    user: req.userId,
    course: courseId,
    title,
    content,
    tags: tags || [],
  });

  await discussion.populate('user', 'name avatar role');

  ApiResponse.created(res, { discussion }, 'Discussion created');
});

export const addReply = catchAsync(async (req, res) => {
  const { content } = req.body;

  const discussion = await Discussion.findById(req.params.id);
  if (!discussion) throw ApiError.notFound('Discussion not found');

  discussion.replies.push({
    user: req.userId,
    content,
  });

  await discussion.save();
  await discussion.populate('replies.user', 'name avatar role');

  const newReply = discussion.replies[discussion.replies.length - 1];

  ApiResponse.created(res, { reply: newReply }, 'Reply added');
});

export const toggleLike = catchAsync(async (req, res) => {
  const discussion = await Discussion.findById(req.params.id);
  if (!discussion) throw ApiError.notFound('Discussion not found');

  const likeIndex = discussion.likes.findIndex(id => id.toString() === req.userId);

  if (likeIndex > -1) {
    discussion.likes.splice(likeIndex, 1);
  } else {
    discussion.likes.push(req.userId);
  }

  await discussion.save();

  ApiResponse.ok(res, {
    isLiked: likeIndex === -1,
    likeCount: discussion.likes.length,
  });
});

export const toggleResolved = catchAsync(async (req, res) => {
  const discussion = await Discussion.findById(req.params.id);
  if (!discussion) throw ApiError.notFound('Discussion not found');

  // Only author or teacher/admin can resolve
  if (
    discussion.user.toString() !== req.userId &&
    !['teacher', 'admin', 'super_admin'].includes(req.user.role)
  ) {
    throw ApiError.forbidden('Not authorized to resolve this discussion');
  }

  discussion.isResolved = !discussion.isResolved;
  await discussion.save();

  ApiResponse.ok(res, { isResolved: discussion.isResolved });
});

export const deleteDiscussion = catchAsync(async (req, res) => {
  const discussion = await Discussion.findById(req.params.id);
  if (!discussion) throw ApiError.notFound('Discussion not found');

  if (
    discussion.user.toString() !== req.userId &&
    !['admin', 'super_admin'].includes(req.user.role)
  ) {
    throw ApiError.forbidden('Not authorized to delete this discussion');
  }

  await Discussion.findByIdAndDelete(req.params.id);

  ApiResponse.ok(res, null, 'Discussion deleted');
});
