import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import mongoSanitize from 'express-mongo-sanitize';
import hpp from 'hpp';
import path from 'path';
import { fileURLToPath } from 'url';

import config from './config/index.js';
import logger from './utils/logger.js';
import { globalLimiter } from './middleware/rateLimiter.js';
import { notFoundHandler, errorConverter, errorHandler } from './middleware/errorHandler.js';

// Import routes
import authRoutes from './modules/auth/auth.routes.js';
import courseRoutes from './modules/course/course.routes.js';
import enrollmentRoutes from './modules/enrollment/enrollment.routes.js';
import reviewRoutes from './modules/review/review.routes.js';
import testRoutes from './modules/test/test.routes.js';
import quizRoutes from './modules/quiz/quiz.routes.js';
import adminRoutes from './modules/admin/admin.routes.js';
import categoryRoutes from './modules/exam-category/examCategory.routes.js';
import paymentRoutes from './modules/payment/payment.routes.js';
import couponRoutes from './modules/coupon/coupon.routes.js';
import notificationRoutes from './modules/notification/notification.routes.js';
import wishlistRoutes from './modules/wishlist/wishlist.routes.js';
import discussionRoutes from './modules/discussion/discussion.routes.js';
import noteRoutes from './modules/note/note.routes.js';
import badgeRoutes from './modules/badge/badge.routes.js';
import leaderboardRoutes from './modules/leaderboard/leaderboard.routes.js';
import blogRoutes from './modules/blog/blog.routes.js';


const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();

// Trust Railway's (and any other) reverse proxy so rate limiter sees real client IPs
app.set('trust proxy', 1);

// ===== SECURITY MIDDLEWARE =====
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  contentSecurityPolicy: false,
}));

app.use(cors({
  origin: [config.clientUrl, config.adminUrl, 'http://localhost:5173', 'http://localhost:5174'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  maxAge: 86400,
}));

app.use(mongoSanitize()); // Prevent NoSQL injection
app.use(hpp()); // Prevent HTTP Parameter Pollution

// ===== PARSING MIDDLEWARE =====
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());
app.use(compression());

// ===== LOGGING =====
if (config.env !== 'test') {
  app.use(morgan('combined', {
    stream: { write: (message) => logger.http(message.trim()) },
    skip: (req) => req.url === '/health',
  }));
}

// ===== RATE LIMITING =====
if (config.env === 'production') {
  app.use('/api/', globalLimiter);
}

// ===== STATIC FILES =====
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// ===== HEALTH CHECK =====
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: config.env,
    version: process.env.npm_package_version || '2.0.0',
    memory: {
      used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + 'MB',
      total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024) + 'MB',
    },
  });
});

// ===== API ROUTES =====
const API_PREFIX = '/api/v1';

app.use(`${API_PREFIX}/auth`, authRoutes);
app.use(`${API_PREFIX}/courses`, courseRoutes);
app.use(`${API_PREFIX}/enrollments`, enrollmentRoutes);
app.use(`${API_PREFIX}/reviews`, reviewRoutes);
app.use(`${API_PREFIX}/tests`, testRoutes);
app.use(`${API_PREFIX}/quizzes`, quizRoutes);
app.use(`${API_PREFIX}/admin`, adminRoutes);
app.use(`${API_PREFIX}/categories`, categoryRoutes);
app.use(`${API_PREFIX}/payments`, paymentRoutes);
app.use(`${API_PREFIX}/coupons`, couponRoutes);
app.use(`${API_PREFIX}/notifications`, notificationRoutes);
app.use(`${API_PREFIX}/wishlist`, wishlistRoutes);
app.use(`${API_PREFIX}/discussions`, discussionRoutes);
app.use(`${API_PREFIX}/notes`, noteRoutes);
app.use(`${API_PREFIX}/badges`, badgeRoutes);
app.use(`${API_PREFIX}/leaderboard`, leaderboardRoutes);
app.use(`${API_PREFIX}/blogs`, blogRoutes);


// ===== API DOCS =====
app.get(`${API_PREFIX}`, (req, res) => {
  res.json({
    success: true,
    message: 'TestBook API v1',
    version: '2.0.0',
    docs: `${API_PREFIX}/docs`,
    endpoints: {
      auth: `${API_PREFIX}/auth`,
      courses: `${API_PREFIX}/courses`,
      enrollments: `${API_PREFIX}/enrollments`,
      reviews: `${API_PREFIX}/reviews`,
      tests: `${API_PREFIX}/tests`,
      quizzes: `${API_PREFIX}/quizzes`,
      admin: `${API_PREFIX}/admin`,
      categories: `${API_PREFIX}/categories`,
      payments: `${API_PREFIX}/payments`,
      coupons: `${API_PREFIX}/coupons`,
      notifications: `${API_PREFIX}/notifications`,
      wishlist: `${API_PREFIX}/wishlist`,
      discussions: `${API_PREFIX}/discussions`,
      notes: `${API_PREFIX}/notes`,
      badges: `${API_PREFIX}/badges`,
      leaderboard: `${API_PREFIX}/leaderboard`,
      blogs: `${API_PREFIX}/blogs`,
    },
  });
});

// ===== SERVE FRONTEND IN PRODUCTION =====
if (config.env === 'production') {
  const clientDist = path.join(__dirname, '../../client/dist');
  app.use(express.static(clientDist));
  // Any non-API route serves the React app
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api/') || req.path === '/health') return next();
    res.sendFile(path.join(clientDist, 'index.html'));
  });
} else {
  app.get('/', (req, res) => {
    res.status(200).json({
      success: true,
      message: '🚀 TestBook API Server v2.0.0',
      status: 'running',
      environment: config.env,
      endpoints: { api: '/api/v1', health: '/health' },
      timestamp: new Date().toISOString(),
    });
  });
}

// ===== ERROR HANDLING =====
app.use(notFoundHandler);
app.use(errorConverter);
app.use(errorHandler);

export default app;
