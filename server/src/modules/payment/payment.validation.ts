import { z } from 'zod';

export const createOrderSchema = z
  .object({
    courseId: z.string().optional(),
    testId: z.string().optional(),
    planId: z.string().optional(),
    couponCode: z.string().min(1).optional(),
  })
  .refine((data) => data.courseId || data.testId || data.planId, {
    message: 'Either courseId, testId, or planId is required',
  });

export const verifyPaymentSchema = z.object({
  razorpay_order_id: z.string({ required_error: 'razorpay_order_id is required' }).min(1),
  razorpay_payment_id: z.string({ required_error: 'razorpay_payment_id is required' }).min(1),
  razorpay_signature: z.string({ required_error: 'razorpay_signature is required' }).min(1),
  planId: z.string().optional(),
});

export const retryOrderSchema = z.object({
  paymentId: z.string({ required_error: 'paymentId is required' }),
});

export const refundSchema = z.object({
  amount: z.number().min(0.01).optional(),
  reason: z.string().max(500).optional(),
});

export const createPlanSchema = z.object({
  name: z.enum(['starter', 'growth', 'premium']),
  price: z.number().min(0),
  billingCycle: z.enum(['monthly', 'yearly']),
  studentLimit: z.number().min(1),
  teacherLimit: z.number().min(1),
  storageLimit: z.number().min(1),
  features: z.array(z.string()).optional(),
});

export const updatePlanSchema = createPlanSchema.partial();
