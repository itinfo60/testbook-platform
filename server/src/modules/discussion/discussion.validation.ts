import { z } from 'zod';

export const createDiscussionSchema = z.object({
  title: z
    .string({ required_error: 'Title is required' })
    .trim()
    .min(1, 'Title cannot be empty')
    .max(200, 'Title cannot exceed 200 characters'),
  content: z
    .string({ required_error: 'Content is required' })
    .trim()
    .min(1, 'Content cannot be empty')
    .max(5000, 'Content cannot exceed 5000 characters'),
  tags: z.array(z.string()).optional(),
});

export const updateDiscussionSchema = z.object({
  title: z.string().trim().min(1).max(200).optional(),
  content: z.string().trim().min(1).max(5000).optional(),
  tags: z.array(z.string()).optional(),
});

export const createReplySchema = z.object({
  content: z
    .string({ required_error: 'Reply content is required' })
    .trim()
    .min(1, 'Reply content cannot be empty')
    .max(2000, 'Reply content cannot exceed 2000 characters'),
});
