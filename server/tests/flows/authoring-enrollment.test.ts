import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../src/config/prisma.js', () => {
  const model = () =>
    Object.fromEntries(
      [
        'findFirst',
        'findUnique',
        'findMany',
        'count',
        'create',
        'update',
        'upsert',
        'delete',
        'deleteMany',
      ].map((key) => [key, vi.fn()])
    );
  return {
    default: Object.fromEntries(
      [
        'quiz',
        'quizAttempt',
        'course',
        'enrollment',
        'payment',
        'test',
        'testSeries',
        'testAttempt',
        'user',
      ].map((key) => [key, model()])
    ),
  };
});
vi.mock('../../src/config/redis.js', () => ({
  default: {
    delPattern: vi.fn().mockResolvedValue(0),
    del: vi.fn().mockResolvedValue(0),
    get: vi.fn().mockResolvedValue(null),
    set: vi.fn().mockResolvedValue(true),
  },
}));
vi.mock('../../src/config/index.js', () => ({
  default: {
    razorpay: {},
    jwt: {
      secret: 'isolated-test-secret-at-least-32-chars',
      accessExpiry: '15m',
      refreshExpiry: '7d',
    },
  },
}));
vi.mock('../../src/utils/logger.js', () => ({ default: { warn: vi.fn() } }));
vi.mock('../../src/queues/index.js', () => ({
  transactionalEmailQueue: { add: vi.fn().mockResolvedValue({}) },
  notificationQueue: { add: vi.fn().mockResolvedValue({}) },
  dripQueue: { add: vi.fn().mockResolvedValue({}) },
}));

vi.mock('../../src/config/supabase.js', () => ({
  getSupabase: () => ({
    auth: { admin: { generateLink: vi.fn().mockResolvedValue({ data: {} }) } },
  }),
}));

import { AuthService } from '../../src/modules/auth/auth.service.js';
import { hashPassword } from '../../src/modules/user/user.utils.js';
import { Prisma } from '@prisma/client';
import prisma from '../../src/config/prisma.js';
import * as quizzes from '../../src/modules/quiz/quiz.controller.js';
import * as enrollments from '../../src/modules/enrollment/enrollment.controller.js';
import { CourseService } from '../../src/modules/course/course.service.js';
import { TestService } from '../../src/modules/test/test.service.js';
import { PaymentService } from '../../src/modules/payment/payment.service.js';
import { PaymentController } from '../../src/modules/payment/payment.controller.js';
import { createCourseSchema } from '../../src/modules/course/course.validation.js';
import { registerSchema } from '../../src/modules/auth/auth.validation.js';
import redis from '../../src/config/redis.js';
import { dripQueue } from '../../src/queues/index.js';

const db = prisma as any;
async function invoke(handler: any, body = {}, overrides = {}) {
  const res: any = { status: vi.fn().mockReturnThis(), json: vi.fn().mockReturnThis() };
  const next = vi.fn();
  await handler(
    {
      body,
      params: { id: 'quiz', courseId: 'course' },
      query: {},
      userId: 'teacher',
      user: { role: 'teacher' },
      tenantId: 'tenant',
      ...overrides,
    },
    res,
    next
  );
  return { data: res.json.mock.calls[0]?.[0]?.data, next, res };
}
const question = () => ({
  question: 'Which answer is correct?',
  options: [
    { text: 'A', isCorrect: false },
    { text: 'B', isCorrect: true },
  ],
});
const course = () => ({
  id: 'course',
  slug: 'my-course',
  teacherId: 'teacher',
  price: 0,
  sections: [{ id: 'section', lessons: [{ id: 'lesson', duration: 5, dripDays: 1 }] }],
});
beforeEach(() => {
  vi.clearAllMocks();
  for (const model of Object.values(db) as any[]) {
    for (const fn of Object.values(model) as any[]) fn.mockReset();
    model.findMany.mockResolvedValue([]);
    model.count.mockResolvedValue(0);
    model.create.mockImplementation(async ({ data }: any) => ({ id: 'new-id', ...data }));
    model.update.mockImplementation(async ({ data }: any) => ({ id: 'updated-id', ...data }));
  }
});
afterEach(() => vi.unstubAllEnvs());

describe('Quiz authoring, reading and grading', () => {
  it('persists teacher, course, duration, passing score and question IDs', async () => {
    db.course.findFirst.mockResolvedValue(course());
    const result = await invoke(quizzes.createQuiz, {
      title: 'Course quiz',
      type: 'course',
      course: 'course',
      duration: 12,
      passingScore: 75,
      questions: [question()],
    });
    expect(result.next).not.toHaveBeenCalled();
    expect(result.data.quiz).toMatchObject({
      teacherId: 'teacher',
      courseId: 'course',
      timeLimit: 12,
      passingScore: 75,
    });
    expect(result.data.quiz.questions[0].id).toEqual(expect.any(String));
  });
  it('rejects questions without a correct answer', async () => {
    const q = question();
    q.options[1].isCorrect = false;
    const result = await invoke(quizzes.createQuiz, { title: 'Quiz', questions: [q] });
    expect(result.next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 400 }));
    expect(db.quiz.create).not.toHaveBeenCalled();
  });
  it.each(['updateQuiz', 'deleteQuiz', 'getTeacherQuizById'])(
    'prevents another teacher from using %s',
    async (handler) => {
      db.quiz.findUnique.mockResolvedValue({ id: 'quiz', teacherId: 'someone-else' });
      const result = await invoke((quizzes as any)[handler], { title: 'Changed' });
      expect(result.next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 403 }));
      expect(db.quiz.update).not.toHaveBeenCalled();
      expect(db.quiz.delete).not.toHaveBeenCalled();
    }
  );
  it('keeps answer keys in author responses and removes them only from public responses', async () => {
    const quiz = {
      id: 'quiz',
      teacherId: 'teacher',
      questions: [{ ...question(), correctOption: 1, explanation: 'B is right' }],
    };
    db.quiz.findFirst.mockResolvedValue(quiz);
    db.quiz.findUnique.mockResolvedValue(quiz);
    const publicResult = await invoke(quizzes.getQuizById);
    expect(publicResult.data.quiz.questions[0]).not.toHaveProperty('correctOption');
    expect(publicResult.data.quiz.questions[0].options[1]).not.toHaveProperty('isCorrect');
    const authorResult = await invoke(quizzes.getTeacherQuizById);
    expect(authorResult.data.quiz.questions[0].options[1].isCorrect).toBe(true);
  });
  it('grades legacy ID-less questions using the ID returned to the student', async () => {
    db.quiz.findUnique.mockResolvedValue({
      id: 'quiz',
      isPublished: true,
      questions: [question()],
    });
    const result = await invoke(quizzes.submitQuiz, {
      quizId: 'quiz',
      answers: [{ questionId: '0', selectedOption: 1 }],
    });
    expect(result.next).not.toHaveBeenCalled();
    expect(result.data).toMatchObject({ score: 1, percentage: 100, isPassed: true });
  });
  it('rejects duplicate answers instead of allowing scores above 100%', async () => {
    db.quiz.findUnique.mockResolvedValue({
      id: 'quiz',
      isPublished: true,
      questions: [question()],
    });
    const answer = { questionId: '0', selectedOption: 1 };
    const result = await invoke(quizzes.submitQuiz, { quizId: 'quiz', answers: [answer, answer] });
    expect(result.next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 400 }));
    expect(db.quizAttempt.create).not.toHaveBeenCalled();
  });
  it('handles negative option indexes without crashing', async () => {
    db.quiz.findUnique.mockResolvedValue({
      id: 'quiz',
      isPublished: true,
      questions: [question()],
    });
    const result = await invoke(quizzes.submitQuiz, {
      quizId: 'quiz',
      answers: [{ questionId: '0', selectedOption: -1 }],
    });
    expect(result.next).not.toHaveBeenCalled();
    expect(result.data.score).toBe(0);
  });
  it('requires authentication before looking up a course enrollment', async () => {
    db.quiz.findUnique.mockResolvedValue({
      id: 'quiz',
      courseId: 'course',
      isPublished: true,
      questions: [question()],
    });
    const result = await invoke(
      quizzes.submitQuiz,
      { quizId: 'quiz' },
      { userId: undefined, user: undefined }
    );
    expect(result.next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 401 }));
    expect(db.enrollment.findFirst).not.toHaveBeenCalled();
  });
});

describe('Course creation, enrollment and progress', () => {
  it('assigns stable section and lesson IDs when creating and editing a course', async () => {
    const service = new CourseService();
    const input = createCourseSchema.parse({
      title: 'New course',
      description: 'A useful course description',
      sections: [{ title: 'Section', lessons: [{ title: 'Lesson' }] }],
    });
    const created = await service.createCourse(input, 'teacher');
    expect(created.sections[0].id).toEqual(expect.any(String));
    const lessonId = created.sections[0].lessons[0].id;
    expect(lessonId).toEqual(expect.any(String));
    db.course.findFirst.mockResolvedValue(created);
    const updated = await service.updateCourse(created.id, 'teacher', {
      sections: created.sections,
    });
    expect(updated.sections[0].lessons[0].id).toBe(lessonId);
  });
  it('enrolls in a free course and successfully schedules its drip lessons', async () => {
    db.course.findFirst.mockResolvedValue(course());
    const result = await invoke(enrollments.enrollInCourse, { courseId: 'course' });
    expect(result.next).not.toHaveBeenCalled();
    expect(result.data.enrollment.status).toBe('active');
    expect(dripQueue.add).toHaveBeenCalled();
  });
  it('cannot reuse payment from a different course', async () => {
    db.course.findFirst.mockResolvedValue({ ...course(), price: 100 });
    db.payment.findFirst.mockResolvedValue({
      id: 'payment',
      notes: { courseId: 'another-course' },
    });
    const result = await invoke(enrollments.enrollInCourse, {
      courseId: 'course',
      paymentId: 'payment',
    });
    expect(db.payment.findFirst).toHaveBeenCalledWith({
      where: { id: 'payment', userId: 'teacher', status: 'completed' },
    });
    expect(result.next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 400 }));
    expect(db.enrollment.create).not.toHaveBeenCalled();
  });
  it('rejects progress for a lesson outside the course', async () => {
    db.course.findFirst.mockResolvedValue(course());
    db.enrollment.findFirst.mockResolvedValue({
      id: 'enrollment',
      status: 'active',
      completedLessons: [],
    });
    const result = await invoke(enrollments.updateProgress, { lessonId: 'not-a-lesson' });
    expect(result.next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 400 }));
    expect(db.enrollment.update).not.toHaveBeenCalled();
  });
});

describe('Test authoring', () => {
  const repository = () => ({
    findById: vi.fn().mockResolvedValue({
      id: 'test',
      totalMarks: 10,
      passingMarks: 5,
      settings: { teacherId: 'teacher', price: 100 },
    }),
    updateById: vi.fn().mockImplementation(async (_id, data) => data),
    deleteById: vi.fn(),
    getScopedFilter: (filter: any) => filter,
  });
  it('persists settings changes and publish status', async () => {
    const repo = repository();
    const updated = await new TestService(repo as any).updateTest(
      'test',
      { price: 200, maxAttempts: 3, randomizeQuestions: true, status: 'published' } as any,
      'teacher'
    );
    expect(updated).toMatchObject({
      isPublished: true,
      settings: { teacherId: 'teacher', price: 200, maxAttempts: 3, randomizeQuestions: true },
    });
  });
  it('prevents another teacher from editing or deleting a test', async () => {
    const service = new TestService(repository() as any);
    await expect(service.updateTest('test', {}, 'another')).rejects.toThrow('Not authorized');
    await expect(service.deleteTest('test', 'another')).rejects.toThrow('Not authorized');
  });
  it('lists teacher tests with fields actually present in the database', async () => {
    const service = new TestService(repository() as any);
    await service.getTeacherTests('teacher', { status: 'draft' });
    expect(db.test.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { settings: { path: ['teacherId'], equals: 'teacher' }, isPublished: false },
        orderBy: { createdAt: 'desc' },
      })
    );
  });
  it('rejects passing marks greater than the existing total on partial updates', async () => {
    await expect(
      new TestService(repository() as any).updateTest('test', { passingMarks: 11 }, 'teacher')
    ).rejects.toThrow('Passing marks');
  });
});

describe('Mock checkout and registration contracts', () => {
  it('mock test checkout records the purchased test and uses its settings price', async () => {
    vi.stubEnv('NODE_ENV', 'development');
    db.test.findFirst.mockResolvedValue({
      id: 'test',
      title: 'Paid test',
      isPublished: true,
      settings: { price: 100 },
    });
    const result = await invoke(new PaymentController().dummyCheckout, { testId: 'test' });
    expect(result.next).not.toHaveBeenCalled();
    expect(db.test.findFirst).toHaveBeenCalledWith({ where: { id: 'test' } });
    expect(result.data.payment).toMatchObject({
      amount: 118,
      notes: { testId: 'test', basePrice: 100, demo: true },
    });
  });
  it('mock gateway checkout stores the canonical course ID when using a slug', async () => {
    vi.stubEnv('ALLOW_MOCK_PAYMENTS', 'true');
    db.course.findFirst.mockResolvedValue({ ...course(), price: 100 });
    await new PaymentService().createCheckoutOrder('user', 'tenant', { courseId: 'my-course' });
    expect(db.payment.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          notes: expect.objectContaining({ courseId: 'course', testId: null }),
        }),
      })
    );
  });
  it('accepts registration with a strong password and normalizes email', () => {
    const result = registerSchema.parse({
      name: 'Student',
      email: 'STUDENT@example.com',
      password: 'Password123!',
    });
    expect(result.email).toBe('student@example.com');
    expect(result.role).toBe('student');
  });
  it('rejects weak registration passwords and privileged public roles', () => {
    expect(
      registerSchema.safeParse({
        name: 'Student',
        email: 'student@example.com',
        password: '123456',
      }).success
    ).toBe(false);
    expect(
      registerSchema.safeParse({
        name: 'Admin',
        email: 'admin@example.com',
        password: 'Password123!',
        role: 'admin',
      }).success
    ).toBe(false);
  });
});

describe('Registration and login service flow', () => {
  it('registers a user with a hashed password and returns tokens', async () => {
    const repo = {
      findOne: vi.fn().mockResolvedValue(null),
      create: vi.fn().mockImplementation(async (data) => ({ id: 'user', ...data })),
      updateById: vi.fn().mockResolvedValue({
        id: 'user',
        name: 'Student',
        email: 'student@example.com',
        role: 'student',
      }),
    };
    const result = await new AuthService(repo as any).register(
      registerSchema.parse({
        name: 'Student',
        email: 'STUDENT@example.com',
        password: 'Password123!',
      }),
      null,
      null,
      'test-browser'
    );
    expect(repo.create.mock.calls[0][0].password).not.toBe('Password123!');
    expect(result.user.email).toBe('student@example.com');
    expect(result.tokens.accessToken).toEqual(expect.any(String));
  });
  it('rejects duplicate registration', async () => {
    const service = new AuthService({
      findOne: vi.fn().mockResolvedValue({ id: 'existing' }),
    } as any);
    await expect(
      service.register(
        {
          name: 'Student',
          email: 'student@example.com',
          password: 'Password123!',
          role: 'student',
        },
        null,
        null,
        'browser'
      )
    ).rejects.toThrow('already registered');
  });
  it('logs in a verified user and rejects a wrong password', async () => {
    const user = {
      id: 'user',
      email: 'student@example.com',
      name: 'Student',
      role: 'student',
      authProvider: 'local',
      isActive: true,
      isEmailVerified: true,
      password: await hashPassword('Password123!'),
    };
    const repo = {
      findByEmailWithMfa: vi.fn().mockResolvedValue(user),
      updateById: vi.fn().mockResolvedValue(user),
    };
    const service = new AuthService(repo as any);
    await expect(
      service.login({ email: user.email, password: 'WrongPassword1' }, null, 'browser')
    ).rejects.toThrow('Invalid email or password');
    const result = await service.login(
      { email: user.email, password: 'Password123!' },
      null,
      'browser'
    );
    expect(result).toMatchObject({
      user: { id: 'user' },
      tokens: { accessToken: expect.any(String) },
    });
  });
});

describe('Test attempt persistence', () => {
  it('autosaves both answers and palette using supported database fields', async () => {
    db.testAttempt.findFirst.mockResolvedValue({
      id: 'attempt',
      status: 'in_progress',
      answers: [],
      palette: [],
    });
    await new TestService().autoSave('attempt', 'user', {
      answers: [{ questionId: 'question', selectedOptions: [1] }],
      palette: [{ questionId: 'question', status: 'answered' }],
    });
    const data = db.testAttempt.update.mock.calls[0][0].data;
    const fields = new Set(
      Prisma.dmmf.datamodel.models.find((m) => m.name === 'TestAttempt')!.fields.map((f) => f.name)
    );
    expect(Object.keys(data).every((key) => fields.has(key))).toBe(true);
    expect(data.palette).toHaveLength(1);
  });
  it('grades a submitted test and persists its pass result', async () => {
    const attempt = {
      id: 'attempt',
      userId: 'user',
      testId: 'test',
      status: 'in_progress',
      answers: [],
      startedAt: new Date(),
      totalMarks: 2,
    };
    db.testAttempt.findFirst.mockResolvedValue(attempt);
    db.test.findUnique.mockResolvedValue({
      id: 'test',
      duration: 10,
      totalMarks: 2,
      passingMarks: 1,
      questions: [{ ...question(), id: 'question', type: 'mcq', marks: 2, negativeMarks: 0 }],
    });
    db.testAttempt.update.mockImplementation(async ({ data }) => Object.assign(attempt, data));
    db.testAttempt.findUnique.mockResolvedValue(attempt);
    await new TestService().submitTest('attempt', 'user', {
      answers: [{ questionId: 'question', selectedOptions: [1] }],
    });
    expect(attempt).toMatchObject({
      score: 2,
      percentage: 100,
      isPassed: true,
      status: 'completed',
    });
    expect(redis.del).toHaveBeenCalled();
  });
});
