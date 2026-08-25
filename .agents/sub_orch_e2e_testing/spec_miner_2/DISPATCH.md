# Dispatch: Spec Miner 2 (Learning, Assessments, Commerce, Admin APIs)

## Mission

Investigate and document precise requirements, contracts, and testable interfaces for:

1. Course & Learning APIs (`src/modules/course`, `src/modules/exam-category`):
   - Endpoints for course creation, listing, detail, lessons, category linking.
   - Prisma models involved (`Course`, `Lesson`, `Category`, etc.).
2. Assessments & Quizzes APIs (`src/modules/test`, `src/modules/test-series`, `src/modules/quiz`, `src/modules/aiQuiz`):
   - Endpoints for test creation, test attempt, quiz submission, score calculation.
   - Prisma models involved (`Test`, `TestAttempt`, `Quiz`, `QuizAttempt`, etc.).
3. Commerce & Operations APIs (`src/modules/enrollment`, `src/modules/payment`, `src/modules/coupon`, `src/modules/review`, `src/modules/admin`):
   - Endpoints for enrollment, payment processing/creation, coupon application, reviews, admin dashboard summary/analytics.
   - Prisma models involved (`Enrollment`, `Payment`, `Coupon`, `Review`, etc.).

## Files to Read

- `/Users/balveerchoudhary/testbook-platform/.agents/ORIGINAL_REQUEST.md`
- `/Users/balveerchoudhary/testbook-platform/PROJECT.md`
- `/Users/balveerchoudhary/testbook-platform/TEST_INFRA.md`
- `/Users/balveerchoudhary/testbook-platform/server/prisma/schema.prisma`
- `/Users/balveerchoudhary/testbook-platform/server/src/modules/course/`
- `/Users/balveerchoudhary/testbook-platform/server/src/modules/test/`
- `/Users/balveerchoudhary/testbook-platform/server/src/modules/enrollment/`
- `/Users/balveerchoudhary/testbook-platform/server/src/modules/payment/`
- `/Users/balveerchoudhary/testbook-platform/server/src/modules/admin/`

## Output

Write your findings report to `/Users/balveerchoudhary/testbook-platform/.agents/sub_orch_e2e_testing/spec_miner_2/handoff.md`.
Report back to the E2E Testing Sub-Orchestrator when complete.

## 2026-08-23T08:14:00Z

You are Spec Miner 2 for the E2E Testing Track.
Your working directory is: /Users/balveerchoudhary/testbook-platform/.agents/sub_orch_e2e_testing/spec_miner_2/
Read /Users/balveerchoudhary/testbook-platform/.agents/sub_orch_e2e_testing/spec_miner_2/DISPATCH.md and all referenced files:

- /Users/balveerchoudhary/testbook-platform/.agents/ORIGINAL_REQUEST.md
- /Users/balveerchoudhary/testbook-platform/PROJECT.md
- /Users/balveerchoudhary/testbook-platform/TEST_INFRA.md
- /Users/balveerchoudhary/testbook-platform/server/prisma/schema.prisma
- /Users/balveerchoudhary/testbook-platform/server/src/modules/course/
- /Users/balveerchoudhary/testbook-platform/server/src/modules/test/
- /Users/balveerchoudhary/testbook-platform/server/src/modules/enrollment/
- /Users/balveerchoudhary/testbook-platform/server/src/modules/payment/
- /Users/balveerchoudhary/testbook-platform/server/src/modules/admin/

Investigate Course/Learning APIs, Assessment/Quiz APIs, Commerce/Enrollment/Payment APIs, and Admin APIs.
Write your structured findings to /Users/balveerchoudhary/testbook-platform/.agents/sub_orch_e2e_testing/spec_miner_2/handoff.md.
When finished, send a message back to parent.
