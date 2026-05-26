import { z } from 'zod';

const optionValidationSchema = z.object({
  text: z.string({ required_error: 'Option text is required' }).min(1),
  isCorrect: z.boolean({ required_error: 'isCorrect is required' }),
});

const questionValidationSchema = z.object({
  question: z.string({ required_error: 'Question text is required' }).min(5),
  type: z.enum(['mcq', 'msq', 'true_false', 'fill_blank', 'subjective']),
  options: z.array(optionValidationSchema).optional(),
  correctAnswer: z.string().optional(),
  marks: z.number({ required_error: 'Marks is required' }).min(0),
  negativeMarks: z
    .number()
    .default(0)
    .refine((val) => val >= 0, {
      message: 'Negative marks must be 0 or positive',
    }),
  explanation: z.string().optional(),
  difficulty: z.enum(['easy', 'medium', 'hard']).default('medium'),
  tags: z.array(z.string()).optional(),
  sectionName: z.string().default('General'),
  order: z.number().default(0),
});

const testBodySchema = z.object({
  title: z.string({ required_error: 'Title is required' }).min(5).max(200),
  description: z.string().max(2000).default(''),
  instructions: z.string().max(2000).default(''),
  category: z
    .string({ required_error: 'Category is required' })
    .refine((val) => /^[0-9a-fA-F]{24}$/.test(val), {
      message: 'Invalid Category ID format',
    }),
  questions: z.array(questionValidationSchema).min(1, 'At least one question is required'),
  duration: z.number({ required_error: 'Duration in minutes is required' }).min(1),
  totalMarks: z.number({ required_error: 'Total marks is required' }).min(1),
  passingMarks: z.number({ required_error: 'Passing marks is required' }).min(0),
  difficulty: z.enum(['beginner', 'intermediate', 'advanced']).default('intermediate'),
  maxAttempts: z.number().default(0),
  isFree: z.boolean().default(true),
  price: z
    .number()
    .default(0)
    .refine((val) => val >= 0, {
      message: 'Price must be 0 or positive',
    }),
  randomizeQuestions: z.boolean().default(false),
  randomizeOptions: z.boolean().default(false),
  status: z.enum(['draft', 'published', 'archived']).default('draft'),
  scheduledAt: z.preprocess(
    (arg) => (typeof arg === 'string' || arg instanceof Date ? new Date(arg) : undefined),
    z.date().optional()
  ),
});

export const createTestSchema = z.object({
  body: testBodySchema.refine((data) => data.passingMarks <= data.totalMarks, {
    message: 'Passing marks cannot exceed total marks',
    path: ['passingMarks'],
  }),
});

export const updateTestSchema = z.object({
  body: testBodySchema.partial(),
});

export const autoSaveSchema = z.object({
  body: z.object({
    answers: z
      .array(
        z.object({
          questionId: z.string().refine((val) => /^[0-9a-fA-F]{24}$/.test(val), {
            message: 'Invalid question ID format',
          }),
          selectedOptions: z.array(z.number()).optional(),
          textAnswer: z.string().optional(),
          timeTaken: z.number().default(0),
        })
      )
      .default([]),
    palette: z
      .array(
        z.object({
          questionId: z.string().refine((val) => /^[0-9a-fA-F]{24}$/.test(val), {
            message: 'Invalid question ID format',
          }),
          status: z.enum(['visited', 'skipped', 'flagged', 'answered']),
        })
      )
      .optional(),
  }),
});

export const submitTestSchema = z.object({
  body: z.object({
    answers: z.array(
      z.object({
        questionId: z.string().refine((val) => /^[0-9a-fA-F]{24}$/.test(val), {
          message: 'Invalid question ID format',
        }),
        selectedOptions: z.array(z.number()).optional(),
        textAnswer: z.string().optional(),
        timeTaken: z.number().default(0),
      })
    ),
  }),
});

export const gradeSubjectiveSchema = z.object({
  body: z.object({
    questionId: z
      .string()
      .refine((val) => /^[0-9a-fA-F]{24}$/.test(val), { message: 'Invalid question ID format' }),
    marksObtained: z.number().min(0),
    feedback: z.string().optional(),
  }),
});
