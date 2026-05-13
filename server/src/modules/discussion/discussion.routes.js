import { Router } from 'express';
import * as discussionController from './discussion.controller.js';
import { authenticate } from '../../middleware/auth.js';

const router = Router();

router.get('/course/:courseId', authenticate, discussionController.getDiscussions);
router.post('/course/:courseId', authenticate, discussionController.createDiscussion);
router.post('/:id/reply', authenticate, discussionController.addReply);
router.post('/:id/like', authenticate, discussionController.toggleLike);
router.patch('/:id/resolve', authenticate, discussionController.toggleResolved);
router.delete('/:id', authenticate, discussionController.deleteDiscussion);

export default router;
