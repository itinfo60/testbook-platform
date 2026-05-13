import Joi from 'joi';

const password = Joi.string().min(8).max(128)
  .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
  .message('Password must have at least 8 chars, one uppercase, one lowercase, one number');

export const authSchemas = {
  register: Joi.object({
    name: Joi.string().trim().min(2).max(50).required(),
    email: Joi.string().email().lowercase().trim().required(),
    password: password.required(),
    role: Joi.string().valid('student', 'teacher').default('student'),
  }),

  login: Joi.object({
    email: Joi.string().email().lowercase().trim().required(),
    password: Joi.string().required(),
  }),

  forgotPassword: Joi.object({
    email: Joi.string().email().lowercase().trim().required(),
  }),

  resetPassword: Joi.object({
    token: Joi.string().required(),
    password: password.required(),
  }),

  changePassword: Joi.object({
    currentPassword: Joi.string().required(),
    newPassword: password.required(),
  }),

  updateProfile: Joi.object({
    name: Joi.string().trim().min(2).max(50),
    bio: Joi.string().max(500),
    phone: Joi.string().pattern(/^[0-9]{10}$/),
    avatar: Joi.string().uri(),
  }),
};
