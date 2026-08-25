# E2E Test Infra: Backend Mongoose to Prisma Migration

## Test Philosophy

- Opaque-box, requirement-driven. Derives from user requirements: zero Mongoose references in `src/modules/`, successful `npm run dev` startup, and functional Prisma CRUD operations across endpoints.
- Methodology: Category-Partition + BVA + Pairwise Combinatorial + Workload Testing.

## Feature Inventory & Coverage Mapping

| #   | Feature / Area                | Requirement Source                                       | Tier 1 | Tier 2 | Tier 3 | Tier 4 |
| --- | ----------------------------- | -------------------------------------------------------- | :----: | :----: | :----: | :----: |
| 1   | Server Startup & Dev Boot     | AC 1: `npm run dev` without Mongoose errors              |   5    |   5    |   ✓    |   ✓    |
| 2   | Zero Mongoose Modules Scan    | AC 2: Zero `mongoose` in `src/modules/`                  |   5    |   5    |   ✓    |   ✓    |
| 3   | Core Auth & Users API         | R1 & R2: User auth, tokens, Prisma User queries          |   5    |   5    |   ✓    |   ✓    |
| 4   | Course & Learning API         | R1 & R2: Courses, Lessons, Categories queries            |   5    |   5    |   ✓    |   ✓    |
| 5   | Assessments & Quizzes API     | R1 & R2: Tests, Quizzes, Attempts queries                |   5    |   5    |   ✓    |   ✓    |
| 6   | Enrollments & Payments API    | R1 & R2: Enrollments, Payments, Coupons queries          |   5    |   5    |   ✓    |   ✓    |
| 7   | Community, Admin & Operations | R1 & R2: Admin aggregations, Reviews, Blogs, Discussions |   5    |   5    |   ✓    |   ✓    |

## Test Architecture

- Test Suite Runner: Executable automated test scripts in `server/tests/e2e/` or test harness.
- Verification checks:
  1. Static audit: Search for `import.*mongoose` and `require(['"]mongoose['"])` in `src/modules/`.
  2. Runtime startup: Execute server startup probe in development mode ensuring zero Mongoose errors.
  3. API Functional Verification: Endpoint tests executing Prisma queries (User, Course, Test, Enrollment, Payment, etc.).
  4. Model Deletion Audit: Check that no `.model.ts` or `.model.js` files remain in `src/modules/`.

## Real-World Application Scenarios (Tier 4)

| #   | Scenario                                               | Features Exercised | Complexity |
| --- | ------------------------------------------------------ | ------------------ | ---------- |
| 1   | User registration, login, profile fetch via Prisma     | F1, F3             | Medium     |
| 2   | Course creation, category linking, lesson retrieval    | F1, F4             | Medium     |
| 3   | Test submission and attempt score calculation          | F1, F5             | High       |
| 4   | Course enrollment, payment creation, coupon validation | F1, F6             | High       |
| 5   | Admin dashboard summary analytics aggregation          | F1, F7             | High       |

## Coverage Thresholds

- Tier 1 (Feature Coverage): >=35 tests (>=5 per feature area)
- Tier 2 (Boundary & Corner Cases): >=35 tests
- Tier 3 (Cross-Feature Combinations): >=7 tests
- Tier 4 (Real-World Application): >=5 tests
- Total E2E test target: >=82 test cases
