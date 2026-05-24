import Joi from 'joi';

const objectId = Joi.string().regex(/^[0-9a-fA-F]{24}$/);

export const courseSchemas = {
  create: Joi.object({
    title: Joi.string().trim().min(3).max(200).required(),
    description: Joi.string().trim().min(10).max(5000).required(),
    shortDescription: Joi.string().trim().max(300).allow('').optional(),
    category: objectId.required(),
    price: Joi.number().min(0).max(100000).default(0),
    discountPrice: Joi.number().min(0).optional(),
    language: Joi.string().allow('').default('English'),
    level: Joi.string().valid('beginner', 'intermediate', 'advanced').default('beginner'),
    thumbnail: Joi.object({
      url: Joi.string().allow('').optional(),
      publicId: Joi.string().allow('').optional(),
    }).optional(),
    tags: Joi.array().items(Joi.string().trim()),
    requirements: Joi.array().items(Joi.string().trim()),
    whatYouLearn: Joi.array().items(Joi.string().trim()),
    sections: Joi.array().items(Joi.object({
      title: Joi.string().required(),
      description: Joi.string().allow('').optional(),
      lessons: Joi.array().items(Joi.object({
        title: Joi.string().required(),
        type: Joi.string().valid('video', 'text', 'quiz').required(),
        content: Joi.string().allow('').optional(),
        videoUrl: Joi.string().uri().allow('').optional(),
        duration: Joi.number().min(0),
        isFree: Joi.boolean().default(false),
        resources: Joi.array().items(Joi.object({
          title: Joi.string().allow('').optional(),
          url: Joi.string().allow('').optional(),
          type: Joi.string().valid('link', 'pdf', 'doc').default('link'),
        })).optional(),
      })),
    })),
  }),

  update: Joi.object({
    title: Joi.string().trim().min(3).max(200),
    description: Joi.string().trim().min(10).max(5000),
    shortDescription: Joi.string().trim().max(300).allow('').optional(),
    category: objectId,
    price: Joi.number().min(0).max(100000),
    discountPrice: Joi.number().min(0).optional(),
    language: Joi.string().allow('').optional(),
    level: Joi.string().valid('beginner', 'intermediate', 'advanced'),
    thumbnail: Joi.object({
      url: Joi.string().allow('').optional(),
      publicId: Joi.string().allow('').optional(),
    }).optional(),
    tags: Joi.array().items(Joi.string().trim()),
    requirements: Joi.array().items(Joi.string().trim()),
    whatYouLearn: Joi.array().items(Joi.string().trim()),
    isPublished: Joi.boolean(),
    isFeatured: Joi.boolean(),
    sections: Joi.array(),
  }),

  query: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(12),
    search: Joi.string().trim().max(100),
    category: objectId,
    level: Joi.string().valid('beginner', 'intermediate', 'advanced'),
    priceMin: Joi.number().min(0),
    priceMax: Joi.number().min(0),
    sort: Joi.string().valid('newest', 'oldest', 'price_low', 'price_high', 'rating', 'popular'),
    isFeatured: Joi.boolean(),
    status: Joi.string().valid('draft', 'published', 'archived'),
  }),
};
