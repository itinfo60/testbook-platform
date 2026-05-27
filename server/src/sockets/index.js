import jwt from 'jsonwebtoken';
import config from '../config/index.js';
import logger from '../utils/logger.js';

const onlineUsers = new Map();
let ioInstance = null;

export const getIO = () => ioInstance;

export const initializeSocket = (io) => {
  ioInstance = io;
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

    // ===== LIVE CLASS / WebRTC SIGNALING =====

    // Join a live class room
    socket.on('join_liveclass', ({ liveClassId }) => {
      socket.join(`liveclass:${liveClassId}`);
      socket.to(`liveclass:${liveClassId}`).emit('peer_joined', { userId, socketId: socket.id });
      logger.debug(`User ${userId} joined liveclass:${liveClassId}`);
    });

    socket.on('leave_liveclass', ({ liveClassId }) => {
      socket.leave(`liveclass:${liveClassId}`);
      socket.to(`liveclass:${liveClassId}`).emit('peer_left', { userId, socketId: socket.id });
    });

    // WebRTC: relay offer from one peer to another
    socket.on('webrtc_offer', ({ to, offer, liveClassId }) => {
      io.to(to).emit('webrtc_offer', { from: socket.id, offer, liveClassId });
    });

    // WebRTC: relay answer
    socket.on('webrtc_answer', ({ to, answer }) => {
      io.to(to).emit('webrtc_answer', { from: socket.id, answer });
    });

    // WebRTC: relay ICE candidates
    socket.on('webrtc_ice_candidate', ({ to, candidate }) => {
      io.to(to).emit('webrtc_ice_candidate', { from: socket.id, candidate });
    });

    // Live class chat
    socket.on('liveclass_chat', ({ liveClassId, message }) => {
      io.to(`liveclass:${liveClassId}`).emit('liveclass_chat', {
        userId,
        message,
        timestamp: new Date(),
      });
    });

    // Screen sharing — teacher starts sharing, broadcast to all peers in room
    socket.on('screen_share_start', ({ liveClassId }) => {
      socket.to(`liveclass:${liveClassId}`).emit('screen_share_started', {
        from: socket.id,
        userId,
      });
    });

    // Screen sharing offer (dedicated stream negotiation)
    socket.on('screen_share_offer', ({ to, offer }) => {
      io.to(to).emit('screen_share_offer', { from: socket.id, offer });
    });

    socket.on('screen_share_answer', ({ to, answer }) => {
      io.to(to).emit('screen_share_answer', { from: socket.id, answer });
    });

    socket.on('screen_share_ice', ({ to, candidate }) => {
      io.to(to).emit('screen_share_ice', { from: socket.id, candidate });
    });

    // Teacher stops sharing
    socket.on('screen_share_stop', ({ liveClassId }) => {
      socket.to(`liveclass:${liveClassId}`).emit('screen_share_stopped', { userId });
    });

    // Hand raise
    socket.on('raise_hand', ({ liveClassId }) => {
      socket.to(`liveclass:${liveClassId}`).emit('hand_raised', { userId, socketId: socket.id });
    });

    socket.on('lower_hand', ({ liveClassId }) => {
      socket.to(`liveclass:${liveClassId}`).emit('hand_lowered', { userId, socketId: socket.id });
    });

    // ===== TYPING INDICATOR =====

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

export default {
  initializeSocket,
  sendToUser,
  sendToRole,
  broadcast,
  getOnlineCount,
  isUserOnline,
};
