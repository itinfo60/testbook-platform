import express from 'express';
import {
  createPlan,
  getPlans,
  updatePlan,
  deletePlan,
  upgradeSubscription,
  getMySubscription,
  createSubscriptionOrder,
  verifySubscriptionPayment,
} from './subscription.controller.js';
import { authenticate, superAdminOnly } from '../../middleware/auth.js';

const router = express.Router();

// Public
router.get('/', getPlans);

// Institute Admin
router.get('/my', authenticate, getMySubscription);
router.post('/order', authenticate, createSubscriptionOrder);
router.post('/verify', authenticate, verifySubscriptionPayment);
router.post('/upgrade', authenticate, upgradeSubscription); // dev/demo only

// Super Admin
router.post('/admin', superAdminOnly, createPlan);
router.put('/admin/:id', superAdminOnly, updatePlan);
router.delete('/admin/:id', superAdminOnly, deletePlan);

export default router;
