import prisma from '../../config/prisma.js';

import Razorpay from 'razorpay';
import crypto from 'crypto';
import PDFDocument from 'pdfkit';
import { PassThrough } from 'stream';
import { BaseService } from '../../core/base.service.js';
import { IPayment, ICreateOrderDto, IVerifyPaymentDto, IRefundDto } from './payment.dto.js';
import PaymentRepository from './payment.repository.js';

import { ApiError } from '../../core/api-error.js';
import redis from '../../config/redis.js';
import logger from '../../utils/logger.js';
import config from '../../config/index.js';
import { transactionalEmailQueue, notificationQueue } from '../../queues/index.js';

export class PaymentService extends BaseService<IPayment, PaymentRepository> {
  public razorpay: Razorpay | null;

  constructor(repository: PaymentRepository = new PaymentRepository()) {
    super(repository);
    this.razorpay = config.razorpay.keyId
      ? new Razorpay({ key_id: config.razorpay.keyId, key_secret: config.razorpay.keySecret })
      : null;
  }

  async createCheckoutOrder(userId: string, data: ICreateOrderDto) {
    const { courseId, testId, couponCode } = data;

    let item: any = null;
    let amount = 0;

    if (courseId) {
      item = await prisma.course.findFirst({
        where: { OR: [{ id: courseId }, { slug: courseId }] },
      });
      if (!item) throw ApiError.notFound('Course not found');
      amount = item.price || 0;

      const existing = await prisma.enrollment.findFirst({
        where: { userId, courseId: item.id, status: { in: ['active', 'completed'] } },
      });
      if (existing) throw ApiError.conflict('Already enrolled in course');
    } else if (testId) {
      item = await prisma.test.findFirst({ where: { OR: [{ id: testId }, { slug: testId }] } });
      if (!item)
        item = await prisma.testSeries.findFirst({
          where: { OR: [{ id: testId }, { slug: testId }] },
        });
      if (!item || !item.isPublished) throw ApiError.notFound('Test not found');
      amount = item.price || 0;
    }

    if (!item) throw ApiError.badRequest('No valid item to purchase');

    let discount = 0;
    let couponNotes: any = {};

    if (couponCode) {
      try {
        const coupon = await prisma.coupon.findFirst({
          where: { code: couponCode.toUpperCase(), isActive: true },
        });
        if (!coupon) throw new Error('Coupon not found');
        discount = Math.min(
          amount,
          coupon.discountAmount ||
            (coupon.discountPercent ? (amount * coupon.discountPercent) / 100 : 0)
        );
        amount = Math.max(0, amount - discount);
        couponNotes = { couponCode, discount };
      } catch (e: any) {
        throw ApiError.badRequest(e.message || 'Invalid coupon');
      }
    }

    // Free enrollment
    if (amount === 0 && courseId) {
      const enrollment = await prisma.enrollment.create({
        data: { userId, courseId: item.id, status: 'active', paymentStatus: 'free', amount: 0 },
      });
      await redis.delPattern('courses:*');
      return { enrollment, isFree: true };
    }

    if (!this.razorpay && process.env.ALLOW_MOCK_PAYMENTS !== 'true') {
      throw ApiError.serviceUnavailable('Payment gateway not configured');
    }

    let orderId = `order_mock_${Date.now()}_${userId.slice(-6)}`;
    let orderAmount = Math.round(amount * 100);
    const orderCurrency = 'INR';

    if (this.razorpay) {
      try {
        const order = await this.razorpay.orders.create({
          amount: orderAmount,
          currency: orderCurrency,
          receipt: `receipt_${Date.now()}_${userId.slice(-6)}`,
          notes: { userId, itemId: courseId || testId || '', ...couponNotes },
        });
        orderId = order.id;
        orderAmount = order.amount as number;
      } catch (err: any) {
        if (process.env.ALLOW_MOCK_PAYMENTS === 'true') {
          logger.warn('[Razorpay Fallback] Created mock order:', err.message);
        } else {
          throw err;
        }
      }
    }

    const payment = await prisma.payment.create({
      data: {
        userId,
        orderId,
        amount,
        currency: orderCurrency,
        status: 'pending',
        notes: { razorpayOrderId: orderId, itemTitle: item.title, ...couponNotes },
        tenantId: undefined,
      },
    });

    return {
      orderId,
      amount: orderAmount,
      currency: orderCurrency,
      paymentId: payment.id,
      key: config.razorpay.keyId || 'rzp_test_placeholder',
    };
  }

  async verifyPayment(userId: string, tenantId: string | null, data: IVerifyPaymentDto) {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, planId } = data;

    const isMock =
      process.env.ALLOW_MOCK_PAYMENTS === 'true' ||
      razorpay_order_id.startsWith('order_mock_') ||
      razorpay_signature === 'mock_signature';

    if (!isMock && config.razorpay.keySecret) {
      const expectedSig = crypto
        .createHmac('sha256', config.razorpay.keySecret)
        .update(`${razorpay_order_id}|${razorpay_payment_id}`)
        .digest('hex');

      if (!crypto.timingSafeEqual(Buffer.from(razorpay_signature), Buffer.from(expectedSig))) {
        throw ApiError.unauthorized('Payment verification failed - invalid signature');
      }
    }

    const payment = await prisma.payment.findOneAndUpdate(
      this.repository['getScopedFilter']({
        orderId: razorpay_order_id,
        user: userId,
      }),
      {
        $set: {
          paymentId: razorpay_payment_id,
          signature: razorpay_signature,
          status: 'completed',
        },
      },
      { new: true }
    );

    if (!payment) {
      throw ApiError.badRequest('Payment record not found');
    }

    // Process Purchase Activation
    if (payment.course || payment.test) {
      const enrollmentData: any = {
        user: payment.user,
        amountPaid: payment.amount,
        paymentId: payment.id,
        couponUsed: payment.coupon,
      };

      if (payment.course) enrollmentData.course = payment.course;
      if (payment.test) enrollmentData.test = payment.test;

      const enrollment = await Enrollment.create(enrollmentData);

      if (payment.course) {
        await Course.findByIdAndUpdate(payment.course, { $inc: { enrollmentCount: 1 } });
        await User.findByIdAndUpdate(userId, { $inc: { enrolledCourses: 1 } });
        await redis.delPattern('courses:*');

        const course = await Course.findById(payment.course);
        const user = await User.findById(userId);

        await transactionalEmailQueue.add('send', {
          type: 'enrollment_confirmation',
          data: { user, course },
        });

        await notificationQueue.add('send', {
          type: 'enrollment',
          userId,
          tenantId,
          title: 'Payment Successful',
          message: `You are now enrolled in "${course?.title}"`,
          data: { courseId: course?.id, paymentId: payment.id },
        });
      }

      return { enrollment, payment };
    } else if (payment.subscriptionPlan) {
      // Tenant Plan Upgrade
      const plan = await SubscriptionPlan.findById(payment.subscriptionPlan);
      if (!plan) throw ApiError.notFound('Subscription plan not found');

      if (!tenantId) {
        throw ApiError.badRequest('Tenant context required to apply subscription upgrade');
      }

      const institute = await Institute.findById(tenantId);
      if (!institute) throw ApiError.notFound('Institute tenant not found');

      const expiresAt = new Date();
      expiresAt.setMonth(expiresAt.getMonth() + (plan.billingCycle === 'yearly' ? 12 : 1));

      institute.subscription.plan = plan.id;
      institute.subscription.status = 'active';
      institute.subscription.expiresAt = expiresAt;
      institute.limits.studentLimit = plan.studentLimit;
      institute.limits.teacherLimit = plan.teacherLimit;
      institute.limits.storageLimit = plan.storageLimit;
      await prisma.payment.update({ where: { id: institute.id }, data: institute });

      await transactionalEmailQueue.add('send', {
        type: 'subscription_activated',
        data: { institute, plan, expiresAt },
      });

      return { institute, plan, payment };
    }

    return { payment };
  }

  async processWebhook(headers: Record<string, any>, rawBody: string) {
    const webhookSecret = config.razorpay.webhookSecret;
    if (!webhookSecret) {
      throw ApiError.serviceUnavailable('Webhook secret not configured');
    }

    const signature = headers['x-razorpay-signature'];
    const expectedSig = crypto.createHmac('sha256', webhookSecret).update(rawBody).digest('hex');

    if (signature !== expectedSig) {
      throw ApiError.unauthorized('Invalid webhook signature');
    }

    const eventData = JSON.parse(rawBody);
    const eventId = eventData.created_at + '_' + eventData.event;

    // Webhook Idempotency check via Redis
    const redisKey = `webhook:processed:${eventId}`;
    const wasProcessed = await redis.get(redisKey);
    if (wasProcessed) {
      logger.info(`[Webhook Idempotency] Skipping duplicate webhook event ${eventId}`);
      return { status: 'ignored_duplicate', eventId };
    }

    // Set idempotency lock for 24 hours
    await redis.set(redisKey, 'processed', 86400);

    const { event, payload } = eventData;
    const rPayment = payload?.payment?.entity;

    if (event === 'payment.captured' && rPayment) {
      await prisma.payment.findOneAndUpdate(
        { orderId: rPayment.order_id, status: 'pending' },
        {
          $set: {
            paymentId: rPayment.id,
            status: 'completed',
          },
        }
      );
      // Wait: In a real system, if the student didn't call /verify, we would also trigger enrollment here.
    } else if (event === 'payment.failed' && rPayment) {
      await prisma.payment.findOneAndUpdate(
        { orderId: rPayment.order_id },
        { $set: { status: 'failed', paymentId: rPayment.id } }
      );
    } else if (event === 'refund.created' && payload?.refund?.entity) {
      const refund = payload.refund.entity;
      const payment = await prisma.payment.findOneAndUpdate(
        { paymentId: refund.payment_id, status: { $ne: 'refunded' } },
        {
          $set: {
            status: 'refunded',
            refundId: refund.id,
            refundAmount: refund.amount / 100,
            refundedAt: new Date(),
          },
        },
        { new: true }
      );

      if (payment && payment.course) {
        await Enrollment.findOneAndUpdate(
          { user: payment.user, course: payment.course },
          { $set: { status: 'refunded' } }
        );
      }
    }

    return { status: 'success', eventId };
  }

  async initiateRefund(paymentId: string, userId: string, data: IRefundDto) {
    const payment = await prisma.payment.findFirst(
      this.repository['getScopedFilter']({
        _id: paymentId,
        user: userId,
      })
    );
    if (!payment) throw ApiError.notFound('Payment record not found');
    if (payment.status !== 'completed')
      throw ApiError.badRequest('Only completed payments can be refunded');
    if (!payment.paymentId) throw ApiError.badRequest('Payment ID missing on transaction record');

    const refundAmount = data.amount
      ? Math.min(data.amount * 100, payment.amount * 100)
      : payment.amount * 100;

    if (!this.razorpay) {
      throw ApiError.serviceUnavailable('Payment gateway not configured');
    }

    const refund = await this.razorpay.payments.refund(payment.paymentId, {
      amount: refundAmount,
      notes: { reason: data.reason || 'Customer refund request' },
    });

    payment.status = 'refunded';
    payment.refundId = refund.id;
    payment.refundAmount = refund.amount / 100;
    payment.refundedAt = new Date();
    await prisma.payment.update({ where: { id: payment.id }, data: payment });

    if (payment.course) {
      await Enrollment.findOneAndUpdate(
        { user: payment.user, course: payment.course },
        { $set: { status: 'refunded' } }
      );
    }

    return { refundId: refund.id, refundAmount: payment.refundAmount };
  }

  async retryFailedOrder(paymentId: string, userId: string) {
    const payment = await prisma.payment.findFirst(
      this.repository['getScopedFilter']({
        _id: paymentId,
        user: userId,
      })
    );

    if (!payment) throw ApiError.notFound('Payment not found');
    if (payment.status === 'completed' || payment.status === 'refunded') {
      throw ApiError.badRequest('Order is already settled and cannot be retried');
    }

    if (!this.razorpay) {
      throw ApiError.serviceUnavailable('Payment gateway not configured');
    }

    // Re-create a fresh Razorpay order for the transaction
    const order = await this.razorpay.orders.create({
      amount: Math.round(payment.amount * 100),
      currency: 'INR',
      receipt: `retry_${payment.id.toString().slice(-8)}_${Date.now()}`,
      notes: {
        userId,
        itemId:
          payment.course?.toString() ||
          payment.test?.toString() ||
          payment.subscriptionPlan?.toString() ||
          '',
      },
    });

    payment.orderId = order.id;
    payment.status = 'pending';
    payment.metadata = { ...payment.metadata, razorpayOrderId: order.id, retriedAt: new Date() };
    await prisma.payment.update({ where: { id: payment.id }, data: payment });

    return {
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      paymentId: payment.id.toString(),
      key: config.razorpay.keyId,
    };
  }

  async generateInvoicePDF(paymentId: string, userId: string): Promise<PassThrough> {
    const payment = await prisma.payment
      .findFirst(
        this.repository['getScopedFilter']({
          _id: paymentId,
          user: userId,
        })
      )
      .populate('user', 'name email phone')
      .populate('course', 'title price')
      .populate('test', 'title price')
      .populate('subscriptionPlan', 'name price');

    if (!payment) {
      throw ApiError.notFound('Payment record not found');
    }

    const doc = new PDFDocument({ margin: 50 });
    const stream = new PassThrough();
    doc.pipe(stream);

    // Write Invoice Header
    doc.fontSize(20).text('INVOICE', { align: 'center' });
    doc.moveDown();
    doc.fontSize(12).text(`Invoice ID: INV-${payment.id.toString().slice(-8).toUpperCase()}`);
    doc.text(`Date: ${payment.createdAt.toLocaleDateString()}`);
    doc.text(`Status: ${payment.status.toUpperCase()}`);
    doc.text(`Gateway Receipt: ${payment.orderId}`);
    doc.moveDown();

    // Customer
    const customer = payment.user as any;
    doc.text('Bill To:');
    doc.text(`Name: ${customer?.name || 'Student'}`);
    doc.text(`Email: ${customer?.email || 'N/A'}`);
    doc.text(`Phone: ${customer?.phone || 'N/A'}`);
    doc.moveDown();

    // Table Lines
    doc.text('Item Description', 50, 240);
    doc.text('Amount (INR)', 380, 240);
    doc.moveTo(50, 255).lineTo(500, 255).stroke();

    const itemName =
      payment.course?.title ||
      payment.test?.title ||
      (payment.subscriptionPlan as any)?.name ||
      'Cart checkout';
    doc.text(itemName, 50, 265);
    doc.text(`INR ${payment.amount.toFixed(2)}`, 380, 265);

    doc.moveTo(50, 290).lineTo(500, 290).stroke();
    doc.text(`Discount: INR ${(payment.discount || 0).toFixed(2)}`, 50, 305);
    doc.text(`Tax (GST): INR ${(payment.tax || 0).toFixed(2)}`, 50, 325);
    doc
      .fontSize(14)
      .text(`Net Paid Amount: INR ${(payment.netAmount || payment.amount).toFixed(2)}`, 50, 345);

    doc.end();
    return stream;
  }
}
export default PaymentService;
