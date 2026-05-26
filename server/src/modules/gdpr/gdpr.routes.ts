import { Router } from 'express';
import { GdprController } from './gdpr.controller.js';
import { authenticate } from '../../middleware/auth.js';
import validate from '../../middleware/validate-zod.js';
import { eraseMyDataSchema, recordConsentSchema } from './gdpr.validation.js';

const router = Router();
const controller = new GdprController();

router.use(authenticate);

router.get('/export', controller.exportMyData);
router.delete('/erase', validate(eraseMyDataSchema), controller.eraseMyData);
router.post('/consent', validate(recordConsentSchema), controller.recordConsent);
router.get('/consent', controller.getConsentStatus);

export default router;
