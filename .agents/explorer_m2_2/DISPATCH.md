## 2026-08-23T08:36:36Z

You are Explorer 2 for Milestone 2: Core Identity & Learning Modules.
Your assigned working directory is: /Users/balveerchoudhary/testbook-platform/.agents/explorer_m2_2/
Workspace root: /Users/balveerchoudhary/testbook-platform
Target server directory: /Users/balveerchoudhary/testbook-platform/server

Mandatory files to read first:

- /Users/balveerchoudhary/testbook-platform/.agents/ORIGINAL_REQUEST.md
- /Users/balveerchoudhary/testbook-platform/PROJECT.md
- /Users/balveerchoudhary/testbook-platform/.agents/sub_orch_milestone_2/SCOPE.md
- /Users/balveerchoudhary/testbook-platform/.agents/sub_orch_milestone_1/handoff.md
- /Users/balveerchoudhary/testbook-platform/server/prisma/schema.prisma
- /Users/balveerchoudhary/testbook-platform/server/src/core/base.repository.ts
- /Users/balveerchoudhary/testbook-platform/server/src/core/tenant.repository.ts
- /Users/balveerchoudhary/testbook-platform/server/src/config/prisma.js

Your focus area:
Perform a deep, line-by-line technical investigation of:

1. `server/src/modules/institute/`: `institute.controller.ts`, `institute.service.ts`, `institute.repository.ts`, `institute.dto.ts`, `institute.validation.ts`, `institute.routes.ts`, `institute.model.ts`.
2. `server/src/modules/course/`: `course.controller.ts`, `course.service.ts`, `course.repository.ts`, `course.dto.ts`, `course.validation.ts`, `course.routes.ts`, `course.model.ts`.
3. `server/src/modules/exam-category/`: `examCategory.controller.js`, `examCategory.routes.js`, `examCategory.model.js`.

Your tasks:

1. Map every Mongoose method/call in these modules (e.g. `Institute.findById`, `Course.find`, `Course.aggregate`, `examCategory.find`, `category.find`, etc.) to exact Prisma Client calls (`prisma.institute.*`, `prisma.course.*`, `prisma.lesson.*`, `prisma.category.*`).
2. Check schema alignment: Compare all fields, embedded structures (e.g. curriculum, sections, lessons, institute settings, subscription plans), and relations with `server/prisma/schema.prisma`. Note if any relations or Json fields are used in Prisma.
3. Detail how multi-tenant scoping (`tenantId` / `instituteId`) is applied in these repositories and controllers.
4. Detail the exact changes required in each file, list files to delete (`institute.model.ts`, `course.model.ts`, `examCategory.model.js`), and provide a concrete implementation strategy.
5. Write your findings to `/Users/balveerchoudhary/testbook-platform/.agents/explorer_m2_2/analysis.md` and handoff summary to `/Users/balveerchoudhary/testbook-platform/.agents/explorer_m2_2/handoff.md`.
6. Send a message to parent when done.
