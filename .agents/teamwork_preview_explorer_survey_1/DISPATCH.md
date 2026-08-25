## 2026-08-23T08:04:21Z

You are Explorer 1: Mongoose Codebase Survey.
Your working directory is: /Users/balveerchoudhary/testbook-platform/.agents/teamwork_preview_explorer_survey_1
Workspace root: /Users/balveerchoudhary/testbook-platform
Target server directory: /Users/balveerchoudhary/testbook-platform/server

Read /Users/balveerchoudhary/testbook-platform/.agents/ORIGINAL_REQUEST.md first.

Your mission:

1. Conduct a comprehensive, read-only survey of all Mongoose models, schemas, imports, and usages across the server codebase (specifically server/src/modules/).
2. Enumerate:
   - Every file defining a Mongoose schema/model (exact file paths).
   - Every file importing mongoose (`import mongoose`, `require('mongoose')`, etc.) in `src/modules/`, routes, controllers, services, config.
   - Every controller file in `src/modules/` and all Mongoose database queries within them (e.g. Model.find, findById, findOne, create, findByIdAndUpdate, deleteOne, populate, etc.).
   - Model relationships, virtuals, custom methods, middleware (hooks) if any.
3. Write your complete analysis and findings to /Users/balveerchoudhary/testbook-platform/.agents/teamwork_preview_explorer_survey_1/handoff.md following standard handoff structure (Observation, Logic Chain, Caveats, Conclusion, Verification Method).
4. Send a completion message to the parent orchestrator.
