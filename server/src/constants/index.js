export const ROLES = Object.freeze({
  STUDENT: 'student',
  TEACHER: 'teacher',
  ADMIN: 'admin',
  SUPER_ADMIN: 'super_admin',
});

export const COURSE_STATUS = Object.freeze({
  DRAFT: 'draft',
  PUBLISHED: 'published',
  ARCHIVED: 'archived',
});

export const ENROLLMENT_STATUS = Object.freeze({
  ACTIVE: 'active',
  COMPLETED: 'completed',
  EXPIRED: 'expired',
  REFUNDED: 'refunded',
});

export const PAYMENT_STATUS = Object.freeze({
  PENDING: 'pending',
  COMPLETED: 'completed',
  FAILED: 'failed',
  REFUNDED: 'refunded',
});

export const TEST_STATUS = Object.freeze({
  DRAFT: 'draft',
  PUBLISHED: 'published',
  ARCHIVED: 'archived',
});

export const DIFFICULTY = Object.freeze({
  BEGINNER: 'beginner',
  INTERMEDIATE: 'intermediate',
  ADVANCED: 'advanced',
});

export const QUESTION_TYPE = Object.freeze({
  MCQ: 'mcq',
  MSQ: 'msq',
  TRUE_FALSE: 'true_false',
  FILL_BLANK: 'fill_blank',
  SUBJECTIVE: 'subjective',
});

export const NOTIFICATION_TYPE = Object.freeze({
  SYSTEM: 'system',
  COURSE: 'course',
  TEST: 'test',
  ACHIEVEMENT: 'achievement',
  PAYMENT: 'payment',
  ANNOUNCEMENT: 'announcement',
});

export const SORT_OPTIONS = Object.freeze({
  NEWEST: '-createdAt',
  OLDEST: 'createdAt',
  PRICE_LOW: 'price',
  PRICE_HIGH: '-price',
  RATING: '-averageRating',
  POPULAR: '-enrollmentCount',
  TITLE_AZ: 'title',
  TITLE_ZA: '-title',
});

export const CACHE_KEYS = Object.freeze({
  COURSES: 'courses',
  COURSE: 'course',
  CATEGORIES: 'categories',
  LEADERBOARD: 'leaderboard',
  DASHBOARD: 'dashboard',
  USER_PROFILE: 'user_profile',
});

export const CACHE_TTL = Object.freeze({
  SHORT: 300,       // 5 min
  MEDIUM: 1800,     // 30 min
  LONG: 3600,       // 1 hour
  VERY_LONG: 86400, // 24 hours
});

export const PAGINATION = Object.freeze({
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 12,
  MAX_LIMIT: 100,
});
