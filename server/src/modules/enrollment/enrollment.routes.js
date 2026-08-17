import { Router } from 'express';
import * as enrollmentController from './enrollment.controller.js';
import { generateCertificate, verifyCertificatePublic } from './certificate.controller.js';
import { authenticate, authorize } from '../../middleware/auth.js';
import validate from '../../middleware/validate-zod.js';
import { createEnrollmentSchema } from './enrollment.validation.js';

const router = Router();

// Public verification route
router.get('/verify-certificate/:certificateId', verifyCertificatePublic);

// Authenticated routes
router.use(authenticate);

router.post('/', validate(createEnrollmentSchema, 'body'), enrollmentController.enrollInCourse);
router.get('/orders', enrollmentController.getOrderHistory);
router.get('/my', enrollmentController.getMyEnrollments);
router.get('/my-tests', enrollmentController.getMyTestEnrollments);
router.get(
  '/teacher/students',
  authorize('teacher', 'admin'),
  enrollmentController.getTeacherStudents
);
router.get('/check/:courseId', enrollmentController.checkEnrollment);
router.get('/progress/:courseId', enrollmentController.getEnrollmentProgress);
router.post('/progress/:courseId', enrollmentController.updateProgress);
router.patch('/:id/verify', enrollmentController.verifyPayment);
router.get('/certificate/:courseId', generateCertificate);
router.get('/analytics/performance', enrollmentController.getStudentPerformanceAnalytics);
router.delete('/:id', authorize('admin', 'super_admin'), enrollmentController.revokeEnrollment);

export default router;
