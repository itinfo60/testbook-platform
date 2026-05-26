import Razorpay from 'razorpay';
import crypto from 'crypto';
import Payment from './payment.model.js';
import Course from '../course/course.model.js';
import Test from '../test/test.model.js';
import Coupon from '../coupon/coupon.model.js';
import Enrollment from '../enrollment/enrollment.model.js';
import User from '../user/user.model.js';
import ApiError from '../../utils/ApiError.js';
import ApiResponse from '../../utils/ApiResponse.js';
import catchAsync from '../../utils/catchAsync.js';
import config from '../../config/index.js';
import redis from '../../config/redis.js';
import { emailQueue, notificationQueue } from '../../queues/index.js';
import { buildPaginationQuery } from '../../utils/pagination.js';

const razorpay = new Razorpay({
  key_id: config.razorpay.keyId,
  key_secret: config.razorpay.keySecret,
});

export const createOrder = catchAsync(async (req, res) => {
  const { courseId, testId, couponCode } = req.body;

  if (!courseId && !testId) {
    throw ApiError.badRequest('Either courseId or testId is required');
  }

  let item = null;
  let amount = 0;

  if (courseId) {
    item = await Course.findById(courseId);
    if (!item) throw ApiError.notFound('Course not found');
    amount = item.effectivePrice;

    // Check if already enrolled
    const existing = await Enrollment.findOne({
      user: req.userId,
      course: courseId,
      status: { $in: ['active', 'completed'] },
    });
    if (existing) throw ApiError.conflict('Already enrolled in course');
  } else {
    item = await Test.findById(testId);
    if (!item || !item.isPublished) throw ApiError.notFound('Test not found');
    amount = item.price || 0;

    // Check if already enrolled
    const existing = await Enrollment.findOne({
      user: req.userId,
      test: testId,
      status: { $in: ['active', 'completed'] },
    });
    if (existing) throw ApiError.conflict('Already purchased test');
  }
  let discount = 0;
  let couponId = null;

  // Apply coupon
  if (couponCode) {
    const coupon = await Coupon.findOne({ code: couponCode.toUpperCase() });
    if (!coupon) throw ApiError.notFound('Coupon not found');

    const validity = coupon.isValid();
    if (!validity.valid) throw ApiError.badRequest(validity.message);

    // Check per-user limit
    const userUsage = coupon.usedBy.filter((u) => u.user.toString() === req.userId).length;
    if (userUsage >= coupon.perUserLimit) {
      throw ApiError.badRequest('Coupon usage limit reached for your account');
    }

    discount = coupon.calculateDiscount(amount);
    amount = Math.max(0, amount - discount);
    couponId = coupon._id;
  }

  // Free enrollment
  if (amount === 0) {
    const enrollmentData = {
      user: req.userId,
      amountPaid: 0,
      couponUsed: couponId,
    };
    if (courseId) enrollmentData.course = courseId;
    if (testId) enrollmentData.test = testId;

    const enrollment = await Enrollment.create(enrollmentData);

    if (courseId) {
      await Course.findByIdAndUpdate(courseId, { $inc: { enrollmentCount: 1 } });
      await User.findByIdAndUpdate(req.userId, { $inc: { enrolledCourses: 1 } });
      await redis.delPattern('courses:*');
    }

    if (couponId) {
      await Coupon.findByIdAndUpdate(couponId, {
        $inc: { usedCount: 1 },
        $push: { usedBy: { user: req.userId, usedAt: new Date() } },
      });
    }

    return ApiResponse.created(res, { enrollment, isFree: true }, 'Enrolled for free');
  }

  // Create Razorpay order
  const order = await razorpay.orders.create({
    amount: Math.round(amount * 100), // Razorpay expects paise
    currency: 'INR',
    receipt: `order_${Date.now()}_${req.userId}`,
    notes: {
      courseId: courseId.toString(),
      userId: req.userId,
      couponCode: couponCode || '',
    },
  });

  // Save payment record
  const paymentData = {
    user: req.userId,
    orderId: order.id,
    amount,
    currency: 'INR',
    status: 'pending',
    provider: 'razorpay',
    coupon: couponId,
    discount,
    netAmount: amount,
    metadata: { razorpayOrderId: order.id },
  };
  if (courseId) paymentData.course = courseId;
  if (testId) paymentData.test = testId;

  const payment = await Payment.create(paymentData);

  ApiResponse.created(
    res,
    {
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      paymentId: payment._id,
      key: config.razorpay.keyId,
    },
    'Order created'
  );
});

export const verifyPayment = catchAsync(async (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

  // Verify signature
  const body = razorpay_order_id + '|' + razorpay_payment_id;
  const expectedSignature = crypto
    .createHmac('sha256', config.razorpay.keySecret)
    .update(body)
    .digest('hex');

  if (expectedSignature !== razorpay_signature) {
    throw ApiError.badRequest('Payment verification failed');
  }

  // Update payment
  const payment = await Payment.findOneAndUpdate(
    { orderId: razorpay_order_id, user: req.userId },
    {
      paymentId: razorpay_payment_id,
      signature: razorpay_signature,
      status: 'completed',
    },
    { new: true }
  );

  if (!payment) throw ApiError.notFound('Payment not found');

  // Create enrollment
  const enrollmentData = {
    user: req.userId,
    amountPaid: payment.amount,
    paymentId: payment._id,
    couponUsed: payment.coupon,
  };
  if (payment.course) enrollmentData.course = payment.course;
  if (payment.test) enrollmentData.test = payment.test;

  const enrollment = await Enrollment.create(enrollmentData);

  // Update course enrollment count if applicable
  if (payment.course) {
    await Course.findByIdAndUpdate(payment.course, { $inc: { enrollmentCount: 1 } });
    await User.findByIdAndUpdate(req.userId, { $inc: { enrolledCourses: 1 } });
    await redis.delPattern('courses:*');
  }

  // Update coupon usage
  if (payment.coupon) {
    await Coupon.findByIdAndUpdate(payment.coupon, {
      $inc: { usedCount: 1 },
      $push: { usedBy: { user: req.userId, usedAt: new Date() } },
    });
  }

  // Send confirmation email
  const user = await User.findById(req.userId);
  if (payment.course) {
    const course = await Course.findById(payment.course);
    await emailQueue.add('send', { type: 'enrollment_confirmation', data: { user, course } });
    await notificationQueue.add('send', {
      type: 'enrollment',
      userId: req.userId,
      tenantId: req.tenantId,
      title: 'Payment Successful',
      message: `You are now enrolled in "${course.title}"`,
      data: { courseId: course._id, paymentId: payment._id },
    });
  }

  ApiResponse.ok(res, { enrollment, payment }, 'Payment verified and enrolled');
});

export const dummyCheckout = catchAsync(async (req, res) => {
  const { courseId, testId } = req.body;

  if (!courseId && !testId) {
    throw ApiError.badRequest('Either courseId or testId is required');
  }

  let item = null;
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

  const paymentData = {
    user: req.userId,
    orderId: `DEMO_${Date.now()}_${req.userId}`,
    amount,
    currency: 'INR',
    status: 'completed',
    provider: 'demo',
    netAmount: amount,
    metadata: { demo: true },
  };
  if (courseId) paymentData.course = courseId;
  if (testId) paymentData.test = testId;

  const payment = await Payment.create(paymentData);

  const enrollmentData = {
    user: req.userId,
    amountPaid: amount,
    paymentId: payment._id,
  };
  if (courseId) enrollmentData.course = courseId;
  if (testId) enrollmentData.test = testId;

  const enrollment = await Enrollment.create(enrollmentData);

  const user = await User.findById(req.userId);

  if (courseId) {
    await Course.findByIdAndUpdate(courseId, { $inc: { enrollmentCount: 1 } });
    await User.findByIdAndUpdate(req.userId, { $inc: { enrolledCourses: 1 } });
    await redis.delPattern('courses:*');
    await emailQueue.add('send', { type: 'enrollment_confirmation', data: { user, course: item } });
    await notificationQueue.add('send', {
      type: 'enrollment',
      userId: req.userId,
      tenantId: req.tenantId,
      title: 'Payment Successful',
      message: `You are now enrolled in "${item.title}"`,
      data: { courseId },
    });
  }

  ApiResponse.created(res, { enrollment, payment }, 'Demo payment successful. Enrolled!');
});

export const getMyOrders = catchAsync(async (req, res) => {
  const pagination = buildPaginationQuery(req.query);

  const result = await Payment.paginate(
    { user: req.userId },
    {
      ...pagination,
      populate: { path: 'course', select: 'title thumbnail price' },
      sort: '-createdAt',
    }
  );

  ApiResponse.paginated(res, {
    docs: result.docs,
    page: result.pagination.page,
    limit: result.pagination.limit,
    total: result.pagination.total,
  });
});

// ===== RAZORPAY WEBHOOK =====
export const handleWebhook = catchAsync(async (req, res) => {
  const webhookSecret = config.razorpay.webhookSecret;
  if (!webhookSecret) throw ApiError.serviceUnavailable('Webhook secret not configured');

  const signature = req.headers['x-razorpay-signature'];
  const body = JSON.stringify(req.body);
  const expectedSig = crypto.createHmac('sha256', webhookSecret).update(body).digest('hex');

  if (signature !== expectedSig) {
    throw ApiError.unauthorized('Invalid webhook signature');
  }

  const { event, payload } = req.body;
  const rPayment = payload?.payment?.entity;

  if (event === 'payment.captured' && rPayment) {
    const payment = await Payment.findOne({ orderId: rPayment.order_id });
    if (payment && payment.status === 'pending') {
      payment.paymentId = rPayment.id;
      payment.status = 'completed';
      await payment.save();
    }
  }

  if (event === 'refund.created' && payload?.refund?.entity) {
    const refund = payload.refund.entity;
    const payment = await Payment.findOne({ paymentId: refund.payment_id });
    if (payment) {
      payment.status = 'refunded';
      payment.refundId = refund.id;
      payment.refundAmount = refund.amount / 100;
      payment.refundedAt = new Date();
      await payment.save();
    }
  }

  res.json({ received: true });
});

// ===== REFUND =====
export const initiateRefund = catchAsync(async (req, res) => {
  const payment = await Payment.findOne({ _id: req.params.paymentId, user: req.userId });
  if (!payment) throw ApiError.notFound('Payment not found');
  if (payment.status !== 'completed')
    throw ApiError.badRequest('Only completed payments can be refunded');
  if (payment.status === 'refunded') throw ApiError.badRequest('Payment already refunded');

  const refundAmount = req.body.amount
    ? Math.min(req.body.amount * 100, payment.amount * 100)
    : payment.amount * 100;

  const refund = await razorpay.payments.refund(payment.paymentId, {
    amount: refundAmount,
    notes: { reason: req.body.reason || 'Customer request' },
  });

  payment.status = 'refunded';
  payment.refundId = refund.id;
  payment.refundAmount = refund.amount / 100;
  payment.refundedAt = new Date();
  await payment.save();

  // Revoke enrollment
  if (payment.course) {
    await Enrollment.findOneAndUpdate(
      { user: req.userId, course: payment.course },
      { status: 'refunded' }
    );
  }

  ApiResponse.ok(
    res,
    { refundId: refund.id, amount: refund.amount / 100 },
    'Refund initiated successfully'
  );
});

// ===== INVOICE =====
export const getInvoice = catchAsync(async (req, res) => {
  const payment = await Payment.findOne({ _id: req.params.paymentId, user: req.userId })
    .populate('user', 'name email phone')
    .populate('course', 'title')
    .populate('test', 'title')
    .lean();

  if (!payment) throw ApiError.notFound('Payment not found');

  const invoice = {
    invoiceNumber: `INV-${payment._id.toString().slice(-8).toUpperCase()}`,
    date: payment.createdAt,
    customer: { name: payment.user.name, email: payment.user.email },
    item: {
      name: payment.course?.title || payment.test?.title || 'Course',
      amount: payment.amount,
    },
    discount: payment.discount || 0,
    tax: payment.tax || 0,
    total: payment.netAmount || payment.amount,
    status: payment.status,
    paymentId: payment.paymentId,
    orderId: payment.orderId,
  };

  ApiResponse.ok(res, { invoice });
});

export const getTeacherRevenue = catchAsync(async (req, res) => {
  // Find courses owned by this teacher
  const courses = await Course.find({ teacher: req.userId }, '_id title thumbnail').lean();
  const courseIds = courses.map((c) => c._id);

  if (courseIds.length === 0) {
    return ApiResponse.ok(res, { payments: [], totalRevenue: 0, totalOrders: 0 });
  }

  const payments = await Payment.find({ course: { $in: courseIds }, status: 'completed' })
    .populate('user', 'name email avatar')
    .populate('course', 'title thumbnail')
    .sort('-createdAt')
    .lean();

  const totalRevenue = payments.reduce((sum, p) => sum + (p.amount || 0), 0);

  ApiResponse.ok(res, { payments, totalRevenue, totalOrders: payments.length });
});
