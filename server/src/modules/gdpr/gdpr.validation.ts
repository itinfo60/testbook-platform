import { z } from 'zod';

export const eraseMyDataSchema = z.object({
  body: z.object({
    password: z.string().optional(),
  }),
});

export const recordConsentSchema = z.object({
  body: z.object({
    version: z.string().optional(),
  }),
});
