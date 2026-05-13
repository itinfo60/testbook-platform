import Note from './note.model.js';
import ApiError from '../../utils/ApiError.js';
import ApiResponse from '../../utils/ApiResponse.js';
import catchAsync from '../../utils/catchAsync.js';
import { buildPaginationQuery } from '../../utils/pagination.js';

export const getNotes = catchAsync(async (req, res) => {
  const pagination = buildPaginationQuery(req.query);

  const filter = { user: req.userId, course: req.params.courseId };
  if (req.query.lessonId) filter.lesson = req.query.lessonId;

  const result = await Note.paginate(filter, {
    ...pagination,
    sort: req.query.sort === 'timestamp' ? 'timestamp' : '-createdAt',
  });

  ApiResponse.paginated(res, {
    docs: result.docs,
    page: result.pagination.page,
    limit: result.pagination.limit,
    total: result.pagination.total,
  });
});

export const createNote = catchAsync(async (req, res) => {
  const note = await Note.create({
    user: req.userId,
    course: req.params.courseId,
    lesson: req.body.lessonId,
    content: req.body.content,
    timestamp: req.body.timestamp || 0,
    color: req.body.color,
  });

  ApiResponse.created(res, { note }, 'Note created');
});

export const updateNote = catchAsync(async (req, res) => {
  const note = await Note.findOneAndUpdate(
    { _id: req.params.id, user: req.userId },
    { content: req.body.content, color: req.body.color, isPinned: req.body.isPinned },
    { new: true, runValidators: true }
  );

  if (!note) throw ApiError.notFound('Note not found');

  ApiResponse.ok(res, { note }, 'Note updated');
});

export const deleteNote = catchAsync(async (req, res) => {
  const note = await Note.findOneAndDelete({ _id: req.params.id, user: req.userId });
  if (!note) throw ApiError.notFound('Note not found');

  ApiResponse.ok(res, null, 'Note deleted');
});

export const getAllMyNotes = catchAsync(async (req, res) => {
  const pagination = buildPaginationQuery(req.query);

  const result = await Note.paginate({ user: req.userId }, {
    ...pagination,
    populate: { path: 'course', select: 'title slug thumbnail' },
    sort: '-updatedAt',
  });

  ApiResponse.paginated(res, {
    docs: result.docs,
    page: result.pagination.page,
    limit: result.pagination.limit,
    total: result.pagination.total,
  });
});
