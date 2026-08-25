import { Router } from 'express';
import * as blogController from './blog.controller.js';
import { authenticate, optionalAuth, authorize } from '../../middleware/auth.js';
import validate from '../../middleware/validate.js';
import { blogSchemas } from './blog.validation.js';

const router = Router();

// Public routes
router.get('/', optionalAuth, validate(blogSchemas.query, 'query'), blogController.getBlogs);
router.get('/slug/:slug', optionalAuth, blogController.getBlogBySlug);
router.get('/:slug', optionalAuth, blogController.getBlogBySlug);

// Admin & Teacher routes
router.post(
  '/',
  authenticate,
  authorize('admin', 'teacher'),
  validate(blogSchemas.create),
  blogController.createBlog
);
router.patch(
  '/:id',
  authenticate,
  authorize('admin', 'teacher'),
  validate(blogSchemas.update),
  blogController.updateBlog
);
router.put(
  '/:id',
  authenticate,
  authorize('admin', 'teacher'),
  validate(blogSchemas.update),
  blogController.updateBlog
);
router.delete('/:id', authenticate, authorize('admin', 'teacher'), blogController.deleteBlog);

export default router;
