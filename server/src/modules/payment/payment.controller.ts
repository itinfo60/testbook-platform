import { Response, Request } from 'express';
import { BaseController } from '../../core/base.controller.js';
import { PaymentService } from './payment.service.js';
import { CustomRequest } from '../auth/auth.controller.js';
import { ApiError } from '../../core/api-error.js';
import Payment from './payment.model.js';
import Course from '../course/course.model.js';
import User from '../user/user.model.js';
import Enrollment from '../enrollment/enrollment.model.js';
import Test from '../test/test.model.js';
import redis from '../../config/redis.js';
import { transactionalEmailQueue, notificationQueue } from '../../queues/index.js';
import mongoose from 'mongoose';

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
    const result = await this.paymentService.createCheckoutOrder(req.userId, req.body);
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
      Payment.find(
        this.paymentService['repository']['getScopedFilter']({
          user: new mongoose.Types.ObjectId(req.userId),
        })
      )
        .populate('course', 'title thumbnail price')
        .populate('test', 'title price')
        .populate('subscriptionPlan', 'name price')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean()
        .exec(),
      Payment.countDocuments(
        this.paymentService['repository']['getScopedFilter']({
          user: new mongoose.Types.ObjectId(req.userId),
        })
      ).exec(),
    ]);

    return this.paginated(res, {
      docs,
      page: page.toString(),
      limit: limit.toString(),
      total,
    });
  });

  dummyCheckout = this.catchAsync(async (req: CustomRequest, res: Response) => {
    const { courseId, testId } = req.body;
    if (!req.userId) throw ApiError.unauthorized();

    if (!courseId && !testId) {
      throw ApiError.badRequest('Either courseId or testId is required');
    }

    let item: any = null;
    let amount = 0;

    if (courseId) {
      item = await Course.findById(courseId);
      if (!item) throw ApiError.notFound('Course not found');
      amount = item.effectivePrice;

      const existing = await Enrollment.findOne({
        user: req.userId,
        course: courseId,
        status: { $in: ['active', 'completed'] },
      });
      if (existing) throw ApiError.conflict('Already enrolled in this course');
    } else {
      item = await Test.findById(testId);
      if (!item || !item.isPublished) throw ApiError.notFound('Test not found');
      amount = item.price || 0;

      const existing = await Enrollment.findOne({
        user: req.userId,
        test: testId,
        status: { $in: ['active', 'completed'] },
      });
      if (existing) throw ApiError.conflict('Already purchased test');
    }

    const paymentData: any = {
      user: new mongoose.Types.ObjectId(req.userId),
      orderId: `DEMO_${Date.now()}_${req.userId.slice(-6)}`,
      amount,
      currency: 'INR',
      status: 'completed',
      provider: 'demo',
      netAmount: amount,
      metadata: { demo: true },
      tenantId: new mongoose.Types.ObjectId(req.tenantId || undefined),
    };
    if (courseId) paymentData.course = new mongoose.Types.ObjectId(courseId);
    if (testId) paymentData.test = new mongoose.Types.ObjectId(testId);

    const payment = await Payment.create(paymentData);

    const enrollmentData: any = {
      user: new mongoose.Types.ObjectId(req.userId),
      amountPaid: amount,
      paymentId: payment._id,
    };
    if (courseId) enrollmentData.course = new mongoose.Types.ObjectId(courseId);
    if (testId) enrollmentData.test = new mongoose.Types.ObjectId(testId);

    const enrollment = await Enrollment.create(enrollmentData);
    const user = await User.findById(req.userId);

    if (courseId) {
      await Course.findByIdAndUpdate(courseId, { $inc: { enrollmentCount: 1 } });
      await User.findByIdAndUpdate(req.userId, { $inc: { enrolledCourses: 1 } });
      await redis.delPattern('courses:*');
      await transactionalEmailQueue
        .add('send', {
          type: 'enrollment_confirmation',
          data: { user, course: item },
        })
        .catch(() => {});

      await notificationQueue
        .add('send', {
          type: 'enrollment',
          userId: req.userId,
          tenantId: req.tenantId,
          title: 'Payment Successful',
          message: `You are now enrolled in "${item.title}"`,
          data: { courseId },
        })
        .catch(() => {});
    }

    return this.created(res, { enrollment, payment }, 'Demo payment successful. Enrolled!');
  });

  getTeacherRevenue = this.catchAsync(async (req: CustomRequest, res: Response) => {
    if (!req.userId) throw ApiError.unauthorized();

    const courses = await Course.find(
      { teacher: new mongoose.Types.ObjectId(req.userId) },
      '_id title thumbnail'
    ).lean();
    const courseIds = courses.map((c) => c._id);

    if (courseIds.length === 0) {
      return this.ok(res, { payments: [], totalRevenue: 0, totalOrders: 0 });
    }

    const payments = await Payment.find(
      this.paymentService['repository']['getScopedFilter']({
        course: { $in: courseIds },
        status: 'completed',
      })
    )
      .populate('user', 'name email avatar')
      .populate('course', 'title thumbnail')
      .sort('-createdAt')
      .lean()
      .exec();

    const totalRevenue = payments.reduce((sum, p) => sum + (p.amount || 0), 0);

    return this.ok(res, { payments, totalRevenue, totalOrders: payments.length });
  });
}

export default PaymentController;
