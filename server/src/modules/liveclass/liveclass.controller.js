import crypto from 'crypto';
import { AccessToken } from 'livekit-server-sdk';
import LiveClass from './liveclass.model.js';
import ApiError from '../../utils/ApiError.js';
import ApiResponse from '../../utils/ApiResponse.js';
import catchAsync from '../../utils/catchAsync.js';
import config from '../../config/index.js';
import { notificationQueue, reminderQueue } from '../../queues/index.js';
import User from '../user/user.model.ts';

// ===== TEACHER =====

export const createLiveClass = catchAsync(async (req, res) => {
  const {
    title,
    description,
    scheduledAt,
    durationMinutes,
    courseId,
    maxParticipants,
    isRecorded,
    chatEnabled,
  } = req.body;

  const roomId = crypto.randomBytes(12).toString('hex');

  const liveClass = await LiveClass.create({
    title,
    description,
    teacher: req.userId,
    course: courseId,
    scheduledAt: new Date(scheduledAt),
    durationMinutes: durationMinutes || 60,
    roomId,
    maxParticipants: maxParticipants || 200,
    isRecorded: isRecorded || false,
    chatEnabled: chatEnabled !== false,
  });

  // Notify enrolled students (if course linked)
  if (courseId) {
    await notificationQueue.add('send', {
      type: 'live_class_scheduled',
      userId: req.userId,
      tenantId: req.tenantId,
      title: 'Live Class Scheduled',
      message: `"${title}" is scheduled for ${new Date(scheduledAt).toLocaleString()}`,
      data: { liveClassId: liveClass._id, courseId },
    });

    // Schedule 15-minute reminder before the class starts
    const classStart = new Date(scheduledAt).getTime();
    const reminderAt = classStart - 15 * 60 * 1000;
    const delayMs = reminderAt - Date.now();
    if (delayMs > 0) {
      await reminderQueue.add(
        'liveclass',
        {
          type: 'liveclass',
          liveClassId: liveClass._id,
          courseId,
          title,
          scheduledAt,
          tenantId: req.tenantId,
        },
        { delay: delayMs, jobId: `reminder_liveclass_${liveClass._id}` }
      );
    }
  }

  ApiResponse.created(res, { liveClass }, 'Live class created');
});

export const getMyLiveClasses = catchAsync(async (req, res) => {
  const classes = await LiveClass.find({ teacher: req.userId })
    .populate('course', 'title thumbnail')
    .sort('-scheduledAt')
    .lean();

  ApiResponse.ok(res, { classes });
});

export const updateLiveClass = catchAsync(async (req, res) => {
  const liveClass = await LiveClass.findOne({ _id: req.params.id, teacher: req.userId });
  if (!liveClass) throw ApiError.notFound('Live class not found');
  if (liveClass.status === 'live' || liveClass.status === 'ended') {
    throw ApiError.badRequest('Cannot update a class that has started or ended');
  }

  Object.assign(liveClass, req.body);
  await liveClass.save();

  ApiResponse.ok(res, { liveClass }, 'Live class updated');
});

export const startLiveClass = catchAsync(async (req, res) => {
  const liveClass = await LiveClass.findOne({ _id: req.params.id, teacher: req.userId });
  if (!liveClass) throw ApiError.notFound('Live class not found');
  if (liveClass.status !== 'scheduled') throw ApiError.badRequest('Class already started or ended');

  liveClass.status = 'live';
  liveClass.startedAt = new Date();
  await liveClass.save();

  // Emit live class started event via Socket.IO (app.get('io'))
  const io = req.app.get('io');
  if (io) {
    io.to(`course:${liveClass.course}`).emit('live_class_started', {
      liveClassId: liveClass._id,
      title: liveClass.title,
      roomId: liveClass.roomId,
    });
  }

  ApiResponse.ok(res, { liveClass, roomId: liveClass.roomId }, 'Live class started');
});

export const endLiveClass = catchAsync(async (req, res) => {
  const liveClass = await LiveClass.findOne({ _id: req.params.id, teacher: req.userId });
  if (!liveClass) throw ApiError.notFound('Live class not found');
  if (liveClass.status !== 'live') throw ApiError.badRequest('Class is not live');

  liveClass.status = 'ended';
  liveClass.endedAt = new Date();
  if (req.body.recordingUrl) liveClass.recordingUrl = req.body.recordingUrl;
  await liveClass.save();

  const io = req.app.get('io');
  if (io) {
    io.to(`liveclass:${liveClass._id}`).emit('live_class_ended', { liveClassId: liveClass._id });
  }

  ApiResponse.ok(res, { liveClass }, 'Live class ended');
});

// ===== ADMIN =====

export const adminGetAllClasses = catchAsync(async (req, res) => {
  const { status, page = 1, limit = 20 } = req.query;
  const filter = status ? { status } : {};
  const skip = (Number(page) - 1) * Number(limit);

  const [classes, total] = await Promise.all([
    LiveClass.find(filter)
      .populate('teacher', 'name avatar')
      .populate('course', 'title thumbnail')
      .sort('-scheduledAt')
      .skip(skip)
      .limit(Number(limit))
      .lean(),
    LiveClass.countDocuments(filter),
  ]);

  ApiResponse.ok(res, {
    classes,
    total,
    page: Number(page),
    pages: Math.ceil(total / Number(limit)),
  });
});

// ===== STUDENT =====

export const getUpcomingClasses = catchAsync(async (req, res) => {
  const { courseId } = req.query;
  const now = new Date();
  // Show classes that are live (regardless of scheduledAt) OR scheduled in the future
  const filter = {
    $or: [{ status: 'live' }, { status: 'scheduled', scheduledAt: { $gte: now } }],
  };
  if (courseId) filter.course = courseId;

  const classes = await LiveClass.find(filter)
    .populate('teacher', 'name avatar')
    .populate('course', 'title thumbnail')
    .sort('scheduledAt')
    .limit(20)
    .lean();

  ApiResponse.ok(res, { classes });
});

export const joinLiveClass = catchAsync(async (req, res) => {
  const liveClass = await LiveClass.findById(req.params.id);
  if (!liveClass) throw ApiError.notFound('Live class not found');
  if (liveClass.status === 'ended') throw ApiError.badRequest('This class has ended');
  if (liveClass.status === 'cancelled') throw ApiError.badRequest('This class was cancelled');

  // Track attendance
  const existing = liveClass.attendance.find((a) => a.user.toString() === req.userId);
  if (!existing) {
    liveClass.attendance.push({ user: req.userId, joinedAt: new Date() });
    await liveClass.save();
  }

  // Emit join event
  const io = req.app.get('io');
  if (io) {
    io.to(`liveclass:${liveClass._id}`).emit('participant_joined', {
      userId: req.userId,
      liveClassId: liveClass._id,
    });
  }

  ApiResponse.ok(res, { roomId: liveClass.roomId, liveClass }, 'Joined live class');
});

export const getLiveClassById = catchAsync(async (req, res) => {
  const liveClass = await LiveClass.findById(req.params.id)
    .populate('teacher', 'name avatar')
    .populate('course', 'title thumbnail');

  if (!liveClass) throw ApiError.notFound('Live class not found');

  ApiResponse.ok(res, { liveClass });
});

export const getLiveKitToken = catchAsync(async (req, res) => {
  const { apiKey, apiSecret, url: livekitUrl } = config.livekit;

  if (!apiKey || !apiSecret) {
    throw ApiError.serviceUnavailable(
      'Live class video is not configured. Please contact support.'
    );
  }

  const liveClass = await LiveClass.findById(req.params.id);
  if (!liveClass) throw ApiError.notFound('Live class not found');
  if (liveClass.status === 'ended') throw ApiError.badRequest('This class has ended');
  if (liveClass.status === 'cancelled') throw ApiError.badRequest('This class was cancelled');

  const user = await User.findById(req.userId).select('name role').lean();
  if (!user) throw ApiError.unauthorized();

  const isTeacher = liveClass.teacher.toString() === req.userId;
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

  // Record attendance
  const existing = liveClass.attendance.find((a) => a.user.toString() === req.userId);
  if (!existing) {
    liveClass.attendance.push({ user: req.userId, joinedAt: new Date() });
    await liveClass.save();
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
