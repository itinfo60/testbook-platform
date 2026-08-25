import { z } from 'zod';

export const createReviewSchema = z
  .object({
    course: z.string().optional(),
    courseId: z.string().optional(),
    rating: z
      .number({ required_error: 'Rating is required' })
      .int()
      .min(1, 'Rating must be at least 1')
      .max(5, 'Rating cannot exceed 5'),
    comment: z
      .string({ required_error: 'Comment is required' })
      .trim()
      .min(5, 'Comment must be at least 5 characters')
      .max(1000, 'Comment cannot exceed 1000 characters'),
  })
  .refine((data) => data.course || data.courseId, {
    message: 'Course ID is required',
    path: ['course'],
  });

export const updateReviewSchema = z.object({
  rating: z.number().int().min(1).max(5).optional(),
  comment: z.string().trim().min(5).max(1000).optional(),
});
