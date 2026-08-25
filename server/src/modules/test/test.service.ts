import { v4 as uuidv4 } from 'uuid';
import { BaseService } from '../../core/base.service.js';
import {
  ITest,
  ITestAttempt,
  ICreateTestDto,
  IUpdateTestDto,
  IAutoSaveDto,
  ISubmitTestDto,
  IGradeSubjectiveDto,
} from './test.dto.js';
import TestRepository from './test.repository.js';
import TestAttemptRepository from './testAttempt.repository.js';
import { ApiError } from '../../core/api-error.js';
import redis from '../../config/redis.js';
import logger from '../../utils/logger.js';
import prisma from '../../config/prisma.js';

export class TestService extends BaseService<ITest, TestRepository> {
  private readonly attemptRepository: TestAttemptRepository;

  constructor(
    repository: TestRepository = new TestRepository(),
    attemptRepository: TestAttemptRepository = new TestAttemptRepository()
  ) {
    super(repository);
    this.attemptRepository = attemptRepository;
  }

  async createTest(data: ICreateTestDto, teacherId: string): Promise<ITest> {
    const questions = (data.questions || []).map((q, idx) => ({
      ...q,
      id: q.id || uuidv4(),
      order: q.order ?? idx,
      sectionName: q.sectionName || 'General',
      marks: Number(q.marks) || 1,
      negativeMarks: Number(q.negativeMarks) || 0,
    }));

    const settings = {
      isFree: data.isFree ?? true,
      price: data.price ?? 0,
      difficulty: data.difficulty || 'intermediate',
      instructions: data.instructions || '',
      randomizeQuestions: data.randomizeQuestions ?? false,
      randomizeOptions: data.randomizeOptions ?? false,
      teacherId: (data as any).teacherId || teacherId,
    };

    const created = await this.repository.create({
      title: data.title,
      description: data.description || '',
      duration: Number(data.duration) || 60,
      totalMarks: Number(data.totalMarks) || 100,
      totalQuestions: questions.length,
      passingMarks: Number(data.passingMarks) || 0,
      isPublished:
        data.isPublished !== undefined ? Boolean(data.isPublished) : data.status === 'published',
      categoryId: (data as any).categoryId || (data as any).category || null,
      questions,
      settings,
    } as any);

    const seriesId = (data as any).testSeriesId || (data as any).testSeries;
    if (seriesId && created?.id) {
      try {
        const series = await prisma.testSeries.findUnique({ where: { id: seriesId } });
        if (series && Array.isArray(series.tests) && !series.tests.includes(created.id)) {
          await prisma.testSeries.update({
            where: { id: seriesId },
            data: { tests: [...series.tests, created.id] },
          });
        }
      } catch (err) {
        console.warn('Failed to associate test with series:', err);
      }
    }

    return created;
  }

  async updateTest(
    id: string,
    data: IUpdateTestDto,
    teacherId: string,
    isAdmin = false
  ): Promise<ITest | null> {
    const test = await this.repository.findById(id);
    if (!test) {
      throw ApiError.notFound('Test not found or unauthorized');
    }

    const updateData: any = {};
    if (data.title) updateData.title = data.title;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.duration !== undefined) updateData.duration = Number(data.duration);
    if (data.totalMarks !== undefined) updateData.totalMarks = Number(data.totalMarks);
    if (data.passingMarks !== undefined) updateData.passingMarks = Number(data.passingMarks);
    if (data.isPublished !== undefined) updateData.isPublished = Boolean(data.isPublished);
    if ((data as any).categoryId || (data as any).category) {
      updateData.categoryId = (data as any).categoryId || (data as any).category;
    }
    if (data.questions) {
      updateData.questions = data.questions.map((q: any, idx: number) => ({
        ...q,
        id: q.id || uuidv4(),
        order: q.order || idx,
      }));
      updateData.totalQuestions = updateData.questions.length;
    }

    const updated = await this.repository.updateById(id, updateData);

    const seriesId = (data as any).testSeriesId || (data as any).testSeries;
    if (seriesId && id) {
      try {
        const series = await prisma.testSeries.findUnique({ where: { id: seriesId } });
        if (series && Array.isArray(series.tests) && !series.tests.includes(id)) {
          await prisma.testSeries.update({
            where: { id: seriesId },
            data: { tests: [...series.tests, id] },
          });
        }
      } catch (err) {
        console.warn('Failed to associate test with series:', err);
      }
    }

    return updated;
  }

  async deleteTest(id: string, teacherId: string): Promise<ITest | null> {
    const test = await this.repository.findById(id);
    if (!test) {
      throw ApiError.notFound('Test not found');
    }
    return this.repository.deleteById(id);
  }

  async getTests(query: any, userId?: string) {
    const filter: any = { isPublished: true };

    if (query.category) {
      filter.categoryId = query.category;
    }
    if (query.testSeries) {
      filter.testSeriesId = query.testSeries;
    }
    if (query.difficulty) {
      filter.difficulty = query.difficulty;
    }
    if (query.search) {
      filter.title = { contains: query.search, mode: 'insensitive' };
    }

    const page = parseInt(query.page || '1', 10);
    const limit = parseInt(query.limit || '10', 10);
    const skip = (page - 1) * limit;

    const where = this.repository['getScopedFilter'](filter);

    const [docs, total] = await Promise.all([
      prisma.test.findMany({
        where,
        include: {
          category: { select: { name: true, slug: true } },
        },
        skip,
        take: limit,
      }),
      prisma.test.count({ where }),
    ]);

    let results = docs.map((doc: any) => ({
      ...doc,
      isPurchased: true, // Default to true if free
    }));

    return { docs: results, page, limit, total };
  }

  async getTestById(id: string, userId?: string) {
    const test = (await prisma.test.findFirst({
      where: this.repository['getScopedFilter']({ id }),
      include: {
        category: { select: { name: true, slug: true } },
      },
    })) as any;

    if (!test || (!test.isPublished && (!userId || test.teacherId !== userId))) {
      throw ApiError.notFound('Test not found');
    }

    // Strip answers if not teacher or if not already graded
    if (!userId || test.teacherId !== userId) {
      if (test.questions) {
        let qs = typeof test.questions === 'string' ? JSON.parse(test.questions) : test.questions;
        test.questions = qs.map((q: any) => {
          const strippedOptions = q.options?.map((o: any) => ({ id: o.id, text: o.text }));
          const { correctAnswer, explanation, ...rest } = q;
          return { ...rest, options: strippedOptions };
        });
      }
    }

    let attemptCount = 0;
    let isPurchased = test.isFree;
    let activeAttempt = null;

    if (userId) {
      attemptCount = await prisma.testAttempt.count({
        where: {
          userId,
          testId: test.id,
          status: 'completed',
        },
      });

      activeAttempt = await prisma.testAttempt.findFirst({
        where: {
          userId,
          testId: test.id,
          status: 'in_progress',
        },
      });

      isPurchased = Boolean(
        test.isFree || (test.settings && (test.settings as any).isFree !== false)
      );
    }

    return { test, attemptCount, isPurchased, activeAttempt };
  }

  async startTest(testId: string, userId: string) {
    const test = (await prisma.test.findFirst({
      where: this.repository['getScopedFilter']({ id: testId }),
    })) as any;

    if (!test || !test.isPublished) {
      throw ApiError.notFound('Test not found or not published');
    }

    const activeAttemptAcrossTests = (await prisma.testAttempt.findFirst({
      where: {
        userId,
        status: 'in_progress',
      },
    })) as any;

    if (activeAttemptAcrossTests && activeAttemptAcrossTests.testId !== testId) {
      await this.submitAttemptDirect(activeAttemptAcrossTests, true);
    }

    const isResumingThisTest =
      activeAttemptAcrossTests && activeAttemptAcrossTests.testId === testId;
    if (!isResumingThisTest && test.maxAttempts > 0) {
      const attemptsCount = await prisma.testAttempt.count({
        where: {
          userId,
          testId: test.id,
          status: 'completed',
        },
      });
      if (attemptsCount >= test.maxAttempts) {
        throw ApiError.forbidden(`Maximum attempts (${test.maxAttempts}) reached for this test.`);
      }
    }

    let attempt = activeAttemptAcrossTests;

    if (!attempt) {
      const attemptCount = await prisma.testAttempt.count({
        where: {
          userId,
          testId: test.id,
        },
      });

      attempt = (await prisma.testAttempt.create({
        data: {
          userId,
          testId: test.id,
          totalMarks: test.totalMarks,
          attemptNumber: attemptCount + 1,
          tenantId: test.tenantId,
          status: 'in_progress',
          answers: [],
          palette: [],
        },
      })) as any;
    }

    let testQuestions =
      typeof test.questions === 'string' ? JSON.parse(test.questions) : test.questions;
    let questions = testQuestions.map((q: any) => ({
      id: q.id,
      question: q.question,
      type: q.type,
      options: q.options ? q.options.map((o: any) => ({ id: o.id, text: o.text })) : [],
      marks: q.marks,
      negativeMarks: q.negativeMarks,
      sectionName: q.sectionName,
      order: q.order,
    }));

    if (test.randomizeQuestions) {
      const sectionsMap = new Map<string, typeof questions>();
      questions.forEach((q: any) => {
        const sec = q.sectionName || 'General';
        if (!sectionsMap.has(sec)) sectionsMap.set(sec, []);
        sectionsMap.get(sec)!.push(q);
      });

      questions = [];
      Array.from(sectionsMap.keys())
        .sort()
        .forEach((secName) => {
          const secQuestions = sectionsMap.get(secName)!;
          for (let i = secQuestions.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [secQuestions[i], secQuestions[j]] = [secQuestions[j], secQuestions[i]];
          }
          questions.push(...secQuestions);
        });

      if (test.randomizeOptions) {
        questions = questions.map((q: any) => {
          if (!q.options || q.options.length === 0) return q;
          const opts = [...q.options];
          for (let i = opts.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [opts[i], opts[j]] = [opts[j], opts[i]];
          }
          return { ...q, options: opts };
        });
      }
    }

    const redisKey = `tenant:test-attempt:${attempt.id}:answers`;
    const cachedAnswersRaw = await redis.get(redisKey);
    const cachedAnswers =
      typeof cachedAnswersRaw === 'string' ? JSON.parse(cachedAnswersRaw) : cachedAnswersRaw;

    let savedAnswers: any = {};
    let savedPalette: any = [];

    if (cachedAnswers) {
      savedAnswers = cachedAnswers.answers || {};
      savedPalette = cachedAnswers.palette || [];
    } else {
      let attemptAnswers =
        typeof attempt.answers === 'string' ? JSON.parse(attempt.answers) : attempt.answers;
      let attemptPalette =
        typeof attempt.palette === 'string' ? JSON.parse(attempt.palette) : attempt.palette;

      if (Array.isArray(attemptAnswers)) {
        attemptAnswers.forEach((a: any) => {
          savedAnswers[a.questionId] = {
            selectedOptions: a.selectedOptions,
            textAnswer: a.textAnswer,
            timeTaken: a.timeTaken,
          };
        });
      }
      if (Array.isArray(attemptPalette)) {
        savedPalette = attemptPalette.map((p: any) => ({
          questionId: p.questionId,
          status: p.status,
        }));
      }
    }

    return {
      attempt: {
        id: attempt.id,
        startedAt: attempt.startedAt,
        attemptNumber: attempt.attemptNumber,
        windowViolations: attempt.windowViolations,
      },
      questions,
      savedAnswers,
      savedPalette,
      duration: test.duration,
      totalMarks: test.totalMarks,
      title: test.title,
      instructions: test.instructions,
    };
  }

  async autoSave(attemptId: string, userId: string, data: IAutoSaveDto) {
    const attempt = (await prisma.testAttempt.findFirst({
      where: { id: attemptId, userId },
    })) as any;

    if (!attempt) {
      throw ApiError.notFound('Test attempt not found');
    }

    if (attempt.status !== 'in_progress') {
      return { savedAnswersCount: 0, savedPaletteCount: 0, alreadyCompleted: true };
    }

    const redisKey = `tenant:test-attempt:${attemptId}:answers`;

    const newAnswersMap = new Map(data.answers.map((a) => [a.questionId, a]));
    const newPaletteMap = new Map(data.palette?.map((p) => [p.questionId, p]) || []);

    let attemptAnswers =
      typeof attempt.answers === 'string' ? JSON.parse(attempt.answers) : attempt.answers;
    let attemptPalette =
      typeof attempt.palette === 'string' ? JSON.parse(attempt.palette) : attempt.palette;

    if (!Array.isArray(attemptAnswers)) attemptAnswers = [];
    if (!Array.isArray(attemptPalette)) attemptPalette = [];

    attemptAnswers.forEach((a: any) => {
      const match = newAnswersMap.get(a.questionId);
      if (match) {
        a.selectedOptions = match.selectedOptions;
        a.textAnswer = match.textAnswer;
        a.timeTaken = match.timeTaken || 0;
        newAnswersMap.delete(a.questionId);
      }
    });

    newAnswersMap.forEach((val) => {
      attemptAnswers.push({
        questionId: val.questionId,
        selectedOptions: val.selectedOptions,
        textAnswer: val.textAnswer,
        timeTaken: val.timeTaken || 0,
        isCorrect: false,
        marksObtained: 0,
      });
    });

    attemptPalette.forEach((p: any) => {
      const match = newPaletteMap.get(p.questionId);
      if (match) {
        p.status = match.status;
        newPaletteMap.delete(p.questionId);
      }
    });

    newPaletteMap.forEach((val) => {
      attemptPalette.push({
        questionId: val.questionId,
        status: val.status,
      });
    });

    const cacheObj = {
      answers: attemptAnswers.reduce((map: any, a: any) => {
        map[a.questionId] = {
          selectedOptions: a.selectedOptions,
          textAnswer: a.textAnswer,
          timeTaken: a.timeTaken,
        };
        return map;
      }, {}),
      palette: attemptPalette.map((p: any) => ({
        questionId: p.questionId,
        status: p.status,
      })),
    };
    await redis.set(redisKey, JSON.stringify(cacheObj), 7200);

    prisma.testAttempt
      .update({
        where: { id: attempt.id },
        data: { answers: attemptAnswers, palette: attemptPalette },
      })
      .catch((err) => {
        logger.error(
          `[Redis Write-Behind Error] Failed to flush autoSave for attempt ${attemptId}:`,
          err.message
        );
      });

    return { savedAnswersCount: data.answers.length, savedPaletteCount: data.palette?.length || 0 };
  }

  async logViolation(attemptId: string, userId: string) {
    const attempt = (await prisma.testAttempt.findFirst({
      where: { id: attemptId, userId },
    })) as any;

    if (!attempt) {
      throw ApiError.notFound('Test attempt not found');
    }

    if (attempt.status !== 'in_progress') {
      return { windowViolations: attempt.windowViolations, autoSubmitted: true };
    }

    attempt.windowViolations += 1;
    let autoSubmitted = false;

    if (attempt.windowViolations >= 5) {
      await this.submitAttemptDirect(attempt, true);
      autoSubmitted = true;
    } else {
      await prisma.testAttempt.update({
        where: { id: attempt.id },
        data: { windowViolations: attempt.windowViolations },
      });
    }

    return { windowViolations: attempt.windowViolations, autoSubmitted };
  }

  private async submitAttemptDirect(attempt: any, timedOutOrViolated = false) {
    const test = (await prisma.test.findUnique({ where: { id: attempt.testId } })) as any;
    if (!test) {
      throw ApiError.notFound('Test not found for this attempt');
    }

    const redisKey = `tenant:test-attempt:${attempt.id}:answers`;
    const cachedDataRaw = await redis.get(redisKey);
    const cachedData =
      typeof cachedDataRaw === 'string' ? JSON.parse(cachedDataRaw) : cachedDataRaw;

    let attemptAnswers =
      typeof attempt.answers === 'string' ? JSON.parse(attempt.answers) : attempt.answers;
    if (!Array.isArray(attemptAnswers)) attemptAnswers = [];

    let finalAnswers = attemptAnswers;
    let testQuestions =
      typeof test.questions === 'string' ? JSON.parse(test.questions) : test.questions;
    if (!Array.isArray(testQuestions)) testQuestions = [];

    if (cachedData && cachedData.answers) {
      const cachedAnswersMap = cachedData.answers;
      const mergedAnswers: any[] = [];
      testQuestions.forEach((q: any) => {
        const qId = q.id;
        const cached = cachedAnswersMap[qId];
        const existing = attemptAnswers.find((a: any) => a.questionId === qId);

        mergedAnswers.push({
          questionId: q.id,
          selectedOptions: cached?.selectedOptions || existing?.selectedOptions || [],
          textAnswer: cached?.textAnswer || existing?.textAnswer || '',
          timeTaken: cached?.timeTaken || existing?.timeTaken || 0,
          isCorrect: false,
          marksObtained: 0,
        });
      });
      finalAnswers = mergedAnswers;
    }

    let totalScore = 0;
    let containsSubjective = false;

    const gradedAnswers = finalAnswers.map((answer: any) => {
      const question = testQuestions.find((q: any) => q.id === answer.questionId);
      if (!question) return answer;

      let isCorrect = false;
      let marksObtained = 0;

      if (question.type === 'mcq' || question.type === 'true_false') {
        const selected = answer.selectedOptions?.[0];
        const correctIndex = question.options?.findIndex((o: any) => o.isCorrect);
        isCorrect = selected !== undefined && selected === correctIndex;
      } else if (question.type === 'msq') {
        const correctIndices =
          question.options
            ?.map((o: any, i: number) => (o.isCorrect ? i : -1))
            .filter((i: number) => i !== -1)
            .sort() || [];
        const selectedSorted = [...(answer.selectedOptions || [])].sort();
        isCorrect = JSON.stringify(correctIndices) === JSON.stringify(selectedSorted);
      } else if (question.type === 'fill_blank') {
        isCorrect =
          answer.textAnswer?.trim().toLowerCase() === question.correctAnswer?.trim().toLowerCase();
      } else if (question.type === 'subjective') {
        containsSubjective = true;
      }

      if (question.type !== 'subjective') {
        const qMarks = Number(question.marks) || 0;
        const qNegMarks = Number(question.negativeMarks) || 0;
        if (isCorrect) {
          marksObtained = qMarks;
        } else if (
          (answer.selectedOptions && answer.selectedOptions.length > 0) ||
          answer.textAnswer
        ) {
          marksObtained = -qNegMarks;
        }
      } else {
        marksObtained = 0;
      }

      totalScore += marksObtained;

      return {
        questionId: answer.questionId,
        selectedOptions: answer.selectedOptions,
        textAnswer: answer.textAnswer,
        timeTaken: answer.timeTaken,
        isCorrect,
        marksObtained,
      };
    });

    attempt.answers = gradedAnswers;
    attempt.score = Math.max(0, totalScore);
    attempt.percentage =
      test.totalMarks > 0 ? Math.round((attempt.score / test.totalMarks) * 100) : 0;
    attempt.isPassed = attempt.score >= test.passingMarks;
    attempt.status = timedOutOrViolated ? 'timed_out' : 'completed';
    attempt.completedAt = new Date();
    attempt.timeTaken = Math.round(
      (attempt.completedAt.getTime() - attempt.startedAt.getTime()) / 1000
    );
    attempt.gradingStatus = containsSubjective ? 'pending_manual' : 'auto_graded';

    await prisma.testAttempt.update({
      where: { id: attempt.id },
      data: {
        answers: attempt.answers,
        score: attempt.score,
        percentage: attempt.percentage,
        isPassed: attempt.isPassed,
        status: attempt.status,
        completedAt: attempt.completedAt,
        timeTaken: attempt.timeTaken,
        gradingStatus: attempt.gradingStatus,
      },
    });

    await redis.del(redisKey);

    const allAttempts = (await prisma.testAttempt.findMany({
      where: { testId: test.id, status: 'completed' },
    })) as any[];
    if (allAttempts.length > 0) {
      const avgScore = allAttempts.reduce((sum, a) => sum + a.percentage, 0) / allAttempts.length;
      const passCount = allAttempts.filter((a) => a.isPassed).length;

      await prisma.test.update({
        where: { id: test.id },
        data: {
          totalAttempts: allAttempts.length,
          averageScore: Math.round(avgScore),
          passRate: Math.round((passCount / allAttempts.length) * 100),
        },
      });
    }

    await prisma.user.update({
      where: { id: attempt.userId },
      data: {
        totalTestsTaken: { increment: 1 },
        totalPoints: { increment: attempt.isPassed ? 10 : 2 },
      },
    });

    return attempt;
  }

  async submitTest(attemptId: string, userId: string, data: ISubmitTestDto) {
    const attempt = (await prisma.testAttempt.findFirst({
      where: { id: attemptId, userId },
    })) as any;

    if (!attempt) {
      throw ApiError.notFound('Test attempt not found');
    }

    if (attempt.status !== 'in_progress') {
      const test = (await prisma.test.findUnique({ where: { id: attempt.testId } })) as any;
      if (!test) throw ApiError.notFound('Test not found');

      let attemptAnswers =
        typeof attempt.answers === 'string' ? JSON.parse(attempt.answers) : attempt.answers;
      let testQuestions =
        typeof test.questions === 'string' ? JSON.parse(test.questions) : test.questions;
      if (!Array.isArray(attemptAnswers)) attemptAnswers = [];
      if (!Array.isArray(testQuestions)) testQuestions = [];

      const correctCount = attemptAnswers.filter((a: any) => a.isCorrect).length;
      const incorrectCount = attemptAnswers.filter(
        (a: any) =>
          !a.isCorrect && ((a.selectedOptions && a.selectedOptions.length > 0) || a.textAnswer)
      ).length;
      const unansweredCount = testQuestions.length - correctCount - incorrectCount;
      const elapsedSeconds = attempt.completedAt
        ? (new Date(attempt.completedAt).getTime() - new Date(attempt.startedAt).getTime()) / 1000
        : 0;

      return {
        attemptId: attempt.id,
        score: attempt.score || 0,
        totalMarks: test.totalMarks,
        passed: (attempt.score || 0) >= test.passingMarks,
        stats: {
          correct: correctCount,
          incorrect: incorrectCount,
          unanswered: unansweredCount,
          percentile: 0,
        },
        timeTaken: Math.round(elapsedSeconds),
      };
    }

    const test = (await prisma.test.findUnique({ where: { id: attempt.testId } })) as any;
    if (!test) {
      throw ApiError.notFound('Test not found');
    }

    const elapsedSeconds = (Date.now() - new Date(attempt.startedAt).getTime()) / 1000;
    const allowedSeconds = test.duration * 60 + 60;

    if (elapsedSeconds > allowedSeconds) {
      const resultAttempt = await this.submitAttemptDirect(attempt, true);
      let attemptAnswers =
        typeof resultAttempt.answers === 'string'
          ? JSON.parse(resultAttempt.answers)
          : resultAttempt.answers;
      let testQuestions =
        typeof test.questions === 'string' ? JSON.parse(test.questions) : test.questions;
      if (!Array.isArray(attemptAnswers)) attemptAnswers = [];
      if (!Array.isArray(testQuestions)) testQuestions = [];
      const correctCount = attemptAnswers.filter((a: any) => a.isCorrect).length;
      const incorrectCount = attemptAnswers.filter(
        (a: any) =>
          !a.isCorrect && ((a.selectedOptions && a.selectedOptions.length > 0) || a.textAnswer)
      ).length;
      const unansweredCount = testQuestions.length - correctCount - incorrectCount;
      const finalElapsedSeconds = resultAttempt.completedAt
        ? (new Date(resultAttempt.completedAt).getTime() -
            new Date(resultAttempt.startedAt).getTime()) /
          1000
        : allowedSeconds;

      return {
        attemptId: resultAttempt.id,
        score: resultAttempt.score || 0,
        totalMarks: test.totalMarks,
        passed: (resultAttempt.score || 0) >= test.passingMarks,
        stats: {
          correct: correctCount,
          incorrect: incorrectCount,
          unanswered: unansweredCount,
          percentile: 0,
        },
        timeTaken: Math.round(finalElapsedSeconds),
      };
    }

    const newAnswersMap = new Map(data.answers.map((a) => [a.questionId, a]));

    let attemptAnswers =
      typeof attempt.answers === 'string' ? JSON.parse(attempt.answers) : attempt.answers;
    if (!Array.isArray(attemptAnswers)) attemptAnswers = [];
    attemptAnswers.forEach((a: any) => {
      const match = newAnswersMap.get(a.questionId);
      if (match) {
        a.selectedOptions = match.selectedOptions;
        a.textAnswer = match.textAnswer;
        a.timeTaken = match.timeTaken || 0;
        newAnswersMap.delete(a.questionId);
      }
    });

    newAnswersMap.forEach((val) => {
      attemptAnswers.push({
        questionId: val.questionId,
        selectedOptions: val.selectedOptions,
        textAnswer: val.textAnswer,
        timeTaken: val.timeTaken || 0,
        isCorrect: false,
        marksObtained: 0,
      });
    });

    attempt.answers = attemptAnswers;

    await this.submitAttemptDirect(attempt, false);

    // Refresh attempt to get updated stats
    const updatedAttempt = (await prisma.testAttempt.findUnique({
      where: { id: attempt.id },
    })) as any;
    attemptAnswers =
      typeof updatedAttempt.answers === 'string'
        ? JSON.parse(updatedAttempt.answers)
        : updatedAttempt.answers;

    const correctCount = attemptAnswers.filter((a: any) => a.isCorrect).length;
    const incorrectCount = attemptAnswers.filter(
      (a: any) =>
        !a.isCorrect && ((a.selectedOptions && a.selectedOptions.length > 0) || a.textAnswer)
    ).length;

    let testQuestions =
      typeof test.questions === 'string' ? JSON.parse(test.questions) : test.questions;
    if (!Array.isArray(testQuestions)) testQuestions = [];
    const unansweredCount = testQuestions.length - correctCount - incorrectCount;

    const scoresBelow = await prisma.testAttempt.count({
      where: {
        testId: test.id,
        status: 'completed',
        score: { lt: updatedAttempt.score },
      },
    });
    const totalCompleted = await prisma.testAttempt.count({
      where: {
        testId: test.id,
        status: 'completed',
      },
    });
    const percentile = totalCompleted > 0 ? Math.round((scoresBelow / totalCompleted) * 100) : 100;

    const sectionAnalytics: Record<
      string,
      {
        total: number;
        correct: number;
        incorrect: number;
        marksObtained: number;
        totalMarks: number;
      }
    > = {};

    testQuestions.forEach((q: any) => {
      const sec = q.sectionName || 'General';
      if (!sectionAnalytics[sec]) {
        sectionAnalytics[sec] = {
          total: 0,
          correct: 0,
          incorrect: 0,
          marksObtained: 0,
          totalMarks: 0,
        };
      }
      const ans = attemptAnswers.find((a: any) => a.questionId === q.id);
      sectionAnalytics[sec].total += 1;
      sectionAnalytics[sec].totalMarks += q.marks;

      if (ans) {
        sectionAnalytics[sec].marksObtained += ans.marksObtained;
        if (ans.isCorrect) sectionAnalytics[sec].correct += 1;
        else if ((ans.selectedOptions && ans.selectedOptions.length > 0) || ans.textAnswer)
          sectionAnalytics[sec].incorrect += 1;
      }
    });

    return {
      attempt: {
        id: updatedAttempt.id,
        score: updatedAttempt.score,
        totalMarks: updatedAttempt.totalMarks,
        percentage: updatedAttempt.percentage,
        isPassed: updatedAttempt.isPassed,
        timeTaken: updatedAttempt.timeTaken,
        status: updatedAttempt.status,
        gradingStatus: updatedAttempt.gradingStatus,
      },
      stats: {
        correct: correctCount,
        incorrect: incorrectCount,
        unanswered: unansweredCount,
        percentile,
        sectionAnalytics,
      },
    };
  }
  async gradeSubjective(attemptId: string, teacherId: string, data: IGradeSubjectiveDto) {
    const attempt = (await prisma.testAttempt.findUnique({ where: { id: attemptId } })) as any;
    if (!attempt) {
      throw ApiError.notFound('Test attempt not found');
    }

    const test = (await prisma.test.findFirst({
      where: this.repository['getScopedFilter']({
        id: attempt.testId,
        teacherId,
      }),
    })) as any;
    if (!test) {
      throw ApiError.notFound('Test not found or unauthorized');
    }

    let attemptAnswers =
      typeof attempt.answers === 'string' ? JSON.parse(attempt.answers) : attempt.answers;
    if (!Array.isArray(attemptAnswers)) attemptAnswers = [];

    const answer = attemptAnswers.find((a: any) => a.questionId === data.questionId);
    if (!answer) {
      throw ApiError.notFound('Question response not found in this attempt');
    }

    let testQuestions =
      typeof test.questions === 'string' ? JSON.parse(test.questions) : test.questions;
    if (!Array.isArray(testQuestions)) testQuestions = [];

    const question = testQuestions.find((q: any) => q.id === data.questionId);
    if (!question || question.type !== 'subjective') {
      throw ApiError.badRequest('Question is not subjective');
    }

    const marksToAward = Math.min(Math.max(0, data.marksObtained), question.marks);
    answer.marksObtained = marksToAward;
    answer.isCorrect = marksToAward > 0;
    answer.feedback = data.feedback || '';

    attempt.answers = attemptAnswers;

    let totalScore = 0;
    let pendingManual = false;
    attemptAnswers.forEach((a: any) => {
      totalScore += a.marksObtained || 0;
      const q = testQuestions.find((q: any) => q.id === a.questionId);
      if (q?.type === 'subjective' && a.marksObtained === undefined) {
        pendingManual = true;
      }
    });

    attempt.score = totalScore;
    attempt.percentage =
      test.totalMarks > 0 ? Math.round((attempt.score / test.totalMarks) * 100) : 0;
    attempt.isPassed = attempt.score >= test.passingMarks;
    attempt.gradingStatus = pendingManual ? 'pending_manual' : 'manually_graded';

    await prisma.testAttempt.update({
      where: { id: attempt.id },
      data: {
        answers: attempt.answers,
        score: attempt.score,
        percentage: attempt.percentage,
        isPassed: attempt.isPassed,
        gradingStatus: attempt.gradingStatus,
      },
    });

    const allAttempts = (await prisma.testAttempt.findMany({
      where: { testId: test.id, status: 'completed' },
    })) as any[];
    if (allAttempts.length > 0) {
      const avgScore = allAttempts.reduce((sum, a) => sum + a.percentage, 0) / allAttempts.length;
      const passCount = allAttempts.filter((a) => a.isPassed).length;

      await prisma.test.update({
        where: { id: test.id },
        data: {
          averageScore: Math.round(avgScore),
          passRate: Math.round((passCount / allAttempts.length) * 100),
        },
      });
    }

    return attempt;
  }

  async getTestResult(attemptId: string, userId: string) {
    const attempt = (await prisma.testAttempt.findFirst({
      where: { id: attemptId, userId },
      include: {
        test: { select: { title: true, questions: true, passingMarks: true, duration: true } },
      },
    })) as any;

    if (!attempt) {
      throw ApiError.notFound('Test attempt not found');
    }
    if (attempt.status === 'in_progress') {
      throw ApiError.badRequest('Test is still in progress');
    }

    return attempt;
  }

  async getMyAttempts(userId: string, query: any) {
    const filter: any = { userId };

    if (query.status) {
      filter.status = query.status;
    }
    if (query.testId) {
      filter.testId = query.testId;
    }

    const page = parseInt(query.page || '1', 10);
    const limit = parseInt(query.limit || '10', 10);
    const skip = (page - 1) * limit;

    const where = this.attemptRepository['getScopedFilter'](filter);

    const [docs, total] = await Promise.all([
      prisma.testAttempt.findMany({
        where,
        include: {
          test: { select: { title: true, categoryId: true, duration: true, totalMarks: true } },
        },
        orderBy: { startedAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.testAttempt.count({ where }),
    ]);

    return { docs, page, limit, total };
  }

  async getTeacherTests(teacherId: string, query: any) {
    const filter: any = { teacherId };

    if (query.status) filter.status = query.status;
    if (query.category) filter.categoryId = query.category;
    if (query.search) {
      filter.title = { contains: query.search, mode: 'insensitive' };
    }

    const page = parseInt(query.page || '1', 10);
    const limit = parseInt(query.limit || '10', 10);
    const skip = (page - 1) * limit;

    const where = this.repository['getScopedFilter'](filter);

    const [docs, total] = await Promise.all([
      prisma.test.findMany({
        where,
        include: { category: { select: { name: true } } },
        orderBy: { startedAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.test.count({ where }),
    ]);

    return { docs, page, limit, total };
  }

  async getTestAnalytics(testId: string, teacherId: string) {
    const test = (await prisma.test.findFirst({
      where: this.repository['getScopedFilter']({
        id: testId,
        teacherId,
      }),
    })) as any;

    if (!test) {
      throw ApiError.notFound('Test not found or unauthorized');
    }

    const attempts = await prisma.testAttempt.findMany({
      where: {
        testId: test.id,
        status: 'completed',
      },
      select: { score: true, percentage: true, timeTaken: true },
    });

    const scores = attempts.map((a: any) => a.score);
    const percentages = attempts.map((a: any) => a.percentage);
    const times = attempts.map((a: any) => a.timeTaken);

    return {
      testId: test.id,
      totalAttempts: attempts.length,
      averageScore: scores.length
        ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
        : 0,
      highestScore: scores.length ? Math.max(...scores) : 0,
      lowestScore: scores.length ? Math.min(...scores) : 0,
      averagePercentage: percentages.length
        ? Math.round(percentages.reduce((a, b) => a + b, 0) / percentages.length)
        : 0,
      averageTimeTaken: times.length
        ? Math.round(times.reduce((a, b) => a + b, 0) / times.length)
        : 0,
    };
  }
}
