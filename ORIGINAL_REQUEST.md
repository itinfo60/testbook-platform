# Original User Request

## Initial Request — 2026-08-23T08:03:24Z

# Teamwork Project Prompt — Draft

> Status: Launched
> Goal: Craft prompt → get user approval → delegate to teamwork_preview
> Requested team: The full team

Rewrite the backend data access layer from Mongoose to Prisma across all modules in the server directory.

Working directory: /Users/balveerchoudhary/testbook-platform/server
Integrity mode: development

## Requirements

### R1. Complete Mongoose to Prisma Migration

Replace all Mongoose database queries (e.g., `.find()`, `.findById()`, `.aggregate()`) with their Prisma Client equivalents (e.g., `.findMany()`, `.findUnique()`) across all controller files in the `src/modules/` directory.

### R2. Cleanup Mongoose Dependencies

Remove all Mongoose model definition files (schemas) and remove any `mongoose` imports from the controllers and routes. The backend must rely exclusively on the centralized Prisma client.

## Acceptance Criteria

### Server Integrity

- [ ] Running `npm run dev` in the server directory starts the application without any Mongoose-related startup errors or crashes.
- [ ] A text search for `import mongoose` or `require('mongoose')` in the `src/modules/` directory returns zero results.
