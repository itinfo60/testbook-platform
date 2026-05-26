import { describe, it, expect, beforeEach, vi } from 'vitest';
import mongoose from 'mongoose';
import { PassThrough } from 'stream';
import crypto from 'crypto';

const mockRedisStore = new Map<string, any>();

vi.mock('../../../src/config/redis.js', () => ({
  default: {
    isConnected: true,
    get: vi.fn(async (key: string) => mockRedisStore.get(key)),
    set: vi.fn(async (key: string, value: any) => {
      mockRedisStore.set(key, value);
      return true;
    }),
    del: vi.fn(async (key: string) => {
      mockRedisStore.delete(key);
      return true;
    }),
    delPattern: vi.fn(async () => {
      mockRedisStore.clear();
      return true;
    }),
    flush: vi.fn(async () => {
      mockRedisStore.clear();
      return true;
    }),
  },
}));

const mockRazorpayOrdersCreate = vi.fn(async (opts: any) => ({
  id: 'fake_order_id',
  amount: opts.amount,
  currency: opts.currency,
}));

const mockRazorpayPaymentsRefund = vi.fn(async (paymentId: string, opts: any) => ({
  id: 'fake_refund_id',
  amount: opts.amount,
}));

vi.mock('razorpay', () => {
  class MockRazorpay {
    public orders = {
      create: mockRazorpayOrdersCreate,
    };
    public payments = {
      refund: mockRazorpayPaymentsRefund,
    };
  }
  return {
    default: MockRazorpay,
  };
});

vi.mock('../../../src/queues/index.js', () => ({
  transactionalEmailQueue: {
    add: vi.fn(async () => ({ id: 'fake_job_id' })),
  },
  notificationQueue: {
    add: vi.fn(async () => ({ id: 'fake_job_id' })),
  },
  bulkEmailQueue: { add: vi.fn() },
  certificateQueue: { add: vi.fn() },
  dripQueue: { add: vi.fn() },
  reminderQueue: { add: vi.fn() },
  analyticsQueue: { add: vi.fn() },
  dunningQueue: { add: vi.fn() },
}));

import { PaymentService } from '../../../src/modules/payment/payment.service.js';
import { SubscriptionService } from '../../../src/modules/subscription/subscription.service.js';
import Payment from '../../../src/modules/payment/payment.model.js';
import SubscriptionPlan from '../../../src/modules/subscription/subscriptionPlan.model.js';
import Course from '../../../src/modules/course/course.model.js';
import Test from '../../../src/modules/test/test.model.js';
import Enrollment from '../../../src/modules/enrollment/enrollment.model.js';
import User from '../../../src/modules/user/user.model.js';
import Institute from '../../../src/modules/institute/institute.model.js';
import redis from '../../../src/config/redis.js';
import config from '../../../src/config/index.js';
import { runWithTenant } from '../../../src/core/tenant.context.js';
import { transactionalEmailQueue } from '../../../src/queues/index.js';

describe('Payment & Subscription Services', () => {
  let paymentService: PaymentService;
  let subscriptionService: SubscriptionService;

  const mockTenantId = new mongoose.Types.ObjectId().toString();
  const userId = new mongoose.Types.ObjectId().toString();
  const teacherId = new mongoose.Types.ObjectId();
  const categoryId = new mongoose.Types.ObjectId();

  beforeEach(async () => {
    paymentService = new PaymentService();
    subscriptionService = new SubscriptionService();
    await Payment.deleteMany({});
    await SubscriptionPlan.deleteMany({});
    await Course.deleteMany({});
    await Test.deleteMany({});
    await Enrollment.deleteMany({});
    await User.deleteMany({});
    await Institute.deleteMany({});
    await redis.flush();
    vi.clearAllMocks();
  });

  describe('Checkout Orders & Verification', () => {
    it('should create Razorpay order for courses and verification creates enrollment', async () => {
      // 1. Create a paid course
      const course = await runWithTenant(mockTenantId, false, async () => {
        return Course.create({
          title: 'Advanced Mathematics',
          description: 'A comprehensive study of mathematical statistics.',
          teacher: teacherId,
          category: categoryId,
          price: 500,
          discountPrice: 299,
          tenantId: new mongoose.Types.ObjectId(mockTenantId),
        });
      });

      // Override config keys for testing
      config.razorpay.keyId = 'key_id_test';
      config.razorpay.keySecret = 'key_secret_test';
      paymentService = new PaymentService(); // reload client

      // 2. Checkout paid course
      const checkoutResult = await runWithTenant(mockTenantId, false, async () => {
        return paymentService.createCheckoutOrder(userId, { courseId: course._id.toString() });
      });

      expect(checkoutResult.orderId).toBe('fake_order_id');
      expect(checkoutResult.amount).toBe(29900); // 299 in paise

      // Check payment document created in db
      const payments = await runWithTenant(mockTenantId, false, async () => Payment.find({}));
      expect(payments.length).toBe(1);
      expect(payments[0].status).toBe('pending');
      expect(payments[0].amount).toBe(299);

      // 3. Verify Payment
      // Compute correct signature
      const razorpay_order_id = 'fake_order_id';
      const razorpay_payment_id = 'pay_fake_payment_123';
      const razorpay_signature = crypto
        .createHmac('sha256', 'key_secret_test')
        .update(`${razorpay_order_id}|${razorpay_payment_id}`)
        .digest('hex');

      const verificationResult = await runWithTenant(mockTenantId, false, async () => {
        return paymentService.verifyPayment(userId, mockTenantId, {
          razorpay_order_id,
          razorpay_payment_id,
          razorpay_signature,
        });
      });

      expect(verificationResult.payment.status).toBe('completed');
      expect(verificationResult.enrollment).toBeDefined();
      expect(verificationResult.enrollment.amountPaid).toBe(299);
    });

    it('should calculate free course enrollment without contacting Razorpay API', async () => {
      const freeCourse = await runWithTenant(mockTenantId, false, async () => {
        return Course.create({
          title: 'Free Physics Intro',
          description: 'Basic introduction to Newtonian mechanics.',
          teacher: teacherId,
          category: categoryId,
          price: 0,
          tenantId: new mongoose.Types.ObjectId(mockTenantId),
        });
      });

      const checkoutResult = await runWithTenant(mockTenantId, false, async () => {
        return paymentService.createCheckoutOrder(userId, { courseId: freeCourse._id.toString() });
      });

      expect(checkoutResult.isFree).toBe(true);
      expect(checkoutResult.enrollment).toBeDefined();
      expect(checkoutResult.enrollment.amountPaid).toBe(0);
    });
  });

  describe('Order Retry & Recovery Flow', () => {
    it('should regenerate order and reset pending status on failed payment retry', async () => {
      const course = await runWithTenant(mockTenantId, false, async () => {
        return Course.create({
          title: 'Retry Test Course',
          description: 'A study of resilience and retries.',
          teacher: teacherId,
          category: categoryId,
          price: 100,
          tenantId: new mongoose.Types.ObjectId(mockTenantId),
        });
      });

      const originalPayment = await runWithTenant(mockTenantId, false, async () => {
        return Payment.create({
          user: new mongoose.Types.ObjectId(userId),
          course: course._id,
          orderId: 'original_order_id',
          amount: 100,
          currency: 'INR',
          status: 'failed',
          tenantId: new mongoose.Types.ObjectId(mockTenantId),
        });
      });

      const retryResult = await runWithTenant(mockTenantId, false, async () => {
        return paymentService.retryFailedOrder(originalPayment._id.toString(), userId);
      });

      expect(retryResult.orderId).toBe('fake_order_id');
      expect(retryResult.paymentId).toBe(originalPayment._id.toString());

      const updatedPayment = await Payment.findById(originalPayment._id);
      expect(updatedPayment?.orderId).toBe('fake_order_id');
      expect(updatedPayment?.status).toBe('pending');
    });
  });

  describe('Refund Processing & Course Revocation', () => {
    it('should process refunds and set enrollment status to refunded', async () => {
      const course = await runWithTenant(mockTenantId, false, async () => {
        return Course.create({
          title: 'Refund Test Course',
          description: 'A short course on customer policies.',
          teacher: teacherId,
          category: categoryId,
          price: 150,
          tenantId: new mongoose.Types.ObjectId(mockTenantId),
        });
      });

      const payment = await runWithTenant(mockTenantId, false, async () => {
        return Payment.create({
          user: new mongoose.Types.ObjectId(userId),
          course: course._id,
          orderId: 'order_ref',
          paymentId: 'pay_ref',
          amount: 150,
          currency: 'INR',
          status: 'completed',
          tenantId: new mongoose.Types.ObjectId(mockTenantId),
        });
      });

      await runWithTenant(mockTenantId, false, async () => {
        return Enrollment.create({
          user: new mongoose.Types.ObjectId(userId),
          course: course._id,
          amountPaid: 150,
          paymentId: payment._id,
          status: 'active',
          tenantId: new mongoose.Types.ObjectId(mockTenantId),
        });
      });

      await runWithTenant(mockTenantId, false, async () => {
        return paymentService.initiateRefund(payment._id.toString(), userId, {
          reason: 'Student cancelled',
        });
      });

      const updatedPayment = await Payment.findById(payment._id);
      expect(updatedPayment?.status).toBe('refunded');
      expect(updatedPayment?.refundAmount).toBe(150);

      const updatedEnrollment = await runWithTenant(mockTenantId, false, async () => {
        return Enrollment.findOne({
          user: new mongoose.Types.ObjectId(userId),
          course: course._id,
        });
      });
      expect(updatedEnrollment?.status).toBe('refunded');
    });
  });

  describe('Webhook processing & Idempotency', () => {
    it('should process webhook and block duplicate event deliveries via Redis keys', async () => {
      const webhookSecret = 'secret_webhook_123';
      config.razorpay.webhookSecret = webhookSecret;

      const bodyObj = {
        event: 'payment.captured',
        created_at: 1716768000,
        payload: {
          payment: {
            entity: {
              id: 'pay_captured_123',
              order_id: 'order_captured_123',
              amount: 50000,
            },
          },
        },
      };

      const rawBody = JSON.stringify(bodyObj);
      const signature = crypto.createHmac('sha256', webhookSecret).update(rawBody).digest('hex');

      // 1. Process Webhook First time - Success
      const firstRes = await paymentService.processWebhook(
        { 'x-razorpay-signature': signature },
        rawBody
      );
      expect(firstRes.status).toBe('success');

      // 2. Process Webhook Second time - Ignored
      const secondRes = await paymentService.processWebhook(
        { 'x-razorpay-signature': signature },
        rawBody
      );
      expect(secondRes.status).toBe('ignored_duplicate');
    });
  });

  describe('Invoice PDF Generation', () => {
    it('should generate an invoice stream successfully', async () => {
      const user = await User.create({
        name: 'John Customer',
        email: 'john@example.com',
        password: 'Password123!',
      });

      const course = await runWithTenant(mockTenantId, false, async () => {
        return Course.create({
          title: 'Invoice Course Item',
          description: 'A study of invoices.',
          teacher: teacherId,
          category: categoryId,
          price: 250,
          tenantId: new mongoose.Types.ObjectId(mockTenantId),
        });
      });

      const payment = await runWithTenant(mockTenantId, false, async () => {
        return Payment.create({
          user: user._id,
          course: course._id,
          orderId: 'invoice_order_ref',
          amount: 250,
          currency: 'INR',
          status: 'completed',
          tenantId: new mongoose.Types.ObjectId(mockTenantId),
        });
      });

      const pdfStream = await runWithTenant(mockTenantId, false, async () => {
        return paymentService.generateInvoicePDF(payment._id.toString(), user._id.toString());
      });

      expect(pdfStream).toBeInstanceOf(PassThrough);

      // Verify stream outputs data
      const dataPromise = new Promise((resolve) => {
        const chunks: any[] = [];
        pdfStream.on('data', (c) => chunks.push(c));
        pdfStream.on('end', () => resolve(Buffer.concat(chunks)));
      });

      const buffer: any = await dataPromise;
      expect(buffer.length).toBeGreaterThan(0);
    });
  });

  describe('Dunning suspension cycle & Subscription Limits Upgrade', () => {
    it('should upgrade limits upon plan purchase, and run dunning suspension audits', async () => {
      // 1. Setup subscription plans
      const starterPlan = await SubscriptionPlan.create({
        name: 'starter',
        price: 1500,
        billingCycle: 'monthly',
        studentLimit: 200,
        teacherLimit: 10,
        storageLimit: 20 * 1024 * 1024 * 1024,
      });

      const owner = await User.create({
        name: 'Institute Owner',
        email: 'owner@institute.com',
        password: 'Password123!',
      });

      // 2. Onboard Institute
      const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
      const institute = await Institute.create({
        name: 'Dunning Academy',
        subdomain: 'dunning-academy',
        owner: owner._id,
        subscription: {
          plan: starterPlan._id,
          status: 'active',
          expiresAt,
        },
        limits: {
          studentLimit: starterPlan.studentLimit,
          teacherLimit: starterPlan.teacherLimit,
          storageLimit: starterPlan.storageLimit,
        },
      });

      // 3. Test Upgrade Upgrade Demo
      const growthPlan = await SubscriptionPlan.create({
        name: 'growth',
        price: 3999,
        billingCycle: 'monthly',
        studentLimit: 1000,
        teacherLimit: 25,
        storageLimit: 100 * 1024 * 1024 * 1024,
      });

      const upgradeResult = await subscriptionService.upgradeSubscriptionDemo(
        institute._id.toString(),
        growthPlan._id.toString()
      );
      expect(upgradeResult.institute.limits.studentLimit).toBe(1000);
      expect(upgradeResult.institute.limits.teacherLimit).toBe(25);

      // 4. Test Dunning Suspension Cycle
      // Set expiresAt back 10 days (unpaid past grace period of 7 days)
      await Institute.updateOne(
        { _id: institute._id },
        { $set: { 'subscription.expiresAt': new Date(Date.now() - 10 * 24 * 60 * 60 * 1000) } }
      );

      const dunningRes = await subscriptionService.runDunningCycle();
      expect(dunningRes.suspendedCount).toBe(1);
      expect(dunningRes.warnedCount).toBe(0);

      const suspendedInst = await Institute.findById(institute._id);
      expect(suspendedInst?.subscription.status).toBe('suspended');
      expect(transactionalEmailQueue.add).toHaveBeenCalledWith(
        'send',
        expect.objectContaining({ type: 'subscription_suspended' })
      );
    });
  });
});
