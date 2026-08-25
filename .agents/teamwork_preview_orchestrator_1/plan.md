# Orchestration Plan: Mongoose to Prisma Migration

## Objective

Migrate backend data access layer in `server/` from Mongoose to Prisma:

1. Replace all Mongoose database queries with Prisma Client queries in `server/src/modules/` controllers.
2. Remove Mongoose model/schema files and all mongoose imports from controllers and routes.
3. Ensure server startup (`npm run dev`) runs without Mongoose startup errors.
4. Ensure zero occurrences of `import mongoose` or `require('mongoose')` in `src/modules/`.

## Phased Approach

1. **Phase 0: Survey & Scope Mapping**
   - Dispatch 3 Explorers to map Mongoose usages, schemas, Prisma schema/client, controllers, and startup code.
   - Aggregate findings into `PROJECT.md § Feature Inventory` and architecture.
2. **Phase 1: Architecture & Milestone Decomposition**
   - Define exact milestones (grouped logically by module/domain boundaries or migration layers).
   - Define interface contracts, Prisma client import conventions, and code layout in `PROJECT.md`.
3. **Phase 2: Dual Track Execution**
   - Track A (E2E Testing): Create automated verification suite and runner.
   - Track B (Implementation): Sub-orchestrators / workers migrate modules systematically (Explorer -> Worker -> Reviewer x2 -> Challenger x2 -> Forensic Auditor -> Gate).
4. **Phase 3: Integration & Acceptance Verification**
   - Verify server startup (`npm run dev`) cleanly.
   - Verify zero mongoose imports in `src/modules/`.
   - Run adversarial checks and integrity audit.
5. **Phase 4: Final Synthesis & Human Reporting**
