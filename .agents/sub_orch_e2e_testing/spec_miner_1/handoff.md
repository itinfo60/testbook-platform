# Specification Mining Report: Server Startup, Static Scan & Core Auth/User APIs

## 1. Observation

### 1.1 Server Startup & Dev Boot Configuration

- **`package.json`**:
  - Line 8: `"dev": "NODE_ENV=development nodemon -e js,ts,json,mjs,cjs --import tsx src/server.js"`
  - Line 9: `"start": "NODE_ENV=production node src/server.js"`
  - Line 25-26: `"@prisma/adapter-pg": "^7.9.1"`, `"@prisma/client": "^7.9.1"`
  - Line 47: `"mongoose": "^8.0.0"` (present in dependencies, targeted for elimination)
  - Line 76: `"prisma": "^7.9.1"` in `devDependencies`
- **`src/server.js`**:
  - Line 1: `import './instrument.js';` (Sentry initialization must run before app)
  - Line 8: `import database from './config/database.js';`
  - Line 42: `await database.connect();` (MongoDB connection in startup sequence)
  - Line 45: `await redis.connect();`
  - Lines 48-63: Redis pub/sub adapter for Socket.IO
  - Line 66: `initializeSocket(io);`
  - Line 72: `await drainFailedJobs();`
  - Lines 75-84: `server.listen(config.port, ...)`
  - Lines 123-124: `await database.disconnect(); await redis.disconnect();` in graceful shutdown
- **`src/app.js`**:
  - Lines 7: `import mongoSanitize from 'express-mongo-sanitize';`
  - Line 130: `app.use(tenantIdentification);`
  - Line 163: `app.use(mongoSanitize());` (Sanitizes `$` and `.` in requests)
  - Line 193-206: `GET /health` endpoint (returns `{ success: true, status: 'healthy', uptime, environment, version, memory }`)
  - Line 211: `app.use('/api/v1/auth', authRoutes);`
  - Line 226: `app.use('/api/v1/admin/users', userRoutes);` (Admin user management mounted under `/api/v1/admin/users`)
  - Lines 283-369: `GET /sitemap.xml` dynamically requires Mongoose models:
    - Line 287: `require('./models/course.model')`
    - Line 288: `require('./models/blog.model')`
    - Line 290: `require('./models/examCategory.model')`
- **`src/config/database.js`**:
  - Line 1: `import mongoose from 'mongoose';`
  - Lines 32-43: `connect()` uses `mongoose.connect(config.mongoose.url, config.mongoose.options);`
  - Lines 58-64: `disconnect()` uses `mongoose.disconnect();`
  - Lines 66-73: `getStatus()` queries `mongoose.connection.readyState`
- **`src/config/prisma.js`**:
  - Lines 1-3: `import { PrismaClient } from '@prisma/client'; import { Pool } from 'pg'; import { PrismaPg } from '@prisma/adapter-pg';`
  - Lines 6-7: `const pool = new Pool({ connectionString: process.env.DATABASE_URL }); const adapter = new PrismaPg(pool);`
  - Lines 10-18: Singleton export `export const prisma = globalForPrisma.prisma || new PrismaClient({ adapter });`
- **`src/config/index.js`**:
  - Lines 12-21: `mongoose: { url: ..., options: { maxPoolSize: 50, ... } }`
  - Line 107: `const required = ['JWT_SECRET', 'MONGODB_URI'];` (Enforces MONGODB_URI check on boot)
  - Lines 116-121: `JWT_SECRET` must be >= 32 characters or throws boot error.
- **`src/instrument.js`**:
  - Line 8: `integrations: [Sentry.mongooseIntegration()],`

### 1.2 Mongoose Static Scan Target Inventory

- **Model Files (33 files found)**:
  1. `src/models/settings.model.ts`
  2. `src/models/index.js` & `src/models/plugins/` (`tenantPlugin.js`, `paginatePlugin.js`)
  3. `src/modules/affiliate/affiliate.model.js`
  4. `src/modules/aiQuiz/generatedQuiz.model.js`
  5. `src/modules/apikey/apikey.model.js`
  6. `src/modules/attendance/attendance.model.ts`
  7. `src/modules/audit/audit.model.js`
  8. `src/modules/badge/badge.model.ts`
  9. `src/modules/badge/userBadge.model.ts`
  10. `src/modules/blog/blog.model.js`
  11. `src/modules/coupon/coupon.model.ts`
  12. `src/modules/course/course.model.ts`
  13. `src/modules/discussion/discussion.model.ts`
  14. `src/modules/enrollment/enrollment.model.js`
  15. `src/modules/exam-category/examCategory.model.js`
  16. `src/modules/institute/institute.model.ts`
  17. `src/modules/library/library.model.ts`
  18. `src/modules/liveclass/liveclass.model.js`
  19. `src/modules/note/note.model.ts`
  20. `src/modules/notification/notification.model.js`
  21. `src/modules/parent/message.model.ts`
  22. `src/modules/payment/payment.model.ts`
  23. `src/modules/quiz/quiz.model.js`
  24. `src/modules/quiz/quizAttempt.model.js`
  25. `src/modules/review/review.model.ts`
  26. `src/modules/subscription/subscriptionPlan.model.ts`
  27. `src/modules/support/supportTicket.model.ts`
  28. `src/modules/test/question.model.ts`
  29. `src/modules/test/test.model.ts`
  30. `src/modules/test/testAttempt.model.ts`
  31. `src/modules/test-series/testSeries.model.js`
  32. `src/modules/user/user.model.ts`
  33. `src/modules/user/userActivity.model.js`
- **Mongoose Module Import References**:
  - `src/modules/auth/auth.dto.ts` (Line 1: `import { Document, Types } from 'mongoose';`)
  - `src/modules/auth/auth.repository.ts` (Line 1: `import { Model } from 'mongoose';`)
  - `src/modules/auth/auth.service.ts` (Line 13: `import User from '../user/user.model.js';`)
  - `src/modules/auth/auth.controller.ts` (Line 7: `import User from '../user/user.model.js';`)
  - `src/modules/user/user.repository.ts` (Line 1: `import { Model } from 'mongoose';`)
  - `src/core/base.repository.ts` (Line 1: `import { Model, Document, FilterQuery, UpdateQuery, QueryOptions } from 'mongoose';`)
  - `src/core/base.service.ts` (Line 1: `import { Document } from 'mongoose';`)
  - `src/core/tenant.repository.ts` (Line 1: `import { Document, FilterQuery, UpdateQuery, QueryOptions } from 'mongoose';`)
  - `src/middleware/tenant.middleware.js` (Line 5: `import { Types } from 'mongoose';`)
  - `src/middleware/auth.js` (Line 2: `import User from '../modules/user/user.model.ts';`)

### 1.3 Auth & User API Implementation

- **Auth Routes (`src/modules/auth/auth.routes.ts`)**:
  - `POST /register`: `authLimiter`, `validate(registerSchema)`, `checkRoleLimit`
  - `POST /login`: `authLimiter`, `validate(loginSchema)`
  - `GET /check-email`: `authLimiter`
  - `POST /logout`: `authenticate`
  - `POST /refresh-token`: Reads `req.cookies.refreshToken` or `req.body.refreshToken`
  - `POST /forgot-password`: `authLimiter`, `validate(forgotPasswordSchema)`
  - `POST /reset-password`: `authLimiter`, `validate(resetPasswordSchema)`
  - `GET /verify-email/:token`: Validates token param
  - `GET /me` & `GET /profile`: `authenticate`
  - `PATCH /profile` & `PUT /profile`: `authenticate`, `validate(updateProfileSchema)`
  - `POST /change-password`: `authenticate`, `validate(changePasswordSchema)`
  - `POST /mfa/setup`: `authenticate`
  - `POST /mfa/verify`: `authenticate`, `validate(mfaVerifySchema)`
  - `POST /mfa/login`: `authLimiter`, `validate(mfaLoginSchema)`
  - `POST /mfa/disable`: `authenticate`
  - `POST /fcm-token`: `authenticate`
  - `DELETE /fcm-token`: `authenticate`
  - `GET /google` & `GET /google/callback`: Passport OAuth
- **Admin User Routes (`src/modules/user/user.routes.ts`)**:
  - Middleware: `authenticate, authorize('admin', 'super_admin')`
  - `GET /`: `validate(userQuerySchema, 'query')`
  - `POST /`: `validate(adminCreateUserSchema, 'body')`
  - `GET /:id`: ID parameter
  - `PUT /:id`: `validate(adminUpdateUserSchema, 'body')`
  - `DELETE /:id`: Soft delete (`isActive: false`)
  - `PATCH /:id/role`: `validate(updateUserRoleSchema, 'body')`, `checkTeacherLimit`
  - `PATCH /:id/status`: `validate(updateUserStatusSchema, 'body')`
- **Prisma Schema (`prisma/schema.prisma`)**:
  - `User` model: `id` (UUID), `email` (unique), `name`, `password`, `role` ('student'|'teacher'|'admin'|'super_admin'), `isEmailVerified` (bool), `isActive` (bool), `avatar` (string?), `phone` (string?), timestamps. Relations to `Enrollment`, `Course` (as TeacherCourses), `Review`, `Payment`, `TestAttempt`, `QuizAttempt`.
  - `Institute` model: `id` (UUID), `name`, `subdomain` (unique), `websiteTitle`, `theme`, `logo`, `contactDetails`.

---

## 2. Logic Chain

1. **Server Startup**:
   - `src/server.js` calls `database.connect()`.
   - In Mongoose architecture, `database.connect()` executed `mongoose.connect()`.
   - In Prisma architecture, PostgreSQL connectivity is managed via `prisma.$connect()` and `@prisma/adapter-pg` pool defined in `src/config/prisma.js`.
   - `config/index.js` currently throws if `MONGODB_URI` is missing. For pure Prisma dev boot, environment validation must target `DATABASE_URL` rather than `MONGODB_URI`.
   - In `src/instrument.js`, `Sentry.mongooseIntegration()` references Mongoose; when Mongoose is removed or uninitialized, this causes runtime crashes or deprecation errors.
   - Dynamic `require` of `.model` files in `app.js` (`/sitemap.xml`) will crash if those files are deleted without replacing the sitemap queries with `prisma.course`, `prisma.blog`, `prisma.category`.

2. **Static Scan Verification**:
   - The user requirement mandates zero occurrences of `import mongoose` or `require('mongoose')` in `src/modules/`.
   - Currently, 33 model files exist, including `src/modules/user/user.model.ts` and `src/modules/user/userActivity.model.js`.
   - All modules currently importing `*.model.js`/`*.model.ts` or `mongoose` types must be refactored to use `prisma` client directly and TypeScript interfaces generated by Prisma (`User`, `Course`, etc.).

3. **Auth & User API Layer**:
   - The API contract uses standard REST status codes:
     - 200 OK (data retrieval, login, MFA, password changes, token refresh, query)
     - 201 Created (registration, admin user creation)
     - 204 No Content (admin user deletion)
     - 400 Bad Request (Zod validation failure, invalid token, incorrect password)
     - 401 Unauthorized (missing/invalid token, invalid credentials, locked session)
     - 403 Forbidden (tenant quotas: studentLimit/teacherLimit reached, role unauthorized)
     - 404 Not Found (user not found)
     - 409 Conflict (email already registered)
     - 429 Too Many Requests (rate limiting, Redis account lockout after 5 failed login attempts)
   - Password hashing uses bcrypt with 12 salt rounds.
   - JWT tokens: Access token expires in 15m; refresh token rotated upon use and stored with SHA-256 hash.
   - Multi-tenancy: Users have a `tenantId` (Institute UUID). Tenant isolation ensures users of one institute cannot log in to or query another institute's data unless they are `super_admin`.

---

## 3. Features Discovered

| #   | Category       | Feature                  | Description                                                                | Inputs                                                                            | Outputs                                                                                 | Error Behavior                                                          | Discovered Via                                               |
| --- | -------------- | ------------------------ | -------------------------------------------------------------------------- | --------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- | ----------------------------------------------------------------------- | ------------------------------------------------------------ |
| 1   | Server Startup | Dev Server Boot          | Boot server via nodemon / tsx without Mongoose                             | `npm run dev`, `PORT`, `DATABASE_URL`, `JWT_SECRET`                               | Stdout logs: TestBook Server v2.0.0, running on port                                    | Exit code 1 if missing `DATABASE_URL`/`JWT_SECRET`                      | `package.json`, `src/server.js`, `src/config/index.js`       |
| 2   | Server Startup | Health Probe             | System uptime, health & memory metrics                                     | `GET /health`                                                                     | 200 OK `{ success: true, status: 'healthy', memory: ... }`                              | 500 if server unhealthy                                                 | `src/app.js:193`                                             |
| 3   | Server Startup | Graceful Shutdown        | Clean teardown of HTTP, Socket.IO, BullMQ, Redis, DB                       | `SIGINT` / `SIGTERM` signals                                                      | Process exit code 0                                                                     | 30s timeout force shutdown                                              | `src/server.js:91`                                           |
| 4   | Static Scan    | Zero Mongoose Modules    | Zero `mongoose` imports across `src/modules/`                              | AST/Text grep in `server/src/modules/`                                            | 0 matching lines                                                                        | Non-zero match fails static verification                                | `TEST_INFRA.md`, `PROJECT.md`                                |
| 5   | Static Scan    | Model File Elimination   | Elimination of all 33 `*.model.*` files                                    | File system search `*.model.*` in `src/`                                          | 0 model files in `src/modules/`                                                         | Residual model files fail scan                                          | `PROJECT.md:25`                                              |
| 6   | Auth API       | User Registration        | Register student/teacher/parent with password hashing & verification email | `POST /api/v1/auth/register` `{ name, email, password, role? }`                   | 201 Created `{ user, accessToken }` + set-cookie `refreshToken`                         | 400 Validation Error, 403 Quota Exceeded, 409 Email Exists              | `auth.routes.ts`, `auth.controller.ts`, `auth.validation.ts` |
| 7   | Auth API       | User Login               | Authenticate with email & password, lockout protection, optional MFA       | `POST /api/v1/auth/login` `{ email, password, rememberMe? }`                      | 200 OK `{ user, accessToken, refreshToken, tokens }` or `{ requiresMfa: true, userId }` | 400 Bad Request, 401 Invalid Credentials, 429 Account Locked            | `auth.routes.ts`, `auth.service.ts`                          |
| 8   | Auth API       | MFA Login Verification   | Verify 6-digit TOTP token during MFA login flow                            | `POST /api/v1/auth/mfa/login` `{ userId, token, rememberMe? }`                    | 200 OK `{ user, accessToken }` + set-cookie `refreshToken`                              | 400 Validation Error, 401 Invalid MFA Token                             | `auth.routes.ts`, `auth.validation.ts`                       |
| 9   | Auth API       | Check Email Availability | Check if email is registered globally                                      | `GET /api/v1/auth/check-email?email=user@test.com`                                | 200 OK `{ available: boolean }`                                                         | 400 Bad Request if missing email                                        | `auth.routes.ts:37`                                          |
| 10  | Auth API       | Refresh Token Rotation   | Rotate refresh token family and issue new access token                     | `POST /api/v1/auth/refresh-token` (cookie / body)                                 | 200 OK `{ accessToken }` + set-cookie new `refreshToken`                                | 401 Unauthorized (invalid/expired/reused)                               | `auth.service.ts:284`                                        |
| 11  | Auth API       | User Logout              | Invalidate refresh token, blacklist access token in Redis, clear cookie    | `POST /api/v1/auth/logout` + Bearer token                                         | 200 OK `{ success: true, message: "Logged out successfully" }`                          | 401 Unauthorized if invalid token                                       | `auth.controller.ts:125`                                     |
| 12  | Auth API       | Forgot Password          | Request password reset email (silent anti-harvesting response)             | `POST /api/v1/auth/forgot-password` `{ email }`                                   | 200 OK `{ message: "If the email exists, a reset link has been sent" }`                 | 400 Validation Error                                                    | `auth.service.ts:373`                                        |
| 13  | Auth API       | Reset Password           | Reset password using valid SHA-256 hashed reset token                      | `POST /api/v1/auth/reset-password` `{ token, password }`                          | 200 OK `{ message: "Password reset successful. Please login." }`                        | 400 Invalid/expired reset token                                         | `auth.service.ts:395`                                        |
| 14  | Auth API       | Verify Email             | Confirm user email address via token                                       | `GET /api/v1/auth/verify-email/:token`                                            | 200 OK `{ message: "Email verified successfully" }`                                     | 400 Invalid/expired verification token                                  | `auth.service.ts:417`                                        |
| 15  | Auth API       | Get Current User Profile | Retrieve authenticated user profile (cached in Redis 300s)                 | `GET /api/v1/auth/me` or `GET /api/v1/auth/profile` + Bearer                      | 200 OK `{ user: { id, name, email, role, ... } }`                                       | 401 Unauthorized, 404 Not Found                                         | `auth.controller.ts:153`                                     |
| 16  | Auth API       | Update Profile           | Update name, bio, phone, avatar                                            | `PATCH /api/v1/auth/profile` / `PUT /profile` `{ name?, bio?, phone?, avatar? }`  | 200 OK `{ user: { ... }, message: "Profile updated" }`                                  | 400 Validation Error, 401 Unauthorized                                  | `auth.controller.ts:168`                                     |
| 17  | Auth API       | Change Password          | Update password after validating current password                          | `POST /api/v1/auth/change-password` `{ currentPassword, newPassword }`            | 200 OK `{ accessToken }` + set-cookie `refreshToken`                                    | 400 Current password incorrect, 401 Unauthorized                        | `auth.service.ts:472`                                        |
| 18  | Auth API       | MFA Setup                | Generate TOTP secret and QR code data URL                                  | `POST /api/v1/auth/mfa/setup` + Bearer                                            | 200 OK `{ qrCode, secret }`                                                             | 401 Unauthorized                                                        | `auth.service.ts:509`                                        |
| 19  | Auth API       | MFA Verify & Enable      | Verify TOTP code and generate 8 backup codes                               | `POST /api/v1/auth/mfa/verify` `{ token }`                                        | 200 OK `{ backupCodes: string[] }`                                                      | 400 Setup required first, 401 Invalid MFA token                         | `auth.service.ts:529`                                        |
| 20  | Auth API       | MFA Disable              | Disable MFA authentication using active TOTP code                          | `POST /api/v1/auth/mfa/disable` `{ token }`                                       | 200 OK `{ message: "MFA disabled" }`                                                    | 400 MFA not enabled, 401 Invalid authenticator code                     | `auth.service.ts:560`                                        |
| 21  | Auth API       | FCM Push Tokens          | Register or deregister device push notification token                      | `POST /api/v1/auth/fcm-token` / `DELETE /api/v1/auth/fcm-token` `{ token }`       | 200 OK `{ message: "FCM token registered" / "removed" }`                                | 400 Token required, 401 Unauthorized                                    | `auth.controller.ts:212`                                     |
| 22  | User Admin API | List & Paginate Users    | Paginate users with filters (role, search, isActive)                       | `GET /api/v1/admin/users?page=1&limit=10&search=john&role=student`                | 200 OK `{ data: User[], pagination: { page, limit, total, pages, hasNext, hasPrev } }`  | 401 Unauthorized, 403 Forbidden (non-admin)                             | `user.controller.ts:15`, `user.validation.ts:38`             |
| 23  | User Admin API | Admin Create User        | Admin provisioned user (pre-verified email)                                | `POST /api/v1/admin/users` `{ name, email, password, role }`                      | 201 Created `{ user: { ... } }`                                                         | 400 Validation Error, 401 Unauthorized, 403 Forbidden, 409 Email Exists | `user.controller.ts:30`                                      |
| 24  | User Admin API | Get User Details By ID   | Retrieve user document by UUID                                             | `GET /api/v1/admin/users/:id`                                                     | 200 OK `{ user: { ... } }`                                                              | 401 Unauthorized, 403 Forbidden, 404 User Not Found                     | `user.controller.ts:25`                                      |
| 25  | User Admin API | Admin Update User        | Update name, email, role, phone, bio, isActive                             | `PUT /api/v1/admin/users/:id` `{ name?, email?, role?, isActive?, phone?, bio? }` | 200 OK `{ user: { ... } }`                                                              | 400 Validation Error, 404 Not Found                                     | `user.controller.ts:35`                                      |
| 26  | User Admin API | Admin Delete User        | Soft delete user (`isActive: false`) and bust dashboard cache              | `DELETE /api/v1/admin/users/:id`                                                  | 204 No Content                                                                          | 401 Unauthorized, 403 Forbidden, 404 Not Found                          | `user.controller.ts:40`                                      |
| 27  | User Admin API | Update User Role         | Change user role ('student'/'teacher'/'admin') with teacher limit check    | `PATCH /api/v1/admin/users/:id/role` `{ role }`                                   | 200 OK `{ user: { ... } }`                                                              | 400 Validation Error, 403 Quota Exceeded, 404 Not Found                 | `user.controller.ts:48`                                      |
| 28  | User Admin API | Update User Status       | Toggle user account status (`isActive: true/false`)                        | `PATCH /api/v1/admin/users/:id/status` `{ isActive }`                             | 200 OK `{ user: { ... } }`                                                              | 400 Validation Error, 404 Not Found                                     | `user.controller.ts:53`                                      |

---

## 4. Edge Cases

| #   | Feature           | Input                                                                          | Observed Behavior                                                                                                                                     |
| --- | ----------------- | ------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Server Startup    | Missing `MONGODB_URI` / `DATABASE_URL` in `.env`                               | Server crashes immediately during startup validation with `Missing required environment variables: ...`                                               |
| 2   | Server Startup    | `JWT_SECRET` length < 32 characters                                            | Boot fails with `JWT_SECRET must be at least 32 characters for security.`                                                                             |
| 3   | Static Scan       | Search for `from 'mongoose'` or `require('mongoose')` in `src/modules/`        | Non-zero match triggers test failure in static verification suite                                                                                     |
| 4   | Auth Registration | Password missing uppercase letter (e.g. `password123`)                         | 400 Bad Request with Zod message: `Password must have at least one uppercase letter, one lowercase letter, and one number`                            |
| 5   | Auth Registration | Email with uppercase & leading/trailing whitespace (` USER@Test.COM`)          | Zod schema normalizes to trimmed lowercase (`user@test.com`) before uniqueness check and persistence                                                  |
| 6   | Auth Registration | Institute quota exceeded for students or teachers                              | 403 Forbidden: `The student/teacher limit for this institute has been reached. Please contact administration to upgrade.`                             |
| 7   | Auth Login        | 5 consecutive failed password attempts                                         | Redis sets `lockout:${email}`; 6th attempt immediately throws 429 Too Many Requests: `Account temporarily locked. Try again in 15 minutes.`           |
| 8   | Auth Login        | User has `mfaEnabled: true`                                                    | Returns 200 OK `{ requiresMfa: true, userId: "..." }` without issuing access/refresh tokens                                                           |
| 9   | Auth Login        | Deactivated user (`isActive: false`) attempts login                            | 401 Unauthorized (`Invalid email or password`) to prevent account status enumeration                                                                  |
| 10  | Auth Login        | Tenant mismatch (User belongs to tenant A, but logs in via tenant B subdomain) | 401 Unauthorized (unless user has `role: 'super_admin'`)                                                                                              |
| 11  | Refresh Token     | Expired refresh token presented                                                | Token removed from active sessions in DB, returns 401 Unauthorized: `Invalid or expired refresh token`                                                |
| 12  | Refresh Token     | Token reuse attempt (valid signature, but token was already consumed/rotated)  | Detects breach, purges ALL active refresh token sessions for the user, returns 401 Unauthorized                                                       |
| 13  | Forgot Password   | Non-existent email supplied                                                    | Returns 200 OK with generic message `If the email exists, a reset link has been sent` (anti-enumeration)                                              |
| 14  | Reset Password    | Token presented after 10-minute expiry                                         | 400 Bad Request: `Invalid or expired reset token`                                                                                                     |
| 15  | Token Blacklist   | Access token presented after `/logout`                                         | Redis check `bl_${token}` returns true -> 401 Unauthorized: `Token has been revoked. Please login again.`                                             |
| 16  | Admin User Query  | `GET /api/v1/admin/users?page=9999&limit=10`                                   | 200 OK `{ data: [], pagination: { page: 9999, limit: 10, total: 42, pages: 5, hasNext: false, hasPrev: true } }`                                      |
| 17  | Admin User Query  | `GET /api/v1/admin/users?isActive=false`                                       | Preprocessed string boolean returns deactivated users only                                                                                            |
| 18  | Admin User Delete | Deleting user                                                                  | Soft delete (`isActive: false`), does not hard delete row; clears `user_${id}` and `admin:dashboard:${tenantId}` Redis caches, returns 204 No Content |

---

## 5. Caveats

- In the original Mongoose implementation, `User` IDs were MongoDB 24-character hexadecimal `ObjectId`s (`_id`). In Prisma, all IDs are standard UUID v4 strings (`id`). Any tests or route parsers expecting hex `ObjectId` formats must support standard UUID strings.
- In `src/app.js`, `mongoSanitize()` from `express-mongo-sanitize` is currently mounted at the root. In PostgreSQL/Prisma, NoSQL injection sanitization is unnecessary and can interfere with valid JSON payloads containing `$` or `.`.
- In `src/app.js`, the dynamic `/sitemap.xml` route currently requires Mongoose models directly. This route must be updated to query `prisma.course`, `prisma.blog`, `prisma.category`.

---

## 6. Conclusion

1. **Server Startup & Dev Boot**: Must execute `prisma.$connect()` via centralized `src/config/prisma.js`, eliminate `config.mongoose` and `MONGODB_URI` checks in `src/config/index.js`, remove `Sentry.mongooseIntegration()` in `src/instrument.js`, and replace Mongoose connection lifecycle in `src/server.js` and `src/config/database.js`.
2. **Mongoose Static Scan**: All 33 `*.model.*` files across `src/modules/` and `src/models/` must be removed. All controllers, repositories, services, and middlewares in `src/modules/` must have zero imports of `mongoose`.
3. **Auth & User APIs**: 17 Auth endpoints and 7 Admin User endpoints are fully specified with strict Zod schemas, BCrypt password hashing, SHA-256 token hashing, JWT access/refresh rotation, Redis lockout/caching, tenant isolation, and standardized ApiResponse/ApiError contracts.

---

## 7. Verification Method

To independently verify these specifications against the implementation:

1. **Static Grep Scan**:
   ```bash
   rg "from 'mongoose'|require\(['\"]mongoose['\"]\)" server/src/modules/
   ```
   Must return 0 results.
2. **Model Files Deletion Scan**:
   ```bash
   find server/src -name "*.model.*"
   ```
   Must return 0 results.
3. **Server Boot Check**:
   ```bash
   cd server && npm run dev
   ```
   Ensure server starts without Mongoose errors and `GET http://localhost:5000/health` returns status `healthy`.
4. **Auth & User Test Suite**:
   ```bash
   cd server && NODE_ENV=test npm test
   ```
   Run automated integration/E2E test suite covering registration, login, token refresh, profile update, MFA, lockout, and user management.
