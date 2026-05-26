import { z } from 'zod';

export const eraseMyDataSchema = z.object({
  password: z.string().optional(),
});

export const recordConsentSchema = z.object({
  version: z.string().optional(),
});
