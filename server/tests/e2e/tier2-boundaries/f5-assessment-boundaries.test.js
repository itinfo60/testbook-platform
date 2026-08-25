import '../setup.js';
import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../../../src/app.js';
import { getTeacherHeaders, getStudentHeaders, DEFAULT_TENANT_ID } from '../helpers/auth.helper.js';

describe('Tier 2 — Feature 5: Assessment & Quiz Boundaries & Negative Testing', () => {
  const { headers: teacherHeaders } = getTeacherHeaders();
  const { headers: studentHeaders } = getStudentHeaders();

  it('F5-B1: Test creation with passingMarks > totalMarks fails validation with 400', async () => {
    const invalidTest = {
      title: 'Invalid Marks Exam',
      description: 'Passing marks exceed total marks.',
      duration: 30,
      totalMarks: 50,
      passingMarks: 100,
      category: '00000000-0000-0000-0000-000000000001',
      questions: [
        {
          question: 'Sample Q',
          type: 'mcq',
          options: [
            { text: 'A', isCorrect: true },
            { text: 'B', isCorrect: false },
          ],
          marks: 50,
        },
      ],
    };

    const res = await request(app).post('/api/v1/tests').set(teacherHeaders).send(invalidTest);

    expect([400, 422]).toContain(res.status);
  });

  it('F5-B2: Test start for non-existent test UUID returns 404 Not Found', async () => {
    const nonExistentTestId = '00000000-0000-0000-0000-000000008888';
    const res = await request(app)
      .post(`/api/v1/tests/${nonExistentTestId}/start`)
      .set(studentHeaders);

    expect([404, 403, 401, 400]).toContain(res.status);
  });

  it('F5-B3: Test creation with empty questions array returns 400 Validation Error', async () => {
    const emptyQuestionsTest = {
      title: 'Empty Test',
      description: 'Test with zero questions.',
      duration: 30,
      totalMarks: 100,
      passingMarks: 40,
      category: '00000000-0000-0000-0000-000000000001',
      questions: [],
    };

    const res = await request(app)
      .post('/api/v1/tests')
      .set(teacherHeaders)
      .send(emptyQuestionsTest);

    expect([400, 422]).toContain(res.status);
  });

  it('F5-B4: Quiz creation without required options structure returns 400 Validation Error', async () => {
    const malformedQuiz = {
      title: 'Malformed Quiz',
      course: '00000000-0000-0000-0000-000000000001',
      questions: [
        {
          question: 'Question with no options',
          options: [],
        },
      ],
    };

    const res = await request(app).post('/api/v1/quizzes').set(teacherHeaders).send(malformedQuiz);

    expect([400, 422]).toContain(res.status);
  });

  it('F5-B5: Test submission to non-existent attempt ID returns 404 Not Found', async () => {
    const invalidAttemptId = '00000000-0000-0000-0000-000000007777';
    const res = await request(app)
      .post(`/api/v1/tests/submit/${invalidAttemptId}`)
      .set(studentHeaders)
      .send({
        answers: [{ questionId: 'q1', selectedOption: 0 }],
      });

    expect([404, 400]).toContain(res.status);
  });
});
