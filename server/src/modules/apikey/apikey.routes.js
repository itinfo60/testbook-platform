import { Router } from 'express';
import { authenticate, authorize } from '../../middleware/auth.js';
import * as apiKeyController from './apikey.controller.js';

const router = Router();

router.use(authenticate, authorize('admin', 'super_admin'));

router.post('/', apiKeyController.createApiKey);
router.get('/', apiKeyController.listApiKeys);
router.delete('/:id', apiKeyController.revokeApiKey);

export default router;
