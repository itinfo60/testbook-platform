import prisma from '../../config/prisma.js';
import { Response, Request } from 'express';
import { BaseController } from '../../core/base.controller.js';
import { PaymentService } from './payment.service.js';
import { CustomRequest } from '../auth/auth.controller.js';
import { ApiError } from '../../core/api-error.js';
import redis from '../../config/redis.js';
import { notificationQueue } from '../../queues/index.js';
import CouponService from '../coupon/coupon.service.js';

export class PaymentController extends BaseController {
  private readonly paymentService: PaymentService;

  constructor(paymentService = new PaymentService()) {
    super();
    this.paymentService = paymentService;
  }

  createOrder = this.catchAsync(async (req: CustomRequest, res: Response) => {
    if (!req.userId) {
      throw ApiError.unauthorized('Authentication required to create a checkout order');
    }
    const result = await this.paymentService.createCheckoutOrder(
      req.userId,
      req.tenantId || null,
      req.body
    );
    return this.created(res, result, 'Order created successfully');
  });

  verifyPayment = this.catchAsync(async (req: CustomRequest, res: Response) => {
    if (!req.userId) {
      throw ApiError.unauthorized('Authentication required to verify payment');
    }
    const result = await this.paymentService.verifyPayment(
      req.userId,
      req.tenantId || null,
      req.body
    );
    return this.ok(res, result, 'Payment verified successfully');
  });

  recordFailure = this.catchAsync(async (req: CustomRequest, res: Response) => {
    if (!req.userId) {
      throw ApiError.unauthorized('Authentication required');
    }
    const { orderId, error } = req.body;
    if (!orderId) {
      throw ApiError.badRequest('orderId is required');
    }
    const result = await this.paymentService.recordPaymentFailure(req.userId, orderId, error || {});
    return this.ok(res, result, 'Payment failure recorded');
  });

  processWebhook = this.catchAsync(async (req: Request, res: Response) => {
    const rawBody = (req as any).rawBody || JSON.stringify(req.body);
    const result = await this.paymentService.processWebhook(req.headers, rawBody);
    return res.status(200).json(result);
  });

  initiateRefund = this.catchAsync(async (req: CustomRequest, res: Response) => {
    if (!req.userId) {
      throw ApiError.unauthorized('Authentication required to request a refund');
    }
    const result = await this.paymentService.initiateRefund(
      req.params.paymentId,
      req.userId,
      req.body
    );
    return this.ok(res, result, 'Refund initiated successfully');
  });

  retryFailedOrder = this.catchAsync(async (req: CustomRequest, res: Response) => {
    if (!req.userId) {
      throw ApiError.unauthorized('Authentication required to retry order');
    }
    const result = await this.paymentService.retryFailedOrder(req.body.paymentId, req.userId);
    return this.ok(res, result, 'Failed order retried successfully');
  });

  getInvoice = this.catchAsync(async (req: CustomRequest, res: Response) => {
    if (!req.userId) {
      throw ApiError.unauthorized('Authentication required to fetch invoice');
    }
    const pdfStream = await this.paymentService.generateInvoicePDF(
      req.params.paymentId,
      req.userId
    );

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=invoice-${req.params.paymentId.slice(-8)}.pdf`
    );
    pdfStream.pipe(res);
  });

  getMyOrders = this.catchAsync(async (req: CustomRequest, res: Response) => {
    if (!req.userId) {
      throw ApiError.unauthorized('Authentication required to list orders');
    }
    const page = parseInt((req.query.page as string) || '1', 10);
    const limit = parseInt((req.query.limit as string) || '10', 10);
    const skip = (page - 1) * limit;

    const [docs, total] = await Promise.all([
      prisma.payment.findMany({
        where: { userId: req.userId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.payment.count({ where: { userId: req.userId } }),
    ]);

    return this.paginated(res, {
      docs,
      page: page.toString(),
      limit: limit.toString(),
      total,
    });
  });

  dummyCheckout = this.catchAsync(async (req: CustomRequest, res: Response) => {
    if (process.env.NODE_ENV === 'production') {
      return res.status(404).json({ success: false, message: 'Not found' });
    }
    const { courseId, testId, couponCode } = req.body;
    if (!req.userId) throw ApiError.unauthorized();

    if (!courseId && !testId) {
      throw ApiError.badRequest('Either courseId or testId is required');
    }

    let item: any = null;
    let amount = 0;

    if (courseId) {
      item = await prisma.course.findFirst({
        where: { OR: [{ id: courseId }, { slug: courseId }] },
      });
      if (!item) throw ApiError.notFound('Course not found');
      amount = item.price || 0;

      const existing = await prisma.enrollment.findFirst({
        where: { userId: req.userId, courseId: item.id, status: { in: ['active', 'completed'] } },
      });
      if (existing) throw ApiError.conflict('Already enrolled in this course');
    } else {
      item = await prisma.test.findFirst({ where: { OR: [{ id: testId }, { slug: testId }] } });
      if (!item)
        item = await prisma.testSeries.findFirst({
          where: { OR: [{ id: testId }, { slug: testId }] },
        });
      if (!item || !item.isPublished) throw ApiError.notFound('Test or Test Series not found');
      amount = item.price || 0;
    }

    const basePrice = item.price || 0;

    // Apply Coupon
    let discount = 0;
    let appliedCoupon: any = null;
    let priceAfterDiscount = basePrice;
    if (couponCode) {
      const couponService = new CouponService();
      try {
        const validation = await couponService.validateCoupon(req.userId, {
          code: couponCode,
          courseId: courseId || undefined,
          amount: basePrice,
        });
        discount = validation.discount;
        priceAfterDiscount = validation.finalAmount;
        appliedCoupon = validation.coupon;
      } catch (err) {
        throw ApiError.badRequest((err as any).message || 'Invalid coupon code');
      }
    }

    const gstAmount = priceAfterDiscount > 0 ? Math.round(priceAfterDiscount * 0.18) : 0;
    const finalAmount = priceAfterDiscount + gstAmount;

    // Create a Payment record using Prisma schema fields
    const payment = await prisma.payment.create({
      data: {
        userId: req.userId,
        orderId: `DEMO_${Date.now()}_${req.userId.slice(-6)}`,
        amount: finalAmount,
        currency: 'INR',
        status: 'completed',
        notes: {
          demo: true,
          itemTitle: item.title,
          basePrice,
          discount,
          gstAmount,
          finalAmount,
          ...(appliedCoupon ? { coupon: appliedCoupon.code, discount } : {}),
        },
        tenantId: req.tenantId || undefined,
      },
    });

    // Create Enrollment (only for courses — Prisma schema requires courseId)
    let enrollment: any = null;
    if (courseId) {
      enrollment = await prisma.enrollment.create({
        data: {
          userId: req.userId,
          courseId: item.id,
          paymentId: payment.id,
          status: 'active',
          paymentStatus: 'paid',
          amount: finalAmount,
        },
      });

      if (couponCode) {
        const couponService = new CouponService();
        await couponService.recordUsage(couponCode, req.userId).catch(() => {});
      }

      await redis.delPattern('courses:*');
      await notificationQueue
        .add('send', {
          type: 'enrollment',
          userId: req.userId,
          tenantId: req.tenantId,
          title: 'Payment Successful',
          message: `You are now enrolled in "${item.title}"`,
          data: { courseId: item.id },
        })
        .catch(() => {});
    }

    return this.created(res, { enrollment, payment }, 'Demo payment successful. Enrolled!');
  });

  getTeacherRevenue = this.catchAsync(async (req: CustomRequest, res: Response) => {
    if (!req.userId) throw ApiError.unauthorized();

    const courses = await prisma.course.findMany({
      where: { teacherId: req.userId },
      select: { id: true, title: true },
    });
    const courseIds = courses.map((c) => c.id);

    if (courseIds.length === 0) {
      return this.ok(res, { payments: [], totalRevenue: 0, totalOrders: 0 });
    }

    // Payment model doesn't have a courseId FK — return stub
    return this.ok(res, { payments: [], totalRevenue: 0, totalOrders: 0 });
  });
}

export default PaymentController;
