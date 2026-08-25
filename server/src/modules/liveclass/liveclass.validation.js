import { z } from 'zod';

export const createLiveClassSchema = z.object({
  title: z.string().trim().min(2, 'Title must be at least 2 characters').max(200),
  description: z.string().trim().max(2000).optional().nullable().or(z.literal('')),
  scheduledAt: z
    .string()
    .refine((v) => !isNaN(Date.parse(v)), { message: 'scheduledAt must be a valid date' }),
  durationMinutes: z.coerce.number().int().min(5).max(480).default(60),
  courseId: z.string().optional().nullable().or(z.literal('')),
  meetingUrl: z.string().optional().nullable().or(z.literal('')),
  maxParticipants: z.coerce.number().int().min(2).max(500).default(200),
  isRecorded: z.boolean().default(false),
  chatEnabled: z.boolean().default(true),
});

export const updateLiveClassSchema = createLiveClassSchema.partial();
