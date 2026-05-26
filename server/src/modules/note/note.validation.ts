import { z } from 'zod';

const objectIdRegex = /^[0-9a-fA-F]{24}$/;

export const createNoteSchema = z.object({
  body: z.object({
    content: z
      .string({ required_error: 'Content is required' })
      .trim()
      .min(1, 'Content cannot be empty')
      .max(5000, 'Content cannot exceed 5000 characters'),
    lessonId: z.string().regex(objectIdRegex, 'Invalid Lesson ID').optional(),
    timestamp: z.number().min(0, 'Timestamp cannot be negative').optional(),
    color: z.string().trim().optional(),
  }),
});

export const updateNoteSchema = z.object({
  body: z.object({
    content: z.string().trim().min(1).max(5000).optional(),
    color: z.string().trim().optional(),
    isPinned: z.boolean().optional(),
  }),
});
