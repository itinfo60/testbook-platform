import Joi from 'joi';

const objectId = Joi.string().regex(/^[0-9a-fA-F]{24}$/);

export const blogSchemas = {
  create: Joi.object({
    title: Joi.string().trim().min(5).max(200).required(),
    slug: Joi.string().trim().required(),
    content: Joi.string().trim().min(10).required(),
    excerpt: Joi.string().trim().max(500).allow('', null),
    tags: Joi.array().items(Joi.string().trim()),
    status: Joi.string().valid('draft', 'published').default('draft'),
    type: Joi.string().valid('article', 'job_alert', 'current_affairs').default('article'),
    examCategory: Joi.string().allow('', null),
    resourceIds: Joi.array().items(Joi.string()).default([]),
    resources: Joi.array().items(Joi.any()).default([]),
    jobAlert: Joi.object().unknown(true).allow(null),
    coverImage: Joi.object({
      url: Joi.string().uri(),
      publicId: Joi.string(),
    })
      .unknown(true)
      .allow(null),
    thumbnail: Joi.any().allow(null),
  }).unknown(true),

  update: Joi.object({
    title: Joi.string().trim().min(5).max(200),
    slug: Joi.string().trim(),
    content: Joi.string().trim().min(10),
    excerpt: Joi.string().trim().max(500).allow('', null),
    tags: Joi.array().items(Joi.string().trim()),
    status: Joi.string().valid('draft', 'published'),
    type: Joi.string().valid('article', 'job_alert', 'current_affairs'),
    examCategory: Joi.string().allow('', null),
    resourceIds: Joi.array().items(Joi.string()),
    resources: Joi.array().items(Joi.any()),
    jobAlert: Joi.object().unknown(true).allow(null),
    coverImage: Joi.object({
      url: Joi.string().uri(),
      publicId: Joi.string(),
    })
      .unknown(true)
      .allow(null),
    thumbnail: Joi.any().allow(null),
  }).unknown(true),

  query: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(10),
    search: Joi.string().trim().max(100).allow(''),
    tag: Joi.string().trim().allow(''),
    status: Joi.string().valid('draft', 'published').allow(''),
    type: Joi.string().valid('article', 'job_alert', 'current_affairs').allow(''),
    author: objectId,
    sort: Joi.string().valid('newest', 'oldest', 'popular', 'title_asc', 'title_desc'),
  }),
};
