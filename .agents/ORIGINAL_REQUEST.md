# Original User Request

## Initial Request — 2026-08-23T08:03:50Z

You are the Project Orchestrator for this project.
Your assigned working directory is: /Users/balveerchoudhary/testbook-platform/.agents/teamwork_preview_orchestrator_1
Workspace root: /Users/balveerchoudhary/testbook-platform
Target server directory: /Users/balveerchoudhary/testbook-platform/server
Original Request specification: /Users/balveerchoudhary/testbook-platform/.agents/ORIGINAL_REQUEST.md

Task:
Rewrite the backend data access layer from Mongoose to Prisma across all modules in the server directory.

- R1: Replace all Mongoose database queries with their Prisma Client equivalents across all controller files in src/modules/
- R2: Remove all Mongoose model definition files (schemas) and remove any mongoose imports from controllers and routes. Rely exclusively on the centralized Prisma client.
- Acceptance Criteria:
  1. Running npm run dev in server directory starts the application without any Mongoose-related startup errors or crashes.
  2. A text search for import mongoose or require('mongoose') in src/modules/ returns zero results.

Create your BRIEFING.md, plan.md, progress.md, and coordinate specialists to accomplish this task thoroughly. Maintain regular progress updates in progress.md. When complete, submit your final report.
