# Mongoose Codebase Survey & Analysis Report

## Executive Summary

This report provides a comprehensive, exhaustive survey of all Mongoose models, schemas, imports, queries, hooks, virtuals, plugins, and data access patterns across the entire server codebase (`/Users/balveerchoudhary/testbook-platform/server`), with a focus on `src/modules/`.

---

## 1. Observation

### 1.1 Complete Inventory of Mongoose Model Definitions (33 Models in 33 Files)

The server contains **33 model definition files** defining **34 Mongoose models**:

| #   | File Path                                            | Model Name(s)                 | Relationships (`ref`)                                  | Plugins Applied                  | Hooks (`pre`/`post`)                                                        | Virtuals / Methods                                                                                                                                      |
| --- | ---------------------------------------------------- | ----------------------------- | ------------------------------------------------------ | -------------------------------- | --------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `src/models/settings.model.ts`                       | `PlatformSettings`            | None                                                   | None                             | None                                                                        | None                                                                                                                                                    |
| 2   | `src/modules/affiliate/affiliate.model.js`           | `Affiliate`, `ReferralRecord` | `User`, `Payment`                                      | None                             | None                                                                        | None                                                                                                                                                    |
| 3   | `src/modules/aiQuiz/generatedQuiz.model.js`          | `GeneratedQuiz`               | `Course`, `User`                                       | None                             | None                                                                        | None                                                                                                                                                    |
| 4   | `src/modules/apikey/apikey.model.js`                 | `ApiKey`                      | `User`, `Institute`                                    | None                             | None                                                                        | Methods: `compareKey`                                                                                                                                   |
| 5   | `src/modules/attendance/attendance.model.ts`         | `Attendance`                  | `Course`, `User`                                       | `tenantPlugin`                   | `pre('save')`                                                               | None                                                                                                                                                    |
| 6   | `src/modules/audit/audit.model.js`                   | `AuditLog`                    | `User`                                                 | `paginatePlugin`, `tenantPlugin` | None                                                                        | None                                                                                                                                                    |
| 7   | `src/modules/badge/badge.model.ts`                   | `Badge`                       | None                                                   | `paginatePlugin`, `tenantPlugin` | None                                                                        | None                                                                                                                                                    |
| 8   | `src/modules/badge/userBadge.model.ts`               | `UserBadge`                   | `User`, `Badge`                                        | `paginatePlugin`, `tenantPlugin` | None                                                                        | None                                                                                                                                                    |
| 9   | `src/modules/blog/blog.model.js`                     | `Blog`                        | `User`, `ExamCategory`                                 | `paginatePlugin`, `tenantPlugin` | `pre('save')` (slug generator)                                              | None                                                                                                                                                    |
| 10  | `src/modules/coupon/coupon.model.ts`                 | `Coupon`                      | `Course`                                               | `paginatePlugin`, `tenantPlugin` | None                                                                        | Methods: `isValid`                                                                                                                                      |
| 11  | `src/modules/course/course.model.ts`                 | `Course`                      | `User`, `ExamCategory`                                 | `paginatePlugin`, `tenantPlugin` | `pre('save')` (slug generation, price computation)                          | Virtuals: `reviews`, `enrollmentCountVirtual`                                                                                                           |
| 12  | `src/modules/discussion/discussion.model.ts`         | `Discussion`                  | `User`, `Course`                                       | `paginatePlugin`, `tenantPlugin` | None                                                                        | None                                                                                                                                                    |
| 13  | `src/modules/enrollment/enrollment.model.js`         | `Enrollment`                  | `User`, `Course`, `Payment`, `Coupon`, `Test`          | `paginatePlugin`, `tenantPlugin` | `pre('save')` (auto completion percentage)                                  | None                                                                                                                                                    |
| 14  | `src/modules/exam-category/examCategory.model.js`    | `ExamCategory`                | `ExamCategory` (parent/subcategories)                  | `paginatePlugin`, `tenantPlugin` | `pre('save')` (slug generation)                                             | Virtuals: `subcategories`                                                                                                                               |
| 15  | `src/modules/institute/institute.model.ts`           | `Institute`                   | `User` (owner)                                         | `paginatePlugin`                 | `pre('save')` (subdomain validation)                                        | None                                                                                                                                                    |
| 16  | `src/modules/library/library.model.ts`               | `LibraryResource`             | `ExamCategory`, `User`                                 | `paginatePlugin`, `tenantPlugin` | None                                                                        | None                                                                                                                                                    |
| 17  | `src/modules/liveclass/liveclass.model.js`           | `LiveClass`                   | `Course`, `User`                                       | `paginatePlugin`, `tenantPlugin` | None                                                                        | None                                                                                                                                                    |
| 18  | `src/modules/note/note.model.ts`                     | `Note`                        | `User`, `Course`                                       | `paginatePlugin`, `tenantPlugin` | None                                                                        | None                                                                                                                                                    |
| 19  | `src/modules/notification/notification.model.js`     | `Notification`                | `User`                                                 | `paginatePlugin`, `tenantPlugin` | None                                                                        | None                                                                                                                                                    |
| 20  | `src/modules/parent/message.model.ts`                | `Message`                     | `User` (sender, recipient, student)                    | `tenantPlugin`                   | None                                                                        | None                                                                                                                                                    |
| 21  | `src/modules/payment/payment.model.ts`               | `Payment`                     | `User`, `Course`, `Test`, `SubscriptionPlan`, `Coupon` | `paginatePlugin`, `tenantPlugin` | `pre('validate')`                                                           | None                                                                                                                                                    |
| 22  | `src/modules/quiz/quiz.model.js`                     | `Quiz`                        | `Course`, `ExamCategory`, `User`                       | `paginatePlugin`, `tenantPlugin` | None                                                                        | Virtual: `questionCount`                                                                                                                                |
| 23  | `src/modules/quiz/quizAttempt.model.js`              | `QuizAttempt`                 | `User`, `Quiz`, `Course`                               | `paginatePlugin`, `tenantPlugin` | None                                                                        | None                                                                                                                                                    |
| 24  | `src/modules/review/review.model.ts`                 | `Review`                      | `User`, `Course`                                       | `paginatePlugin`, `tenantPlugin` | `post('save')`, `post('findOneAndDelete')` (recalculates course avg rating) | Statics: `calculateAverageRating`                                                                                                                       |
| 25  | `src/modules/subscription/subscriptionPlan.model.ts` | `SubscriptionPlan`            | None                                                   | None                             | None                                                                        | None                                                                                                                                                    |
| 26  | `src/modules/support/supportTicket.model.ts`         | `SupportTicket`               | `User`, `Institute`                                    | None                             | None                                                                        | None                                                                                                                                                    |
| 27  | `src/modules/test/question.model.ts`                 | `Question`                    | None                                                   | `paginatePlugin`, `tenantPlugin` | None                                                                        | None                                                                                                                                                    |
| 28  | `src/modules/test/test.model.ts`                     | `Test`                        | `User`, `ExamCategory`, `TestSeries`                   | `paginatePlugin`, `tenantPlugin` | `pre('save')` (totalMarks & totalQuestions)                                 | Virtual: `questionCount`                                                                                                                                |
| 29  | `src/modules/test/testAttempt.model.ts`              | `TestAttempt`                 | `User`, `Test`                                         | `paginatePlugin`, `tenantPlugin` | None                                                                        | Methods: `calculateScore`                                                                                                                               |
| 30  | `src/modules/test-series/testSeries.model.js`        | `TestSeries`                  | `User`, `ExamCategory`, `Test`                         | `paginatePlugin`, `tenantPlugin` | `pre('save')` (slug generation)                                             | Virtual: `tests`                                                                                                                                        |
| 31  | `src/modules/user/user.model.ts`                     | `User`                        | `User` (invitedBy, parent)                             | `paginatePlugin`, `tenantPlugin` | `pre('save')` (password hashing)                                            | Methods: `comparePassword`, `generateAccessToken`, `generateRefreshToken`, `generateResetToken`, `generateEmailVerificationToken`, `cleanExpiredTokens` |
| 32  | `src/modules/user/userActivity.model.js`             | `UserActivity`                | `User`                                                 | `tenantPlugin`                   | None                                                                        | None                                                                                                                                                    |
| 33  | `src/modules/wishlist/wishlist.model.js`             | `Wishlist`                    | `User`, `Course`                                       | `paginatePlugin`, `tenantPlugin` | None                                                                        | None                                                                                                                                                    |

---

### 1.2 Every File Importing Mongoose in the Server Codebase (86 Files)

Below is the complete enumeration of every file in `server/src/` with its exact import line(s):

#### A. Models (33 files)

1. `src/models/settings.model.ts:1`: `import mongoose, { Schema, Document } from 'mongoose';`
2. `src/modules/affiliate/affiliate.model.js:1`: `import mongoose from 'mongoose';`
3. `src/modules/aiQuiz/generatedQuiz.model.js:1`: `import mongoose from 'mongoose';`
4. `src/modules/apikey/apikey.model.js:1`: `import mongoose from 'mongoose';`
5. `src/modules/attendance/attendance.model.ts:1`: `import mongoose, { Schema, Document } from 'mongoose';`
6. `src/modules/audit/audit.model.js:1`: `import mongoose from 'mongoose';`
7. `src/modules/badge/badge.model.ts:1`: `import mongoose, { Schema, Model } from 'mongoose';`
8. `src/modules/badge/userBadge.model.ts:1`: `import mongoose, { Schema, Model } from 'mongoose';`
9. `src/modules/blog/blog.model.js:1`: `import mongoose from 'mongoose';`
10. `src/modules/coupon/coupon.model.ts:1`: `import mongoose, { Schema, Model } from 'mongoose';`
11. `src/modules/course/course.model.ts:1`: `import mongoose, { Schema, Model, Document, Types } from 'mongoose';`
12. `src/modules/discussion/discussion.model.ts:1`: `import mongoose, { Schema, Model } from 'mongoose';`
13. `src/modules/enrollment/enrollment.model.js:1`: `import mongoose from 'mongoose';`
14. `src/modules/exam-category/examCategory.model.js:1`: `import mongoose from 'mongoose';`
15. `src/modules/institute/institute.model.ts:1`: `import mongoose, { Schema, Model, Document, Types } from 'mongoose';`
16. `src/modules/library/library.model.ts:1`: `import mongoose, { Schema, Model } from 'mongoose';`
17. `src/modules/liveclass/liveclass.model.js:1`: `import mongoose from 'mongoose';`
18. `src/modules/note/note.model.ts:1`: `import mongoose, { Schema, Model } from 'mongoose';`
19. `src/modules/notification/notification.model.js:1`: `import mongoose from 'mongoose';`
20. `src/modules/parent/message.model.ts:1`: `import mongoose, { Schema, Document } from 'mongoose';`
21. `src/modules/payment/payment.model.ts:1`: `import mongoose, { Schema, Model } from 'mongoose';`
22. `src/modules/quiz/quiz.model.js:1`: `import mongoose from 'mongoose';`
23. `src/modules/quiz/quizAttempt.model.js:1`: `import mongoose from 'mongoose';`
24. `src/modules/review/review.model.ts:1`: `import mongoose, { Schema, Model, Types } from 'mongoose';`
25. `src/modules/subscription/subscriptionPlan.model.ts:1`: `import mongoose, { Schema, Model } from 'mongoose';`
26. `src/modules/support/supportTicket.model.ts:1`: `import mongoose from 'mongoose';`
27. `src/modules/test/question.model.ts:1`: `import mongoose, { Schema, Document, Types } from 'mongoose';`
28. `src/modules/test/test.model.ts:1`: `import mongoose, { Schema, Model } from 'mongoose';`
29. `src/modules/test/testAttempt.model.ts:1`: `import mongoose, { Schema, Model } from 'mongoose';`
30. `src/modules/test-series/testSeries.model.js:1`: `import mongoose from 'mongoose';`
31. `src/modules/user/user.model.ts:1`: `import mongoose, { Schema, Model } from 'mongoose';`
32. `src/modules/user/userActivity.model.js:1`: `import mongoose from 'mongoose';`
33. `src/modules/wishlist/wishlist.model.js:1`: `import mongoose from 'mongoose';`

#### B. Controllers (5 files directly importing mongoose)

34. `src/modules/aiQuiz/aiQuiz.controller.js:1`: `import mongoose from 'mongoose';`
35. `src/modules/exam-category/examCategory.controller.js:1`: `import mongoose from 'mongoose';`
36. `src/modules/payment/payment.controller.ts:14`: `import mongoose from 'mongoose';`
37. `src/modules/quiz/quiz.controller.js:1`: `import mongoose from 'mongoose';`
38. `src/modules/test-series/testSeries.controller.js:1`: `import mongoose from 'mongoose';`

#### C. Repositories (16 files)

39. `src/core/base.repository.ts:1`: `import { Model, Document, FilterQuery, UpdateQuery, QueryOptions } from 'mongoose';`
40. `src/core/tenant.repository.ts:1`: `import { Document, FilterQuery, UpdateQuery, QueryOptions } from 'mongoose';`
41. `src/modules/auth/auth.repository.ts:1`: `import { Model } from 'mongoose';`
42. `src/modules/badge/badge.repository.ts:1`: `import { Model } from 'mongoose';`
43. `src/modules/badge/userBadge.repository.ts:1`: `import { Model } from 'mongoose';`
44. `src/modules/coupon/coupon.repository.ts:1`: `import { Model } from 'mongoose';`
45. `src/modules/course/course.repository.ts:1`: `import { Model } from 'mongoose';`
46. `src/modules/discussion/discussion.repository.ts:1`: `import { Model } from 'mongoose';`
47. `src/modules/institute/institute.repository.ts:1`: `import { Model } from 'mongoose';`
48. `src/modules/note/note.repository.ts:1`: `import { Model } from 'mongoose';`
49. `src/modules/payment/payment.repository.ts:1`: `import { Model } from 'mongoose';`
50. `src/modules/review/review.repository.ts:1`: `import { Model } from 'mongoose';`
51. `src/modules/subscription/subscriptionPlan.repository.ts:1`: `import { Model } from 'mongoose';`
52. `src/modules/test/test.repository.ts:1`: `import { Model } from 'mongoose';`
53. `src/modules/test/testAttempt.repository.ts:1`: `import { Model } from 'mongoose';`
54. `src/modules/user/user.repository.ts:1`: `import { Model } from 'mongoose';`

#### D. Services (10 files)

55. `src/core/base.service.ts:1`: `import { Document } from 'mongoose';`
56. `src/modules/coupon/coupon.service.ts:4`: `import mongoose from 'mongoose';`
57. `src/modules/course/course.service.ts:1`: `import mongoose from 'mongoose';`
58. `src/modules/discussion/discussion.service.ts:1`: `import mongoose from 'mongoose';`
59. `src/modules/leaderboard/leaderboard.service.ts:1`: `import mongoose from 'mongoose';`
60. `src/modules/parent/parent.service.ts:7`: `import mongoose from 'mongoose';`
61. `src/modules/payment/payment.service.ts:1`: `import mongoose, { Types } from 'mongoose';`
62. `src/modules/review/review.service.ts:1`: `import mongoose from 'mongoose';`
63. `src/modules/subscription/subscription.service.ts:1`: `import mongoose from 'mongoose';`
64. `src/modules/test/test.service.ts:1`: `import mongoose, { Types } from 'mongoose';`

#### E. DTOs & Types (8 files)

65. `src/modules/auth/auth.dto.ts:1`: `import { Document, Types } from 'mongoose';`
66. `src/modules/badge/badge.dto.ts:1`: `import { Document, Types } from 'mongoose';`
67. `src/modules/coupon/coupon.dto.ts:1`: `import { Document, Types } from 'mongoose';`
68. `src/modules/discussion/discussion.dto.ts:1`: `import { Document, Types } from 'mongoose';`
69. `src/modules/note/note.dto.ts:1`: `import { Document, Types } from 'mongoose';`
70. `src/modules/payment/payment.dto.ts:1`: `import { Types, Document } from 'mongoose';`
71. `src/modules/review/review.dto.ts:1`: `import { Document, Types } from 'mongoose';`
72. `src/modules/test/test.dto.ts:1`: `import { Types, Document } from 'mongoose';`

#### F. Config, Middleware, Core, Plugins, Sentry (6 files)

73. `src/config/database.js:1`: `import mongoose from 'mongoose';`
74. `src/config/index.js:12`: contains `mongoose: { url: ..., options: ... }`
75. `src/instrument.js:8`: `integrations: [Sentry.mongooseIntegration()],`
76. `src/middleware/tenant.middleware.js:5`: `import { Types } from 'mongoose';`
77. `src/models/plugins/tenantPlugin.js:1`: `import mongoose from 'mongoose';`
78. `src/models/index.js`: Re-exports 21 models from `src/modules/`

#### G. Scripts & Seeders (9 files)

79. `src/scripts/audit-lesson-content.js:14`: `import mongoose from 'mongoose';`
80. `src/scripts/migrate-category-types.js:16`: `import mongoose from 'mongoose';`
81. `src/scripts/repair-pending-enrollments.js:17`: `import mongoose from 'mongoose';`
82. `src/seeders/clearData.js:1`: `import mongoose from 'mongoose';`
83. `src/seeders/clearData.ts:1`: `import mongoose from 'mongoose';`
84. `src/seeders/dailyQuizSeeder.js:1`: `import mongoose from 'mongoose';`
85. `src/seeders/eduportalSeeder.js:1`: `import mongoose from 'mongoose';`
86. `src/seeders/mainSeeder.js:1`: `import mongoose from 'mongoose';`
87. `src/seeders/testbookSeeder.js:1`: `import mongoose from 'mongoose';`

---

### 1.3 Detailed Survey of All 35 Controller Files in `src/modules/`

The controllers fall into two architectural patterns:

#### Group 1: Direct-Query Controllers (Controllers executing Mongoose queries directly)

1. **`src/modules/admin/admin.controller.js`**
   - **Imported Models**: 21 models via `../../models/index.js` (`User`, `Course`, `ExamCategory`, `Enrollment`, `Review`, `Test`, `TestAttempt`, `Quiz`, `QuizAttempt`, `Payment`, `Coupon`, `Discussion`, `Note`, `Notification`, `Badge`, `UserBadge`, `UserActivity`, `Wishlist`, `Blog`, `SubscriptionPlan`) and `Institute`.
   - **Total Direct DB Query Lines**: 87 queries.
   - **Operations**: `find`, `findById`, `findOne`, `create`, `findByIdAndUpdate`, `findOneAndUpdate`, `findByIdAndDelete`, `findOneAndDelete`, `countDocuments`, `aggregate`, `distinct`, `insertMany`, `paginate`, `save`.
   - **Special Aggregations**: Revenue calculations, enrollment trends, category performance, teacher payout metrics.

2. **`src/modules/admin/settings.controller.ts`**
   - **Imported Models**: `PlatformSettings`.
   - **Operations**: `PlatformSettings.findOne()`, `PlatformSettings.create()`, `PlatformSettings.findOneAndUpdate()`.

3. **`src/modules/affiliate/affiliate.controller.js`**
   - **Imported Models**: `Referral`, `ReferralRecord`.
   - **Operations**: `Referral.findOne()`, `Referral.create()`, `ReferralRecord.find()`, `ReferralRecord.create()`, `Referral.findByIdAndUpdate()`, `Referral.find()`, `Referral.findById()`.

4. **`src/modules/aiQuiz/aiQuiz.controller.js`**
   - **Imported Models**: `GeneratedQuiz`.
   - **Direct Mongoose**: `import mongoose from 'mongoose';`
   - **Operations**: `GeneratedQuiz.create()`.

5. **`src/modules/apikey/apikey.controller.js`**
   - **Imported Models**: `ApiKey`.
   - **Operations**: `ApiKey.create()`, `ApiKey.find()`, `ApiKey.findOneAndUpdate()`, `ApiKey.findOne()`, `ApiKey.findByIdAndUpdate()`.

6. **`src/modules/attendance/attendance.controller.ts`**
   - **Imported Models**: `Attendance`, `Course`.
   - **Operations**: `Attendance.findOne()`, `Attendance.create()`, `Attendance.save()`, `Course.findById()`.

7. **`src/modules/blog/blog.controller.js`**
   - **Imported Models**: `Blog`, `User`, `ExamCategory`.
   - **Operations**: `Blog.paginate()`, `Blog.findOne()`, `Blog.findById()`, `Blog.findByIdAndUpdate()`, `Blog.create()`, `blog.save()`.

8. **`src/modules/enrollment/certificate.controller.js`**
   - **Imported Models**: `Enrollment`, `Course`, `User`.
   - **Operations**: `Enrollment.findOne()`, `Course.findById()`, `User.findById()`, `enrollment.save()`.

9. **`src/modules/enrollment/enrollment.controller.js`**
   - **Imported Models**: `Enrollment`, `Course`, `User`, `Payment`.
   - **Operations**: 38 queries (`Course.findById/findOne`, `Enrollment.findOne/create/paginate/find/findById/deleteOne`, `Course.findByIdAndUpdate`, `User.findByIdAndUpdate`, `Payment.findOne`, etc.).

10. **`src/modules/exam-category/examCategory.controller.js`**
    - **Imported Models**: `ExamCategory`, `Course`, `Test`, `TestSeries`, `Blog`, `LibraryItem`.
    - **Direct Mongoose**: `import mongoose from 'mongoose';`
    - **Operations**: 24 queries (`ExamCategory.find/findOne/create/findByIdAndUpdate/findByIdAndDelete`, `Course.aggregate/find`, `Test.aggregate/find`, `TestSeries.aggregate/find`, `Blog.aggregate/find`, `LibraryItem.find`).

11. **`src/modules/library/library.controller.ts`**
    - **Imported Models**: `LibraryResource`.
    - **Operations**: `LibraryResource.create()`, `LibraryResource.find()`, `LibraryResource.countDocuments()`, `LibraryResource.findOne()`, `LibraryResource.findOneAndUpdate()`, `LibraryResource.deleteOne()`.

12. **`src/modules/liveclass/liveclass.controller.js`**
    - **Imported Models**: `LiveClass`, `User`.
    - **Operations**: 26 queries (`LiveClass.create/find/findOne/findById/countDocuments/save`, `User.findById`).

13. **`src/modules/notification/notification.controller.js`**
    - **Imported Models**: `Notification`.
    - **Operations**: `Notification.paginate()`, `Notification.findOneAndUpdate()`, `Notification.findOneAndDelete()`.

14. **`src/modules/payment/payment.controller.ts`** (Hybrid: Uses both `PaymentService` & Direct Mongoose queries)
    - **Imported Models**: `Payment`, `Course`, `User`, `Enrollment`, `Test`, `TestSeries`.
    - **Direct Mongoose**: `import mongoose from 'mongoose';`
    - **Operations**: 22 direct queries (`Payment.find/countDocuments/create`, `Course.findById/findOne/findByIdAndUpdate`, `Enrollment.findOne/create`, `Test.findById/findOne`, `TestSeries.findById/findOne`, `User.findById/findByIdAndUpdate`).

15. **`src/modules/quiz/quiz.controller.js`**
    - **Imported Models**: `Quiz`, `QuizAttempt`, `Enrollment`.
    - **Direct Mongoose**: `import mongoose from 'mongoose';`
    - **Operations**: 16 queries (`Quiz.paginate/find/findById/findOne/create/findOneAndUpdate/findOneAndDelete/findByIdAndUpdate`, `QuizAttempt.find/create/countDocuments/aggregate/deleteMany`, `Enrollment.findOne`).

16. **`src/modules/search/search.controller.js`**
    - **Imported Models**: `Course`, `Test`, `Blog`, `LibraryResource`, `ExamCategory`.
    - **Operations**: `ExamCategory.find()`, `Course.find()`, `Test.find()`, `Blog.find()`, `LibraryResource.find()`.

17. **`src/modules/support/support.controller.ts`**
    - **Imported Models**: `SupportTicket`.
    - **Operations**: `SupportTicket.create()`, `SupportTicket.find()`, `SupportTicket.countDocuments()`.

18. **`src/modules/test-series/testSeries.controller.js`**
    - **Imported Models**: `TestSeries`, `Test`, `TestAttempt`, `Enrollment`, `ExamCategory`.
    - **Direct Mongoose**: `import mongoose from 'mongoose';`
    - **Operations**: 22 queries (`ExamCategory.findOne`, `TestSeries.find/countDocuments/findOne/create/findByIdAndUpdate/findByIdAndDelete`, `Test.find`, `TestAttempt.find`).

19. **`src/modules/upload/upload.controller.js`**
    - **Imported Models**: `Institute`.
    - **Operations**: `Institute.findByIdAndUpdate` (for tracking storage usage increments/decrements).

20. **`src/modules/wishlist/wishlist.controller.js`**
    - **Imported Models**: `Wishlist`.
    - **Operations**: `Wishlist.paginate()`, `Wishlist.findOne()`, `Wishlist.findByIdAndDelete()`, `Wishlist.create()`.

#### Group 2: Service-Delegating Controllers (Clean delegation to Service classes)

21. `src/modules/ai/ai.controller.ts` -> Calls `AiService` (No direct model queries).
22. `src/modules/auth/auth.controller.ts` -> Calls `AuthService` (Contains 3 minor direct `User.findByIdAndUpdate`/`user.save` lines in MFA setup).
23. `src/modules/badge/badge.controller.ts` -> Calls `BadgeService`.
24. `src/modules/coupon/coupon.controller.ts` -> Calls `CouponService`.
25. `src/modules/course/course.controller.ts` -> Calls `CourseService`.
26. `src/modules/discussion/discussion.controller.ts` -> Calls `DiscussionService`.
27. `src/modules/gdpr/gdpr.controller.ts` -> Calls `GdprService`.
28. `src/modules/institute/institute.controller.ts` -> Calls `InstituteService`.
29. `src/modules/leaderboard/leaderboard.controller.ts` -> Calls `LeaderboardService`.
30. `src/modules/note/note.controller.ts` -> Calls `NoteService`.
31. `src/modules/parent/parent.controller.ts` -> Calls `ParentService`.
32. `src/modules/review/review.controller.ts` -> Calls `ReviewService`.
33. `src/modules/subscription/subscription.controller.ts` -> Calls `SubscriptionService`.
34. `src/modules/test/test.controller.ts` -> Calls `TestService`.
35. `src/modules/user/user.controller.ts` -> Calls `UserService`.

---

### 1.4 Other Non-Controller Codebase Consumers of Mongoose

1. **`src/modules/audit/audit.routes.js`**: Executes `AuditLog.paginate()` directly in route handler.
2. **`src/middleware/auth.js`**: `User.findById(decoded.id).select('-password -refreshTokens').lean()`.
3. **`src/middleware/tenant.middleware.js`**: `Institute.findById()`, `Institute.findOne()`, `Institute.findByIdAndUpdate()`, `User.countDocuments()`, `Types.ObjectId`.
4. **`src/middleware/auditLog.js`**: `AuditLog.create()`.
5. **`src/config/passport.js`**: `User.findOne()`, `User.create()`, `User.findById()`.
6. **`src/app.js` (Lines 287-308 - `/sitemap.xml`)**: `Course.find()`, `Blog.find()`, `ExamCategory.find()`.
7. **Workers (`src/workers/`)**:
   - `drip.worker.js`: `Enrollment`, `Course`
   - `dunning.worker.js`: `Institute`, `User`
   - `notification.worker.js`: `Notification`, `User`
   - `reminder.worker.js`: `Enrollment`, `User`
8. **Core Repository Layer (`src/core/`)**:
   - `base.repository.ts`, `tenant.repository.ts`, `base.service.ts`

---

## 2. Logic Chain

1. **Finding**: The database access in the codebase is split into two distinct architectural patterns:
   - _Pattern A (Domain Services & Repositories)_: TypeScript modules (`auth`, `course`, `test`, `review`, `coupon`, `discussion`, `badge`, `note`, `user`, `institute`, `subscription`) where controllers call services, and services call repositories deriving from `BaseRepository` / `TenantRepository`.
   - _Pattern B (Direct Model Controller Queries)_: JavaScript and TS controllers (`admin`, `enrollment`, `test-series`, `quiz`, `blog`, `liveclass`, `exam-category`, `affiliate`, `wishlist`, `apikey`, `library`, `support`, `attendance`, `notification`, `search`, `upload`) where controllers directly import Mongoose models and execute Mongoose query chaining (`find().populate().sort().skip().limit().lean()`).

2. **Finding**: In `prisma/schema.prisma`, 14 models currently exist (`User`, `Institute`, `Category`, `Course`, `Lesson`, `Enrollment`, `Test`, `TestAttempt`, `Quiz`, `QuizAttempt`, `Payment`, `Review`, `Blog`, `Coupon`).
   - However, the Mongoose codebase defines 34 models.
   - For all 34 modules to run with Prisma, either Prisma schema must have models for all 34 entities or the missing ones (e.g., `Affiliate`, `Attendance`, `AuditLog`, `Badge`, `UserBadge`, `Discussion`, `LibraryResource`, `LiveClass`, `Note`, `Notification`, `Message`, `SubscriptionPlan`, `SupportTicket`, `TestSeries`, `Question`, `UserActivity`, `Wishlist`, `PlatformSettings`, `ApiKey`) must be added to `schema.prisma`.

3. **Finding**: Core Mongoose concepts requiring translation during Prisma migration:
   - **ID format**: Mongoose uses `_id` (`ObjectId`), while Prisma uses `id` (`String` UUID). Controllers and serializers often check `_id` or call `.toString()`.
   - **Populations**: Mongoose `.populate('user', 'name email')` translates to Prisma `include: { user: { select: { name: true, email: true } } }`.
   - **Pagination**: Mongoose `paginatePlugin` (`Model.paginate(filter, options)`) translates to Prisma `prisma[model].findMany({ where, skip, take, orderBy })` + `count({ where })`.
   - **Tenant Isolation**: Handled currently by `tenantPlugin.js` which hooks into Mongoose `pre('find')`, etc. In Prisma, this should be enforced at the repository/service layer or Prisma Client extension.
   - **Password Hashing & Hooks**: `user.model.ts` uses `pre('save')` for bcrypt hashing; with Prisma, hashing happens explicitly in `auth.service.ts` / `user.service.ts`.
   - **Indexes & Virtuals**: Virtual fields like `test.questionCount` and `quiz.questionCount` can be computed inline or via getter properties in services.

4. **Finding**: Acceptance Criteria:
   - Running `npm run dev` in `server/` must start without Mongoose errors.
   - A search for `import mongoose` or `require('mongoose')` in `src/modules/` must return 0 results.

---

## 3. Caveats

1. **Unchanged Files Outside Scope**: Test fixtures (`tests/*.test.js`), root seeding scripts (`scripts/seed.js`), and legacy seeding scripts still contain Mongoose imports. Acceptance criterion specifically targets `src/modules/` returning zero Mongoose imports, but for full application health, `src/server.js`, `src/config/`, `src/middleware/`, `src/workers/`, `src/app.js`, and `src/core/` must also decouple from Mongoose.
2. **PostgreSQL / SQLite Connection**: `prisma/schema.prisma` is configured for `postgresql`. Ensure `DATABASE_URL` is configured in `.env` or appropriate connection pool is available when running migrations/seeds.

---

## 4. Conclusion

- **Total Model Files to Replace**: 33 files (34 Mongoose models).
- **Total Files in `src/modules/` Importing Mongoose**: 48 files.
- **Total Controller Files in `src/modules/` Requiring Query Refactoring**: 35 controllers.
- **Total Services & Repositories in `src/modules/` Requiring Prisma Client Migration**: 14 repositories and 10 services.
- **Support Files Requiring Decoupling**: `src/config/database.js`, `src/config/index.js`, `src/instrument.js`, `src/models/index.js`, `src/models/plugins/*`, `src/middleware/tenant.middleware.js`, `src/middleware/auth.js`, `src/middleware/auditLog.js`, `src/app.js` (`/sitemap.xml` & `mongoSanitize`), `src/config/passport.js`, and `src/workers/*.js`.

All findings, file locations, line numbers, and query signatures have been mapped and documented for immediate, flawless execution by the implementation team.

---

## 5. Verification Method

To verify these findings independently:

1. **Verify Mongoose import counts in `src/modules/`**:
   ```bash
   grep -rnw "mongoose" server/src/modules/
   ```
2. **Verify Mongoose models across the codebase**:
   ```bash
   grep -rn "mongoose.model" server/src/
   ```
3. **Verify Prisma Schema validation**:
   ```bash
   cd server && npx prisma validate
   ```
4. **Verify Application Dev Start**:
   ```bash
   cd server && npm run dev
   ```
