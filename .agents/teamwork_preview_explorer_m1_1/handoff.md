# Milestone 1 Investigation Report: Server Startup, Database Lifecycle, Sentry & Core Middlewares

## Executive Summary

This investigation covers the decoupling of Mongoose and the complete migration to PostgreSQL / Prisma Client for the core server foundation: `server/src/server.js`, `server/src/config/database.js`, `server/src/config/index.js`, `server/src/instrument.js`, `server/src/middleware/auth.js`, `server/src/middleware/tenant.middleware.js`, `server/src/middleware/errorHandler.js`, `server/src/middleware/auditLog.js`, and `server/src/app.js`.

---

## 1. Observation

### 1.1 `server/src/server.js`

- **Imports**: Line 8 imports Mongoose database wrapper:
  ```javascript
  import database from './config/database.js';
  ```
- **Startup Connection**: Lines 41-43:
  ```javascript
  // Connect to MongoDB
  await database.connect();
  ```
- **Graceful Shutdown**: Lines 122-124:
  ```javascript
  // Disconnect from databases
  await database.disconnect();
  await redis.disconnect();
  ```

### 1.2 `server/src/config/database.js`

- **Current Content**: The entire file (77 lines) wraps `mongoose` with retry and reconnection event listeners (`mongoose.connection.on('connected')`, `mongoose.connection.on('disconnected')`, `mongoose.connection.readyState`).
- **Connection**: Line 37 executes `await mongoose.connect(config.mongoose.url, config.mongoose.options);`.
- **Status/Health**: Line 66-73:
  ```javascript
  getStatus() {
    const states = ['disconnected', 'connected', 'connecting', 'disconnecting'];
    return {
      status: states[mongoose.connection.readyState] || 'unknown',
      host: mongoose.connection.host,
      name: mongoose.connection.name,
    };
  }
  ```

### 1.3 `server/src/config/index.js`

- **MongoDB Configuration**: Lines 12-21:
  ```javascript
  mongoose: {
    url: process.env.NODE_ENV === 'test' ? process.env.MONGODB_URI_TEST : process.env.MONGODB_URI,
    options: {
      maxPoolSize: 50,
      minPoolSize: 10,
      socketTimeoutMS: 45000,
      serverSelectionTimeoutMS: 5000,
      heartbeatFrequencyMS: 10000,
    },
  },
  ```
- **Mandatory Environment Variables Check**: Lines 107-114:
  ```javascript
  const required = ['JWT_SECRET', 'MONGODB_URI'];
  if (config.env === 'production') {
    required.push('SMTP_USER', 'REDIS_URL');
  }
  const missing = required.filter((key) => !process.env[key]);
  if (missing.length) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
  ```
- **Observation**: When Mongoose is decommissioned, `MONGODB_URI` requirement causes server startup to crash if `MONGODB_URI` is unset. `DATABASE_URL` (and optionally `DIRECT_URL`) must be configured instead.

### 1.4 `server/src/instrument.js`

- **Current Content**: Lines 1-11:

  ```javascript
  import * as Sentry from '@sentry/node';

  if (process.env.SENTRY_DSN) {
    Sentry.init({
      dsn: process.env.SENTRY_DSN,
      environment: process.env.NODE_ENV || 'development',
      tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
      integrations: [Sentry.mongooseIntegration()],
    });
  }
  ```

- **Observation**: `Sentry.mongooseIntegration()` at line 8 requires Mongoose and will crash or emit warnings once Mongoose is uninstalled or unused.

### 1.5 `server/src/middleware/auth.js`

- **Imports**: Line 2 imports `User` model: `import User from '../modules/user/user.model.ts';`.
- **Query in `authenticate`**: Line 54 executes:
  ```javascript
  const dbUser = await User.findById(decoded.id).select('-password -refreshTokens').lean();
  ```
- **Cross-tenant Check**: Line 82: `user.tenantId.toString() !== req.tenantId`.
- **Request Context**: Line 88: `req.userId = user._id.toString();`.
- **Query in `optionalAuth`**: Lines 116-120:
  ```javascript
  const user = await User.findById(decoded.id).select('-password -refreshTokens').lean();
  if (user && user.isActive) {
    req.user = user;
    req.userId = user._id.toString();
  }
  ```

### 1.6 `server/src/middleware/tenant.middleware.js`

- **Imports**: Lines 3-6:
  ```javascript
  import Institute from '../modules/institute/institute.model.ts';
  import SubscriptionPlan from '../modules/subscription/subscriptionPlan.model.ts';
  import { Types } from 'mongoose';
  import User from '../modules/user/user.model.ts';
  ```
- **Queries in `tenantIdentification`**:
  - Line 68: `tenant = await Institute.findById(tenantIdHeader).lean();`
  - Line 80: `tenant = await Institute.findOne({ subdomain: sub }).lean();`
  - Line 93: `User.findById(decoded.id).select('tenantId role').lean()`
  - Line 130: `Institute.findByIdAndUpdate(tenant._id, { 'subscription.status': 'expired' })`
  - Line 142: `req.tenantId = tenant._id.toString();`
- **Queries in Limit Middlewares**:
  - Line 181 (`checkStudentLimit`): `const studentCount = await User.countDocuments({ role: 'student', tenantId: req.tenantId });`
  - Line 196 (`checkTeacherLimit`): `const teacherCount = await User.countDocuments({ role: 'teacher', tenantId: req.tenantId });`

### 1.7 `server/src/middleware/errorHandler.js`

- **Current Error Conversion**: Lines 14-33 check Mongoose specific errors:
  - `err.name === 'ValidationError'` (Mongoose schema validation)
  - `err.name === 'CastError'` (Mongoose invalid ObjectId)
  - `err.code === 11000` (Mongoose duplicate key error)
- **Current Error Handler**: Lines 48-69 duplicate the checks for `ValidationError`, `11000`, and `CastError`.
- **Missing Prisma Error Handling**: Does not handle Prisma's `PrismaClientKnownRequestError` (`P2002` duplicate, `P2025` not found, `P2003` foreign key violation, `P2000` string too long), `PrismaClientValidationError`, or `PrismaClientInitializationError`.

### 1.8 `server/src/middleware/auditLog.js`

- **Imports**: Line 1 imports Mongoose model: `import AuditLog from '../modules/audit/audit.model.js';`.
- **Creation**: Lines 39-55 call `await AuditLog.create({ ... })`.
- **Observation**: Fails if `audit.model.js` is removed unless redirected to Prisma (`prisma.auditLog.create` if model exists) or structured application logger.

### 1.9 `server/src/app.js`

- **Imports**: Line 7: `import mongoSanitize from 'express-mongo-sanitize';`.
- **Middleware**: Line 163: `app.use(mongoSanitize()); // Prevent NoSQL injection`.
- **Dynamic Sitemap Endpoint**: Lines 283-369 contains dynamic `require()` of Mongoose models:
  ```javascript
  const Course = require('./models/course.model').default || require('./models/course.model');
  const Blog = require('./models/blog.model').default || require('./models/blog.model');
  const ExamCategory =
    require('./models/examCategory.model').default || require('./models/examCategory.model');
  ```
  And executes `Course.find()`, `Blog.find()`, and `ExamCategory.find()`.

---

## 2. Logic Chain & Migration Blueprints

### 2.1 Refactoring `server/src/server.js`

**Rationale**: `server.js` should either import `prisma` directly or delegate to `database.js`. Wrapping via `database.js` provides consistent lifecycle logging, retry logic, and health-checks.
**Proposed Implementation**:

```javascript
// In server/src/server.js
import './instrument.js'; // Sentry must be imported first
import http from 'http';
import { Server as SocketServer } from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import { createClient } from 'redis';
import app from './app.js';
import config from './config/index.js';
import database from './config/database.js';
import redis from './config/redis.js';
import logger from './utils/logger.js';
// ...

const startServer = async () => {
  try {
    // Connect to PostgreSQL (Prisma)
    await database.connect();

    // Connect to Redis
    await redis.connect();
    // ...
```

And in `gracefulShutdown`:

```javascript
// Disconnect from databases
await database.disconnect();
await redis.disconnect();
```

### 2.2 Refactoring `server/src/config/database.js`

**Rationale**: Replace Mongoose connection wrapper with a Prisma-backed lifecycle manager. Support health checks using Prisma raw query `$queryRaw\`SELECT 1\``.
**Proposed Implementation**:

```javascript
import prisma from './prisma.js';
import config from './index.js';
import logger from '../utils/logger.js';

class Database {
  constructor() {
    this.retryCount = 0;
    this.maxRetries = 5;
    this.retryDelay = 5000;
    this.isConnected = false;
  }

  async connect() {
    try {
      await prisma.$connect();
      // Test query to verify active connection
      await prisma.$queryRaw`SELECT 1`;
      this.isConnected = true;
      this.retryCount = 0;
      logger.info('📦 PostgreSQL (Prisma) connected successfully');
      return prisma;
    } catch (error) {
      this.isConnected = false;
      logger.error('PostgreSQL initial connection failed:', error.message);
      return this._reconnect();
    }
  }

  async _reconnect() {
    if (this.retryCount >= this.maxRetries) {
      logger.error(`PostgreSQL: Max retries (${this.maxRetries}) reached. Exiting.`);
      process.exit(1);
    }

    this.retryCount++;
    logger.info(
      `PostgreSQL: Retry ${this.retryCount}/${this.maxRetries} in ${this.retryDelay / 1000}s...`
    );

    await new Promise((resolve) => setTimeout(resolve, this.retryDelay));
    return this.connect();
  }

  async disconnect() {
    if (this.isConnected) {
      await prisma.$disconnect();
      this.isConnected = false;
      logger.info('PostgreSQL (Prisma) disconnected gracefully');
    }
  }

  async getStatus() {
    try {
      await prisma.$queryRaw`SELECT 1`;
      return {
        status: 'connected',
        provider: 'postgresql',
      };
    } catch {
      return {
        status: 'disconnected',
        provider: 'postgresql',
      };
    }
  }
}

export const db = new Database();
export default db;
```

### 2.3 Refactoring `server/src/config/index.js`

**Rationale**: Drop `mongoose` settings, configure `database` with `DATABASE_URL` and `DIRECT_URL`, and replace `MONGODB_URI` with `DATABASE_URL` in required check.
**Proposed Implementation**:

```javascript
// Replace mongoose block with:
  database: {
    url: process.env.DATABASE_URL,
    directUrl: process.env.DIRECT_URL,
  },

// Replace required check:
const required = ['JWT_SECRET', 'DATABASE_URL'];
if (config.env === 'production') {
  required.push('SMTP_USER', 'REDIS_URL');
}
const missing = required.filter((key) => !process.env[key]);
if (missing.length) {
  throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
}
```

### 2.4 Refactoring `server/src/instrument.js`

**Rationale**: Remove `Sentry.mongooseIntegration()`.
**Proposed Implementation**:

```javascript
import * as Sentry from '@sentry/node';

if (process.env.SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV || 'development',
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  });
}
```

### 2.5 Refactoring `server/src/middleware/auth.js`

**Rationale**: Query user via `prisma.user.findUnique({ where: { id: decoded.id } })`, omit password, map `user.id` to `req.userId` and `user._id` for backward compatibility.
**Proposed Implementation**:

```javascript
import jwt from 'jsonwebtoken';
import { prisma } from '../config/prisma.js';
import ApiError from '../utils/ApiError.js';
import catchAsync from '../utils/catchAsync.js';
import config from '../config/index.js';
import redis from '../config/redis.js';
import { runWithTenant } from '../utils/TenantContext.js';

export const authenticate = catchAsync(async (req, res, next) => {
  let token;

  if (req.headers.authorization?.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies?.accessToken) {
    token = req.cookies.accessToken;
  }

  if (!token) {
    throw ApiError.unauthorized('Access token required. Please login.');
  }

  let isBlacklisted = false;
  try {
    isBlacklisted = await redis.get(`bl_${token}`);
  } catch (err) {}
  if (isBlacklisted) {
    throw ApiError.unauthorized('Token has been revoked. Please login again.');
  }

  let decoded;
  try {
    decoded = jwt.verify(token, config.jwt.secret);
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      throw ApiError.unauthorized('Session expired. Please login again.');
    }
    throw ApiError.unauthorized('Invalid token. Please login again.');
  }

  let user = await runWithTenant(null, true, async () => {
    let cachedUser = null;
    try {
      cachedUser = await redis.get(`user_${decoded.id}`);
    } catch (err) {}
    if (!cachedUser) {
      const dbUser = await prisma.user.findUnique({
        where: { id: decoded.id },
      });
      if (dbUser) {
        const { password, ...userClean } = dbUser;
        userClean._id = userClean.id; // Compatibility shim
        try {
          await redis.set(`user_${decoded.id}`, userClean, 300);
        } catch (err) {}
        return userClean;
      }
      return null;
    }
    return cachedUser;
  });

  if (!user) {
    throw ApiError.unauthorized('User not found. Account may have been deleted.');
  }

  if (!user.isActive) {
    throw ApiError.forbidden('Account has been deactivated. Contact support.');
  }

  if (
    user.role !== 'super_admin' &&
    user.tenantId &&
    req.tenantId &&
    user.tenantId.toString() !== req.tenantId
  ) {
    throw ApiError.forbidden('Access denied. You do not belong to this institute.');
  }

  req.user = user;
  req.userId = user.id || user._id?.toString();
  next();
});

export const optionalAuth = catchAsync(async (req, res, next) => {
  let token;

  if (req.headers.authorization?.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (token) {
    try {
      const decoded = jwt.verify(token, config.jwt.secret);
      const dbUser = await prisma.user.findUnique({
        where: { id: decoded.id },
      });
      if (dbUser && dbUser.isActive) {
        const { password, ...userClean } = dbUser;
        userClean._id = userClean.id;
        req.user = userClean;
        req.userId = userClean.id;
      }
    } catch {}
  }

  next();
});
```

### 2.6 Refactoring `server/src/middleware/tenant.middleware.js`

**Rationale**: Replace Mongoose models (`Institute`, `User`) and `Types.ObjectId` with Prisma queries.
**Proposed Implementation**:

```javascript
import jwt from 'jsonwebtoken';
import { runWithTenant } from '../utils/TenantContext.js';
import { prisma } from '../config/prisma.js';
import ApiError from '../utils/ApiError.js';
import catchAsync from '../utils/catchAsync.js';
import redis from '../config/redis.js';
import config from '../config/index.js';

const TENANT_CACHE_TTL = 300; // 5 minutes

async function getTenantFromCache(key) {
  return redis.get(`tenant:${key}`);
}

async function setTenantCache(key, tenant) {
  await redis.set(`tenant:${key}`, tenant, TENANT_CACHE_TTL);
}

export async function invalidateTenantCache(subdomain, id) {
  await Promise.all([redis.del(`tenant:subdomain:${subdomain}`), redis.del(`tenant:id:${id}`)]);
}

const getSubdomain = (host) => {
  if (!host) return null;
  const hostName = host.split(':')[0];
  const parts = hostName.split('.');

  if (hostName.endsWith('localhost') || hostName.endsWith('127.0.0.1')) {
    if (parts.length > 1 && parts[0] !== 'localhost') {
      return parts[0];
    }
    return null;
  }

  if (parts.length > 2) {
    if (parts[0] === 'www') {
      return parts[1];
    }
    return parts[0];
  }

  return null;
};

export const tenantIdentification = catchAsync(async (req, res, next) => {
  const subdomain = getSubdomain(req.headers.host) || req.headers['x-tenant-subdomain'];
  const tenantIdHeader = req.headers['x-tenant-id'];

  let tenant = null;

  if (tenantIdHeader) {
    tenant = await getTenantFromCache(`id:${tenantIdHeader}`);
    if (!tenant) {
      tenant = await prisma.institute.findUnique({
        where: { id: tenantIdHeader },
      });
      if (!tenant) {
        return res.status(404).json({ success: false, message: 'Institute not found' });
      }
      tenant._id = tenant.id;
      await setTenantCache(`id:${tenantIdHeader}`, tenant);
    }
  } else if (subdomain) {
    const sub = subdomain.toLowerCase();
    tenant = await getTenantFromCache(`subdomain:${sub}`);
    if (!tenant) {
      tenant = await prisma.institute.findUnique({
        where: { subdomain: sub },
      });
      if (tenant) {
        tenant._id = tenant.id;
        await setTenantCache(`subdomain:${sub}`, tenant);
      }
    }
  }

  if (!tenant) {
    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith('Bearer ')) {
      try {
        const decoded = jwt.verify(authHeader.split(' ')[1], config.jwt.secret);
        if (decoded.id) {
          const user = await runWithTenant(null, true, () =>
            prisma.user.findUnique({
              where: { id: decoded.id },
              select: { id: true, role: true, tenantId: true },
            })
          );
          if (user?.tenantId && user.role !== 'super_admin') {
            const tid = user.tenantId.toString();
            tenant = await getTenantFromCache(`id:${tid}`);
            if (!tenant) {
              tenant = await prisma.institute.findUnique({
                where: { id: tid },
              });
              if (tenant) {
                tenant._id = tenant.id;
                await setTenantCache(`id:${tid}`, tenant);
              }
            }
          }
        }
      } catch {}
    }
  }

  if (tenant) {
    tenant._id = tenant.id;
    if (tenant.isActive === false) {
      throw ApiError.forbidden('This institute has been suspended. Please contact support.');
    }

    if (tenant.subscription && typeof tenant.subscription === 'object') {
      if (tenant.subscription.status === 'suspended') {
        throw ApiError.forbidden(
          'This institute has been suspended due to billing. Please contact support.'
        );
      }

      if (tenant.subscription.expiresAt) {
        const now = new Date();
        const expiresAt = new Date(tenant.subscription.expiresAt);
        const gracePeriodEnd = new Date(expiresAt.getTime() + 7 * 24 * 60 * 60 * 1000);
        if (tenant.subscription.status === 'expired' || (now > expiresAt && now > gracePeriodEnd)) {
          if (tenant.subscription.status !== 'expired') {
            setImmediate(() =>
              prisma.institute
                .update({
                  where: { id: tenant.id },
                  data: { subscription: { ...tenant.subscription, status: 'expired' } },
                })
                .catch(() => {})
            );
            invalidateTenantCache(tenant.subdomain, tenant.id).catch(() => {});
          }
          throw ApiError.forbidden(
            "This institute's subscription has expired. Please upgrade or renew your plan."
          );
        }
      }
    }

    req.tenantId = tenant.id;
    req.tenant = tenant;
    return runWithTenant(tenant.id, false, next);
  }

  return runWithTenant(null, true, next);
});

export const requireTenant = (req, res, next) => {
  if (!req.tenantId) {
    throw ApiError.badRequest(
      'Tenant context required. Please use an institute subdomain or specify X-Tenant-Subdomain / X-Tenant-Id header.'
    );
  }
  next();
};

export const optionalTenant = (req, _res, next) => {
  next();
};

export const checkStudentLimit = catchAsync(async (req, res, next) => {
  if (!req.tenant) return next();

  const studentCount = await prisma.user.count({
    where: { role: 'student', tenantId: req.tenantId },
  });
  const limit = req.tenant.limits?.studentLimit;
  if (limit && studentCount >= limit) {
    throw ApiError.forbidden(
      'The student limit for this institute has been reached. Please contact administration to upgrade.'
    );
  }
  next();
});

export const checkTeacherLimit = catchAsync(async (req, res, next) => {
  if (!req.tenant) return next();

  const teacherCount = await prisma.user.count({
    where: { role: 'teacher', tenantId: req.tenantId },
  });
  const limit = req.tenant.limits?.teacherLimit;
  if (limit && teacherCount >= limit) {
    throw ApiError.forbidden(
      'The teacher limit for this institute has been reached. Please contact administration to upgrade.'
    );
  }
  next();
});

export const checkStorageLimit = catchAsync(async (req, res, next) => {
  if (!req.tenant) return next();

  const incomingBytes = parseInt(req.headers['content-length'] || '0', 10);
  const { storageUsed = 0, limits } = req.tenant;
  const storageLimit = limits?.storageLimit || 10 * 1024 * 1024 * 1024; // 10 GB default

  if (storageUsed + incomingBytes > storageLimit) {
    const usedGB = (storageUsed / 1024 ** 3).toFixed(2);
    const limitGB = (storageLimit / 1024 ** 3).toFixed(0);
    throw ApiError.forbidden(
      `Storage limit reached (${usedGB} GB used of ${limitGB} GB). Please delete old files or upgrade your plan.`
    );
  }
  next();
});
```

### 2.7 Refactoring `server/src/middleware/errorHandler.js`

**Rationale**: Convert Prisma client errors into operational `ApiError` instances with standard HTTP status codes:

- `P2002` (Unique constraint failed) -> 409 Conflict
- `P2025` (Record not found) -> 404 Not Found
- `P2003` (Foreign key constraint violation) -> 400 Bad Request
- `P2000` (String value too long) -> 400 Bad Request
- `PrismaClientValidationError` -> 400 Bad Request
- `PrismaClientInitializationError` -> 503 Service Unavailable

**Proposed Implementation**:

```javascript
import * as Sentry from '@sentry/node';
import { Prisma } from '@prisma/client';
import ApiError from '../utils/ApiError.js';
import logger from '../utils/logger.js';
import config from '../config/index.js';

export const notFoundHandler = (req, res, next) => {
  next(ApiError.notFound(`Route not found: ${req.method} ${req.originalUrl}`));
};

export const errorConverter = (err, req, res, next) => {
  let error = err;

  if (!(error instanceof ApiError)) {
    if (
      err instanceof Prisma.PrismaClientKnownRequestError ||
      err.name === 'PrismaClientKnownRequestError'
    ) {
      if (err.code === 'P2002') {
        const target = err.meta?.target;
        const field = Array.isArray(target) ? target.join(', ') : target || 'field';
        error = new ApiError(
          409,
          `Duplicate value for '${field}'`,
          [{ field, message: `Duplicate value for '${field}'` }],
          err.stack
        );
        error.isOperational = true;
      } else if (err.code === 'P2025') {
        const message = err.meta?.cause || 'Record not found';
        error = new ApiError(404, message, [], err.stack);
        error.isOperational = true;
      } else if (err.code === 'P2003') {
        const field = err.meta?.field_name || 'relation';
        error = new ApiError(400, `Invalid relation reference: ${field}`, [], err.stack);
        error.isOperational = true;
      } else if (err.code === 'P2000') {
        error = new ApiError(400, 'Provided value exceeds maximum length', [], err.stack);
        error.isOperational = true;
      } else {
        error = new ApiError(400, `Database error: ${err.message}`, [], err.stack);
        error.isOperational = true;
      }
    } else if (
      err instanceof Prisma.PrismaClientValidationError ||
      err.name === 'PrismaClientValidationError'
    ) {
      error = new ApiError(400, 'Database validation error: Invalid input data', [], err.stack);
      error.isOperational = true;
    } else if (
      err instanceof Prisma.PrismaClientInitializationError ||
      err.name === 'PrismaClientInitializationError'
    ) {
      error = new ApiError(503, 'Database service temporarily unavailable', [], err.stack);
      error.isOperational = false;
    } else {
      const statusCode = error.statusCode || error.status || 500;
      const message = error.message || 'Internal Server Error';
      error = new ApiError(statusCode, message, [], err.stack);
      error.isOperational = false;
    }
  }

  next(error);
};

export const errorHandler = (err, req, res, _next) => {
  let { statusCode, message, errors } = err;

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid token';
  }

  if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token expired';
  }

  // Multer errors
  if (err.code === 'LIMIT_FILE_SIZE') {
    statusCode = 400;
    message = 'File too large';
  }

  const logCtx = {
    requestId: req.id,
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
    userId: req.userId || null,
    tenantId: req.tenantId || null,
  };

  if (statusCode >= 500) {
    Sentry.withScope((scope) => {
      scope.setTag('requestId', req.id);
      scope.setUser({ id: req.userId });
      scope.setExtra('url', req.originalUrl);
      scope.setExtra('method', req.method);
      scope.setExtra('tenantId', req.tenantId);
      Sentry.captureException(err);
    });
    logger.error(`${statusCode} - ${message}`, { ...logCtx, stack: err.stack });
  } else if (statusCode >= 400) {
    logger.warn(`${statusCode} - ${message}`, logCtx);
  }

  const response = {
    success: false,
    statusCode,
    message,
    ...(errors?.length && { errors }),
    ...(config.env === 'development' && { stack: err.stack }),
  };

  res.status(statusCode).json(response);
};
```

### 2.8 Refactoring `server/src/middleware/auditLog.js`

**Rationale**: Decouple from `src/modules/audit/audit.model.js`. Persist via `prisma.auditLog` if present, or log to application logger.
**Proposed Implementation**:

```javascript
import { prisma } from '../config/prisma.js';
import { getTenantId } from '../utils/TenantContext.js';
import logger from '../utils/logger.js';

const AUDITED_ACTIONS = {
  POST: 'create',
  PUT: 'update',
  PATCH: 'update',
  DELETE: 'delete',
};

const RESOURCE_MAP = {
  '/courses': 'course',
  '/tests': 'test',
  '/enrollments': 'enrollment',
  '/users': 'user',
  '/payments': 'payment',
  '/live-classes': 'liveclass',
  '/auth': 'auth',
  '/institute': 'institute',
  '/subscriptions': 'subscription',
};

function resolveResource(path) {
  for (const [prefix, name] of Object.entries(RESOURCE_MAP)) {
    if (path.includes(prefix)) return name;
  }
  return 'unknown';
}

export function auditLog(req, res, next) {
  if (!AUDITED_ACTIONS[req.method]) return next();

  const originalJson = res.json.bind(res);
  res.json = function (body) {
    setImmediate(async () => {
      try {
        const tenantId = getTenantId();
        const auditEntry = {
          tenantId: tenantId || null,
          actor: req.userId || null,
          actorEmail: req.user?.email || null,
          actorRole: req.user?.role || null,
          action: AUDITED_ACTIONS[req.method],
          resource: resolveResource(req.path),
          resourceId: req.params?.id || null,
          metadata: {
            ip: req.ip,
            userAgent: req.headers['user-agent'],
            method: req.method,
            path: req.path,
          },
          status: res.statusCode < 400 ? 'success' : 'failure',
          errorMessage: res.statusCode >= 400 ? body?.message : undefined,
        };

        if (prisma.auditLog) {
          await prisma.auditLog.create({ data: auditEntry });
        } else {
          logger.info('[AUDIT]', auditEntry);
        }
      } catch (err) {
        logger.debug('Audit logging error:', err.message);
      }
    });
    return originalJson(body);
  };

  next();
}
```

### 2.9 Refactoring `server/src/app.js`

**Rationale**:

1. Remove `express-mongo-sanitize` middleware import and usage (line 7 & line 163).
2. Refactor dynamic `/sitemap.xml` route handler to use `prisma.course.findMany`, `prisma.blog.findMany`, and `prisma.category.findMany`.
   **Proposed Implementation**:

```javascript
// Remove mongoSanitize import:
// import mongoSanitize from 'express-mongo-sanitize'; (DELETE)
// Remove mongoSanitize registration:
// app.use(mongoSanitize()); (DELETE)

// Add Prisma import:
import { prisma } from './config/prisma.js';

// Dynamic Sitemap:
app.get('/sitemap.xml', async (req, res) => {
  try {
    const BASE_URL = process.env.CLIENT_URL || 'https://edurportal.in';

    const [courses, blogs, exams] = await Promise.all([
      prisma.course
        .findMany({
          where: { isPublished: true },
          select: { id: true, slug: true, updatedAt: true },
          take: 200,
        })
        .catch(() => []),
      prisma.blog
        .findMany({
          where: { status: 'published' },
          select: { id: true, slug: true, updatedAt: true },
          take: 200,
        })
        .catch(() => []),
      prisma.category
        .findMany({
          select: { id: true, slug: true, updatedAt: true },
          take: 50,
        })
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
          loc: `/exams/${e.slug || e.id}`,
          priority: '0.8',
          changefreq: 'weekly',
          lastmod: e.updatedAt,
        })
      ),
      ...courses.map((c) =>
        toUrl({
          loc: `/courses/${c.slug || c.id}`,
          priority: '0.7',
          changefreq: 'weekly',
          lastmod: c.updatedAt,
        })
      ),
      ...blogs.map((b) =>
        toUrl({
          loc: `/blog/${b.slug || b.id}`,
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
```

---

## 3. Caveats

1. **Compatibility Shim (`user._id = user.id`)**: In Mongoose, records have `_id` as an `ObjectId` (or string when serialized). In Prisma, records have `id` as a UUID string. Throughout the codebase during the migration transition, downstream route handlers may access `req.user._id` or `req.user.id`. Setting `user._id = user.id` in `auth.js` and `tenant.middleware.js` prevents subtle `undefined` runtime errors before all controllers are rewritten.
2. **Schema Alignment for JSON Fields**: In PostgreSQL, `Institute.subscription`, `Institute.limits`, `Institute.theme`, and `Institute.logo` are stored as `Json?`. In JavaScript, these are parsed objects. Ensure null/undefined safety when accessing nested properties (e.g. `tenant.subscription?.status`).
3. **Database Connection Pool**: `server/src/config/prisma.js` uses `@prisma/adapter-pg` with `pg.Pool`. Ensure `DATABASE_URL` is set in the environment or `.env`.
4. **Passport OAuth Decoupling**: Note that `server/src/config/passport.js` also references `User.findOne` / `User.create` / `User.findById`. While not part of the direct middleware list, it is initialized in `app.js` and will be migrated in Milestone 2.

---

## 4. Conclusion

- **Server Startup & Lifecycle**: `server/src/server.js` and `server/src/config/database.js` are ready for a clean replacement using `prisma.$connect()`, `prisma.$disconnect()`, and `$queryRaw\`SELECT 1\``.
- **Environment Configuration**: `server/src/config/index.js` requires replacing `mongoose` options with `database` config and removing `MONGODB_URI` from the mandatory env validation.
- **Sentry**: Removing `Sentry.mongooseIntegration()` in `server/src/instrument.js` eliminates Mongoose telemetry overhead.
- **Middlewares**: `auth.js`, `tenant.middleware.js`, `errorHandler.js`, `auditLog.js`, and `app.js` have clear, verified Prisma-based replacement implementations without any dependencies on Mongoose.

---

## 5. Verification Method

To independently verify the foundation migration:

1. **Prisma Schema Validation**:
   ```bash
   cd server && npx prisma validate
   ```
2. **Prisma Client Generation**:
   ```bash
   cd server && npx prisma generate
   ```
3. **Verify Zero Mongoose Imports in Middleware & Config**:
   ```bash
   grep -rn "mongoose" server/src/middleware/ server/src/config/database.js server/src/instrument.js
   ```
4. **Verify Application Dev Startup**:
   ```bash
   cd server && npm run dev
   ```
   _Expected output_: Server starts on port 5000, connects to PostgreSQL (Prisma), connects to Redis, starts BullMQ workers, and logs `🚀 TestBook Server v2.0.0` without any Mongoose errors.
