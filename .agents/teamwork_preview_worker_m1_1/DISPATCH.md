## 2026-08-23T08:18:35Z

You are the Worker subagent for Milestone 1: Core Foundation & Infrastructure.
Your assigned working directory is: /Users/balveerchoudhary/testbook-platform/.agents/teamwork_preview_worker_m1_1
Workspace root: /Users/balveerchoudhary/testbook-platform
Target server directory: /Users/balveerchoudhary/testbook-platform/server

Mandatory files to read first:

- /Users/balveerchoudhary/testbook-platform/.agents/ORIGINAL_REQUEST.md
- /Users/balveerchoudhary/testbook-platform/PROJECT.md
- /Users/balveerchoudhary/testbook-platform/.agents/sub_orch_milestone_1/SCOPE.md
- /Users/balveerchoudhary/testbook-platform/.agents/teamwork_preview_explorer_m1_1/handoff.md
- /Users/balveerchoudhary/testbook-platform/.agents/teamwork_preview_explorer_m1_2/handoff.md
- /Users/balveerchoudhary/testbook-platform/.agents/teamwork_preview_explorer_m1_3/handoff.md

Your write ownership for Milestone 1:
You exclusively own and must modify:

1. `server/prisma/schema.prisma` (Deploy 35-model schema from `.agents/teamwork_preview_explorer_m1_3/proposed_schema.prisma`)
2. `server/src/server.js`
3. `server/src/config/database.js`
4. `server/src/config/index.js`
5. `server/src/instrument.js`
6. `server/src/core/base.repository.ts`
7. `server/src/core/tenant.repository.ts`
8. `server/src/core/base.service.ts`
9. `server/src/core/tenant.context.ts`
10. `server/src/middleware/auth.js`
11. `server/src/middleware/tenant.middleware.js`
12. `server/src/middleware/errorHandler.js`
13. `server/src/middleware/auditLog.js`
14. `server/src/app.js`

Tasks to execute:

1. Deploy the 35-model `server/prisma/schema.prisma` and execute `npx prisma validate` and `npx prisma generate` in `server/`.
2. Update `server/src/server.js` to connect and disconnect PostgreSQL / Prisma lifecycle via `src/config/database.js`.
3. Update `server/src/config/database.js` to manage Prisma Client connection lifecycle, retry loop, and health checks (`$queryRaw\`SELECT 1\``).
4. Update `server/src/config/index.js` to replace `mongoose` config with `database` config, and require `DATABASE_URL` instead of `MONGODB_URI`.
5. Update `server/src/instrument.js` to remove `Sentry.mongooseIntegration()`.
6. Rewrite `server/src/core/base.repository.ts` to implement generic `BaseRepository<T>` wrapping Prisma model delegates (`PrismaModelDelegate<T>`) with both modern Prisma methods and legacy adapter methods.
7. Rewrite `server/src/core/tenant.repository.ts` to implement `TenantRepository<T>` extending `BaseRepository<T>` with automatic tenant scoping from `TenantContext`.
8. Rewrite `server/src/core/base.service.ts` to decouple from Mongoose `Document` types.
9. Modernize `server/src/core/tenant.context.ts` with `node:async_hooks`.
10. Refactor `server/src/middleware/auth.js` to fetch user via `prisma.user.findUnique`, omit password, and provide `_id = user.id` backward compatibility shim.
11. Refactor `server/src/middleware/tenant.middleware.js` to fetch institute and users via `prisma.institute` and `prisma.user` without Mongoose or `Types.ObjectId`.
12. Refactor `server/src/middleware/errorHandler.js` to translate Prisma errors (`PrismaClientKnownRequestError`, `PrismaClientValidationError`, `PrismaClientInitializationError`, `P2002`, `P2025`, `P2003`, `P2000`) into `ApiError` instances.
13. Refactor `server/src/middleware/auditLog.js` to use `prisma.auditLog` or fallback logger.
14. Refactor `server/src/app.js` to remove `mongoSanitize()` and update `/sitemap.xml` to query `prisma.course`, `prisma.blog`, and `prisma.category`.
15. Verification:
    - Run `npx prisma validate` and `npx prisma generate` in `server/`.
    - Run TypeScript type check `npx tsc --noEmit` in `server/` (or verify type correctness).
    - Verify zero Mongoose imports in the modified core files.
    - Document all verification commands and outcomes.
