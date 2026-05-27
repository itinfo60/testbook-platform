import { z } from 'zod';

export const createDoubtSchema = z.object({
  question: z.string().min(1, { message: 'Question is required' }),
  context: z.string().optional(),
});

export const answerDoubtSchema = z.object({
  doubtId: z.string().uuid({ message: 'Invalid doubt ID' }),
});
