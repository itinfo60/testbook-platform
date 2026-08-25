import crypto from 'crypto';

/**
 * In-memory fixtures store to support hermetic, standalone E2E testing
 * and Prisma delegate mocking across all modules.
 */
class FixtureStore {
  constructor() {
    this.reset();
  }

  reset() {
    this.users = new Map();
    this.institutes = new Map();
    this.categories = new Map();
    this.courses = new Map();
    this.lessons = new Map();
    this.enrollments = new Map();
    this.tests = new Map();
    this.testAttempts = new Map();
    this.quizzes = new Map();
    this.quizAttempts = new Map();
    this.payments = new Map();
    this.reviews = new Map();
    this.blogs = new Map();
    this.coupons = new Map();
  }

  seedInstitute(overrides = {}) {
    const id = overrides.id || '00000000-0000-0000-0000-000000000001';
    const institute = {
      id,
      _id: id,
      name: overrides.name || 'Default Institute',
      subdomain: overrides.subdomain || 'default',
      websiteTitle: overrides.websiteTitle || 'CivicsHub Academy',
      isActive: overrides.isActive !== undefined ? overrides.isActive : true,
      subscription: overrides.subscription || {
        status: 'active',
        expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      },
      limits: overrides.limits || {
        studentLimit: 1000,
        teacherLimit: 100,
        storageLimit: 10 * 1024 * 1024 * 1024,
      },
      createdAt: overrides.createdAt || new Date(),
      updatedAt: overrides.updatedAt || new Date(),
      ...overrides,
    };
    this.institutes.set(id, institute);
    return institute;
  }

  seedUser(overrides = {}) {
    const id = overrides.id || crypto.randomUUID();
    const user = {
      id,
      _id: id,
      name: overrides.name || 'Test User',
      email: overrides.email || `user_${id.substring(0, 8)}@example.com`,
      password:
        overrides.password || '$2a$12$e8Z4zK.Vf7V2pC0c0V7oee9YxR4/nQn1d77bN.tD2d76T.F5hZ4QW',
      role: overrides.role || 'student',
      tenantId: overrides.tenantId || '00000000-0000-0000-0000-000000000001',
      isActive: overrides.isActive !== undefined ? overrides.isActive : true,
      isEmailVerified: overrides.isEmailVerified !== undefined ? overrides.isEmailVerified : true,
      createdAt: overrides.createdAt || new Date(),
      updatedAt: overrides.updatedAt || new Date(),
      ...overrides,
    };
    this.users.set(id, user);
    return user;
  }

  seedCategory(overrides = {}) {
    const id = overrides.id || crypto.randomUUID();
    const category = {
      id,
      _id: id,
      name: overrides.name || 'Engineering',
      slug: overrides.slug || `engineering-${id.substring(0, 6)}`,
      description: overrides.description || 'Engineering category',
      type: overrides.type || 'exam',
      isActive: overrides.isActive !== undefined ? overrides.isActive : true,
      createdAt: overrides.createdAt || new Date(),
      updatedAt: overrides.updatedAt || new Date(),
      ...overrides,
    };
    this.categories.set(id, category);
    return category;
  }

  seedCourse(overrides = {}) {
    const id = overrides.id || crypto.randomUUID();
    const course = {
      id,
      _id: id,
      title: overrides.title || 'Complete Node.js & Prisma Masterclass',
      slug: overrides.slug || `nodejs-prisma-${id.substring(0, 6)}`,
      description:
        overrides.description || 'Comprehensive course description with more than 20 chars',
      price: overrides.price !== undefined ? overrides.price : 99.99,
      isPublished: overrides.isPublished !== undefined ? overrides.isPublished : true,
      thumbnail: overrides.thumbnail || 'https://example.com/thumb.jpg',
      teacherId: overrides.teacherId || crypto.randomUUID(),
      categoryId: overrides.categoryId || crypto.randomUUID(),
      tenantId: overrides.tenantId || '00000000-0000-0000-0000-000000000001',
      lessons: overrides.lessons || [],
      sections: overrides.sections || [{ title: 'Section 1', lessons: [] }],
      createdAt: overrides.createdAt || new Date(),
      updatedAt: overrides.updatedAt || new Date(),
      ...overrides,
    };
    this.courses.set(id, course);
    return course;
  }

  seedLesson(overrides = {}) {
    const id = overrides.id || crypto.randomUUID();
    const lesson = {
      id,
      _id: id,
      title: overrides.title || 'Introduction to Prisma',
      content: overrides.content || 'Prisma is a next-generation ORM',
      videoUrl: overrides.videoUrl || 'https://example.com/video.mp4',
      order: overrides.order !== undefined ? overrides.order : 1,
      courseId: overrides.courseId || crypto.randomUUID(),
      isFree: overrides.isFree !== undefined ? overrides.isFree : false,
      createdAt: overrides.createdAt || new Date(),
      updatedAt: overrides.updatedAt || new Date(),
      ...overrides,
    };
    this.lessons.set(id, lesson);
    return lesson;
  }

  seedEnrollment(overrides = {}) {
    const id = overrides.id || crypto.randomUUID();
    const enrollment = {
      id,
      _id: id,
      status: overrides.status || 'active',
      progressPercent: overrides.progressPercent !== undefined ? overrides.progressPercent : 0,
      userId: overrides.userId || crypto.randomUUID(),
      courseId: overrides.courseId || crypto.randomUUID(),
      tenantId: overrides.tenantId || '00000000-0000-0000-0000-000000000001',
      enrolledAt: overrides.enrolledAt || new Date(),
      completedAt: overrides.completedAt || null,
      ...overrides,
    };
    this.enrollments.set(id, enrollment);
    return enrollment;
  }

  seedTest(overrides = {}) {
    const id = overrides.id || crypto.randomUUID();
    const test = {
      id,
      _id: id,
      title: overrides.title || 'Full Stack Architecture Mock Test',
      description: overrides.description || 'Test covering backend and databases',
      duration: overrides.duration !== undefined ? overrides.duration : 60,
      totalMarks: overrides.totalMarks !== undefined ? overrides.totalMarks : 100,
      passingMarks: overrides.passingMarks !== undefined ? overrides.passingMarks : 40,
      isPublished: overrides.isPublished !== undefined ? overrides.isPublished : true,
      categoryId: overrides.categoryId || crypto.randomUUID(),
      teacherId: overrides.teacherId || crypto.randomUUID(),
      tenantId: overrides.tenantId || '00000000-0000-0000-0000-000000000001',
      questions: overrides.questions || [
        {
          id: 'q1',
          question: 'What is Prisma?',
          type: 'mcq',
          options: [
            { text: 'ORM for Node.js & TypeScript', isCorrect: true },
            { text: 'A frontend framework', isCorrect: false },
          ],
          marks: 10,
          negativeMarks: 2,
        },
      ],
      createdAt: overrides.createdAt || new Date(),
      updatedAt: overrides.updatedAt || new Date(),
      ...overrides,
    };
    this.tests.set(id, test);
    return test;
  }

  seedTestAttempt(overrides = {}) {
    const id = overrides.id || crypto.randomUUID();
    const attempt = {
      id,
      _id: id,
      score: overrides.score !== undefined ? overrides.score : 80,
      status: overrides.status || 'completed',
      answers: overrides.answers || [{ questionId: 'q1', selectedOption: 0 }],
      testId: overrides.testId || crypto.randomUUID(),
      userId: overrides.userId || crypto.randomUUID(),
      startedAt: overrides.startedAt || new Date(),
      completedAt: overrides.completedAt || new Date(),
      ...overrides,
    };
    this.testAttempts.set(id, attempt);
    return attempt;
  }

  seedQuiz(overrides = {}) {
    const id = overrides.id || crypto.randomUUID();
    const quiz = {
      id,
      _id: id,
      title: overrides.title || 'Prisma Basics Quiz',
      description: overrides.description || 'Quick quiz on Prisma CRUD',
      isPublished: overrides.isPublished !== undefined ? overrides.isPublished : true,
      courseId: overrides.courseId || crypto.randomUUID(),
      questions: overrides.questions || [
        {
          question: 'Which tool runs migrations in Prisma?',
          options: [
            { text: 'prisma migrate', isCorrect: true },
            { text: 'prisma seed', isCorrect: false },
          ],
        },
      ],
      createdAt: overrides.createdAt || new Date(),
      updatedAt: overrides.updatedAt || new Date(),
      ...overrides,
    };
    this.quizzes.set(id, quiz);
    return quiz;
  }

  seedPayment(overrides = {}) {
    const id = overrides.id || crypto.randomUUID();
    const payment = {
      id,
      _id: id,
      amount: overrides.amount !== undefined ? overrides.amount : 9999,
      currency: overrides.currency || 'INR',
      status: overrides.status || 'completed',
      method: overrides.method || 'card',
      transactionId: overrides.transactionId || `txn_${Date.now()}`,
      orderId: overrides.orderId || `order_${Date.now()}`,
      userId: overrides.userId || crypto.randomUUID(),
      tenantId: overrides.tenantId || '00000000-0000-0000-0000-000000000001',
      createdAt: overrides.createdAt || new Date(),
      updatedAt: overrides.updatedAt || new Date(),
      ...overrides,
    };
    this.payments.set(id, payment);
    return payment;
  }

  seedCoupon(overrides = {}) {
    const id = overrides.id || crypto.randomUUID();
    const coupon = {
      id,
      _id: id,
      code: overrides.code || 'SAVE50',
      discountPercent: overrides.discountPercent !== undefined ? overrides.discountPercent : 50,
      maxDiscount: overrides.maxDiscount !== undefined ? overrides.maxDiscount : 500,
      validUntil: overrides.validUntil || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      isActive: overrides.isActive !== undefined ? overrides.isActive : true,
      tenantId: overrides.tenantId || '00000000-0000-0000-0000-000000000001',
      createdAt: overrides.createdAt || new Date(),
      updatedAt: overrides.updatedAt || new Date(),
      ...overrides,
    };
    this.coupons.set(id, coupon);
    return coupon;
  }

  seedReview(overrides = {}) {
    const id = overrides.id || crypto.randomUUID();
    const review = {
      id,
      _id: id,
      rating: overrides.rating !== undefined ? overrides.rating : 5,
      comment: overrides.comment || 'Excellent course content and clear explanations!',
      userId: overrides.userId || crypto.randomUUID(),
      courseId: overrides.courseId || crypto.randomUUID(),
      isApproved: overrides.isApproved !== undefined ? overrides.isApproved : true,
      createdAt: overrides.createdAt || new Date(),
      updatedAt: overrides.updatedAt || new Date(),
      ...overrides,
    };
    this.reviews.set(id, review);
    return review;
  }

  seedBlog(overrides = {}) {
    const id = overrides.id || crypto.randomUUID();
    const blog = {
      id,
      _id: id,
      title: overrides.title || 'Architectural Guide to Node.js & Prisma',
      slug: overrides.slug || `nodejs-prisma-guide-${id.substring(0, 6)}`,
      content:
        overrides.content || 'Detailed architectural guide on migrating from Mongoose to Prisma.',
      status: overrides.status || 'published',
      tags: overrides.tags || ['nodejs', 'prisma', 'postgresql'],
      createdAt: overrides.createdAt || new Date(),
      updatedAt: overrides.updatedAt || new Date(),
      ...overrides,
    };
    this.blogs.set(id, blog);
    return blog;
  }
}

export const fixtureStore = new FixtureStore();
