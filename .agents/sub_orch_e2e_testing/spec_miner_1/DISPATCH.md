# Dispatch: Spec Miner 1 (Server Startup, Scan & Core Auth APIs)

## Mission

Investigate and document precise requirements, contracts, and testable interfaces for:

1. Server Startup and Dev Boot (`src/server.js`, `src/app.js`, `src/config/database.js`, `src/config/prisma.js`, `src/instrument.js`).
2. Mongoose Static Scan Verification: rules for zero mongoose imports (`import mongoose`, `require('mongoose')`) and deletion of `*.model.ts`/`*.model.js` files in `src/modules/`.
3. Auth & User API contracts (`src/modules/auth`, `src/modules/user`):
   - Endpoints (e.g., register, login, refresh token, profile, update profile).
   - Expected payload structures, response status codes, error responses, validation errors.
   - Prisma models involved (`User`, `Institute`, `UserRole`, etc.).

## Files to Read

- `/Users/balveerchoudhary/testbook-platform/.agents/ORIGINAL_REQUEST.md`
- `/Users/balveerchoudhary/testbook-platform/PROJECT.md`
- `/Users/balveerchoudhary/testbook-platform/TEST_INFRA.md`
- `/Users/balveerchoudhary/testbook-platform/server/prisma/schema.prisma`
- `/Users/balveerchoudhary/testbook-platform/server/src/app.js`
- `/Users/balveerchoudhary/testbook-platform/server/src/server.js`
- `/Users/balveerchoudhary/testbook-platform/server/src/modules/auth/`
- `/Users/balveerchoudhary/testbook-platform/server/src/modules/user/`

## Output

Write your findings report to `/Users/balveerchoudhary/testbook-platform/.agents/sub_orch_e2e_testing/spec_miner_1/handoff.md`.
Report back to the E2E Testing Sub-Orchestrator when complete.
