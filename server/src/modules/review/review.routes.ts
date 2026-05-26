import { Router } from 'express';
import { ReviewController } from './review.controller.js';
import { authenticate } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate-zod.js';
import { createReviewSchema, updateReviewSchema } from './review.validation.js';

const router = Router();
const controller = new ReviewController();

router.get('/course/:courseId', controller.getCourseReviews);
router.post('/', authenticate, validate(createReviewSchema), controller.createReview);
router.put('/:id', authenticate, validate(updateReviewSchema), controller.updateReview);
router.delete('/:id', authenticate, controller.deleteReview);

export default router;
