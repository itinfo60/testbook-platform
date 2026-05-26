import { describe, it, expect, beforeEach, vi } from 'vitest';
import mongoose from 'mongoose';

const mockRedisStore = new Map<string, any>();

vi.mock('../../../src/config/redis.js', () => ({
  default: {
    isConnected: true,
    get: vi.fn(async (key: string) => mockRedisStore.get(key)),
    set: vi.fn(async (key: string, value: any) => {
      mockRedisStore.set(key, value);
      return true;
    }),
    del: vi.fn(async (key: string) => {
      mockRedisStore.delete(key);
      return true;
    }),
    flush: vi.fn(async () => {
      mockRedisStore.clear();
      return true;
    }),
  },
}));

import { TestService } from '../../../src/modules/test/test.service.js';
import Test from '../../../src/modules/test/test.model.js';
import TestAttempt from '../../../src/modules/test/testAttempt.model.js';
import User from '../../../src/modules/user/user.model.js';
import Enrollment from '../../../src/modules/enrollment/enrollment.model.js';
import redis from '../../../src/config/redis.js';
import { runWithTenant } from '../../../src/core/tenant.context.js';
import { ApiError } from '../../../src/core/api-error.js';

describe('TestEngine, Question & TestAttempt Services', () => {
  let testService: TestService;
  const mockTenantId = new mongoose.Types.ObjectId().toString();
  const teacherId = new mongoose.Types.ObjectId();
  const categoryId = new mongoose.Types.ObjectId();
  const studentId = new mongoose.Types.ObjectId();

  beforeEach(async () => {
    testService = new TestService();
    await Test.deleteMany({});
    await TestAttempt.deleteMany({});
    await User.deleteMany({});
    await Enrollment.deleteMany({});
    await redis.flush();
    vi.clearAllMocks();
  });

  describe('Test Creation & Updates', () => {
    it('should create a test successfully with slug generation', async () => {
      const test = await runWithTenant(mockTenantId, false, async () => {
        return testService.createTest(
          {
            title: 'JEE Physics Advanced Mock',
            description: 'Advanced Physics questions with negative marking rules',
            category: categoryId.toString(),
            duration: 180,
            totalMarks: 12,
            passingMarks: 6,
            questions: [
              {
                question: 'What is the speed of light?',
                type: 'mcq',
                marks: 4,
                negativeMarks: 1,
                sectionName: 'Physics',
                order: 0,
                options: [
                  { text: '3x10^8 m/s', isCorrect: true },
                  { text: '2x10^8 m/s', isCorrect: false },
                ],
              },
            ],
          },
          teacherId.toString()
        );
      });

      expect(test.title).toBe('JEE Physics Advanced Mock');
      expect(test.slug.startsWith('jee-physics-advanced-mock')).toBe(true);
      expect(test.questionsCount).toBe(1);
      expect(test.questions[0].sectionName).toBe('Physics');
    });
  });

  describe('Active Attempt Limits & Resume', () => {
    it('should enforce strict limit of one active session across all tests', async () => {
      // 1. Create two tests
      const [test1, test2] = await runWithTenant(mockTenantId, false, async () => {
        const t1 = await testService.createTest(
          {
            title: 'Mathematics Test 01',
            category: categoryId.toString(),
            duration: 60,
            totalMarks: 10,
            passingMarks: 4,
            isPublished: true,
            status: 'published',
            questions: [
              {
                question: 'Q1',
                type: 'mcq',
                marks: 10,
                negativeMarks: 0,
                sectionName: 'Math',
                order: 0,
              },
            ],
          },
          teacherId.toString()
        );
        const t2 = await testService.createTest(
          {
            title: 'Chemistry Test 02',
            category: categoryId.toString(),
            duration: 60,
            totalMarks: 10,
            passingMarks: 4,
            isPublished: true,
            status: 'published',
            questions: [
              {
                question: 'Q1',
                type: 'mcq',
                marks: 10,
                negativeMarks: 0,
                sectionName: 'Chem',
                order: 0,
              },
            ],
          },
          teacherId.toString()
        );
        return [t1, t2];
      });

      // 2. Start Test 1
      await runWithTenant(mockTenantId, false, async () => {
        const startResult = await testService.startTest(test1._id.toString(), studentId.toString());
        expect(startResult.attempt._id).toBeDefined();
      });

      // 3. Start Test 2 - should be blocked
      await expect(
        runWithTenant(mockTenantId, false, async () => {
          await testService.startTest(test2._id.toString(), studentId.toString());
        })
      ).rejects.toThrow(
        'You have another test attempt in progress. Please complete or submit that test first.'
      );

      // 4. Start Test 1 again - should resume without throwing
      await runWithTenant(mockTenantId, false, async () => {
        const resumeResult = await testService.startTest(
          test1._id.toString(),
          studentId.toString()
        );
        expect(resumeResult.attempt.attemptNumber).toBe(1);
      });
    });
  });

  describe('Auto-Save & Redis Write-Behind', () => {
    it('should save to Redis instantly and trigger a background update to MongoDB', async () => {
      const test = await runWithTenant(mockTenantId, false, async () => {
        return testService.createTest(
          {
            title: 'Mock Test For AutoSave',
            category: categoryId.toString(),
            duration: 60,
            totalMarks: 10,
            passingMarks: 4,
            isPublished: true,
            status: 'published',
            questions: [
              {
                question: 'Question 1',
                type: 'mcq',
                marks: 10,
                negativeMarks: 0,
                sectionName: 'General',
                order: 0,
              },
            ],
          },
          teacherId.toString()
        );
      });

      const startResult = await runWithTenant(mockTenantId, false, async () => {
        return testService.startTest(test._id.toString(), studentId.toString());
      });

      const attemptId = startResult.attempt._id;
      const qId = startResult.questions[0]._id.toString();

      await runWithTenant(mockTenantId, false, async () => {
        const autoSaveResult = await testService.autoSave(attemptId, studentId.toString(), {
          answers: [{ questionId: qId, selectedOptions: [0], textAnswer: '', timeTaken: 12 }],
          palette: [{ questionId: qId, status: 'answered' }],
        });

        expect(autoSaveResult.savedAnswersCount).toBe(1);
        expect(autoSaveResult.savedPaletteCount).toBe(1);
      });

      // Assert Redis client was called
      expect(redis.set).toHaveBeenCalled();

      // Check Redis cache contents
      const cacheVal = await redis.get(`tenant:test-attempt:${attemptId}:answers`);
      expect(cacheVal).toBeDefined();
      expect(cacheVal.answers[qId].selectedOptions).toEqual([0]);
      expect(cacheVal.palette[0].status).toBe('answered');
    });
  });

  describe('Screen Violation Monitoring', () => {
    it('should increment violations and auto-submit when limit is reached', async () => {
      const test = await runWithTenant(mockTenantId, false, async () => {
        return testService.createTest(
          {
            title: 'Mock Test Violation',
            category: categoryId.toString(),
            duration: 60,
            totalMarks: 10,
            passingMarks: 4,
            isPublished: true,
            status: 'published',
            questions: [
              {
                question: 'Q1',
                type: 'mcq',
                marks: 10,
                negativeMarks: 0,
                sectionName: 'General',
                order: 0,
              },
            ],
          },
          teacherId.toString()
        );
      });

      const startResult = await runWithTenant(mockTenantId, false, async () => {
        return testService.startTest(test._id.toString(), studentId.toString());
      });

      const attemptId = startResult.attempt._id;

      // Trigger violations up to 4
      await runWithTenant(mockTenantId, false, async () => {
        for (let i = 0; i < 4; i++) {
          const res = await testService.logViolation(attemptId, studentId.toString());
          expect(res.windowViolations).toBe(i + 1);
          expect(res.autoSubmitted).toBe(false);
        }
      });

      // 5th violation should trigger auto-submit
      const res5 = await runWithTenant(mockTenantId, false, async () => {
        return testService.logViolation(attemptId, studentId.toString());
      });
      expect(res5.windowViolations).toBe(5);
      expect(res5.autoSubmitted).toBe(true);

      const dbAttempt = await runWithTenant(mockTenantId, false, async () => {
        return TestAttempt.findById(attemptId);
      });
      expect(dbAttempt?.status).toBe('timed_out');
    });
  });

  describe('Authoritative Submission & Objective Grading', () => {
    it('should score MCQ, MSQ, TF, and Fill Blank correctly and reject past timer limit', async () => {
      const test = await runWithTenant(mockTenantId, false, async () => {
        return testService.createTest(
          {
            title: 'Full Grading Exam',
            category: categoryId.toString(),
            duration: 60,
            totalMarks: 16,
            passingMarks: 8,
            isPublished: true,
            status: 'published',
            questions: [
              {
                question: 'MCQ Question',
                type: 'mcq',
                marks: 4,
                negativeMarks: 1,
                sectionName: 'Physics',
                order: 0,
                options: [
                  { text: 'Wrong', isCorrect: false },
                  { text: 'Right', isCorrect: true },
                ],
              },
              {
                question: 'MSQ Question',
                type: 'msq',
                marks: 4,
                negativeMarks: 1,
                sectionName: 'Chemistry',
                order: 1,
                options: [
                  { text: 'Right A', isCorrect: true },
                  { text: 'Wrong B', isCorrect: false },
                  { text: 'Right C', isCorrect: true },
                ],
              },
              {
                question: 'True False',
                type: 'true_false',
                marks: 4,
                negativeMarks: 1,
                sectionName: 'Chemistry',
                order: 2,
                options: [
                  { text: 'True', isCorrect: true },
                  { text: 'False', isCorrect: false },
                ],
              },
              {
                question: 'Fill Blank',
                type: 'fill_blank',
                marks: 4,
                negativeMarks: 0,
                sectionName: 'General',
                order: 3,
                correctAnswer: 'Einstein',
              },
            ],
          },
          teacherId.toString()
        );
      });

      const startResult = await runWithTenant(mockTenantId, false, async () => {
        return testService.startTest(test._id.toString(), studentId.toString());
      });

      const attemptId = startResult.attempt._id;
      const qIds = startResult.questions.map((q) => q._id.toString());

      // Prepare submission responses
      const submitData = {
        answers: [
          { questionId: qIds[0], selectedOptions: [1], textAnswer: '' }, // MCQ Correct (+4)
          { questionId: qIds[1], selectedOptions: [0, 2], textAnswer: '' }, // MSQ Correct (+4)
          { questionId: qIds[2], selectedOptions: [1], textAnswer: '' }, // TF Incorrect (-1)
          { questionId: qIds[3], selectedOptions: [], textAnswer: 'Einstein' }, // Fill Blank Correct (+4)
        ],
      };

      const submitResult = await runWithTenant(mockTenantId, false, async () => {
        return testService.submitTest(attemptId, studentId.toString(), submitData);
      });

      // Total expected score: 4 + 4 - 1 + 4 = 11 Marks
      expect(submitResult.attempt.score).toBe(11);
      expect(submitResult.attempt.totalMarks).toBe(16);
      expect(submitResult.attempt.isPassed).toBe(true);
      expect(submitResult.attempt.gradingStatus).toBe('auto_graded');
      expect(submitResult.stats.correct).toBe(3);
      expect(submitResult.stats.incorrect).toBe(1);

      // Section analytics verification
      const physicsSec = submitResult.stats.sectionAnalytics['Physics'];
      const chemSec = submitResult.stats.sectionAnalytics['Chemistry'];
      expect(physicsSec.marksObtained).toBe(4);
      expect(chemSec.marksObtained).toBe(3); // +4 - 1
    });

    it('should reject submission if timer exceeds allowed limit + grace', async () => {
      const test = await runWithTenant(mockTenantId, false, async () => {
        return testService.createTest(
          {
            title: 'Timed Exam',
            category: categoryId.toString(),
            duration: 1, // 1 minute duration
            totalMarks: 10,
            passingMarks: 5,
            isPublished: true,
            status: 'published',
            questions: [
              {
                question: 'Q',
                type: 'mcq',
                marks: 10,
                negativeMarks: 0,
                sectionName: 'General',
                order: 0,
              },
            ],
          },
          teacherId.toString()
        );
      });

      const startResult = await runWithTenant(mockTenantId, false, async () => {
        return testService.startTest(test._id.toString(), studentId.toString());
      });

      const attemptId = startResult.attempt._id;

      // Force startedAt back 5 minutes (exceeding 1 minute limit + grace)
      await TestAttempt.updateOne(
        { _id: attemptId },
        { $set: { startedAt: new Date(Date.now() - 5 * 60000) } }
      );

      await expect(
        runWithTenant(mockTenantId, false, async () => {
          await testService.submitTest(attemptId, studentId.toString(), {
            answers: [
              { questionId: startResult.questions[0]._id.toString(), selectedOptions: [0] },
            ],
          });
        })
      ).rejects.toThrow('Time limit exceeded. The test has been automatically submitted.');

      const attemptDB = await TestAttempt.findById(attemptId);
      expect(attemptDB?.status).toBe('timed_out');
    });
  });

  describe('Subjective / Essay Type Manual Grading', () => {
    it('should set pending status initially, and allow manual score input from teachers', async () => {
      const test = await runWithTenant(mockTenantId, false, async () => {
        return testService.createTest(
          {
            title: 'Subjective Exam',
            category: categoryId.toString(),
            duration: 60,
            totalMarks: 20,
            passingMarks: 10,
            isPublished: true,
            status: 'published',
            questions: [
              {
                question: 'Explain quantum superposition.',
                type: 'subjective',
                marks: 20,
                negativeMarks: 0,
                sectionName: 'Quantum',
                order: 0,
              },
            ],
          },
          teacherId.toString()
        );
      });

      const startResult = await runWithTenant(mockTenantId, false, async () => {
        return testService.startTest(test._id.toString(), studentId.toString());
      });

      const attemptId = startResult.attempt._id;
      const essayQId = startResult.questions[0]._id.toString();

      // Submit
      const submitResult = await runWithTenant(mockTenantId, false, async () => {
        return testService.submitTest(attemptId, studentId.toString(), {
          answers: [
            {
              questionId: essayQId,
              textAnswer: 'Superposition means a particle is in multiple states at once...',
            },
          ],
        });
      });

      // Score should be 0 and status should be pending manual grade
      expect(submitResult.attempt.score).toBe(0);
      expect(submitResult.attempt.gradingStatus).toBe('pending_manual');
      expect(submitResult.attempt.isPassed).toBe(false);

      // Now teacher grades it with 15 Marks
      const gradeResult = await runWithTenant(mockTenantId, false, async () => {
        return testService.gradeSubjective(attemptId, teacherId.toString(), {
          questionId: essayQId,
          marksObtained: 15,
        });
      });

      expect(gradeResult.score).toBe(15);
      expect(gradeResult.isPassed).toBe(true);
      expect(gradeResult.gradingStatus).toBe('manually_graded');
    });
  });
});
