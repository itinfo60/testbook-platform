import jwt from 'jsonwebtoken';
import config from '../config/index.js';
import logger from '../utils/logger.js';

const onlineUsers = new Map();

export const initializeSocket = (io) => {
  // Auth middleware
  io.use((socket, next) => {
    const token = socket.handshake.auth.token || socket.handshake.query.token;
    if (!token) return next(new Error('Authentication required'));

    try {
      const decoded = jwt.verify(token, config.jwt.secret);
      socket.userId = decoded.id;
      socket.userRole = decoded.role;
      next();
    } catch {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    const userId = socket.userId;
    logger.debug(`Socket connected: ${userId}`);

    // Track online user
    if (!onlineUsers.has(userId)) {
      onlineUsers.set(userId, {
        sockets: new Set([socket.id]),
        role: socket.userRole,
        connectedAt: new Date(),
      });
    } else {
      onlineUsers.get(userId).sockets.add(socket.id);
    }

    // Join user's personal room
    socket.join(`user:${userId}`);

    // Join role-based room
    socket.join(`role:${socket.userRole}`);

    // Broadcast online count to admins
    io.to('role:admin').to('role:super_admin').emit('online_users_count', onlineUsers.size);

    // === Event Handlers ===

    // Join course room (for discussions)
    socket.on('join_course', (courseId) => {
      socket.join(`course:${courseId}`);
      logger.debug(`User ${userId} joined course:${courseId}`);
    });

    // Leave course room
    socket.on('leave_course', (courseId) => {
      socket.leave(`course:${courseId}`);
    });

    // New discussion message
    socket.on('new_discussion', (data) => {
      io.to(`course:${data.courseId}`).emit('discussion_update', {
        type: 'new_message',
        ...data,
        userId,
        timestamp: new Date(),
      });
    });

    // Discussion reply
    socket.on('discussion_reply', (data) => {
      io.to(`course:${data.courseId}`).emit('discussion_update', {
        type: 'new_reply',
        ...data,
        userId,
        timestamp: new Date(),
      });
    });

    // Typing indicator
    socket.on('typing', (data) => {
      socket.to(`course:${data.courseId}`).emit('user_typing', {
        userId,
        courseId: data.courseId,
      });
    });

    // Stop typing
    socket.on('stop_typing', (data) => {
      socket.to(`course:${data.courseId}`).emit('user_stop_typing', {
        userId,
        courseId: data.courseId,
      });
    });

    // Disconnect
    socket.on('disconnect', (reason) => {
      logger.debug(`Socket disconnected: ${userId} (${reason})`);
      const userEntry = onlineUsers.get(userId);
      if (userEntry) {
        userEntry.sockets.delete(socket.id);
        if (userEntry.sockets.size === 0) {
          onlineUsers.delete(userId);
        }
      }
      io.to('role:admin').to('role:super_admin').emit('online_users_count', onlineUsers.size);
    });

    // Error handling
    socket.on('error', (err) => {
      logger.error(`Socket error for ${userId}:`, err.message);
    });
  });

  logger.info('🔌 Socket.IO initialized');
};

// Utility: Send notification to specific user
export const sendToUser = (io, userId, event, data) => {
  io.to(`user:${userId}`).emit(event, data);
};

// Utility: Send to all users with a role
export const sendToRole = (io, role, event, data) => {
  io.to(`role:${role}`).emit(event, data);
};

// Utility: Broadcast to everyone
export const broadcast = (io, event, data) => {
  io.emit(event, data);
};

// Utility: Get online users count
export const getOnlineCount = () => onlineUsers.size;

// Utility: Check if user is online
export const isUserOnline = (userId) => onlineUsers.has(userId);

export default { initializeSocket, sendToUser, sendToRole, broadcast, getOnlineCount, isUserOnline };
