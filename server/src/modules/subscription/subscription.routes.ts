import { Router } from 'express';
import { SubscriptionController } from './subscription.controller.js';
import { authenticate, superAdminOnly } from '../../middleware/auth.js';
import validate from '../../middleware/validate-zod.js';
import {
  createPlanSchema,
  updatePlanSchema,
  verifyPaymentSchema,
} from '../payment/payment.validation.js';

const router = Router();
const controller = new SubscriptionController();

// Public
router.get('/', controller.getPlans);

// Institute Admin
router.get('/my', authenticate, controller.getMySubscription);
router.post('/order', authenticate, controller.createSubscriptionOrder);
router.post(
  '/verify',
  authenticate,
  validate(verifyPaymentSchema),
  controller.verifySubscriptionPayment
);
router.post('/upgrade', authenticate, controller.upgradeSubscriptionDemo);

// Super Admin
router.post('/admin', superAdminOnly, validate(createPlanSchema), controller.createPlan);
router.put('/admin/:id', superAdminOnly, validate(updatePlanSchema), controller.updatePlan);
router.delete('/admin/:id', superAdminOnly, controller.deletePlan);
router.post('/admin/run-dunning', superAdminOnly, controller.runDunningCycle);

export default router;
