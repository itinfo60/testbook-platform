import Notification from './notification.model.js';
import ApiResponse from '../../utils/ApiResponse.js';
import ApiError from '../../utils/ApiError.js';
import catchAsync from '../../utils/catchAsync.js';
import { buildPaginationQuery } from '../../utils/pagination.js';

export const getNotifications = catchAsync(async (req, res) => {
  const pagination = buildPaginationQuery(req.query);

  const filter = { recipient: req.userId };
  if (req.query.isRead !== undefined) filter.isRead = req.query.isRead === 'true';
  if (req.query.type) filter.type = req.query.type;

  const result = await Notification.paginate(filter, {
    ...pagination,
    populate: { path: 'sender', select: 'name avatar' },
    sort: '-createdAt',
  });

  const unreadCount = await Notification.getUnreadCount(req.userId);

  ApiResponse.paginated(res, {
    docs: result.docs,
    page: result.pagination.page,
    limit: result.pagination.limit,
    total: result.pagination.total,
    unreadCount,
  });
});

export const markAsRead = catchAsync(async (req, res) => {
  const notification = await Notification.findOneAndUpdate(
    { _id: req.params.id, recipient: req.userId },
    { isRead: true, readAt: new Date() },
    { new: true }
  );

  if (!notification) throw ApiError.notFound('Notification not found');

  ApiResponse.ok(res, { notification });
});

export const markAllAsRead = catchAsync(async (req, res) => {
  await Notification.markAllRead(req.userId);
  ApiResponse.ok(res, null, 'All notifications marked as read');
});

export const deleteNotification = catchAsync(async (req, res) => {
  await Notification.findOneAndDelete({ _id: req.params.id, recipient: req.userId });
  ApiResponse.ok(res, null, 'Notification deleted');
});

export const getUnreadCount = catchAsync(async (req, res) => {
  const count = await Notification.getUnreadCount(req.userId);
  ApiResponse.ok(res, { count });
});
