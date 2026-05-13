import { Router } from 'express';
import * as reviewController from './review.controller.js';
import { authenticate } from '../../middleware/auth.js';
import validate from '../../middleware/validate.js';
import { reviewSchemas } from './review.validation.js';

const router = Router();

router.get('/course/:courseId', reviewController.getCourseReviews);
router.post('/', authenticate, validate(reviewSchemas.create), reviewController.createReview);
router.put('/:id', authenticate, validate(reviewSchemas.update), reviewController.updateReview);
router.delete('/:id', authenticate, reviewController.deleteReview);

export default router;
