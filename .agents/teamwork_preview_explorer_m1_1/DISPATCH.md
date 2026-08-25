## 2026-08-23T08:13:52Z

You are Explorer 1 for Milestone 1.
Your working directory is: /Users/balveerchoudhary/testbook-platform/.agents/teamwork_preview_explorer_m1_1
Workspace root: /Users/balveerchoudhary/testbook-platform
Target server directory: /Users/balveerchoudhary/testbook-platform/server

Mandatory file to read first:

- /Users/balveerchoudhary/testbook-platform/.agents/ORIGINAL_REQUEST.md
- /Users/balveerchoudhary/testbook-platform/PROJECT.md
- /Users/balveerchoudhary/testbook-platform/.agents/sub_orch_milestone_1/SCOPE.md

Your task:
Investigate Server Startup, Database Lifecycle, Sentry, and Core Shared Middlewares:

1. `server/src/server.js`: Examine current Mongoose connection startup/shutdown. Detail how to replace `database.connect()` / `disconnect()` with `prisma.$connect()` / `prisma.$disconnect()`.
2. `server/src/config/database.js`: Examine Mongoose connection wrapper. Determine how to re-export Prisma health checks / connection lifecycle.
3. `server/src/config/index.js`: Check MongoDB env requirements (`MONGODB_URI`) and update to support PostgreSQL / `DATABASE_URL`.
4. `server/src/instrument.js`: Inspect Sentry configuration and remove `Sentry.mongooseIntegration()`.
5. `server/src/middleware/auth.js`: Inspect Mongoose `User.findById` and detail Prisma `prisma.user.findUnique`.
6. `server/src/middleware/tenant.middleware.js`: Inspect `Institute` and `User` queries, replace `Types.ObjectId` and Mongoose calls with Prisma.
7. `server/src/middleware/errorHandler.js`: Replace Mongoose error handling (`CastError`, `ValidationError`, `code 11000`) with Prisma Client error handling (`PrismaClientKnownRequestError`, `PrismaClientValidationError`, `P2002`, `P2025`, etc.).
8. `server/src/middleware/auditLog.js`: Update audit logging to avoid Mongoose models.
9. `server/src/app.js`: Remove `mongoSanitize()` middleware and refactor `/sitemap.xml` route to query `prisma.course`, `prisma.blog`, `prisma.category`.

Produce a detailed, verified investigation report with exact code snippets and recommendations.
Write your handoff report to: /Users/balveerchoudhary/testbook-platform/.agents/teamwork_preview_explorer_m1_1/handoff.md
Send a message back to the caller when done.
