import { randomUUID } from 'node:crypto';
import prisma from '../../config/prisma.js';
import ApiError from '../../utils/ApiError.js';
import ApiResponse from '../../utils/ApiResponse.js';
import catchAsync from '../../utils/catchAsync.js';

const isAdmin = (req) => ['admin', 'super_admin', 'superadmin'].includes(req.user?.role);
const assertAuthor = (quiz, req) => {
  if (!isAdmin(req) && quiz.teacherId !== req.userId) throw ApiError.forbidden('Not authorized');
};

// Legacy questions without IDs use their array index consistently for display and grading.
const withQuestionIds = (quiz) => ({
  ...quiz,
  questions: (Array.isArray(quiz.questions) ? quiz.questions : []).map((q, index) => ({
    ...q,
    id: q.id || q._id || String(index),
  })),
});
const publicQuiz = (quiz) => ({
  ...quiz,
  questions: withQuestionIds(quiz).questions.map(
    ({ correctAnswer, correctOption, explanation, ...q }) => ({
      ...q,
      options: (q.options || []).map(({ isCorrect, ...option }) => option),
    })
  ),
});
const normalizeQuestions = (questions) => {
  if (!Array.isArray(questions) || !questions.length)
    throw ApiError.badRequest('At least one question is required');
  const ids = new Set();
  return questions.map((q) => {
    if (
      !q ||
      typeof q.question !== 'string' ||
      !q.question.trim() ||
      !Array.isArray(q.options) ||
      q.options.length < 2 ||
      q.options.some((o) => !o || typeof o.text !== 'string' || !o.text.trim()) ||
      q.options.filter((o) => o.isCorrect === true).length !== 1
    ) {
      throw ApiError.badRequest(
        'Each quiz question needs text, at least two options, and exactly one correct answer'
      );
    }
    const id = q.id || q._id || randomUUID();
    if (ids.has(id)) throw ApiError.badRequest('Question IDs must be unique');
    ids.add(id);
    return { ...q, id };
  });
};
const quizFields = async (req, existing = null) => {
  const body = req.body;
  const data = {};
  if (body.type !== undefined) {
    if (!['daily', 'course'].includes(body.type)) throw ApiError.badRequest('Invalid quiz type');
    data.type = body.type;
  }
  if (body.courseId !== undefined || body.course !== undefined)
    data.courseId = body.courseId || body.course || null;
  if (data.type === 'daily') data.courseId = null;
  const courseId = data.courseId !== undefined ? data.courseId : existing?.courseId;
  if ((data.type || existing?.type) === 'course' && !courseId)
    throw ApiError.badRequest('Course is required');
  if (courseId) {
    const course = await prisma.course.findFirst({ where: { id: courseId } });
    if (!course) throw ApiError.notFound('Course not found');
    if (!isAdmin(req) && course.teacherId !== req.userId)
      throw ApiError.forbidden('Not authorized for this course');
  }
  if (body.examCategory !== undefined) data.examCategory = body.examCategory || null;
  if (body.passingScore !== undefined) {
    const score = Number(body.passingScore);
    if (!Number.isInteger(score) || score < 0 || score > 100)
      throw ApiError.badRequest('Passing score must be between 0 and 100');
    data.passingScore = score;
  }
  if (body.questions !== undefined) data.questions = normalizeQuestions(body.questions);
  if (body.duration !== undefined || body.timeLimit !== undefined) {
    const duration = Number(body.timeLimit ?? body.duration);
    if (!Number.isInteger(duration) || duration < 1)
      throw ApiError.badRequest('Duration must be a positive integer');
    data.timeLimit = duration;
  }
  if (!existing) data.teacherId = isAdmin(req) && body.teacherId ? body.teacherId : req.userId;
  else if (isAdmin(req) && body.teacherId) data.teacherId = body.teacherId;
  return data;
};

export const getAllQuizzes = catchAsync(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  const where = { isPublished: true };
  if (req.query.type) where.type = req.query.type;
  if (req.query.courseId) where.courseId = req.query.courseId;
  if (req.query.search) {
    where.OR = [
      { title: { contains: req.query.search, mode: 'insensitive' } },
      { description: { contains: req.query.search, mode: 'insensitive' } },
    ];
  }

  const [docs, total] = await Promise.all([
    prisma.quiz.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        // examCategory: { select: { id: true, name: true, slug: true } } // Uncomment if examCategory is added to schema
      },
    }),
    prisma.quiz.count({ where }),
  ]);

  const sanitizedDocs = docs.map(publicQuiz);

  ApiResponse.paginated(res, {
    docs: sanitizedDocs,
    page,
    limit,
    total,
  });
});

export const getCourseQuizzes = catchAsync(async (req, res) => {
  const quizzes = await prisma.quiz.findMany({
    where: {
      courseId: req.params.courseId,
      isPublished: true,
    },
    orderBy: { createdAt: 'asc' },
  });

  const sanitizedQuizzes = quizzes.map(publicQuiz);

  // Get user's attempts
  if (req.user) {
    const attempts = await prisma.quizAttempt.findMany({
      where: {
        userId: req.userId,
        quizId: { in: quizzes.map((q) => q.id) },
      },
    });

    sanitizedQuizzes.forEach((quiz) => {
      const quizAttempts = attempts.filter((a) => a.quizId === quiz.id);
      quiz.userAttempts = quizAttempts.length;
      quiz.bestScore = quizAttempts.length
        ? Math.max(
            ...quizAttempts.map((a) =>
              quiz.questions.length ? Math.round((a.score / quiz.questions.length) * 100) : 0
            )
          )
        : null;
    });
  }

  ApiResponse.ok(res, { quizzes: sanitizedQuizzes });
});

export const submitQuiz = catchAsync(async (req, res) => {
  const quizId = req.body.quizId || req.params?.id || req.body.id;
  const answers = req.body.answers || [];
  if (!quizId || !Array.isArray(answers))
    throw ApiError.badRequest('Quiz ID and an answers array are required');

  const quiz = await prisma.quiz.findUnique({ where: { id: quizId } });
  if (!quiz || !quiz.isPublished) throw ApiError.notFound('Quiz not found');

  // Verify enrollment only if this quiz belongs to a paid course
  if (quiz.courseId) {
    if (!req.userId) throw ApiError.unauthorized('Sign in to take course quizzes');
    const enrollment = await prisma.enrollment.findFirst({
      where: {
        userId: req.userId,
        courseId: quiz.courseId,
        status: { in: ['active', 'completed'] },
      },
    });
    if (!enrollment) throw ApiError.forbidden('Enrollment required for course quizzes');
  }

  // Grade
  const gradedAnswers = [];
  let correctCount = 0;
  const qs = withQuestionIds(quiz).questions;
  const answered = new Set();

  for (const answer of answers) {
    if (!answer || typeof answer.questionId !== 'string')
      throw ApiError.badRequest('Invalid answer');
    const question = qs.find((q) => q.id === answer.questionId);
    if (!question) throw ApiError.badRequest('Unknown question');
    if (answered.has(question.id)) throw ApiError.badRequest('Duplicate answer');
    answered.add(question.id);

    const selectedOptionVal = answer.selectedOption;
    let isCorrect = false;

    if (
      Number.isInteger(selectedOptionVal) &&
      selectedOptionVal >= 0 &&
      selectedOptionVal < question.options.length
    ) {
      isCorrect = question.options[selectedOptionVal].isCorrect;
    } else {
      const option =
        typeof selectedOptionVal === 'string' &&
        question.options.find((o) => o.id === selectedOptionVal || o._id === selectedOptionVal);
      isCorrect = option ? option.isCorrect : false;
    }

    if (isCorrect) correctCount++;

    gradedAnswers.push({
      questionId: answer.questionId,
      selectedOption: answer.selectedOption,
      isCorrect,
    });
  }

  const totalQuestions = qs.length;
  const percentage = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;
  const isPassed = percentage >= (quiz.passingScore ?? 60);

  if (req.userId) {
    await prisma.quizAttempt.create({
      data: {
        userId: req.userId,
        quizId: quiz.id,
        answers: gradedAnswers,
        score: correctCount,
      },
    });
  }

  ApiResponse.ok(
    res,
    {
      score: correctCount,
      totalQuestions,
      percentage,
      isPassed,
      answers: gradedAnswers,
    },
    'Quiz submitted'
  );
});

export const getQuizById = catchAsync(async (req, res) => {
  const quiz = await prisma.quiz.findFirst({
    where: { id: req.params.id, isPublished: true },
  });

  if (!quiz) throw ApiError.notFound('Quiz not found or not published');

  ApiResponse.ok(res, { quiz: publicQuiz(quiz) });
});

// Teacher
export const getTeacherQuizById = catchAsync(async (req, res) => {
  const quiz = await prisma.quiz.findUnique({
    where: { id: req.params.id },
  });
  if (!quiz) throw ApiError.notFound('Quiz not found');

  assertAuthor(quiz, req);
  ApiResponse.ok(res, { quiz: withQuestionIds(quiz) });
});

export const createQuiz = catchAsync(async (req, res) => {
  const { title, description, isPublished } = req.body;
  if (typeof title !== 'string' || !title.trim())
    throw ApiError.badRequest('Quiz title is required');
  const fields = await quizFields(req);
  if (!fields.questions) throw ApiError.badRequest('At least one question is required');

  const quiz = await prisma.quiz.create({
    data: {
      title,
      description: description || '',
      isPublished: isPublished !== undefined ? Boolean(isPublished) : true,
      timeLimit: 15,
      ...fields,
      tenantId: req.tenantId || req.user?.tenantId || null,
    },
  });
  ApiResponse.created(res, { quiz }, 'Quiz created');
});

export const updateQuiz = catchAsync(async (req, res) => {
  const existing = await prisma.quiz.findUnique({ where: { id: req.params.id } });
  if (!existing) throw ApiError.notFound('Quiz not found');

  assertAuthor(existing, req);
  const { title, description, isPublished } = req.body;
  const updateData = await quizFields(req, existing);
  if (title) updateData.title = title;
  if (description !== undefined) updateData.description = description;
  if (isPublished !== undefined) updateData.isPublished = Boolean(isPublished);

  const quiz = await prisma.quiz.update({
    where: { id: req.params.id },
    data: updateData,
  });
  ApiResponse.ok(res, { quiz }, 'Quiz updated');
});

export const deleteQuiz = catchAsync(async (req, res) => {
  const existing = await prisma.quiz.findUnique({ where: { id: req.params.id } });
  if (!existing) throw ApiError.notFound('Quiz not found');

  assertAuthor(existing, req);
  await prisma.quizAttempt.deleteMany({ where: { quizId: existing.id } });
  await prisma.quiz.delete({ where: { id: existing.id } });

  ApiResponse.ok(res, null, 'Quiz deleted');
});

export const getTeacherQuizzes = catchAsync(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  const where = { teacherId: req.userId };
  if (req.query.courseId) where.courseId = req.query.courseId;
  if (req.query.search) {
    where.title = { contains: req.query.search, mode: 'insensitive' };
  }

  const [docs, total] = await Promise.all([
    prisma.quiz.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.quiz.count({ where }),
  ]);

  ApiResponse.paginated(res, {
    docs,
    page,
    limit,
    total,
  });
});
