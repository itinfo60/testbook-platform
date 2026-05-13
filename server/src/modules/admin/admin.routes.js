import { Router } from 'express';
import * as adminController from './admin.controller.js';
import { authenticate, authorize } from '../../middleware/auth.js';

const router = Router();

// All routes require admin authentication
router.use(authenticate, authorize('admin', 'super_admin'));

// Dashboard
router.get('/dashboard', adminController.getDashboardStats);

// Users
router.get('/users', adminController.getUsers);
router.get('/users/:id', adminController.getUserById);
router.post('/users', adminController.createUser);
router.put('/users/:id', adminController.updateUser);
router.delete('/users/:id', adminController.deleteUser);

// Courses
router.get('/courses', adminController.adminGetCourses);
router.put('/courses/:id', adminController.adminUpdateCourse);
router.delete('/courses/:id', adminController.adminDeleteCourse);
router.patch('/courses/:id/featured', adminController.toggleFeatured);

// Quizzes
router.get('/quizzes', adminController.adminGetQuizzes);
router.delete('/quizzes/:id', adminController.adminDeleteQuiz);

// Tests
router.get('/tests', adminController.adminGetTests);
router.delete('/tests/:id', adminController.adminDeleteTest);

// Reviews
router.get('/reviews', adminController.adminGetReviews);
router.delete('/reviews/:id', adminController.adminDeleteReview);
router.post('/reviews/bulk-delete', adminController.adminBulkDeleteReviews);
router.patch('/reviews/:id/toggle-approval', adminController.adminToggleReviewApproval);

// Revenue
router.get('/revenue', adminController.getRevenue);

// Enrollments
router.get('/enrollments', adminController.adminGetEnrollments);
router.get('/enrollments/export', adminController.adminExportEnrollments);

// Teachers
router.get('/teachers', adminController.getTeachers);
router.patch('/teachers/:id/verify', adminController.verifyTeacher);

// Announcements
router.post('/announcements', adminController.sendAnnouncement);

export default router;
