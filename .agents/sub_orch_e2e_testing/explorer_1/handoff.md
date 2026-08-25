# Handoff Report: E2E Test Harness Architecture & Suite Design

- **Author**: Explorer 1 (E2E Testing Track)
- **Recipient**: E2E Testing Sub-Orchestrator (`sub_orch_e2e_testing`) / Test Writer Agent
- **Target Path**: `server/tests/e2e/`
- **Target Test Count**: 82 test cases minimum (Tiers 1 to 4)

---

## 1. Observation

Direct observations from inspecting the codebase, configuration, and dependencies:

### 1.1 Test Runner & Runtime Environment

- `server/package.json` (lines 6-18, 76-81):
  - Application type is ECMAScript Modules (`"type": "module"`).
  - Vitest is installed at version `^4.1.7` (`"vitest": "^4.1.7"`), Node runtime is `v26.5.0`, tsx is installed at `^4.22.3`, Supertest is installed at `^7.2.2` with `@types/supertest: ^7.2.0`.
  - Default test script in `package.json` is `"test": "NODE_ENV=test vitest run"`.
  - Command `npx vitest --version` verified execution output: `vitest/4.1.7 darwin-arm64 node-v26.5.0` (exit code 0).
- `server/vitest.config.js` (lines 1-17):
  - Configures `environment: 'node'`, `setupFiles: ['./tests/setup.js']`, `include: ['tests/**/*.test.{js,ts}']`, `testTimeout: 30000`.
- `server/tests/setup.js` (lines 1-40):
  - Existing legacy test setup relies on `mongodb-memory-server` and `mongoose.connect()` / `mongoose.disconnect()`.
  - Global `afterEach` attempts collection cleanup on `mongoose.connection.collections`.
  - As Mongoose is phased out for Prisma, E2E tests need a dedicated, isolated test setup (`server/tests/e2e/setup.js`) decoupled from Mongoose and MongoDB Memory Server.

### 1.2 Express Application & Middleware Architecture

- `server/src/app.js` (lines 1-399):
  - Exports default Express app: `export default app;` (line 398).
  - Handles rate limiting: bypassed when `config.env === 'test'` (lines 184-187).
  - Handles BullMQ queues & Bull Board: initialized only when `process.env.NODE_ENV !== 'test'` (lines 88-105).
  - Health check endpoint exists at `GET /health` returning `{ success: true, status: 'healthy', ... }` (lines 193-206).
  - API routes mounted under prefix `/api/v1` (lines 209-249) across 34 module routes (`auth`, `courses`, `categories`, `tests`, `test-series`, `reviews`, `blogs`, `badges`, `leaderboard`, `settings`, `enrollments`, `quizzes`, `admin`, `payments`, `coupons`, `notifications`, `wishlist`, `discussions`, `notes`, `institutes`, `subscriptions`, `ai`, `ai-quiz`, `live-classes`, `audit-logs`, `gdpr`, `api-keys`, `library`, `affiliate`, `parent`, `attendance`, `uploads`, `search`, `support`).
  - Tenant isolation middleware (`tenantIdentification`, `requireTenant`, `optionalTenant`) checks headers `X-Tenant-Id` / `X-Tenant-Subdomain`.

### 1.3 Prisma Client & Database Model Inventory

- `server/src/config/prisma.js` (lines 1-18):
  - Configured with `PrismaClient` using `@prisma/adapter-pg` and PostgreSQL connection pool from `process.env.DATABASE_URL`.
- `server/prisma/schema.prisma` (lines 1-230):
  - Contains 12 core models: `User`, `Institute`, `Category`, `Course`, `Lesson`, `Enrollment`, `Test`, `TestAttempt`, `Quiz`, `QuizAttempt`, `Payment`, `Review`, `Blog`, `Coupon`.
  - Primary keys are UUID strings (`id String @id @default(uuid())`).

### 1.4 Test Infrastructure Requirements (`TEST_INFRA.md`)

- Requirements breakdown:
  - **Feature 1 (F1)**: Server Startup & Dev Boot (AC 1)
  - **Feature 2 (F2)**: Zero Mongoose Modules Scan (AC 2)
  - **Feature 3 (F3)**: Core Auth & Users API (R1, R2)
  - **Feature 4 (F4)**: Course & Learning API (R1, R2)
  - **Feature 5 (F5)**: Assessments & Quizzes API (R1, R2)
  - **Feature 6 (F6)**: Enrollments & Payments API (R1, R2)
  - **Feature 7 (F7)**: Community, Admin & Operations (R1, R2)
- Test Hierarchy thresholds:
  - Tier 1: Feature Coverage (>=35 tests: 5 per feature area across 7 areas)
  - Tier 2: Boundary & Corner Cases (>=35 tests: 5 per feature area across 7 areas)
  - Tier 3: Pairwise Cross-Feature Interactions (>=7 tests)
  - Tier 4: Real-World Workload Scenarios (>=5 tests)
  - Total Target: >=82 tests.

---

## 2. Logic Chain

1. **Selection of Test Execution Engine**:
   - _Observation 1.1_: Vitest 4.1.7, tsx 4.22.3, and Supertest 7.2.2 are already installed and integrated with TypeScript and ESM.
   - _Inference_: Vitest is the ideal runner for `server/tests/e2e/`. It handles TypeScript (`.ts`) and ESM (`.js`) path resolution natively, supports parallel or isolated execution, provides mock capabilities (`vi.mock`, `vi.spyOn`), and produces standard TAP/JUnit/console test reports with exit code 0 on pass and 1 on fail.
   - _Decision_: Structure the E2E suite as standard Vitest test suites with a complementary standalone executable runner `server/tests/e2e/runner.js` that can execute the suite and print an aggregated tier-by-tier compliance report.

2. **Isolation from External Infrastructure**:
   - _Observation 1.1 & 1.2_: `app.js` skips Bull Board and rate-limiting in test mode. However, Redis (`src/config/redis.js`) and Prisma Client (`src/config/prisma.js`) could throw if external network connections are absent.
   - _Inference_: The E2E harness must provide mock/in-memory stubs for Redis (`Map` based store) and Prisma client delegates in `server/tests/e2e/helpers/` and `server/tests/e2e/setup.js`.
   - _Decision_: Create `server/tests/e2e/setup.js` that intercepts Redis commands with an in-memory mock and configures required test environment variables (`JWT_SECRET`, `NODE_ENV=test`, `DATABASE_URL`).

3. **Multi-Tier Directory Structure Design**:
   - _Observation 1.4_: Requirements mandate 4 Tiers across 7 feature areas totaling >=82 tests.
   - _Inference_: Grouping tests by Tier directory ensures clear separation of feature coverage, boundary conditions, combinatorial interaction, and workload journeys.
   - _Decision_: Map the 7 feature areas cleanly into dedicated test files per tier:
     - Tier 1: 7 files × 5 tests = 35 tests.
     - Tier 2: 7 files × 5 tests = 35 tests.
     - Tier 3: 1 file × 7 pairwise tests = 7 tests.
     - Tier 4: 1 file × 5 workload scenarios = 5 tests.
     - Sum: 35 + 35 + 7 + 5 = **82 tests**.

4. **Zero Mongoose & Static Validation Strategy**:
   - _Observation 1.3 & 1.4_: Feature 2 requires static scanning of `src/modules/` to verify zero `import mongoose`, zero `require('mongoose')`, and absence of `.model.ts` / `.model.js` files.
   - _Inference_: These checks can be performed programmatically inside Tier 1 and Tier 2 scan tests via Node.js filesystem traversal and regex parsing.
   - _Decision_: Build `server/tests/e2e/helpers/scanner.helper.js` containing reusable AST/regex scanning functions used by `f2-zero-mongoose-scan.test.js` and `f2-scan-boundaries.test.js`.

---

## 3. Caveats

1. **Prisma Model Migration Phase Alignment**:
   - The codebase is transitioning across Milestones M1 through M5. Some modules may still have Mongoose files until Milestone M4/M5 completion. The E2E tests are designed to validate the target Prisma architecture (UUID identifiers, Prisma repository operations, zero Mongoose imports).
2. **Database Integration Modes**:
   - When running in an environment without a running PostgreSQL instance, `server/tests/e2e/helpers/prisma.helper.js` enables mock/in-memory fixture delegation. If a live PostgreSQL database is configured via `DATABASE_URL`, tests can run against real database transactions with automatic rollback.
3. **Queue / Redis Mocking**:
   - Background BullMQ workers are not spawned during test runs (`NODE_ENV=test`); queue jobs are stubbed via `setup.js`.

---

## 4. Conclusion & Architecture Proposal

### 4.1 Directory Structure Specification

```
server/tests/e2e/
├── setup.js                                # Global E2E test setup & environment configuration
├── runner.js                               # Standalone CLI test runner & tier metrics aggregator
├── helpers/
│   ├── auth.helper.js                      # JWT token generator, role headers (student/teacher/admin), mock users
│   ├── prisma.helper.js                    # Centralized Prisma mock/fixture manager & seeding utilities
│   ├── http.helper.js                      # Supertest agent factory with default tenant headers
│   └── scanner.helper.js                   # Static code scanner for Mongoose imports & schema files
├── tier1-features/                         # 35 tests (5 tests x 7 features)
│   ├── f1-server-startup.test.js           # 5 tests: Server dev boot, /health probe, config validation, logger, lifecycle
│   ├── f2-zero-mongoose-scan.test.js       # 5 tests: Zero import mongoose, zero require mongoose, no *.model.*, Prisma repo imports, schema completeness
│   ├── f3-auth-users.test.js               # 5 tests: User register, login JWT, refresh token, get profile, RBAC check
│   ├── f4-courses-learning.test.js         # 5 tests: Create course, list catalog, get course details, add lesson, category link
│   ├── f5-assessments-quizzes.test.js      # 5 tests: Create test, submit attempt, calculate score, create quiz, quiz attempt
│   ├── f6-enrollments-payments.test.js     # 5 tests: Course enrollment, check status, create payment, verify payment, apply coupon
│   └── f7-community-admin.test.js          # 5 tests: Create review, list reviews, create blog, discussion thread, admin stats
├── tier2-boundaries/                       # 35 tests (5 tests x 7 features)
│   ├── f1-startup-boundaries.test.js       # 5 tests: Missing JWT_SECRET, invalid PORT fallback, DB timeout handling, unhandled rejection, SIGINT handling
│   ├── f2-scan-boundaries.test.js          # 5 tests: Commented mongoose lines, nested subdirs, TS/JS extensions, dynamic imports, schema filename audit
│   ├── f3-auth-boundaries.test.js          # 5 tests: Duplicate email 409, short password, expired token 401, wrong role 403, missing required fields 400
│   ├── f4-course-boundaries.test.js        # 5 tests: Duplicate slug 409, non-existent course 404, negative price 400, unauthorized edit 403, empty title 400
│   ├── f5-assessment-boundaries.test.js    # 5 tests: Empty answers submission, duration exceeded attempt, malformed questions JSON, unpublished quiz 404, boundary score [0, total]
│   ├── f6-enrollment-boundaries.test.js    # 5 tests: Duplicate enrollment 409, failed payment status, expired coupon 400, coupon cap limit, negative payment amount 400
│   └── f7-admin-boundaries.test.js         # 5 tests: Non-admin 403, review rating out of bounds [1-5], duplicate review 409, draft blog visibility, search SQLi safety
├── tier3-pairwise/                         # 7 cross-feature interaction tests
│   └── cross-feature-interactions.test.js  # 7 tests:
│                                           #   T1: Auth (F3) + Course (F4) — Teacher authenticates & creates course
│                                           #   T2: Course (F4) + Enrollment (F6) — Student browses course, applies coupon & enrolls
│                                           #   T3: Enrollment (F6) + Assessment (F5) — Enrolled student takes exam & submits
│                                           #   T4: Assessment (F5) + Review (F7) — Student completes test & posts course review
│                                           #   T5: Auth (F3) + Admin (F7) — Admin authenticates & views aggregate analytics
│                                           #   T6: Zero Mongoose (F2) + API Routes (F3-F7) — Route handlers execute pure Prisma queries
│                                           #   T7: Startup Boot (F1) + Multi-Tenant Isolation (F3, F4, F6) — Tenant isolation verified
└── tier4-workloads/                        # 5 end-to-end real-world user workflows
    └── real-world-workloads.test.js        # 5 tests:
                                            #   W1: Complete Student Journey (Register -> Login -> Browse -> Profile update)
                                            #   W2: Teacher Publishing Pipeline (Login -> Create Category -> Create Course -> Add Lessons -> Publish)
                                            #   W3: Assessment & Grading Pipeline (Create Test -> Student Attempt -> Auto Score Calculation -> View Report)
                                            #   W4: Commerce & Checkout Flow (Course Selection -> Coupon Discount -> Mock Payment -> Active Enrollment)
                                            #   W5: Admin Management & Platform Audit (Platform bootstrap -> Multi-entity creation -> Analytics -> Audit)
```

---

### 4.2 Detailed Test Case Matrix (82 Tests)

| #   | Tier   | Feature Area    | Test File                            | Test Description / Case                                                                                                  |
| --- | ------ | --------------- | ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------ |
| 1   | Tier 1 | F1: Startup     | `f1-server-startup.test.js`          | GET `/health` returns 200 with `status: healthy` and uptime                                                              |
| 2   | Tier 1 | F1: Startup     | `f1-server-startup.test.js`          | App loads without Mongoose connection errors in test environment                                                         |
| 3   | Tier 1 | F1: Startup     | `f1-server-startup.test.js`          | API root `/api/v1` returns API documentation and endpoint registry                                                       |
| 4   | Tier 1 | F1: Startup     | `f1-server-startup.test.js`          | Request ID middleware attaches `req.id` / `x-request-id`                                                                 |
| 5   | Tier 1 | F1: Startup     | `f1-server-startup.test.js`          | CORS headers allow configured origin and methods                                                                         |
| 6   | Tier 1 | F2: Scan        | `f2-zero-mongoose-scan.test.js`      | Zero occurrences of `import mongoose` across all files in `src/modules/`                                                 |
| 7   | Tier 1 | F2: Scan        | `f2-zero-mongoose-scan.test.js`      | Zero occurrences of `require('mongoose')` or `require("mongoose")` in `src/modules/`                                     |
| 8   | Tier 1 | F2: Scan        | `f2-zero-mongoose-scan.test.js`      | Zero `*.model.ts` or `*.model.js` schema files present in `src/modules/`                                                 |
| 9   | Tier 1 | F2: Scan        | `f2-zero-mongoose-scan.test.js`      | All module repositories import Prisma Client from `config/prisma.js`                                                     |
| 10  | Tier 1 | F2: Scan        | `f2-zero-mongoose-scan.test.js`      | Prisma schema defines all required entities without Mongoose types                                                       |
| 11  | Tier 1 | F3: Auth        | `f3-auth-users.test.js`              | POST `/api/v1/auth/register` creates user and returns JWT access token                                                   |
| 12  | Tier 1 | F3: Auth        | `f3-auth-users.test.js`              | POST `/api/v1/auth/login` validates credentials and returns tokens                                                       |
| 13  | Tier 1 | F3: Auth        | `f3-auth-users.test.js`              | POST `/api/v1/auth/refresh-token` refreshes expired access token                                                         |
| 14  | Tier 1 | F3: Auth        | `f3-auth-users.test.js`              | GET `/api/v1/auth/me` returns current user profile using Prisma User ID                                                  |
| 15  | Tier 1 | F3: Auth        | `f3-auth-users.test.js`              | Role-based middleware allows student access and denies unauthorized access                                               |
| 16  | Tier 1 | F4: Courses     | `f4-courses-learning.test.js`        | POST `/api/v1/courses` creates a new course linked to teacher                                                            |
| 17  | Tier 1 | F4: Courses     | `f4-courses-learning.test.js`        | GET `/api/v1/courses` lists published courses with pagination                                                            |
| 18  | Tier 1 | F4: Courses     | `f4-courses-learning.test.js`        | GET `/api/v1/courses/:id` retrieves single course with lessons                                                           |
| 19  | Tier 1 | F4: Courses     | `f4-courses-learning.test.js`        | POST `/api/v1/courses/:id/lessons` adds a lesson to course                                                               |
| 20  | Tier 1 | F4: Courses     | `f4-courses-learning.test.js`        | GET `/api/v1/categories` lists active categories                                                                         |
| 21  | Tier 1 | F5: Assessments | `f5-assessments-quizzes.test.js`     | POST `/api/v1/tests` creates a new test with questions JSON                                                              |
| 22  | Tier 1 | F5: Assessments | `f5-assessments-quizzes.test.js`     | GET `/api/v1/tests` lists published tests                                                                                |
| 23  | Tier 1 | F5: Assessments | `f5-assessments-quizzes.test.js`     | POST `/api/v1/tests/:id/attempt` submits test answers and records score                                                  |
| 24  | Tier 1 | F5: Assessments | `f5-assessments-quizzes.test.js`     | POST `/api/v1/quizzes` creates a new quiz                                                                                |
| 25  | Tier 1 | F5: Assessments | `f5-assessments-quizzes.test.js`     | POST `/api/v1/quizzes/:id/attempt` submits quiz attempt and records score                                                |
| 26  | Tier 1 | F6: Commerce    | `f6-enrollments-payments.test.js`    | POST `/api/v1/enrollments` enrolls user in course                                                                        |
| 27  | Tier 1 | F6: Commerce    | `f6-enrollments-payments.test.js`    | GET `/api/v1/enrollments/my-courses` lists user active enrollments                                                       |
| 28  | Tier 1 | F6: Commerce    | `f6-enrollments-payments.test.js`    | POST `/api/v1/payments/order` creates a payment order                                                                    |
| 29  | Tier 1 | F6: Commerce    | `f6-enrollments-payments.test.js`    | POST `/api/v1/payments/verify` verifies mock/gateway transaction                                                         |
| 30  | Tier 1 | F6: Commerce    | `f6-enrollments-payments.test.js`    | POST `/api/v1/coupons/apply` calculates coupon discount percentage                                                       |
| 31  | Tier 1 | F7: Admin/Ops   | `f7-community-admin.test.js`         | POST `/api/v1/reviews` creates a course review and rating                                                                |
| 32  | Tier 1 | F7: Admin/Ops   | `f7-community-admin.test.js`         | GET `/api/v1/reviews/course/:id` returns course reviews                                                                  |
| 33  | Tier 1 | F7: Admin/Ops   | `f7-community-admin.test.js`         | POST `/api/v1/blogs` creates a blog post in draft/published status                                                       |
| 34  | Tier 1 | F7: Admin/Ops   | `f7-community-admin.test.js`         | GET `/api/v1/discussions` retrieves discussion threads for course                                                        |
| 35  | Tier 1 | F7: Admin/Ops   | `f7-community-admin.test.js`         | GET `/api/v1/admin/dashboard` returns aggregated stats across Prisma entities                                            |
| 36  | Tier 2 | F1: Startup     | `f1-startup-boundaries.test.js`      | Fails fast with descriptive error if `JWT_SECRET` is less than 32 chars                                                  |
| 37  | Tier 2 | F1: Startup     | `f1-startup-boundaries.test.js`      | Falls back to default port 5000 if `PORT` is not specified                                                               |
| 38  | Tier 2 | F1: Startup     | `f1-startup-boundaries.test.js`      | Database adapter reconnects gracefully on transient failure                                                              |
| 39  | Tier 2 | F1: Startup     | `f1-startup-boundaries.test.js`      | Process handles `unhandledRejection` without unhandled crash                                                             |
| 40  | Tier 2 | F1: Startup     | `f1-startup-boundaries.test.js`      | `SIGTERM` signal initiates graceful connection teardown                                                                  |
| 41  | Tier 2 | F2: Scan        | `f2-scan-boundaries.test.js`         | Ignores commented-out mentions of mongoose in comments/docs                                                              |
| 42  | Tier 2 | F2: Scan        | `f2-scan-boundaries.test.js`         | Recursively scans arbitrary deeply nested directories in `src/modules/`                                                  |
| 43  | Tier 2 | F2: Scan        | `f2-scan-boundaries.test.js`         | Checks both `.ts` and `.js` source files for forbidden imports                                                           |
| 44  | Tier 2 | F2: Scan        | `f2-scan-boundaries.test.js`         | Detects dynamic `import('mongoose')` and `require('mongoose')`                                                           |
| 45  | Tier 2 | F2: Scan        | `f2-scan-boundaries.test.js`         | Validates that no `*.schema.ts` or `*.model.js` files exist in any subfolder                                             |
| 46  | Tier 2 | F3: Auth        | `f3-auth-boundaries.test.js`         | POST `/api/v1/auth/register` with duplicate email returns 409 Conflict                                                   |
| 47  | Tier 2 | F3: Auth        | `f3-auth-boundaries.test.js`         | POST `/api/v1/auth/register` with missing required fields returns 400 Bad Request                                        |
| 48  | Tier 2 | F3: Auth        | `f3-auth-boundaries.test.js`         | POST `/api/v1/auth/login` with incorrect password returns 401 Unauthorized                                               |
| 49  | Tier 2 | F3: Auth        | `f3-auth-boundaries.test.js`         | Request with expired or malformed JWT token returns 401 Unauthorized                                                     |
| 50  | Tier 2 | F3: Auth        | `f3-auth-boundaries.test.js`         | Student accessing admin route `/api/v1/admin` returns 403 Forbidden                                                      |
| 51  | Tier 2 | F4: Courses     | `f4-course-boundaries.test.js`       | POST `/api/v1/courses` with duplicate slug returns 409 Conflict                                                          |
| 52  | Tier 2 | F4: Courses     | `f4-course-boundaries.test.js`       | GET `/api/v1/courses/:id` with non-existent UUID returns 404 Not Found                                                   |
| 53  | Tier 2 | F4: Courses     | `f4-course-boundaries.test.js`       | POST `/api/v1/courses` with negative price returns 400 Bad Request                                                       |
| 54  | Tier 2 | F4: Courses     | `f4-course-boundaries.test.js`       | PUT `/api/v1/courses/:id` by unauthorized user returns 403 Forbidden                                                     |
| 55  | Tier 2 | F4: Courses     | `f4-course-boundaries.test.js`       | POST `/api/v1/courses` with empty title/description fails validation with 400                                            |
| 56  | Tier 2 | F5: Assessments | `f5-assessment-boundaries.test.js`   | POST `/api/v1/tests/:id/attempt` with empty answers payload returns 400                                                  |
| 57  | Tier 2 | F5: Assessments | `f5-assessment-boundaries.test.js`   | Submitting attempt for non-existent test ID returns 404 Not Found                                                        |
| 58  | Tier 2 | F5: Assessments | `f5-assessment-boundaries.test.js`   | Test creation with empty questions array returns 400 Validation Error                                                    |
| 59  | Tier 2 | F5: Assessments | `f5-assessment-boundaries.test.js`   | Attempting unpublished quiz returns 404 / 403                                                                            |
| 60  | Tier 2 | F5: Assessments | `f5-assessment-boundaries.test.js`   | Score boundary check: score cannot exceed total marks or fall below 0                                                    |
| 61  | Tier 2 | F6: Commerce    | `f6-enrollment-boundaries.test.js`   | Duplicate enrollment for already enrolled course returns 409 Conflict                                                    |
| 62  | Tier 2 | F6: Commerce    | `f6-enrollment-boundaries.test.js`   | Payment verification with invalid signature/hash returns 400 Bad Request                                                 |
| 63  | Tier 2 | F6: Commerce    | `f6-enrollment-boundaries.test.js`   | Applying expired coupon returns 400 Coupon Expired                                                                       |
| 64  | Tier 2 | F6: Commerce    | `f6-enrollment-boundaries.test.js`   | Coupon discount respects maxDiscount cap                                                                                 |
| 65  | Tier 2 | F6: Commerce    | `f6-enrollment-boundaries.test.js`   | Order creation with negative/zero amount returns 400 Bad Request                                                         |
| 66  | Tier 2 | F7: Admin/Ops   | `f7-admin-boundaries.test.js`        | Non-admin user access to `/api/v1/admin/dashboard` returns 403 Forbidden                                                 |
| 67  | Tier 2 | F7: Admin/Ops   | `f7-admin-boundaries.test.js`        | Review creation with rating > 5 or < 1 returns 400 Bad Request                                                           |
| 68  | Tier 2 | F7: Admin/Ops   | `f7-admin-boundaries.test.js`        | Duplicate review by same user on same course returns 409 Conflict                                                        |
| 69  | Tier 2 | F7: Admin/Ops   | `f7-admin-boundaries.test.js`        | Draft blog post is inaccessible to unauthenticated public requests                                                       |
| 70  | Tier 2 | F7: Admin/Ops   | `f7-admin-boundaries.test.js`        | Search endpoint `/api/v1/search` safely handles SQL injection payloads                                                   |
| 71  | Tier 3 | Cross-Feature   | `cross-feature-interactions.test.js` | Pairwise 1: Auth (F3) + Course (F4) — Teacher logs in, creates category, and publishes course                            |
| 72  | Tier 3 | Cross-Feature   | `cross-feature-interactions.test.js` | Pairwise 2: Course (F4) + Commerce (F6) — Student selects course, applies coupon, creates payment                        |
| 73  | Tier 3 | Cross-Feature   | `cross-feature-interactions.test.js` | Pairwise 3: Enrollment (F6) + Assessment (F5) — Active enrollment enables student to take course test                    |
| 74  | Tier 3 | Cross-Feature   | `cross-feature-interactions.test.js` | Pairwise 4: Assessment (F5) + Review (F7) — Student completes test and leaves verified rating/review                     |
| 75  | Tier 3 | Cross-Feature   | `cross-feature-interactions.test.js` | Pairwise 5: Auth (F3) + Admin Operations (F7) — Admin authenticates and queries platform-wide stats                      |
| 76  | Tier 3 | Cross-Feature   | `cross-feature-interactions.test.js` | Pairwise 6: Zero Mongoose (F2) + API Handlers (F3-F7) — Endpoints invoke Prisma delegates only                           |
| 77  | Tier 3 | Cross-Feature   | `cross-feature-interactions.test.js` | Pairwise 7: Startup Boot (F1) + Multi-Tenant Isolation (F3, F4, F6) — Tenant scoping isolates records                    |
| 78  | Tier 4 | Workloads       | `real-world-workloads.test.js`       | Workload 1: Student Lifecycle (Register -> Login -> Browse Course -> Update Profile)                                     |
| 79  | Tier 4 | Workloads       | `real-world-workloads.test.js`       | Workload 2: Teacher Course Authoring (Login -> Create Category -> Create Course -> Add Lessons -> Publish)               |
| 80  | Tier 4 | Workloads       | `real-world-workloads.test.js`       | Workload 3: Assessment & Evaluation Pipeline (Create Test -> Student Attempt -> Auto Score Calculation -> View Attempt)  |
| 81  | Tier 4 | Workloads       | `real-world-workloads.test.js`       | Workload 4: End-to-End Checkout & Enrollment (Course Browse -> Apply Coupon -> Mock Payment -> Verify Active Enrollment) |
| 82  | Tier 4 | Workloads       | `real-world-workloads.test.js`       | Workload 5: Platform Operations & Admin Analytics (Multi-role actions -> Admin dashboard aggregation -> Audit logging)   |

---

### 4.3 Key Helper Utility Specifications

1. **`server/tests/e2e/setup.js`**:
   - Sets test environment variables (`NODE_ENV=test`, `PORT=5000`, `JWT_SECRET=supersecrettestjwtkeythatis32charslong!`, `DATABASE_URL=postgresql://test:test@localhost:5432/test`).
   - In-memory mock for `src/config/redis.js` using `Map<string, any>`.
   - Mock for `src/queues/index.js` preventing BullMQ background connections.

2. **`server/tests/e2e/helpers/auth.helper.js`**:
   - `generateToken(userPayload, options)`: generates signed JWT for testing.
   - `getAuthHeaders(role = 'student', tenantId = 'test-tenant-1')`: returns `{ Authorization: 'Bearer ...', 'X-Tenant-Id': tenantId }`.
   - `createTestUser(overrides)`: returns valid user fixture object with UUID id.

3. **`server/tests/e2e/helpers/prisma.helper.js`**:
   - Exports singleton fixture/mock manager for Prisma delegate methods (`prisma.user.*`, `prisma.course.*`, `prisma.lesson.*`, `prisma.enrollment.*`, `prisma.test.*`, `prisma.payment.*`, `prisma.review.*`, `prisma.blog.*`, `prisma.coupon.*`).

4. **`server/tests/e2e/helpers/scanner.helper.js`**:
   - `scanDirectory(dirPath)`: recursive directory walker.
   - `findMongooseImports(dirPath)`: regex scan for `import.*from ['"]mongoose['"]` and `require\(['"]mongoose['"]\)`.
   - `findModelFiles(dirPath)`: searches for `*.model.ts`, `*.model.js`, `*.schema.ts`, `*.schema.js`.

5. **`server/tests/e2e/runner.js`**:
   - Executable CLI runner (`node tests/e2e/runner.js`).
   - Programmatically executes Vitest E2E suite (`npx vitest run tests/e2e`).
   - Aggregates tier-by-tier metrics and displays formatted console table:
     ```
     ┌──────────────────────┬──────────┬──────────┬──────────┬────────┐
     │ Tier                 │ Target   │ Passed   │ Failed   │ Status │
     ├──────────────────────┼──────────┼──────────┼──────────┼────────┤
     │ Tier 1: Features     │ 35       │ 35       │ 0        │ PASS   │
     │ Tier 2: Boundaries   │ 35       │ 35       │ 0        │ PASS   │
     │ Tier 3: Pairwise     │ 7        │ 7        │ 0        │ PASS   │
     │ Tier 4: Workloads    │ 5        │ 5        │ 0        │ PASS   │
     ├──────────────────────┼──────────┼──────────┼──────────┼────────┤
     │ Total E2E Suite      │ 82       │ 82       │ 0        │ PASS   │
     └──────────────────────┴──────────┴──────────┴──────────┴────────┘
     ```

---

## 5. Verification Method

### 5.1 Verification Commands

1. Run all E2E tests via Vitest:
   ```bash
   cd /Users/balveerchoudhary/testbook-platform/server && npx vitest run tests/e2e
   ```
2. Run specific tiers:
   ```bash
   cd /Users/balveerchoudhary/testbook-platform/server && npx vitest run tests/e2e/tier1-features
   cd /Users/balveerchoudhary/testbook-platform/server && npx vitest run tests/e2e/tier2-boundaries
   cd /Users/balveerchoudhary/testbook-platform/server && npx vitest run tests/e2e/tier3-pairwise
   cd /Users/balveerchoudhary/testbook-platform/server && npx vitest run tests/e2e/tier4-workloads
   ```
3. Run master E2E runner:
   ```bash
   cd /Users/balveerchoudhary/testbook-platform/server && node tests/e2e/runner.js
   ```

### 5.2 Pass / Invalidation Criteria

- **Pass Criteria**:
  - Total tests executed >= 82.
  - Zero test failures (exit code 0).
  - Feature 2 scans return 0 Mongoose occurrences in `server/src/modules/`.
  - All endpoint tests exercise Prisma client access patterns without Mongoose models.
- **Invalidation Conditions**:
  - Any test file in `tests/e2e/` imports Mongoose directly or indirectly.
  - Test suite crashes on startup or requires active MongoDB instance.
  - Test count drops below 82 or fails to cover any of the 7 feature areas.
