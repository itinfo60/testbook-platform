# Prisma Setup & Schema Survey Report

## 1. Observation

### 1.1 Schema File Location & Content

- **Location**: `/Users/balveerchoudhary/testbook-platform/server/prisma/schema.prisma`
- **Prisma Configuration File**: `/Users/balveerchoudhary/testbook-platform/server/prisma.config.ts`
  - Defines `schema: "prisma/schema.prisma"`, `datasource: { url: env("DIRECT_URL") || env("DATABASE_URL") }`.
- **Datasource & Generator**:
  - Generator: `prisma-client-js`
  - Datasource Provider: `postgresql` (with `@prisma/adapter-pg` driver adapter)
  - Prisma CLI & Client Version: `7.9.1` (in `package.json`)
- **Validation & Generation Result**:
  - `npx prisma validate`: Exited with code 0 ("The schema at prisma/schema.prisma is valid 🚀").
  - `npx prisma generate`: Exited with code 0 ("Generated Prisma Client (v7.9.1) to ./node_modules/@prisma/client in 105ms").

### 1.2 Prisma Models, Relations, Field Types & IDs

The Prisma schema defines exactly **14 models**. All models use `id String @id @default(uuid())` as their primary key.

| Model             | ID Strategy                      | Fields & Types                                                                                                                                                                                                                                                                                        | Relations & Constraints                                                                                                                                                                                                               |
| :---------------- | :------------------------------- | :---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **`User`**        | `id String @id @default(uuid())` | `email String @unique`<br>`name String`<br>`password String`<br>`role String @default("student")`<br>`isEmailVerified Boolean @default(false)`<br>`isActive Boolean @default(true)`<br>`avatar String?`<br>`phone String?`<br>`createdAt DateTime @default(now())`<br>`updatedAt DateTime @updatedAt` | `enrollments Enrollment[]`<br>`courses Course[] @relation("TeacherCourses")`<br>`reviews Review[]`<br>`payments Payment[]`<br>`testAttempts TestAttempt[]`<br>`quizAttempts QuizAttempt[]`                                            |
| **`Institute`**   | `id String @id @default(uuid())` | `name String`<br>`subdomain String @unique`<br>`websiteTitle String?`<br>`theme Json?`<br>`logo Json?`<br>`contactDetails Json?`<br>`createdAt DateTime @default(now())`<br>`updatedAt DateTime @updatedAt`                                                                                           | None                                                                                                                                                                                                                                  |
| **`Category`**    | `id String @id @default(uuid())` | `name String`<br>`slug String @unique`<br>`description String?`<br>`type String @default("exam")`<br>`createdAt DateTime @default(now())`<br>`updatedAt DateTime @updatedAt`                                                                                                                          | `courses Course[]`<br>`tests Test[]`                                                                                                                                                                                                  |
| **`Course`**      | `id String @id @default(uuid())` | `title String`<br>`slug String @unique`<br>`description String?`<br>`price Float @default(0)`<br>`isPublished Boolean @default(false)`<br>`thumbnail String?`<br>`teacherId String`<br>`categoryId String?`<br>`createdAt DateTime @default(now())`<br>`updatedAt DateTime @updatedAt`                | `teacher User @relation("TeacherCourses", fields: [teacherId], references: [id])`<br>`category Category? @relation(fields: [categoryId], references: [id])`<br>`enrollments Enrollment[]`<br>`reviews Review[]`<br>`lessons Lesson[]` |
| **`Lesson`**      | `id String @id @default(uuid())` | `title String`<br>`content String?`<br>`videoUrl String?`<br>`order Int @default(0)`<br>`courseId String`<br>`createdAt DateTime @default(now())`<br>`updatedAt DateTime @updatedAt`                                                                                                                  | `course Course @relation(fields: [courseId], references: [id])`                                                                                                                                                                       |
| **`Enrollment`**  | `id String @id @default(uuid())` | `status String @default("active")`<br>`progressPercent Float @default(0)`<br>`userId String`<br>`courseId String`<br>`enrolledAt DateTime @default(now())`<br>`completedAt DateTime?`                                                                                                                 | `user User @relation(fields: [userId], references: [id])`<br>`course Course @relation(fields: [courseId], references: [id])`<br>`@@unique([userId, courseId])`                                                                        |
| **`Test`**        | `id String @id @default(uuid())` | `title String`<br>`description String?`<br>`duration Int` (minutes)<br>`totalMarks Float`<br>`isPublished Boolean @default(false)`<br>`categoryId String?`<br>`questions Json`<br>`createdAt DateTime @default(now())`<br>`updatedAt DateTime @updatedAt`                                             | `category Category? @relation(fields: [categoryId], references: [id])`<br>`attempts TestAttempt[]`                                                                                                                                    |
| **`TestAttempt`** | `id String @id @default(uuid())` | `score Float @default(0)`<br>`status String @default("completed")`<br>`answers Json`<br>`testId String`<br>`userId String`<br>`startedAt DateTime @default(now())`<br>`completedAt DateTime?`                                                                                                         | `test Test @relation(fields: [testId], references: [id])`<br>`user User @relation(fields: [userId], references: [id])`                                                                                                                |
| **`Quiz`**        | `id String @id @default(uuid())` | `title String`<br>`description String?`<br>`isPublished Boolean @default(false)`<br>`questions Json`<br>`createdAt DateTime @default(now())`<br>`updatedAt DateTime @updatedAt`                                                                                                                       | `attempts QuizAttempt[]`                                                                                                                                                                                                              |
| **`QuizAttempt`** | `id String @id @default(uuid())` | `score Float @default(0)`<br>`answers Json`<br>`quizId String`<br>`userId String`<br>`createdAt DateTime @default(now())`                                                                                                                                                                             | `quiz Quiz @relation(fields: [quizId], references: [id])`<br>`user User @relation(fields: [userId], references: [id])`                                                                                                                |
| **`Payment`**     | `id String @id @default(uuid())` | `amount Float`<br>`currency String @default("INR")`<br>`status String @default("pending")`<br>`method String?`<br>`transactionId String? @unique`<br>`userId String`<br>`createdAt DateTime @default(now())`<br>`updatedAt DateTime @updatedAt`                                                       | `user User @relation(fields: [userId], references: [id])`                                                                                                                                                                             |
| **`Review`**      | `id String @id @default(uuid())` | `rating Int`<br>`comment String?`<br>`userId String`<br>`courseId String`<br>`createdAt DateTime @default(now())`<br>`updatedAt DateTime @updatedAt`                                                                                                                                                  | `user User @relation(fields: [userId], references: [id])`<br>`course Course @relation(fields: [courseId], references: [id])`                                                                                                          |
| **`Blog`**        | `id String @id @default(uuid())` | `title String`<br>`slug String @unique`<br>`content String`<br>`status String @default("draft")`<br>`tags String[]`<br>`createdAt DateTime @default(now())`<br>`updatedAt DateTime @updatedAt`                                                                                                        | None                                                                                                                                                                                                                                  |
| **`Coupon`**      | `id String @id @default(uuid())` | `code String @unique`<br>`discountPercent Float`<br>`maxDiscount Float?`<br>`validUntil DateTime?`<br>`isActive Boolean @default(true)`<br>`createdAt DateTime @default(now())`<br>`updatedAt DateTime @updatedAt`                                                                                    | None                                                                                                                                                                                                                                  |

---

### 1.3 Centralized Prisma Client Instance

- **Location**: `/Users/balveerchoudhary/testbook-platform/server/src/config/prisma.js`
- **Initialization code**:

```javascript
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

// Setup pg connection pool and Prisma adapter
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);

// Prevent multiple instances of Prisma Client in development
const globalForPrisma = globalThis;

export const prisma = globalForPrisma.prisma || new PrismaClient({ adapter });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

export default prisma;
```

- **Export type**: Both named (`export const prisma`) and default (`export default prisma`).
- **Prisma Client Property Accessors**:
  - `prisma.user`
  - `prisma.institute`
  - `prisma.category` (Note: `Category`, not `ExamCategory`)
  - `prisma.course`
  - `prisma.lesson`
  - `prisma.enrollment`
  - `prisma.test`
  - `prisma.testAttempt`
  - `prisma.quiz`
  - `prisma.quizAttempt`
  - `prisma.payment`
  - `prisma.review`
  - `prisma.blog`
  - `prisma.coupon`

---

### 1.4 Mongoose Models Inventory & Detailed Mapping to Prisma

There are **34 Mongoose model definitions** across `server/src/`:

| Mongoose Model File                               | Mongoose Model Name | Prisma Model Name                    | Key Field / Relation / Type Differences                                                                                                                                                                                                                                                                                                       |
| :------------------------------------------------ | :------------------ | :----------------------------------- | :-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/modules/user/user.model.ts`                  | `User`              | `User` (`prisma.user`)               | • `_id` (ObjectId) -> `id` (UUID String)<br>• `avatar` ({url, publicId}) -> `avatar` (String?)<br>• Password hashing & token helper methods (`comparePassword`, `generateAccessToken`) must be moved to auth utility functions or service layer.<br>• Virtuals/select fields (`+password`) handled via Prisma `select` / `omit`.              |
| `src/modules/institute/institute.model.ts`        | `Institute`         | `Institute` (`prisma.institute`)     | • `_id` (ObjectId) -> `id` (UUID String)<br>• `theme`, `logo`, `contactDetails` are stored as `Json?`.                                                                                                                                                                                                                                        |
| `src/modules/exam-category/examCategory.model.js` | `ExamCategory`      | `Category` (`prisma.category`)       | • **Name change**: `ExamCategory` -> `Category`<br>• `_id` (ObjectId) -> `id` (UUID String)<br>• Relations: `courses Course[]`, `tests Test[]`.                                                                                                                                                                                               |
| `src/modules/course/course.model.ts`              | `Course`            | `Course` (`prisma.course`)           | • `_id` (ObjectId) -> `id` (UUID String)<br>• `teacher` (ObjectId ref User) -> `teacherId` (String) + `teacher` (User relation)<br>• `category` (ObjectId ref ExamCategory) -> `categoryId` (String?) + `category` (Category relation)<br>• `sections[].lessons[]` (embedded) -> relational `Lesson` model (`prisma.lesson` with `courseId`). |
| (Embedded in `course.model.ts`)                   | Embedded `Lesson`   | `Lesson` (`prisma.lesson`)           | • Embedded subdocument in Mongoose -> Relational entity in Prisma (`courseId` foreign key to `Course.id`).                                                                                                                                                                                                                                    |
| `src/modules/enrollment/enrollment.model.js`      | `Enrollment`        | `Enrollment` (`prisma.enrollment`)   | • `_id` (ObjectId) -> `id` (UUID String)<br>• `user` (ref User) -> `userId` (relation `user`)<br>• `course` (ref Course) -> `courseId` (relation `course`)<br>• `progressPercentage` -> `progressPercent`<br>• Composite unique constraint: `@@unique([userId, courseId])`.                                                                   |
| `src/modules/test/test.model.ts`                  | `Test`              | `Test` (`prisma.test`)               | • `_id` (ObjectId) -> `id` (UUID String)<br>• `category` (ref ExamCategory) -> `categoryId` (relation `category`)<br>• `questions` embedded array -> `questions Json` in Prisma.                                                                                                                                                              |
| `src/modules/test/testAttempt.model.ts`           | `TestAttempt`       | `TestAttempt` (`prisma.testAttempt`) | • `_id` (ObjectId) -> `id` (UUID String)<br>• `user` (ref User) -> `userId` (relation `user`)<br>• `test` (ref Test) -> `testId` (relation `test`)<br>• `answers` array -> `answers Json`.                                                                                                                                                    |
| `src/modules/quiz/quiz.model.js`                  | `Quiz`              | `Quiz` (`prisma.quiz`)               | • `_id` (ObjectId) -> `id` (UUID String)<br>• `questions` array -> `questions Json`.                                                                                                                                                                                                                                                          |
| `src/modules/quiz/quizAttempt.model.js`           | `QuizAttempt`       | `QuizAttempt` (`prisma.quizAttempt`) | • `_id` (ObjectId) -> `id` (UUID String)<br>• `user` (ref User) -> `userId` (relation `user`)<br>• `quiz` (ref Quiz) -> `quizId` (relation `quiz`)<br>• `answers` array -> `answers Json`.                                                                                                                                                    |
| `src/modules/payment/payment.model.ts`            | `Payment`           | `Payment` (`prisma.payment`)         | • `_id` (ObjectId) -> `id` (UUID String)<br>• `user` (ref User) -> `userId` (relation `user`)<br>• `orderId` / `paymentId` -> `transactionId String? @unique`<br>• `amount`, `currency`, `status`, `method`.                                                                                                                                  |
| `src/modules/review/review.model.ts`              | `Review`            | `Review` (`prisma.review`)           | • `_id` (ObjectId) -> `id` (UUID String)<br>• `user` (ref User) -> `userId` (relation `user`)<br>• `course` (ref Course) -> `courseId` (relation `course`)<br>• Average rating calculation moved to service logic using `prisma.review.aggregate`.                                                                                            |
| `src/modules/blog/blog.model.js`                  | `Blog`              | `Blog` (`prisma.blog`)               | • `_id` (ObjectId) -> `id` (UUID String)<br>• `tags` -> `tags String[]` (native Postgres array).                                                                                                                                                                                                                                              |
| `src/modules/coupon/coupon.model.ts`              | `Coupon`            | `Coupon` (`prisma.coupon`)           | • `_id` (ObjectId) -> `id` (UUID String)<br>• `discountValue` -> `discountPercent Float`<br>• `endDate` -> `validUntil DateTime?`.                                                                                                                                                                                                            |

#### Non-Prisma Mongoose Models (20 models)

The following Mongoose models exist in `src/modules/` or `src/models/` but do not have dedicated tables in the base `schema.prisma`:

1. `src/models/settings.model.ts` (`PlatformSettings`)
2. `src/modules/affiliate/affiliate.model.js` (`Affiliate`, `ReferralRecord`)
3. `src/modules/aiQuiz/generatedQuiz.model.js` (`GeneratedQuiz`)
4. `src/modules/apikey/apikey.model.js` (`ApiKey`)
5. `src/modules/attendance/attendance.model.ts` (`Attendance`)
6. `src/modules/audit/audit.model.js` (`AuditLog`)
7. `src/modules/badge/badge.model.ts` (`Badge`)
8. `src/modules/badge/userBadge.model.ts` (`UserBadge`)
9. `src/modules/discussion/discussion.model.ts` (`Discussion`)
10. `src/modules/library/library.model.ts` (`LibraryResource`)
11. `src/modules/liveclass/liveclass.model.js` (`LiveClass`)
12. `src/modules/note/note.model.ts` (`Note`)
13. `src/modules/notification/notification.model.js` (`Notification`)
14. `src/modules/parent/message.model.ts` (`Message`)
15. `src/modules/subscription/subscriptionPlan.model.ts` (`SubscriptionPlan`)
16. `src/modules/support/supportTicket.model.ts` (`SupportTicket`)
17. `src/modules/test/question.model.ts` (`Question`)
18. `src/modules/test-series/testSeries.model.js` (`TestSeries`)
19. `src/modules/user/userActivity.model.js` (`UserActivity`)
20. `src/modules/wishlist/wishlist.model.js` (`Wishlist`)

---

## 2. Logic Chain

### 2.1 Mongoose to Prisma Query Translation Patterns

From our analysis of controller and repository patterns in `src/modules/`, here is the direct translation standard:

1. **Find by ID / Unique Field**:
   - _Mongoose_: `User.findById(id)` or `User.findOne({ email })`
   - _Prisma_: `prisma.user.findUnique({ where: { id } })` or `prisma.user.findUnique({ where: { email } })`

2. **Find with Filters, Sorting, and Pagination**:
   - _Mongoose_: `Course.find({ isPublished: true }).sort('-createdAt').skip(skip).limit(limit)`
   - _Prisma_: `prisma.course.findMany({ where: { isPublished: true }, orderBy: { createdAt: 'desc' }, skip, take: limit })`

3. **Populate / Relations**:
   - _Mongoose_: `Course.find().populate('teacher', 'name avatar').populate('category', 'name')`
   - _Prisma_:
     ```javascript
     prisma.course.findMany({
       include: {
         teacher: { select: { id: true, name: true, avatar: true } },
         category: { select: { id: true, name: true, slug: true } },
       },
     });
     ```

4. **Creation**:
   - _Mongoose_: `Course.create({ title, price, teacher: teacherId, category: categoryId })`
   - _Prisma_:
     ```javascript
     prisma.course.create({
       data: {
         title,
         price,
         teacherId,
         categoryId,
       },
     });
     ```

5. **Update**:
   - _Mongoose_: `Course.findByIdAndUpdate(id, updates, { new: true })`
   - _Prisma_: `prisma.course.update({ where: { id }, data: updates })`

6. **Delete**:
   - _Mongoose_: `Course.findByIdAndDelete(id)`
   - _Prisma_: `prisma.course.delete({ where: { id } })`

7. **Count**:
   - _Mongoose_: `User.countDocuments({ isActive: true })`
   - _Prisma_: `prisma.user.count({ where: { isActive: true } })`

8. **Aggregations & Analytics**:
   - _Mongoose_: `Payment.aggregate([{ $match: { status: 'completed' } }, { $group: { _id: null, total: { $sum: '$amount' } } }])`
   - _Prisma_: `prisma.payment.aggregate({ where: { status: 'completed' }, _sum: { amount: true }, _avg: { amount: true }, _count: true })`

9. **Composite Unique Lookup / Upsert**:
   - _Mongoose_: `Enrollment.findOne({ user: userId, course: courseId })`
   - _Prisma_: `prisma.enrollment.findUnique({ where: { userId_courseId: { userId, courseId } } })`

### 2.2 Critical Schema & Naming Discrepancies

- **`ExamCategory` -> `Category`**:
  All Mongoose references to `ExamCategory` in imports and queries must now use `prisma.category`.
- **`Course.sections[].lessons[]` -> `Lesson` relational model**:
  Lessons can either be queried directly via `prisma.lesson.findMany({ where: { courseId } })` or included inside course queries via `prisma.course.findUnique({ where: { id }, include: { lessons: { orderBy: { order: 'asc' } } } })`.
- **IDs**:
  All `_id` references in API response transformations must map to `id` (or assign `_id = doc.id` in response serialisation for frontend compatibility if needed).
- **JSON Fields**:
  Questions in `Test` and `Quiz`, answers in `TestAttempt` and `QuizAttempt`, and branding in `Institute` are stored as native JSON in PostgreSQL.

---

## 3. Caveats

1. **Unlisted Models**: There are 20 Mongoose models in `src/modules/` (e.g. `Wishlist`, `Badge`, `Discussion`, `SubscriptionPlan`, `Note`) that are not present in `prisma/schema.prisma`.
   - For modules where controllers use these models, the implementation specialists should either:
     - Expand `schema.prisma` with additional Prisma models and run `npx prisma generate`, OR
     - Provide Prisma-backed / in-memory or JSON storage equivalents without Mongoose imports.
2. **Server Startup Dependencies**:
   - `src/server.js` calls `database.connect()`, which connects to MongoDB via Mongoose. This must be updated to connect/verify Prisma Client instead of Mongoose.
   - `src/app.js` uses `express-mongo-sanitize`, which can be safely replaced or bypassed since Prisma uses parameterised queries.
   - `src/instrument.js` uses `Sentry.mongooseIntegration()`, which should be removed or changed to `Sentry.prismaIntegration()`.
3. **Password Hashing & JWT Methods**:
   - Mongoose `User` schema had `.pre('save')` for bcrypt hashing, `comparePassword`, `generateAccessToken`, and `generateRefreshToken`. When removing `user.model.ts`, these helpers must be placed in a dedicated auth utility (e.g., `src/modules/auth/auth.utils.ts` or directly in `auth.service.ts`).

---

## 4. Conclusion

1. **Prisma Setup is Ready & Operational**:
   - The PostgreSQL datasource and `@prisma/adapter-pg` driver adapter are cleanly set up in `server/prisma.config.ts` and `server/src/config/prisma.js`.
   - Prisma Client v7.9.1 generates cleanly with `npx prisma generate`.
2. **Centralized Client Access**:
   - All modules should import `{ prisma }` from `src/config/prisma.js` (or `../../config/prisma.js`).
3. **Clear Path for Data Access Layer Rewrite**:
   - The 14 core Prisma models provide full coverage for core user, course, enrollment, testing, quiz, payment, review, blog, coupon, and institute operations.
   - Replacing Mongoose query syntax with standard Prisma Client query methods is straightforward following the documented mapping.

---

## 5. Verification Method

1. **Validate Prisma Schema**:

   ```bash
   cd /Users/balveerchoudhary/testbook-platform/server
   npx prisma validate
   ```

   _Expected result_: Schema is validated with 0 errors.

2. **Generate Prisma Client**:

   ```bash
   cd /Users/balveerchoudhary/testbook-platform/server
   npx prisma generate
   ```

   _Expected result_: Generated Prisma Client (v7.9.1) to `./node_modules/@prisma/client`.

3. **Verify Centralized Client Export**:
   Inspect `/Users/balveerchoudhary/testbook-platform/server/src/config/prisma.js` to ensure `export const prisma` and `export default prisma` exist.

4. **Verify Zero Mongoose Imports in `src/modules/` After Migration**:
   ```bash
   grep -rn "import.*mongoose" /Users/balveerchoudhary/testbook-platform/server/src/modules/
   grep -rn "require(['\"]mongoose['\"])" /Users/balveerchoudhary/testbook-platform/server/src/modules/
   ```
   _Expected result_: Zero matches found.
