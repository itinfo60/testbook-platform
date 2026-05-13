import { Router } from 'express';
import * as enrollmentController from './enrollment.controller.js';
import { authenticate } from '../../middleware/auth.js';

const router = Router();

router.use(authenticate);

router.post('/', enrollmentController.enrollInCourse);
router.get('/my', enrollmentController.getMyEnrollments);
router.get('/check/:courseId', enrollmentController.checkEnrollment);
router.get('/progress/:courseId', enrollmentController.getEnrollmentProgress);
router.post('/progress/:courseId', enrollmentController.updateProgress);

export default router;
