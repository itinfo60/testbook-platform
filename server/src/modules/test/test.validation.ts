import { z } from 'zod';

const optionValidationSchema = z.union([
  z.object({
    text: z.string().min(1),
    isCorrect: z.boolean().optional(),
  }),
  z.string(),
]);

const questionValidationSchema = z.object({
  id: z.string().optional(),
  question: z.string({ required_error: 'Question text is required' }).min(3),
  type: z.enum(['mcq', 'msq', 'true_false', 'fill_blank', 'subjective']).default('mcq'),
  options: z.array(optionValidationSchema).optional(),
  correctOption: z.union([z.number(), z.string()]).optional(),
  correctAnswer: z.string().optional(),
  marks: z.number().default(2),
  negativeMarks: z.number().default(0),
  explanation: z.string().optional(),
  difficulty: z.enum(['easy', 'medium', 'hard']).default('medium'),
  tags: z.array(z.string()).optional(),
  sectionName: z.string().default('General'),
  order: z.number().default(0),
});

const testBodySchema = z.object({
  title: z.string({ required_error: 'Title is required' }).min(3).max(200),
  description: z.string().max(2000).default(''),
  instructions: z.string().max(2000).default(''),
  category: z.string().optional(),
  categoryId: z.string().optional(),
  examCategory: z.string().optional(),
  testSeries: z.string().optional(),
  sectionTag: z.string().optional(),
  subjectTag: z.string().optional(),
  questions: z.array(questionValidationSchema).min(1, 'At least one question is required'),
  duration: z.number({ required_error: 'Duration in minutes is required' }).min(1),
  totalMarks: z.number({ required_error: 'Total marks is required' }).min(1),
  passingMarks: z.number().min(0).optional().default(0),
  difficulty: z
    .enum(['beginner', 'intermediate', 'advanced', 'easy', 'medium', 'hard'])
    .default('intermediate'),
  maxAttempts: z.number().default(0),
  isFree: z.boolean().default(true),
  isPublished: z.boolean().optional(),
  price: z.number().min(0).default(0),
  randomizeQuestions: z.boolean().default(false),
  randomizeOptions: z.boolean().default(false),
  status: z.enum(['draft', 'published', 'archived']).default('draft'),
  scheduledAt: z.preprocess(
    (arg) => (typeof arg === 'string' || arg instanceof Date ? new Date(arg) : undefined),
    z.date().optional()
  ),
});

export const createTestSchema = testBodySchema.refine(
  (data) => !data.passingMarks || data.passingMarks <= data.totalMarks,
  { message: 'Passing marks cannot exceed total marks', path: ['passingMarks'] }
);

export const updateTestSchema = testBodySchema.partial();

export const autoSaveSchema = z.object({
  answers: z
    .array(
      z.object({
        questionId: z.string(),
        selectedOptions: z.array(z.number()).optional(),
        textAnswer: z.string().optional(),
        timeTaken: z.number().default(0),
      })
    )
    .default([]),
  palette: z
    .array(
      z.object({
        questionId: z.string(),
        status: z.enum(['visited', 'skipped', 'flagged', 'answered']),
      })
    )
    .optional(),
});

export const submitTestSchema = z.object({
  answers: z.array(
    z.object({
      questionId: z.string(),
      selectedOptions: z.array(z.number()).optional(),
      textAnswer: z.string().optional(),
      timeTaken: z.number().default(0),
    })
  ),
});

export const gradeSubjectiveSchema = z.object({
  questionId: z.string(),
  marksObtained: z.number().min(0),
  feedback: z.string().optional(),
});
