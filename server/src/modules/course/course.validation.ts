import { z } from 'zod';

const objectIdRegex = /^[0-9a-fA-F-]{36}$|^[0-9a-fA-F]{24}$/;
const objectId = z.string().regex(objectIdRegex, { message: 'Invalid ObjectId' });

const resourceSchema = z
  .object({
    title: z.string().trim().optional(),
    url: z.string().trim().optional(),
    type: z.enum(['link', 'pdf', 'doc']).default('link'),
  })
  // A resource with a title but no url is never something an author meant to
  // save — it is the signature of a redacted payload being written back.
  // Reject it loudly instead of silently persisting an unusable attachment.
  .refine((r) => !r.title || !!r.url, {
    message: 'Resource url is required when a title is provided',
    path: ['url'],
  });

const lessonSchema = z.object({
  id: z.string().optional(),
  title: z.string().trim().min(1, 'Lesson title is required'),
  type: z.enum(['video', 'text', 'quiz']).default('video'),
  content: z.string().trim().default(''),
  videoUrl: z.string().url().or(z.string().max(0)).optional(),
  duration: z.number().min(0).default(0),
  isFree: z.boolean().default(false),
  dripDays: z.number().int().min(0).default(0),
  resources: z.array(resourceSchema).default([]),
});

const sectionSchema = z.object({
  id: z.string().optional(),
  title: z.string().trim().min(1, 'Section title is required'),
  order: z.number().optional().default(1),
  description: z.string().trim().default(''),
  lessons: z.array(lessonSchema).default([]),
});

export const createCourseSchema = z.object({
  title: z.string().trim().min(3, 'Title must be at least 3 characters').max(200),
  slug: z.string().optional(),
  description: z.string().trim().min(10, 'Description must be at least 10 characters').max(5000),
  shortDescription: z.string().trim().max(300).default(''),
  category: objectId.optional(),
  categoryId: objectId.optional(),
  examCategory: objectId.optional(),
  teacherId: objectId.optional(),
  price: z.number().min(0).max(100000).default(0),
  discountPrice: z.number().min(0).optional().default(0),
  isFree: z.boolean().optional().default(false),
  language: z.string().default('English'),
  level: z.enum(['beginner', 'intermediate', 'advanced', 'all_levels']).default('beginner'),
  thumbnail: z
    .union([
      z.object({
        url: z.string().default(''),
        publicId: z.string().default(''),
      }),
      z.string(),
    ])
    .optional()
    .default({ url: '', publicId: '' }),
  previewVideo: z.string().optional(),
  demoVideoUrl: z.string().optional(),
  tags: z.array(z.string().trim()).default([]),
  highlights: z.array(z.string().trim()).default([]),
  requirements: z.array(z.string().trim()).default([]),
  whatYouLearn: z.array(z.string().trim()).default([]),
  sections: z.array(sectionSchema).default([]),
  instructors: z.any().optional(),
});

export const updateCourseSchema = z.object({
  title: z.string().trim().min(3).max(200).optional(),
  description: z.string().trim().min(10).max(5000).optional(),
  shortDescription: z.string().trim().max(300).optional(),
  category: objectId.optional(),
  categoryId: objectId.optional(),
  examCategory: objectId.optional(),
  teacherId: objectId.optional(),
  instructors: z.any().optional(),
  price: z.number().min(0).max(100000).optional(),
  discountPrice: z.number().min(0).optional(),
  isFree: z.boolean().optional(),
  language: z.string().optional(),
  level: z.enum(['beginner', 'intermediate', 'advanced', 'all_levels']).optional(),
  thumbnail: z
    .union([
      z.object({
        url: z.string().optional(),
        publicId: z.string().optional(),
      }),
      z.string(),
    ])
    .optional(),
  previewVideo: z.string().optional(),
  demoVideoUrl: z.string().optional(),
  tags: z.array(z.string().trim()).optional(),
  highlights: z.array(z.string().trim()).optional(),
  requirements: z.array(z.string().trim()).optional(),
  whatYouLearn: z.array(z.string().trim()).optional(),
  status: z.enum(['draft', 'published', 'archived']).optional(),
  isPublished: z.boolean().optional(),
  isFeatured: z.boolean().optional(),
  sections: z.array(sectionSchema).optional(),
});

export const courseQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(12),
  search: z.string().trim().max(100).optional(),
  category: z.string().optional(),
  teacher: z.string().optional(),
  level: z.enum(['beginner', 'intermediate', 'advanced']).optional(),
  priceMin: z.coerce.number().min(0).optional(),
  priceMax: z.coerce.number().min(0).optional(),
  sort: z
    .enum(['newest', 'oldest', 'price_low', 'price_high', 'rating', 'popular'])
    .default('newest'),
  isFeatured: z.preprocess((val) => {
    if (val === 'true') return true;
    if (val === 'false') return false;
    return val;
  }, z.boolean().optional()),
  status: z.enum(['draft', 'published', 'archived']).optional(),
});

export type CreateCourseInput = z.infer<typeof createCourseSchema>;
export type UpdateCourseInput = z.infer<typeof updateCourseSchema>;
export type CourseQueryInput = z.infer<typeof courseQuerySchema>;
export type SectionInput = z.infer<typeof sectionSchema>;
export type LessonInput = z.infer<typeof lessonSchema>;
export type ResourceInput = z.infer<typeof resourceSchema>;
