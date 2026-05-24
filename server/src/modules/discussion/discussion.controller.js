import Discussion from './discussion.model.js';
import Enrollment from '../enrollment/enrollment.model.js';
import Course from '../course/course.model.js';
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

export const updateDiscussion = catchAsync(async (req, res) => {
  const { title, content, tags } = req.body;
  const discussion = await Discussion.findById(req.params.id);
  
  if (!discussion) throw ApiError.notFound('Discussion not found');

  if (discussion.user.toString() !== req.userId) {
    throw ApiError.forbidden('Only the author can edit this discussion');
  }

  if (title) discussion.title = title;
  if (content) discussion.content = content;
  if (tags) discussion.tags = tags;

  await discussion.save();
  await discussion.populate('user', 'name avatar role');

  ApiResponse.ok(res, { discussion }, 'Discussion updated');
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

export const updateReply = catchAsync(async (req, res) => {
  const { id, replyId } = req.params;
  const { content } = req.body;

  const discussion = await Discussion.findById(id);
  if (!discussion) throw ApiError.notFound('Discussion not found');

  const reply = discussion.replies.id(replyId);
  if (!reply) throw ApiError.notFound('Reply not found');

  if (reply.user.toString() !== req.userId) {
    throw ApiError.forbidden('Only the author can edit this reply');
  }

  reply.content = content;
  await discussion.save();
  await discussion.populate('replies.user', 'name avatar role');

  ApiResponse.ok(res, { reply }, 'Reply updated');
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

  const isOwner = discussion.user.toString() === req.userId;
  const isAdmin = ['admin', 'super_admin'].includes(req.user?.role);
  const isCourseTeacher = await Course.exists({ _id: discussion.course, teacher: req.userId });

  if (!isOwner && !isAdmin && !isCourseTeacher) {
    throw ApiError.forbidden('Not authorized to delete this discussion');
  }

  await Discussion.findByIdAndDelete(req.params.id);

  ApiResponse.ok(res, null, 'Discussion deleted');
});

export const deleteReply = catchAsync(async (req, res) => {
  const { id, replyId } = req.params;
  const discussion = await Discussion.findById(id);
  if (!discussion) throw ApiError.notFound('Discussion not found');

  const reply = discussion.replies.id(replyId);
  if (!reply) throw ApiError.notFound('Reply not found');

  const isOwner = reply.user.toString() === req.userId.toString();
  const isAdmin = ['admin', 'super_admin'].includes(req.user?.role);
  const isCourseTeacher = await Course.exists({ _id: discussion.course, teacher: req.userId });

  if (!isOwner && !isAdmin && !isCourseTeacher) {
    throw ApiError.forbidden('Not authorized to delete this reply');
  }

  discussion.replies.pull(replyId);
  await discussion.save();

  ApiResponse.ok(res, null, 'Reply deleted');
});
