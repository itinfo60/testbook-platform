import mongoose, { Types } from 'mongoose';
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
import Enrollment from '../enrollment/enrollment.model.js';
import User from '../user/user.model.js';
import { ApiError } from '../../core/api-error.js';
import redis from '../../config/redis.js';
import logger from '../../utils/logger.js';
import Test from './test.model.js';
import TestAttempt from './testAttempt.model.js';

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
    const questions = data.questions.map((q, idx) => ({
      ...q,
      _id: new mongoose.Types.ObjectId(),
      order: q.order ?? idx,
      sectionName: q.sectionName || 'General',
      marks: Number(q.marks) || 1,
      negativeMarks: Number(q.negativeMarks) || 0,
    }));
    return this.repository.create({
      ...data,
      questions,
      teacher: new mongoose.Types.ObjectId(teacherId),
    });
  }

  async updateTest(id: string, data: IUpdateTestDto, teacherId: string): Promise<ITest | null> {
    const test = await this.repository.findOne({
      _id: id,
      teacher: new mongoose.Types.ObjectId(teacherId),
    });
    if (!test) {
      throw ApiError.notFound('Test not found or unauthorized');
    }

    if (data.questions) {
      data.questions = data.questions.map((q: any, idx: number) => ({
        ...q,
        _id: q._id ? new mongoose.Types.ObjectId(q._id) : new mongoose.Types.ObjectId(),
        order: q.order || idx,
      }));
    }

    return this.repository.updateById(id, data);
  }

  async deleteTest(id: string, teacherId: string): Promise<ITest | null> {
    const test = await this.repository.findOne({
      _id: id,
      teacher: new mongoose.Types.ObjectId(teacherId),
    });
    if (!test) {
      throw ApiError.notFound('Test not found or unauthorized');
    }

    // Clean up attempts
    await this.attemptRepository.deleteMany({ test: test._id });
    return this.repository.deleteById(id);
  }

  async getTests(query: any, userId?: string) {
    const filter: any = { isPublished: true };

    if (query.category) {
      filter.category = new mongoose.Types.ObjectId(query.category);
    }
    if (query.difficulty) {
      filter.difficulty = query.difficulty;
    }
    if (query.search) {
      filter.title = { $regex: query.search, $options: 'i' };
    }

    const page = parseInt(query.page || '1', 10);
    const limit = parseInt(query.limit || '10', 10);
    const skip = (page - 1) * limit;

    const [docs, total] = await Promise.all([
      Test.find(this.repository['getScopedFilter'](filter))
        .populate('teacher', 'name avatar')
        .populate('category', 'name slug')
        .select('-questions')
        .skip(skip)
        .limit(limit)
        .lean()
        .exec(),
      Test.countDocuments(this.repository['getScopedFilter'](filter)).exec(),
    ]);

    let results = docs.map((doc: any) => ({
      ...doc,
      _id: doc._id.toString(),
      isPurchased: true, // Default to true if free
    }));

    if (userId) {
      const enrollments = await Enrollment.find({
        user: new mongoose.Types.ObjectId(userId),
        test: { $in: results.map((t) => new mongoose.Types.ObjectId(t._id)) },
        status: { $in: ['active', 'completed'] },
      })
        .select('test')
        .lean();

      const purchasedIds = new Set(enrollments.map((e) => e.test.toString()));

      results = results.map((test) => {
        if (!test.isFree && test.price > 0) {
          test.isPurchased = purchasedIds.has(test._id.toString());
        }
        return test;
      });
    }

    return { docs: results, page, limit, total };
  }

  async getTestById(id: string, userId?: string) {
    const test = (await Test.findOne(this.repository['getScopedFilter']({ _id: id }))
      .populate('teacher', 'name avatar')
      .populate('category', 'name slug')
      .lean()
      .exec()) as any;

    if (!test || (!test.isPublished && (!userId || test.teacher.toString() !== userId))) {
      throw ApiError.notFound('Test not found');
    }

    // Strip answers if not teacher or if not already graded
    if (!userId || test.teacher._id.toString() !== userId) {
      if (test.questions) {
        test.questions = test.questions.map((q: any) => {
          const strippedOptions = q.options?.map((o: any) => ({ _id: o._id, text: o.text }));
          const { correctAnswer, explanation, ...rest } = q;
          return { ...rest, options: strippedOptions };
        });
      }
    }

    let attemptCount = 0;
    let isPurchased = test.isFree;
    let activeAttempt = null;

    if (userId) {
      attemptCount = await TestAttempt.countDocuments({
        user: new mongoose.Types.ObjectId(userId),
        test: test._id,
        status: 'completed',
      });

      activeAttempt = await TestAttempt.findOne({
        user: new mongoose.Types.ObjectId(userId),
        test: test._id,
        status: 'in_progress',
      })
        .lean()
        .exec();

      if (!test.isFree) {
        const enrollment = await Enrollment.findOne({
          user: new mongoose.Types.ObjectId(userId),
          test: test._id,
          status: { $in: ['active', 'completed'] },
        });
        isPurchased = !!enrollment;
      }
    }

    return { test, attemptCount, isPurchased, activeAttempt };
  }

  async startTest(testId: string, userId: string) {
    const test = await Test.findOne(this.repository['getScopedFilter']({ _id: testId }));
    if (!test || !test.isPublished) {
      throw ApiError.notFound('Test not found or not published');
    }

    // Check purchase status if not free
    if (!test.isFree && test.price > 0) {
      const enrollment = await Enrollment.findOne({
        user: new mongoose.Types.ObjectId(userId),
        test: test._id,
        status: { $in: ['active', 'completed'] },
      });
      if (!enrollment) {
        throw ApiError.forbidden('Purchase is required to start this test');
      }
    }

    // Enforce strict limit on active sessions: max 1 active test attempt at a time across all tests
    const activeAttemptAcrossTests = await TestAttempt.findOne({
      user: new mongoose.Types.ObjectId(userId),
      status: 'in_progress',
    });

    if (activeAttemptAcrossTests && activeAttemptAcrossTests.test.toString() !== testId) {
      // Auto-submit the previous test attempt as abandoned/timed out instead of blocking
      await this.submitAttemptDirect(activeAttemptAcrossTests, true);
    }

    // Check attempt limits only if we are starting a NEW attempt (i.e., we are not resuming this test)
    const isResumingThisTest =
      activeAttemptAcrossTests && activeAttemptAcrossTests.test.toString() === testId;
    if (!isResumingThisTest && test.maxAttempts > 0) {
      const attemptsCount = await TestAttempt.countDocuments({
        user: new mongoose.Types.ObjectId(userId),
        test: test._id,
        status: 'completed',
      });
      if (attemptsCount >= test.maxAttempts) {
        throw ApiError.forbidden(`Maximum attempts (${test.maxAttempts}) reached for this test.`);
      }
    }

    let attempt = activeAttemptAcrossTests;

    if (!attempt) {
      const attemptCount = await TestAttempt.countDocuments({
        user: new mongoose.Types.ObjectId(userId),
        test: test._id,
      });

      attempt = await TestAttempt.create({
        user: new mongoose.Types.ObjectId(userId),
        test: test._id,
        totalMarks: test.totalMarks,
        attemptNumber: attemptCount + 1,
        tenantId: test.tenantId,
        status: 'in_progress',
      });
    }

    // Shuffling
    let questions = test.questions.map((q) => ({
      _id: q._id,
      question: q.question,
      type: q.type,
      options: q.options ? q.options.map((o) => ({ _id: o._id, text: o.text })) : [],
      marks: q.marks,
      negativeMarks: q.negativeMarks,
      sectionName: q.sectionName,
      order: q.order,
    }));

    if (test.randomizeQuestions) {
      // Group by section, shuffle each section, then flatten
      const sectionsMap = new Map<string, typeof questions>();
      questions.forEach((q) => {
        const sec = q.sectionName || 'General';
        if (!sectionsMap.has(sec)) sectionsMap.set(sec, []);
        sectionsMap.get(sec)!.push(q);
      });

      questions = [];
      Array.from(sectionsMap.keys())
        .sort()
        .forEach((secName) => {
          const secQuestions = sectionsMap.get(secName)!;
          // Fisher-Yates
          for (let i = secQuestions.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [secQuestions[i], secQuestions[j]] = [secQuestions[j], secQuestions[i]];
          }
          questions.push(...secQuestions);
        });

      if (test.randomizeOptions) {
        questions = questions.map((q) => {
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

    // Fetch from Redis cache-aside first in case of crash/refresh
    const redisKey = `tenant:test-attempt:${attempt._id.toString()}:answers`;
    const cachedAnswers = await redis.get(redisKey);
    let savedAnswers: any = {};
    let savedPalette: any = [];

    if (cachedAnswers) {
      savedAnswers = cachedAnswers.answers || {};
      savedPalette = cachedAnswers.palette || [];
    } else {
      // Map stored model format
      attempt.answers.forEach((a) => {
        savedAnswers[a.questionId.toString()] = {
          selectedOptions: a.selectedOptions,
          textAnswer: a.textAnswer,
          timeTaken: a.timeTaken,
        };
      });
      savedPalette = attempt.palette.map((p) => ({
        questionId: p.questionId.toString(),
        status: p.status,
      }));
    }

    return {
      attempt: {
        _id: attempt._id.toString(),
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
    const attempt = await TestAttempt.findOne({
      _id: new mongoose.Types.ObjectId(attemptId),
      user: new mongoose.Types.ObjectId(userId),
    });

    if (!attempt) {
      throw ApiError.notFound('Test attempt not found');
    }

    if (attempt.status !== 'in_progress') {
      // Safely ignore if already submitted/timed out
      return { savedAnswersCount: 0, savedPaletteCount: 0, alreadyCompleted: true };
    }

    // Redis Key
    const redisKey = `tenant:test-attempt:${attemptId}:answers`;

    // Process new saves
    const newAnswersMap = new Map(data.answers.map((a) => [a.questionId, a]));
    const newPaletteMap = new Map(data.palette?.map((p) => [p.questionId, p]) || []);

    // Merge onto existing attempt structure
    attempt.answers.forEach((a) => {
      const match = newAnswersMap.get(a.questionId.toString());
      if (match) {
        a.selectedOptions = match.selectedOptions;
        a.textAnswer = match.textAnswer;
        a.timeTaken = match.timeTaken || 0;
        newAnswersMap.delete(a.questionId.toString());
      }
    });

    // Add new ones
    newAnswersMap.forEach((val) => {
      attempt.answers.push({
        questionId: new mongoose.Types.ObjectId(val.questionId),
        selectedOptions: val.selectedOptions,
        textAnswer: val.textAnswer,
        timeTaken: val.timeTaken || 0,
        isCorrect: false,
        marksObtained: 0,
      });
    });

    // Merge Palette
    attempt.palette.forEach((p) => {
      const match = newPaletteMap.get(p.questionId.toString());
      if (match) {
        p.status = match.status;
        newPaletteMap.delete(p.questionId.toString());
      }
    });

    newPaletteMap.forEach((val) => {
      attempt.palette.push({
        questionId: new mongoose.Types.ObjectId(val.questionId),
        status: val.status,
      });
    });

    attempt.markModified('answers');
    attempt.markModified('palette');

    // 1. Write to Redis instantly
    const cacheObj = {
      answers: attempt.answers.reduce((map: any, a) => {
        map[a.questionId.toString()] = {
          selectedOptions: a.selectedOptions,
          textAnswer: a.textAnswer,
          timeTaken: a.timeTaken,
        };
        return map;
      }, {}),
      palette: attempt.palette.map((p) => ({
        questionId: p.questionId.toString(),
        status: p.status,
      })),
    };
    await redis.set(redisKey, cacheObj, 7200); // 2 hours TTL

    // 2. Write-behind (Non-blocking async persistence to MongoDB)
    TestAttempt.updateOne(
      { _id: attempt._id },
      { $set: { answers: attempt.answers, palette: attempt.palette } }
    ).catch((err) => {
      logger.error(
        `[Redis Write-Behind Error] Failed to flush autoSave for attempt ${attemptId}:`,
        err.message
      );
    });

    return { savedAnswersCount: data.answers.length, savedPaletteCount: data.palette?.length || 0 };
  }

  async logViolation(attemptId: string, userId: string) {
    const attempt = await TestAttempt.findOne({
      _id: new mongoose.Types.ObjectId(attemptId),
      user: new mongoose.Types.ObjectId(userId),
    });

    if (!attempt) {
      throw ApiError.notFound('Test attempt not found');
    }

    if (attempt.status !== 'in_progress') {
      return { windowViolations: attempt.windowViolations, autoSubmitted: true };
    }

    attempt.windowViolations += 1;
    let autoSubmitted = false;

    // Default threshold of 5 window violations triggers auto-submit
    if (attempt.windowViolations >= 5) {
      await this.submitAttemptDirect(attempt, true); // True flag = timed out / violation submitted
      autoSubmitted = true;
    } else {
      await attempt.save();
    }

    return { windowViolations: attempt.windowViolations, autoSubmitted };
  }

  private async submitAttemptDirect(attempt: ITestAttempt, timedOutOrViolated = false) {
    const test = await Test.findById(attempt.test);
    if (!test) {
      throw ApiError.notFound('Test not found for this attempt');
    }

    // Retrieve answers from cache in case some were not flushed
    const redisKey = `tenant:test-attempt:${attempt._id.toString()}:answers`;
    const cachedDataRaw = await redis.get(redisKey);
    const cachedData =
      typeof cachedDataRaw === 'string' ? JSON.parse(cachedDataRaw) : cachedDataRaw;
    let finalAnswers = attempt.answers;

    if (cachedData && cachedData.answers) {
      const cachedAnswersMap = cachedData.answers;
      // Rebuild finalAnswers using cached values
      const mergedAnswers: typeof attempt.answers = [];
      test.questions.forEach((q) => {
        const qId = q._id.toString();
        const cached = cachedAnswersMap[qId];
        const existing = attempt.answers.find((a) => a.questionId.toString() === qId);

        mergedAnswers.push({
          questionId: q._id,
          selectedOptions: cached?.selectedOptions || existing?.selectedOptions || [],
          textAnswer: cached?.textAnswer || existing?.textAnswer || '',
          timeTaken: cached?.timeTaken || existing?.timeTaken || 0,
          isCorrect: false,
          marksObtained: 0,
        });
      });
      finalAnswers = mergedAnswers;
    }

    // Grade objective options
    let totalScore = 0;
    let containsSubjective = false;

    const gradedAnswers = finalAnswers.map((answer) => {
      const question = test.questions.find(
        (q) => q._id.toString() === answer.questionId.toString()
      );
      if (!question) return answer;

      let isCorrect = false;
      let marksObtained = 0;

      if (question.type === 'mcq' || question.type === 'true_false') {
        const selected = answer.selectedOptions?.[0];
        const correctIndex = question.options?.findIndex((o) => o.isCorrect);
        isCorrect = selected !== undefined && selected === correctIndex;
      } else if (question.type === 'msq') {
        const correctIndices =
          question.options
            ?.map((o, i) => (o.isCorrect ? i : -1))
            .filter((i) => i !== -1)
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

    await attempt.save();

    // Invalidate Redis cache
    await redis.del(redisKey);

    // Update global Test stats
    const allAttempts = await TestAttempt.find({ test: test._id, status: 'completed' }).lean();
    if (allAttempts.length > 0) {
      const avgScore = allAttempts.reduce((sum, a) => sum + a.percentage, 0) / allAttempts.length;
      const passCount = allAttempts.filter((a) => a.isPassed).length;

      await Test.updateOne(
        { _id: test._id },
        {
          $set: {
            totalAttempts: allAttempts.length,
            averageScore: Math.round(avgScore),
            passRate: Math.round((passCount / allAttempts.length) * 100),
          },
        }
      );
    }

    // Increment user metrics
    await User.updateOne(
      { _id: attempt.user },
      { $inc: { totalTestsTaken: 1, totalPoints: attempt.isPassed ? 10 : 2 } }
    );

    return attempt;
  }

  async submitTest(attemptId: string, userId: string, data: ISubmitTestDto) {
    const attempt = await TestAttempt.findOne({
      _id: new mongoose.Types.ObjectId(attemptId),
      user: new mongoose.Types.ObjectId(userId),
    });

    if (!attempt) {
      throw ApiError.notFound('Test attempt not found');
    }

    if (attempt.status !== 'in_progress') {
      const test = await Test.findById(attempt.test);
      if (!test) throw ApiError.notFound('Test not found');

      const correctCount = attempt.answers.filter((a) => a.isCorrect).length;
      const incorrectCount = attempt.answers.filter(
        (a) => !a.isCorrect && ((a.selectedOptions && a.selectedOptions.length > 0) || a.textAnswer)
      ).length;
      const unansweredCount = test.questions.length - correctCount - incorrectCount;
      const elapsedSeconds = attempt.endTime
        ? (attempt.endTime.getTime() - attempt.startedAt.getTime()) / 1000
        : 0;

      return {
        attemptId: attempt._id,
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

    const test = await Test.findById(attempt.test);
    if (!test) {
      throw ApiError.notFound('Test not found');
    }

    // Check timer limit: Grace of 60 seconds
    const elapsedSeconds = (Date.now() - attempt.startedAt.getTime()) / 1000;
    const allowedSeconds = test.duration * 60 + 60;

    if (elapsedSeconds > allowedSeconds) {
      // Mark as timed out and auto-submit the cached responses up to limit
      const resultAttempt = await this.submitAttemptDirect(attempt, true);
      const correctCount = resultAttempt.answers.filter((a) => a.isCorrect).length;
      const incorrectCount = resultAttempt.answers.filter(
        (a) => !a.isCorrect && ((a.selectedOptions && a.selectedOptions.length > 0) || a.textAnswer)
      ).length;
      const unansweredCount = test.questions.length - correctCount - incorrectCount;
      const finalElapsedSeconds = resultAttempt.endTime
        ? (resultAttempt.endTime.getTime() - resultAttempt.startedAt.getTime()) / 1000
        : allowedSeconds;

      return {
        attemptId: resultAttempt._id,
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

    // Update attempt's final answer sheets before evaluating
    const newAnswersMap = new Map(data.answers.map((a) => [a.questionId, a]));

    // Update existing
    attempt.answers.forEach((a) => {
      const match = newAnswersMap.get(a.questionId.toString());
      if (match) {
        a.selectedOptions = match.selectedOptions;
        a.textAnswer = match.textAnswer;
        a.timeTaken = match.timeTaken || 0;
        newAnswersMap.delete(a.questionId.toString());
      }
    });

    // Add remaining
    newAnswersMap.forEach((val) => {
      attempt.answers.push({
        questionId: new mongoose.Types.ObjectId(val.questionId),
        selectedOptions: val.selectedOptions,
        textAnswer: val.textAnswer,
        timeTaken: val.timeTaken || 0,
        isCorrect: false,
        marksObtained: 0,
      });
    });

    await this.submitAttemptDirect(attempt, false);

    // Compute detailed stats for payload response
    const correctCount = attempt.answers.filter((a) => a.isCorrect).length;
    const incorrectCount = attempt.answers.filter(
      (a) => !a.isCorrect && ((a.selectedOptions && a.selectedOptions.length > 0) || a.textAnswer)
    ).length;
    const unansweredCount = test.questions.length - correctCount - incorrectCount;

    // Percentile rank calculation
    const scoresBelow = await TestAttempt.countDocuments({
      test: test._id,
      status: 'completed',
      score: { $lt: attempt.score },
    });
    const totalCompleted = await TestAttempt.countDocuments({
      test: test._id,
      status: 'completed',
    });
    const percentile = totalCompleted > 0 ? Math.round((scoresBelow / totalCompleted) * 100) : 100;

    // Section-wise division breakdown
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
    test.questions.forEach((q) => {
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
      const ans = attempt.answers.find((a) => a.questionId.toString() === q._id.toString());
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
        _id: attempt._id.toString(),
        score: attempt.score,
        totalMarks: attempt.totalMarks,
        percentage: attempt.percentage,
        isPassed: attempt.isPassed,
        timeTaken: attempt.timeTaken,
        status: attempt.status,
        gradingStatus: attempt.gradingStatus,
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
    const attempt = await TestAttempt.findById(attemptId);
    if (!attempt) {
      throw ApiError.notFound('Test attempt not found');
    }

    const test = await Test.findOne(
      this.repository['getScopedFilter']({
        _id: attempt.test,
        teacher: new mongoose.Types.ObjectId(teacherId),
      })
    );
    if (!test) {
      throw ApiError.notFound('Test not found or unauthorized');
    }

    const answer = attempt.answers.find((a) => a.questionId.toString() === data.questionId);
    if (!answer) {
      throw ApiError.notFound('Question response not found in this attempt');
    }

    const question = test.questions.find((q) => q._id.toString() === data.questionId);
    if (!question || question.type !== 'subjective') {
      throw ApiError.badRequest('Question is not subjective or does not exist');
    }

    if (data.marksObtained > question.marks) {
      throw ApiError.badRequest(
        `Marks obtained (${data.marksObtained}) cannot exceed question max marks (${question.marks})`
      );
    }

    answer.marksObtained = data.marksObtained;
    answer.isCorrect = data.marksObtained >= Math.round(question.marks / 2); // Rule: correct if score is >= 50%

    // Recalculate
    attempt.calculateScore();
    attempt.isPassed = attempt.score >= test.passingMarks;

    // Check if there are any other subjective questions left ungraded
    const subjectiveIds = new Set(
      test.questions.filter((q) => q.type === 'subjective').map((q) => q._id.toString())
    );
    const gradedSubjectiveCount = attempt.answers.filter(
      (a) => subjectiveIds.has(a.questionId.toString()) && a.marksObtained !== undefined
    ).length;

    attempt.gradingStatus =
      gradedSubjectiveCount >= subjectiveIds.size ? 'manually_graded' : 'pending_manual';
    await attempt.save();

    // Update global test stats
    const allAttempts = await TestAttempt.find({ test: test._id, status: 'completed' }).lean();
    if (allAttempts.length > 0) {
      const avgScore = allAttempts.reduce((sum, a) => sum + a.percentage, 0) / allAttempts.length;
      const passCount = allAttempts.filter((a) => a.isPassed).length;

      await Test.updateOne(
        { _id: test._id },
        {
          $set: {
            averageScore: Math.round(avgScore),
            passRate: Math.round((passCount / allAttempts.length) * 100),
          },
        }
      );
    }

    return attempt;
  }

  async getTestResult(attemptId: string, userId: string) {
    const attempt = await TestAttempt.findOne({
      _id: new mongoose.Types.ObjectId(attemptId),
      user: new mongoose.Types.ObjectId(userId),
    })
      .populate('test', 'title questions passingMarks duration')
      .lean();

    if (!attempt) {
      throw ApiError.notFound('Test attempt not found');
    }

    return { attempt };
  }

  async getMyAttempts(userId: string, query: any) {
    const filter: any = { user: new mongoose.Types.ObjectId(userId) };
    if (query.status) {
      filter.status = query.status;
    }
    if (query.testId) {
      filter.test = new mongoose.Types.ObjectId(query.testId);
    }

    const page = parseInt(query.page || '1', 10);
    const limit = parseInt(query.limit || '10', 10);
    const skip = (page - 1) * limit;

    const [docs, total] = await Promise.all([
      TestAttempt.find(this.attemptRepository['getScopedFilter'](filter))
        .populate({ path: 'test', select: 'title category duration totalMarks' })
        .sort({ completedAt: -1, createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean()
        .exec(),
      TestAttempt.countDocuments(this.attemptRepository['getScopedFilter'](filter)).exec(),
    ]);

    return { docs, page, limit, total };
  }

  async getTeacherTests(teacherId: string, query: any) {
    const filter: any = { teacher: new mongoose.Types.ObjectId(teacherId) };
    if (query.status) {
      filter.status = query.status;
    }
    if (query.search) {
      filter.title = { $regex: query.search, $options: 'i' };
    }

    const page = parseInt(query.page || '1', 10);
    const limit = parseInt(query.limit || '10', 10);
    const skip = (page - 1) * limit;

    const [docs, total] = await Promise.all([
      Test.find(this.repository['getScopedFilter'](filter))
        .populate('category', 'name')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean()
        .exec(),
      Test.countDocuments(this.repository['getScopedFilter'](filter)).exec(),
    ]);

    const results = docs.map((doc: any) => ({
      ...doc,
      questionsCount: doc.questions?.length || 0,
      questions: undefined, // Hide nested details in listings
    }));

    return { docs: results, page, limit, total };
  }

  async getTestAnalytics(testId: string, teacherId: string) {
    const test = await Test.findOne(
      this.repository['getScopedFilter']({
        _id: new mongoose.Types.ObjectId(testId),
        teacher: new mongoose.Types.ObjectId(teacherId),
      })
    );

    if (!test) {
      throw ApiError.notFound('Test not found or unauthorized');
    }

    const attempts = await TestAttempt.find({
      test: test._id,
      status: { $in: ['completed', 'timed_out'] },
    }).lean();

    const analytics = {
      totalAttempts: attempts.length,
      averageScore: attempts.length
        ? Math.round(attempts.reduce((s, a) => s + a.percentage, 0) / attempts.length)
        : 0,
      highestScore: attempts.length ? Math.max(...attempts.map((a) => a.percentage)) : 0,
      lowestScore: attempts.length ? Math.min(...attempts.map((a) => a.percentage)) : 0,
      passRate: attempts.length
        ? Math.round((attempts.filter((a) => a.isPassed).length / attempts.length) * 100)
        : 0,
      averageTimeTaken: attempts.length
        ? Math.round(attempts.reduce((s, a) => s + a.timeTaken, 0) / attempts.length)
        : 0,
      scoreDistribution: {
        '0-20': attempts.filter((a) => a.percentage <= 20).length,
        '21-40': attempts.filter((a) => a.percentage > 20 && a.percentage <= 40).length,
        '41-60': attempts.filter((a) => a.percentage > 40 && a.percentage <= 60).length,
        '61-80': attempts.filter((a) => a.percentage > 60 && a.percentage <= 80).length,
        '81-100': attempts.filter((a) => a.percentage > 80).length,
      },
    };

    return { analytics };
  }
}
export default TestService;
