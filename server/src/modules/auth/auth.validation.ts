import { z } from 'zod';

const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(128)
  .refine((val) => /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(val), {
    message:
      'Password must have at least one uppercase letter, one lowercase letter, and one number',
  });

export const registerSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(50),
  email: z.string().email('Please enter a valid email').lowercase().trim(),
  password: passwordSchema,
  role: z.enum(['student', 'teacher', 'parent']).default('student'),
});

export const loginSchema = z.object({
  email: z.string().email('Please enter a valid email').lowercase().trim(),
  password: z.string().min(1, 'Password is required'),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email('Please enter a valid email').lowercase().trim(),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Token is required'),
  password: passwordSchema,
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: passwordSchema,
});

export const updateProfileSchema = z.object({
  name: z.string().trim().min(2).max(50).optional(),
  bio: z.string().max(500).optional(),
  phone: z
    .string()
    .regex(/^[0-9]{10}$/, 'Please enter a valid 10-digit phone number')
    .or(z.literal(''))
    .optional(),
  avatar: z
    .object({
      url: z.string().url().optional(),
      publicId: z.string().optional(),
    })
    .optional(),
});

export const mfaVerifySchema = z.object({
  token: z.string().length(6, 'Verification token must be exactly 6 digits'),
});

export const mfaLoginSchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
  token: z.string().length(6, 'Verification token must be exactly 6 digits'),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type MfaVerifyInput = z.infer<typeof mfaVerifySchema>;
