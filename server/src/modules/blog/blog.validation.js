import Joi from 'joi';

const objectId = Joi.string().regex(/^[0-9a-fA-F]{24}$/);

export const blogSchemas = {
  create: Joi.object({
    title: Joi.string().trim().min(5).max(200).required(),
    slug: Joi.string().trim().required(),
    content: Joi.string().trim().min(10).required(),
    excerpt: Joi.string().trim().max(500),
    tags: Joi.array().items(Joi.string().trim()),
    status: Joi.string().valid('draft', 'published').default('draft'),
    coverImage: Joi.object({
      url: Joi.string().uri(),
      publicId: Joi.string(),
    }),
  }),

  update: Joi.object({
    title: Joi.string().trim().min(5).max(200),
    slug: Joi.string().trim(),
    content: Joi.string().trim().min(10),
    excerpt: Joi.string().trim().max(500),
    tags: Joi.array().items(Joi.string().trim()),
    status: Joi.string().valid('draft', 'published'),
    coverImage: Joi.object({
      url: Joi.string().uri(),
      publicId: Joi.string(),
    }),
  }),

  query: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(10),
    search: Joi.string().trim().max(100).allow(''),
    tag: Joi.string().trim().allow(''),
    status: Joi.string().valid('draft', 'published'),
    author: objectId,
    sort: Joi.string().valid('newest', 'oldest', 'popular', 'title_asc', 'title_desc'),
  }),

};
