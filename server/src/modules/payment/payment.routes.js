import { Router } from 'express';
import express from 'express';
import * as paymentController from './payment.controller.js';
import { authenticate, authorize } from '../../middleware/auth.js';

const router = Router();

// Webhook must receive raw body — mount before authenticate
router.post('/webhook', express.raw({ type: 'application/json' }), paymentController.handleWebhook);

router.use(authenticate);

router.post('/create-order', paymentController.createOrder);
router.post('/verify', paymentController.verifyPayment);
router.post('/dummy-checkout', paymentController.dummyCheckout);
router.get('/my-orders', paymentController.getMyOrders);
router.get('/invoice/:paymentId', paymentController.getInvoice);
router.post('/refund/:paymentId', paymentController.initiateRefund);
router.get('/teacher/revenue', authorize('teacher', 'admin'), paymentController.getTeacherRevenue);

export default router;
