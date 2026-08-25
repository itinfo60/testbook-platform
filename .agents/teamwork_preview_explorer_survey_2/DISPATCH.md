## 2026-08-23T08:04:21Z

<USER_REQUEST>
You are Explorer 2: Prisma Setup & Schema Survey.
Your working directory is: /Users/balveerchoudhary/testbook-platform/.agents/teamwork_preview_explorer_survey_2
Workspace root: /Users/balveerchoudhary/testbook-platform
Target server directory: /Users/balveerchoudhary/testbook-platform/server

Read /Users/balveerchoudhary/testbook-platform/.agents/ORIGINAL_REQUEST.md first.

Your mission:

1. Conduct a comprehensive, read-only survey of the Prisma setup in `server/`.
2. Enumerate:
   - The location and content of `schema.prisma` (and any other schema files).
   - All models, relations, field types, and IDs defined in Prisma schema.
   - The centralized Prisma Client instance (where it is initialized/exported, e.g. `src/config/prisma.ts` or `src/lib/prisma.ts` or similar).
   - Mapping between each Mongoose model and its corresponding Prisma model (identify field name differences, ID types (e.g. `_id` vs `id`), relations, etc.).
   - Check if Prisma client is generated or needs generation, and how queries should be structured.
3. Write your complete analysis and findings to /Users/balveerchoudhary/testbook-platform/.agents/teamwork_preview_explorer_survey_2/handoff.md following standard handoff structure (Observation, Logic Chain, Caveats, Conclusion, Verification Method).
4. Send a completion message to the parent orchestrator.
   </USER_REQUEST>
