import { Router } from 'express';
import { CourseController } from './course.controller.js';
import { authenticate, optionalAuth, authorize } from '../../middleware/auth.js';
import validate from '../../middleware/validate-zod.js';
import { createCourseSchema, updateCourseSchema, courseQuerySchema } from './course.validation.js';
import { cacheMiddleware, clearCache } from '../../middleware/cache.js';

const router = Router();
const controller = new CourseController();

// Public routes
router.get(
  '/',
  cacheMiddleware('courses', 300),
  validate(courseQuerySchema, 'query'),
  controller.getCourses
);
router.get('/featured', controller.getFeaturedCourses);
router.get('/slug/:slug', optionalAuth, controller.getCourseBySlug);
router.get('/:id', controller.getCourseById);

// Teacher/Admin routes
router.get(
  '/teacher/my-courses',
  authenticate,
  authorize('teacher', 'admin'),
  controller.getTeacherCourses
);
router.post(
  '/',
  authenticate,
  authorize('teacher', 'admin'),
  validate(createCourseSchema, 'body'),
  clearCache('courses'),
  controller.createCourse
);
router.put(
  '/:id',
  authenticate,
  authorize('teacher', 'admin'),
  validate(updateCourseSchema, 'body'),
  controller.updateCourse
);
router.delete('/:id', authenticate, authorize('teacher', 'admin'), controller.deleteCourse);
router.patch('/:id/publish', authenticate, authorize('teacher', 'admin'), controller.publishCourse);

export default router;
