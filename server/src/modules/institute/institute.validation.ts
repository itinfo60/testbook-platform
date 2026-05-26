import { z } from 'zod';

// Helper to calculate relative luminance
function getLuminance(hex: string): number {
  const cleanHex = hex.replace('#', '');
  if (cleanHex.length !== 6) return 0;
  const r = parseInt(cleanHex.substring(0, 2), 16) / 255;
  const g = parseInt(cleanHex.substring(2, 4), 16) / 255;
  const b = parseInt(cleanHex.substring(4, 6), 16) / 255;

  const a = [r, g, b].map((v) => {
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  });

  return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
}

// Helper to calculate contrast ratio
function getContrastRatio(color1: string, color2: string): number {
  const l1 = getLuminance(color1);
  const l2 = getLuminance(color2);
  const brightest = Math.max(l1, l2);
  const darkest = Math.min(l1, l2);
  return (brightest + 0.05) / (darkest + 0.05);
}

const hexColor = z.string().regex(/^#([A-Fa-f0-9]{6})$/, {
  message: 'Must be a valid 6-character hex color (e.g., #3b82f6)',
});

const themeSchema = z
  .object({
    primaryColor: hexColor.default('#3b82f6'),
    secondaryColor: hexColor.default('#1e3a8a'),
    bannerUrl: z.string().url().or(z.string().max(0)).optional(),
    faviconUrl: z.string().url().or(z.string().max(0)).optional(),
  })
  .refine(
    (data) => {
      const contrast = getContrastRatio(data.primaryColor, data.secondaryColor);
      // Ensure the colors are distinct enough to be readable if layered
      return contrast >= 1.2;
    },
    {
      message:
        'Primary and secondary branding colors must have distinct contrast ratios (minimum 1.2:1)',
      path: ['secondaryColor'],
    }
  );

export const onboardInstituteSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(100),
  subdomain: z
    .string()
    .trim()
    .min(3, 'Subdomain must be at least 3 characters')
    .max(50)
    .regex(/^[a-z0-9-]+$/, 'Subdomain can only contain lowercase letters, numbers, and hyphens'),
  adminName: z.string().trim().min(2, 'Admin name must be at least 2 characters').max(50),
  adminEmail: z.string().email('Please enter a valid email').lowercase().trim(),
  adminPassword: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .refine((val) => /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(val), {
      message:
        'Password must contain at least one uppercase letter, one lowercase letter, and one number',
    }),
});

export const createInstituteSchema = onboardInstituteSchema.extend({
  customDomain: z
    .string()
    .trim()
    .lowercase()
    .regex(/^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z0-9][a-z0-9-]{0,61}[a-z0-9]$/, {
      message: 'Must be a valid domain name (e.g. academy.com)',
    })
    .optional(),
  subscriptionPlanName: z.string().trim().lowercase().optional(),
});

export const updateInstituteSchema = z.object({
  name: z.string().trim().min(2).max(100).optional(),
  customDomain: z
    .string()
    .trim()
    .lowercase()
    .regex(/^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z0-9][a-z0-9-]{0,61}[a-z0-9]$/)
    .optional()
    .nullable(),
  isActive: z.boolean().optional(),
  limits: z
    .object({
      studentLimit: z.number().min(1).optional(),
      teacherLimit: z.number().min(1).optional(),
      storageLimit: z
        .number()
        .min(1024 * 1024)
        .optional(), // min 1MB
    })
    .optional(),
  subscription: z
    .object({
      status: z.enum(['active', 'suspended', 'expired']).optional(),
      expiresAt: z.coerce.date().optional(),
    })
    .optional(),
});

export const updateBrandingSchema = z.object({
  name: z.string().trim().min(2).max(100).optional(),
  logo: z
    .object({
      url: z.string().url().optional(),
      publicId: z.string().optional(),
    })
    .optional(),
  theme: themeSchema.optional(),
  websiteTitle: z.string().trim().max(100).optional(),
  contactDetails: z
    .object({
      email: z.string().email().optional(),
      phone: z.string().optional(),
      address: z.string().optional(),
    })
    .optional(),
});

export type OnboardInstituteInput = z.infer<typeof onboardInstituteSchema>;
export type CreateInstituteInput = z.infer<typeof createInstituteSchema>;
export type UpdateInstituteInput = z.infer<typeof updateInstituteSchema>;
export type UpdateBrandingInput = z.infer<typeof updateBrandingSchema>;
