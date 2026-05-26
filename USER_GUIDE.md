# TestBook LMS — User Guide & Flow Documentation

## Overview

TestBook is a **multi-tenant LMS (Learning Management System)** — one platform that powers
many independent institutes. Each institute has its own subdomain, data isolation, and branding.

### Quick Access (Local Dev)

| Service       | URL                                |
| ------------- | ---------------------------------- |
| Student App   | http://localhost:5173              |
| Admin Panel   | http://localhost:8080              |
| API           | http://localhost:5000/api/v1       |
| Queue Monitor | http://localhost:5000/admin/queues |
| Health Check  | http://localhost:5000/health       |

### Demo Login Credentials

| Role    | Email                | Password       |
| ------- | -------------------- | -------------- |
| Student | arjun@student.com    | Student@123456 |
| Teacher | teacher@testbook.com | Teacher@123456 |

---

## User Roles

| Role          | Who They Are                           | Can Do                                     |
| ------------- | -------------------------------------- | ------------------------------------------ |
| `student`     | Learner who buys courses / takes tests | Enroll, learn, take tests, chat            |
| `teacher`     | Content creator at an institute        | Create courses, tests, live classes        |
| `admin`       | Institute owner / manager              | Manage teachers, branding, subscription    |
| `super_admin` | Platform operator (you / SaaS owner)   | Manage all institutes, view platform stats |

---

## 1. Student Flow

### 1.1 Registration & Login

```
/ (Home)
  └─ Browse courses (no login required)
  └─ /login  ──►  Enter email + password  ──►  /dashboard
  └─ /register  ──►  Fill name/email/password  ──►  Email verification  ──►  /dashboard
  └─ Google OAuth  ──►  /auth/callback  ──►  /dashboard
```

**Password Reset:**

```
/login  ──►  "Forgot Password?"  ──►  /forgot-password
  └─ Enter email  ──►  Email sent  ──►  /reset-password/:token  ──►  Set new password
```

### 1.2 Dashboard (`/dashboard`)

What a student sees after login:

- **My enrolled courses** with progress bars
- **Upcoming live classes**
- **Recent test results** with score trends
- **Notifications** (bell icon top right)
- **Points & achievements** summary

### 1.3 Browsing & Enrolling in a Course

```
/courses
  └─ Filter by category / search
  └─ Click a course card  ──►  /courses/:id  (Course Detail)
      ├─ Syllabus, instructor, reviews, price
      ├─ [Free course]   ──►  "Enroll Free"  ──►  instant access
      └─ [Paid course]   ──►  "Buy Now"  ──►  /checkout/:id
                                  ├─ Apply coupon code (optional)
                                  ├─ Pay via Razorpay
                                  └─ /checkout/success  ──►  enrolled
```

**Wishlist:** Click the heart icon on any course to save it → `/wishlist`

### 1.4 Learning a Course (`/courses/:id/learn`)

Inside a course player:

- **Left sidebar** — course sections & lessons (click to navigate)
- **Video player** — streams Cloudinary HLS video
- **Progress auto-saved** — lesson marked complete when 90% watched
- **Notes tab** — add personal timestamped notes
- **Discussions tab** — ask questions, reply, like, resolve
- **AI Doubt Solver** — type your question, get instant AI answer

**Progress bar** on the course card updates in real-time.

### 1.5 Taking a Test (`/tests/:id/take`)

```
/tests  ──►  Browse tests by category
  └─ /tests/:id  (Test Detail)  ──►  "Start Test"
      └─ /tests/:id/take
          ├─ Timer counts down
          ├─ Navigate questions with number grid
          ├─ Mark for review, skip, flag
          ├─ [Auto-submit on timeout]
          └─ "Submit"  ──►  /tests/:id/result
              ├─ Score, rank, time taken
              ├─ Correct / wrong / unattempted breakdown
              └─ Answer key with explanations
```

**Offline (Mobile app):** Answers auto-save to local storage if connectivity drops. Syncs when back online.

### 1.6 Quizzes Inside Courses (`/quiz/:id`)

- Short quizzes attached to individual lessons
- Auto-graded, instant feedback
- Results feed into the leaderboard

### 1.7 Live Classes (`/live-classes`)

```
/live-classes  ──►  Browse upcoming classes (enrolled courses only)
  └─ Get WhatsApp + email reminder 15 min before
  └─ "Join"  ──►  /live-classes/:id/room
      ├─ WebRTC video (camera + mic controls)
      ├─ Screen share button
      ├─ Chat panel (right side)
      ├─ Raise hand button
      └─ "Leave" to exit
```

### 1.8 AI Features (`/ai/*`)

| Route              | What it does                                   |
| ------------------ | ---------------------------------------------- |
| `/ai/doubt-solver` | Type any question → streams AI answer (SSE)    |
| `/ai/questions`    | Paste topic → generates MCQ practice questions |
| `/ai/study-plan`   | Enter subjects/exam date → personalized plan   |

> AI features require `OPENAI_API_KEY` in server `.env`. Shows a disabled state if not configured.

### 1.9 Certificates & Achievements

- **Certificate** issued when course progress = 100%
- Download PDF from `/my-courses` → course card → "Certificate"
- Verify any certificate at `/verify-certificate` (public page, no login)
- **Achievements** (badges) unlocked by milestones → `/achievements`
- **Leaderboard** ranks all students by points → `/leaderboard`

### 1.10 Profile & Settings (`/settings`)

- Update name, phone, bio
- Change password
- **Enable MFA** — scan QR code in Google Authenticator / Authy → 6-digit confirm
- View and download your data (GDPR export)
- Delete your account (GDPR erasure)

---

## 2. Teacher Flow

### 2.1 Teacher Dashboard (`/teacher`)

After login as teacher:

- Revenue summary (this month / total)
- Student count across all courses
- Course performance table
- Pending reviews

### 2.2 Creating a Course

```
/teacher  ──►  "Create Course"  ──►  Course Form
  Step 1 — Basic Info
    ├─ Title, description, category
    ├─ Thumbnail (upload image)
    └─ Price (0 = free) + coupon eligibility

  Step 2 — Curriculum Builder
    ├─ "+ Add Section"  ──►  drag to reorder
    └─ "+ Add Lesson" inside a section
        ├─ Lesson type: Video / Text / Quiz
        ├─ Video: upload to Cloudinary (HLS auto-generated)
        └─ Quiz: add MCQ questions inline

  Step 3 — Publish
    └─ Toggle "Publish" switch  ──►  visible to students
```

All courses are **draft by default**. Only published courses appear in `/courses`.

### 2.3 Creating a Test

```
/teacher  ──►  "Tests" tab  ──►  "Create Test"
  ├─ Title, description, duration, passing score
  ├─ Category / exam type
  ├─ Questions
  │    ├─ "+ Add Question" (MCQ)
  │    ├─ Options A-D, mark correct answer
  │    └─ Add explanation (shown in result)
  └─ "Publish"  ──►  visible in /tests
```

### 2.4 Creating a Live Class

```
/live-classes  ──►  "Schedule Live Class" (teacher only)
  ├─ Title, description, scheduled time
  ├─ Linked course (optional)
  └─ "Create"
      ├─ Students enrolled in the linked course get notified
      └─ At scheduled time: "Start" button appears
          └─ /live-classes/:id/room (host view)
              ├─ All student video/audio feeds
              ├─ Mute/remove participants
              └─ "End Class" button
```

### 2.5 Teacher Quizzes

- Create standalone quizzes at `/teacher` → Quizzes tab
- Attach quizzes to specific lessons in the curriculum builder
- Analytics: completion rate, average score per question

### 2.6 Discussion Management

- View all discussions across your courses from teacher dashboard
- Reply, resolve threads, delete inappropriate posts
- Route: `/teacher/discussions`

---

## 3. Institute Admin Flow

The **admin** role manages one institute. Created automatically during onboarding.

### 3.1 Branding Settings (`/institute/branding`)

- Set institute name, logo URL, brand colors, contact info
- Changes reflect on the subdomain immediately (cache clears)

### 3.2 Managing Teachers

From admin dashboard:

- Invite teachers by email → they receive a setup link
- Revoke access (deactivate user)
- View teacher performance metrics

### 3.3 Subscription Management

```
/pricing  ──►  View plans (Starter / Pro / Enterprise)
  └─ "Upgrade"  ──►  Razorpay payment flow
      └─ Subscription activates immediately after payment
```

After expiry: **7-day grace period** (full access) → then read-only mode.

---

## 4. Super Admin Flow

> Access: `super_admin` role only. Go to `/super-admin`.

### 4.1 Platform Dashboard (`/super-admin`)

Shows:

- Total institutes (active / suspended / expired / trial)
- Total students, courses, enrollments platform-wide
- 6-month growth chart
- Search + filter institutes

**Actions per institute:**
| Action | What happens |
|------------|--------------|
| **Suspend** | Institute blocked immediately, tenant cache cleared |
| **Activate** | Restores access |
| **View** | Drill into institute details |

### 4.2 Onboarding a New Institute (`/super-admin/onboard`)

3-step wizard:

**Step 1 — Institute Details**

- Name, subdomain (availability checked live)
- Subdomain rules: 3-50 chars, lowercase alphanumeric + hyphens
- Reserved words blocked: `www`, `api`, `admin`, `app`, etc.

**Step 2 — Admin Account + Plan**

- Admin name, email, password
- Select subscription plan (Starter / Pro / Enterprise)

**Step 3 — Review & Confirm**

- Summary of everything
- Click "Launch Institute" → institute created + admin account ready

The new institute is immediately accessible at `{subdomain}.yourdomain.com`.

### 4.3 Queue Monitor (`/admin/queues`)

Real-time view of all background job queues:

- `email` — transactional emails (welcome, reset, enrollment)
- `notification` — push notifications
- `certificate` — PDF generation
- `reminder` — live class reminders
- `dunning` — subscription expiry warnings
- `drip` — scheduled content release

Retry failed jobs, inspect payloads, clear stuck queues.

---

## 5. Affiliate Program Flow

### For Affiliates (`/affiliate`)

```
/affiliate  ──►  "Register as Affiliate"
  └─ Unique referral code generated (e.g. ARJUN2024)
      └─ Share link: https://yourdomain.com/affiliate/validate/ARJUN2024
          └─ When someone visits → code stored in session
              └─ If they purchase → commission recorded
                  └─ Payout requested from dashboard
```

Dashboard shows:

- Referral code + shareable link (one-click copy)
- Total referrals, total earnings, pending payout

---

## 6. Complete URL Reference

### Public (no login)

| URL                   | Page                   |
| --------------------- | ---------------------- |
| `/`                   | Home page              |
| `/courses`            | Course catalog         |
| `/courses/:id`        | Course detail          |
| `/tests`              | Test catalog           |
| `/tests/:id`          | Test detail            |
| `/leaderboard`        | Global leaderboard     |
| `/blog`               | Blog listing           |
| `/blog/:slug`         | Blog post              |
| `/pricing`            | Subscription plans     |
| `/verify-certificate` | Certificate verifier   |
| `/login`              | Login                  |
| `/register`           | Register               |
| `/forgot-password`    | Password reset request |

### Student (requires login)

| URL                      | Page                         |
| ------------------------ | ---------------------------- |
| `/dashboard`             | Student dashboard            |
| `/my-courses`            | Enrolled courses             |
| `/courses/:id/learn`     | Course player                |
| `/tests/:id/take`        | Test taking                  |
| `/tests/:id/result`      | Test result                  |
| `/quiz/:id`              | Inline quiz                  |
| `/my-test-attempts`      | Test history                 |
| `/achievements`          | Badges & achievements        |
| `/wishlist`              | Saved courses                |
| `/checkout/:id`          | Payment checkout             |
| `/checkout/success`      | Payment success              |
| `/orders`                | Order history                |
| `/live-classes`          | Live class listing           |
| `/live-classes/:id/room` | Live class room              |
| `/ai/doubt-solver`       | AI Q&A                       |
| `/ai/questions`          | Question generator           |
| `/ai/study-plan`         | Study plan AI                |
| `/notifications`         | Notification center          |
| `/profile`               | Profile page                 |
| `/settings`              | Account settings (incl. MFA) |
| `/affiliate`             | Affiliate dashboard          |

### Teacher (requires teacher role)

| URL        | Page              |
| ---------- | ----------------- |
| `/teacher` | Teacher dashboard |

### Admin (requires admin role)

| URL                   | Page              |
| --------------------- | ----------------- |
| `/institute/branding` | Branding settings |

### Super Admin (requires super_admin role)

| URL                    | Page                  |
| ---------------------- | --------------------- |
| `/super-admin`         | Platform dashboard    |
| `/super-admin/onboard` | Onboard new institute |

---

## 7. API Reference (Key Endpoints)

Base URL: `http://localhost:5000/api/v1`

### Auth

| Method | Endpoint                | Description                       |
| ------ | ----------------------- | --------------------------------- |
| POST   | `/auth/register`        | Create account                    |
| POST   | `/auth/login`           | Login (returns JWT + sets cookie) |
| POST   | `/auth/logout`          | Logout                            |
| POST   | `/auth/refresh-token`   | Refresh access token              |
| POST   | `/auth/forgot-password` | Send reset email                  |
| POST   | `/auth/reset-password`  | Set new password                  |
| GET    | `/auth/profile`         | Get current user                  |
| POST   | `/auth/mfa/setup`       | Get MFA QR code                   |
| POST   | `/auth/mfa/verify`      | Enable MFA                        |
| POST   | `/auth/mfa/disable`     | Disable MFA                       |

### Courses

| Method | Endpoint               | Description                 |
| ------ | ---------------------- | --------------------------- |
| GET    | `/courses`             | List courses (with filters) |
| GET    | `/courses/:id`         | Course detail               |
| POST   | `/courses`             | Create course (teacher)     |
| PUT    | `/courses/:id`         | Update course (teacher)     |
| PATCH  | `/courses/:id/publish` | Publish/unpublish           |

### Enrollments

| Method | Endpoint                          | Description            |
| ------ | --------------------------------- | ---------------------- |
| POST   | `/enrollments`                    | Enroll in course       |
| GET    | `/enrollments/my`                 | My enrolled courses    |
| GET    | `/enrollments/check/:courseId`    | Check if enrolled      |
| POST   | `/enrollments/progress/:courseId` | Update lesson progress |

### Tests

| Method | Endpoint                   | Description        |
| ------ | -------------------------- | ------------------ |
| GET    | `/tests`                   | List tests         |
| POST   | `/tests/:id/start`         | Start test attempt |
| POST   | `/tests/submit/:attemptId` | Submit answers     |

### Payments

| Method | Endpoint                 | Description              |
| ------ | ------------------------ | ------------------------ |
| POST   | `/payments/create-order` | Create Razorpay order    |
| POST   | `/payments/verify`       | Verify payment signature |
| GET    | `/payments/my-orders`    | Order history            |

### Institutes (Super Admin)

| Method | Endpoint                             | Description          |
| ------ | ------------------------------------ | -------------------- |
| GET    | `/institutes/check-subdomain/:sub`   | Check availability   |
| POST   | `/institutes/onboard`                | Self-service onboard |
| GET    | `/institutes/admin/all`              | All institutes       |
| GET    | `/institutes/admin/stats`            | Platform stats       |
| PATCH  | `/institutes/admin/all/:id/suspend`  | Suspend              |
| PATCH  | `/institutes/admin/all/:id/activate` | Activate             |

---

## 8. Environment Variables Required

Create `server/.env` with these keys for full functionality:

```env
# Core (required)
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb+srv://...
JWT_SECRET=at-least-32-chars-secret

# Redis (required for rate limiting, sessions, caching)
REDIS_HOST=127.0.0.1
REDIS_PORT=6379
REDIS_PASSWORD=

# Email (required for password reset, notifications)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your@gmail.com
SMTP_PASS=your-app-password
EMAIL_FROM=TestBook <your@gmail.com>

# Cloudinary (required for video/image uploads)
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

# Razorpay (required for payments)
RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=

# Google OAuth (optional)
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_CALLBACK_URL=http://localhost:5000/api/v1/auth/google/callback

# AI Features (optional — AI routes disabled if missing)
OPENAI_API_KEY=

# WhatsApp (optional)
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_WHATSAPP_FROM=whatsapp:+14155238886

# Frontend URLs
CLIENT_URL=http://localhost:5173
ADMIN_URL=http://localhost:8080
```

---

## 9. Multi-Tenancy Explained

Every institute is **fully isolated**:

```
Student A (institute: demo.testbook.com)
  └─ Can ONLY see courses/tests/users that belong to demo.testbook.com
  └─ Cannot access data from school.testbook.com

Student B (institute: school.testbook.com)
  └─ Completely separate data, branding, subscription
```

**How it works:**

1. Browser sends `X-Tenant-Subdomain: demo` header (or host header in production)
2. Server resolves it to an `Institute` document (cached in Redis for 5 min)
3. Every Mongoose query automatically adds `{ tenantId: institute._id }` filter
4. Super admin bypasses this by passing `bypass: true` in context

---

## 10. Running Locally — Quick Reference

```bash
# Start all services
cd server && npm run dev          # API on :5000
cd client && npm run dev          # Student app on :5173
cd admin && npm run dev           # Admin panel on :8080

# Redis must be running
redis-cli ping                    # Should return PONG

# Seed demo data
cd server && npm run seed         # Creates courses, tests, users

# Run server tests
cd server && npm test

# Run client unit tests
cd client && npm test

# Run E2E tests (client dev server must be running)
cd client && npm run test:e2e
```

---

## 11. Common Issues & Fixes

| Issue                                | Fix                                                      |
| ------------------------------------ | -------------------------------------------------------- |
| Login fails with "Invalid subdomain" | Set `X-Tenant-Subdomain` header or use correct subdomain |
| AI doubt solver shows "disabled"     | Add `OPENAI_API_KEY` to `server/.env`                    |
| Video won't upload                   | Configure Cloudinary credentials                         |
| Payments fail                        | Add Razorpay keys; use test mode keys for dev            |
| Emails not sending                   | Configure SMTP or use Mailtrap for dev                   |
| Redis errors on startup              | Run `redis-server` or `brew services start redis`        |
| MFA QR code not showing              | Enable MFA in settings, check server is running          |
