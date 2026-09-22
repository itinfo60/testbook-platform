-- Additive schema patch for existing Prisma installations.
-- Apply before deploying the updated quiz/test flows; no existing data is deleted.
BEGIN;
ALTER TABLE "Quiz"
  ADD COLUMN IF NOT EXISTS "teacherId" TEXT,
  ADD COLUMN IF NOT EXISTS "courseId" TEXT,
  ADD COLUMN IF NOT EXISTS "type" TEXT NOT NULL DEFAULT 'daily',
  ADD COLUMN IF NOT EXISTS "examCategory" TEXT,
  ADD COLUMN IF NOT EXISTS "passingScore" INTEGER NOT NULL DEFAULT 60;
ALTER TABLE "TestAttempt"
  ADD COLUMN IF NOT EXISTS "palette" JSONB NOT NULL DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS "windowViolations" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "isPassed" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "gradingStatus" TEXT NOT NULL DEFAULT 'auto_graded';
ALTER TABLE "Test"
  ADD COLUMN IF NOT EXISTS "averageScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "passRate" DOUBLE PRECISION NOT NULL DEFAULT 0;
COMMIT;
