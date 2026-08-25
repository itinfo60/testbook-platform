# BRIEFING — 2026-08-23T08:12:00Z

## Mission

Conduct a comprehensive, read-only survey of the server architecture, startup process, database connections, and all modules in `server/src/modules/` to support the Mongoose to Prisma migration.

## 🔒 My Identity

- Archetype: explorer
- Roles: Teamwork explorer
- Working directory: /Users/balveerchoudhary/testbook-platform/.agents/teamwork_preview_explorer_survey_3
- Original parent: f013bc32-e009-4dea-a9ad-b78e9ce23022
- Milestone: Server Architecture & Modules Survey

## 🔒 Key Constraints

- Read-only investigation — do NOT implement
- Survey server architecture, entrypoint, npm scripts, typescript config, db connections, all modules in server/src/modules/
- Produce a structured handoff report in 5-component format

## Current Parent

- Conversation ID: f013bc32-e009-4dea-a9ad-b78e9ce23022
- Updated: not yet

## Investigation State

- **Explored paths**:
  - `server/package.json`, `server/tsconfig.json`, `server/prisma.config.ts`, `server/prisma/schema.prisma`, `server/vitest.config.js`, `tests/setup.js`
  - `server/src/server.js`, `server/src/app.js`, `server/src/cluster.js`, `server/src/instrument.js`
  - `server/src/config/*` (`database.js`, `prisma.js`, `index.js`, `redis.js`, `passport.js`, etc.)
  - `server/src/core/*` (`base.repository.ts`, `tenant.repository.ts`, `base.service.ts`, `base.controller.ts`, `tenant.context.ts`, `api-error.ts`, `api-response.ts`)
  - `server/src/models/*` (`index.js`, `settings.model.ts`, `plugins/*`)
  - `server/src/middleware/*`, `server/src/workers/*`, `server/src/queues/*`, `server/src/sockets/*`, `server/src/utils/*`
  - All 34 modules in `server/src/modules/*` (controllers, routes, services, repositories, models, DTOs, validations)
- **Key findings**:
  - Exactly 34 modules in `server/src/modules/`, containing 36 controllers, 35 route files, 18 services, 16 repositories, 33 Mongoose model files, 14 DTOs, and 18 validation files.
  - Startup flow initializes Mongoose via `database.connect()` in `src/server.js` using `config.mongoose.url` in `src/config/database.js`. Prisma client is already defined in `src/config/prisma.js` using `@prisma/adapter-pg` with `DATABASE_URL`.
  - Multiple non-module files also have Mongoose dependencies (`src/instrument.js`, `src/middleware/auth.js`, `src/middleware/tenant.middleware.js`, `src/middleware/errorHandler.js`, `src/app.js` sitemap & mongoSanitize, `src/workers/*`, `tests/setup.js`).
- **Unexplored areas**: None within server architecture survey scope.

## Key Decisions Made

- Fully documented all 34 modules, their internal architecture, and their Mongoose touchpoints.
- Detailed migration considerations between Mongoose query patterns and Prisma Client API.

## Artifact Index

- handoff.md — Complete Server Architecture & Modules Survey report
- progress.md — Liveness and progress tracking
