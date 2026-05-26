import { z } from 'zod';

export const createBadgeSchema = z.object({
  body: z.object({
    name: z.string({ required_error: 'Badge name is required' }).min(1).trim(),
    description: z.string({ required_error: 'Description is required' }).max(300),
    icon: z.string({ required_error: 'Icon is required' }).min(1),
    category: z.enum(['learning', 'achievement', 'streak', 'social', 'special'], {
      required_error: 'Category is required',
    }),
    criteria: z.object({
      type: z.enum(
        ['courses_completed', 'tests_taken', 'points_earned', 'streak_days', 'courses_enrolled'],
        { required_error: 'Criteria type is required' }
      ),
      value: z.number({ required_error: 'Criteria value is required' }).min(0),
    }),
    points: z.number().min(0).default(0),
    rarity: z.enum(['common', 'rare', 'epic', 'legendary']).default('common'),
    isActive: z.boolean().default(true),
  }),
});

export const updateBadgeSchema = z.object({
  body: z.object({
    name: z.string().min(1).trim().optional(),
    description: z.string().max(300).optional(),
    icon: z.string().min(1).optional(),
    category: z.enum(['learning', 'achievement', 'streak', 'social', 'special']).optional(),
    criteria: z
      .object({
        type: z.enum([
          'courses_completed',
          'tests_taken',
          'points_earned',
          'streak_days',
          'courses_enrolled',
        ]),
        value: z.number().min(0),
      })
      .optional(),
    points: z.number().min(0).optional(),
    rarity: z.enum(['common', 'rare', 'epic', 'legendary']).optional(),
    isActive: z.boolean().optional(),
  }),
});
