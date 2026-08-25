# Project: Backend Mongoose to Prisma Migration

## Architecture

The backend is a NodeNext ESM application in `server/` powered by Express, Socket.IO, BullMQ, PostgreSQL, and Prisma Client.

- **Centralized Prisma Client**: `server/src/config/prisma.js` exports a singleton `prisma` instance configured with `@prisma/adapter-pg` and PostgreSQL connection pooling.
- **Data Access Pattern**: All database access across `server/src/modules/` (repositories, services, controllers) must query `prisma` directly (e.g. `prisma.user.findUnique`, `prisma.course.findMany`, `prisma.enrollment.create`, etc.).
- **Removal of Mongoose**: All Mongoose schema/model files (`*.model.ts`, `*.model.js`), plugins, and Mongoose connection hooks must be removed or replaced with Prisma Client operations.
- **Zero Mongoose in Modules**: Zero occurrences of `import mongoose` or `require('mongoose')` anywhere in `server/src/modules/`.

## Feature Inventory

| #   | Feature / Area                                  | Description                                                                                                                                                                                                                                                                                                                                            | Milestone | Source |
| --- | ----------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------- | ------ |
| 1   | Server Startup & DB Lifecycle                   | Replace Mongoose connection in `src/server.js`, `src/config/database.js`, `src/config/index.js`, `src/instrument.js` with Prisma `$connect()`/`$disconnect()`.                                                                                                                                                                                         | M1        | Survey |
| 2   | Core Base Repositories                          | Refactor `src/core/base.repository.ts`, `src/core/tenant.repository.ts`, `src/core/base.service.ts` to operate with Prisma Client.                                                                                                                                                                                                                     | M1        | Survey |
| 3   | Core Middleware Decoupling                      | Refactor `src/middleware/auth.js`, `src/middleware/tenant.middleware.js`, `src/middleware/errorHandler.js`, `src/middleware/auditLog.js`, `src/app.js` (`mongoSanitize` and `/sitemap.xml`).                                                                                                                                                           | M1        | Survey |
| 4   | Prisma Schema Completeness                      | Ensure `server/prisma/schema.prisma` models cover all needed entities and run `npx prisma generate`.                                                                                                                                                                                                                                                   | M1        | Survey |
| 5   | User & Auth Migration                           | Migrate `src/modules/user` and `src/modules/auth` (controllers, repositories, services, DTOs) to Prisma; remove `user.model.ts`, `userActivity.model.js`.                                                                                                                                                                                              | M2        | Survey |
| 6   | Institute Module Migration                      | Migrate `src/modules/institute` (controllers, repositories, services, DTOs) to Prisma; remove `institute.model.ts`.                                                                                                                                                                                                                                    | M2        | Survey |
| 7   | Course, Lesson & Category Migration             | Migrate `src/modules/course` and `src/modules/exam-category` to Prisma (`prisma.course`, `prisma.lesson`, `prisma.category`); remove `course.model.ts`, `examCategory.model.js`.                                                                                                                                                                       | M2        | Survey |
| 8   | Assessment & Testing Modules                    | Migrate `src/modules/test`, `src/modules/test-series`, `src/modules/quiz`, `src/modules/aiQuiz` to Prisma; remove `test.model.ts`, `question.model.ts`, `testAttempt.model.ts`, `testSeries.model.js`, `quiz.model.js`, `quizAttempt.model.js`, `generatedQuiz.model.js`.                                                                              | M3        | Survey |
| 9   | Academic Auxiliary Modules                      | Migrate `src/modules/attendance`, `src/modules/leaderboard`, `src/modules/library` to Prisma; remove `attendance.model.ts`, `library.model.ts`.                                                                                                                                                                                                        | M3        | Survey |
| 10  | Enrollment & Certificate Migration              | Migrate `src/modules/enrollment` (`enrollment.controller.js`, `certificate.controller.js`) to Prisma; remove `enrollment.model.js`.                                                                                                                                                                                                                    | M4        | Survey |
| 11  | Commerce & Feedback Modules                     | Migrate `src/modules/payment`, `src/modules/coupon`, `src/modules/review`, `src/modules/wishlist`, `src/modules/subscription`, `src/modules/affiliate` to Prisma; remove respective `*.model.*` files.                                                                                                                                                 | M4        | Survey |
| 12  | Community & Operational Modules                 | Migrate `src/modules/discussion`, `src/modules/note`, `src/modules/notification`, `src/modules/support`, `src/modules/parent`, `src/modules/blog`, `src/modules/badge`, `src/modules/apikey`, `src/modules/audit`, `src/modules/gdpr`, `src/modules/upload`, `src/modules/admin`, `src/modules/search` to Prisma; remove respective `*.model.*` files. | M4        | Survey |
| 13  | Final Model Removal & Zero Import Verification  | Delete all 33 `*.model.*` files, `models/index.js`, `models/plugins/`, verify zero Mongoose imports in `src/modules/`.                                                                                                                                                                                                                                 | M5        | Survey |
| 14  | Server Startup & Dev Verification               | Verify `npm run dev` in `server/` starts without Mongoose errors or crashes.                                                                                                                                                                                                                                                                           | M5        | Survey |
| 15  | E2E Test Suite Pass (Tiers 1-4)                 | Verify 100% of E2E test suite passes against Prisma-backed controllers and routes.                                                                                                                                                                                                                                                                     | M5        | Survey |
| 16  | Adversarial Hardening & Forensic Audit (Tier 5) | Adversarial test coverage and forensic integrity audit.                                                                                                                                                                                                                                                                                                | M5        | Survey |

## Milestones

| #   | Name                                          | Scope                                                                                                                                                                                                                                                                         | Dependencies   | Status      |
| --- | --------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------- | ----------- |
| M1  | Core Foundation & Infrastructure              | Server startup (`src/server.js`, `src/config/database.js`, `src/config/index.js`, `src/instrument.js`), Core repositories (`src/core/*`), Middlewares (`auth.js`, `tenant.middleware.js`, `errorHandler.js`, `auditLog.js`, `src/app.js`), Prisma Schema update & generate    | None           | DONE        |
| M2  | Core Identity & Learning Modules              | `user`, `auth`, `institute`, `course`, `exam-category` modules: controllers, services, repositories, DTOs migrated to Prisma; Mongoose models removed.                                                                                                                        | M1             | IN_PROGRESS |
| M3  | Assessment & Academic Modules                 | `test`, `test-series`, `quiz`, `aiQuiz`, `attendance`, `leaderboard`, `library` modules: controllers, services, repositories migrated to Prisma; Mongoose models removed.                                                                                                     | M1, M2         | PLANNED     |
| M4  | Commerce, Community & Admin Modules           | `enrollment`, `payment`, `coupon`, `review`, `wishlist`, `subscription`, `affiliate`, `discussion`, `note`, `notification`, `support`, `parent`, `blog`, `badge`, `apikey`, `audit`, `gdpr`, `upload`, `admin`, `search` modules migrated to Prisma; Mongoose models removed. | M1, M2         | PLANNED     |
| M5  | Final Integration, Test Pass & Forensic Audit | Remove all remaining Mongoose files, verify zero mongoose imports in `src/modules/`, verify `npm run dev` startup, pass 100% E2E test suite, adversarial hardening & forensic audit.                                                                                          | M1, M2, M3, M4 | PLANNED     |

## Interface Contracts

### Centralized Prisma Client

- Path: `server/src/config/prisma.js`
- Export: `import { prisma } from '../config/prisma.js'` (or relative path).
- Direct query standard:
  - `prisma.user.*`, `prisma.institute.*`, `prisma.category.*`, `prisma.course.*`, `prisma.lesson.*`, `prisma.enrollment.*`, `prisma.test.*`, `prisma.testAttempt.*`, `prisma.quiz.*`, `prisma.quizAttempt.*`, `prisma.payment.*`, `prisma.review.*`, `prisma.blog.*`, `prisma.coupon.*` (and extended models).
  - IDs are UUID strings (`id`), not `_id` ObjectIds.

### Base Repository Contract (`src/core/base.repository.ts`)

- Generic class interacting with a delegate Prisma model (e.g. `prisma[modelName]`).
- Methods: `findMany(args)`, `findUnique(args)`, `findFirst(args)`, `create(data)`, `update(id, data)`, `delete(id)`, `count(args)`.

### Tenant Repository Contract (`src/core/tenant.repository.ts`)

- Automatically injects tenant scope (`tenantId` or `instituteId`) from `TenantContext` when available.

## Code Layout

- `server/prisma/schema.prisma`: Authoritative database schema definitions.
- `server/src/config/prisma.js`: Centralized Prisma Client singleton.
- `server/src/core/`: Base repositories, base service, base controller, tenant context.
- `server/src/modules/<module-name>/`: Module controllers, services, repositories, routes, DTOs, validations. (NO `*.model.ts` or `*.model.js` files allowed).
- `server/src/middleware/`: Express middlewares using Prisma Client.
- `server/src/server.js`: Server bootstrap and Prisma connection lifecycle.
- `server/src/app.js`: Express application setup and route mounting.
