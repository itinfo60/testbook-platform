# Prisma Schema Completeness & Generator Readiness Investigation Report

## Executive Summary

This report provides a comprehensive, rigorous investigation of the Prisma schema completeness and generator readiness for the backend data access layer migration from Mongoose to Prisma across the Testbook platform.

The baseline `server/prisma/schema.prisma` contained only **14 models**, leaving **21 Mongoose models** unrepresented. We designed, mapped, and validated a complete **35-model Prisma schema** covering all **34 Mongoose models** plus the relational `Lesson` model. The schema is 100% syntactically valid (validated with Prisma CLI v7.9.1), adheres strictly to PostgreSQL data types (native string arrays, JSONB, UUIDs, composite indexes), and is fully compatible with `@prisma/adapter-pg`.

---

## 1. Observation

### 1.1 Existing Prisma Schema Baseline

- **File**: `server/prisma/schema.prisma` (230 lines)
- **Generator**: `prisma-client-js`
- **Datasource Provider**: `postgresql`
- **Baseline Models (14 models)**: `User`, `Institute`, `Category`, `Course`, `Lesson`, `Enrollment`, `Test`, `TestAttempt`, `Quiz`, `QuizAttempt`, `Payment`, `Review`, `Blog`, `Coupon`.

### 1.2 Full Comparison: 34 Mongoose Models vs. Prisma Schema

| #   | Mongoose Model File                                  | Mongoose Model     | Existing `schema.prisma` | Status / Gap                                                                                       | Milestone Target |
| --- | ---------------------------------------------------- | ------------------ | ------------------------ | -------------------------------------------------------------------------------------------------- | ---------------- |
| 1   | `src/modules/user/user.model.ts`                     | `User`             | Present (`User`)         | Incomplete (Missing MFA, tokens, parent code, stats, `tenantId`)                                   | M2               |
| 2   | `src/modules/user/userActivity.model.js`             | `UserActivity`     | **Missing**              | Needs `UserActivity` model with relations to `User`                                                | M2               |
| 3   | `src/modules/institute/institute.model.ts`           | `Institute`        | Present (`Institute`)    | Incomplete (Missing `customDomain`, `ownerId`, `subscription`, `limits`, `storageUsed`)            | M2               |
| 4   | `src/modules/exam-category/examCategory.model.js`    | `ExamCategory`     | Present (`Category`)     | Incomplete (Missing hierarchy `parent`/`subcategories`, exam metadata)                             | M2               |
| 5   | `src/modules/course/course.model.ts`                 | `Course`           | Present (`Course`)       | Incomplete (Missing `level`, `tags`, `requirements`, `whatYouLearn`, `tenantId`, ratings)          | M2               |
| 6   | Embedded in `course.model.ts`                        | `Lesson`           | Present (`Lesson`)       | Incomplete (Missing `type`, `resources`, `dripDays`, `sectionId`)                                  | M2               |
| 7   | `src/modules/test/test.model.ts`                     | `Test`             | Present (`Test`)         | Incomplete (Missing `teacherId`, `testSeriesId`, `difficulty`, `testType`, `tenantId`)             | M3               |
| 8   | `src/modules/test/testAttempt.model.ts`              | `TestAttempt`      | Present (`TestAttempt`)  | Incomplete (Missing `palette`, `gradingStatus`, `timeTaken`, `attemptNumber`, `tenantId`)          | M3               |
| 9   | `src/modules/test/question.model.ts`                 | `Question`         | **Missing**              | Needs `Question` model for question bank                                                           | M3               |
| 10  | `src/modules/test-series/testSeries.model.js`        | `TestSeries`       | **Missing**              | Needs `TestSeries` model with relations to `Category`, `Test`, `User`                              | M3               |
| 11  | `src/modules/quiz/quiz.model.js`                     | `Quiz`             | Present (`Quiz`)         | Incomplete (Missing `courseId`, `categoryId`, `teacherId`, `type`, `tenantId`)                     | M3               |
| 12  | `src/modules/quiz/quizAttempt.model.js`              | `QuizAttempt`      | Present (`QuizAttempt`)  | Incomplete (Missing `courseId`, `totalQuestions`, `percentage`, `tenantId`)                        | M3               |
| 13  | `src/modules/aiQuiz/generatedQuiz.model.js`          | `GeneratedQuiz`    | **Missing**              | Needs `GeneratedQuiz` model with relations to `Course`, `User`                                     | M3               |
| 14  | `src/modules/attendance/attendance.model.ts`         | `Attendance`       | **Missing**              | Needs `Attendance` model with relations to `Course` and `@@unique([courseId, date])`               | M3               |
| 15  | `src/modules/library/library.model.ts`               | `LibraryResource`  | **Missing**              | Needs `LibraryResource` model with relations to `Category`                                         | M3               |
| 16  | `src/modules/enrollment/enrollment.model.js`         | `Enrollment`       | Present (`Enrollment`)   | Incomplete (Missing `testId`, `testSeriesId`, `progress`, `certificateId`, `tenantId`)             | M4               |
| 17  | `src/modules/payment/payment.model.ts`               | `Payment`          | Present (`Payment`)      | Incomplete (Missing `orderId`, `subscriptionPlanId`, `couponId`, `testId`, `provider`, `tenantId`) | M4               |
| 18  | `src/modules/coupon/coupon.model.ts`                 | `Coupon`           | Present (`Coupon`)       | Incomplete (Missing `discountType`, `usageLimit`, `perUserLimit`, `applicableCourses`, `usedBy`)   | M4               |
| 19  | `src/modules/subscription/subscriptionPlan.model.ts` | `SubscriptionPlan` | **Missing**              | Needs `SubscriptionPlan` model with relations to `Payment`                                         | M4               |
| 20  | `src/modules/review/review.model.ts`                 | `Review`           | Present (`Review`)       | Incomplete (Missing `isApproved`, `helpfulCount`, `reportCount`, `tenantId`)                       | M4               |
| 21  | `src/modules/wishlist/wishlist.model.js`             | `Wishlist`         | **Missing**              | Needs `Wishlist` model with relations to `User`, `Course`                                          | M4               |
| 22  | `src/modules/affiliate/affiliate.model.js`           | `Affiliate`        | **Missing**              | Needs `Affiliate` model with relations to `User`                                                   | M4               |
| 23  | `src/modules/affiliate/affiliate.model.js`           | `ReferralRecord`   | **Missing**              | Needs `ReferralRecord` model with relations to `User`, `Payment`                                   | M4               |
| 24  | `src/modules/discussion/discussion.model.ts`         | `Discussion`       | **Missing**              | Needs `Discussion` model with relations to `User`, `Course`                                        | M4               |
| 25  | `src/modules/note/note.model.ts`                     | `Note`             | **Missing**              | Needs `Note` model with relations to `User`, `Course`                                              | M4               |
| 26  | `src/modules/notification/notification.model.js`     | `Notification`     | **Missing**              | Needs `Notification` model with relations to `User` (recipient/sender)                             | M4               |
| 27  | `src/modules/parent/message.model.ts`                | `Message`          | **Missing**              | Needs `Message` model with relations to `User` (sender/recipient/student)                          | M4               |
| 28  | `src/modules/badge/badge.model.ts`                   | `Badge`            | **Missing**              | Needs `Badge` model                                                                                | M4               |
| 29  | `src/modules/badge/userBadge.model.ts`               | `UserBadge`        | **Missing**              | Needs `UserBadge` model with `@@unique([userId, badgeId])`                                         | M4               |
| 30  | `src/modules/apikey/apikey.model.js`                 | `ApiKey`           | **Missing**              | Needs `ApiKey` model with relations to `Institute`, `User`                                         | M4               |
| 31  | `src/modules/audit/audit.model.js`                   | `AuditLog`         | **Missing**              | Needs `AuditLog` model with relations to `User`                                                    | M4               |
| 32  | `src/models/settings.model.ts`                       | `PlatformSettings` | **Missing**              | Needs `PlatformSettings` model for site configs & feature flags                                    | M4               |
| 33  | `src/modules/support/supportTicket.model.ts`         | `SupportTicket`    | **Missing**              | Needs `SupportTicket` model with relations to `User`, `Institute`                                  | M4               |
| 34  | `src/modules/liveclass/liveclass.model.js`           | `LiveClass`        | **Missing**              | Needs `LiveClass` model with relations to `User`, `Course`                                         | M4               |
| 35  | `src/modules/blog/blog.model.js`                     | `Blog`             | Present (`Blog`)         | Incomplete (Missing `authorId`, `categoryId`, `excerpt`, `jobAlert`, `views`)                      | M4               |

### 1.3 Prisma Validation & Formatting Verification

The proposed comprehensive 35-model schema was written to `/Users/balveerchoudhary/testbook-platform/.agents/teamwork_preview_explorer_m1_3/proposed_schema.prisma` and tested with the Prisma CLI.

- **Prisma Validate Command**:

  ```bash
  npx prisma validate --schema=/Users/balveerchoudhary/testbook-platform/.agents/teamwork_preview_explorer_m1_3/proposed_schema.prisma
  ```

  **Verbatim Result**:

  ```
  Loaded Prisma config from prisma.config.ts.

  Prisma schema loaded from ../.agents/teamwork_preview_explorer_m1_3/proposed_schema.prisma.
  The schema at ../.agents/teamwork_preview_explorer_m1_3/proposed_schema.prisma is valid 🚀
  ```

  _Exit Code_: `0`

- **Prisma Format Command**:

  ```bash
  npx prisma format --schema=/Users/balveerchoudhary/testbook-platform/.agents/teamwork_preview_explorer_m1_3/proposed_schema.prisma
  ```

  **Verbatim Result**:

  ```
  Loaded Prisma config from prisma.config.ts.

  Prisma schema loaded from ../.agents/teamwork_preview_explorer_m1_3/proposed_schema.prisma.
  Formatted ../.agents/teamwork_preview_explorer_m1_3/proposed_schema.prisma in 39ms 🚀
  ```

  _Exit Code_: `0`

---

## 2. Logic Chain

1. **Premise**: The goal of Milestone 1 is to establish the database and platform foundation so that subsequent milestones (M2: User/Institute/Course, M3: Test/Quiz/Attendance/Leaderboard/Library, M4: Commerce/Community/Admin) can migrate their services, repositories, and controllers cleanly to Prisma without missing tables or schema incompatibilities.
2. **Observation**: Mongoose defined 34 models across 33 files. 21 models were omitted from the initial 14-model `schema.prisma`. Furthermore, existing models in `schema.prisma` lacked fields used extensively across controllers (e.g. `User.tenantId`, `User.parentAccessCode`, `Course.sections`, `Enrollment.certificateId`, `Payment.orderId`).
3. **Inference**: If milestones M2, M3, and M4 attempt to migrate controllers to `prisma[model]`, queries such as `prisma.badge.findMany()`, `prisma.discussion.create()`, `prisma.liveClass.findFirst()`, or `prisma.apiKey.findUnique()` would immediately fail with runtime type/property errors on Prisma Client unless all models are declared in `schema.prisma`.
4. **Resolution**:
   - Define all 35 models in `schema.prisma` with exact relational foreign keys (`fields: [...]`, `references: [id]`, `onDelete: Cascade` where appropriate).
   - Ensure all model and field names match application naming conventions (e.g. `User.courses @relation("TeacherCourses")`, `Course.teacher`, `Category.courses`, `Category.testSeries`).
   - Use native PostgreSQL features: `String[]` for tag and feature lists, `Json` with `@default("[]")` or `@default("{}")` for complex nested objects/arrays, and `DateTime` for timestamp lifecycle management.
   - Add indices (`@@index`) matching the high-frequency query patterns observed in the controllers (e.g., `tenantId`, `status`, `createdAt`, `userId`, `courseId`).
5. **Driver Adapter Compatibility**:
   - `server/src/config/prisma.js` initializes `PrismaPg` adapter connected to PostgreSQL via the `pg` pool.
   - The verified schema uses standard PostgreSQL types (UUID primary keys, text, JSONB, float, integer, boolean, timestamp, text arrays) fully supported by `@prisma/adapter-pg`.

---

## 3. Caveats

1. **Read-Only Explorer Permission**: As an explorer subagent, source code in `server/prisma/schema.prisma` was not overwritten directly. The complete, validated, and formatted schema is stored in `.agents/teamwork_preview_explorer_m1_3/proposed_schema.prisma` and embedded below for the orchestrator / builder agent to deploy into `server/prisma/schema.prisma`.
2. **Database Migration Sync**: When replacing `server/prisma/schema.prisma`, running `npx prisma generate` in `server/` will update `@prisma/client` to expose all 35 model delegates (`prisma.user`, `prisma.course`, `prisma.discussion`, `prisma.liveClass`, etc.). To apply the table structures to the physical PostgreSQL database, run `npx prisma db push` (or `npx prisma migrate dev`).

---

## 4. Conclusion

The complete 35-model Prisma schema provides 100% coverage of all 34 Mongoose models across the codebase, ensuring full readiness for Milestones M2, M3, M4, and M5.

### Complete, Valid `schema.prisma` Content

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
}

// ------------------------------------------------------
// 1. Core Identity & Multi-Tenancy
// ------------------------------------------------------

model User {
  id              String  @id @default(uuid())
  email           String  @unique
  name            String
  password        String
  role            String  @default("student") // student, teacher, admin, super_admin, parent
  isEmailVerified Boolean @default(false)
  isActive        Boolean @default(true)
  avatar          String?
  phone           String?
  bio             String?

  // Authentication & Verification
  emailVerificationToken  String?
  emailVerificationExpire DateTime?
  resetPasswordToken      String?
  resetPasswordExpire     DateTime?
  refreshTokens           Json?

  // MFA
  mfaSecret      String?
  mfaEnabled     Boolean  @default(false)
  mfaBackupCodes String[] @default([])

  // Parent Portal
  parentAccessCode String? @unique

  // GDPR & Privacy
  consentGiven               Boolean   @default(false)
  consentAt                  DateTime?
  dataRetentionPolicyVersion String    @default("1.0")

  // OAuth & Push Notifications
  googleId     String?
  authProvider String   @default("local")
  fcmTokens    String[] @default([])

  // Gamification & Stats
  enrolledCourses  Int       @default(0)
  completedCourses Int       @default(0)
  totalTestsTaken  Int       @default(0)
  totalPoints      Int       @default(0)
  streak           Int       @default(0)
  lastActiveAt     DateTime? @default(now())

  // Teacher Specific Profile
  teacherProfile Json?

  // Multi-tenancy
  tenantId String?

  // Relational associations
  enrollments           Enrollment[]
  courses               Course[]         @relation("TeacherCourses")
  reviews               Review[]
  payments              Payment[]
  testAttempts          TestAttempt[]
  quizAttempts          QuizAttempt[]
  userBadges            UserBadge[]
  discussions           Discussion[]
  notes                 Note[]
  receivedNotifications Notification[]   @relation("RecipientNotifications")
  sentNotifications     Notification[]   @relation("SenderNotifications")
  wishlists             Wishlist[]
  liveClasses           LiveClass[]      @relation("TeacherLiveClasses")
  sentMessages          Message[]        @relation("SenderMessages")
  receivedMessages      Message[]        @relation("RecipientMessages")
  studentMessages       Message[]        @relation("StudentMessages")
  auditLogs             AuditLog[]
  userActivities        UserActivity[]
  apiKeys               ApiKey[]
  supportTickets        SupportTicket[]
  affiliates            Affiliate[]
  referredRecords       ReferralRecord[] @relation("ReferredRecords")
  referrerRecords       ReferralRecord[] @relation("ReferrerRecords")
  blogs                 Blog[]
  testSeries            TestSeries[]     @relation("TeacherTestSeries")
  tests                 Test[]           @relation("TeacherTests")
  generatedQuizzes      GeneratedQuiz[]  @relation("TeacherGeneratedQuizzes")
  quizzes               Quiz[]           @relation("TeacherQuizzes")

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([role, isActive])
  @@index([totalPoints])
  @@index([createdAt])
  @@index([tenantId])
}

model Institute {
  id             String  @id @default(uuid())
  name           String
  subdomain      String  @unique
  customDomain   String? @unique
  websiteTitle   String?
  theme          Json?
  logo           Json?
  contactDetails Json?
  isActive       Boolean @default(true)
  ownerId        String?
  subscription   Json? // { planId, status, expiresAt }
  limits         Json? // { studentLimit, teacherLimit, storageLimit }
  storageUsed    Float   @default(0)

  apiKeys        ApiKey[]
  supportTickets SupportTicket[]

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([isActive])
}

model ApiKey {
  id          String    @id @default(uuid())
  name        String
  keyHash     String    @unique
  keyPrefix   String
  instituteId String
  institute   Institute @relation(fields: [instituteId], references: [id], onDelete: Cascade)
  createdById String
  createdBy   User      @relation(fields: [createdById], references: [id])
  lastUsedAt  DateTime?
  expiresAt   DateTime?
  isActive    Boolean   @default(true)
  permissions String[]  @default(["courses:read"])
  tenantId    String?

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([instituteId, isActive])
}

model PlatformSettings {
  id                    String  @id @default(uuid())
  siteName              String  @default("Testbook Platform")
  siteLogo              String? @default("")
  supportEmail          String  @default("support@testbook.com")
  supportPhone          String? @default("")
  maintenanceMode       Boolean @default(false)
  allowUserRegistration Boolean @default(true)
  allowMockPayments     Boolean @default(true)
  currency              String  @default("INR")
  currencySymbol        String  @default("₹")
  defaultStudentLimit   Int     @default(500)
  banners               Json?   @default("[]")
  featureFlags          Json?
  updatedById           String?

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

model AuditLog {
  id           String  @id @default(uuid())
  actorId      String?
  actor        User?   @relation(fields: [actorId], references: [id])
  actorEmail   String?
  actorRole    String?
  action       String
  resource     String
  resourceId   String?
  changes      Json?
  metadata     Json?
  status       String  @default("success") // success, failure
  errorMessage String?
  tenantId     String?

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([createdAt])
  @@index([actorId, createdAt])
  @@index([action, resource, createdAt])
}

model UserActivity {
  id        String  @id @default(uuid())
  userId    String
  user      User    @relation(fields: [userId], references: [id], onDelete: Cascade)
  type      String // login, course_view, lesson_complete, test_attempt, quiz_attempt, certificate_earned, badge_earned
  metadata  Json?   @default("{}")
  ip        String?
  userAgent String?
  tenantId  String?

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([userId, createdAt])
  @@index([type, createdAt])
}

// ------------------------------------------------------
// 2. Course, Academic & Categorization Models
// ------------------------------------------------------

model Category {
  id            String     @id @default(uuid())
  name          String     @unique
  slug          String     @unique
  description   String?    @default("")
  icon          String?    @default("")
  image         Json?
  type          String     @default("category") // category, exam, subject
  parentId      String?
  parent        Category?  @relation("CategoryHierarchy", fields: [parentId], references: [id])
  subcategories Category[] @relation("CategoryHierarchy")
  order         Int        @default(0)
  isActive      Boolean    @default(true)
  courseCount   Int        @default(0)
  testCount     Int        @default(0)

  // Exam metadata
  syllabus         String? @default("")
  examPattern      String? @default("")
  eligibility      String? @default("")
  selectionProcess String? @default("")
  importantDates   Json?   @default("[]")
  latestStatus     String? @default("")
  officialWebsite  String? @default("")
  conductingBody   String? @default("")
  tenantId         String?

  courses          Course[]
  tests            Test[]
  testSeries       TestSeries[]
  blogs            Blog[]
  libraryResources LibraryResource[]
  quizzes          Quiz[]

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([type])
  @@index([isActive])
}

model Course {
  id               String    @id @default(uuid())
  title            String
  slug             String    @unique
  description      String?   @default("")
  shortDescription String?   @default("")
  thumbnail        String?
  thumbnailData    Json?
  previewVideo     String?   @default("")
  demoVideoUrl     String?   @default("")
  price            Float     @default(0)
  discountPrice    Float     @default(0)
  effectivePrice   Float     @default(0)
  isFree           Boolean   @default(true)
  currency         String    @default("INR")
  language         String    @default("English")
  level            String    @default("beginner") // beginner, intermediate, advanced, all_levels
  tags             String[]  @default([])
  highlights       String[]  @default([])
  requirements     String[]  @default([])
  whatYouLearn     String[]  @default([])
  sections         Json? // Structural section & lesson tree
  averageRating    Float     @default(0)
  totalReviews     Int       @default(0)
  enrollmentCount  Int       @default(0)
  completionRate   Float     @default(0)
  totalDuration    Int       @default(0)
  totalLessons     Int       @default(0)
  status           String    @default("draft") // draft, published, archived
  isPublished      Boolean   @default(false)
  isFeatured       Boolean   @default(false)
  publishedAt      DateTime?
  tenantId         String?

  teacherId String
  teacher   User   @relation("TeacherCourses", fields: [teacherId], references: [id])

  categoryId String?
  category   Category? @relation(fields: [categoryId], references: [id])

  enrollments      Enrollment[]
  reviews          Review[]
  lessons          Lesson[]
  discussions      Discussion[]
  notes            Note[]
  wishlists        Wishlist[]
  liveClasses      LiveClass[]
  attendances      Attendance[]
  quizzes          Quiz[]
  quizAttempts     QuizAttempt[]
  generatedQuizzes GeneratedQuiz[]
  payments         Payment[]

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([teacherId, status])
  @@index([categoryId, isPublished])
  @@index([price, averageRating])
  @@index([tenantId, isPublished])
}

model Lesson {
  id             String  @id @default(uuid())
  title          String
  type           String  @default("video") // video, text, quiz
  content        String? @default("")
  videoUrl       String? @default("")
  quizId         String? @default("")
  testSeriesSlug String? @default("")
  duration       Int     @default(0) // seconds
  isFree         Boolean @default(false)
  order          Int     @default(0)
  dripDays       Int     @default(0)
  resources      Json?   @default("[]")
  sectionId      String?
  sectionTitle   String? @default("")

  courseId String
  course   Course @relation(fields: [courseId], references: [id], onDelete: Cascade)

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([courseId, order])
}

model Enrollment {
  id                String    @id @default(uuid())
  status            String    @default("active") // active, completed, expired, refunded, pending
  progress          Json?     @default("[]")
  progressPercent   Float     @default(0)
  amountPaid        Float     @default(0)
  paymentId         String?
  couponUsed        String?
  enrolledAt        DateTime  @default(now())
  completedAt       DateTime?
  lastAccessedAt    DateTime? @default(now())
  certificateIssued Boolean   @default(false)
  certificateUrl    String?
  certificateId     String?   @unique
  tenantId          String?

  userId String
  user   User   @relation(fields: [userId], references: [id], onDelete: Cascade)

  courseId String?
  course   Course? @relation(fields: [courseId], references: [id])

  testId String?
  test   Test?   @relation(fields: [testId], references: [id])

  testSeriesId String?
  testSeries   TestSeries? @relation(fields: [testSeriesId], references: [id])

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([userId, status])
  @@index([courseId, status])
  @@index([testId])
  @@index([testSeriesId])
  @@index([tenantId])
}

model Attendance {
  id       String   @id @default(uuid())
  courseId String
  course   Course   @relation(fields: [courseId], references: [id], onDelete: Cascade)
  date     DateTime
  records  Json     @default("[]") // Array of { student, status, remarks }
  tenantId String?

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@unique([courseId, date])
  @@index([tenantId])
}

model LibraryResource {
  id                String    @id @default(uuid())
  title             String
  description       String?   @default("")
  categoryId        String?
  category          Category? @relation(fields: [categoryId], references: [id])
  resourceType      String    @default("other") // syllabus, exam_pattern, pyq, solved_pyq, notes, mind_map, short_trick, current_affairs, video, quiz, other
  tags              String[]  @default([])
  fileUrl           String
  fileType          String
  accessLevel       String    @default("all") // all, enrolled, premium
  applicableCourses String[]  @default([])
  downloadsCount    Int       @default(0)
  tenantId          String?

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([categoryId, resourceType])
  @@index([tenantId])
}

// ------------------------------------------------------
// 3. Testing, Quiz & Assessment Models
// ------------------------------------------------------

model TestSeries {
  id             String    @id @default(uuid())
  title          String
  slug           String    @unique
  description    String?   @default("")
  instructions   String?   @default("")
  teacherId      String?
  teacher        User?     @relation("TeacherTestSeries", fields: [teacherId], references: [id])
  categoryId     String
  category       Category  @relation(fields: [categoryId], references: [id])
  subject        String    @default("General")
  testType       String    @default("full_length") // full_length, subject_wise, topic_wise, pyq, daily, sectional
  testsCount     Int       @default(0)
  questionsCount Int       @default(0)
  totalMarks     Float     @default(0)
  duration       Int       @default(0)
  thumbnail      Json?
  difficulty     String    @default("intermediate") // beginner, intermediate, advanced
  language       String    @default("Bilingual") // Hindi, English, Bilingual
  isFree         Boolean   @default(false)
  price          Float     @default(0)
  discountPrice  Float     @default(0)
  isPublished    Boolean   @default(true)
  isFeatured     Boolean   @default(false)
  publishedAt    DateTime?
  tenantId       String?

  tests       Test[]
  enrollments Enrollment[]

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([categoryId, isPublished])
  @@index([teacherId])
  @@index([tenantId])
}

model Test {
  id             String      @id @default(uuid())
  title          String
  slug           String?     @unique
  description    String?     @default("")
  instructions   String?     @default("")
  teacherId      String?
  teacher        User?       @relation("TeacherTests", fields: [teacherId], references: [id])
  categoryId     String?
  category       Category?   @relation(fields: [categoryId], references: [id])
  testSeriesId   String?
  testSeries     TestSeries? @relation(fields: [testSeriesId], references: [id])
  testNumber     Int         @default(1)
  sectionTag     String?     @default("")
  subjectTag     String?     @default("")
  duration       Int         @default(60) // minutes
  totalMarks     Float       @default(100)
  passingMarks   Float?      @default(0)
  difficulty     String      @default("intermediate") // beginner, intermediate, advanced, easy, medium, hard
  testType       String      @default("full_length") // full_length, subject_wise, topic_wise, pyq
  questionsCount Int         @default(0)
  maxAttempts    Int         @default(0)
  totalAttempts  Int         @default(0)
  averageScore   Float       @default(0)
  passRate       Float       @default(0)
  status         String      @default("draft") // draft, published, archived
  isPublished    Boolean     @default(false)
  isFeatured     Boolean     @default(false)
  isFree         Boolean     @default(true)
  price          Float       @default(0)
  publishedAt    DateTime?
  scheduledAt    DateTime?
  tenantId       String?

  questions   Json          @default("[]")
  attempts    TestAttempt[]
  enrollments Enrollment[]
  payments    Payment[]

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([teacherId, status])
  @@index([categoryId, isPublished])
  @@index([testSeriesId])
  @@index([tenantId, isPublished])
}

model TestAttempt {
  id               String  @id @default(uuid())
  score            Float   @default(0)
  totalMarks       Float   @default(0)
  percentage       Float   @default(0)
  isPassed         Boolean @default(false)
  status           String  @default("completed") // in_progress, completed, timed_out, abandoned
  gradingStatus    String  @default("auto_graded") // auto_graded, pending_manual, manually_graded
  answers          Json    @default("[]")
  palette          Json?   @default("[]")
  timeTaken        Int     @default(0) // seconds
  attemptNumber    Int     @default(1)
  windowViolations Int     @default(0)
  tenantId         String?

  testId String
  test   Test   @relation(fields: [testId], references: [id], onDelete: Cascade)

  userId String
  user   User   @relation(fields: [userId], references: [id], onDelete: Cascade)

  startedAt   DateTime  @default(now())
  completedAt DateTime?

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([userId, testId, createdAt])
  @@index([testId, score])
  @@index([tenantId])
}

model Quiz {
  id            String    @id @default(uuid())
  title         String
  description   String?   @default("")
  courseId      String?
  course        Course?   @relation(fields: [courseId], references: [id])
  categoryId    String?
  category      Category? @relation(fields: [categoryId], references: [id])
  lessonId      String?
  type          String    @default("practice") // daily, course, practice
  duration      Int       @default(10) // minutes
  teacherId     String?
  teacher       User?     @relation("TeacherQuizzes", fields: [teacherId], references: [id])
  questions     Json      @default("[]")
  passingScore  Float     @default(60)
  isPublished   Boolean   @default(true)
  totalAttempts Int       @default(0)
  averageScore  Float     @default(0)
  tenantId      String?

  attempts QuizAttempt[]

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([courseId])
  @@index([categoryId])
  @@index([type])
  @@index([tenantId])
}

model QuizAttempt {
  id             String  @id @default(uuid())
  score          Float   @default(0)
  totalQuestions Int     @default(0)
  percentage     Float   @default(0)
  isPassed       Boolean @default(false)
  answers        Json    @default("[]")
  courseId       String?
  course         Course? @relation(fields: [courseId], references: [id])
  tenantId       String?

  quizId String
  quiz   Quiz   @relation(fields: [quizId], references: [id], onDelete: Cascade)

  userId String
  user   User   @relation(fields: [userId], references: [id], onDelete: Cascade)

  completedAt DateTime? @default(now())
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt

  @@index([userId, quizId, createdAt])
  @@index([tenantId])
}

model Question {
  id            String   @id @default(uuid())
  question      String
  type          String   @default("mcq") // mcq, msq, true_false, fill_blank, subjective
  options       Json     @default("[]") // Array of { text, isCorrect }
  correctAnswer String?  @default("")
  marks         Float    @default(1)
  negativeMarks Float    @default(0)
  explanation   String?  @default("")
  difficulty    String   @default("medium") // easy, medium, hard
  tags          String[] @default([])
  subject       String?  @default("")
  topic         String?  @default("")
  status        String   @default("draft") // draft, published
  tenantId      String?

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([subject, topic])
  @@index([status])
  @@index([tenantId])
}

model GeneratedQuiz {
  id        String  @id @default(uuid())
  title     String
  courseId  String
  course    Course  @relation(fields: [courseId], references: [id], onDelete: Cascade)
  teacherId String
  teacher   User    @relation("TeacherGeneratedQuizzes", fields: [teacherId], references: [id])
  questions Json    @default("[]")
  status    String  @default("saved") // draft, saved
  tenantId  String?

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([courseId])
  @@index([teacherId])
}

// ------------------------------------------------------
// 4. Commerce, Payments, Subscriptions & Coupons
// ------------------------------------------------------

model SubscriptionPlan {
  id           String   @id @default(uuid())
  name         String   @unique // starter, growth, premium
  price        Float
  billingCycle String   @default("monthly") // monthly, yearly
  studentLimit Int      @default(100)
  teacherLimit Int      @default(5)
  storageLimit Float    @default(10737418240) // 10 GB in bytes
  features     String[] @default([])
  isActive     Boolean  @default(true)

  payments Payment[]

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([isActive])
}

model Payment {
  id            String    @id @default(uuid())
  amount        Float
  currency      String    @default("INR")
  status        String    @default("pending") // pending, completed, failed, refunded
  method        String?
  transactionId String?   @unique
  orderId       String?   @unique
  paymentId     String?
  signature     String?
  provider      String    @default("razorpay") // razorpay, stripe, free, demo
  discount      Float     @default(0)
  tax           Float     @default(0)
  netAmount     Float     @default(0)
  refundId      String?
  refundAmount  Float     @default(0)
  refundedAt    DateTime?
  metadata      Json?     @default("{}")
  tenantId      String?

  userId String
  user   User   @relation(fields: [userId], references: [id])

  courseId String?
  course   Course? @relation(fields: [courseId], references: [id])

  testId String?
  test   Test?   @relation(fields: [testId], references: [id])

  subscriptionPlanId String?
  subscriptionPlan   SubscriptionPlan? @relation(fields: [subscriptionPlanId], references: [id])

  couponId String?
  coupon   Coupon? @relation(fields: [couponId], references: [id])

  referralRecords ReferralRecord[]

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([userId, createdAt])
  @@index([status, createdAt])
  @@index([tenantId])
}

model Coupon {
  id                   String    @id @default(uuid())
  code                 String    @unique
  description          String?   @default("")
  discountType         String    @default("percentage") // percentage, fixed
  discountValue        Float     @default(0)
  discountPercent      Float     @default(0)
  minPurchase          Float     @default(0)
  maxDiscount          Float?
  usageLimit           Int       @default(0) // 0 = unlimited
  usedCount            Int       @default(0)
  perUserLimit         Int       @default(1)
  applicableCourses    String[]  @default([])
  applicableCategories String[]  @default([])
  startDate            DateTime? @default(now())
  endDate              DateTime?
  validUntil           DateTime?
  isActive             Boolean   @default(true)
  usedBy               Json?     @default("[]")
  tenantId             String?

  payments Payment[]

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([code])
  @@index([isActive])
  @@index([tenantId])
}

model Affiliate {
  id             String  @id @default(uuid())
  userId         String
  user           User    @relation(fields: [userId], references: [id], onDelete: Cascade)
  referralCode   String  @unique
  commissionRate Float   @default(10) // percentage
  totalReferrals Int     @default(0)
  totalEarnings  Float   @default(0)
  pendingPayout  Float   @default(0)
  paidOut        Float   @default(0)
  isActive       Boolean @default(true)
  tenantId       String?

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([userId])
  @@index([isActive])
  @@index([tenantId])
}

model ReferralRecord {
  id               String    @id @default(uuid())
  referralCode     String
  referrerId       String
  referrer         User      @relation("ReferrerRecords", fields: [referrerId], references: [id])
  referredId       String
  referred         User      @relation("ReferredRecords", fields: [referredId], references: [id])
  paymentId        String?
  payment          Payment?  @relation(fields: [paymentId], references: [id])
  commissionAmount Float     @default(0)
  status           String    @default("pending") // pending, approved, paid, cancelled
  paidAt           DateTime?
  tenantId         String?

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([referralCode])
  @@index([referrerId])
  @@index([status])
  @@index([tenantId])
}

// ------------------------------------------------------
// 5. Community, Gamification & Communication Models
// ------------------------------------------------------

model Review {
  id           String  @id @default(uuid())
  rating       Int
  comment      String?
  isApproved   Boolean @default(true)
  isFlagged    Boolean @default(false)
  helpfulCount Int     @default(0)
  reportCount  Int     @default(0)
  tenantId     String?

  userId String
  user   User   @relation(fields: [userId], references: [id], onDelete: Cascade)

  courseId String
  course   Course @relation(fields: [courseId], references: [id], onDelete: Cascade)

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@unique([userId, courseId])
  @@index([courseId, createdAt])
  @@index([tenantId])
}

model Discussion {
  id         String   @id @default(uuid())
  title      String
  content    String
  replies    Json?    @default("[]") // Array of { user, content, likes, createdAt }
  likes      String[] @default([]) // Array of User IDs
  isPinned   Boolean  @default(false)
  isResolved Boolean  @default(false)
  tags       String[] @default([])
  viewCount  Int      @default(0)
  lessonId   String?
  tenantId   String?

  userId String
  user   User   @relation(fields: [userId], references: [id], onDelete: Cascade)

  courseId String
  course   Course @relation(fields: [courseId], references: [id], onDelete: Cascade)

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([courseId, createdAt])
  @@index([userId])
  @@index([tenantId])
}

model Note {
  id        String  @id @default(uuid())
  content   String
  timestamp Int     @default(0) // video timestamp in seconds
  color     String  @default("#FFD700")
  isPinned  Boolean @default(false)
  lessonId  String?
  tenantId  String?

  userId String
  user   User   @relation(fields: [userId], references: [id], onDelete: Cascade)

  courseId String
  course   Course @relation(fields: [courseId], references: [id], onDelete: Cascade)

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([userId, courseId, createdAt])
  @@index([tenantId])
}

model Wishlist {
  id     String @id @default(uuid())
  userId String
  user   User   @relation(fields: [userId], references: [id], onDelete: Cascade)

  courseId String
  course   Course @relation(fields: [courseId], references: [id], onDelete: Cascade)

  tenantId String?

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@unique([userId, courseId])
  @@index([tenantId])
}

model LiveClass {
  id              String    @id @default(uuid())
  title           String
  description     String?   @default("")
  scheduledAt     DateTime
  durationMinutes Int       @default(60)
  roomId          String    @unique
  status          String    @default("scheduled") // scheduled, live, ended, cancelled
  startedAt       DateTime?
  endedAt         DateTime?
  recordingUrl    String?   @default("")
  attendance      Json?     @default("[]")
  maxParticipants Int       @default(200)
  isRecorded      Boolean   @default(false)
  chatEnabled     Boolean   @default(true)
  reminderSent    Boolean   @default(false)
  tenantId        String?

  teacherId String
  teacher   User   @relation("TeacherLiveClasses", fields: [teacherId], references: [id])

  courseId String?
  course   Course? @relation(fields: [courseId], references: [id])

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([teacherId, scheduledAt])
  @@index([courseId])
  @@index([status])
  @@index([tenantId])
}

model Badge {
  id          String  @id @default(uuid())
  name        String  @unique
  slug        String  @unique
  description String
  icon        String
  category    String // learning, achievement, streak, social, special
  criteria    Json // { type: String, value: Number }
  points      Int     @default(0)
  rarity      String  @default("common") // common, rare, epic, legendary
  isActive    Boolean @default(true)

  userBadges UserBadge[]

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([isActive])
}

model UserBadge {
  id       String   @id @default(uuid())
  userId   String
  user     User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  badgeId  String
  badge    Badge    @relation(fields: [badgeId], references: [id], onDelete: Cascade)
  earnedAt DateTime @default(now())
  tenantId String?

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@unique([userId, badgeId])
  @@index([tenantId])
}

model Notification {
  id          String    @id @default(uuid())
  type        String // system, course, test, achievement, payment, announcement, discussion, review
  title       String
  message     String
  link        String?   @default("")
  metadata    Json?     @default("{}")
  isRead      Boolean   @default(false)
  readAt      DateTime?
  isBroadcast Boolean   @default(false)
  targetRoles String[]  @default([])
  tenantId    String?

  recipientId String
  recipient   User   @relation("RecipientNotifications", fields: [recipientId], references: [id], onDelete: Cascade)

  senderId String?
  sender   User?   @relation("SenderNotifications", fields: [senderId], references: [id])

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([recipientId, isRead, createdAt])
  @@index([createdAt])
  @@index([tenantId])
}

model Message {
  id          String  @id @default(uuid())
  senderId    String
  sender      User    @relation("SenderMessages", fields: [senderId], references: [id])
  recipientId String
  recipient   User    @relation("RecipientMessages", fields: [recipientId], references: [id])
  studentId   String
  student     User    @relation("StudentMessages", fields: [studentId], references: [id])
  content     String
  threadId    String
  tenantId    String?

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([threadId, createdAt])
  @@index([senderId])
  @@index([recipientId])
  @@index([tenantId])
}

model SupportTicket {
  id          String     @id @default(uuid())
  name        String
  email       String
  subject     String
  message     String
  status      String     @default("open") // open, in_progress, resolved, closed
  priority    String     @default("medium") // low, medium, high
  userId      String?
  user        User?      @relation(fields: [userId], references: [id])
  instituteId String?
  institute   Institute? @relation(fields: [instituteId], references: [id])
  tenantId    String?

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([status])
  @@index([userId])
  @@index([tenantId])
}

model Blog {
  id          String    @id @default(uuid())
  title       String
  slug        String    @unique
  content     String
  excerpt     String?   @default("")
  coverImage  Json?
  type        String    @default("article") // article, job_alert, current_affairs
  status      String    @default("draft") // draft, published
  tags        String[]  @default([])
  views       Int       @default(0)
  publishedAt DateTime?
  jobAlert    Json?
  tenantId    String?

  authorId String?
  author   User?   @relation(fields: [authorId], references: [id])

  categoryId String?
  category   Category? @relation(fields: [categoryId], references: [id])

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([slug])
  @@index([status])
  @@index([type])
  @@index([categoryId])
  @@index([tenantId])
}
```

---

## 5. Verification Method

To independently verify these findings and the proposed schema:

1. **Verify Schema Validation**:

   ```bash
   cd /Users/balveerchoudhary/testbook-platform/server
   npx prisma validate --schema=/Users/balveerchoudhary/testbook-platform/.agents/teamwork_preview_explorer_m1_3/proposed_schema.prisma
   ```

   _Expected Output_: `The schema at ../.agents/teamwork_preview_explorer_m1_3/proposed_schema.prisma is valid 🚀` (Exit code: 0)

2. **Verify Schema Formatting**:

   ```bash
   cd /Users/balveerchoudhary/testbook-platform/server
   npx prisma format --schema=/Users/balveerchoudhary/testbook-platform/.agents/teamwork_preview_explorer_m1_3/proposed_schema.prisma
   ```

   _Expected Output_: `Formatted ... in XXms 🚀` (Exit code: 0)

3. **Verify Model Count & Coverage**:

   ```bash
   grep -E "^model " /Users/balveerchoudhary/testbook-platform/.agents/teamwork_preview_explorer_m1_3/proposed_schema.prisma | wc -l
   ```

   _Expected Output_: `35` (34 Mongoose models + `Lesson`)

4. **Verify Postgres Array & JSON Types**:
   ```bash
   grep -E "String\[\]|Json" /Users/balveerchoudhary/testbook-platform/.agents/teamwork_preview_explorer_m1_3/proposed_schema.prisma
   ```
   _Expected Output_: Correct Prisma types supported natively on PostgreSQL.
