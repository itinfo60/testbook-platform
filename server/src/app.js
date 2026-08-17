import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import mongoSanitize from 'express-mongo-sanitize';
import hpp from 'hpp';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import { createBullBoard } from '@bull-board/api';
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';
import { ExpressAdapter } from '@bull-board/express';

import config from './config/index.js';
import logger from './utils/logger.js';
import { globalLimiter } from './middleware/rateLimiter.js';
import { notFoundHandler, errorConverter, errorHandler } from './middleware/errorHandler.js';
import {
  tenantIdentification,
  requireTenant,
  optionalTenant,
} from './middleware/tenant.middleware.js';
import passport from './config/passport.js';
import {
  transactionalEmailQueue,
  bulkEmailQueue,
  notificationQueue,
  certificateQueue,
  dripQueue,
  reminderQueue,
  analyticsQueue,
  dunningQueue,
} from './queues/index.js';

// Import routes
import authRoutes from './modules/auth/auth.routes.js';
import courseRoutes from './modules/course/course.routes.js';
import enrollmentRoutes from './modules/enrollment/enrollment.routes.js';
import reviewRoutes from './modules/review/review.routes.js';
import testRoutes from './modules/test/test.routes.js';
import testSeriesRoutes from './modules/test-series/testSeries.routes.js';
import quizRoutes from './modules/quiz/quiz.routes.js';
import adminRoutes from './modules/admin/admin.routes.js';
import userRoutes from './modules/user/user.routes.js';
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
import instituteRoutes from './modules/institute/institute.routes.js';
import subscriptionRoutes from './modules/subscription/subscription.routes.js';
import aiRoutes from './modules/ai/ai.routes.js';
import aiQuizRoutes from './modules/aiQuiz/aiQuiz.routes.js';
import liveClassRoutes from './modules/liveclass/liveclass.routes.js';
import auditRoutes from './modules/audit/audit.routes.js';
import gdprRoutes from './modules/gdpr/gdpr.routes.js';
import apiKeyRoutes from './modules/apikey/apikey.routes.js';
import uploadRoutes from './modules/upload/upload.routes.js';
import libraryRoutes from './modules/library/library.routes.js';
import affiliateRoutes from './modules/affiliate/affiliate.routes.js';
import parentRoutes from './modules/parent/parent.routes.js';
import attendanceRoutes from './modules/attendance/attendance.routes.js';
import searchRoutes from './modules/search/search.routes.js';
import settingsRoutes from './modules/admin/settings.routes.js';
import supportRoutes from './modules/support/support.routes.js';
import { auditLog } from './middleware/auditLog.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();

// Trust Railway's (and any other) reverse proxy so rate limiter sees real client IPs
app.set('trust proxy', 1);

// ===== REQUEST ID =====
app.use((req, _res, next) => {
  req.id = req.headers['x-request-id'] || crypto.randomUUID();
  next();
});

// ===== BULL BOARD (Queue Monitor) =====
const serverAdapter = new ExpressAdapter();
serverAdapter.setBasePath('/admin/queues');
if (process.env.NODE_ENV !== 'test') {
  createBullBoard({
    queues: [
      new BullMQAdapter(transactionalEmailQueue),
      new BullMQAdapter(bulkEmailQueue),
      new BullMQAdapter(notificationQueue),
      new BullMQAdapter(certificateQueue),
      new BullMQAdapter(dripQueue),
      new BullMQAdapter(reminderQueue),
      new BullMQAdapter(analyticsQueue),
      new BullMQAdapter(dunningQueue),
    ],
    serverAdapter,
  });
}
// Protected by basic auth in production
app.use(
  '/admin/queues',
  (req, res, next) => {
    if (config.env !== 'production') return next();
    const auth = req.headers.authorization;
    if (!auth || !auth.startsWith('Basic ')) {
      res.set('WWW-Authenticate', 'Basic realm="Queue Monitor"');
      return res.status(401).send('Authentication required');
    }
    const [, b64] = auth.split(' ');
    const [user, pass] = Buffer.from(b64, 'base64').toString().split(':');
    if (
      user !== (process.env.QUEUE_ADMIN_USER || 'admin') ||
      pass !== process.env.QUEUE_ADMIN_PASS
    ) {
      return res.status(403).send('Forbidden');
    }
    next();
  },
  serverAdapter.getRouter()
);

// ===== TENANT ISOLATION =====
app.use(tenantIdentification);

// ===== SECURITY MIDDLEWARE =====
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    contentSecurityPolicy: false,
  })
);

app.use(
  cors({
    origin: [
      config.clientUrl,
      config.adminUrl,
      process.env.PLATFORM_URL || 'http://localhost:5175',
      'http://localhost:5173',
      'http://localhost:5174',
      'http://localhost:8080',
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-Requested-With',
      'X-Tenant-Id',
      'X-Tenant-Subdomain',
    ],
    maxAge: 86400,
  })
);

app.use(mongoSanitize()); // Prevent NoSQL injection
app.use(hpp()); // Prevent HTTP Parameter Pollution

// ===== PARSING MIDDLEWARE =====
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());
app.use(compression());
app.use(passport.initialize());

// ===== LOGGING =====
if (config.env !== 'test') {
  app.use(
    morgan('combined', {
      stream: { write: (message) => logger.http(message.trim()) },
      skip: (req) => req.url === '/health',
    })
  );
}

// ===== RATE LIMITING =====
// Apply in all environments (not test, to avoid slowing tests)
if (config.env !== 'test') {
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
// Public browse routes — work with or without a tenant (catalog view, landing pages)
app.use(`${API_PREFIX}/courses`, optionalTenant, courseRoutes);
app.use(`${API_PREFIX}/categories`, optionalTenant, categoryRoutes);
app.use(`${API_PREFIX}/tests`, optionalTenant, testRoutes); // public test listing
app.use(`${API_PREFIX}/test-series`, optionalTenant, testSeriesRoutes); // public test series catalog
app.use(`${API_PREFIX}/reviews`, optionalTenant, reviewRoutes); // public review listing
app.use(`${API_PREFIX}/blogs`, optionalTenant, blogRoutes); // public blog listing
app.use(`${API_PREFIX}/badges`, optionalTenant, badgeRoutes); // public badge catalog
app.use(`${API_PREFIX}/leaderboard`, optionalTenant, leaderboardRoutes);
app.use(`${API_PREFIX}/settings`, optionalTenant, settingsRoutes);

// Private routes — require a resolved tenant
app.use(`${API_PREFIX}/enrollments`, requireTenant, enrollmentRoutes);
app.use(`${API_PREFIX}/quizzes`, requireTenant, quizRoutes);
app.use(`${API_PREFIX}/admin/users`, userRoutes);
app.use(`${API_PREFIX}/admin`, adminRoutes);
app.use(`${API_PREFIX}/payments`, requireTenant, paymentRoutes);
app.use(`${API_PREFIX}/coupons`, requireTenant, couponRoutes);
app.use(`${API_PREFIX}/notifications`, requireTenant, notificationRoutes);
app.use(`${API_PREFIX}/wishlist`, requireTenant, wishlistRoutes);
app.use(`${API_PREFIX}/discussions`, requireTenant, discussionRoutes);
app.use(`${API_PREFIX}/notes`, requireTenant, noteRoutes);
app.use(`${API_PREFIX}/institutes`, instituteRoutes);
app.use(`${API_PREFIX}/subscriptions`, subscriptionRoutes);
app.use(`${API_PREFIX}/ai`, requireTenant, aiRoutes);
app.use(`${API_PREFIX}/ai-quiz`, requireTenant, aiQuizRoutes);
app.use(`${API_PREFIX}/live-classes`, requireTenant, liveClassRoutes);
app.use(`${API_PREFIX}/audit-logs`, requireTenant, auditRoutes);
app.use(`${API_PREFIX}/gdpr`, requireTenant, gdprRoutes);
app.use(`${API_PREFIX}/api-keys`, requireTenant, apiKeyRoutes);
app.use(`${API_PREFIX}/library`, optionalTenant, libraryRoutes);
app.use(`${API_PREFIX}/affiliate`, requireTenant, affiliateRoutes);
app.use(`${API_PREFIX}/parent`, requireTenant, parentRoutes);
app.use(`${API_PREFIX}/attendance`, requireTenant, attendanceRoutes);
app.use(`${API_PREFIX}/uploads`, requireTenant, uploadRoutes);
app.use(`${API_PREFIX}/search`, optionalTenant, searchRoutes);
app.use(`${API_PREFIX}/support`, optionalTenant, supportRoutes);

// ===== AUDIT LOG =====
app.use(`${API_PREFIX}`, auditLog);

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

// Dynamic Sitemap
app.get('/sitemap.xml', async (req, res) => {
  try {
    const BASE_URL = process.env.CLIENT_URL || 'https://edurportal.in';
    // Import models dynamically to avoid circular deps
    const Course = require('./models/course.model').default || require('./models/course.model');
    const Blog = require('./models/blog.model').default || require('./models/blog.model');
    const ExamCategory =
      require('./models/examCategory.model').default || require('./models/examCategory.model');

    const [courses, blogs, exams] = await Promise.all([
      Course.find({ isPublished: true })
        .select('_id updatedAt')
        .lean()
        .limit(200)
        .catch(() => []),
      Blog.find({ status: 'published' })
        .select('slug updatedAt')
        .lean()
        .limit(200)
        .catch(() => []),
      ExamCategory.find({ isActive: true })
        .select('slug updatedAt')
        .lean()
        .limit(50)
        .catch(() => []),
    ]);

    const staticUrls = [
      { loc: '/', priority: '1.0', changefreq: 'daily' },
      { loc: '/exams', priority: '0.9', changefreq: 'weekly' },
      { loc: '/courses', priority: '0.9', changefreq: 'weekly' },
      { loc: '/test-series', priority: '0.9', changefreq: 'weekly' },
      { loc: '/free-resources', priority: '0.8', changefreq: 'weekly' },
      { loc: '/blog', priority: '0.8', changefreq: 'daily' },
      { loc: '/jobs', priority: '0.8', changefreq: 'daily' },
      { loc: '/daily-quiz', priority: '0.7', changefreq: 'daily' },
      { loc: '/faculty', priority: '0.6', changefreq: 'monthly' },
      { loc: '/about', priority: '0.5', changefreq: 'monthly' },
      { loc: '/success-stories', priority: '0.5', changefreq: 'monthly' },
      { loc: '/leaderboard', priority: '0.6', changefreq: 'weekly' },
    ];

    const toUrl = ({ loc, priority = '0.5', changefreq = 'weekly', lastmod }) =>
      `<url><loc>${BASE_URL}${loc}</loc>${lastmod ? `<lastmod>${new Date(lastmod).toISOString().split('T')[0]}</lastmod>` : ''}<changefreq>${changefreq}</changefreq><priority>${priority}</priority></url>`;

    const xml = [
      '<?xml version="1.0" encoding="UTF-8"?>',
      '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
      ...staticUrls.map(toUrl),
      ...exams.map((e) =>
        toUrl({
          loc: `/exams/${e.slug || e._id}`,
          priority: '0.8',
          changefreq: 'weekly',
          lastmod: e.updatedAt,
        })
      ),
      ...courses.map((c) =>
        toUrl({
          loc: `/courses/${c._id}`,
          priority: '0.7',
          changefreq: 'weekly',
          lastmod: c.updatedAt,
        })
      ),
      ...blogs.map((b) =>
        toUrl({
          loc: `/blog/${b.slug}`,
          priority: '0.7',
          changefreq: 'monthly',
          lastmod: b.updatedAt,
        })
      ),
      '</urlset>',
    ].join('\n');

    res.header('Content-Type', 'application/xml');
    res.header('Cache-Control', 'public, max-age=3600');
    res.send(xml);
  } catch (err) {
    res
      .status(500)
      .send(
        '<?xml version="1.0"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"></urlset>'
      );
  }
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
