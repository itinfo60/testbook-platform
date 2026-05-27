import { z } from 'zod';

export const createExamSchema = z.object({
  title: z.string().min(1),
  courseId: z.string().uuid(),
  scheduledAt: z.preprocess((arg) => new Date(arg), z.date()),
  durationMinutes: z.number().int().positive().default(60),
  antiCheatOptions: z
    .object({
      webcamSnapshot: z.boolean().optional().default(false),
      screenShare: z.boolean().optional().default(false),
      idVerification: z.boolean().optional().default(false),
    })
    .optional(),
});

export const startExamSchema = z.object({
  examId: z.string().uuid(),
});

export const submitExamSchema = z.object({
  examId: z.string().uuid(),
  answers: z.array(
    z.object({
      questionId: z.string().uuid(),
      answer: z.any(),
    })
  ),
});
