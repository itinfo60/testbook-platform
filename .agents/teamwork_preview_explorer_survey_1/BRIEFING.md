# BRIEFING — 2026-08-23T08:09:00Z

## Mission

Conduct a comprehensive, read-only survey of all Mongoose models, schemas, imports, and controller database usages across the server directory (specifically server/src/modules/) to enable seamless migration to Prisma.

## 🔒 My Identity

- Archetype: Explorer
- Roles: Codebase surveyor, Mongoose architecture investigator
- Working directory: /Users/balveerchoudhary/testbook-platform/.agents/teamwork_preview_explorer_survey_1
- Original parent: f013bc32-e009-4dea-a9ad-b78e9ce23022
- Milestone: Mongoose Codebase Survey & Analysis

## 🔒 Key Constraints

- Read-only investigation — do NOT implement or modify server code
- Accurate line numbers, exact imports, models, schemas, and query enumeration
- Output structured findings in handoff.md

## Current Parent

- Conversation ID: f013bc32-e009-4dea-a9ad-b78e9ce23022
- Updated: 2026-08-23T08:09:00Z

## Investigation State

- **Explored paths**: `server/src/modules/`, `server/src/models/`, `server/src/config/`, `server/src/core/`, `server/src/middleware/`, `server/src/workers/`, `server/prisma/`, `server/src/app.js`, `server/src/server.js`
- **Key findings**:
  - 33 model files defining 34 Mongoose models.
  - 86 files importing Mongoose across server/src.
  - 48 files in `src/modules/` importing Mongoose.
  - 35 controllers in `src/modules/` surveyed (20 direct-query controllers, 15 service-delegating/hybrid controllers).
  - 14 repositories and 10 services in `src/modules/` identified.
  - Full analysis of hooks, virtuals, plugins, and Prisma schema comparison completed.
- **Unexplored areas**: None in survey scope.

## Key Decisions Made

- Fully documented all 33 models, all 86 imports, all 35 controllers, and all query types in `handoff.md`.

## Artifact Index

- `/Users/balveerchoudhary/testbook-platform/.agents/teamwork_preview_explorer_survey_1/handoff.md` — Comprehensive survey report of Mongoose usage across server/
