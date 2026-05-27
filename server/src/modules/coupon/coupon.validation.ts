import { z } from 'zod';

const dateSchema = z.preprocess((arg) => {
  if (typeof arg === 'string' || arg instanceof Date) return new Date(arg);
  return arg;
}, z.date());

export const validateCouponSchema = z.object({
  code: z.string({ required_error: 'Coupon code is required' }).min(1),
  courseId: z.string().optional(),
  amount: z.number().min(0).optional(),
  // Legacy support fields (optional)
  discountPercent: z.number().min(0).max(100).optional(),
  discountAmount: z.number().min(0).optional(),
  validUntil: z
    .preprocess((arg) => {
      if (typeof arg === 'string' || arg instanceof Date) return new Date(arg);
      return arg;
    }, z.date())
    .optional(),
});

export const createCouponSchema = z.object({
  code: z.string({ required_error: 'Coupon code is required' }).min(1).max(50),
  description: z.string().optional(),
  discountType: z.enum(['percentage', 'fixed'], { required_error: 'Discount type is required' }),
  discountValue: z.number({ required_error: 'Discount value is required' }).min(0),
  minPurchase: z.number().min(0).default(0),
  maxDiscount: z.number().min(0).default(0),
  usageLimit: z.number().min(0).default(0),
  perUserLimit: z.number().min(1).default(1),
  applicableCourses: z.array(z.string()).default([]),
  applicableCategories: z.array(z.string()).default([]),
  isActive: z.boolean().default(true),
  startDate: dateSchema,
  endDate: dateSchema,
});

export const updateCouponSchema = z.object({
  code: z.string().min(1).max(50).optional(),
  description: z.string().optional(),
  discountType: z.enum(['percentage', 'fixed']).optional(),
  discountValue: z.number().min(0).optional(),
  minPurchase: z.number().min(0).optional(),
  maxDiscount: z.number().min(0).optional(),
  usageLimit: z.number().min(0).optional(),
  perUserLimit: z.number().min(1).optional(),
  applicableCourses: z.array(z.string()).optional(),
  applicableCategories: z.array(z.string()).optional(),
  isActive: z.boolean().optional(),
  startDate: dateSchema.optional(),
  endDate: dateSchema.optional(),
});
