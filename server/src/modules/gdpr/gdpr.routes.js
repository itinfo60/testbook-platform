import { Router } from 'express';
import { authenticate } from '../../middleware/auth.js';
import * as gdprController from './gdpr.controller.js';

const router = Router();

router.use(authenticate);

router.get('/export', gdprController.exportMyData);
router.delete('/erase', gdprController.eraseMyData);
router.post('/consent', gdprController.recordConsent);
router.get('/consent', gdprController.getConsentStatus);

export default router;
