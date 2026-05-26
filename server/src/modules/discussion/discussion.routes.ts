import { Router } from 'express';
import { DiscussionController } from './discussion.controller.js';
import { authenticate } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate-zod.js';
import {
  createDiscussionSchema,
  updateDiscussionSchema,
  createReplySchema,
} from './discussion.validation.js';

const router = Router();
const controller = new DiscussionController();

router.get('/course/:courseId', authenticate, controller.getDiscussions);
router.post(
  '/course/:courseId',
  authenticate,
  validate(createDiscussionSchema),
  controller.createDiscussion
);
router.put('/:id', authenticate, validate(updateDiscussionSchema), controller.updateDiscussion);
router.delete('/:id', authenticate, controller.deleteDiscussion);

router.post('/:id/reply', authenticate, validate(createReplySchema), controller.addReply);
router.put(
  '/:id/reply/:replyId',
  authenticate,
  validate(createReplySchema),
  controller.updateReply
);
router.delete('/:id/reply/:replyId', authenticate, controller.deleteReply);

router.post('/:id/like', authenticate, controller.toggleLike);
router.patch('/:id/resolve', authenticate, controller.toggleResolved);

export default router;
