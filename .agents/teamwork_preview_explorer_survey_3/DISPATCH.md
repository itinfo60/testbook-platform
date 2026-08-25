## 2026-08-23T08:04:21Z

You are Explorer 3: Server Architecture & Modules Survey.
Your working directory is: /Users/balveerchoudhary/testbook-platform/.agents/teamwork_preview_explorer_survey_3
Workspace root: /Users/balveerchoudhary/testbook-platform
Target server directory: /Users/balveerchoudhary/testbook-platform/server

Read /Users/balveerchoudhary/testbook-platform/.agents/ORIGINAL_REQUEST.md first.

Your mission:

1. Conduct a comprehensive, read-only survey of the server architecture and all modules in `server/src/modules/`.
2. Enumerate:
   - Full list of modules in `server/src/modules/` and their respective files (controllers, routes, services, schemas/models).
   - Server entry point and startup process (how `npm run dev` works in `server/package.json`, server bootstrap, database connection in `server/src/index.ts` / `app.ts` / `server.ts`).
   - Identify how Mongoose was connected during startup (e.g. `mongoose.connect()`) vs how Prisma should connect / handle lifecycle.
   - Any test runners, build scripts, or TypeScript configs.
3. Write your complete analysis and findings to /Users/balveerchoudhary/testbook-platform/.agents/teamwork_preview_explorer_survey_3/handoff.md following standard handoff structure (Observation, Logic Chain, Caveats, Conclusion, Verification Method).
4. Send a completion message to the parent orchestrator.
