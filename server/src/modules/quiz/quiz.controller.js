import mongoose from 'mongoose';
import Quiz from './quiz.model.js';
import QuizAttempt from './quizAttempt.model.js';
import Enrollment from '../enrollment/enrollment.model.js';
import ApiError from '../../utils/ApiError.js';
import ApiResponse from '../../utils/ApiResponse.js';
import catchAsync from '../../utils/catchAsync.js';
import { buildPaginationQuery } from '../../utils/pagination.js';

export const getCourseQuizzes = catchAsync(async (req, res) => {
  const quizzes = await Quiz.find({
    course: req.params.courseId,
    isPublished: true,
  })
    .select('-questions.options.isCorrect')
    .sort('createdAt')
    .lean();

  // Get user's attempts
  if (req.user) {
    const attempts = await QuizAttempt.find({
      user: req.userId,
      quiz: { $in: quizzes.map((q) => q._id) },
    }).lean();

    quizzes.forEach((quiz) => {
      const quizAttempts = attempts.filter((a) => a.quiz.toString() === quiz._id.toString());
      quiz.userAttempts = quizAttempts.length;
      quiz.bestScore = quizAttempts.length
        ? Math.max(...quizAttempts.map((a) => a.percentage))
        : null;
    });
  }

  ApiResponse.ok(res, { quizzes });
});

export const submitQuiz = catchAsync(async (req, res) => {
  const { quizId, answers } = req.body;

  const quiz = await Quiz.findById(quizId);
  if (!quiz || !quiz.isPublished) throw ApiError.notFound('Quiz not found');

  // Verify enrollment
  const enrollment = await Enrollment.findOne({
    user: req.userId,
    course: quiz.course,
    status: { $in: ['active', 'completed'] },
  });
  if (!enrollment) throw ApiError.forbidden('Enrollment required');

  // Grade
  const gradedAnswers = [];
  let correctCount = 0;

  for (const answer of answers) {
    const question = quiz.questions.id(answer.questionId);
    if (!question) continue;

    const selectedOptionVal = answer.selectedOption;
    let isCorrect = false;

    if (typeof selectedOptionVal === 'number' && selectedOptionVal < question.options.length) {
       isCorrect = question.options[selectedOptionVal].isCorrect;
    } else {
       const option = question.options.id(selectedOptionVal);
       isCorrect = option ? option.isCorrect : false;
    }

    if (isCorrect) correctCount++;

    gradedAnswers.push({
      questionId: answer.questionId,
      selectedOption: answer.selectedOption,
      isCorrect,
    });
  }

  const totalQuestions = quiz.questions.length;
  const percentage = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;
  const isPassed = percentage >= quiz.passingScore;

  const attempt = await QuizAttempt.create({
    user: req.userId,
    quiz: quizId,
    course: quiz.course,
    answers: gradedAnswers,
    score: correctCount,
    totalQuestions,
    percentage,
    isPassed,
  });

  // Update quiz stats
  const allAttempts = await QuizAttempt.countDocuments({ quiz: quizId });
  const avgScore = await QuizAttempt.aggregate([
    { $match: { quiz: quiz._id } },
    { $group: { _id: null, avg: { $avg: '$percentage' } } },
  ]);

  await Quiz.findByIdAndUpdate(quizId, {
    totalAttempts: allAttempts,
    averageScore: Math.round(avgScore[0]?.avg || 0),
  });

  ApiResponse.ok(res, {
    score: correctCount,
    totalQuestions,
    percentage,
    isPassed,
    answers: gradedAnswers,
  }, 'Quiz submitted');
});

// Teacher
export const getTeacherQuizById = catchAsync(async (req, res) => {
  const quiz = await Quiz.findById(req.params.id).populate('course', 'title');
  if (!quiz) throw ApiError.notFound('Quiz not found');
  // Allow teacher who owns it or admin
  if (quiz.teacher.toString() !== req.userId && req.user?.role !== 'admin') {
    throw ApiError.forbidden('Not authorized');
  }
  ApiResponse.ok(res, { quiz });
});

export const createQuiz = catchAsync(async (req, res) => {
  const quiz = await Quiz.create({ ...req.body, teacher: req.userId });
  ApiResponse.created(res, { quiz }, 'Quiz created');
});

export const updateQuiz = catchAsync(async (req, res) => {
  const quiz = await Quiz.findOneAndUpdate(
    { _id: req.params.id, teacher: req.userId },
    req.body,
    { new: true, runValidators: true }
  );
  if (!quiz) throw ApiError.notFound('Quiz not found');
  ApiResponse.ok(res, { quiz }, 'Quiz updated');
});

export const deleteQuiz = catchAsync(async (req, res) => {
  const quiz = await Quiz.findOneAndDelete({ _id: req.params.id, teacher: req.userId });
  if (!quiz) throw ApiError.notFound('Quiz not found');
  await QuizAttempt.deleteMany({ quiz: quiz._id });
  ApiResponse.ok(res, null, 'Quiz deleted');
});

export const getTeacherQuizzes = catchAsync(async (req, res) => {
  const pagination = buildPaginationQuery(req.query);

  const filter = { teacher: req.userId };
  if (req.query.courseId) filter.course = req.query.courseId;
  if (req.query.search) filter.title = { $regex: req.query.search, $options: 'i' };

  const result = await Quiz.paginate(filter, {
    ...pagination,
    populate: { path: 'course', select: 'title' },
  });

  ApiResponse.paginated(res, {
    docs: result.docs,
    page: result.pagination.page,
    limit: result.pagination.limit,
    total: result.pagination.total,
  });
});
