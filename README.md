TESTBOOK PLATFORM — ENTERPRISE PRODUCT SPECIFICATION
Complete User Flow, Architecture & System Design Document
Version 1.0 | Classification: Internal Engineering & Product
Date: May 2026 | Platform: Multi-Tenant SaaS LMS

TABLE OF CONTENTS
Product Overview
User Roles & Permissions
Global Application Flow
Full Navigation Tree
Complete User Flow Mapping
Homepage & Public Portal Flow
Authentication Flow
Student Portal Flow
Teacher Portal Flow
Parent Portal Flow
Admin Panel Flow
Super Admin Panel Flow
Advanced Modules
Notifications & Communication Flow
Database Flow Mapping
API Flow Mapping
State Management Flow
UI/UX Behavior Rules
Edge Cases & Failure Scenarios
Security Flow
Scalability & Future Architecture
SECTION 1: PRODUCT OVERVIEW
1.1 Product Purpose
Testbook Platform is a multi-tenant, white-label Learning Management System (LMS) built for educational institutes of all sizes — coaching centers, schools, universities, and online academies. Each institute gets its own isolated environment (subdomain, branding, data) while sharing a common infrastructure.

The platform allows institutes to:

Publish and sell courses
Conduct tests, quizzes, and live exams
Manage student enrollments and payments
Track teacher performance and student progress
Run their entire education operations digitally
1.2 Vision
"Every institute deserves enterprise-grade digital infrastructure — regardless of size or budget."

The platform removes the need for institutes to build custom software by providing a fully managed, scalable, brandable education OS.

1.3 Core Problems Solved
Problem Solution
Institutes lack digital presence White-label website + student portal per institute
Student learning is fragmented Unified course + test + quiz + certificate system
Manual fee and enrollment tracking Automated enrollment, payment gateway, coupon engine
No way to measure student progress Analytics dashboard for admins, teachers, students
Communication is scattered In-app notifications, SMS, email, announcements
Data isolation between institutes Multi-tenant architecture with strict tenant scoping
Scaling digital exams is hard Proctored online exam engine with anti-cheat logic
Content delivery is slow CDN-backed video and file delivery
1.4 User Types

Platform Level
└── Super Admin (platform owner — manages all institutes)

Institute Level
├── Admin (institute owner/manager)
├── Staff (institute support staff)
├── Accountant (fee and revenue management)
├── Teacher (content creator, examiner)
└── Librarian (digital resource manager)

Student Level
├── Student (enrolled learner)
└── Parent (monitors student activity)

Public Level
└── Guest (unauthenticated visitor)
1.5 Platform Overview
The platform consists of four distinct applications sharing a single backend:

Application URL Pattern Purpose
Public Client institute.platform.com or client.localhost:5173 Student-facing course catalog, enrollment, learning
Admin Panel admin.platform.com or localhost:8080 Institute management dashboard
Platform Portal platform.com or localhost:5175 Marketing, institute signup, super admin
Backend API api.platform.com or localhost:5000/api/v1 Unified REST API
1.6 Main Business Goals
Acquisition: Institutes sign up and create their white-label environment
Activation: Institute publishes first course within 7 days
Retention: Students enroll, complete courses, and return for more
Revenue: Platform earns via subscription plans sold to institutes
Referral: Students recommend institute to others
1.7 User Journey Summary

GUEST → visits institute website → browses courses
→ registers account → becomes STUDENT
→ enrolls in course → completes lessons → takes tests
→ earns certificate → leaves review
→ refers friends → reactivates for next course

TEACHER → invited by admin → creates course
→ uploads content → creates tests
→ monitors students → marks attendance
→ communicates via messages

ADMIN → registers institute on platform
→ configures branding → sets up payment gateway
→ manages teachers and students
→ tracks revenue → views analytics
→ generates reports
SECTION 2: USER ROLES & PERMISSIONS
2.1 Permission Matrix Overview

Permission Levels:
0 = No access
R = Read only
RW = Read + Write
FULL = Full CRUD + Admin actions
SUPER = Cross-tenant platform-level access
2.2 Guest User
Who: Unauthenticated visitor to the institute's public-facing website.

Access Permissions
Resource Permission
Public course catalog R
Course detail page R
Institute homepage R
Blog/articles R
Category browsing R
Instructor profiles (public) R
Course curriculum preview R (first 2 lessons only)
Reviews (read) R
Registration form WRITE (create account)
Login form WRITE (authenticate)
Contact form WRITE (submit inquiry)
Cart / checkout WRITE (add to cart, but redirected to login on checkout)
Restrictions
Cannot access any dashboard
Cannot enroll in courses
Cannot view lesson content beyond preview
Cannot view test content
Cannot access any admin route
Cannot access student profile
Redirect Rules
Attempting /dashboard → redirect to /login
Attempting /courses/:id/learn → redirect to /login?redirect=/courses/:id/learn
After login → redirect to original destination or /dashboard
2.3 Student
Who: Registered, authenticated user who has enrolled in at least one course.

Allowed Pages

/dashboard → Personal learning dashboard
/courses → Course catalog (browse)
/courses/:id → Course detail page
/courses/:id/learn → Course player (enrolled only)
/my-courses → Enrolled courses list
/tests → Available tests
/tests/:id → Test detail
/tests/:id/attempt → Take test (if eligible)
/tests/:id/result → View result (after attempt)
/quizzes → Quiz list
/quizzes/:id/attempt → Take quiz
/certificates → My earned certificates
/certificates/:id → View/download certificate
/profile → Edit personal profile
/settings → Account settings
/notifications → Notification center
/messages → Messaging center (teacher communication)
/leaderboard → Points and ranking
/downloads → Downloaded materials
CRUD Permissions
Resource Create Read Update Delete
Own profile - ✓ ✓ -
Reviews ✓ (enrolled) ✓ ✓ (own) ✓ (own)
Test attempts ✓ ✓ (own) - -
Messages (to teacher) ✓ ✓ (own) - ✓ (own)
Bookmarks ✓ ✓ - ✓
Notes (personal) ✓ ✓ ✓ ✓
Downloads - ✓ (enrolled) - -
Certificates - ✓ (earned) - -
Data Visibility
Can only see own enrollment records
Can only see own test results
Can see other students' names on leaderboard (no PII)
Cannot see other students' progress or notes
Cannot see revenue or admin data
Notifications Access
Receives: new content published, test reminders, result published, announcements, messages from teachers, certificate issued
Cannot send mass notifications
2.4 Teacher
Who: Verified educator hired by the institute admin to create and deliver content.

Allowed Pages

/teacher/dashboard → Teaching analytics
/teacher/courses → My courses list
/teacher/courses/create → Create new course
/teacher/courses/:id/edit → Edit course
/teacher/courses/:id/content → Manage lessons/modules
/teacher/tests → My tests
/teacher/tests/create → Create test
/teacher/tests/:id/edit → Edit test
/teacher/students → View enrolled students
/teacher/attendance → Mark attendance
/teacher/results → Manage result publishing
/teacher/messages → Student/parent messaging
/teacher/profile → Edit profile
/teacher/notifications → Notifications
CRUD Permissions
Resource Create Read Update Delete
Courses (own) ✓ ✓ ✓ ✓ (unpublished only)
Lessons (own course) ✓ ✓ ✓ ✓
Tests (own) ✓ ✓ ✓ ✓ (before attempt)
Questions ✓ ✓ ✓ ✓
Attendance ✓ ✓ (own students) ✓ -
Results ✓ ✓ (own students) ✓ -
Student progress - ✓ (own enrolled) - -
Announcements ✓ (course-level) ✓ ✓ ✓
Messages ✓ ✓ (own thread) - ✓ (own)
Restrictions
Cannot access admin panel
Cannot manage other teachers' content
Cannot view revenue/payment data
Cannot manage institute settings
Cannot delete published courses with active enrollments
2.5 Admin
Who: The institute owner or designated manager who controls the entire institute environment.

Allowed Pages (Admin Panel — /admin/\*)

/admin/dashboard
/admin/courses (all courses)
/admin/courses/create
/admin/courses/:id/edit
/admin/tests
/admin/quizzes
/admin/users (students, teachers, staff)
/admin/users/create
/admin/users/:id/edit
/admin/enrollments
/admin/enrollments/export
/admin/revenue
/admin/coupons
/admin/coupons/create
/admin/coupons/:id/edit
/admin/reviews
/admin/categories
/admin/teachers (teacher verification)
/admin/announcements
/admin/notifications
/admin/settings (institute settings, branding)
/admin/reports
/admin/audit-logs
CRUD Permissions (Full within own institute)
Resource Create Read Update Delete
All users (institute) ✓ ✓ ✓ ✓ (soft)
All courses ✓ ✓ ✓ ✓
All tests/quizzes ✓ ✓ ✓ ✓
All enrollments - ✓ ✓ -
Revenue data - ✓ - -
Coupons ✓ ✓ ✓ ✓
Categories ✓ ✓ ✓ ✓
Reviews - ✓ ✓ (approve/reject) ✓
Announcements ✓ ✓ ✓ ✓
Institute settings - ✓ ✓ -
Audit logs - ✓ - -
Data Visibility
Sees ONLY data belonging to their institute (tenantId scoped)
Cannot see other institutes' data
Cannot see platform-level configuration
2.6 Super Admin
Who: The platform owner/operator who manages all institutes.

Access
Full access to ALL institutes' data
Cross-tenant reporting
Institute creation and suspension
Subscription plan management
Platform-level configuration
All admin permissions across all tenants
Exclusive Permissions
Action Permission
Create new institute ✓
Suspend institute ✓
Override subscription ✓
View all institutes ✓
Cross-tenant analytics ✓
Manage subscription plans ✓
Platform announcements ✓
System health monitoring ✓
2.7 Staff, Accountant, Librarian (Extended Roles)
Staff
Read access to students, courses, enrollments
Can manage admission inquiries
Cannot manage payments or teacher data
Cannot publish/unpublish courses
Accountant
Full access to revenue, payments, coupons
Read access to enrollments
Cannot manage course content or users
Librarian
Manages digital library resources
Upload/delete documents and e-books
Cannot manage courses or users
SECTION 3: GLOBAL APPLICATION FLOW
3.1 First Website Visit (Guest)

User enters URL (e.g., myinstitute.platform.com)
│
├── Browser sends request to platform
│ └── Server reads subdomain → "myinstitute"
│ └── Tenant middleware queries DB (or Redis cache)
│ ├── Tenant found → tenant context set
│ │ ├── Tenant is active → continue
│ │ └── Tenant is suspended → show 503 page
│ └── Tenant not found → show 404 institute-not-found page
│
└── Request passes through to frontend app
└── React app boots
├── Redux store initializes
├── authSlice checks localStorage for token
│ ├── Token found → getProfile API call
│ │ ├── Success → user authenticated, redirect to dashboard
│ │ └── Failure (401) → clear tokens, show login
│ └── No token → guest state
└── Public homepage renders with institute branding
3.2 Navigation Flow

Every navigation event:
│
├── React Router intercepts link click
├── Route config checks if route requires auth
│ ├── Public route → render directly
│ └── Protected route → ProtectedRoute component checks:
│ ├── isAuthenticated = true → render component
│ └── isAuthenticated = false → redirect to /login?redirect=<path>
│
├── Role-specific routes check authorized roles:
│ ├── Role matches → render
│ └── Role mismatch → redirect to /403 or role-appropriate dashboard
│
└── Page component mounts → triggers data fetch
├── Redux thunk dispatched
├── Loading state = true → skeleton shown
├── API responds
│ ├── Success → data stored in Redux slice → UI renders
│ └── Error → error state → error UI shown
└── Loading state = false
3.3 Session Management

Token Lifecycle:
├── Access Token: JWT, 15-minute expiry, stored in localStorage
├── Refresh Token: 7-day expiry, stored in localStorage
│
├── Every API request:
│ └── Axios interceptor attaches Authorization: Bearer <accessToken>
│ + X-Tenant-Id or X-Tenant-Subdomain header
│
├── On 401 response:
│ ├── isRefreshing flag set to true
│ ├── POST /auth/refresh-token with refreshToken
│ │ ├── Success → new access token → retry original request
│ │ └── Failure → clear all tokens → redirect to /login
│ └── Concurrent requests queued until refresh completes
│
├── On 403 response:
│ └── User lacks permission → show permission denied page
│
└── Idle timeout: After 30 minutes of no API calls
└── Frontend shows "Session expiring in 5 minutes" modal
├── User clicks "Stay logged in" → silent refresh token call
└── User ignores → logout after 5 minutes
3.4 State Persistence Rules
State Persistence Storage
Auth tokens Permanent localStorage
Tenant ID Permanent localStorage
User preferences (theme) Permanent localStorage
Redux auth state Session Memory (rehydrated from localStorage on boot)
Course progress Per-session Redux + periodically synced to API
Search filters Session Redux (reset on logout)
Cart / pending enrollments Permanent localStorage
Form drafts Session Redux
3.5 Error Handling Flow

Global Error Categories:
│
├── Network Error (no response from server)
│ ├── Toast: "Network error. Please check your connection."
│ └── Retry button shown on data-fetching pages
│
├── 400 Bad Request
│ └── Toast with specific message from API response
│
├── 401 Unauthorized
│ └── Token refresh attempted → if fails → logout
│
├── 403 Forbidden
│ └── Redirect to /403 page with back button
│
├── 404 Not Found
│ └── Show 404 page with navigation options
│
├── 422 Validation Error
│ └── Field-level errors shown inline on forms
│
├── 429 Too Many Requests
│ └── Toast: "Too many requests. Please wait 15 minutes."
│
├── 500 Server Error
│ └── Toast: "Server error. Our team has been notified."
│ └── Sentry/error tracking triggered
│
└── Timeout (>30 seconds)
└── Request cancelled → Toast: "Request timed out. Please try again."
SECTION 4: FULL NAVIGATION TREE
4.1 Public Client (Student-Facing)

/ (Home)
├── /about
├── /courses
│ ├── /courses?category=<slug>
│ ├── /courses?search=<query>
│ ├── /courses?level=<level>
│ ├── /courses?price=free|paid
│ └── /courses/:slug
│ ├── Overview (default tab)
│ ├── Curriculum
│ ├── Instructor
│ └── Reviews
├── /categories
│ └── /categories/:slug (filtered courses)
├── /instructors
│ └── /instructors/:id
├── /tests
│ └── /tests/:id
├── /blog
│ └── /blog/:slug
├── /contact
├── /register
├── /login
├── /forgot-password
├── /reset-password?token=<token>
├── /verify-email?token=<token>
│
└── (Protected — requires authentication)
├── /dashboard
├── /my-courses
│ └── /my-courses/:id/learn
│ ├── /lesson/:lessonId
│ └── /quiz/:quizId
├── /tests
│ ├── /tests/:id
│ ├── /tests/:id/attempt
│ └── /tests/:id/result/:attemptId
├── /quizzes
│ ├── /quizzes/:id/attempt
│ └── /quizzes/:id/result/:attemptId
├── /certificates
│ └── /certificates/:id
├── /profile
├── /settings
│ ├── /settings/account
│ ├── /settings/notifications
│ ├── /settings/privacy
│ └── /settings/security
├── /notifications
├── /messages
│ └── /messages/:threadId
├── /leaderboard
└── /downloads
4.2 Admin Panel

/admin (redirect to /admin/dashboard)
├── /admin/login
├── /admin/dashboard
├── /admin/courses
│ ├── /admin/courses/create
│ └── /admin/courses/:id/edit
├── /admin/tests
│ └── /admin/tests/:id (view)
├── /admin/quizzes
│ └── /admin/quizzes/:id (view)
├── /admin/users
│ ├── /admin/users/create
│ └── /admin/users/:id/edit
├── /admin/enrollments
├── /admin/revenue
├── /admin/coupons
│ ├── /admin/coupons/create
│ └── /admin/coupons/:id/edit
├── /admin/reviews
├── /admin/categories
│ ├── /admin/categories/create
│ └── /admin/categories/:id/edit
├── /admin/teachers
├── /admin/announcements
├── /admin/notifications
├── /admin/reports
│ ├── /admin/reports/enrollment
│ ├── /admin/reports/revenue
│ ├── /admin/reports/students
│ └── /admin/reports/courses
├── /admin/audit-logs
└── /admin/settings
├── /admin/settings/institute
├── /admin/settings/branding
├── /admin/settings/payment
├── /admin/settings/notifications
└── /admin/settings/security
4.3 Teacher Portal

/teacher/dashboard
/teacher/courses
├── /teacher/courses/create
└── /teacher/courses/:id
├── /teacher/courses/:id/edit
├── /teacher/courses/:id/content
│ ├── /teacher/courses/:id/content/module/create
│ └── /teacher/courses/:id/content/lesson/:lessonId/edit
└── /teacher/courses/:id/students
/teacher/tests
├── /teacher/tests/create
└── /teacher/tests/:id/edit
└── /teacher/tests/:id/questions
/teacher/attendance
/teacher/results
/teacher/messages
/teacher/profile
/teacher/notifications
SECTION 5: COMPLETE USER FLOW MAPPING
5.1 New Student — First Time Complete Journey

DAY 1 — DISCOVERY
├── Student searches Google → finds institute website
├── Lands on homepage
│ └── Sees hero banner with "Browse Courses" CTA
├── Clicks "Browse Courses"
│ └── Route: /courses
│ └── API: GET /courses?page=1&limit=12
│ └── Returns: course list with pagination
│ └── UI: Course cards render with thumbnail, title, price, rating
│
├── Student clicks category filter "Web Development"
│ └── URL updates: /courses?category=web-development
│ └── API: GET /courses?category=web-development&page=1
│ └── Course list re-renders (filtered)
│
├── Student clicks a course card
│ └── Route: /courses/:slug
│ └── API: GET /courses/:id (public endpoint)
│ └── Returns: full course details, curriculum preview, instructor info, reviews
│ └── Page renders:
│ ├── Hero: thumbnail, title, short description, price, "Enroll Now" button
│ ├── Tabs: Overview | Curriculum | Instructor | Reviews
│ └── Sticky sidebar: price, enroll button, "What you'll learn"
│
├── Student reads curriculum (free preview)
│ └── First 2 lessons are unlocked (preview=true in DB)
│ └── API: GET /courses/:id/lessons?preview=true
│ └── Video player appears inline
│
├── Student clicks "Enroll Now"
│ └── isAuthenticated = false
│ └── Redirect to /login?redirect=/courses/:slug
│
DAY 1 — REGISTRATION
├── Student arrives at /login page
├── Clicks "Don't have an account? Register"
│ └── Route: /register
│
├── Registration form shown:
│ Fields: name, email, password, confirmPassword, (optional) phone
│ Validation (real-time):
│ ├── Name: min 2 chars
│ ├── Email: valid format, not already registered
│ ├── Password: min 8 chars, 1 uppercase, 1 number, 1 special char
│ └── ConfirmPassword: must match password
│
├── Student submits form
│ └── Button shows loading spinner
│ └── API: POST /auth/register
│ Payload: { name, email, password, tenantId }
│ Response: { user, tokens }
│ ├── Success path:
│ │ ├── Tokens stored in localStorage
│ │ ├── Redux auth state updated: isAuthenticated = true
│ │ ├── Email verification sent (background)
│ │ ├── Toast: "Registration successful! Please verify your email."
│ │ └── Redirect to /courses/:slug (original destination)
│ └── Error path:
│ ├── 409 Conflict: "Email already registered" → inline error on email field
│ └── 422: Field errors shown inline
│
DAY 1 — ENROLLMENT
├── Student is now authenticated on /courses/:slug
├── "Enroll Now" button is visible
├── Student clicks it
│ ├── If course is FREE:
│ │ └── API: POST /enrollments { courseId }
│ │ ├── Success → DB: Enrollment record created (status: active)
│ │ │ → DB: Student's enrollmentCount incremented
│ │ │ → DB: Course's enrollmentCount incremented
│ │ │ → Notification: "Welcome to <Course Name>!"
│ │ │ → Toast: "Enrolled successfully!"
│ │ │ → Button changes to "Start Learning →"
│ │ │ → Redirect to /my-courses/:id/learn
│ │ └── Error → Toast with error message
│ │
│ └── If course is PAID:
│ └── Payment modal opens
│ ├── Shows: course name, price, any applicable coupon input
│ ├── Student enters coupon code (optional)
│ │ └── API: POST /coupons/validate { code, courseId }
│ │ ├── Valid → discount shown, total updated
│ │ └── Invalid → "Invalid or expired coupon code"
│ ├── Student clicks "Pay ₹<amount>"
│ │ └── Payment gateway initialized (Razorpay/Stripe)
│ │ └── Payment modal opens
│ │ └── Student enters card/UPI details
│ │ ├── Payment success:
│ │ │ └── Gateway calls webhook: POST /payments/webhook
│ │ │ └── Server verifies signature
│ │ │ └── DB: Payment record created
│ │ │ └── DB: Enrollment record created
│ │ │ └── Email: payment receipt sent
│ │ │ └── Toast: "Payment successful! Welcome to the course."
│ │ │ └── Redirect to /my-courses/:id/learn
│ │ └── Payment failure:
│ │ └── Toast: "Payment failed. Please try again."
│ │ └── No enrollment created
│
DAY 1 — LEARNING
├── Student lands on Course Player: /my-courses/:id/learn
├── Page layout:
│ ├── Left sidebar: Module and lesson tree
│ ├── Center: Video player / content area
│ └── Right panel: Notes, Q&A, Resources
│
├── Student selects Lesson 1 from sidebar
│ └── API: GET /enrollments/:id/lessons/:lessonId
│ ├── Authorization check: is user enrolled?
│ ├── Returns: lesson content (video URL, text, attachments)
│ └── Video player loads
│ └── DB: LessonProgress record created (status: started, watchedAt: now)
│
├── Student watches video (progress tracking)
│ └── Every 30 seconds: API: PATCH /enrollments/:id/lessons/:lessonId/progress
│ Payload: { watchedSeconds: 120, totalSeconds: 600 }
│ └── DB: LessonProgress.watchedSeconds updated
│
├── Student completes video (watched ≥ 80%)
│ └── API: PATCH /enrollments/:id/lessons/:lessonId/complete
│ └── DB: LessonProgress.completed = true, completedAt = now
│ └── DB: Enrollment.completedLessons incremented
│ └── Progress bar in sidebar updates
│ └── Next lesson unlocks (if sequential)
│
├── Student takes notes
│ └── Notes panel: textarea, save button
│ └── API: POST /notes { enrollmentId, lessonId, content }
│ └── DB: Note record created
│ └── Notes persist across sessions
│
└── Student completes course (all lessons watched)
└── Completion check: API: GET /enrollments/:id/completion-status
├── If completion criteria met:
│ └── DB: Enrollment.status = 'completed', completedAt = now
│ └── DB: Certificate generated
│ └── Email: "Congratulations! Your certificate is ready."
│ └── Notification: certificate earned
│ └── Points/badge awarded
│ └── Leaderboard updated
└── Celebration animation shown on screen
└── "Download Certificate" button appears
SECTION 6: HOMEPAGE & PUBLIC PORTAL FLOW
6.1 Homepage Load Sequence

User arrives at homepage (/)
│
├── SSR/CSR: Page begins rendering
├── API calls fired in parallel:
│ ├── GET /courses?featured=true&limit=6 → Featured courses
│ ├── GET /categories?limit=8 → Category pills
│ ├── GET /institute/stats → Hero stats (students, courses, etc.)
│ └── GET /reviews?featured=true&limit=3 → Testimonials
│
├── Skeleton loaders shown during fetch
├── Data arrives → components render:
│ ├── Hero Section
│ │ ├── Headline + subheadline (from institute CMS)
│ │ ├── "Browse Courses" button → /courses
│ │ ├── "Login" button → /login
│ │ ├── Stats bar: X Courses | Y Students | Z Teachers | 4.8★ Rating
│ │ └── Hero image/video
│ │
│ ├── Category Pills Row
│ │ └── Each pill is clickable → /courses?category=<slug>
│ │
│ ├── Featured Courses Section
│ │ └── 6 course cards in grid
│ │ └── Each card: thumbnail, title, teacher, rating, price, "Enroll" button
│ │ └── "View All Courses" → /courses
│ │
│ ├── How It Works section (static)
│ │
│ ├── Testimonials Section
│ │ └── Student review cards (approved reviews only)
│ │
│ ├── Stats/Social Proof Banner
│ │
│ ├── Featured Teachers Section
│ │ └── Teacher profile cards → /instructors/:id
│ │
│ └── Footer
│ ├── Institute logo + description
│ ├── Quick links
│ ├── Contact information
│ ├── Social media links
│ └── Copyright
6.2 Course Browse Page Flow

/courses page loads
│
├── URL params parsed: { category, search, level, price, sort, page }
├── API: GET /courses?<params>
│ Returns: { data: courses[], pagination: { page, limit, total, pages } }
│
├── Left sidebar filters:
│ ├── Category multi-select
│ ├── Level (Beginner / Intermediate / Advanced)
│ ├── Price (Free / Paid)
│ ├── Rating (4★ and above)
│ └── Duration (< 5hr / 5-20hr / 20hr+)
│
├── Filter change → URL params update → API refetch
│ (Debounced 300ms for search input)
│
├── Top bar sort:
│ ├── Newest First (default)
│ ├── Most Popular
│ ├── Highest Rated
│ └── Price: Low to High / High to Low
│
├── Course cards: 12 per page
│ └── "Load More" or pagination at bottom
│
└── Empty state (no results):
└── "No courses found for '<search>'"
└── "Clear filters" button
└── "Browse all courses" link
6.3 Contact Form Flow

User navigates to /contact
│
├── Form fields:
│ ├── Name (required)
│ ├── Email (required, validated)
│ ├── Phone (optional)
│ ├── Subject (dropdown: Admission | Technical | Fee | Other)
│ └── Message (required, min 20 chars)
│
├── Real-time validation on blur
│
├── Submit:
│ └── API: POST /contact { name, email, phone, subject, message, tenantId }
│ ├── Success:
│ │ └── DB: ContactInquiry record created
│ │ └── Email: Auto-reply to user: "We received your inquiry"
│ │ └── Email: Admin notified of new inquiry
│ │ └── Toast: "Message sent successfully!"
│ │ └── Form clears
│ └── Error:
│ └── Toast: "Failed to send. Please try again."
│
└── Rate limit: 3 submissions per email per hour
└── 429 response → Toast: "Too many requests. Please try again later."
SECTION 7: AUTHENTICATION FLOW
7.1 Registration Flow

User navigates to /register
│
├── Form renders:
│ ├── Full Name
│ ├── Email
│ ├── Phone (optional)
│ ├── Password (with strength meter)
│ └── Confirm Password
│
├── Real-time password strength indicator:
│ ├── Red: < 8 chars
│ ├── Orange: has length but missing complexity
│ └── Green: strong (length + uppercase + number + special)
│
├── On blur email field:
│ └── API: GET /auth/check-email?email=<email>
│ ├── Available → green checkmark
│ └── Taken → "This email is already registered"
│
├── Submit (all validations pass):
│ └── API: POST /auth/register
│ Payload: {
│ name, email, password, phone,
│ tenantId (from X-Tenant-Id header or localStorage)
│ }
│ ├── Server: hash password (bcrypt, rounds=12)
│ ├── Server: create User document
│ ├── Server: generate email verification token
│ ├── Server: send verification email (queue)
│ ├── Server: generate access + refresh tokens
│ └── Response: { user, tokens: { accessToken, refreshToken } }
│
├── Frontend:
│ ├── Store tokens in localStorage
│ ├── Store tenantId in localStorage
│ ├── Redux: isAuthenticated = true, user = <user>
│ ├── Toast: "Account created! Please verify your email."
│ └── Redirect to /dashboard (or original redirect destination)
│
└── Email Verification:
├── Email arrives with link: /verify-email?token=<jwt>
├── User clicks link
├── API: POST /auth/verify-email { token }
├── DB: User.isEmailVerified = true
├── Toast: "Email verified successfully!"
└── Redirect to /dashboard
7.2 Login Flow

User navigates to /login
│
├── Form: Email + Password
├── "Forgot Password?" link
├── "Remember me" checkbox (extends session to 30 days)
│
├── Submit:
│ └── API: POST /auth/login
│ Payload: { email, password, tenantId }
│ │
│ ├── Rate limiting check:
│ │ └── 5 failed attempts → account locked 15 minutes
│ │
│ ├── User lookup (global, by email + tenantId)
│ ├── Password comparison (bcrypt.compare)
│ ├── Account active check
│ ├── MFA check: if mfaEnabled = true
│ │ └── Response: { requiresMfa: true, userId }
│ │ └── Frontend shows OTP input screen
│ │ └── API: POST /auth/verify-mfa { userId, token }
│ │ └── TOTP verified → proceed to token generation
│ │
│ ├── Token generation:
│ │ ├── Access token: JWT (userId, role, tenantId), 15-min expiry
│ │ └── Refresh token: opaque, 7-day expiry, hashed in DB
│ │
│ └── Response: { user, tokens }
│
├── Frontend success:
│ ├── Store tokens in localStorage
│ ├── Redux: auth state updated
│ └── Redirect based on role:
│ ├── student → /dashboard
│ ├── teacher → /teacher/dashboard
│ ├── admin → /admin/dashboard
│ └── super_admin → /admin/dashboard (or /platform/dashboard)
│
└── Frontend error:
├── 401 → "Invalid email or password"
├── 423 → "Account locked. Try again in 15 minutes."
└── 403 → "Account deactivated. Contact support."
7.3 Forgot Password Flow

User clicks "Forgot Password?"
│
├── Route: /forgot-password
├── Form: Email field only
│
├── Submit:
│ └── API: POST /auth/forgot-password { email, tenantId }
│ └── Server: regardless of whether email exists, respond with success
│ (prevents email enumeration attack)
│ └── If email exists in DB:
│ ├── Generate password reset token (JWT, 1-hour expiry)
│ ├── Store hashed token in DB: User.resetPasswordToken
│ └── Send email with reset link: /reset-password?token=<token>
│ └── Toast: "If that email is registered, you'll receive a reset link."
│
├── User clicks link in email → /reset-password?token=<token>
├── Form: New Password + Confirm Password
│
├── Submit:
│ └── API: POST /auth/reset-password { token, password }
│ ├── Server: verify JWT token validity
│ ├── Server: check token not expired
│ ├── Server: hash new password
│ ├── Server: clear resetPasswordToken from DB
│ ├── Server: invalidate all existing refresh tokens
│ ├── DB: User.password updated, User.refreshTokens = []
│ └── Response: success
│
├── Frontend:
│ └── Toast: "Password reset successfully. Please login."
│ └── Redirect to /login
│
└── Error cases:
├── Token expired → "Reset link expired. Request a new one."
└── Token invalid → "Invalid reset link."
7.4 Social Auth (Google OAuth) Flow

User clicks "Continue with Google"
│
├── Browser redirects to Google consent screen
├── User approves access
├── Google redirects to: /auth/google/callback?code=<code>
│
├── Server receives code
│ └── Exchange code for Google access token
│ └── Fetch user profile from Google API
│ └── Find or create user:
│ ├── User exists with this Google ID → login
│ ├── User exists with same email → link Google account
│ └── New user → create account (role: student)
│ └── Generate platform tokens
│ └── Store refresh token in DB
│
└── Redirect to frontend with tokens in URL params
└── /auth/callback?accessToken=<>&refreshToken=<>
└── Frontend extracts tokens, stores in localStorage
└── Clears URL params (security)
└── Redirect to /dashboard
SECTION 8: STUDENT PORTAL FLOW
8.1 Student Dashboard

Student navigates to /dashboard
│
├── API calls (parallel):
│ ├── GET /student/dashboard → { enrollments, progress, upcoming, achievements }
│ ├── GET /notifications?limit=5&unread=true
│ └── GET /student/streak
│
├── Page sections:
│
├── 1. Welcome Header
│ └── "Good morning, <name>!" + date
│ └── Current streak badge: "🔥 5-day streak!"
│
├── 2. Stats Row
│ ├── Courses enrolled
│ ├── Lessons completed
│ ├── Tests taken
│ └── Certificates earned
│
├── 3. Continue Learning Section
│ └── Shows 3 most recently accessed courses
│ └── Each card: thumbnail, progress bar (%), "Continue" button
│ └── Click "Continue" → /my-courses/:id/learn?lesson=<lastLesson>
│
├── 4. Upcoming / Recommended Tests
│ └── "Take Now" button → /tests/:id/attempt
│
├── 5. Recent Achievements
│ └── Badges earned recently with animation
│
├── 6. Announcements
│ └── Latest 2 announcements from institute
│ └── "View All" → /notifications
│
└── Empty state (brand new student, no enrollments):
└── "Start your learning journey!"
└── "Browse Courses" CTA
8.2 Course Player Flow

Student navigates to /my-courses/:id/learn
│
├── Authorization check:
│ └── API: GET /enrollments/check/:courseId
│ ├── Enrolled → continue
│ └── Not enrolled → redirect to /courses/:id with "Enroll First" message
│
├── Page loads (3-column layout):
│ ├── LEFT: Lesson sidebar (collapsible)
│ │ └── Modules accordion → Lessons within each module
│ │ └── Lesson status icons: ○ Not started | ⟳ In progress | ✓ Completed
│ │ └── Lock icon (🔒) for locked lessons (if sequential mode)
│ │
│ ├── CENTER: Content area
│ │ └── Video player / PDF viewer / Text content
│ │
│ └── RIGHT: Tabs panel
│ ├── Notes tab
│ ├── Q&A tab
│ └── Resources tab
│
├── Selecting a lesson:
│ └── Click lesson in sidebar
│ └── URL updates: /my-courses/:id/learn?lesson=<lessonId>
│ └── API: GET /courses/:courseId/lessons/:lessonId
│ └── Content area updates:
│ ├── Video: loads video URL (YouTube embed or Cloudinary HLS)
│ ├── PDF: renders PDF viewer
│ └── Text: renders markdown/HTML content
│
├── Video playback events:
│ ├── play → API: PATCH /progress/:lessonId/start
│ ├── pause → API: PATCH /progress/:lessonId/heartbeat { seconds }
│ ├── seeked → API: PATCH /progress/:lessonId/heartbeat { seconds }
│ ├── ended → API: PATCH /progress/:lessonId/complete
│ │ └── DB: LessonProgress.completed = true
│ │ └── Next lesson auto-highlight in sidebar
│ │ └── If last lesson in module → module completion notification
│ └── timeupdate (every 30s) → sync progress
│
├── Notes flow:
│ ├── Student types in notes textarea
│ ├── "Save Note" button or Ctrl+S
│ ├── API: POST /notes { lessonId, content, timestamp (video time) }
│ ├── DB: Note created with video timestamp
│ └── Notes list below textarea shows saved notes with timestamps
│ └── Click timestamp → video seeks to that point
│
├── Q&A flow:
│ ├── Student types question
│ ├── API: POST /discussions { lessonId, content }
│ ├── DB: Discussion created
│ ├── Teacher notified
│ └── Replies thread appears below question
│
├── Resources tab:
│ └── API: GET /lessons/:id/resources
│ └── Downloadable files list
│ └── Click download → API: GET /resources/:id/download
│ └── Signed URL generated → file downloaded
│
└── Course completion:
├── All lessons completed check
├── Minimum watch percentage met (e.g., 80%)
├── API: POST /enrollments/:id/complete
├── DB: Enrollment.status = 'completed'
├── DB: Certificate.generate()
├── Email: "Congratulations!" with certificate
└── Celebration modal with "Download Certificate" button
8.3 Test Attempt Flow

Student navigates to /tests/:id
│
├── API: GET /tests/:id (public test info)
├── Test detail page:
│ ├── Title, description, duration, total marks
│ ├── Number of questions, sections
│ ├── Rules and instructions
│ └── "Start Test" button
│
├── Eligibility check (on "Start Test" click):
│ └── API: GET /tests/:id/eligibility
│ ├── Not enrolled in required course → "Enroll in course first"
│ ├── Already attempted + no re-attempts left → "View Result"
│ ├── Within allowed time window → proceed
│ └── Eligible → confirm dialog
│
├── Confirm dialog: "Are you sure you want to start? Timer will begin."
│ └── "Yes, Start" → initialize attempt
│ └── API: POST /test-attempts { testId }
│ └── DB: TestAttempt created (status: in-progress, startedAt: now)
│ └── Returns: { attemptId, questions (shuffled if configured), timeLimit }
│
├── Exam interface loads:
│ ├── TOP: Timer countdown (MM:SS format, red when < 5 min)
│ ├── TOP: Question palette (circles: grey=unattempted, green=answered, orange=marked)
│ ├── MAIN: Question text + options
│ └── BOTTOM: Previous | Save & Next | Mark for Review | End Test
│
├── Answering a question:
│ ├── Student selects option
│ ├── State update: answer saved locally (Redux)
│ ├── API: PATCH /test-attempts/:id/answers { questionId, answer }
│ │ (auto-save every selection, no need for manual save)
│ └── Question palette updates: grey → green
│
├── "Mark for Review":
│ └── Question marked: grey/green → orange
│ └── Can still answer, but flagged for review
│
├── Section navigation (if multi-section):
│ └── Section tabs at top
│ └── Moving to next section: confirmation if unanswered questions
│
├── Timer events:
│ ├── 10 minutes left → Toast warning: "10 minutes remaining!"
│ ├── 5 minutes left → Timer turns red + banner warning
│ └── Timer reaches 0:
│ └── API: POST /test-attempts/:id/submit (auto-submit)
│ └── DB: TestAttempt.status = 'completed', submittedAt = now
│ └── Server evaluates answers (for objective type)
│ └── Redirect to result page
│
├── Manual submission:
│ └── "End Test" button clicked
│ └── Confirmation modal:
│ ├── Shows: X answered, Y unanswered, Z marked
│ └── "Submit Test" / "Continue Answering"
│ └── On confirm: API: POST /test-attempts/:id/submit
│ └── Same flow as auto-submit
│
└── Result page: /tests/:id/result/:attemptId
├── API: GET /test-attempts/:id/result
├── Displays: total score, percentage, correct/incorrect/unattempted counts
├── Section-wise breakdown
├── Rank (if competitive mode)
├── Pass/Fail status
├── "View Detailed Analysis" → question-by-question review
│ ├── Student's answer highlighted
│ ├── Correct answer highlighted
│ └── Explanation shown (if configured)
└── Share result button
8.4 Certificate Flow

/certificates page
│
├── API: GET /certificates (student's earned certificates)
├── Grid of certificate cards:
│ ├── Course thumbnail
│ ├── Certificate ID
│ ├── Date earned
│ └── "View" + "Download" buttons
│
├── View: /certificates/:id
│ └── API: GET /certificates/:id
│ └── Certificate rendered (HTML template with institute branding)
│ └── Fields: student name, course name, completion date, certificate ID, signatures
│ └── QR code for verification
│
├── Download:
│ └── API: GET /certificates/:id/download
│ └── Server generates PDF (Puppeteer)
│ └── Returns PDF blob → browser downloads file
│
└── Share:
└── LinkedIn share button
└── Copy verification URL
└── Social share buttons
SECTION 9: TEACHER PORTAL FLOW
9.1 Teacher Dashboard

/teacher/dashboard
│
├── API calls (parallel):
│ ├── GET /teacher/stats → { totalCourses, totalStudents, totalRevenue, avgRating }
│ ├── GET /teacher/courses?limit=5
│ └── GET /teacher/recent-activity
│
├── Stats row:
│ ├── Total courses published
│ ├── Total enrolled students
│ ├── Total revenue earned (if revenue sharing enabled)
│ └── Average rating across courses
│
├── My Courses section:
│ └── Course cards: title, enrollment count, status badge, "Manage" button
│
├── Recent Activity:
│ └── New enrollments, new reviews, new Q&A questions
│
└── Quick Actions:
├── "Create Course" → /teacher/courses/create
├── "Create Test" → /teacher/tests/create
└── "View Messages" → /teacher/messages
9.2 Course Creation Flow (Teacher)

Teacher clicks "Create Course"
│
├── Route: /teacher/courses/create
├── Multi-step form (Step 1 of 4):
│
├── STEP 1: Basic Info
│ ├── Course Title (required, min 10 chars)
│ ├── Short Description (required, max 160 chars, shown in cards)
│ ├── Full Description (rich text editor)
│ ├── Category (dropdown from categories API)
│ ├── Sub-category
│ ├── Language
│ └── Level: Beginner | Intermediate | Advanced
│ └── "Next" → validates step → proceeds
│
├── STEP 2: Pricing & Access
│ ├── Price Type: Free | Paid
│ ├── If Paid: Price field (₹)
│ ├── Discount Price (optional, shows strike-through on original)
│ ├── Enrollment Limit (optional: max students)
│ └── Access Duration: Lifetime | 30 days | 90 days | 1 year
│
├── STEP 3: Course Thumbnail & Media
│ ├── Thumbnail Upload:
│ │ └── Drag & drop or click to upload
│ │ └── Accepted: JPG, PNG, WebP (max 2MB)
│ │ └── Preview shown
│ │ └── API: POST /upload/image (multipart)
│ │ └── Returns: { url, publicId }
│ ├── Promo Video URL (optional: YouTube or upload)
│ └── Certificate template selection
│
├── STEP 4: Review & Publish
│ ├── Summary of all entered data
│ ├── "Save as Draft" → API: POST /courses { ...data, status: 'draft' }
│ │ └── DB: Course created, status: draft
│ │ └── Redirect to /teacher/courses/:id/content
│ └── "Submit for Review" (if admin approval required)
│ └── API: POST /courses { ...data, status: 'pending_review' }
│ └── Admin notified for review
│ └── Toast: "Course submitted for review."
│
└── After course created → Content Builder:
/teacher/courses/:id/content
│
├── Module management:
│ ├── "Add Module" button
│ │ └── Inline form: Module title
│ │ └── API: POST /courses/:id/modules { title, order }
│ │ └── Module appears in tree
│ └── Drag-and-drop reorder modules
│ └── API: PATCH /courses/:id/modules/reorder { moduleIds: [...] }
│
└── Lesson management (within module):
├── "Add Lesson" button in module
├── Lesson editor sidebar opens:
│ ├── Lesson Title
│ ├── Content Type: Video | Document | Text | Quiz
│ ├── If Video:
│ │ ├── YouTube URL
│ │ └── OR: Upload video file
│ │ └── API: POST /upload/video (multipart, chunked)
│ │ └── Progress bar during upload
│ │ └── Returns: { videoUrl, duration }
│ ├── Is Preview? (free preview toggle)
│ ├── Duration (auto-detected for video)
│ └── Resources: drag-drop file attachments
│
├── API: POST /courses/:courseId/modules/:moduleId/lessons { ...lessonData }
├── DB: Lesson created, linked to module
└── Lesson appears in module tree
9.3 Test Creation Flow (Teacher)

Teacher navigates to /teacher/tests/create
│
├── STEP 1: Test Info
│ ├── Title
│ ├── Description
│ ├── Course association (optional)
│ ├── Category/Subject
│ ├── Difficulty: Easy | Medium | Hard
│ └── Instructions (rich text)
│
├── STEP 2: Settings
│ ├── Duration (minutes)
│ ├── Total Marks
│ ├── Pass Percentage
│ ├── Negative Marking: Yes/No (if yes: marks per wrong answer)
│ ├── Question Shuffle: Yes/No
│ ├── Show Result: Immediately | After deadline | Manual
│ ├── Max Attempts: 1 / 2 / 3 / Unlimited
│ ├── Available From (date/time)
│ └── Available Until (date/time, optional)
│
├── STEP 3: Questions
│ ├── Question Bank toolbar:
│ │ ├── Add New Question
│ │ ├── Import from Question Bank
│ │ └── Import from CSV
│ │
│ ├── Add Question form:
│ │ ├── Question Type:
│ │ │ ├── Single Correct MCQ
│ │ │ ├── Multiple Correct MCQ
│ │ │ ├── True/False
│ │ │ ├── Fill in the Blank
│ │ │ ├── Short Answer (manual grading)
│ │ │ └── Essay (manual grading)
│ │ ├── Question Text (rich text, supports images, math equations)
│ │ ├── Options (for MCQ): Add up to 6 options
│ │ │ └── Mark correct option(s)
│ │ ├── Marks for correct
│ │ ├── Negative marks (pre-filled from test setting)
│ │ └── Explanation (shown after result)
│ │
│ └── Question list: draggable, editable, deletable
│
├── STEP 4: Sections (optional)
│ └── Group questions into sections (e.g., Section A: Maths, Section B: English)
│ └── Each section: title, marks, time limit (optional)
│
└── Publish:
├── "Save Draft" → API: POST /tests { ...data, status: 'draft' }
└── "Publish" → API: POST /tests { ...data, status: 'published' }
└── DB: Test created
└── Students notified (if associated with course)
└── Toast: "Test published successfully!"
9.4 Attendance Marking Flow

Teacher navigates to /teacher/attendance
│
├── Selects:
│ ├── Course (dropdown — teacher's courses)
│ └── Date (date picker, defaults to today)
│
├── API: GET /attendance?courseId=<id>&date=<date>
│ └── Returns: enrolled students list + existing attendance (if already marked)
│
├── Student list renders:
│ ├── Each row: student avatar, name, roll number
│ └── Toggle buttons: Present | Absent | Late | Leave
│
├── Bulk actions:
│ ├── "Mark All Present" → all toggle to Present
│ └── "Mark All Absent" → all toggle to Absent
│
├── "Save Attendance" button:
│ └── API: POST /attendance {
│ courseId, date,
│ records: [{ studentId, status }]
│ }
│ ├── DB: Attendance records upserted
│ ├── Absent students notified (optional, configurable)
│ └── Toast: "Attendance saved for <date>"
│
├── Attendance already marked indicator:
│ └── "Attendance already marked for this date. Edit?"
│ └── "Edit" → same form, pre-filled with existing data
│
└── History view:
└── Calendar heatmap of attendance for the month
└── Student-wise attendance percentage
SECTION 10: PARENT PORTAL FLOW
10.1 Parent Account Setup

Parent creates account:
├── /register?role=parent
├── Additional field: "Student ID / Roll Number" of child
├── API: POST /auth/register { ...userData, role: 'parent', childId }
│ └── Server validates childId exists in same institute
│ └── If valid: creates parent-child link
│ └── If invalid: "No student found with that ID"
│
└── Post-registration: parent sees child's dashboard
10.2 Parent Dashboard Flow

/parent/dashboard
│
├── Child selector (if multiple children): dropdown
│
├── Overview cards:
│ ├── Today's Attendance: Present / Absent / Late
│ ├── Overall Attendance %
│ ├── Courses enrolled
│ └── Latest test score
│
├── Recent Activity:
│ └── Child's last 5 actions (lesson completed, test taken, etc.)
│
├── Upcoming tests
│
├── Fee Status:
│ ├── Pending dues
│ └── "Pay Now" button → payment flow
│
└── Messages:
└── Unread messages from teachers
└── "Message Teacher" → compose
10.3 Parent Fee Payment Flow

Parent clicks "Pay Fee"
│
├── Fee breakdown shown:
│ ├── Course fee
│ ├── Pending installments
│ └── Late fee (if any)
│
├── Payment methods: Card | UPI | Net Banking | Wallet
│
├── Payment gateway initialized
│
├── On success:
│ └── DB: Payment record, fee_status = 'paid'
│ └── Email: Receipt to parent
│ └── Email: Confirmation to institute admin
│ └── Toast: "Payment successful"
│ └── PDF receipt downloadable
│
└── On failure:
└── Retry option
└── Contact support link
SECTION 11: ADMIN PANEL FLOW
11.1 Admin Login & First Time Setup

Admin navigates to admin panel URL
│
├── If not logged in → /admin/login
├── Login form: Email + Password
├── API: POST /auth/login { email, password, tenantId }
│ └── tenantId resolved from:
│ ├── Subdomain (admin.myinstitute.platform.com)
│ └── localStorage adminTenantId (fallback)
│
├── On success:
│ ├── Tokens stored in localStorage
│ ├── adminTenantId stored in localStorage
│ └── Redirect to /admin/dashboard
│
└── First-time setup wizard (if institute newly created):
├── Step 1: Upload institute logo
├── Step 2: Set brand colors (primary, secondary)
├── Step 3: Add categories
├── Step 4: Create first teacher account
└── Step 5: Create first course → /admin/courses/create
11.2 Admin Dashboard Flow

/admin/dashboard
│
├── API: GET /admin/dashboard
│ Returns: {
│ overview: { totalUsers, totalCourses, totalEnrollments, totalTests },
│ revenue: { total, thisMonth, growth },
│ growth: { users, enrollments },
│ roleDistribution: { admin, teacher, student },
│ monthlyTrends: [{ _id: { year, month }, count, revenue }],
│ recent: { users, enrollments }
│ }
│
├── Cached in Redis (5-minute TTL to avoid DB hammering)
│
├── Stats cards row:
│ ├── Total Users (with growth %)
│ ├── Total Courses
│ ├── Total Enrollments (with growth %)
│ └── Total Tests
│
├── Revenue section:
│ ├── Total Revenue (lifetime)
│ ├── This Month Revenue
│ ├── Revenue Growth %
│ └── Line/Bar chart (monthly trend)
│
├── Role distribution pie chart
│ └── Admin | Teacher | Student breakdown
│
├── Recent Signups table:
│ └── Name | Email | Role | Joined
│
├── Recent Enrollments table:
│ └── Student | Course | Date | Status
│
└── Quick action buttons:
├── "Add User" → /admin/users/create
├── "Add Course" → /admin/courses/create
├── "Send Announcement" → announcement modal
└── "Export Report" → /admin/reports
11.3 Course Management Flow (Admin)

/admin/courses
│
├── API: GET /admin/courses?page=1&limit=10
│ Returns: { data: courses[], pagination }
│
├── Filters toolbar:
│ ├── Search (title)
│ ├── Status filter: All | Published | Draft | Pending
│ ├── Category filter
│ └── Teacher filter
│
├── Courses table columns:
│ Thumbnail | Title | Teacher | Category | Price | Enrolled | Status | Actions
│
├── Actions per course:
│ ├── Edit (pencil icon)
│ │ └── /admin/courses/:id/edit
│ │ └── Same form as course creation (prefilled)
│ │
│ ├── Publish/Unpublish toggle
│ │ └── Confirmation dialog: "Are you sure you want to unpublish this course?"
│ │ └── API: PATCH /courses/:id/publish
│ │ └── DB: Course.isPublished toggled
│ │ └── Toast: "Course published/unpublished"
│ │
│ ├── Featured toggle
│ │ └── API: PATCH /admin/courses/:id/featured
│ │ └── DB: Course.isFeatured toggled
│ │ └── Featured courses appear on homepage
│ │
│ └── Delete
│ └── Confirmation: "This will permanently delete the course and all enrollments."
│ └── If active enrollments exist: "Cannot delete — X students enrolled."
│ └── API: DELETE /admin/courses/:id
│ └── DB: Soft delete (Course.deletedAt = now)
│ └── All associated lessons, tests moved to archived state
│
├── Bulk actions:
│ ├── Select all checkbox
│ ├── Bulk publish
│ ├── Bulk unpublish
│ └── Bulk delete (with double confirmation)
│
└── Pagination: 10 per page, page selector
11.4 User Management Flow (Admin)

/admin/users
│
├── API: GET /admin/users?page=1&limit=10
├── Filter bar: Search | Role | Status | Date Range
│
├── Table: Avatar | Name | Email | Role | Status | Joined | Actions
│
├── "Create User" button:
│ └── Modal or /admin/users/create form:
│ ├── Full Name (required)
│ ├── Email (required, unique check)
│ ├── Password (auto-generated or manual)
│ ├── Role: student | teacher | staff
│ ├── Send welcome email toggle
│ └── Submit:
│ └── API: POST /admin/users { ...userData, tenantId }
│ └── DB: User created with tenantId
│ └── If welcome email: send email with credentials
│ └── Toast: "User created successfully"
│
├── Edit User:
│ └── /admin/users/:id/edit
│ └── Form prefilled with user data
│ └── Can change: name, role, status (active/inactive)
│ └── Cannot change: email (PII), password (separate flow)
│ └── API: PUT /admin/users/:id { name, role, isActive }
│ └── DB: User updated
│ └── If Redis cache exists for this user → invalidated
│
├── Deactivate User:
│ └── Toggle in user row
│ └── Confirmation modal
│ └── API: PATCH /admin/users/:id/status { isActive: false }
│ └── DB: User.isActive = false
│ └── User's active sessions invalidated (refresh tokens cleared)
│ └── Toast: "User deactivated"
│
└── Delete User:
└── Soft delete only (data preserved for audit)
└── Double confirmation required
└── API: DELETE /admin/users/:id
└── DB: User.deletedAt = now, isActive = false
└── All their enrollments preserved (historical data)
11.5 Enrollment Management Flow

/admin/enrollments
│
├── API: GET /admin/enrollments?page=1&limit=20
├── Returns: { data: enrollments[], pagination }
│ Each enrollment: { student, course, enrolledAt, status, paymentStatus }
│
├── Filters: Student name | Course | Status | Date Range | Payment Status
│
├── Table: Student | Course | Enrolled Date | Status | Payment | Actions
│
├── Status badges:
│ ├── active (green)
│ ├── completed (blue)
│ ├── expired (grey)
│ └── cancelled (red)
│
├── Actions:
│ ├── View Details → enrollment detail modal
│ │ └── Full enrollment info, progress %, lessons completed
│ └── Cancel Enrollment:
│ └── Confirmation modal
│ └── API: PATCH /admin/enrollments/:id/cancel
│ └── DB: Enrollment.status = 'cancelled'
│ └── No automatic refund (manual refund required)
│
└── Export button:
└── API: GET /admin/enrollments/export?<filters>
└── Returns CSV blob
└── Browser downloads: enrollments\_<date>.csv
└── Columns: Student Name, Email, Course, Enrolled Date, Status, Amount Paid
11.6 Coupon Management Flow (Admin)

/admin/coupons
│
├── API: GET /admin/coupons?page=1&limit=10
├── Returns: { data: coupons[], pagination }
│
├── Table: Code | Discount | Type | Usage | Limit | Expiry | Status | Actions
│
├── "Create Coupon" button:
│ └── /admin/coupons/create form:
│ ├── Coupon Code (uppercase, alphanumeric, e.g., SAVE20)
│ │ └── Auto-generate button
│ ├── Discount Type: Percentage | Fixed Amount
│ ├── Discount Value (%) or Fixed Amount (₹)
│ ├── Minimum Order Amount (optional)
│ ├── Maximum Discount Amount (for % coupons, optional cap)
│ ├── Usage Limit (total uses allowed, e.g., 100)
│ ├── Per User Limit (uses per user, e.g., 1)
│ ├── Applicable Courses: All | Specific courses (multi-select)
│ ├── Valid From (date)
│ ├── Valid Until (date, optional)
│ └── Active toggle
│
├── Validation:
│ ├── Code must be unique within institute
│ ├── % discount must be 1-100
│ ├── Expiry must be future date
│ └── Usage limit must be positive integer
│
├── Submit:
│ └── API: POST /admin/coupons { ...couponData, tenantId }
│ └── DB: Coupon created with tenantId
│ └── Toast: "Coupon SAVE20 created"
│
├── Edit Coupon:
│ └── /admin/coupons/:id/edit (same form, prefilled)
│ └── API: PUT /admin/coupons/:id { ...changes }
│ └── DB: Coupon updated
│
├── Delete Coupon:
│ └── Confirmation modal
│ └── If coupon has been used: "This coupon has X uses. Deleting won't affect past purchases."
│ └── API: DELETE /admin/coupons/:id
│ └── DB: Soft delete (coupon preserved for audit, isActive = false)
│
└── Coupon stats:
└── Total uses, total discount given, revenue impact
11.7 Revenue Dashboard Flow

/admin/revenue
│
├── API: GET /admin/revenue?period=<period>
│ Returns: {
│ overview: { totalRevenue, avgOrderValue, totalOrders },
│ periods: { thisMonth, lastMonth, monthlyGrowth },
│ dailyRevenue: [{ _id: 'YYYY-MM-DD', revenue, orders }],
│ topCourses: [{ course, revenue, enrollments }]
│ }
│
├── Filter: Last 7 days | Last 30 days | Last 3 months | Last year | Custom range
│
├── Overview cards:
│ ├── Total Revenue (₹)
│ ├── This Month Revenue
│ ├── Average Order Value
│ └── Total Orders
│
├── Revenue chart:
│ └── Line chart — daily revenue over selected period
│ └── Hover tooltip: exact amount + orders for that day
│
├── Top Courses by Revenue:
│ └── Table: Course | Enrollments | Revenue | Avg Price
│
└── Export:
└── "Download Report" → PDF or CSV
└── API: GET /admin/revenue/export
11.8 Reviews Management Flow

/admin/reviews
│
├── API: GET /admin/reviews?page=1&limit=20
│
├── Filters: Course | Status (pending/approved/rejected) | Rating | Date
│
├── Table: Student | Course | Rating | Review Text | Date | Status | Actions
│
├── Actions per review:
│ ├── Approve:
│ │ └── API: PATCH /admin/reviews/:id/toggle-approval
│ │ └── DB: Review.isApproved = true
│ │ └── Review now visible on course page
│ │ └── Toast: "Review approved"
│ │
│ ├── Reject (toggle back):
│ │ └── API: PATCH /admin/reviews/:id/toggle-approval
│ │ └── DB: Review.isApproved = false
│ │ └── Review hidden from course page
│ │
│ └── Delete:
│ └── API: DELETE /admin/reviews/:id
│ └── DB: Review.deletedAt = now (soft delete)
│ └── Course.avgRating recalculated
│
└── Bulk actions:
├── Select multiple reviews
├── Bulk approve
└── Bulk delete → API: POST /admin/reviews/bulk-delete { ids: [...] }
11.9 Announcement System Flow

Admin clicks "Send Announcement"
│
├── Modal opens:
│ ├── Title (required)
│ ├── Message (required, rich text)
│ ├── Target audience: All Students | Specific Course | All Teachers | All Users
│ ├── Channels: In-App ✓ | Email ✓ | SMS □
│ ├── Schedule: Send Now | Schedule for later (date/time picker)
│ └── Preview button
│
├── Submit:
│ └── API: POST /admin/announcements {
│ title, message, targetAudience,
│ channels, scheduledAt (null = immediate)
│ }
│ │
│ ├── If immediate:
│ │ └── DB: Announcement created
│ │ └── Notification queue: create in-app notifications for all target users
│ │ └── Email queue: send emails to target users (batch processing)
│ │ └── Toast: "Announcement sent to X users"
│ │
│ └── If scheduled:
│ └── DB: Announcement created with scheduledAt
│ └── Cron job: triggers at scheduledAt time
│ └── Toast: "Announcement scheduled for <datetime>"
│
└── Announcements list page:
└── Shows all announcements with: title, target, sent date, reach count
└── Can delete scheduled (before trigger time)
└── Cannot delete already-sent announcements (audit trail)
11.10 Teacher Verification Flow

/admin/teachers
│
├── API: GET /admin/teachers?page=1&limit=10
├── Shows all teachers in institute: Name | Email | Courses | Verified | Actions
│
├── Verification toggle:
│ └── Unverified teacher: orange badge "Pending"
│ └── Admin clicks "Verify":
│ └── Confirmation: "Verify Rajesh Kumar as a teacher?"
│ └── API: PATCH /admin/teachers/:id/verify
│ └── DB: User.teacherProfile.isVerified = true
│ └── Teacher notified: "Your account has been verified!"
│ └── Toast: "Teacher verified"
│
└── Unverified teachers restrictions:
└── Can create courses (drafts only)
└── Cannot publish courses until verified
└── Cannot appear in instructor directory
SECTION 12: SUPER ADMIN PANEL FLOW
12.1 Super Admin Dashboard

Super Admin logs in at platform-level admin
│
├── Cross-institute stats:
│ ├── Total institutes: X
│ ├── Total users across all institutes: Y
│ ├── Monthly Recurring Revenue (MRR): ₹Z
│ ├── Active subscriptions: N
│ └── Churned institutes this month: M
│
├── Institute list table:
│ Institute Name | Subdomain | Plan | Status | Students | Revenue | Actions
│
├── Actions per institute:
│ ├── View → enter institute admin panel (as super admin)
│ ├── Suspend → API: PATCH /super-admin/institutes/:id/suspend
│ │ └── DB: Institute.isActive = false, subscription.status = 'suspended'
│ │ └── All users of this institute receive "Institute suspended" message
│ ├── Edit subscription
│ └── Delete institute (rare, requires double confirmation)
│
└── Platform settings:
├── Subscription plan management
├── Platform announcements
├── System health metrics
└── Audit logs (all institutes)
12.2 Institute Creation (Super Admin)

Super Admin creates a new institute
│
├── /super-admin/institutes/create form:
│ ├── Institute Name
│ ├── Subdomain (validated: lowercase, alphanumeric, unique)
│ ├── Admin Name (becomes the institute admin user)
│ ├── Admin Email
│ ├── Admin Password
│ ├── Subscription Plan
│ └── Expiry Date
│
├── Submit:
│ └── API: POST /super-admin/institutes
│ └── Server (atomic transaction):
│ ├── Create Institute document
│ ├── Create Admin User (role: 'admin', tenantId: institute.\_id)
│ ├── Create SubscriptionPlan record
│ └── Send welcome email to admin with login credentials
│ └── Toast: "Institute created. Admin credentials sent to <email>."
│
└── Admin can now log in and set up their institute
SECTION 13: ADVANCED MODULES
13.1 AI Quiz Generator

Teacher clicks "Generate Quiz with AI"
│
├── Input form:
│ ├── Topic / Subject
│ ├── Number of questions (5-50)
│ ├── Difficulty: Easy | Medium | Hard | Mixed
│ ├── Question types: MCQ | True/False | Fill in blank
│ └── Source material upload (optional PDF)
│
├── API: POST /ai/generate-quiz { topic, count, difficulty, types }
│ └── Server sends prompt to AI API (OpenAI/Anthropic)
│ └── Streams response (SSE or WebSocket)
│ └── Questions appear one by one as they generate
│
├── Generated questions shown in editable list:
│ ├── Teacher can edit each question
│ ├── Teacher can delete unwanted questions
│ └── Teacher can regenerate individual questions
│
├── "Add to Test" button:
│ └── Questions added to current test's question bank
│
└── AI usage tracked:
└── Credits deducted from institute's AI quota
└── Usage logged for billing
13.2 AI Doubt Solver (Student)

Student is in course player, stuck on a concept
│
├── Clicks "Ask AI" button in Q&A panel
├── Chat interface opens (slide-in panel)
│
├── Student types question:
│ └── "Why does useEffect run twice in React 18?"
│
├── API: POST /ai/doubt { question, courseId, lessonId, context }
│ └── Server builds context: lesson title, description, user's recent notes
│ └── Sends to AI with context
│ └── Streams response tokens → real-time typing effect
│
├── AI response shown with:
│ ├── Explanation
│ ├── Code examples (if applicable, syntax highlighted)
│ └── Related resource suggestions
│
├── Follow-up conversation maintained (thread context)
│
└── "Report bad answer" → flagged for review
13.3 Online Exam (Proctored)

Student starts proctored exam
│
├── Pre-exam checks:
│ ├── Camera access required → browser permission prompt
│ ├── Microphone access (optional)
│ ├── Screen share request (for lockdown mode)
│ └── System check: stable connection, sufficient device specs
│
├── Student identity verification:
│ └── Photo capture → AI face comparison with profile photo
│ └── Confidence score threshold check
│
├── Exam starts in lockdown mode:
│ ├── Fullscreen forced
│ ├── Tab switching detection:
│ │ └── Warning on first switch
│ │ └── Auto-submit on 3rd switch
│ ├── Copy-paste disabled
│ ├── Right-click disabled
│ ├── Print screen key intercepted
│ └── Periodic screenshot capture (every 2 minutes)
│
├── During exam:
│ ├── Camera feed monitored
│ ├── Face detection: warns if face not visible
│ ├── Multiple faces: "Exam violation detected"
│ └── All events logged: { event, timestamp, evidence }
│
├── Exam completion:
│ └── Proctoring report generated
│ └── Admin can review: screenshots, events log, face confidence scores
│
└── Violations result in:
└── Flagged exam (teacher reviews manually)
└── Or automatic disqualification (if configured)
13.4 Live Classes (WebRTC)

Teacher starts live class
│
├── Teacher clicks "Start Live Class"
│ └── API: POST /live-classes { courseId, title, scheduledAt }
│ └── DB: LiveClass record created
│ └── Students notified 15 minutes before
│
├── Class room page:
│ ├── WebRTC peer connection established
│ ├── Teacher video + audio broadcasted
│ ├── Students join as viewers
│ ├── Chat panel (real-time, WebSocket)
│ ├── Raise hand feature
│ ├── Polls during class
│ └── Screen sharing (teacher)
│
├── Recording (if enabled):
│ └── Server-side recording started
│ └── On class end: recording processed
│ └── Uploaded to storage
│ └── Added as lesson in course (optional)
│
└── Class ends:
└── Recording URL saved
└── Attendance auto-marked for participants
└── Chat transcript saved
└── Post-class notification with recording link
13.5 Digital Library

Librarian manages digital library
│
├── /admin/library
│ ├── Upload resource:
│ │ ├── File: PDF, EPUB, video, audio
│ │ ├── Title, description, category, tags
│ │ ├── Access level: All students | Enrolled in specific course | Premium
│ │ └── API: POST /library/resources (multipart upload)
│ │ └── File uploaded to cloud storage
│ │ └── DB: LibraryResource created
│ │
│ └── Resource management: edit, delete, track downloads
│
└── Student view (/library):
├── Search + filter library
├── Preview (for PDFs)
└── Download (tracked, rate-limited)
SECTION 14: NOTIFICATIONS & COMMUNICATION FLOW
14.1 Notification Architecture

Event occurs (e.g., student enrolls in course)
│
├── Server identifies notification rules for this event
├── Determines recipients (student, teacher, admin)
├── For each recipient and channel:
│
├── IN-APP Notification:
│ └── DB: Notification record created {
│ recipientId, type, title, message,
│ entityType, entityId, isRead: false
│ }
│ └── WebSocket (if recipient is online):
│ └── Push notification to connected client
│ └── Client: notification bell count incremented
│ └── Client: notification popup shows (3 seconds)
│
├── EMAIL Notification:
│ └── Email queue (Bull/Redis):
│ └── Job added: { to, subject, template, data }
│ └── Worker picks up job
│ └── Template rendered (Handlebars)
│ └── SMTP/SendGrid sends email
│ └── Delivery status tracked
│
└── SMS Notification (if enabled by institute):
└── SMS queue
└── Twilio/MSG91 API called
└── Delivery receipt tracked
14.2 Notification Trigger Map
Event Student Teacher Admin SMS Email
Registration ✓ - ✓ Optional ✓
Course enrollment ✓ ✓ ✓ Optional ✓
Payment success ✓ - ✓ - ✓
Test result published ✓ - - Optional ✓
Certificate earned ✓ - - - ✓
New announcement ✓ ✓ - Optional ✓
Teacher message ✓ - - - Optional
Course content added ✓ - - - Optional
Exam starting (15min) ✓ - - ✓ ✓
Attendance absent ✓ - ✓ ✓ ✓
Password reset ✓ ✓ ✓ - ✓
Account deactivated ✓ - - - ✓
14.3 Notification Center (Student)

Student clicks notification bell
│
├── Dropdown shows last 5 notifications:
│ ├── Unread notifications: highlighted background
│ ├── Read notifications: normal
│ └── "Mark all read" button
│
├── Click notification:
│ └── API: PATCH /notifications/:id/read
│ └── DB: Notification.isRead = true, readAt = now
│ └── Redirect to relevant entity (course, test, etc.)
│
└── "View All" → /notifications page:
├── API: GET /notifications?page=1&limit=20
├── Infinite scroll or pagination
└── Filter by type: All | Course | Test | Announcement | System
14.4 Parent-Teacher Messaging

Parent initiates message to teacher
│
├── Parent goes to /parent/messages
├── "New Message" button
├── Select teacher (from child's course teachers)
│
├── Message composer:
│ ├── To: teacher name (auto-filled)
│ ├── Subject
│ └── Message body
│
├── API: POST /messages { recipientId, subject, body, parentId }
│ └── DB: Message thread created
│ └── DB: Message record (from parent, to teacher)
│ └── Teacher notified: in-app + email
│
├── Thread view (real-time via WebSocket):
│ ├── Message bubbles (parent left, teacher right)
│ ├── Timestamp on each message
│ ├── Read receipts
│ └── Typing indicator
│
└── Teacher replies → parent notified
SECTION 15: DATABASE FLOW MAPPING
15.1 Collections / Tables

Core Collections:
├── users { \_id, name, email, password, role, tenantId, isActive, teacherProfile, ... }
├── institutes { \_id, name, subdomain, owner, subscription, limits, isActive, ... }
├── courses { \_id, title, description, teacher, category, price, tenantId, isPublished, ... }
├── modules { \_id, courseId, title, order, tenantId }
├── lessons { \_id, moduleId, courseId, title, type, videoUrl, duration, isPreview, tenantId }
├── enrollments { \_id, student, course, status, progress, enrolledAt, completedAt, tenantId }
├── lesson_progress { \_id, enrollmentId, lessonId, completed, watchedSeconds, tenantId }
├── tests { \_id, title, courseId, questions, duration, totalMarks, status, tenantId }
├── questions { \_id, testId, text, type, options, correctAnswer, marks, tenantId }
├── test_attempts { \_id, testId, student, answers, score, status, startedAt, submittedAt, tenantId }
├── quizzes { \_id, lessonId, questions, tenantId }
├── quiz_attempts { \_id, quizId, student, answers, score, tenantId }
├── reviews { \_id, course, student, rating, comment, isApproved, tenantId }
├── payments { \_id, student, course, amount, gateway, status, tenantId }
├── coupons { \_id, code, discount, type, usageLimit, usedCount, tenantId }
├── coupon_usages { \_id, couponId, userId, orderId, tenantId }
├── certificates { \_id, student, course, enrollmentId, certificateId, issuedAt, tenantId }
├── notifications { \_id, recipient, type, title, message, isRead, tenantId }
├── announcements { \_id, title, message, targetAudience, channels, sentAt, tenantId }
├── messages { \_id, thread, sender, recipient, body, isRead, tenantId }
├── notes { \_id, student, lessonId, content, videoTimestamp, tenantId }
├── attendance { \_id, course, student, date, status, tenantId }
├── categories { \_id, name, slug, icon, description, order, tenantId }
├── blogs { \_id, title, content, author, tags, tenantId }
├── audit_logs { \_id, actor, action, resource, resourceId, changes, ip, tenantId, createdAt }
└── subscription_plans { \_id, name, price, limits, features }
15.2 Enrollment — Full DB Flow

POST /enrollments { courseId }
│
├── READS:
│ ├── users.findById(userId) → verify active, get tenantId
│ ├── courses.findById(courseId) → verify published, get price, tenantId
│ └── enrollments.findOne({ student, course }) → check duplicate
│
├── WRITES:
│ ├── enrollments.create({
│ │ student: userId,
│ │ course: courseId,
│ │ tenantId,
│ │ status: 'active',
│ │ enrolledAt: now,
│ │ progress: 0,
│ │ completedLessons: 0,
│ │ })
│ │
│ ├── courses.findByIdAndUpdate(courseId,
│ │ { $inc: { enrollmentCount: 1 } }
│ │ )
│ │
│ └── notifications.create({
│ recipient: userId,
│ type: 'enrollment',
│ title: 'Enrolled Successfully',
│ ...
│ })
│
├── SIDE EFFECTS:
│ ├── Email queue: welcome email
│ └── Analytics event: enrollment_created
│
└── AUDIT LOG:
└── audit_logs.create({
actor: userId, action: 'enrollment.create',
resource: 'enrollment', resourceId: enrollment.\_id,
tenantId
})
15.3 Test Submission — Full DB Flow

POST /test-attempts/:id/submit
│
├── READS:
│ ├── test*attempts.findById(attemptId) → get all saved answers
│ ├── tests.findById(testId) → get questions, marking scheme
│ └── questions.find({ testId }) → get correct answers
│
├── EVALUATION:
│ ├── For each answer:
│ │ ├── Compare with correct answer
│ │ ├── Calculate marks: +marks (correct), -negativeMarks (wrong), 0 (skipped)
│ │ └── Track: correct, incorrect, skipped counts
│ └── Total score calculated
│
├── WRITES:
│ ├── test_attempts.findByIdAndUpdate(attemptId, {
│ │ status: 'completed',
│ │ submittedAt: now,
│ │ score: totalScore,
│ │ correctCount, incorrectCount, skippedCount,
│ │ percentage
│ │ })
│ │
│ ├── If pass: enrollments.findOneAndUpdate(
│ │ { student, course: test.courseId },
│ │ { $set: { testPassed: true } }
│ │ )
│ │
│ └── notifications.create → "Your result is available"
│
└── CACHE INVALIDATION:
└── redis.del(`test_leaderboard*${testId}`)
15.4 Soft Delete Pattern (All Collections)

Any DELETE operation:
│
├── Never uses collection.deleteOne() directly
├── Instead:
│ └── collection.findByIdAndUpdate(id, {
│ deletedAt: new Date(),
│ isDeleted: true
│ })
│
└── All queries include: { isDeleted: { $ne: true } }
└── Implemented in tenantPlugin pre-hook
└── Deleted data preserved for:
├── Audit purposes
├── Legal compliance
└── Data recovery
SECTION 16: API FLOW MAPPING
16.1 API Design Standards

Base URL: /api/v1

Response envelope (success):
{
"success": true,
"message": "...",
"data": { ... } | [...],
"pagination": { // only for list endpoints
"page": 1,
"limit": 10,
"total": 156,
"pages": 16,
"hasNext": true,
"hasPrev": false
}
}

Response envelope (error):
{
"success": false,
"message": "Human-readable error",
"errors": [ // optional, for validation errors
{ "field": "email", "message": "Email already registered" }
],
"code": "VALIDATION_ERROR" // machine-readable error code
}
16.2 Key API Endpoints
Auth
Method Endpoint Auth Description
POST /auth/register None Register new user
POST /auth/login None Login
POST /auth/logout Bearer Logout (invalidate refresh token)
POST /auth/refresh-token None Refresh access token
GET /auth/profile Bearer Get current user
POST /auth/forgot-password None Send reset email
POST /auth/reset-password None Reset password
POST /auth/verify-email None Verify email
GET /auth/google None Google OAuth initiate
GET /auth/google/callback None Google OAuth callback
Courses
Method Endpoint Auth Description
GET /courses Optional List courses (public)
GET /courses/:id Optional Course detail
POST /courses Teacher/Admin Create course
PUT /courses/:id Teacher/Admin Update course
DELETE /courses/:id Admin Delete course
PATCH /courses/:id/publish Teacher/Admin Toggle publish
GET /courses/:id/lessons Enrolled Get lessons
POST /courses/:id/modules Teacher Add module
POST /courses/:courseId/modules/:moduleId/lessons Teacher Add lesson
Enrollments
Method Endpoint Auth Description
POST /enrollments Student Enroll in course
GET /enrollments Student My enrollments
GET /enrollments/:id Student Enrollment detail
PATCH /enrollments/:id/lessons/:lessonId/progress Student Update progress
PATCH /enrollments/:id/lessons/:lessonId/complete Student Mark complete
Admin
Method Endpoint Auth Description
GET /admin/dashboard Admin Dashboard stats
GET /admin/courses Admin All courses
GET /admin/users Admin All users
POST /admin/users Admin Create user
PUT /admin/users/:id Admin Update user
GET /admin/enrollments Admin All enrollments
GET /admin/enrollments/export Admin Export CSV
GET /admin/revenue Admin Revenue analytics
GET /admin/coupons Admin All coupons
POST /admin/coupons Admin Create coupon
PUT /admin/coupons/:id Admin Update coupon
DELETE /admin/coupons/:id Admin Delete coupon
GET /admin/reviews Admin All reviews
PATCH /admin/reviews/:id/toggle-approval Admin Approve/reject
POST /admin/reviews/bulk-delete Admin Bulk delete
GET /admin/teachers Admin All teachers
PATCH /admin/teachers/:id/verify Admin Verify teacher
POST /admin/announcements Admin Send announcement
16.3 Request/Response Examples
POST /enrollments
Request:

{
"courseId": "6641f2a3...",
"couponCode": "SAVE20"
}
Headers:

Authorization: Bearer <accessToken>
X-Tenant-Id: <tenantId>
Content-Type: application/json
Response (201):

{
"success": true,
"message": "Enrolled successfully",
"data": {
"\_id": "...",
"student": "...",
"course": { "\_id": "...", "title": "React Masterclass" },
"status": "active",
"enrolledAt": "2026-05-26T10:30:00Z",
"progress": 0
}
}
Error Response (409):

{
"success": false,
"message": "You are already enrolled in this course",
"code": "DUPLICATE_ENROLLMENT"
}
SECTION 17: STATE MANAGEMENT FLOW
17.1 Redux Store Structure

store: {
auth: {
user: null | UserObject,
isAuthenticated: boolean,
loading: boolean,
error: string | null,
initialized: boolean // prevents flash of login on page load
},

courses: {
list: Course[],
selected: Course | null,
pagination: Pagination | null,
loading: boolean,
error: string | null
},

enrollments: {
list: Enrollment[],
active: Enrollment | null,
progress: { [lessonId]: LessonProgress },
loading: boolean
},

tests: {
list: Test[],
selected: Test | null,
currentAttempt: TestAttempt | null,
answers: { [questionId]: Answer }, // local state during exam
loading: boolean
},

notifications: {
list: Notification[],
unreadCount: number,
loading: boolean
},

admin: {
dashboard: DashboardStats | null,
users: { list, pagination, loading },
courses: { list, pagination, loading },
enrollments: { list, pagination, loading },
revenue: RevenueData | null,
coupons: { list, pagination, loading },
reviews: { list, pagination, loading }
},

ui: {
theme: 'light' | 'dark',
sidebarOpen: boolean,
activeModal: string | null,
toasts: Toast[]
}
}
17.2 Async Thunk Pattern

// Standard thunk pattern used throughout
export const fetchCourses = createAsyncThunk(
'courses/fetchAll',
async (params, { rejectWithValue }) => {
try {
const res = await coursesAPI.getAll(params);
return res.data; // full response: { data: [], pagination: {} }
} catch (err) {
return rejectWithValue(err.response?.data);
}
}
);

// Reducer handles all three states:
.addCase(fetchCourses.pending, (state) => {
state.loading = true;
state.error = null;
})
.addCase(fetchCourses.fulfilled, (state, action) => {
state.loading = false;
state.list = action.payload.data || [];
state.pagination = action.payload.pagination || null;
})
.addCase(fetchCourses.rejected, (state, action) => {
state.loading = false;
state.error = action.payload?.message || 'Failed to load';
})
17.3 Optimistic Updates

// Used for fast UX on toggles (like review approval)
.addCase(toggleReviewApproval.pending, (state, action) => {
// Immediately update UI
const review = state.list.find(r => r.\_id === action.meta.arg);
if (review) review.isApproved = !review.isApproved;
})
.addCase(toggleReviewApproval.rejected, (state, action) => {
// Revert on failure
const review = state.list.find(r => r.\_id === action.meta.arg);
if (review) review.isApproved = !review.isApproved;
// Toast error
})
17.4 Cache Strategy

Redux Slice Cache Rules:
├── Dashboard stats: fetched on page load, cleared after 5 min
├── Course list: fetched when filter changes, cached during session
├── User profile: fetched once, invalidated on profile update
└── Test answers during exam: stored in Redux (NOT persisted to localStorage)
└── On page refresh during exam: re-fetch from server's saved answers

Server-Side Cache (Redis):
├── institute:subdomain:<sub> → Institute document (TTL: 5 min)
├── institute:id:<id> → Institute document (TTL: 5 min)
├── user\_<userId> → User document (TTL: 5 min)
├── admin:dashboard → Dashboard stats (TTL: 5 min)
└── course:<id>:public → Public course data (TTL: 10 min)

Cache Invalidation:
├── Institute update → redis.del('institute:subdomain:\*')
├── User update → redis.del('user\_<userId>')
├── Course publish → redis.del('course:<id>:public')
└── Dashboard: auto-expires (no manual invalidation)
SECTION 18: UI/UX BEHAVIOR RULES
18.1 Loading States

Page-level loading:
├── Initial page load → full skeleton layout (not spinner)
├── Skeleton matches exact shape of content (no layout shift)
└── Min skeleton duration: 200ms (prevents flicker on fast connections)

Component-level loading:
├── Buttons: text replaced with spinner + button disabled
├── Submit buttons: "Saving..." state during API call
└── Tables: skeleton rows (same count as expected data)

Infinite scroll / pagination:
├── "Load More" button shows loading when clicked
├── New items fade in (not jump)
└── Scroll position maintained
18.2 Empty States
Page Empty State Message CTA
/my-courses "You haven't enrolled in any courses yet" Browse Courses
/admin/courses "No courses created yet" Create First Course
/admin/users "No users found" Create User
/notifications "You're all caught up!" None
Search results "No results for '<query>'" Clear Filters
/leaderboard "Be the first to earn points!" Take a Quiz
/certificates "Complete a course to earn your first certificate" My Courses
18.3 Button States

Default → Hover → Active (pressed) → Loading → Disabled

Primary button (e.g., "Enroll Now"):
├── Default: bg-blue-600, text-white
├── Hover: bg-blue-700 (100ms transition)
├── Active: bg-blue-800, scale-95
├── Loading: spinner + "Processing..." text, opacity-75
└── Disabled: opacity-50, cursor-not-allowed

Danger button (e.g., "Delete"):
└── Requires confirmation modal before action
└── Two-step: click → confirm modal → second click → action
18.4 Form Validation Rules

Validation triggers:
├── On blur (field loses focus) → show inline error
├── On submit → validate all fields + show all errors
└── On re-type after error → clear error (show only when appropriate)

Inline error placement:
└── Red text below field, with red border on field

Success states:
└── Green border + checkmark icon on validated fields

Password strength meter:
└── Below password field, 4 segments: Weak | Fair | Good | Strong
18.5 Responsive Behavior
Breakpoint Layout Changes
Mobile (< 768px) Single column, bottom nav, hamburger menu
Tablet (768-1024px) Two column, collapsible sidebar
Desktop (> 1024px) Full sidebar, multi-column content

Course player responsive:
├── Desktop: 3-column (sidebar / video / notes)
├── Tablet: 2-column (collapsible sidebar / video), notes as tab
└── Mobile: full-width video, lesson list as bottom sheet
18.6 Accessibility

WCAG 2.1 AA compliance targets:
├── All interactive elements: keyboard navigable (Tab order)
├── Focus indicators: visible outline on all focused elements
├── Color contrast: minimum 4.5:1 for text
├── Images: alt text required
├── Forms: labels associated with inputs
├── Modals: focus trapped inside modal, ESC to close
├── Toasts: announced via aria-live region
└── Skeleton loaders: aria-busy="true" on container
SECTION 19: EDGE CASES & FAILURE SCENARIOS
19.1 Internet Failure

Scenario: Student is in exam, internet disconnects
│
├── Axios request times out after 30 seconds
├── Answer state preserved in Redux (in memory)
├── Toast: "Connection lost. Answers saved locally. Reconnecting..."
├── Retry mechanism: exponential backoff (1s, 2s, 4s, 8s, max 30s)
├── On reconnect:
│ └── API: POST /test-attempts/:id/sync { answers: [...] }
│ └── Server merges with existing saved answers
└── If browser refreshes:
└── On page load: API: GET /test-attempts/:id/resume
└── Returns saved answers → Redux state restored
└── Timer resumed server-side (elapsed time deducted)
19.2 Duplicate Submission Prevention

Scenario: User double-clicks "Enroll" button
│
├── Button disabled immediately on first click (UI)
├── API call has idempotency check:
│ └── Server: enrollments.findOne({ student, course })
│ └── If exists: return 409 Conflict
│ └── If not exists: create enrollment
│ └── React 18 StrictMode: useEffect runs twice in dev → handled by server idempotency
└── Network deduplication: requestId header on all mutation requests
└── Server stores requestId in Redis (60s TTL)
└── Duplicate requestId → return cached response
19.3 File Upload Failures

Scenario: Teacher uploads large video file (500MB) and connection drops
│
├── Chunked upload implemented:
│ ├── File split into 5MB chunks
│ ├── Each chunk uploaded sequentially or in parallel
│ └── Upload session ID created on server
│
├── On failure mid-upload:
│ ├── Server stores: uploadSession { sessionId, uploadedChunks, totalChunks }
│ └── Frontend can resume: API: POST /upload/resume { sessionId, chunk, chunkIndex }
│
├── On complete success:
│ └── Server assembles chunks → single file
│ └── Uploads to cloud storage
│ └── Returns final URL
│
└── On complete failure (after 3 retries):
└── Toast: "Upload failed. Please try again."
└── Partial chunks cleaned up from server
19.4 Payment Failure

Scenario: Student pays, gateway succeeds, webhook fails
│
├── Payment gateway charges student
├── Webhook call to server fails (server down, timeout)
│
├── Recovery mechanisms:
│ ├── Webhook retry: gateway retries 3 times (1min, 5min, 30min)
│ ├── Student-side: "Verify Payment" button on pending enrollment
│ │ └── API: POST /payments/verify { paymentId, gatewayOrderId }
│ │ └── Server directly queries gateway API for payment status
│ │ └── If paid → create enrollment
│ └── Admin-side: manual enrollment creation for affected student
│
└── Partial refund scenarios:
└── Admin initiates refund via gateway dashboard
└── DB: Payment.status = 'refunded'
└── DB: Enrollment.status = 'cancelled'
└── Student notified via email
19.5 Session Expiration During Exam

Scenario: Exam running, access token expires (15 min)
│
├── Timer at 8 minutes remaining
├── Student answers a question
├── API call returns 401
├── Axios interceptor catches 401:
│ ├── Pause all pending API calls
│ ├── Attempt token refresh with refreshToken
│ ├── Refresh success:
│ │ └── New access token obtained
│ │ └── All paused calls retried
│ │ └── Student never notices anything
│ └── Refresh failure (refreshToken also expired):
│ ├── Cannot silently re-login during exam
│ └── Show modal: "Session expired. Please log in to continue."
│ └── "Login" → new tab opens with login page
│ └── After login in new tab → original tab retries
│ └── Or: Student logs in → exam state restored from server
19.6 Race Conditions

Scenario: Two admins try to publish the same course simultaneously
│
├── Admin A clicks "Publish" → API: PATCH /courses/:id/publish
├── Admin B clicks "Publish" → API: PATCH /courses/:id/publish
│
├── MongoDB atomic operation:
│ └── findByIdAndUpdate with { $set: { isPublished: true } }
│ └── Both succeed (idempotent — publishing already-published = no-op)
│
Scenario: Coupon usage limit race condition
│
├── 100 students try to use last coupon simultaneously
├── MongoDB atomic: { $inc: { usedCount: 1 } } with condition check
│ └── findOneAndUpdate({ \_id: couponId, usedCount: { $lt: usageLimit } })
│ └── Returns null if limit already reached → 400 error
│ └── Only successful updates create coupon_usage records
└── Redis distributed lock for high-concurrency flash coupons
SECTION 20: SECURITY FLOW
20.1 Authentication Security

Password Security:
├── Hashed with bcrypt (rounds: 12)
├── Never stored in plain text
├── Never returned in API responses
├── Password reset: time-limited JWT (1 hour)
└── Force password change: on first login (if admin-created account)

JWT Security:
├── Access token: short-lived (15 minutes)
├── Refresh token: opaque random string, hashed in DB (SHA-256)
├── JWT secret: 256-bit random secret (environment variable)
├── Token rotation: new refresh token on each use
└── Token family invalidation: all refresh tokens cleared on password change

Brute Force Protection:
├── Max 5 failed login attempts
├── Account locked for 15 minutes after 5 failures
├── Lockout stored in Redis (not DB — fast lookup)
└── CAPTCHA triggered after 3 failures (optional)
20.2 Multi-Tenant Data Isolation

Every query is scoped by tenantId:
├── MongoDB Mongoose plugin (tenantPlugin) automatically adds
│ { tenantId: currentTenantId } to all queries and save operations
│
├── API layer: tenantId resolved from:
│ ├── Subdomain header (X-Tenant-Subdomain)
│ ├── Explicit header (X-Tenant-Id)
│ └── JWT fallback (user's own tenantId)
│
├── Cross-tenant access prevention:
│ └── Auth middleware validates:
│ if (user.role !== 'super_admin' && user.tenantId !== req.tenantId)
│ throw 403
│
└── Super admin bypass:
└── runWithTenant(null, true, ...) — bypass mode
└── No tenantId filter applied
└── Explicit tenantId required for all mutations
20.3 RBAC Implementation

Authorization check on every protected route:
│
├── Route-level: router.use(authenticate, authorize('admin', 'teacher'))
│ └── authorize() middleware checks req.user.role
│
├── Resource-level: controllers check ownership
│ └── if (course.teacher.toString() !== req.userId) throw 403
│
└── Data-level: MongoDB queries include tenantId + userId where applicable
└── Enrollment.findOne({ student: userId, course: courseId, tenantId })
20.4 API Security

Rate Limiting:
├── Global: 100 requests per IP per minute
├── Auth endpoints: 10 requests per IP per minute
├── Upload endpoints: 5 requests per IP per minute
└── AI endpoints: 20 requests per user per hour

Input Sanitization:
├── All string inputs: trimmed, HTML-escaped
├── Rich text (course description): DOMPurify sanitization
├── File uploads: validated by MIME type (not just extension)
│ └── Magic bytes checked: PDF, JPEG, PNG, MP4, etc.
└── MongoDB queries: Mongoose schema validation prevents injection

CORS:
├── Allowed origins: institute subdomains + admin domain
├── Credentials: included (for cookie-based auth if used)
└── Preflight caching: 86400 seconds

Helmet.js security headers:
├── X-Content-Type-Options: nosniff
├── X-Frame-Options: DENY
├── X-XSS-Protection: 1; mode=block
└── Content-Security-Policy: strict

Audit Logging:
└── Every admin action logged:
└── { actor, action, resource, resourceId, changes, ip, userAgent, timestamp }
└── Logs immutable (no update/delete on audit_logs collection)
└── Admin can view logs but cannot modify them
20.5 File Upload Security

Upload validation pipeline:
│
├── Client-side: file type filter (accept="image/jpeg,image/png")
│
├── Server-side:
│ ├── File size limit: 10MB (images), 500MB (videos)
│ ├── MIME type validation: check magic bytes, not just Content-Type header
│ ├── Virus scan: ClamAV (if configured)
│ └── File renamed to UUID (prevent path traversal)
│
├── Storage: cloud storage (not server filesystem)
│ └── Signed URLs for access (not public URLs)
│ └── Pre-signed URLs expire after 1 hour
│
└── Malicious filename prevention:
└── Original filename sanitized: path.basename(), alphanumeric only
SECTION 21: SCALABILITY & FUTURE ARCHITECTURE
21.1 Current Architecture

Current Monolith Architecture:
│
├── Single Node.js/Express server
├── Single MongoDB instance
├── Redis for caching and sessions
├── Cloud storage (Cloudinary/AWS S3) for files
└── Single deployment (PM2 cluster mode on VPS or Heroku)
21.2 Scale-Up Path

Phase 1 (0-10 institutes, 0-1000 students):
└── Current monolith is sufficient
└── PM2 cluster (8 cores)
└── MongoDB Atlas M10
└── Redis Cloud

Phase 2 (10-100 institutes, 1000-50,000 students):
├── Horizontal scaling: multiple server instances behind load balancer (Nginx)
├── Redis Cluster (session stickiness not required — JWT stateless)
├── MongoDB Atlas M30 with read replicas
├── Background job workers: Bull + Redis
│ └── Email queue, notification queue, report generation
├── CDN (Cloudflare): static assets, video delivery
└── Database indexing audit + query optimization

Phase 3 (100+ institutes, 50,000+ students):
├── Service decomposition (microservices):
│ ├── Auth Service (independent JWT authority)
│ ├── Course Service
│ ├── Exam Service (high isolation — exam integrity)
│ ├── Notification Service (high throughput)
│ ├── Payment Service (PCI compliance isolation)
│ └── Analytics Service (read-heavy, separate DB)
├── Message queue: Apache Kafka / RabbitMQ
├── CQRS: separate read models for reporting
├── Elasticsearch: full-text course search
└── MongoDB sharding (by tenantId)
21.3 Multi-Tenant Scaling

Current: Shared database, tenant isolation via tenantId field
│
Future options:
├── Shared DB (current): simple, efficient for small/medium scale
├── DB per large tenant: high-value institutes get dedicated MongoDB
│ └── Connection routing based on tenantId → DB URL mapping
└── Schema per tenant (PostgreSQL): for compliance-heavy use cases
21.4 Mobile App Architecture

Mobile App (React Native / Flutter):
│
├── Same backend API (no changes required)
├── Authentication:
│ └── Access token in SecureStore (not localStorage)
│ └── Refresh token rotation same flow
│
├── Offline support:
│ └── Lesson content downloaded for offline viewing
│ └── SQLite local DB for progress, notes
│ └── Sync on reconnect
│
├── Push notifications:
│ └── FCM (Firebase Cloud Messaging) for Android
│ └── APNs for iOS
│ └── Notification service sends via FCM/APNs instead of WebSocket
│
└── Video delivery:
└── HLS streaming (same CDN URLs)
└── Quality adaptation based on bandwidth
21.5 Real-Time Features Scaling

Current: WebSocket via Socket.io (single server)
│
Scaling WebSockets:
├── Socket.io with Redis adapter
│ └── Multiple server instances share socket state via Redis pub/sub
│ └── Any instance can send to any connected client
│
├── Message flow:
│ Server A receives event
│ → publishes to Redis channel
│ → Server B (which has the client connection) subscribes
│ → Server B delivers to client
│
└── At very high scale:
└── Dedicated WebSocket servers (separate process pool)
└── Or: managed service (Pusher, Ably, AWS API Gateway WebSocket)
21.6 CDN & Content Delivery

Video delivery:
├── Upload: Teacher uploads → Server → Cloud Storage (S3/Cloudinary)
├── Processing: Auto-transcode to HLS (multiple quality levels)
│ └── 360p, 480p, 720p, 1080p
├── Delivery: CloudFront/Cloudflare CDN
│ └── Edge caching worldwide
│ └── Adaptive bitrate streaming
└── DRM (future): Widevine/FairPlay for premium content protection

Static assets (JS, CSS, images):
└── All served from CDN
└── Cache-busted on deployment (content hash in filename)
└── HTTP/2 push for critical resources
21.7 AI Scalability

Current AI integration:
├── Per-request OpenAI/Anthropic API calls
├── Rate limited per institute
└── Costs tracked per institute (for billing)

Scale path:
├── Response caching: similar questions return cached AI responses
│ └── Semantic similarity check (vector DB: Pinecone/Weaviate)
│ └── If similarity > 0.95 → return cached answer
│
├── AI models:
│ ├── Small questions: GPT-3.5 / Claude Haiku (fast, cheap)
│ ├── Complex analysis: GPT-4 / Claude Sonnet (accurate, expensive)
│ └── Future: fine-tuned domain-specific models per subject
│
└── Async AI jobs:
└── Long-running tasks (generate full quiz, analyze performance)
└── Submitted as background jobs
└── Result delivered via WebSocket when ready
21.8 Queue System Architecture

Job Queue (Bull + Redis):
│
├── Email Queue (high priority):
│ └── Workers: 5 concurrent
│ └── Retry: 3 times with exponential backoff
│ └── DLQ: failed emails after 3 retries → manual review
│
├── Notification Queue (high priority):
│ └── Workers: 10 concurrent
│ └── Batch processing: 100 notifications per batch
│
├── Report Queue (low priority):
│ └── Workers: 2 concurrent
│ └── Long-running: PDF generation, data aggregation
│
├── Video Processing Queue (medium priority):
│ └── Workers: 3 concurrent (GPU-enabled if needed)
│ └── Transcoding, thumbnail generation
│
└── Analytics Queue (low priority):
└── Event ingestion for analytics dashboards
└── Aggregated hourly via cron
APPENDIX A: ERROR CODE REFERENCE
Code HTTP Status Meaning
AUTH_REQUIRED 401 No token provided
TOKEN_EXPIRED 401 Access token expired
INVALID_TOKEN 401 Malformed or invalid token
FORBIDDEN 403 Insufficient role permissions
TENANT_REQUIRED 403 Tenant context missing
NOT_FOUND 404 Resource does not exist
DUPLICATE 409 Resource already exists
VALIDATION_ERROR 422 Request body validation failed
RATE_LIMITED 429 Too many requests
SERVER_ERROR 500 Unexpected server failure
APPENDIX B: GLOSSARY
Term Definition
Tenant An institute using the platform (isolated environment)
TenantId MongoDB ObjectId linking a resource to an institute
Bypass mode Super admin mode — no tenant filter applied to DB queries
Enrollment A student-course relationship with progress tracking
Access Token Short-lived JWT used to authenticate API requests
Refresh Token Long-lived opaque token used to get new access tokens
Soft Delete Setting deletedAt instead of removing the document
CQRS Command Query Responsibility Segregation — separate read/write models
HLS HTTP Live Streaming — adaptive video delivery protocol
DLQ Dead Letter Queue — failed jobs that need manual review
Document Version: 1.0.0
Last Updated: May 26, 2026
Authors: Product, Engineering & UX Teams
Classification: Internal — Engineering Reference
Next Review: August 2026

This document is a living specification. All API signatures, flow details, and architectural decisions should be validated against the current codebase before implementation. Raise a PR to update this document when significant system changes are made.
