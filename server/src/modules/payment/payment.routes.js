import { Router } from 'express';
import * as paymentController from './payment.controller.js';
import { authenticate } from '../../middleware/auth.js';

const router = Router();

router.use(authenticate);

router.post('/create-order', paymentController.createOrder);
router.post('/verify', paymentController.verifyPayment);
router.post('/dummy-checkout', paymentController.dummyCheckout);
router.get('/my-orders', paymentController.getMyOrders);
router.get('/teacher/revenue', paymentController.getTeacherRevenue);

export default router;
