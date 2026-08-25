import { z } from 'zod';

const objectIdRegex = /^[0-9a-fA-F-]{36}$|^[0-9a-fA-F]{24}$/;
const objectId = z.string().regex(objectIdRegex, { message: 'Invalid ObjectId' });

export const createEnrollmentSchema = z
  .object({
    courseId: objectId.optional(),
    testSeriesId: objectId.optional(),
    couponCode: z.string().trim().optional(),
  })
  .refine((data) => data.courseId || data.testSeriesId, {
    message: 'Either courseId or testSeriesId is required',
    path: ['courseId'],
  });
