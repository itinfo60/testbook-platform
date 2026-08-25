import prisma from '../../config/prisma.js';
import ApiError from '../../utils/ApiError.js';
import ApiResponse from '../../utils/ApiResponse.js';
import catchAsync from '../../utils/catchAsync.js';

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

  // Strip isCorrect from options
  const sanitizedDocs = docs.map((quiz) => {
    const qs = Array.isArray(quiz.questions) ? quiz.questions : [];
    qs.forEach((q) => {
      if (Array.isArray(q.options)) {
        q.options.forEach((opt) => delete opt.isCorrect);
      }
    });
    return { ...quiz, questions: qs };
  });

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

  const sanitizedQuizzes = quizzes.map((quiz) => {
    const qs = Array.isArray(quiz.questions) ? quiz.questions : [];
    qs.forEach((q) => {
      if (Array.isArray(q.options)) {
        q.options.forEach((opt) => delete opt.isCorrect);
      }
    });
    return { ...quiz, questions: qs };
  });

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
        ? Math.max(...quizAttempts.map((a) => a.percentage || a.score || 0))
        : null;
    });
  }

  ApiResponse.ok(res, { quizzes: sanitizedQuizzes });
});

export const submitQuiz = catchAsync(async (req, res) => {
  const { quizId, answers } = req.body;

  const quiz = await prisma.quiz.findUnique({ where: { id: quizId } });
  if (!quiz || !quiz.isPublished) throw ApiError.notFound('Quiz not found');

  // Verify enrollment
  const enrollment = await prisma.enrollment.findFirst({
    where: {
      userId: req.userId,
      courseId: quiz.courseId,
      status: { in: ['active', 'completed'] },
    },
  });
  if (!enrollment) throw ApiError.forbidden('Enrollment required');

  // Grade
  const gradedAnswers = [];
  let correctCount = 0;
  const qs = Array.isArray(quiz.questions) ? quiz.questions : [];

  for (const answer of answers) {
    const question = qs.find((q) => q.id === answer.questionId || q._id === answer.questionId);
    if (!question) continue;

    const selectedOptionVal = answer.selectedOption;
    let isCorrect = false;

    if (typeof selectedOptionVal === 'number' && selectedOptionVal < question.options.length) {
      isCorrect = question.options[selectedOptionVal].isCorrect;
    } else {
      const option = question.options.find(
        (o) => o.id === selectedOptionVal || o._id === selectedOptionVal
      );
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
  const isPassed = percentage >= (quiz.passingScore || 60);

  const attempt = await prisma.quizAttempt.create({
    data: {
      userId: req.userId,
      quizId: quiz.id,
      // courseId: quiz.courseId, // Uncomment if schema supports courseId in quizAttempt
      answers: gradedAnswers,
      score: correctCount,
      // percentage, // Uncomment if added to schema
      // totalQuestions,
      // isPassed
    },
  });

  // Update quiz stats
  const allAttempts = await prisma.quizAttempt.count({ where: { quizId: quiz.id } });
  const avgScoreRaw = await prisma.quizAttempt.aggregate({
    where: { quizId: quiz.id },
    _avg: { score: true }, // assuming we average the correctCount or score
  });

  await prisma.quiz.update({
    where: { id: quiz.id },
    data: {
      totalAttempts: allAttempts,
      averageScore: Math.round(avgScoreRaw._avg.score || 0),
    },
  });

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

  const qs = Array.isArray(quiz.questions) ? quiz.questions : [];
  qs.forEach((q) => {
    if (Array.isArray(q.options)) {
      q.options.forEach((opt) => delete opt.isCorrect);
    }
  });
  quiz.questions = qs;

  ApiResponse.ok(res, { quiz });
});

// Teacher
export const getTeacherQuizById = catchAsync(async (req, res) => {
  const quiz = await prisma.quiz.findUnique({
    where: { id: req.params.id },
  });
  if (!quiz) throw ApiError.notFound('Quiz not found');

  if (quiz.teacherId !== req.userId && req.user?.role !== 'admin') {
    throw ApiError.forbidden('Not authorized');
  }
  ApiResponse.ok(res, { quiz });
});

export const createQuiz = catchAsync(async (req, res) => {
  const { title, description, isPublished, questions, duration, timeLimit } = req.body;
  if (!title) throw ApiError.badRequest('Quiz title is required');

  const quiz = await prisma.quiz.create({
    data: {
      title,
      description: description || '',
      isPublished: isPublished !== undefined ? Boolean(isPublished) : true,
      questions: questions || [],
      timeLimit: Number(timeLimit || duration || 15),
      tenantId: req.tenantId || req.user?.tenantId || null,
    },
  });
  ApiResponse.created(res, { quiz }, 'Quiz created');
});

export const updateQuiz = catchAsync(async (req, res) => {
  const existing = await prisma.quiz.findUnique({ where: { id: req.params.id } });
  if (!existing) throw ApiError.notFound('Quiz not found');

  const { title, description, isPublished, questions, duration, timeLimit } = req.body;
  const updateData = {};
  if (title) updateData.title = title;
  if (description !== undefined) updateData.description = description;
  if (isPublished !== undefined) updateData.isPublished = Boolean(isPublished);
  if (questions !== undefined) updateData.questions = questions;
  if (duration || timeLimit) updateData.timeLimit = Number(timeLimit || duration);

  const quiz = await prisma.quiz.update({
    where: { id: req.params.id },
    data: updateData,
  });
  ApiResponse.ok(res, { quiz }, 'Quiz updated');
});

export const deleteQuiz = catchAsync(async (req, res) => {
  const existing = await prisma.quiz.findUnique({ where: { id: req.params.id } });
  if (!existing) throw ApiError.notFound('Quiz not found');

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
