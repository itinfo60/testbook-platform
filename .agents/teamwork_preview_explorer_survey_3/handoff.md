# Server Architecture & Modules Survey Handoff Report

## 1. Observation

### 1.1 Server Entry Point, Scripts & Configuration

- **Package Configuration** (`server/package.json`):
  - `"type": "module"`, `"main": "src/server.js"`
  - Dev Script: `NODE_ENV=development nodemon -e js,ts,json,mjs,cjs --import tsx src/server.js` (Line 8)
  - Production Start: `NODE_ENV=production node src/server.js` (Line 9)
  - Cluster Mode: `NODE_ENV=production node src/cluster.js` (Line 10)
  - Seed Script: `node --import tsx scripts/seed.ts` (Line 11)
  - Test Script: `NODE_ENV=test vitest run` (Line 13)
  - TypeScript / Execution tooling: `tsx` (^4.22.3), `typescript` (^5.9.2), `prisma` (^7.9.1), `@prisma/client` (^7.9.1), `@prisma/adapter-pg` (^7.9.1), `pg` (^8.23.0).
- **TypeScript Configuration** (`server/tsconfig.json`):
  - Target & Lib: `ES2022`, Module & Resolution: `NodeNext`
  - `allowJs: true`, `checkJs: false`, `rootDir: "./src"`, `outDir: "./dist"`
  - Strict mode enabled (`strict: true`, `noImplicitAny: true`, `strictNullChecks: true`, etc.)
  - Path inclusions: `src/**/*`, excludes `node_modules`, `dist`, `tests/**/*`.
- **Vitest Configuration** (`server/vitest.config.js`):
  - Setup file: `./tests/setup.js`
  - Include pattern: `tests/**/*.test.{js,ts}`
  - Timeout: 30000ms
  - `tests/setup.js` currently spins up `MongoMemoryServer` and calls `mongoose.connect()`.

### 1.2 Startup & Bootstrap Execution Chain

1. **Instrument Initialization** (`src/instrument.js`):
   - Sentry initializes first (`import './instrument.js'` at line 1 of `src/server.js`).
   - Line 8: `integrations: [Sentry.mongooseIntegration()]`.
2. **Server Bootstrap** (`src/server.js`):
   - HTTP server created wrapping Express instance from `src/app.js`.
   - Socket.IO server mounted on HTTP server with Redis adapter.
   - `await database.connect()` connects Mongoose using `config.mongoose.url` in `src/config/database.js`.
   - `await redis.connect()` connects Redis client.
   - Workers started: email, notification, certificate, drip, reminder, dunning.
   - Dev queue clean: `drainFailedJobs()`.
   - `server.listen(config.port)`.
3. **Shutdown Chain** (`src/server.js` lines 92–134):
   - Handles `SIGTERM` and `SIGINT`.
   - Closes HTTP server, Socket.IO, BullMQ workers.
   - Calls `await database.disconnect()` (Mongoose) and `await redis.disconnect()`.
4. **App Middleware & Routing Pipeline** (`src/app.js`):
   - Security & Utility middleware: `x-request-id`, `ExpressAdapter` (Bull Board on `/admin/queues`), `tenantIdentification`, `helmet`, `cors`, `mongoSanitize()` (Line 163), `hpp()`, `express.json({ limit: '10mb' })`, `cookieParser()`, `compression()`, `passport.initialize()`, `morgan`, `globalLimiter`, static `/uploads`, `/health`.
   - Dynamic `/sitemap.xml` route (Lines 283–369): directly imports and queries Mongoose models `Course`, `Blog`, `ExamCategory`.
   - API Routes mounted under `/api/v1/...` for 34 module domains.

### 1.3 Database Connection & Lifecycle Comparison

| Feature                 | Mongoose Setup (Current)                                                                            | Prisma Setup (Target)                                                                           |
| ----------------------- | --------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| **Configuration**       | `src/config/database.js` & `src/config/index.js` (`config.mongoose.url`, `config.mongoose.options`) | `src/config/prisma.js` & `server/prisma.config.ts`                                              |
| **Connection Provider** | MongoDB connection string (`MONGODB_URI` / `MONGODB_URI_TEST`)                                      | PostgreSQL connection pool via `pg.Pool` & `@prisma/adapter-pg` (`DATABASE_URL` / `DIRECT_URL`) |
| **Client Instance**     | `mongoose.connection` singleton / global Mongoose connection                                        | `export const prisma = new PrismaClient({ adapter })` exported from `src/config/prisma.js`      |
| **Startup Lifecycle**   | `await database.connect()` in `src/server.js:42` with 5-retry exponential backoff                   | `await prisma.$connect()` (or lazy connect on first query)                                      |
| **Shutdown Lifecycle**  | `await database.disconnect()` in `src/server.js:123`                                                | `await prisma.$disconnect()`                                                                    |
| **Environment Check**   | `src/config/index.js:107` requires `MONGODB_URI`                                                    | Requires `DATABASE_URL`                                                                         |
| **Schema Source**       | 33 Mongoose schema files (`*.model.ts`, `*.model.js`)                                               | Centralized schema in `server/prisma/schema.prisma`                                             |

### 1.4 Central Core Data Access Layer

- `src/core/base.repository.ts`: Wraps `mongoose.Model<T>`, `FilterQuery<T>`, `UpdateQuery<T>`, `QueryOptions`.
- `src/core/tenant.repository.ts`: Extends `BaseRepository<T>` and injects `{ tenantId }` into Mongoose filters via `getScopedFilter()`.
- `src/core/base.service.ts`: Delegates CRUD calls to `BaseRepository<T>`.
- `src/core/base.controller.ts`: Provides `catchAsync`, `ok`, `created`, `noContent`, `paginated` HTTP response helpers.
- `src/core/tenant.context.ts`: Uses Node `AsyncLocalStorage` (`runWithTenant`, `getTenantId`, `isBypassTenant`).

---

### 1.5 Exhaustive Inventory of All 34 Modules in `server/src/modules/`

Below is the complete enumeration of all 34 modules, their internal files, layer breakdown, and their Mongoose data access points:

| #   | Module Directory | Files                                                                                                                                                                                                                             | Architecture Layers                                                | Mongoose Touchpoints / Data Operations                                                                                                                                                                                                                                                    |
| --- | ---------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `admin`          | `admin.controller.js`<br>`admin.routes.js`<br>`settings.controller.ts`<br>`settings.routes.ts`                                                                                                                                    | Controllers, Routes                                                | Queries `User`, `Course`, `Enrollment`, `Review`, `Test`, `TestAttempt`, `Quiz`, `Payment`, `Notification`, `Coupon`, `Institute`, `PlatformSettings` via aggregation pipelines, countDocuments, find, update, paginate, insertMany.                                                      |
| 2   | `affiliate`      | `affiliate.controller.js`<br>`affiliate.model.js`<br>`affiliate.routes.js`                                                                                                                                                        | Controller, Model, Routes                                          | `Affiliate` (Referral) & `ReferralRecord` Mongoose models. Queries: `findOne`, `create`, `find`, `findByIdAndUpdate`, `updateMany`.                                                                                                                                                       |
| 3   | `ai`             | `ai.controller.ts`<br>`ai.dto.ts`<br>`ai.routes.ts`<br>`ai.service.ts`<br>`ai.validation.ts`<br>`llm.service.js`<br>`prompt-sanitize.ts`                                                                                          | Controller, DTO, Service, Validation, Routes, Helpers              | Service handles OpenAI/LangChain calls with Redis rate-limiting and in-memory RAG. Direct LLM streaming wrapper in `llm.service.js`.                                                                                                                                                      |
| 4   | `aiQuiz`         | `aiQuiz.controller.js`<br>`aiQuiz.routes.js`<br>`aiQuiz.validation.js`<br>`generatedQuiz.model.js`                                                                                                                                | Controller, Validation, Model, Routes                              | `GeneratedQuiz` Mongoose model. Queries: `GeneratedQuiz.create`.                                                                                                                                                                                                                          |
| 5   | `apikey`         | `apikey.controller.js`<br>`apikey.model.js`<br>`apikey.routes.js`                                                                                                                                                                 | Controller, Model, Routes                                          | `ApiKey` Mongoose model. Queries: `create`, `find`, `findOneAndUpdate`, `findOne`, `findByIdAndUpdate`. Middleware `authenticateApiKey`.                                                                                                                                                  |
| 6   | `attendance`     | `attendance.controller.ts`<br>`attendance.model.ts`<br>`attendance.routes.ts`                                                                                                                                                     | Controller, Model, Routes                                          | `Attendance` Mongoose model, imports `Course` model. Queries: `Attendance.findOne`, `Course.findById`, `Attendance.create`, `attendance.save()`.                                                                                                                                          |
| 7   | `audit`          | `audit.model.js`<br>`audit.routes.js`                                                                                                                                                                                             | Model, Routes                                                      | `AuditLog` Mongoose model. Queries: `AuditLog.paginate`. Middleware in `src/middleware/auditLog.js` logs actions to `AuditLog`.                                                                                                                                                           |
| 8   | `auth`           | `auth.controller.ts`<br>`auth.dto.ts`<br>`auth.repository.ts`<br>`auth.routes.ts`<br>`auth.service.ts`<br>`auth.validation.ts`                                                                                                    | Controller, DTO, Repository, Service, Validation, Routes           | `AuthRepository` extends `TenantRepository<IUser>` (Mongoose `User` model). Queries: `findByEmail`, `findByEmailWithMfa`, `findByIdWithMfa`, `findByResetToken`, `findByVerificationToken`.                                                                                               |
| 9   | `badge`          | `badge.controller.ts`<br>`badge.dto.ts`<br>`badge.model.ts`<br>`badge.repository.ts`<br>`badge.routes.ts`<br>`badge.service.ts`<br>`badge.validation.ts`<br>`userBadge.model.ts`<br>`userBadge.repository.ts`                     | Controller, DTO, Models, Repositories, Service, Validation, Routes | `Badge` and `UserBadge` Mongoose models. `BadgeRepository` and `UserBadgeRepository` extend `TenantRepository`.                                                                                                                                                                           |
| 10  | `blog`           | `blog.controller.js`<br>`blog.model.js`<br>`blog.routes.js`<br>`blog.validation.js`                                                                                                                                               | Controller, Model, Validation, Routes                              | `Blog` Mongoose model, imports `User`, `ExamCategory`. Queries: `Blog.paginate`, `Blog.findOne`, `Blog.findByIdAndUpdate`, `Blog.create`, `Blog.findByIdAndDelete`, `Blog.distinct`.                                                                                                      |
| 11  | `coupon`         | `coupon.controller.ts`<br>`coupon.dto.ts`<br>`coupon.model.ts`<br>`coupon.repository.ts`<br>`coupon.routes.ts`<br>`coupon.service.ts`<br>`coupon.validation.ts`                                                                   | Controller, DTO, Model, Repository, Service, Validation, Routes    | `Coupon` Mongoose model. `CouponRepository` extends `TenantRepository<ICoupon>`. Queries: `findByCode`, `findActive`.                                                                                                                                                                     |
| 12  | `course`         | `course.controller.ts`<br>`course.dto.ts`<br>`course.model.ts`<br>`course.repository.ts`<br>`course.routes.ts`<br>`course.service.ts`<br>`course.validation.ts`                                                                   | Controller, DTO, Model, Repository, Service, Validation, Routes    | `Course` Mongoose model (with embedded Sections & Lessons). `CourseRepository` extends `TenantRepository<ICourse>`. Queries: `paginateCourses`, `find`, `findById`, `findOne`, `create`, `updateById`, `deleteById`. `CourseService` also queries `Review`, `Enrollment`, `ExamCategory`. |
| 13  | `discussion`     | `discussion.controller.ts`<br>`discussion.dto.ts`<br>`discussion.model.ts`<br>`discussion.repository.ts`<br>`discussion.routes.ts`<br>`discussion.service.ts`<br>`discussion.validation.ts`                                       | Controller, DTO, Model, Repository, Service, Validation, Routes    | `Discussion` Mongoose model. `DiscussionRepository` extends `TenantRepository<IDiscussion>`. Queries: `paginateDiscussions`, `findByCourse`, `addReply`, `toggleUpvote`.                                                                                                                  |
| 14  | `enrollment`     | `certificate.controller.js`<br>`enrollment.controller.js`<br>`enrollment.model.js`<br>`enrollment.routes.js`<br>`enrollment.validation.ts`                                                                                        | Controllers, Model, Validation, Routes                             | `Enrollment` Mongoose model, imports `Course`, `User`, `Payment`. Queries: `Enrollment.findOne`, `Enrollment.create`, `Enrollment.paginate`, `Enrollment.findByIdAndUpdate`, `Course.findByIdAndUpdate`, `User.findByIdAndUpdate`. Certificate generation logic.                          |
| 15  | `exam-category`  | `examCategory.controller.js`<br>`examCategory.model.js`<br>`examCategory.routes.js`                                                                                                                                               | Controller, Model, Routes                                          | `ExamCategory` Mongoose model. Queries: `find`, `findOne`, `findById`, `create`, `findByIdAndUpdate`, `findByIdAndDelete`, `countDocuments`.                                                                                                                                              |
| 16  | `gdpr`           | `gdpr.controller.ts`<br>`gdpr.dto.ts`<br>`gdpr.routes.ts`<br>`gdpr.service.ts`<br>`gdpr.validation.ts`                                                                                                                            | Controller, DTO, Service, Validation, Routes                       | Imports `User`, `Enrollment`, `Payment`, `Review`, `Note`, `Discussion`, `TestAttempt`, `QuizAttempt`. Queries all user-associated data for GDPR export and deletion.                                                                                                                     |
| 17  | `institute`      | `institute.controller.ts`<br>`institute.dto.ts`<br>`institute.model.ts`<br>`institute.repository.ts`<br>`institute.routes.ts`<br>`institute.service.ts`<br>`institute.validation.ts`                                              | Controller, DTO, Model, Repository, Service, Validation, Routes    | `Institute` Mongoose model. `InstituteRepository` extends `BaseRepository<IInstitute>`. Queries: `findBySubdomain`, `findActiveInstitutes`, `create`, `updateById`, `findById`.                                                                                                           |
| 18  | `leaderboard`    | `leaderboard.controller.ts`<br>`leaderboard.dto.ts`<br>`leaderboard.routes.ts`<br>`leaderboard.service.ts`<br>`leaderboard.validation.ts`                                                                                         | Controller, DTO, Service, Validation, Routes                       | Imports `TestAttempt`, `QuizAttempt`, `User`, `Course`. Runs aggregation pipelines over attempts to compute global, weekly, and monthly rankings.                                                                                                                                         |
| 19  | `library`        | `library.controller.ts`<br>`library.model.ts`<br>`library.routes.ts`                                                                                                                                                              | Controller, Model, Routes                                          | `LibraryResource` Mongoose model. Queries: `paginate`, `findById`, `create`, `findByIdAndUpdate`, `findByIdAndDelete`, `find`.                                                                                                                                                            |
| 20  | `liveclass`      | `liveclass.controller.js`<br>`liveclass.model.js`<br>`liveclass.routes.js`<br>`liveclass.validation.js`                                                                                                                           | Controller, Model, Validation, Routes                              | `LiveClass` Mongoose model. Queries: `create`, `find`, `findById`, `findByIdAndUpdate`, `findByIdAndDelete`. Generates LiveKit WebRTC access tokens.                                                                                                                                      |
| 21  | `note`           | `note.controller.ts`<br>`note.dto.ts`<br>`note.model.ts`<br>`note.repository.ts`<br>`note.routes.ts`<br>`note.service.ts`<br>`note.validation.ts`                                                                                 | Controller, DTO, Model, Repository, Service, Validation, Routes    | `Note` Mongoose model. `NoteRepository` extends `TenantRepository<INote>`. Queries: `findByUserAndCourse`, `findByLesson`, `paginateNotes`.                                                                                                                                               |
| 22  | `notification`   | `notification.controller.js`<br>`notification.model.js`<br>`notification.routes.js`                                                                                                                                               | Controller, Model, Routes                                          | `Notification` Mongoose model. Queries: `paginate`, `findOneAndUpdate`, `markAllRead`, `findOneAndDelete`, `getUnreadCount`, `insertMany`.                                                                                                                                                |
| 23  | `parent`         | `message.model.ts`<br>`parent.controller.ts`<br>`parent.routes.ts`<br>`parent.service.ts`                                                                                                                                         | Controller, Model, Service, Routes                                 | `ParentMessage` Mongoose model, imports `User`, `Enrollment`, `TestAttempt`, `Attendance`. Queries student progress and attendance for parents.                                                                                                                                           |
| 24  | `payment`        | `payment.controller.ts`<br>`payment.dto.ts`<br>`payment.model.ts`<br>`payment.repository.ts`<br>`payment.routes.ts`<br>`payment.service.ts`<br>`payment.validation.ts`                                                            | Controller, DTO, Model, Repository, Service, Validation, Routes    | `Payment` Mongoose model. `PaymentRepository` extends `TenantRepository<IPayment>`. Queries: `findByOrderId`, `findByTransactionId`, `create`, `updateStatus`. Razorpay & Stripe integration.                                                                                             |
| 25  | `quiz`           | `quiz.controller.js`<br>`quiz.model.js`<br>`quiz.routes.js`<br>`quizAttempt.model.js`                                                                                                                                             | Controller, Models, Routes                                         | `Quiz` and `QuizAttempt` Mongoose models, imports `Enrollment`. Queries: `Quiz.paginate`, `Quiz.find`, `Quiz.findById`, `Quiz.create`, `QuizAttempt.create`, `QuizAttempt.find`.                                                                                                          |
| 26  | `review`         | `review.controller.ts`<br>`review.dto.ts`<br>`review.model.ts`<br>`review.repository.ts`<br>`review.routes.ts`<br>`review.service.ts`<br>`review.validation.ts`                                                                   | Controller, DTO, Model, Repository, Service, Validation, Routes    | `Review` Mongoose model. `ReviewRepository` extends `TenantRepository<IReview>`. Queries: `findByCourse`, `calculateAverageRating`, `create`, `updateById`, `deleteById`.                                                                                                                 |
| 27  | `search`         | `search.controller.js`<br>`search.routes.js`                                                                                                                                                                                      | Controller, Routes                                                 | Multi-entity global search across `ExamCategory`, `Course`, `Test`, `Blog`, `LibraryResource`. Runs parallel `find` queries with `$regex`.                                                                                                                                                |
| 28  | `subscription`   | `subscription.controller.ts`<br>`subscription.routes.ts`<br>`subscription.service.ts`<br>`subscriptionPlan.model.ts`<br>`subscriptionPlan.repository.ts`                                                                          | Controller, Model, Repository, Service, Routes                     | `SubscriptionPlan` Mongoose model, imports `Institute`. `SubscriptionPlanRepository` extends `BaseRepository<ISubscriptionPlan>`. Queries: `findActivePlans`, `findByCode`, `updateInstituteSubscription`.                                                                                |
| 29  | `support`        | `support.controller.ts`<br>`support.routes.ts`<br>`supportTicket.model.ts`                                                                                                                                                        | Controller, Model, Routes                                          | `SupportTicket` Mongoose model. Queries: `create`, `find`, `findById`, `findByIdAndUpdate`, `aggregate`.                                                                                                                                                                                  |
| 30  | `test`           | `question.model.ts`<br>`test.controller.ts`<br>`test.dto.ts`<br>`test.model.ts`<br>`test.repository.ts`<br>`test.routes.ts`<br>`test.service.ts`<br>`test.validation.ts`<br>`testAttempt.model.ts`<br>`testAttempt.repository.ts` | Controller, DTO, Models, Repositories, Service, Validation, Routes | `Test`, `Question`, and `TestAttempt` Mongoose models. `TestRepository` and `TestAttemptRepository` extend `TenantRepository`. Queries: `paginateTests`, `findPublished`, `submitAttempt`, `calculateScore`, `getAttemptAnalytics`.                                                       |
| 31  | `test-series`    | `testSeries.controller.js`<br>`testSeries.model.js`<br>`testSeries.routes.js`                                                                                                                                                     | Controller, Model, Routes                                          | `TestSeries` Mongoose model, imports `Test`, `TestAttempt`, `Enrollment`, `ExamCategory`. Queries: `find`, `findOne`, `create`, `findByIdAndUpdate`, `findByIdAndDelete`.                                                                                                                 |
| 32  | `upload`         | `upload.controller.js`<br>`upload.routes.js`                                                                                                                                                                                      | Controller, Routes                                                 | File uploads to Cloudinary / local disk. Enforces tenant storage limit via `req.tenant.limits` and updates `Institute.storageUsed`.                                                                                                                                                       |
| 33  | `user`           | `user.controller.ts`<br>`user.dto.ts`<br>`user.model.ts`<br>`user.repository.ts`<br>`user.routes.ts`<br>`user.service.ts`<br>`user.validation.ts`<br>`userActivity.model.js`                                                      | Controller, DTO, Models, Repository, Service, Validation, Routes   | `User` and `UserActivity` Mongoose models. `UserRepository` extends `TenantRepository<IUser>`. Queries: `findByEmail`, `paginateUsers`, `updateProfile`, `changePassword`, `logActivity`.                                                                                                 |
| 34  | `wishlist`       | `wishlist.controller.js`<br>`wishlist.model.js`<br>`wishlist.routes.js`                                                                                                                                                           | Controller, Model, Routes                                          | `Wishlist` Mongoose model. Queries: `Wishlist.paginate`, `Wishlist.findOne`, `Wishlist.create`, `Wishlist.findByIdAndDelete`.                                                                                                                                                             |

---

### 1.6 Non-Module Mongoose Dependencies in `server/src/`

1. **`src/app.js`**:
   - Line 7: `import mongoSanitize from 'express-mongo-sanitize';`
   - Line 163: `app.use(mongoSanitize());`
   - Lines 287–308: `/sitemap.xml` queries `Course`, `Blog`, and `ExamCategory` Mongoose models.
2. **`src/instrument.js`**:
   - Line 8: `integrations: [Sentry.mongooseIntegration()]`
3. **`src/middleware/auth.js`**:
   - Line 2: `import User from '../modules/user/user.model.ts';`
   - Line 54, 116: `User.findById(decoded.id).select('-password -refreshTokens').lean()`
4. **`src/middleware/tenant.middleware.js`**:
   - Line 3: `import Institute from '../modules/institute/institute.model.ts';`
   - Line 4: `import SubscriptionPlan from '../modules/subscription/subscriptionPlan.model.ts';`
   - Line 5: `import { Types } from 'mongoose';`
   - Line 6: `import User from '../modules/user/user.model.ts';`
   - Line 68, 80, 93, 130, 181, 196: `Institute.findById`, `Institute.findOne`, `User.findById`, `User.countDocuments`.
5. **`src/middleware/errorHandler.js`**:
   - Lines 14–33 & 48–69: Custom error conversion and response formatting for `err.name === 'ValidationError'`, `err.name === 'CastError'`, `err.code === 11000`.
6. **`src/models/index.js`**:
   - Re-exports 21 Mongoose models from `src/modules/*`.
7. **`src/models/settings.model.ts`**:
   - Standalone Mongoose model for platform settings and banners.
8. **`src/models/plugins/*`**:
   - `paginatePlugin.js`, `softDeletePlugin.js`, `tenantPlugin.js` (Mongoose schema plugins).
9. **`src/workers/*`**:
   - `drip.worker.js` (imports `Enrollment`, `Course`)
   - `dunning.worker.js` (imports `Institute`, `User`)
   - `notification.worker.js` (imports `Notification`, `User`)
   - `reminder.worker.js` (imports `Enrollment`, `User`)
10. **`tests/setup.js`**:
    - Starts `MongoMemoryServer` and calls `mongoose.connect()`.

---

## 2. Logic Chain

1. **Premise 1 (Target Goal)**: The objective is to replace all Mongoose database queries with their Prisma Client equivalents across all modules in `server/src/`, remove all Mongoose model definition files (schemas), remove any Mongoose imports, and ensure `npm run dev` starts without Mongoose errors.
2. **Premise 2 (Server Architecture)**: The backend uses NodeNext ESM (`"type": "module"`) executed via `nodemon --import tsx src/server.js` in development. All 34 modules are mounted in `src/app.js` and initialized through `src/server.js`.
3. **Premise 3 (Current Data Access State)**:
   - Data access is split between two patterns:
     a. TypeScript modules (e.g. `course`, `auth`, `user`, `test`, `coupon`, `review`, `discussion`, `note`, `badge`, `institute`, `payment`) use a 3-layer architecture: Controller → Service → Repository (`BaseRepository` / `TenantRepository`) extending Mongoose models.
     b. JavaScript modules (e.g. `enrollment`, `quiz`, `blog`, `liveclass`, `exam-category`, `admin`, `affiliate`, `aiQuiz`, `apikey`, `notification`, `search`, `test-series`, `wishlist`) make direct Mongoose model calls in controllers.
4. **Premise 4 (Database Connection Lifecycle)**:
   - In `src/server.js`, `database.connect()` calls `mongoose.connect(config.mongoose.url)` and `config/index.js` throws if `MONGODB_URI` is missing.
   - Prisma has already been initialized in `src/config/prisma.js` with `new PrismaClient({ adapter: new PrismaPg(pool) })` and `server/prisma/schema.prisma`.
   - To fully transition, the startup database connection hook in `src/server.js` and shutdown hook must use `prisma.$connect()` and `prisma.$disconnect()`, `config/index.js` must validate PostgreSQL envs, and Sentry must drop `Sentry.mongooseIntegration()`.
5. **Deduction & Strategy for Implementation**:
   - Module migration can be cleanly phased:
     - **Phase 1: Foundation & Core Layer**: Update `src/config/prisma.js`, `src/config/index.js`, `src/server.js`, `src/instrument.js`, rewrite `src/core/base.repository.ts` and `src/core/tenant.repository.ts` to use `prisma`, and update middlewares (`auth.js`, `tenant.middleware.js`, `errorHandler.js`).
     - **Phase 2: Core Domain Modules (TS Layer)**: Migrate repositories & services in `user`, `auth`, `institute`, `course`, `test`, `enrollment`, `payment`, `review`, `coupon`.
     - **Phase 3: Extended & JS Modules**: Migrate controllers/services in `admin`, `quiz`, `blog`, `discussion`, `note`, `badge`, `leaderboard`, `liveclass`, `notification`, `affiliate`, `aiQuiz`, `apikey`, `attendance`, `audit`, `gdpr`, `library`, `parent`, `search`, `subscription`, `support`, `test-series`, `upload`, `wishlist`.
     - **Phase 4: Cleanup & Schemas Deletion**: Remove all 33 `*.model.*` files, `models/index.js`, `models/plugins/`, update `app.js` (remove `mongoSanitize`, update `/sitemap.xml`), and verify text search for `mongoose` yields zero results.

---

## 3. Caveats

- **No Caveats.** Every file in `server/src/` was directly inspected, and all 34 modules with their constituent files, models, repositories, and routes have been enumerated and verified against the actual workspace file system.

---

## 4. Conclusion

The server architecture is an Express/NodeNext application structured around 34 functional modules, accompanied by BullMQ background workers, Socket.IO real-time channels, and Redis caching.

Mongoose is presently embedded across:

1. 33 schema/model files (`*.model.ts` / `*.model.js` + `models/settings.model.ts`).
2. Central repository classes (`src/core/base.repository.ts` and `src/core/tenant.repository.ts`).
3. Direct controller queries in 15+ JavaScript modules.
4. Server startup/shutdown lifecycle in `src/server.js` and `src/config/database.js`.
5. Middlewares (`auth.js`, `tenant.middleware.js`, `errorHandler.js`) and auxiliary features (sitemap in `app.js`, Sentry integration in `instrument.js`).

Prisma Client (`@prisma/client` + `@prisma/adapter-pg`) is already installed with a defined PostgreSQL schema in `prisma/schema.prisma` and client instantiation in `src/config/prisma.js`. Complete migration requires transitioning all data access layers to `prisma`, updating server startup lifecycle, and deleting all 33 Mongoose model files.

---

## 5. Verification Method

To verify these findings independently:

1. **Verify All Modules and File Counts**:

   ```bash
   cd /Users/balveerchoudhary/testbook-platform/server
   find src/modules -mindepth 1 -maxdepth 1 -type d | wc -l
   # Expected: 34 modules
   ```

2. **Verify All Model Files**:

   ```bash
   find src -name "*.model.*" -type f
   # Expected: 33 model files
   ```

3. **Verify All Repository Files**:

   ```bash
   find src -name "*.repository.*" -type f
   # Expected: 16 repository files
   ```

4. **Verify Mongoose References Across Codebase**:

   ```bash
   grep -rn "mongoose" src/
   ```

5. **Verify Server Dev Script & TypeScript Config**:

   ```bash
   cat package.json | grep "dev"
   cat tsconfig.json
   ```

6. **Verify Test Runner Configuration**:
   ```bash
   cat vitest.config.js
   cat tests/setup.js
   ```
