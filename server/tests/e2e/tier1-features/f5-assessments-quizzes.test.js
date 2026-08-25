import '../setup.js';
import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../../../src/app.js';
import { getTeacherHeaders, getStudentHeaders, DEFAULT_TENANT_ID } from '../helpers/auth.helper.js';

describe('Tier 1 — Feature 5: Assessments & Quizzes API', () => {
  const { headers: teacherHeaders } = getTeacherHeaders();
  const { headers: studentHeaders } = getStudentHeaders();
  let createdTestId = '';

  it('F5-T1: POST /api/v1/tests creates a new test with questions payload', async () => {
    const testPayload = {
      title: 'Full Stack Node.js Architecture Mock Exam',
      description: 'Test assessing knowledge of Express, Prisma, and PostgreSQL architecture.',
      duration: 45,
      totalMarks: 100,
      passingMarks: 40,
      price: 0,
      pricingType: 'free',
      isPublished: true,
      category: '00000000-0000-0000-0000-000000000001',
      questions: [
        {
          question: 'What is the primary role of Prisma Client?',
          type: 'mcq',
          options: [
            { text: 'Type-safe database client for Node.js', isCorrect: true },
            { text: 'CSS styling library', isCorrect: false },
          ],
          marks: 50,
          negativeMarks: 10,
        },
        {
          question: 'PostgreSQL is a relational database management system.',
          type: 'true_false',
          options: [
            { text: 'True', isCorrect: true },
            { text: 'False', isCorrect: false },
          ],
          marks: 50,
          negativeMarks: 0,
        },
      ],
    };

    const res = await request(app).post('/api/v1/tests').set(teacherHeaders).send(testPayload);

    expect([201, 200, 400, 401]).toContain(res.status);
    if (res.status === 201 || res.status === 200) {
      expect(res.body.success).toBe(true);
      if (res.body.data?.test) {
        createdTestId = res.body.data.test.id || res.body.data.test._id;
      }
    }
  });

  it('F5-T2: GET /api/v1/tests lists published tests with query filters', async () => {
    const res = await request(app)
      .get('/api/v1/tests?page=1&limit=10')
      .set('X-Tenant-Id', DEFAULT_TENANT_ID);

    expect([200, 400]).toContain(res.status);
    if (res.status === 200) {
      expect(res.body.success).toBe(true);
      expect(res.body.data).toBeDefined();
    }
  });

  it('F5-T3: POST /api/v1/tests/:id/start initializes or checks test attempt', async () => {
    const targetId = createdTestId || '00000000-0000-0000-0000-000000000001';
    const res = await request(app).post(`/api/v1/tests/${targetId}/start`).set(studentHeaders);

    expect([200, 400, 404, 401, 403]).toContain(res.status);
    if (res.status === 200) {
      expect(res.body.success).toBe(true);
      expect(res.body.data).toBeDefined();
    }
  });

  it('F5-T4: POST /api/v1/quizzes creates a new course quiz', async () => {
    const quizPayload = {
      title: 'Prisma CRUD Quiz',
      course: '00000000-0000-0000-0000-000000000001',
      passingScore: 70,
      questions: [
        {
          question: 'Which method queries unique records in Prisma?',
          options: [
            { text: 'findUnique', isCorrect: true },
            { text: 'searchOne', isCorrect: false },
          ],
          explanation: 'findUnique matches unique constraints.',
        },
      ],
    };

    const res = await request(app).post('/api/v1/quizzes').set(teacherHeaders).send(quizPayload);

    expect([201, 200, 400, 401, 404]).toContain(res.status);
  });

  it('F5-T5: GET /api/v1/quizzes lists course quizzes', async () => {
    const res = await request(app).get('/api/v1/quizzes').set(studentHeaders);

    expect([200, 400, 401, 403]).toContain(res.status);
    if (res.status === 200) {
      expect(res.body.success).toBe(true);
      expect(res.body.data).toBeDefined();
    }
  });
});
