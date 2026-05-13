import { Router } from 'express';
import * as courseController from './course.controller.js';
import { authenticate, optionalAuth, authorize } from '../../middleware/auth.js';
import validate from '../../middleware/validate.js';
import { courseSchemas } from './course.validation.js';
import { cacheMiddleware, clearCache } from '../../middleware/cache.js';

const router = Router();

// Public routes
router.get('/', cacheMiddleware('courses', 300), validate(courseSchemas.query, 'query'), courseController.getCourses);
router.get('/featured', courseController.getFeaturedCourses);
router.get('/slug/:slug', optionalAuth, courseController.getCourseBySlug);
router.get('/teacher/my-courses', authenticate, authorize('teacher', 'admin'), courseController.getTeacherCourses);
router.get('/:id', courseController.getCourseById);

// Teacher routes
router.post('/', authenticate, authorize('teacher', 'admin'), validate(courseSchemas.create), clearCache('courses'), courseController.createCourse);
router.put('/:id', authenticate, authorize('teacher', 'admin'), validate(courseSchemas.update), courseController.updateCourse);
router.delete('/:id', authenticate, authorize('teacher', 'admin'), courseController.deleteCourse);
router.patch('/:id/publish', authenticate, authorize('teacher', 'admin'), courseController.publishCourse);

export default router;
