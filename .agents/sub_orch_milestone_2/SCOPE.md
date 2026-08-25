# Scope: Milestone 2 — Core Identity & Learning Modules

## Mission

Migrate data access layer in `src/modules/user`, `src/modules/auth`, `src/modules/institute`, `src/modules/course`, and `src/modules/exam-category` to use Prisma Client exclusively. Remove Mongoose models, schemas, and imports from these modules.

## Modules & Target Files

1. **`src/modules/user/`**:
   - `user.controller.ts`, `user.service.ts`, `user.repository.ts`, `user.dto.ts`, `user.validation.ts`
   - Rewrite repository queries to `prisma.user` / `prisma.userActivity`.
   - Ensure password comparison, hashing, and token helpers are in `auth.utils.ts` / `user.service.ts`.
   - Delete `user.model.ts` and `userActivity.model.js`.
2. **`src/modules/auth/`**:
   - `auth.controller.ts`, `auth.service.ts`, `auth.repository.ts`, `auth.dto.ts`, `auth.validation.ts`
   - Ensure auth flow (login, register, token refresh, reset password, email verification, MFA) queries `prisma.user`.
   - Remove any Mongoose imports or types.
3. **`src/modules/institute/`**:
   - `institute.controller.ts`, `institute.service.ts`, `institute.repository.ts`, `institute.dto.ts`
   - Queries use `prisma.institute`.
   - Delete `institute.model.ts`.
4. **`src/modules/course/`**:
   - `course.controller.ts`, `course.service.ts`, `course.repository.ts`, `course.dto.ts`, `course.validation.ts`
   - Queries use `prisma.course`, `prisma.lesson`, `prisma.category`.
   - Delete `course.model.ts`.
5. **`src/modules/exam-category/`**:
   - `examCategory.controller.js`, `examCategory.routes.js`
   - Queries use `prisma.category`.
   - Delete `examCategory.model.js`.

## Mandatory Constraints & Warnings

- DO NOT CHEAT. All implementations must be genuine.
- Rely exclusively on `import { prisma } from '../../config/prisma.js'`.
- Remove all `import mongoose` or `require('mongoose')` from these 5 module folders.
- Delete all 5 `.model.*` files in these modules (`user.model.ts`, `userActivity.model.js`, `institute.model.ts`, `course.model.ts`, `examCategory.model.js`).
- Pass unit and integration tests for these modules.
