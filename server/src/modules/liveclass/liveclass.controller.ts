import crypto from 'crypto';
import { AccessToken } from 'livekit-server-sdk';
import ApiResponse from '../../utils/ApiResponse.js';
import ApiError from '../../utils/ApiError.js';
import catchAsync from '../../utils/catchAsync.js';
import config from '../../config/index.js';
import { notificationQueue, reminderQueue } from '../../queues/index.js';
import prisma from '../../config/prisma.js';
import { runTransitions } from '../../workers/liveclass.cron.js';

export const createLiveClass = catchAsync(async (req, res) => {
  const {
    title,
    description,
    scheduledAt,
    durationMinutes,
    duration,
    courseId,
    password,
    teacherName,
    teacherId: overrideTeacherId,
  } = req.body;
  const isAdmin = req.user?.role === 'admin' || req.user?.role === 'super_admin';
  const roomId = crypto.randomBytes(12).toString('hex');

  // Admin can assign a different teacher; otherwise default to the requesting user
  const resolvedTeacherId = isAdmin && overrideTeacherId ? overrideTeacherId : req.userId;

  const liveClass = await prisma.liveClass.create({
    data: {
      title,
      description: description || '',
      teacherId: resolvedTeacherId,
      teacherName: teacherName || null,
      password: password || null,
      scheduledAt: new Date(scheduledAt),
      duration: Number(durationMinutes || duration || 60),
      roomId,
      status: 'scheduled',
      course: courseId || null,
      tenantId: req.tenantId || null,
    },
  });

  ApiResponse.created(res, { liveClass }, 'Live class created');
});

export const getMyLiveClasses = catchAsync(async (req, res) => {
  await runTransitions().catch(() => {});
  const classes = await prisma.liveClass.findMany({
    where: { teacherId: req.userId },
    orderBy: { scheduledAt: 'desc' },
  });
  ApiResponse.ok(res, { classes });
});

export const updateLiveClass = catchAsync(async (req, res) => {
  const isAdmin = req.user?.role === 'admin' || req.user?.role === 'super_admin';
  const where: any = { id: req.params.id };
  if (!isAdmin) where.teacherId = req.userId;

  const liveClass = await prisma.liveClass.findFirst({ where });
  if (!liveClass) throw ApiError.notFound('Live class not found');

  const {
    title,
    description,
    scheduledAt,
    durationMinutes,
    duration,
    status,
    password,
    teacherName,
    teacherId: overrideTeacherId,
  } = req.body;
  const updateData: any = {};
  if (title) updateData.title = title;
  if (description !== undefined) updateData.description = description;
  if (scheduledAt) updateData.scheduledAt = new Date(scheduledAt);
  if (durationMinutes || duration) updateData.duration = Number(durationMinutes || duration);
  if (status) updateData.status = status;
  if (password !== undefined) updateData.password = password || null;
  if (teacherName !== undefined) updateData.teacherName = teacherName || null;
  if (isAdmin && overrideTeacherId) updateData.teacherId = overrideTeacherId;

  const updated = await prisma.liveClass.update({
    where: { id: liveClass.id },
    data: updateData,
  });
  ApiResponse.ok(res, { liveClass: updated }, 'Live class updated');
});

export const cancelLiveClass = catchAsync(async (req, res) => {
  const isAdmin = req.user?.role === 'admin' || req.user?.role === 'super_admin';
  const where: any = { id: req.params.id };
  if (!isAdmin) where.teacherId = req.userId;

  const liveClass = await prisma.liveClass.findFirst({ where });
  if (!liveClass) throw ApiError.notFound('Live class not found');

  const updated = await prisma.liveClass.update({
    where: { id: liveClass.id },
    data: { status: 'cancelled' },
  });

  const io = req.app.get('io');
  if (io) {
    io.to(`liveclass:${updated.id}`).emit('live_class_ended', { liveClassId: updated.id });
    io.emit('live_class_status_changed', { liveClassId: updated.id, status: 'cancelled' });
  }

  ApiResponse.ok(res, { liveClass: updated }, 'Live class cancelled');
});

export const deleteLiveClass = catchAsync(async (req, res) => {
  const liveClass = await prisma.liveClass.findUnique({ where: { id: req.params.id } });
  if (!liveClass) throw ApiError.notFound('Live class not found');
  await prisma.liveClass.delete({ where: { id: liveClass.id } });
  ApiResponse.ok(res, null, 'Live class deleted');
});

export const startLiveClass = catchAsync(async (req, res) => {
  const isAdmin = req.user?.role === 'admin' || req.user?.role === 'super_admin';
  const where: any = { id: req.params.id };
  if (!isAdmin) where.teacherId = req.userId;

  const liveClass = await prisma.liveClass.findFirst({ where });
  if (!liveClass) throw ApiError.notFound('Live class not found');
  if (liveClass.status === 'ended' || liveClass.status === 'cancelled') {
    throw ApiError.badRequest('Class has already ended or was cancelled');
  }

  const updated = await prisma.liveClass.update({
    where: { id: liveClass.id },
    data: { status: 'live' },
  });

  const io = req.app.get('io');
  if (io) {
    io.to(`liveclass:${updated.id}`).emit('live_class_started', {
      liveClassId: updated.id,
      title: updated.title,
      roomId: updated.roomId,
    });
    io.emit('live_class_status_changed', { liveClassId: updated.id, status: 'live' });
  }

  ApiResponse.ok(res, { liveClass: updated, roomId: updated.roomId }, 'Live class started');
});

export const endLiveClass = catchAsync(async (req, res) => {
  const isAdmin = req.user?.role === 'admin' || req.user?.role === 'super_admin';
  const where: any = { id: req.params.id };
  if (!isAdmin) where.teacherId = req.userId;

  const liveClass = await prisma.liveClass.findFirst({ where });
  if (!liveClass) throw ApiError.notFound('Live class not found');

  const updated = await prisma.liveClass.update({
    where: { id: liveClass.id },
    data: { status: 'ended' },
  });

  const io = req.app.get('io');
  if (io) {
    io.to(`liveclass:${updated.id}`).emit('live_class_ended', { liveClassId: updated.id });
    io.emit('live_class_status_changed', { liveClassId: updated.id, status: 'ended' });
  }

  ApiResponse.ok(res, { liveClass: updated }, 'Live class ended');
});

export const adminGetAllClasses = catchAsync(async (req, res) => {
  await runTransitions().catch(() => {});
  const { status, page = 1, limit = 20 } = req.query;
  const where = status ? { status } : {};
  const skip = (Number(page) - 1) * Number(limit);

  const [classes, total] = await Promise.all([
    prisma.liveClass.findMany({
      where,
      orderBy: { scheduledAt: 'desc' },
      skip,
      take: Number(limit),
    }),
    prisma.liveClass.count({ where }),
  ]);

  ApiResponse.ok(res, {
    classes,
    total,
    page: Number(page),
    pages: Math.ceil(total / Number(limit)),
  });
});

export const getUpcomingClasses = catchAsync(async (req, res) => {
  await runTransitions().catch(() => {});
  const { courseId } = req.query;

  const where: any = {
    status: { in: ['live', 'scheduled'] },
  };
  if (courseId) where.course = courseId;

  const classes = await prisma.liveClass.findMany({
    where,
    orderBy: { scheduledAt: 'asc' },
    take: 30,
  });

  ApiResponse.ok(res, { classes });
});

export const joinLiveClass = catchAsync(async (req, res) => {
  await runTransitions().catch(() => {});
  const liveClass = await prisma.liveClass.findUnique({ where: { id: req.params.id } });
  if (!liveClass) throw ApiError.notFound('Live class not found');
  if (liveClass.status === 'ended') throw ApiError.badRequest('This class has already ended');
  if (liveClass.status === 'cancelled') throw ApiError.badRequest('This class was cancelled');

  const isTeacherOrAdmin =
    liveClass.teacherId === req.userId ||
    req.user?.role === 'admin' ||
    req.user?.role === 'super_admin';
  if (liveClass.status === 'scheduled' && !isTeacherOrAdmin) {
    const scheduledAt = new Date(liveClass.scheduledAt);
    const formatted = scheduledAt.toLocaleString('en-IN', {
      timeZone: 'Asia/Kolkata',
      dateStyle: 'medium',
      timeStyle: 'short',
    });
    throw ApiError.badRequest(`Class hasn't started yet. It is scheduled for ${formatted}`);
  }

  const attendance: any[] = Array.isArray(liveClass.attendance) ? liveClass.attendance : [];
  const existing = attendance.find((a) => a.user === req.userId);
  let updatedLiveClass = liveClass;
  if (!existing) {
    attendance.push({ user: req.userId, joinedAt: new Date() });
    updatedLiveClass = await prisma.liveClass.update({
      where: { id: liveClass.id },
      data: { attendance },
    });
  }

  const io = req.app.get('io');
  if (io) {
    io.to(`liveclass:${liveClass.id}`).emit('participant_joined', {
      userId: req.userId,
      liveClassId: liveClass.id,
    });
  }

  ApiResponse.ok(
    res,
    { roomId: liveClass.roomId, liveClass: updatedLiveClass },
    'Joined live class'
  );
});

export const getLiveClassById = catchAsync(async (req, res) => {
  await runTransitions().catch(() => {});
  const liveClass = await prisma.liveClass.findUnique({
    where: { id: req.params.id },
  });
  if (!liveClass) throw ApiError.notFound('Live class not found');
  ApiResponse.ok(res, { liveClass });
});

export const getLiveKitToken = catchAsync(async (req, res) => {
  await runTransitions().catch(() => {});
  const { apiKey, apiSecret, url: livekitUrl } = config.livekit;
  if (!apiKey || !apiSecret)
    throw ApiError.serviceUnavailable('Live class video is not configured.');

  const liveClass = await prisma.liveClass.findUnique({ where: { id: req.params.id } });
  if (!liveClass) throw ApiError.notFound('Live class not found');
  if (liveClass.status === 'ended') throw ApiError.badRequest('This class has already ended');
  if (liveClass.status === 'cancelled') throw ApiError.badRequest('This class was cancelled');

  const isTeacherOrAdmin =
    liveClass.teacherId === req.userId ||
    req.user?.role === 'admin' ||
    req.user?.role === 'super_admin';

  if (liveClass.status === 'scheduled') {
    if (isTeacherOrAdmin) {
      // Auto-start class if teacher/admin is requesting token to enter room
      await prisma.liveClass.update({
        where: { id: liveClass.id },
        data: { status: 'live' },
      });
      const io = req.app.get('io');
      if (io) {
        io.to(`liveclass:${liveClass.id}`).emit('live_class_started', {
          liveClassId: liveClass.id,
          title: liveClass.title,
          roomId: liveClass.roomId,
        });
        io.emit('live_class_status_changed', { liveClassId: liveClass.id, status: 'live' });
      }
    } else {
      const scheduledAt = new Date(liveClass.scheduledAt);
      const formatted = scheduledAt.toLocaleString('en-IN', {
        timeZone: 'Asia/Kolkata',
        dateStyle: 'medium',
        timeStyle: 'short',
      });
      throw ApiError.badRequest(`Class hasn't started yet. It is scheduled for ${formatted}`);
    }
  }

  const user = await prisma.user.findUnique({
    where: { id: req.userId },
    select: { name: true, role: true },
  });
  if (!user) throw ApiError.unauthorized();

  const isTeacher = isTeacherOrAdmin;
  const roomName = liveClass.roomId;
  const participantName = user.name;

  const token = new AccessToken(apiKey, apiSecret, {
    identity: req.userId,
    name: participantName,
    ttl: '4h',
  });
  token.addGrant({
    roomJoin: true,
    room: roomName,
    canPublish: true,
    canSubscribe: true,
    canPublishData: true,
    roomAdmin: isTeacher,
  });

  const attendance: any[] = Array.isArray(liveClass.attendance) ? liveClass.attendance : [];
  const existing = attendance.find((a) => a.user === req.userId);
  if (!existing) {
    attendance.push({ user: req.userId, joinedAt: new Date() });
    await prisma.liveClass.update({ where: { id: liveClass.id }, data: { attendance } });
  }

  ApiResponse.ok(
    res,
    {
      token: await token.toJwt(),
      roomName,
      livekitUrl: livekitUrl || 'wss://your-livekit-server.com',
      isTeacher,
      participantName,
    },
    'Token generated'
  );
});
