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

  async createCheckoutOrder(userId: string, tenantId: string | null, data: ICreateOrderDto) {
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
      item = await prisma.test.findFirst({ where: { id: testId } });
      if (!item) {
        item = await prisma.testSeries.findFirst({ where: { id: testId } });
      }
      if (!item || !item.isPublished) throw ApiError.notFound('Test or Test Series not found');
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
        if (!coupon) throw new Error('Invalid coupon');
        discount = coupon.discount || 0;
        amount = Math.max(0, amount - discount);
        couponNotes = { couponCode, discount };
      } catch (e: any) {
        throw ApiError.badRequest(e.message || 'Invalid coupon');
      }
    }

    // Free enrollment
    if (amount === 0 && courseId) {
      const enrollment = await prisma.enrollment.create({
        data: {
          userId,
          courseId: item.id,
          status: 'active',
          paymentStatus: 'free',
          amount: 0,
        },
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

    const targetTenantId = tenantId || item.tenantId || undefined;

    const payment = await prisma.payment.create({
      data: {
        userId,
        orderId,
        amount,
        currency: orderCurrency,
        status: 'pending',
        notes: {
          razorpayOrderId: orderId,
          itemTitle: item.title,
          courseId: courseId || (item.sections ? item.id : null),
          testId: testId || (!item.sections ? item.id : null),
          ...couponNotes,
        },
        tenantId: targetTenantId,
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

    const existingPayment = await prisma.payment.findFirst({
      where: {
        orderId: razorpay_order_id,
        userId,
      },
    });

    if (!existingPayment) {
      throw ApiError.badRequest('Payment record not found');
    }

    const payment = await prisma.payment.update({
      where: { id: existingPayment.id },
      data: {
        transactionId: razorpay_payment_id,
        status: 'completed',
        notes: {
          ...(typeof existingPayment.notes === 'object' && existingPayment.notes !== null
            ? (existingPayment.notes as object)
            : {}),
          paymentId: razorpay_payment_id,
          signature: razorpay_signature,
        },
      },
    });

    // Process Purchase Activation
    const paymentNotes = (payment.notes || {}) as Record<string, any>;
    const targetCourseId = paymentNotes.courseId;
    const targetTestId = paymentNotes.testId;

    if (targetCourseId) {
      const enrollment = await prisma.enrollment.upsert({
        where: {
          userId_courseId: {
            userId,
            courseId: targetCourseId,
          },
        },
        create: {
          userId,
          courseId: targetCourseId,
          amount: payment.amount,
          paymentStatus: 'paid',
          paymentId: payment.id,
          orderId: payment.orderId,
          status: 'active',
        },
        update: {
          status: 'active',
          paymentStatus: 'paid',
          amount: payment.amount,
          paymentId: payment.id,
        },
      });

      await redis.delPattern('courses:*');
      await redis.delPattern('admin:dashboard:*').catch(() => {});

      const course = await prisma.course.findUnique({ where: { id: targetCourseId } });
      const user = await prisma.user.findUnique({ where: { id: userId } });

      try {
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
      } catch (queueErr) {
        logger.warn('[Notification] Queue push skipped in dev:', queueErr);
      }

      return { enrollment, payment };
    }

    const resolvedSeriesId = paymentNotes.testSeriesId || targetTestId;
    if (resolvedSeriesId) {
      // Find whether this is a TestSeries directly or via test association
      let series = await prisma.testSeries.findUnique({ where: { id: resolvedSeriesId } });
      if (!series) {
        series = await prisma.testSeries.findFirst({
          where: { tests: { has: resolvedSeriesId } },
        });
      }

      if (series) {
        const testSeriesEnrollment = await (prisma as any).testSeriesEnrollment.upsert({
          where: {
            userId_testSeriesId: {
              userId,
              testSeriesId: series.id,
            },
          },
          create: {
            userId,
            testSeriesId: series.id,
            amount: payment.amount,
            paymentStatus: 'paid',
            paymentId: payment.id,
            orderId: payment.orderId,
            status: 'active',
            tenantId,
          },
          update: {
            status: 'active',
            paymentStatus: 'paid',
            amount: payment.amount,
            paymentId: payment.id,
          },
        });

        await redis.delPattern('admin:dashboard:*').catch(() => {});

        try {
          await notificationQueue.add('send', {
            type: 'test_series_enrollment',
            userId,
            tenantId,
            title: 'Payment Successful',
            message: `You are now enrolled in "${series.title}"`,
            data: { testSeriesId: series.id, paymentId: payment.id },
          });
        } catch (queueErr) {
          logger.warn('[Notification] Queue push skipped in dev:', queueErr);
        }

        return { testSeriesEnrollment, payment };
      }
    }

    return { payment };
  }

  async recordPaymentFailure(userId: string, orderId: string, errorMetadata: any = {}) {
    const existing = await prisma.payment.findFirst({
      where: {
        orderId,
        userId,
      },
    });

    if (!existing) {
      return null;
    }

    if (existing.status === 'completed') {
      return existing; // Don't overwrite completed payments
    }

    const updated = await prisma.payment.update({
      where: { id: existing.id },
      data: {
        status: 'failed',
        notes: {
          ...(typeof existing.notes === 'object' && existing.notes !== null
            ? (existing.notes as object)
            : {}),
          failedAt: new Date(),
          failureReason:
            errorMetadata.reason ||
            errorMetadata.description ||
            'Payment cancelled or failed at gateway',
          errorDetails: errorMetadata,
        },
      },
    });

    return updated;
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
      const existing = await prisma.payment.findFirst({
        where: { orderId: rPayment.order_id },
      });
      if (existing) {
        await prisma.payment.update({
          where: { id: existing.id },
          data: {
            transactionId: rPayment.id,
            status: 'completed',
          },
        });
      }
    } else if (event === 'payment.failed' && rPayment) {
      const existing = await prisma.payment.findFirst({
        where: { orderId: rPayment.order_id },
      });
      if (existing) {
        await prisma.payment.update({
          where: { id: existing.id },
          data: {
            transactionId: rPayment.id,
            status: 'failed',
          },
        });
      }
    } else if (event === 'refund.created' && payload?.refund?.entity) {
      const refund = payload.refund.entity;
      const existing = await prisma.payment.findFirst({
        where: { transactionId: refund.payment_id },
      });
      if (existing) {
        await prisma.payment.update({
          where: { id: existing.id },
          data: {
            status: 'refunded',
            notes: {
              ...(typeof existing.notes === 'object' && existing.notes !== null
                ? (existing.notes as object)
                : {}),
              refundId: refund.id,
              refundAmount: refund.amount / 100,
              refundedAt: new Date(),
            },
          },
        });
      }
    }

    return { status: 'success', eventId };
  }

  async initiateRefund(paymentId: string, userId: string, data: IRefundDto) {
    const payment = await prisma.payment.findFirst({
      where: {
        id: paymentId,
        userId,
      },
    });
    if (!payment) throw ApiError.notFound('Payment record not found');
    if (payment.status !== 'completed')
      throw ApiError.badRequest('Only completed payments can be refunded');
    if (!payment.transactionId)
      throw ApiError.badRequest('Payment ID missing on transaction record');

    const refundAmount = data.amount
      ? Math.min(data.amount * 100, payment.amount * 100)
      : payment.amount * 100;

    if (!this.razorpay) {
      throw ApiError.serviceUnavailable('Payment gateway not configured');
    }

    const refund = await this.razorpay.payments.refund(payment.transactionId, {
      amount: refundAmount,
      notes: { reason: data.reason || 'Customer refund request' },
    });

    const refundAmountNum = refund.amount / 100;
    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: 'refunded',
        notes: {
          ...(typeof payment.notes === 'object' && payment.notes !== null
            ? (payment.notes as object)
            : {}),
          refundId: refund.id,
          refundAmount: refundAmountNum,
          refundedAt: new Date(),
        },
      },
    });

    return { refundId: refund.id, refundAmount: refundAmountNum };
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
