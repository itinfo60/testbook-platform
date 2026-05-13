import Joi from 'joi';

const objectId = Joi.string().regex(/^[0-9a-fA-F]{24}$/);

export const reviewSchemas = {
  create: Joi.object({
    course: objectId.required(),
    rating: Joi.number().integer().min(1).max(5).required(),
    comment: Joi.string().trim().min(10).max(1000).required(),
  }),

  update: Joi.object({
    rating: Joi.number().integer().min(1).max(5),
    comment: Joi.string().trim().min(10).max(1000),
  }),
};
