import { z } from 'zod';

const objectIdRegex = /^[0-9a-fA-F]{24}$/;

export const createReviewSchema = z.object({
  course: z
    .string({ required_error: 'Course ID is required' })
    .regex(objectIdRegex, 'Invalid Course ID'),
  rating: z
    .number({ required_error: 'Rating is required' })
    .int()
    .min(1, 'Rating must be at least 1')
    .max(5, 'Rating cannot exceed 5'),
  comment: z
    .string({ required_error: 'Comment is required' })
    .trim()
    .min(10, 'Comment must be at least 10 characters')
    .max(1000, 'Comment cannot exceed 1000 characters'),
});

export const updateReviewSchema = z.object({
  rating: z.number().int().min(1).max(5).optional(),
  comment: z.string().trim().min(10).max(1000).optional(),
});
