import { z } from 'zod';

export const generateQuestionsSchema = z.object({
  body: z.object({
    subject: z.string({ required_error: 'subject is required' }).min(1),
    topic: z.string({ required_error: 'topic is required' }).min(1),
    difficulty: z.enum(['easy', 'medium', 'hard']).default('medium'),
    language: z.string().default('English'),
    count: z.number().min(1).max(20).default(5),
    type: z.enum(['mcq', 'msq', 'true_false', 'fill_blank']).default('mcq'),
  }),
});

export const solveDoubtSchema = z.object({
  body: z
    .object({
      question: z.string().min(1).optional(),
      subject: z.string().optional(),
      imageBase64: z.string().optional(),
      stream: z.boolean().default(false),
      courseContext: z.string().optional(),
    })
    .refine((data) => data.question || data.imageBase64, {
      message: 'Either question text or imageBase64 is required',
    }),
});

export const generateStudyPlanSchema = z.object({
  body: z.object({
    examName: z.string({ required_error: 'examName is required' }).min(1),
    targetDate: z.string({ required_error: 'targetDate is required' }).min(1),
    hoursPerDay: z.number().min(1).max(24).default(3),
    weakTopics: z.array(z.string()).default([]),
    strongTopics: z.array(z.string()).default([]),
  }),
});

export const detectWeakTopicsSchema = z.object({
  body: z.object({
    attempts: z
      .array(
        z.object({
          topic: z.string({ required_error: 'topic is required' }),
          score: z.number().min(0),
          total: z.number().min(1),
        })
      )
      .min(1, 'At least one test attempt is required for analysis'),
  }),
});

export const indexCourseContentSchema = z.object({
  body: z.object({
    courseId: z
      .string()
      .refine((val) => /^[0-9a-fA-F]{24}$/.test(val), { message: 'Invalid courseId format' }),
    content: z.string({ required_error: 'content is required' }).min(10),
    title: z.string({ required_error: 'title is required' }).min(1),
  }),
});
