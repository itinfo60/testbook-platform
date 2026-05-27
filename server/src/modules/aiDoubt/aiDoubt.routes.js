import express from 'express';
import aiDoubtController from './aiDoubt.controller.js';
import { requireTenant } from '../../middleware/tenant.middleware.js';
import { protect } from '../../middleware/auth.js'; // assuming auth middleware exists

const router = express.Router();

router.post('/', protect, requireTenant, aiDoubtController.createDoubt);
router.get('/answer/:doubtId', protect, requireTenant, aiDoubtController.answerDoubt);
router.get('/my', protect, requireTenant, aiDoubtController.listMyDoubts);

export default router;
