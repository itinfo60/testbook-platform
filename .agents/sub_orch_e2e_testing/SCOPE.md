# Scope: E2E Testing Track

## Mission

Design and build a comprehensive, automated E2E test suite verifying the Mongoose-to-Prisma migration across `server/`. Derives test cases independently from `ORIGINAL_REQUEST.md`, `PROJECT.md`, and `TEST_INFRA.md`.

## Architecture & Requirements

- Opaque-box, requirement-driven testing.
- Target coverage across 4 tiers:
  - Tier 1: Feature Coverage (>=5 tests per feature area: Server startup, Mongoose scan, Auth, Course, Test, Enrollment, Admin).
  - Tier 2: Boundary & Corner Cases (>=5 tests per feature area).
  - Tier 3: Cross-Feature Combinations (Pairwise coverage).
  - Tier 4: Real-World Application Workloads (User flows, enrollment & payment flows, test attempt evaluations).
- Automated test runner that outputs clear PASS/FAIL signals with exit code 0.
- Publishes `TEST_READY.md` at project root `/Users/balveerchoudhary/testbook-platform/TEST_READY.md` when complete.

## Relevant Files

- `/Users/balveerchoudhary/testbook-platform/.agents/ORIGINAL_REQUEST.md`
- `/Users/balveerchoudhary/testbook-platform/PROJECT.md`
- `/Users/balveerchoudhary/testbook-platform/TEST_INFRA.md`
- Target test directory: `/Users/balveerchoudhary/testbook-platform/server/tests/`
