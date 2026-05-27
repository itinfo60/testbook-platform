import mongoose from 'mongoose';
import GeneratedQuiz from './generatedQuiz.model.js';
import { generateQuiz as generateQuizFromLLM } from '../ai/llm.service.js';
import ApiError from '../../utils/ApiError.js';
import ApiResponse from '../../utils/ApiResponse.js';
import catchAsync from '../../utils/catchAsync.js';

export const generateQuiz = catchAsync(async (req, res) => {
  const { prompt, courseId, title } = req.body;
  if (!prompt || !courseId) {
    throw ApiError.badRequest('prompt and courseId are required');
  }
  // Call LLM service (streaming) and collect full response
  const stream = await generateQuizFromLLM(prompt);
  let collected = '';
  for await (const chunk of stream) {
    collected += chunk;
  }
  let quizData;
  try {
    quizData = JSON.parse(collected);
  } catch (e) {
    throw ApiError.badRequest('LLM returned invalid JSON');
  }
  // Attach context info
  const response = {
    title: title || quizData.title || 'Generated Quiz',
    course: courseId,
    teacher: req.userId,
    questions: quizData.questions || [],
  };
  ApiResponse.ok(res, { quiz: response }, 'Quiz generated');
});

export const saveQuiz = catchAsync(async (req, res) => {
  const { title, course, questions } = req.body;
  if (!title || !course || !Array.isArray(questions)) {
    throw ApiError.badRequest('title, course and questions are required');
  }
  const quiz = await GeneratedQuiz.create({
    title,
    course,
    teacher: req.userId,
    questions,
    status: 'saved',
  });
  ApiResponse.created(res, { quiz }, 'Quiz saved');
});
