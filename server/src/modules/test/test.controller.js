import Test from './test.model.js';
import TestAttempt from './testAttempt.model.js';
import User from '../user/user.model.js';
import Enrollment from '../enrollment/enrollment.model.js';
import ApiError from '../../utils/ApiError.js';
import ApiResponse from '../../utils/ApiResponse.js';
import catchAsync from '../../utils/catchAsync.js';
import redis from '../../config/redis.js';
import { buildPaginationQuery, buildFilterQuery } from '../../utils/pagination.js';
import { generateSlug } from '../../utils/helpers.js';

// ===== PUBLIC =====

export const getTests = catchAsync(async (req, res) => {
  const pagination = buildPaginationQuery(req.query);

  const filter = buildFilterQuery(req.query, {
    search: { type: 'search', field: 'title' },
    category: { type: 'exact' },
    difficulty: { type: 'exact' },
  });

  filter.isPublished = true;

  const result = await Test.paginate(filter, {
    ...pagination,
    populate: [
      { path: 'teacher', select: 'name avatar' },
      { path: 'category', select: 'name slug' },
    ],
    select: '-questions',
  });

  let docs = result.docs.map((doc) => (doc.toObject ? doc.toObject() : doc));

  if (req.user) {
    const enrollments = await Enrollment.find({
      user: req.userId,
      test: { $in: docs.map((t) => t._id) },
      status: { $in: ['active', 'completed'] },
    })
      .select('test')
      .lean();

    const purchasedTestIds = new Set(enrollments.map((e) => e.test.toString()));

    docs = docs.map((test) => {
      if (test.isFree === false || test.price > 0) {
        test.isPurchased = purchasedTestIds.has(test._id.toString());
      } else {
        test.isPurchased = true;
      }
      return test;
    });
  }

  ApiResponse.paginated(res, {
    docs,
    page: result.pagination.page,
    limit: result.pagination.limit,
    total: result.pagination.total,
  });
});

export const getTestById = catchAsync(async (req, res) => {
  const test = await Test.findById(req.params.id)
    .populate('teacher', 'name avatar')
    .populate('category', 'name slug')
    .select('-questions.options.isCorrect -questions.correctAnswer -questions.explanation')
    .lean();

  if (!test || !test.isPublished) {
    throw ApiError.notFound('Test not found');
  }

  // Get user's attempt count
  let attemptCount = 0;
  let isPurchased = false;

  if (req.user) {
    attemptCount = await TestAttempt.countDocuments({
      user: req.userId,
      test: test._id,
      status: 'completed',
    });

    // Check purchase status
    if (test.isFree === false || test.price > 0) {
      const existing = await Enrollment.findOne({
        user: req.userId,
        test: test._id,
        status: { $in: ['active', 'completed'] },
      });
      isPurchased = !!existing;
    } else {
      isPurchased = true;
    }
  }

  ApiResponse.ok(res, { test, attemptCount, isPurchased });
});

// ===== ATTEMPT =====

export const startTest = catchAsync(async (req, res) => {
  const test = await Test.findById(req.params.id);

  if (!test || !test.isPublished) {
    throw ApiError.notFound('Test not found');
  }

  if (test.isFree === false || test.price > 0) {
    const existing = await Enrollment.findOne({
      user: req.userId,
      test: test._id,
      status: { $in: ['active', 'completed'] },
    });
    if (!existing) {
      throw ApiError.forbidden('Purchase required to start this test');
    }
  }

  // Check max attempts
  if (test.maxAttempts > 0) {
    const attempts = await TestAttempt.countDocuments({
      user: req.userId,
      test: test._id,
      status: 'completed',
    });
    if (attempts >= test.maxAttempts) {
      throw ApiError.forbidden(`Maximum attempts (${test.maxAttempts}) reached`);
    }
  }

  // Check for in-progress attempt
  let attempt = await TestAttempt.findOne({
    user: req.userId,
    test: test._id,
    status: 'in_progress',
  });

  if (!attempt) {
    const attemptNumber =
      (await TestAttempt.countDocuments({
        user: req.userId,
        test: test._id,
      })) + 1;

    attempt = await TestAttempt.create({
      user: req.userId,
      test: test._id,
      totalMarks: test.totalMarks,
      attemptNumber,
    });
  }

  // Strip answers, shuffle if test.randomizeQuestions is set
  let questions = test.questions.map((q) => ({
    _id: q._id,
    question: q.question,
    type: q.type,
    options: q.options.map((o) => ({ _id: o._id, text: o.text })),
    marks: q.marks,
    negativeMarks: q.negativeMarks,
  }));

  if (test.randomizeQuestions) {
    for (let i = questions.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [questions[i], questions[j]] = [questions[j], questions[i]];
    }
    if (test.randomizeOptions) {
      questions = questions.map((q) => {
        const opts = [...q.options];
        for (let i = opts.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [opts[i], opts[j]] = [opts[j], opts[i]];
        }
        return { ...q, options: opts };
      });
    }
  }

  // Restore saved answers for in-progress resume
  const savedAnswers = attempt.answers.reduce((map, a) => {
    map[a.questionId.toString()] = a.selectedOptions;
    return map;
  }, {});

  ApiResponse.ok(res, {
    attempt: {
      _id: attempt._id,
      startedAt: attempt.startedAt,
      attemptNumber: attempt.attemptNumber,
    },
    questions,
    savedAnswers,
    duration: test.duration,
    totalMarks: test.totalMarks,
    title: test.title,
    negativeMarking: test.questions.some((q) => q.negativeMarks > 0),
  });
});

// ===== AUTO-SAVE =====
export const autoSave = catchAsync(async (req, res) => {
  const { answers } = req.body; // [{ questionId, selectedOptions }]

  const attempt = await TestAttempt.findOne({
    _id: req.params.attemptId,
    user: req.userId,
    status: 'in_progress',
  });

  if (!attempt) throw ApiError.notFound('Active test attempt not found');

  // Upsert each answer
  for (const { questionId, selectedOptions } of answers) {
    const idx = attempt.answers.findIndex((a) => a.questionId.toString() === questionId);
    if (idx >= 0) {
      attempt.answers[idx].selectedOptions = selectedOptions;
    } else {
      attempt.answers.push({ questionId, selectedOptions });
    }
  }

  attempt.markModified('answers');
  await attempt.save();

  ApiResponse.ok(res, { saved: answers.length }, 'Progress auto-saved');
});

export const submitTest = catchAsync(async (req, res) => {
  const { answers } = req.body;

  const attempt = await TestAttempt.findOne({
    _id: req.params.attemptId,
    user: req.userId,
    status: 'in_progress',
  });

  if (!attempt) {
    throw ApiError.notFound('Active test attempt not found');
  }

  const test = await Test.findById(attempt.test);
  if (!test) {
    throw ApiError.notFound('Test not found');
  }

  // Check time limit
  const timeTaken = (Date.now() - attempt.startedAt.getTime()) / 1000;
  const timeLimit = test.duration * 60 + 60; // +1 min grace
  if (timeTaken > timeLimit) {
    attempt.status = 'timed_out';
    await attempt.save();
    throw ApiError.badRequest('Time limit exceeded');
  }

  // Grade answers
  const gradedAnswers = [];
  let totalScore = 0;

  for (const answer of answers) {
    const question = test.questions.id(answer.questionId);
    if (!question) continue;

    let isCorrect = false;
    let marksObtained = 0;

    if (question.type === 'mcq' || question.type === 'true_false') {
      const selectedOption = question.options[answer.selectedOptions?.[0]];
      isCorrect = selectedOption?.isCorrect === true;
    } else if (question.type === 'msq') {
      const correctIndices = question.options
        .map((o, i) => (o.isCorrect ? i : -1))
        .filter((i) => i !== -1);
      isCorrect =
        JSON.stringify(answer.selectedOptions?.sort()) === JSON.stringify(correctIndices.sort());
    } else if (question.type === 'fill_blank') {
      isCorrect =
        answer.textAnswer?.trim().toLowerCase() === question.correctAnswer?.trim().toLowerCase();
    }

    if (isCorrect) {
      marksObtained = question.marks;
    } else if (answer.selectedOptions?.length > 0 || answer.textAnswer) {
      marksObtained = -question.negativeMarks;
    }

    totalScore += marksObtained;

    gradedAnswers.push({
      questionId: answer.questionId,
      selectedOptions: answer.selectedOptions || [],
      textAnswer: answer.textAnswer || '',
      isCorrect,
      marksObtained,
      timeTaken: answer.timeTaken || 0,
    });
  }

  attempt.answers = gradedAnswers;
  attempt.score = Math.max(0, totalScore);
  attempt.percentage =
    test.totalMarks > 0 ? Math.round((attempt.score / test.totalMarks) * 100) : 0;
  attempt.isPassed = attempt.score >= test.passingMarks;
  attempt.status = 'completed';
  attempt.completedAt = new Date();
  attempt.timeTaken = Math.round(timeTaken);
  await attempt.save();

  // Update test stats
  const allAttempts = await TestAttempt.find({ test: test._id, status: 'completed' });
  const avgScore = allAttempts.reduce((sum, a) => sum + a.percentage, 0) / allAttempts.length;
  const passCount = allAttempts.filter((a) => a.isPassed).length;

  await Test.findByIdAndUpdate(test._id, {
    totalAttempts: allAttempts.length,
    averageScore: Math.round(avgScore),
    passRate: Math.round((passCount / allAttempts.length) * 100),
  });

  // Update user stats
  await User.findByIdAndUpdate(req.userId, {
    $inc: { totalTestsTaken: 1, totalPoints: attempt.isPassed ? 10 : 2 },
  });

  const correctAnswers = gradedAnswers.filter((a) => a.isCorrect).length;
  const incorrectAnswers = gradedAnswers.filter(
    (a) => !a.isCorrect && (a.selectedOptions?.length > 0 || a.textAnswer)
  ).length;
  const totalQuestions = test.questions.length;

  ApiResponse.ok(
    res,
    {
      score: attempt.score,
      totalScore: attempt.totalMarks,
      totalMarks: attempt.totalMarks,
      percentage: attempt.percentage,
      isPassed: attempt.isPassed,
      timeTaken: attempt.timeTaken,
      correctAnswers,
      incorrectAnswers,
      unanswered: totalQuestions - correctAnswers - incorrectAnswers,
      totalQuestions,
    },
    'Test submitted successfully'
  );
});

export const getTestResult = catchAsync(async (req, res) => {
  const attempt = await TestAttempt.findOne({
    _id: req.params.attemptId,
    user: req.userId,
  }).populate('test', 'title questions passingMarks duration');

  if (!attempt) {
    throw ApiError.notFound('Test attempt not found');
  }

  ApiResponse.ok(res, { attempt });
});

export const getMyAttempts = catchAsync(async (req, res) => {
  const pagination = buildPaginationQuery(req.query);

  const filter = { user: req.userId, status: 'completed' };
  if (req.query.testId) filter.test = req.query.testId;

  const result = await TestAttempt.paginate(filter, {
    ...pagination,
    populate: { path: 'test', select: 'title category duration totalMarks' },
    select: '-answers',
    sort: '-completedAt',
  });

  ApiResponse.paginated(res, {
    docs: result.docs,
    page: result.pagination.page,
    limit: result.pagination.limit,
    total: result.pagination.total,
  });
});

// ===== TEACHER =====

export const createTest = catchAsync(async (req, res) => {
  const test = await Test.create({
    ...req.body,
    slug: generateSlug(req.body.title),
    teacher: req.userId,
  });

  ApiResponse.created(res, { test }, 'Test created successfully');
});

export const updateTest = catchAsync(async (req, res) => {
  const test = await Test.findOneAndUpdate({ _id: req.params.id, teacher: req.userId }, req.body, {
    new: true,
    runValidators: true,
  });

  if (!test) {
    throw ApiError.notFound('Test not found or unauthorized');
  }

  ApiResponse.ok(res, { test }, 'Test updated');
});

export const deleteTest = catchAsync(async (req, res) => {
  const test = await Test.findOneAndDelete({ _id: req.params.id, teacher: req.userId });

  if (!test) {
    throw ApiError.notFound('Test not found or unauthorized');
  }

  // Clean up attempts
  await TestAttempt.deleteMany({ test: test._id });

  ApiResponse.ok(res, null, 'Test deleted');
});

export const getTeacherTests = catchAsync(async (req, res) => {
  const pagination = buildPaginationQuery(req.query);

  const filter = { teacher: req.userId };
  if (req.query.status) filter.status = req.query.status;
  if (req.query.search) filter.title = { $regex: req.query.search, $options: 'i' };

  const result = await Test.paginate(filter, {
    ...pagination,
    populate: { path: 'category', select: 'name' },
    select:
      'title description duration difficulty status isPublished questionsCount totalAttempts category createdAt questions',
  });

  // Compute questionsCount from array length for seeded docs that skipped the pre-save hook
  const docs = result.docs.map((doc) => {
    const obj = doc.toObject ? doc.toObject() : { ...doc };
    obj.questionsCount = obj.questionsCount || (obj.questions?.length ?? 0);
    delete obj.questions; // don't send full questions in list
    return obj;
  });

  ApiResponse.paginated(res, {
    docs,
    page: result.pagination.page,
    limit: result.pagination.limit,
    total: result.pagination.total,
  });
});

export const getTestAnalytics = catchAsync(async (req, res) => {
  const test = await Test.findOne({ _id: req.params.id, teacher: req.userId });
  if (!test) throw ApiError.notFound('Test not found');

  const attempts = await TestAttempt.find({ test: test._id, status: 'completed' }).lean();

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

  ApiResponse.ok(res, { analytics });
});
