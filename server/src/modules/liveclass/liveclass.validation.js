import { z } from 'zod';

export const createLiveClassSchema = z.object({
  title: z.string().trim().min(3, 'Title must be at least 3 characters').max(200),
  description: z.string().trim().max(2000).optional(),
  scheduledAt: z
    .string()
    .datetime({ message: 'scheduledAt must be an ISO 8601 datetime' })
    .refine((v) => new Date(v) > new Date(), { message: 'scheduledAt must be in the future' }),
  durationMinutes: z.number().int().min(15).max(480).default(60),
  courseId: z.string().optional(),
  maxParticipants: z.number().int().min(2).max(500).default(200),
  isRecorded: z.boolean().default(false),
  chatEnabled: z.boolean().default(true),
});

export const updateLiveClassSchema = createLiveClassSchema
  .omit({ scheduledAt: true })
  .extend({
    scheduledAt: z.string().datetime().optional(),
  })
  .partial();
