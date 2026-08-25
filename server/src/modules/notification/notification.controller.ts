import ApiResponse from '../../utils/ApiResponse.js';
import ApiError from '../../utils/ApiError.js';
import catchAsync from '../../utils/catchAsync.js';
import prisma from '../../config/prisma.js';

export const getNotifications = catchAsync(async (req, res) => {
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  const filter: any = { userId: req.userId };
  if (req.query.isRead !== undefined) filter.isRead = req.query.isRead === 'true';
  if (req.query.type) filter.type = req.query.type;

  const [docs, total] = await Promise.all([
    prisma.notification.findMany({
      where: filter,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.notification.count({ where: filter }),
  ]);

  const unreadCount = await prisma.notification.count({
    where: { userId: req.userId, isRead: false },
  });

  ApiResponse.paginated(res, { docs, page, limit, total, unreadCount });
});

export const markAsRead = catchAsync(async (req, res) => {
  const { id } = req.params;
  if (!id || id === 'undefined') {
    throw ApiError.badRequest('Notification ID is required');
  }

  const result = await prisma.notification.updateMany({
    where: { id, userId: req.userId },
    data: { isRead: true },
  });

  if (result.count === 0) {
    // Don't throw — just return success silently (notification may already be read or not found)
    return ApiResponse.ok(res, { notification: null }, 'Notification not found or already read');
  }

  const updated = await prisma.notification.findUnique({ where: { id } });
  ApiResponse.ok(res, { notification: updated });
});

export const markAllAsRead = catchAsync(async (req, res) => {
  await prisma.notification.updateMany({
    where: { userId: req.userId, isRead: false },
    data: { isRead: true },
  });
  ApiResponse.ok(res, null, 'All notifications marked as read');
});

export const deleteNotification = catchAsync(async (req, res) => {
  const { id } = req.params;
  if (!id || id === 'undefined') {
    throw ApiError.badRequest('Notification ID is required');
  }
  await prisma.notification.deleteMany({
    where: { id, userId: req.userId },
  });
  ApiResponse.ok(res, null, 'Notification deleted');
});

export const getUnreadCount = catchAsync(async (req, res) => {
  const count = await prisma.notification.count({
    where: { userId: req.userId, isRead: false },
  });
  ApiResponse.ok(res, { count });
});
