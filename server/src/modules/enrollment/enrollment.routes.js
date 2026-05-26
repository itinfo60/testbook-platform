import { Router } from 'express';
import * as enrollmentController from './enrollment.controller.js';
import { generateCertificate } from './certificate.controller.js';
import { authenticate } from '../../middleware/auth.js';

const router = Router();

router.use(authenticate);

router.post('/', enrollmentController.enrollInCourse);
router.get('/my', enrollmentController.getMyEnrollments);
router.get('/my-tests', enrollmentController.getMyTestEnrollments);
router.get('/teacher/students', enrollmentController.getTeacherStudents);
router.get('/check/:courseId', enrollmentController.checkEnrollment);
router.get('/progress/:courseId', enrollmentController.getEnrollmentProgress);
router.post('/progress/:courseId', enrollmentController.updateProgress);
router.get('/certificate/:courseId', generateCertificate);

export default router;
