# TESTBOOK PLATFORM — PRODUCT FLOW DOCUMENT

### What Is Actually Built (Current State — May 2026)

**Version 1.0 | Based on live codebase audit**

> This document covers only features that are fully implemented and running.
> No aspirational items. No placeholders. No TODOs.

---

## TABLE OF CONTENTS

1. Platform Overview
2. Applications & Ports
3. User Roles & Permissions
4. Database Models (What Exists)
5. API Endpoints (All Implemented)
6. Client App — Pages & Routes
7. Admin Panel — Pages & Routes
8. Full User Flow: Authentication
9. Full User Flow: Student
10. Full User Flow: Teacher
11. Full User Flow: Admin
12. State Management (Redux Slices)
13. Multi-Tenancy Architecture
14. Real-Time & Background Jobs
15. Security Implementation
16. Known Working Integrations

---

## 1. PLATFORM OVERVIEW

Testbook Platform is a **multi-tenant LMS (Learning Management System)**. Each institute gets its own isolated environment identified by a subdomain or tenant ID. All institutes share one backend and one database — but data is strictly scoped per tenant.

**What it does today:**

- Institutes can publish and sell courses
- Students can enroll (free or paid), watch lessons, take tests, take quizzes
- Teachers create course content, tests, and quizzes
- Admins manage users, revenue, enrollments, coupons, reviews, announcements
- Payments processed via Razorpay and Stripe
- Certificates issued on course completion
- AI-powered doubt solving, quiz generation, study plans
- Live classes (create, schedule, join)
- Real-time notifications via WebSocket
- Background job queues for email, notifications, certificates

---

## 2. APPLICATIONS & PORTS

| App          | Port (Dev) | Purpose                                                   |
| ------------ | ---------- | --------------------------------------------------------- |
| Server (API) | 5000       | Backend REST API — all apps share this                    |
| Client       | 5173       | Student-facing frontend (course catalog, learning, tests) |
| Admin Panel  | 8080       | Institute admin management dashboard                      |
| Platform     | 5175       | Minimal scaffolding only — not production-ready           |

**Base API URL:** `http://localhost:5000/api/v1`

All client apps send:

- `Authorization: Bearer <accessToken>` on every authenticated request
- `X-Tenant-Id: <tenantId>` OR `X-Tenant-Subdomain: <subdomain>` to identify the institute

---

## 3. USER ROLES & PERMISSIONS

### Roles That Exist in the System

| Role          | Where they log in         | What they can do                                         |
| ------------- | ------------------------- | -------------------------------------------------------- |
| `super_admin` | Admin panel               | Full cross-tenant access, manage all institutes          |
| `admin`       | Admin panel               | Manage their own institute fully                         |
| `teacher`     | Client app (`/teacher/*`) | Create courses, tests, quizzes; manage students          |
| `student`     | Client app                | Enroll in courses, take tests/quizzes, earn certificates |

### Permission Gates in Code

**Route-level guards:**

- `authenticate` middleware — verifies JWT, attaches `req.user`
- `authorize(...roles)` middleware — checks `req.user.role` against allowed roles

**Client-side route protection:**

- `<ProtectedRoute>` — blocks unauthenticated users, redirects to `/login`
- `<ProtectedRoute roles={['teacher', 'admin']}>` — blocks wrong roles
- `<GuestRoute>` — blocks authenticated users from seeing login/register

**What each role can access:**

```
super_admin
├── Admin panel: all routes
├── All tenant data (bypass tenant filter)
└── Cross-tenant revenue, stats, institute management

admin
├── Admin panel: all routes (own institute data only)
├── Courses: view all, create, edit, delete, publish/unpublish, toggle featured
├── Users: create, edit, deactivate (students, teachers, staff)
├── Enrollments: view all, export CSV
├── Revenue: view analytics
├── Coupons: full CRUD
├── Reviews: approve/reject/delete, bulk delete
├── Categories & Exam Categories: full CRUD
├── Teachers: view list, verify/unverify
├── Announcements: send to all users
├── Tests: view, delete
└── Quizzes: view, delete

teacher
├── Client /teacher/* routes only
├── Courses: create, edit, delete own courses; publish/unpublish own
├── Tests: create, edit, delete own tests; view analytics
├── Quizzes: create, edit, delete own quizzes
├── Students: view students enrolled in own courses
├── Revenue: view own earnings
├── Discussions: moderate discussions on own courses
└── AI tools: question generator

student
├── Client app (authenticated routes)
├── Courses: browse, enroll (free/paid), learn, track progress
├── Tests: browse, attempt, view results
├── Quizzes: attempt quizzes within courses
├── Wishlist: add/remove courses
├── Notes: create/edit/delete personal notes per lesson
├── Reviews: write review (enrolled courses only), edit/delete own
├── Notifications: view, mark read
├── Profile: edit own profile
├── Orders: view purchase history
├── Certificates: view/download earned certificates
├── Leaderboard: view rankings
├── Achievements/Badges: view earned badges
├── Blog: read posts
├── AI: doubt solver, study plan
└── Live Classes: view upcoming, join
```

---

## 4. DATABASE MODELS (ALL EXISTING SCHEMAS)

### Core Models

**User**

```
_id, name, email, password (bcrypt), role, tenantId,
isActive, isEmailVerified, avatar, bio, phone,
authProvider (local|google), googleId,
teacherProfile { qualification, experience, specialization[], isVerified },
mfaEnabled, mfaSecret,
refreshTokens [{ token, expiresAt, device }],
fcmTokens [],
lastActiveAt, createdAt
```

**Institute**

```
_id, name, subdomain, customDomain, logo, theme,
websiteTitle, contactDetails, isActive, owner,
subscription { plan, status, expiresAt },
limits { studentLimit, teacherLimit, storageLimit },
storageUsed
```

**Course**

```
_id, title, slug, shortDescription, description,
thumbnail, promoVideo, teacher, category, tenantId,
price, discountPrice, language, level, duration,
isPublished, isFeatured, enrollmentCount,
requirements[], outcomes[], tags[],
certificate { enabled, template },
createdAt
```

**Section** (course modules)

```
_id, courseId, title, order, tenantId
```

**Lesson**

```
_id, sectionId, courseId, title, type (video|document|text|quiz),
videoUrl, videoPublicId, duration, content, attachments[],
isPreview, order, dripDays, tenantId
```

**Test**

```
_id, title, description, courseId (optional), category,
difficulty, duration (minutes), totalMarks, passingMarks,
negativeMarking { enabled, marksPerWrong },
shuffleQuestions, allowedAttempts,
status (draft|published), availableFrom, availableUntil,
teacher, tenantId
```

**Question** (embedded in Test)

```
_id, text, type (single|multiple|truefalse|fillblank|short|essay),
options [{ text, isCorrect }], correctAnswer,
marks, negativeMark, explanation, image
```

**TestAttempt**

```
_id, testId, student, tenantId,
status (in-progress|completed|abandoned),
answers [{ questionId, answer, isCorrect, marksObtained }],
score, percentage, timeTaken,
violations [{ type, timestamp, evidence }],
startedAt, submittedAt
```

**Quiz**

```
_id, title, courseId, lessonId (optional), tenantId,
questions [{ text, options, correctAnswer, explanation }],
timeLimit, passingScore, teacher
```

**QuizAttempt**

```
_id, quizId, student, courseId, tenantId,
answers [], score, passed, completedAt
```

**Enrollment**

```
_id, student, course, tenantId,
status (active|completed|expired|refunded),
progressPercentage, amountPaid, paymentId, couponUsed,
lessonProgress [{ lessonId, sectionId, completed, watchTime, lastPosition }],
enrolledAt, lastAccessedAt, certificateIssued
```

**Payment**

```
_id, student, course, tenantId,
gateway (razorpay|stripe|free|demo),
amount, currency, status (pending|completed|failed|refunded),
orderId, paymentId, receipt, invoiceUrl,
refund { status, amount, reason, processedAt }
```

**Review**

```
_id, course, student, tenantId,
rating (1-5), comment, isApproved, createdAt
```

**Coupon**

```
_id, code, tenantId,
discountType (percentage|fixed),
discountValue, minOrderAmount, maxDiscount,
usageLimit, usedCount, perUserLimit,
applicableCourses [], isActive,
validFrom, validUntil
```

**Notification**

```
_id, recipient, tenantId,
type, title, message, isRead,
entityType, entityId, createdAt
```

**Note**

```
_id, student, courseId, lessonId, tenantId,
content, createdAt, updatedAt
```

**Discussion**

```
_id, course, lesson (optional), author, tenantId,
content, replies [{ author, content, likes[], createdAt }],
likes [], isResolved, createdAt
```

**Badge / UserBadge**

```
Badge: _id, name, slug, description, icon, category,
       criteria { type, value }, points, rarity
UserBadge: _id, user, badge, tenantId, earnedAt
```

**Certificate** (generated on enrollment completion)

```
_id, student, course, enrollmentId, tenantId,
certificateId (unique public ID), issuedAt
```

**Blog**

```
_id, title, slug, content, author, tenantId,
tags [], isPublished, createdAt
```

**LiveClass**

```
_id, title, teacher, courseId (optional), tenantId,
scheduledAt, duration, status (scheduled|live|ended),
joinUrl, recordingUrl, participants []
```

**Leaderboard** — aggregated scores per user per tenantId

**Wishlist** — userId + courseId[] per tenantId

**Affiliate** — referral code, commission tracking per tenantId

**AuditLog** — actor, action, resource, resourceId, changes, ip, tenantId

**SubscriptionPlan** — name, price, limits, features (platform-level, not tenant-scoped)

**ExamCategory**

```
_id, name, slug, icon, description, order, tenantId
```

---

## 5. API ENDPOINTS (ALL IMPLEMENTED)

Base: `POST/GET/PUT/PATCH/DELETE http://localhost:5000/api/v1`

### Authentication — `/auth`

| Method | Path                      | Auth   | Description                            |
| ------ | ------------------------- | ------ | -------------------------------------- |
| POST   | /auth/register            | None   | Register student/teacher               |
| POST   | /auth/login               | None   | Login, returns access + refresh tokens |
| POST   | /auth/logout              | Bearer | Invalidates refresh token              |
| POST   | /auth/refresh-token       | None   | Returns new access token               |
| POST   | /auth/forgot-password     | None   | Sends reset email                      |
| POST   | /auth/reset-password      | None   | Resets password with token             |
| GET    | /auth/verify-email/:token | None   | Verifies email address                 |
| GET    | /auth/me                  | Bearer | Get own profile                        |
| GET    | /auth/profile             | Bearer | Get own profile (alias)                |
| PATCH  | /auth/profile             | Bearer | Update own profile                     |
| PUT    | /auth/profile             | Bearer | Update own profile (alias)             |
| POST   | /auth/change-password     | Bearer | Change password                        |
| POST   | /auth/fcm-token           | Bearer | Register Firebase push token           |
| DELETE | /auth/fcm-token           | Bearer | Remove Firebase push token             |
| POST   | /auth/mfa/setup           | Bearer | Setup MFA (returns QR code)            |
| POST   | /auth/mfa/verify          | Bearer | Enable MFA (verify TOTP)               |
| POST   | /auth/mfa/login           | None   | Complete MFA login                     |
| POST   | /auth/mfa/disable         | Bearer | Disable MFA                            |
| GET    | /auth/google              | None   | Start Google OAuth                     |
| GET    | /auth/google/callback     | None   | Google OAuth callback                  |

### Courses — `/courses`

| Method | Path                  | Auth             | Description                                |
| ------ | --------------------- | ---------------- | ------------------------------------------ |
| GET    | /courses              | Optional         | List courses (tenant-scoped, with filters) |
| GET    | /courses/featured     | Optional         | Featured courses                           |
| GET    | /courses/slug/:slug   | Optional         | Get course by slug                         |
| GET    | /courses/:id          | Optional         | Get course by ID                           |
| GET    | /courses/:id/sections | Enrolled/Teacher | Get sections + lessons                     |
| POST   | /courses              | Teacher/Admin    | Create course                              |
| PUT    | /courses/:id          | Teacher/Admin    | Update course                              |
| DELETE | /courses/:id          | Teacher/Admin    | Delete course                              |
| PATCH  | /courses/:id/publish  | Teacher/Admin    | Toggle publish status                      |

### Tests — `/tests`

| Method | Path                        | Auth          | Description                   |
| ------ | --------------------------- | ------------- | ----------------------------- |
| GET    | /tests                      | Optional      | List published tests          |
| GET    | /tests/:id                  | Optional      | Get test detail               |
| POST   | /tests/:id/start            | Bearer        | Start a test attempt          |
| POST   | /tests/auto-save/:attemptId | Bearer        | Auto-save answers during test |
| POST   | /tests/violation/:attemptId | Bearer        | Log exam violation event      |
| POST   | /tests/submit/:attemptId    | Bearer        | Submit test                   |
| GET    | /tests/result/:attemptId    | Bearer        | Get attempt result            |
| GET    | /tests/my/attempts          | Bearer        | Get own test history          |
| POST   | /tests                      | Teacher/Admin | Create test                   |
| PUT    | /tests/:id                  | Teacher/Admin | Update test                   |
| DELETE | /tests/:id                  | Teacher/Admin | Delete test                   |
| GET    | /tests/:id/analytics        | Teacher/Admin | Test performance analytics    |
| GET    | /tests/:id/submissions      | Teacher/Admin | All student submissions       |

### Quizzes — `/quizzes`

| Method | Path                        | Auth          | Description              |
| ------ | --------------------------- | ------------- | ------------------------ |
| GET    | /quizzes/course/:courseId   | Optional      | Get quizzes for a course |
| POST   | /quizzes/submit             | Bearer        | Submit quiz answers      |
| GET    | /quizzes/teacher/my-quizzes | Teacher/Admin | Own quizzes list         |
| GET    | /quizzes/teacher/:id        | Teacher/Admin | Single quiz detail       |
| POST   | /quizzes                    | Teacher/Admin | Create quiz              |
| PUT    | /quizzes/:id                | Teacher/Admin | Update quiz              |
| DELETE | /quizzes/:id                | Teacher/Admin | Delete quiz              |

### Enrollments — `/enrollments`

| Method | Path                               | Auth          | Description                              |
| ------ | ---------------------------------- | ------------- | ---------------------------------------- |
| POST   | /enrollments                       | Student       | Enroll in course (free or after payment) |
| GET    | /enrollments/my                    | Bearer        | Get own enrollments                      |
| GET    | /enrollments/my-tests              | Bearer        | Get own test enrollments                 |
| GET    | /enrollments/teacher/students      | Teacher/Admin | Students enrolled in teacher's courses   |
| GET    | /enrollments/check/:courseId       | Bearer        | Check if enrolled in a course            |
| GET    | /enrollments/progress/:courseId    | Bearer        | Get lesson progress for course           |
| POST   | /enrollments/progress/:courseId    | Bearer        | Update lesson progress                   |
| GET    | /enrollments/certificate/:courseId | Bearer        | Generate/get certificate                 |

### Payments — `/payments`

| Method | Path                         | Auth          | Description                          |
| ------ | ---------------------------- | ------------- | ------------------------------------ |
| POST   | /payments/webhook            | None          | Razorpay/Stripe webhook receiver     |
| POST   | /payments/create-order       | Bearer        | Create payment order                 |
| POST   | /payments/verify             | Bearer        | Verify payment after gateway success |
| POST   | /payments/dummy-checkout     | Bearer        | Free/demo checkout (no gateway)      |
| POST   | /payments/retry              | Bearer        | Retry a failed payment               |
| GET    | /payments/my-orders          | Bearer        | Own order history                    |
| GET    | /payments/invoice/:paymentId | Bearer        | Download invoice                     |
| POST   | /payments/refund/:paymentId  | Admin         | Initiate refund                      |
| GET    | /payments/teacher/revenue    | Teacher/Admin | Teacher earnings breakdown           |

### Reviews — `/reviews`

| Method | Path                      | Auth   | Description                       |
| ------ | ------------------------- | ------ | --------------------------------- |
| GET    | /reviews/course/:courseId | None   | Get approved reviews for a course |
| POST   | /reviews                  | Bearer | Create review (must be enrolled)  |
| PUT    | /reviews/:id              | Bearer | Update own review                 |
| DELETE | /reviews/:id              | Bearer | Delete own review                 |

### Coupons — `/coupons`

| Method | Path              | Auth   | Description            |
| ------ | ----------------- | ------ | ---------------------- |
| POST   | /coupons/validate | Bearer | Validate a coupon code |
| GET    | /coupons          | Admin  | List institute coupons |
| POST   | /coupons          | Admin  | Create coupon          |
| PUT    | /coupons/:id      | Admin  | Update coupon          |
| DELETE | /coupons/:id      | Admin  | Delete coupon          |

### Notifications — `/notifications`

| Method | Path                        | Auth   | Description           |
| ------ | --------------------------- | ------ | --------------------- |
| GET    | /notifications              | Bearer | Get own notifications |
| GET    | /notifications/unread-count | Bearer | Get unread count      |
| PATCH  | /notifications/:id/read     | Bearer | Mark one as read      |
| PATCH  | /notifications/read-all     | Bearer | Mark all as read      |
| DELETE | /notifications/:id          | Bearer | Delete notification   |

### Discussions — `/discussions`

| Method | Path                            | Auth   | Description                  |
| ------ | ------------------------------- | ------ | ---------------------------- |
| GET    | /discussions/course/:courseId   | Bearer | Get discussions for a course |
| POST   | /discussions                    | Bearer | Create discussion/question   |
| PUT    | /discussions/:id                | Bearer | Update own discussion        |
| DELETE | /discussions/:id                | Bearer | Delete own discussion        |
| POST   | /discussions/:id/reply          | Bearer | Add reply                    |
| PUT    | /discussions/:id/reply/:replyId | Bearer | Edit reply                   |
| DELETE | /discussions/:id/reply/:replyId | Bearer | Delete reply                 |
| POST   | /discussions/:id/like           | Bearer | Toggle like                  |
| PATCH  | /discussions/:id/resolve        | Bearer | Toggle resolved status       |

### Notes — `/notes`

| Method | Path                    | Auth   | Description            |
| ------ | ----------------------- | ------ | ---------------------- |
| GET    | /notes/my               | Bearer | Get all own notes      |
| GET    | /notes/course/:courseId | Bearer | Get notes for a course |
| POST   | /notes/course/:courseId | Bearer | Create note            |
| PUT    | /notes/:id              | Bearer | Update note            |
| DELETE | /notes/:id              | Bearer | Delete note            |

### Wishlist — `/wishlist`

| Method | Path                      | Auth   | Description                   |
| ------ | ------------------------- | ------ | ----------------------------- |
| GET    | /wishlist                 | Bearer | Get wishlist                  |
| POST   | /wishlist/toggle          | Bearer | Add or remove from wishlist   |
| GET    | /wishlist/check/:courseId | Bearer | Check if course is wishlisted |

### Badges — `/badges`

| Method | Path        | Auth   | Description           |
| ------ | ----------- | ------ | --------------------- |
| GET    | /badges/my  | Bearer | Get own earned badges |
| GET    | /badges     | Admin  | List all badges       |
| POST   | /badges     | Admin  | Create badge          |
| PUT    | /badges/:id | Admin  | Update badge          |
| DELETE | /badges/:id | Admin  | Delete badge          |

### Leaderboard — `/leaderboard`

| Method | Path         | Auth     | Description            |
| ------ | ------------ | -------- | ---------------------- |
| GET    | /leaderboard | Optional | Get ranked leaderboard |

### Blog — `/blog`

| Method | Path             | Auth     | Description               |
| ------ | ---------------- | -------- | ------------------------- |
| GET    | /blog            | Optional | List published blog posts |
| GET    | /blog/slug/:slug | Optional | Get blog post by slug     |
| POST   | /blog            | Admin    | Create blog post          |
| PATCH  | /blog/:id        | Admin    | Update blog post          |
| DELETE | /blog/:id        | Admin    | Delete blog post          |

### AI — `/ai`

| Method | Path                   | Auth   | Description                             |
| ------ | ---------------------- | ------ | --------------------------------------- |
| POST   | /ai/generate-questions | Bearer | Generate MCQ questions from topic       |
| POST   | /ai/solve-doubt        | Bearer | Solve a student doubt                   |
| POST   | /ai/solve-doubt/stream | Bearer | Solve doubt (streaming response)        |
| POST   | /ai/rag/solve-doubt    | Bearer | RAG-enhanced doubt solving              |
| POST   | /ai/study-plan         | Bearer | Generate personalised study plan        |
| POST   | /ai/weak-topics        | Bearer | Detect weak topics from attempt history |
| GET    | /ai/usage              | Admin  | AI usage stats                          |

### Live Classes — `/live-classes`

| Method | Path                    | Auth    | Description               |
| ------ | ----------------------- | ------- | ------------------------- |
| GET    | /live-classes/upcoming  | Bearer  | Get upcoming live classes |
| GET    | /live-classes/:id       | Bearer  | Get live class detail     |
| POST   | /live-classes/:id/join  | Bearer  | Join a live class         |
| POST   | /live-classes           | Teacher | Create live class         |
| GET    | /live-classes/my        | Teacher | Own live classes          |
| PUT    | /live-classes/:id       | Teacher | Update live class         |
| POST   | /live-classes/:id/start | Teacher | Start live class          |
| POST   | /live-classes/:id/end   | Teacher | End live class            |

### Exam Categories — `/categories`

| Method | Path            | Auth     | Description     |
| ------ | --------------- | -------- | --------------- |
| GET    | /categories     | Optional | List categories |
| GET    | /categories/:id | Optional | Get category    |
| POST   | /categories     | Admin    | Create category |
| PUT    | /categories/:id | Admin    | Update category |
| DELETE | /categories/:id | Admin    | Delete category |

### Affiliate — `/affiliate`

| Method | Path                      | Auth   | Description            |
| ------ | ------------------------- | ------ | ---------------------- |
| GET    | /affiliate/validate/:code | None   | Validate referral code |
| POST   | /affiliate/register       | Bearer | Register as affiliate  |
| GET    | /affiliate/me             | Bearer | Own affiliate stats    |
| GET    | /affiliate/admin          | Admin  | List all affiliates    |

### Subscriptions — `/subscriptions`

Subscription plan listing and ordering (platform-level plans for institutes).

### Uploads — `/uploads`

Handles multipart file uploads to Cloudinary. Returns URL + publicId.

### Admin — `/admin`

| Method | Path                               | Auth  | Description                   |
| ------ | ---------------------------------- | ----- | ----------------------------- |
| GET    | /admin/dashboard                   | Admin | Dashboard stats (cached 5min) |
| GET    | /admin/courses                     | Admin | All courses with filters      |
| PUT    | /admin/courses/:id                 | Admin | Update any course             |
| DELETE | /admin/courses/:id                 | Admin | Delete course                 |
| PATCH  | /admin/courses/:id/featured        | Admin | Toggle featured               |
| GET    | /admin/tests                       | Admin | All tests                     |
| DELETE | /admin/tests/:id                   | Admin | Delete test                   |
| GET    | /admin/quizzes                     | Admin | All quizzes                   |
| DELETE | /admin/quizzes/:id                 | Admin | Delete quiz                   |
| GET    | /admin/reviews                     | Admin | All reviews                   |
| DELETE | /admin/reviews/:id                 | Admin | Delete review                 |
| POST   | /admin/reviews/bulk-delete         | Admin | Bulk delete reviews           |
| PATCH  | /admin/reviews/:id/toggle-approval | Admin | Approve or reject review      |
| GET    | /admin/revenue                     | Admin | Revenue analytics             |
| GET    | /admin/enrollments                 | Admin | All enrollments               |
| GET    | /admin/enrollments/export          | Admin | Export enrollments as CSV     |
| GET    | /admin/teachers                    | Admin | All teachers                  |
| PATCH  | /admin/teachers/:id/verify         | Admin | Verify teacher                |
| POST   | /admin/announcements               | Admin | Send announcement to users    |
| GET    | /admin/coupons                     | Admin | All coupons                   |
| GET    | /admin/coupons/:id                 | Admin | Single coupon                 |
| POST   | /admin/coupons                     | Admin | Create coupon                 |
| PUT    | /admin/coupons/:id                 | Admin | Update coupon                 |
| DELETE | /admin/coupons/:id                 | Admin | Delete coupon                 |

### Users — `/users` (admin user management)

| Method | Path              | Auth  | Description                 |
| ------ | ----------------- | ----- | --------------------------- |
| GET    | /users            | Admin | List all users              |
| POST   | /users            | Admin | Create user                 |
| GET    | /users/:id        | Admin | Get user by ID              |
| PUT    | /users/:id        | Admin | Update user                 |
| DELETE | /users/:id        | Admin | Soft delete user            |
| PATCH  | /users/:id/status | Admin | Activate or deactivate user |

---

## 6. CLIENT APP — ALL PAGES & ROUTES

Port: 5173 — Student-facing application

### Public Routes (no login required)

| Path                        | Component          | Description                                          |
| --------------------------- | ------------------ | ---------------------------------------------------- |
| `/`                         | HomePage           | Institute homepage with featured courses, categories |
| `/courses`                  | CourseCatalog      | Browse all courses with search and filters           |
| `/courses/:id`              | CourseDetail       | Course info, curriculum, reviews, enroll button      |
| `/tests`                    | TestCatalog        | Browse available tests                               |
| `/tests/:id`                | TestDetail         | Test info, rules, start button                       |
| `/leaderboard`              | LeaderboardPage    | Rankings across the institute                        |
| `/verify-certificate`       | CertificateVerify  | Public certificate verification by ID                |
| `/blog`                     | BlogList           | Blog post listing                                    |
| `/blog/:slug`               | BlogDetail         | Single blog post                                     |
| `/pricing`                  | PricingPage        | Subscription plans                                   |
| `/affiliate/validate/:code` | AffiliateDashboard | Validate referral code                               |
| `/unauthorized`             | UnauthorizedPage   | 403 page                                             |

### Guest-Only Routes (redirect to dashboard if logged in)

| Path                     | Component          | Description                             |
| ------------------------ | ------------------ | --------------------------------------- |
| `/login`                 | LoginPage          | Email/password login + Google OAuth     |
| `/register`              | RegisterPage       | Student registration                    |
| `/forgot-password`       | ForgotPasswordPage | Send reset email                        |
| `/reset-password/:token` | ResetPasswordPage  | Set new password                        |
| `/auth/callback`         | AuthCallbackPage   | OAuth token exchange after Google login |

### Protected Student Routes (login required)

| Path                     | Component           | Description                                |
| ------------------------ | ------------------- | ------------------------------------------ |
| `/dashboard`             | DashboardPage       | Personal stats, enrolled courses, progress |
| `/my-courses`            | MyCourses           | List of enrolled courses with progress     |
| `/courses/:id/learn`     | CourseLearning      | Full course player with lesson sidebar     |
| `/my-test-attempts`      | MyTestAttempts      | History of all test attempts               |
| `/quiz/:id`              | QuizPage            | Take a quiz with timer and result          |
| `/achievements`          | AchievementsPage    | Badges earned                              |
| `/wishlist`              | WishlistPage        | Saved courses                              |
| `/checkout/:id`          | CheckoutPage        | Course purchase page                       |
| `/checkout/success`      | CheckoutSuccess     | Post-payment confirmation                  |
| `/orders`                | OrdersPage          | Purchase history and invoices              |
| `/profile`               | Profile             | View own profile                           |
| `/settings`              | ProfileSettingsPage | Edit name, avatar, password                |
| `/notifications`         | NotificationsPage   | Notification center                        |
| `/affiliate`             | AffiliateDashboard  | Own affiliate/referral dashboard           |
| `/ai/doubt-solver`       | AIDoubtSolver       | AI-powered doubt solving chat              |
| `/ai/study-plan`         | AIStudyPlan         | AI-generated study plan                    |
| `/live-classes`          | LiveClassList       | View upcoming live classes                 |
| `/live-classes/:id/room` | LiveClassRoom       | Join and attend a live class               |

### Teacher Routes (login required, role: teacher or admin)

| Path                           | Component            | Description                                  |
| ------------------------------ | -------------------- | -------------------------------------------- |
| `/teacher`                     | TeacherDashboard     | Teacher overview: courses, students, revenue |
| `/teacher/courses`             | TeacherCourses       | Own courses list                             |
| `/teacher/courses/new`         | TeacherCourseForm    | Create a new course                          |
| `/teacher/courses/:id/edit`    | TeacherCourseForm    | Edit existing course                         |
| `/teacher/tests`               | TeacherTests         | Own tests list                               |
| `/teacher/tests/new`           | TeacherTestForm      | Create a new test                            |
| `/teacher/tests/:id/edit`      | TeacherTestForm      | Edit existing test                           |
| `/teacher/tests/:id/analytics` | TeacherTestAnalytics | Test performance data                        |
| `/teacher/quizzes`             | TeacherQuizzes       | Own quizzes list                             |
| `/teacher/quizzes/new`         | TeacherQuizForm      | Create a new quiz                            |
| `/teacher/quizzes/:id/edit`    | TeacherQuizForm      | Edit existing quiz                           |
| `/teacher/students`            | TeacherStudents      | Students enrolled in own courses             |
| `/teacher/revenue`             | TeacherRevenue       | Earnings breakdown                           |
| `/teacher/discussions`         | TeacherDiscussions   | Moderate course discussions                  |

### Admin-Only Routes (login required, role: admin or super_admin)

| Path                  | Component           | Description                        |
| --------------------- | ------------------- | ---------------------------------- |
| `/ai/questions`       | AIQuestionGenerator | Generate test questions using AI   |
| `/institute/branding` | BrandingSettings    | Customize institute logo and theme |

---

## 7. ADMIN PANEL — ALL PAGES & ROUTES

Port: 8080 — Institute admin dashboard

All routes require login. Users are redirected to `/login` if unauthenticated.

| Path                        | Component          | Description                                      |
| --------------------------- | ------------------ | ------------------------------------------------ |
| `/login`                    | LoginPage          | Admin login                                      |
| `/` (index)                 | DashboardPage      | Dashboard: stats, revenue chart, recent activity |
| `/users`                    | UserList           | All users with search, filter by role/status     |
| `/users/create`             | UserForm           | Create a new user (student, teacher, staff)      |
| `/users/:id/edit`           | UserForm           | Edit existing user                               |
| `/courses`                  | CourseList         | All institute courses with filters               |
| `/courses/oversight`        | CourseOversight    | Detailed course oversight view                   |
| `/courses/create`           | CourseForm         | Create new course                                |
| `/courses/:id/edit`         | CourseForm         | Edit course                                      |
| `/tests`                    | TestOversight      | View and delete tests                            |
| `/quizzes`                  | QuizOversight      | View and delete quizzes                          |
| `/reviews`                  | ReviewModeration   | Approve, reject, bulk-delete reviews             |
| `/enrollments`              | EnrollmentList     | All enrollments; export to CSV                   |
| `/revenue`                  | RevenueDashboard   | Revenue overview, daily chart, top courses       |
| `/teachers`                 | TeacherList        | All teachers; verify or unverify                 |
| `/categories`               | CategoryList       | Course categories list                           |
| `/categories/create`        | CategoryForm       | Create category                                  |
| `/categories/:id/edit`      | CategoryForm       | Edit category                                    |
| `/exam-categories`          | ExamCategoryList   | Exam categories list                             |
| `/exam-categories/create`   | ExamCategoryForm   | Create exam category                             |
| `/exam-categories/:id/edit` | ExamCategoryForm   | Edit exam category                               |
| `/coupons`                  | CouponList         | All coupons list                                 |
| `/coupons/create`           | CouponForm         | Create coupon                                    |
| `/coupons/:id/edit`         | CouponForm         | Edit coupon                                      |
| `/announcements`            | AnnouncementCenter | Send announcement to users                       |

---

## 8. FULL USER FLOW: AUTHENTICATION

### Register (Student)

```
User opens /register
│
├── Fills: name, email, password, confirm password
├── Real-time validation:
│   ├── Email format check
│   ├── Password min 8 chars
│   └── Confirm password match
│
├── Submits form
│   └── POST /auth/register
│       Payload: { name, email, password }
│       Headers: X-Tenant-Id (from localStorage or subdomain)
│       │
│       ├── Server: hash password (bcrypt)
│       ├── Server: create User document with tenantId
│       ├── Server: generate access token (JWT, 15min) + refresh token (7 days)
│       ├── Server: queue email verification email
│       └── Response: { user, tokens }
│
├── Frontend stores:
│   ├── adminToken / token in localStorage
│   ├── adminTenantId / tenantId in localStorage
│   └── Redux: isAuthenticated=true, user=<user>
│
└── Redirect to /dashboard
```

### Login

```
User opens /login
│
├── Fills: email, password
├── Submits form
│   └── POST /auth/login
│       Payload: { email, password }
│       Headers: X-Tenant-Id
│       │
│       ├── Server: rate limit check (5 failed → 15min lockout, stored in Redis)
│       ├── Server: find user by email + tenantId
│       ├── Server: compare password (bcrypt)
│       ├── Server: check isActive
│       ├── Server: if mfaEnabled → return { requiresMfa: true, userId }
│       │   └── Frontend: show OTP input screen
│       │       └── POST /auth/mfa/login { userId, token }
│       └── Server: generate tokens, cache user in Redis (5min)
│
├── Frontend stores tokens in localStorage
├── Redux: auth state updated
│
└── Role-based redirect:
    ├── student → /dashboard
    ├── teacher → /teacher
    └── admin/super_admin → /admin/dashboard (admin panel at :8080)
```

### Google OAuth Login

```
User clicks "Continue with Google"
│
├── Redirect to GET /auth/google → Google consent screen
├── User approves → Google redirects to /auth/google/callback
├── Server: exchange code, fetch Google profile
├── Server: find or create user (link by googleId or email)
├── Server: generate tokens
└── Redirect to /auth/callback?accessToken=<>&refreshToken=<>
    └── Frontend stores tokens, clears URL params, redirects to /dashboard
```

### Token Refresh (Automatic)

```
Every API request:
└── Axios interceptor attaches: Authorization: Bearer <accessToken>

On 401 response:
├── isRefreshing flag = true
├── POST /auth/refresh-token { refreshToken }
│   ├── Server: verify refresh token (hashed in DB)
│   ├── Server: rotate token (new refresh token issued, old invalidated)
│   └── Response: { accessToken, refreshToken }
├── New tokens stored in localStorage
├── All queued requests retried with new token
└── On refresh failure → clear tokens, redirect to /login
```

### Password Reset

```
User clicks "Forgot password" → /forgot-password
├── Enters email
├── POST /auth/forgot-password { email }
│   └── Server: always responds success (prevents email enumeration)
│   └── If email found: generates reset JWT (1hr), sends email
│
User clicks link in email → /reset-password/:token
├── Enters new password + confirm
├── POST /auth/reset-password { token, password }
│   ├── Server: verify JWT, check not expired
│   ├── Server: hash new password, clear all refresh tokens
│   └── Response: success
└── Redirect to /login
```

---

## 9. FULL USER FLOW: STUDENT

### Dashboard

```
Student opens /dashboard
│
├── Parallel API calls:
│   ├── GET /enrollments/my → enrolled courses + progress
│   └── GET /notifications/unread-count → badge count on bell
│
├── Page renders:
│   ├── Stats: courses enrolled, % completed across all courses
│   ├── Continue Learning: recently accessed courses with progress bar
│   │   └── "Continue" button → /courses/:id/learn
│   ├── Upcoming tests (if any)
│   └── Recent notifications preview
│
└── Empty state (no enrollments):
    └── "Browse Courses" button → /courses
```

### Browsing & Enrolling in a Course

```
/courses page
│
├── GET /courses (with query params: search, category, level, page)
├── Course cards grid with filters:
│   ├── Search input (debounced, updates URL params)
│   ├── Category filter (from GET /categories)
│   ├── Level filter: Beginner | Intermediate | Advanced
│   └── Sort: Newest | Popular
│
Student clicks a course card → /courses/:id
├── GET /courses/:id → full course details
├── Page shows: title, description, thumbnail, price, curriculum, reviews
├── Free preview lessons visible (isPreview=true)
│
Student clicks "Enroll Now"
│
├── If NOT logged in → redirect to /login?redirect=/courses/:id
│
├── If logged in and course is FREE:
│   └── POST /payments/dummy-checkout { courseId }
│       ├── Server: creates payment (gateway: 'free', status: 'completed')
│       ├── Server: creates enrollment record
│       └── Redirect to /courses/:id/learn
│
└── If logged in and course is PAID:
    └── Navigate to /checkout/:courseId
        ├── GET /courses/:id (price, thumbnail, title)
        ├── Coupon input:
        │   └── POST /coupons/validate { code, courseId }
        │       ├── Valid → discount shown, total updated
        │       └── Invalid → error message inline
        ├── "Proceed to Pay" button:
        │   └── POST /payments/create-order { courseId, couponCode }
        │       └── Server: creates Razorpay/Stripe order
        │       └── Returns: { orderId, amount, currency, keyId }
        ├── Payment gateway modal opens (Razorpay/Stripe)
        ├── Student completes payment
        ├── Gateway calls webhook → POST /payments/webhook
        │   └── Server: verifies signature, creates payment + enrollment
        ├── Student side: POST /payments/verify { orderId, paymentId, signature }
        └── Redirect to /checkout/success
```

### Learning a Course

```
Student opens /courses/:id/learn
│
├── GET /enrollments/check/:courseId → verify enrollment
│   └── Not enrolled → redirect to /courses/:id with message
│
├── Page layout:
│   ├── Left sidebar: section/lesson tree
│   │   └── Lesson status: not started (○) | in progress | completed (✓)
│   └── Main area: video player or content
│
├── Student clicks a lesson:
│   └── GET /courses/:courseId/sections (includes lessons)
│   └── Video loads (YouTube embed or Cloudinary URL)
│
├── Progress tracking:
│   └── POST /enrollments/progress/:courseId
│       Payload: { lessonId, sectionId, watchTime, lastPosition, completed }
│       └── DB: lessonProgress[] updated in Enrollment document
│       └── DB: progressPercentage recalculated
│
├── Lesson marked completed:
│   └── Progress bar in sidebar updates
│   └── Next lesson becomes accessible
│
├── Notes tab:
│   ├── GET /notes/course/:courseId
│   ├── Create: POST /notes/course/:courseId { content }
│   ├── Edit: PUT /notes/:id { content }
│   └── Delete: DELETE /notes/:id
│
├── Discussion tab:
│   ├── GET /discussions/course/:courseId
│   ├── Post question: POST /discussions { courseId, content }
│   └── Reply: POST /discussions/:id/reply { content }
│
└── Course completion (progressPercentage = 100):
    └── GET /enrollments/certificate/:courseId
        ├── Server: marks enrollment completed (status: 'completed')
        ├── Server: generates Certificate document
        └── Returns: certificate with unique certificateId
```

### Taking a Test

```
Student opens /tests/:id
│
├── GET /tests/:id → test info (title, duration, rules, marks)
├── Clicks "Start Test"
│   └── POST /tests/:id/start
│       ├── Server: check eligibility (allowed attempts)
│       ├── Server: create TestAttempt (status: in-progress)
│       └── Returns: { attemptId, questions (shuffled if configured), timeLimit }
│
├── Test interface:
│   ├── Countdown timer (auto-submit at 0)
│   ├── Question palette: unattempted (grey) | answered (green) | marked (orange)
│   ├── Question text + options
│   └── Navigation: Previous | Save & Next | Mark for Review | Submit
│
├── Answering a question:
│   └── POST /tests/auto-save/:attemptId
│       Payload: { questionId, answer }
│       └── DB: answer saved in TestAttempt.answers[]
│
├── Exam violation logging:
│   └── POST /tests/violation/:attemptId
│       Payload: { type, timestamp }
│       └── Stored in TestAttempt.violations[]
│
├── Submit:
│   └── POST /tests/submit/:attemptId
│       ├── Server: evaluate all answers
│       ├── Server: calculate score, percentage
│       ├── DB: TestAttempt.status = 'completed'
│       └── Returns: { score, percentage, correct, incorrect, skipped }
│
└── Result page: GET /tests/result/:attemptId
    └── Shows: score, percentage, pass/fail, question-by-question breakdown
```

### Taking a Quiz

```
Student opens /quiz/:id (from within a course)
│
├── GET /quizzes/course/:courseId → quiz data with questions
├── Quiz renders with timer (if timeLimit set)
├── Student answers all questions
├── Submits:
│   └── POST /quizzes/submit
│       Payload: { quizId, courseId, answers: [] }
│       └── Server: evaluates, returns score, passed, explanations
└── Result shown inline with correct/incorrect answers and explanations
```

### Wishlist

```
On any course card or course detail page:
├── Heart icon button
├── POST /wishlist/toggle { courseId }
│   ├── Not in wishlist → adds
│   └── Already in wishlist → removes
├── GET /wishlist/check/:courseId → shows correct icon state
│
/wishlist page:
└── GET /wishlist → shows all saved courses
    └── Each course card has "Enroll" and "Remove" buttons
```

### Notifications

```
Bell icon in navbar:
├── GET /notifications/unread-count → badge number
├── Click bell → dropdown with last 5 notifications
├── Click notification:
│   └── PATCH /notifications/:id/read
│   └── Navigate to relevant entity (course, test, etc.)
│
/notifications page:
├── GET /notifications?page=1
├── Infinite scroll or pagination
├── "Mark all read": PATCH /notifications/read-all
└── Delete: DELETE /notifications/:id
```

---

## 10. FULL USER FLOW: TEACHER

### Teacher Dashboard

```
Teacher opens /teacher
│
├── Teacher-specific layout (TeacherLayout) with sidebar:
│   Courses | Tests | Quizzes | Students | Revenue | Discussions
│
├── TeacherDashboard:
│   ├── GET /enrollments/teacher/students (aggregated stats)
│   ├── GET /payments/teacher/revenue
│   └── GET /courses (filtered to own)
│   Shows: total courses, total students, revenue earned, avg rating
```

### Creating a Course

```
Teacher goes to /teacher/courses/new
│
├── TeacherCourseForm:
│   Fields: title, shortDescription, description (rich text),
│           category (dropdown from GET /categories),
│           level, price, discountPrice, language,
│           thumbnail (file upload), promoVideo URL
│
├── Thumbnail upload:
│   └── POST /uploads (multipart)
│       └── Returns: { url, publicId }
│       └── URL stored in form state
│
├── Submit (Save as Draft):
│   └── POST /courses { ...formData, isPublished: false }
│   └── DB: Course created (tenantId auto-set from token)
│   └── Redirect to /teacher/courses
│
├── Publish:
│   └── POST /courses { ...formData, isPublished: true }
│   └── OR: POST /courses (draft) → PATCH /courses/:id/publish (toggle)
│
└── Edit existing: /teacher/courses/:id/edit
    └── Same form, prefilled via GET /courses/:id
    └── PUT /courses/:id { ...changes }
```

### Creating a Test

```
Teacher goes to /teacher/tests/new (TeacherTestForm)
│
├── Fields:
│   ├── Title, description, category
│   ├── Course association (optional)
│   ├── Duration (minutes), totalMarks, passingMarks
│   ├── Negative marking toggle + marks per wrong answer
│   ├── Shuffle questions toggle
│   ├── Allowed attempts: 1 | 2 | 3 | unlimited
│   └── Available from/until (datetime)
│
├── Questions section:
│   ├── Add question form:
│   │   ├── Question type: single/multiple MCQ, true/false, fill-blank, short, essay
│   │   ├── Question text
│   │   ├── Options (for MCQ) + mark correct answer
│   │   ├── Marks, negative marks, explanation
│   │   └── "Add Question" → question appended to list
│   └── Questions list: reorderable, editable, deletable
│
├── Submit:
│   └── POST /tests { ...testData, questions: [...] }
│   └── DB: Test created with all questions embedded
│
└── View analytics: /teacher/tests/:id/analytics
    └── GET /tests/:id/analytics
    └── Shows: attempt count, avg score, question-wise accuracy
```

### Creating a Quiz

```
Teacher goes to /teacher/quizzes/new (TeacherQuizForm)
│
├── Fields: title, courseId, lessonId (optional), timeLimit, passingScore
├── Questions: same format as test questions (embedded)
│
└── POST /quizzes { ...quizData }
    └── DB: Quiz created linked to course
```

### Viewing Students

```
/teacher/students (TeacherStudents)
│
└── GET /enrollments/teacher/students
    └── Shows: student name, email, course, progress %, last accessed
```

### Teacher Revenue

```
/teacher/revenue (TeacherRevenue)
│
└── GET /payments/teacher/revenue
    └── Shows: total earnings, per-course breakdown, recent transactions
```

### Moderating Discussions

```
/teacher/discussions (TeacherDiscussions)
│
├── GET /discussions/course/:courseId (for own courses)
├── Can reply: POST /discussions/:id/reply
├── Can mark resolved: PATCH /discussions/:id/resolve
└── Can delete inappropriate posts: DELETE /discussions/:id
```

---

## 11. FULL USER FLOW: ADMIN

### Admin Login

```
Admin opens admin panel (localhost:8080 or admin.institute.com)
│
├── /login page
├── POST /auth/login { email, password }
│   Headers: X-Tenant-Subdomain (from hostname) or X-Tenant-Id (from localStorage)
│
├── On success:
│   ├── localStorage: adminToken, adminRefreshToken, adminTenantId
│   └── Redux: isAuthenticated=true, user=<admin>
│
└── Redirect to / (DashboardPage)
```

### Dashboard

```
DashboardPage:
│
├── GET /admin/dashboard (Redis cached, 5-min TTL)
│   Returns:
│   ├── overview: { totalUsers, totalCourses, totalEnrollments, totalTests }
│   ├── revenue: { total, thisMonth, growth }
│   ├── growth: { users, enrollments }
│   ├── roleDistribution: { admin, teacher, student } (plain object)
│   ├── monthlyTrends: [{ _id: {year, month}, count, revenue }]
│   └── recent: { users[], enrollments[] }
│
├── Stats cards: Total Users | Total Courses | Total Enrollments | Total Tests
├── Revenue cards: Lifetime | This Month | Growth %
├── Role distribution chart (pie)
├── Monthly trends chart (bar/line — revenue + enrollments)
├── Recent users table
└── Recent enrollments table
```

### Course Management

```
/courses (CourseList):
│
├── GET /admin/courses?search=&page=1&limit=10
├── Table: Thumbnail | Title | Teacher | Category | Price | Enrollments | Status | Actions
├── Actions per row:
│   ├── Edit → /courses/:id/edit (CourseForm)
│   │   └── PUT /admin/courses/:id
│   ├── Publish/Unpublish → PATCH /courses/:id/publish
│   ├── Toggle Featured → PATCH /admin/courses/:id/featured
│   └── Delete → DELETE /admin/courses/:id (confirmation dialog)
│
/courses/create (CourseForm):
└── Same as teacher create form but admin can assign to any teacher
    POST /courses { ...data }

/courses/oversight (CourseOversight):
└── Detailed view with enrollment counts, revenue per course
```

### User Management

```
/users (UserList):
│
├── GET /admin/users?search=&role=&page=1
├── Table: Avatar | Name | Email | Role | Status | Joined | Actions
├── Filter by: role (all/student/teacher/admin) | status (active/inactive)
│
├── Create User → /users/create (UserForm):
│   ├── Fields: name, email, password, role
│   └── POST /users { name, email, password, role, tenantId }
│
├── Edit User → /users/:id/edit (UserForm):
│   ├── GET /users/:id → prefill
│   └── PUT /users/:id { name, role, isActive }
│
└── Deactivate:
    └── PATCH /users/:id/status { isActive: false }
    └── User can no longer log in
```

### Enrollment Management

```
/enrollments (EnrollmentList):
│
├── GET /admin/enrollments?page=1&limit=20
├── Filters: student search | course | status | date range
├── Table: Student | Course | Enrolled Date | Status | Amount Paid
│
└── Export CSV:
    └── GET /admin/enrollments/export?<filters>
    └── Returns CSV blob → browser downloads enrollments_<date>.csv
    └── Columns: Student Name, Email, Course, Status, Amount, Date
```

### Revenue Dashboard

```
/revenue (RevenueDashboard):
│
├── GET /admin/revenue?period=30days
│   Returns:
│   ├── overview: { totalRevenue, avgOrderValue, totalOrders }
│   ├── periods: { thisMonth, lastMonth, monthlyGrowth }
│   ├── dailyRevenue: [{ _id: 'YYYY-MM-DD', revenue, orders }]
│   └── topCourses: [{ course, revenue, enrollments }]
│
├── Filter: 7 days | 30 days | 90 days | 1 year
├── Stats cards: Total Revenue | This Month | Avg Order Value | Total Orders
├── Daily revenue chart (line/bar)
└── Top courses by revenue table
```

### Coupon Management

```
/coupons (CouponList):
│
├── GET /admin/coupons?search=&page=1
├── Table: Code | Type | Value | Used/Limit | Expiry | Status | Actions
│
/coupons/create (CouponForm):
├── Fields:
│   ├── Code (uppercase, alphanumeric — or auto-generate)
│   ├── Discount Type: percentage | fixed
│   ├── Discount Value
│   ├── Min Order Amount (optional)
│   ├── Max Discount (optional, for % coupons)
│   ├── Usage Limit, Per User Limit
│   ├── Applicable Courses: all | specific (multi-select)
│   ├── Valid From, Valid Until
│   └── Active toggle
├── POST /admin/coupons { ...data }
│   └── tenantId resolved via getAdminTenantId(req):
│       1. req.tenantId (from X-Tenant-Id header via middleware)
│       2. req.user.tenantId (from JWT/Redis cache)
│       3. Fresh DB lookup in bypass mode
└── DB: Coupon created with tenantId

/coupons/:id/edit:
├── GET /admin/coupons/:id → prefill
└── PUT /admin/coupons/:id { ...changes }

Delete:
└── DELETE /admin/coupons/:id (soft delete — sets isActive=false)
```

### Review Moderation

```
/reviews (ReviewModeration):
│
├── GET /admin/reviews?page=1
├── Filters: course | status (approved/pending) | rating
├── Table: Student | Course | Rating | Comment | Date | Status | Actions
│
├── Approve/Reject:
│   └── PATCH /admin/reviews/:id/toggle-approval
│       └── DB: Review.isApproved toggled
│       └── Approved reviews appear on course detail page
│
├── Delete single:
│   └── DELETE /admin/reviews/:id (soft delete)
│
└── Bulk delete:
    └── Select multiple → POST /admin/reviews/bulk-delete { ids: [] }
```

### Teacher Management

```
/teachers (TeacherList):
│
├── GET /admin/teachers?page=1
├── Table: Name | Email | Courses | Verified | Actions
│
└── Verify/Unverify:
    └── PATCH /admin/teachers/:id/verify
    └── DB: User.teacherProfile.isVerified toggled
    └── Unverified teachers: cannot publish courses
```

### Category Management

```
/categories (CategoryList):
├── GET /categories
├── Create → /categories/create (CategoryForm): POST /categories
├── Edit → /categories/:id/edit: PUT /categories/:id
└── Delete: DELETE /categories/:id

/exam-categories (ExamCategoryList):
├── GET /categories (same endpoint, same categories collection)
├── Create → /exam-categories/create: POST /categories
├── Edit → /exam-categories/:id/edit: PUT /categories/:id
└── Delete: DELETE /categories/:id
```

### Announcements

```
/announcements (AnnouncementCenter):
│
├── Form:
│   ├── Title (required)
│   ├── Message (required)
│   └── Target: All Students | All Teachers | All Users
│
└── POST /admin/announcements { title, message, targetAudience }
    ├── Server: creates Notification records for all matching users
    ├── Server: queues emails to matching users
    └── Toast: "Announcement sent to X users"
```

---

## 12. STATE MANAGEMENT (REDUX SLICES)

### Admin Panel Slices (`/admin/src/features/*/`)

| Slice             | State shape                                       | Key thunks                                                                                             |
| ----------------- | ------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| authSlice         | `{ user, isAuthenticated, loading, initialized }` | login, getProfile, logout                                                                              |
| courseSlice       | `{ list, selected, pagination, loading }`         | fetchCourses, fetchCourseById, createCourse, updateCourse, deleteCourse, togglePublish, toggleFeatured |
| testSlice         | `{ list, pagination, loading }`                   | fetchTests, deleteTest                                                                                 |
| quizSlice         | `{ list, pagination, loading }`                   | fetchQuizzes, deleteQuiz                                                                               |
| userSlice         | `{ list, selected, pagination, loading }`         | fetchUsers, createUser, updateUser, deleteUser                                                         |
| enrollmentSlice   | `{ list, pagination, loading }`                   | fetchEnrollments, exportEnrollments                                                                    |
| revenueSlice      | `{ data, loading }`                               | fetchRevenue                                                                                           |
| couponSlice       | `{ list, selected, pagination, loading }`         | fetchCoupons, fetchCouponById, createCoupon, updateCoupon, deleteCoupon                                |
| reviewSlice       | `{ list, pagination, loading }`                   | fetchReviews, deleteReview, toggleApproval, bulkDeleteReviews                                          |
| teacherSlice      | `{ list, pagination, loading }`                   | fetchTeachers, verifyTeacher                                                                           |
| categorySlice     | `{ list, pagination, loading }`                   | fetchCategories, createCategory, updateCategory, deleteCategory                                        |
| examCategorySlice | `{ list, selected, pagination, loading }`         | fetchExamCategories, createExamCategory, etc.                                                          |

### All Slice Pattern (standard across admin panel)

```javascript
// Thunk: returns full API response (not just .data.data)
const res = await api.getAll(params);
return res.data; // { data: [], pagination: {} }

// Fulfilled reducer:
state.list = action.payload.data || [];
state.pagination = action.payload.pagination || null;
```

### Client App Slices (`/client/src/features/*/`)

| Slice             | Description                     |
| ----------------- | ------------------------------- |
| authSlice         | User session, profile           |
| courseSlice       | Course catalog, selected course |
| enrollmentSlice   | My enrollments, progress        |
| testSlice         | Tests, attempts                 |
| quizSlice         | Quizzes                         |
| reviewSlice       | Course reviews                  |
| notificationSlice | Notifications, unread count     |
| wishlistSlice     | Wishlisted courses              |
| noteSlice         | Personal lesson notes           |
| discussionSlice   | Course discussions              |
| blogSlice         | Blog posts                      |
| leaderboardSlice  | Rankings                        |
| achievementSlice  | Badges                          |
| categorySlice     | Course categories               |
| paymentSlice      | Orders and payments             |

---

## 13. MULTI-TENANCY ARCHITECTURE

### How Tenant Is Identified (per request)

```
Every incoming request goes through tenantIdentification middleware:
│
Step 1: Check subdomain
│   host = "myinstitute.localhost" → subdomain = "myinstitute"
│   → query Institute.findOne({ subdomain }) (Redis cache first, 5min TTL)
│
Step 2 (if no subdomain): Check X-Tenant-Subdomain header
│
Step 3 (if no header): Check X-Tenant-Id header
│   → query Institute.findById(tenantIdHeader)
│
Step 4 (if still no tenant): JWT fallback
│   → decode Bearer token → find user → use user.tenantId
│   → only works for non-super_admin users
│
If tenant found:
├── Verify: tenant.isActive = true
├── Verify: subscription.status ≠ 'suspended'
├── Verify: subscription not expired (7-day grace period)
├── Set: req.tenantId, req.tenant
└── Run request inside: runWithTenant(tenantId, false, next)

If no tenant:
└── Run in bypass mode: runWithTenant(null, true, next)
    └── Used for super_admin and global endpoints
```

### How Tenant Is Enforced on Queries

```
tenantPlugin (Mongoose plugin applied to all models except Institute):
│
├── pre('find'/'findOne'/'findOneAndUpdate'...):
│   ├── if isBypassTenant() → skip (super_admin mode)
│   └── else → this.where({ tenantId: currentTenantId })
│       → every query automatically scoped to current tenant
│
├── pre('save'):
│   ├── if isBypassTenant() → skip (tenantId must be set manually)
│   └── else → if !this.tenantId: this.tenantId = currentTenantId
│
└── pre('insertMany'):
    └── same logic — inject tenantId into all documents
```

### Admin Panel Tenant Context

```
Admin panel (port 8080) sends with every request:
├── Authorization: Bearer <adminToken>
└── X-Tenant-Id: <adminTenantId> (from localStorage)
    └── Stored on login if user.tenantId exists

getAdminTenantId(req) helper (used in /admin/coupons and others):
1. Check req.tenantId (set by tenant middleware from X-Tenant-Id header) ← first
2. Check req.user.tenantId (from JWT/Redis user cache)
3. Fresh DB lookup: runWithTenant(null, true, () => User.findById(userId)) ← bypass mode
4. If still not found → 403 "Super-admin accounts must supply X-Tenant-Id header"
```

---

## 14. REAL-TIME & BACKGROUND JOBS

### WebSocket (Socket.IO)

```
Server: Socket.IO with Redis adapter (for multi-instance support)

Events emitted by server:
├── notification:new → client's notification bell updates
├── liveclass:started → students notified class is live
└── liveclass:ended → students notified class ended

Client connects on login, disconnects on logout.
Unread notification count updates in real-time without polling.
```

### Job Queues (BullMQ + Redis)

8 active queue workers:

| Queue        | What it processes                                                          |
| ------------ | -------------------------------------------------------------------------- |
| email        | Sends transactional emails (welcome, reset password, receipt, certificate) |
| notification | Creates in-app notification records in bulk                                |
| certificate  | Generates certificate PDF/HTML after course completion                     |
| drip         | Unlocks drip-scheduled lessons on their scheduled date                     |
| reminder     | Sends reminder notifications (e.g., test starting soon)                    |
| dunning      | Handles subscription payment retries and expiry warnings                   |
| analytics    | Processes user activity events for leaderboard/badge updates               |
| (unnamed)    | Additional background processing                                           |

### Firebase Push Notifications

```
FCM token registered on login:
└── POST /auth/fcm-token { token }
    └── DB: User.fcmTokens[] updated

Push notifications sent from server via Firebase Admin SDK
to registered device tokens when events occur.
```

---

## 15. SECURITY IMPLEMENTATION

### What Is Actually in Place

**Authentication:**

- JWT access tokens (15-min expiry), refresh tokens (7-day, hashed in DB, rotated on use)
- bcrypt password hashing (rounds: 12 via default)
- MFA support (TOTP via Speakeasy, QR code setup)
- Google OAuth (Passport.js)
- Account lockout after 5 failed logins (Redis, 15-min TTL)

**Authorization:**

- RBAC via `authorize(...roles)` middleware on every protected route
- Cross-tenant access check: `if (user.tenantId !== req.tenantId) → 403`
- Super admin bypass mode for cross-tenant operations

**Multi-tenancy isolation:**

- Mongoose tenantPlugin auto-scopes all queries by tenantId
- Tenant middleware verifies active status and subscription before allowing any request
- JWT fallback resolves tenant from user's own tenantId when no header is sent

**Rate limiting:**

- Global: applied to all routes
- Auth-specific: stricter limit on `/auth/login` and `/auth/register`
- AI endpoints: per-user hourly limit

**Input validation:**

- Joi (JavaScript modules) and Zod (TypeScript modules) schemas on all mutation endpoints
- `validate()` middleware applied before controller functions

**File uploads:**

- Multer handles multipart
- Files go to Cloudinary (not local disk)
- MIME type restriction per upload route

**Error handling:**

- Centralised `errorHandler.js` middleware — never leaks stack traces to client
- Custom `ApiError` class with HTTP status codes
- All async controllers wrapped in `catchAsync()` — uncaught rejections handled

**Audit logging:**

- `auditLog.js` middleware logs admin actions
- Records: actor, action, resource, resourceId, ip, userAgent, tenantId

---

## 16. KNOWN WORKING INTEGRATIONS

| Integration    | Purpose                                        | Status   |
| -------------- | ---------------------------------------------- | -------- |
| Razorpay       | Payment processing, webhooks, refunds          | ✅ Built |
| Stripe         | Payment processing alternative                 | ✅ Built |
| Cloudinary     | Image and video file storage                   | ✅ Built |
| Google OAuth   | Social login                                   | ✅ Built |
| Firebase Admin | Push notifications (FCM)                       | ✅ Built |
| OpenAI         | AI doubt solving, quiz generation, study plans | ✅ Built |
| LangChain      | RAG-based doubt solving                        | ✅ Built |
| Redis          | Caching, session, queues, pub/sub              | ✅ Built |
| BullMQ         | Background job queues                          | ✅ Built |
| Socket.IO      | Real-time notifications, live class events     | ✅ Built |
| MongoDB Atlas  | Primary database                               | ✅ Built |
| Speakeasy      | TOTP-based MFA                                 | ✅ Built |
| Sentry         | Error tracking (configured)                    | ✅ Built |
| Winston        | Server-side logging                            | ✅ Built |

---

## APPENDIX: RESPONSE SHAPE STANDARD

All API responses follow this envelope:

**Success (list):**

```json
{
  "success": true,
  "message": "...",
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 45,
    "pages": 5,
    "hasNext": true,
    "hasPrev": false
  }
}
```

**Success (single):**

```json
{
  "success": true,
  "message": "...",
  "data": { ... }
}
```

**Error:**

```json
{
  "success": false,
  "message": "Human-readable error message",
  "errors": [{ "field": "email", "message": "Email already registered" }]
}
```

All Redux slices in the admin panel read:

- `action.payload.data` → list array
- `action.payload.pagination` → pagination object

---

**Document generated from live codebase audit — May 26, 2026**
**Only covers code that is actually written, wired up, and running.**
