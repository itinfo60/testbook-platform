import { z } from 'zod';

export const getLeaderboardSchema = z.object({
  period: z.enum(['all', 'allTime', 'weekly', 'monthly']).default('all'),
  limit: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 10))
    .pipe(z.number().int().positive().max(100)),
});
