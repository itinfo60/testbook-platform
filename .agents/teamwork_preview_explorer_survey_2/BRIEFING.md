# BRIEFING — 2026-08-23T08:08:00Z

## Mission

Conduct a comprehensive, read-only survey of the Prisma setup in `server/`, mapping schemas, client instances, Mongoose-Prisma model mappings, and query structures.

## 🔒 My Identity

- Archetype: explorer
- Roles: read-only investigation, schema analysis, synthesis
- Working directory: /Users/balveerchoudhary/testbook-platform/.agents/teamwork_preview_explorer_survey_2
- Original parent: f013bc32-e009-4dea-a9ad-b78e9ce23022
- Milestone: Prisma Setup & Schema Survey

## 🔒 Key Constraints

- Read-only investigation — do NOT implement / modify source code
- Files for content delivery (handoff.md, analysis.md), Messages for coordination

## Current Parent

- Conversation ID: f013bc32-e009-4dea-a9ad-b78e9ce23022
- Updated: 2026-08-23T08:08:00Z

## Investigation State

- **Explored paths**:
  - `server/prisma/schema.prisma` (14 models, Postgres datasource)
  - `server/prisma.config.ts` (Prisma v7 config with adapter-pg)
  - `server/src/config/prisma.js` (Centralized Prisma Client singleton)
  - `server/src/models/index.js` and all Mongoose model definitions in `server/src/modules/`
  - `server/src/app.js`, `server/src/server.js`, `server/src/core/base.repository.ts`, `server/src/core/tenant.repository.ts`
  - Controllers in `server/src/modules/`
- **Key findings**:
  - Prisma client generated successfully (`v7.9.1`).
  - Prisma centralized instance located at `server/src/config/prisma.js`.
  - 14 Prisma models: `User`, `Institute`, `Category`, `Course`, `Lesson`, `Enrollment`, `Test`, `TestAttempt`, `Quiz`, `QuizAttempt`, `Payment`, `Review`, `Blog`, `Coupon`.
  - Model naming divergence: Mongoose `ExamCategory` -> Prisma `Category` (`prisma.category`).
  - Structural divergence: `Lesson` is relational in Prisma (`courseId`), embedded in Mongoose (`Course.sections[].lessons[]`).
  - ID divergence: Mongoose uses `_id` (ObjectId hex), Prisma uses `id` (UUID).
  - 20 Mongoose models without direct Prisma models in `schema.prisma`.
- **Unexplored areas**: None for survey scope.

## Key Decisions Made

- Fully documented mapping between 14 Prisma models and Mongoose models.
- Documented complete query conversion patterns for Prisma Client.

## Artifact Index

- /Users/balveerchoudhary/testbook-platform/.agents/teamwork_preview_explorer_survey_2/DISPATCH.md
- /Users/balveerchoudhary/testbook-platform/.agents/teamwork_preview_explorer_survey_2/BRIEFING.md
- /Users/balveerchoudhary/testbook-platform/.agents/teamwork_preview_explorer_survey_2/progress.md
- /Users/balveerchoudhary/testbook-platform/.agents/teamwork_preview_explorer_survey_2/handoff.md
