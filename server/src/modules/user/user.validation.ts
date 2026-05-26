import { z } from 'zod';

export const adminCreateUserSchema = z.object({
  name: z.string().trim().min(2).max(50),
  email: z.string().email().lowercase().trim(),
  password: z
    .string()
    .min(8)
    .max(128)
    .refine((val) => /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(val), {
      message:
        'Password must contain at least one uppercase letter, one lowercase letter, and one number',
    }),
  role: z.enum(['student', 'teacher', 'admin']).default('student'),
});

export const adminUpdateUserSchema = z.object({
  name: z.string().trim().min(2).max(50).optional(),
  email: z.string().email().lowercase().trim().optional(),
  role: z.enum(['student', 'teacher', 'admin']).optional(),
  isActive: z.boolean().optional(),
  phone: z
    .string()
    .regex(/^[0-9]{10}$/)
    .optional()
    .nullable(),
  bio: z.string().max(500).optional().nullable(),
});

export const updateUserRoleSchema = z.object({
  role: z.enum(['student', 'teacher', 'admin']),
});

export const updateUserStatusSchema = z.object({
  isActive: z.boolean(),
});

export const userQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  search: z.string().optional(),
  role: z.enum(['student', 'teacher', 'admin', 'super_admin']).optional(),
  isActive: z.preprocess((val) => {
    if (val === 'true') return true;
    if (val === 'false') return false;
    return val;
  }, z.boolean().optional()),
});

export type AdminCreateUserInput = z.infer<typeof adminCreateUserSchema>;
export type AdminUpdateUserInput = z.infer<typeof adminUpdateUserSchema>;
export type UpdateUserRoleInput = z.infer<typeof updateUserRoleSchema>;
export type UpdateUserStatusInput = z.infer<typeof updateUserStatusSchema>;
export type UserQueryInput = z.infer<typeof userQuerySchema>;
