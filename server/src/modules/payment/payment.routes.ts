import { Router } from 'express';
import express from 'express';
import { PaymentController } from './payment.controller.js';
import { authenticate, authorize } from '../../middleware/auth.js';
import validate from '../../middleware/validate-zod.js';
import {
  createOrderSchema,
  verifyPaymentSchema,
  retryOrderSchema,
  refundSchema,
} from './payment.validation.js';

const router = Router();
const controller = new PaymentController();

// Razorpay Webhooks (receives raw signature)
router.post('/webhook', express.raw({ type: 'application/json' }), controller.processWebhook);

// Protected student/teacher endpoints
router.use(authenticate);

router.post('/create-order', validate(createOrderSchema), controller.createOrder);
router.post('/verify', validate(verifyPaymentSchema), controller.verifyPayment);
router.post('/dummy-checkout', controller.dummyCheckout);
router.post('/retry', validate(retryOrderSchema), controller.retryFailedOrder);
router.get('/my-orders', controller.getMyOrders);
router.get('/invoice/:paymentId', controller.getInvoice);
router.post('/refund/:paymentId', validate(refundSchema), controller.initiateRefund);
router.get('/teacher/revenue', authorize('teacher', 'admin'), controller.getTeacherRevenue);

export default router;
