import Razorpay from 'razorpay';
import crypto from 'crypto';
import SubscriptionPlan from './subscriptionPlan.model.js';
import Institute from '../institute/institute.model.js';
import ApiError from '../../utils/ApiError.js';
import ApiResponse from '../../utils/ApiResponse.js';
import catchAsync from '../../utils/catchAsync.js';
import { runWithTenant } from '../../utils/TenantContext.js';
import config from '../../config/index.js';
import { emailQueue } from '../../queues/index.js';

const razorpay = config.razorpay.keyId
  ? new Razorpay({ key_id: config.razorpay.keyId, key_secret: config.razorpay.keySecret })
  : null;

/**
 * [SUPER ADMIN] Create a subscription plan.
 */
export const createPlan = catchAsync(async (req, res) => {
  const { name, price, billingCycle, studentLimit, teacherLimit, storageLimit, features } =
    req.body;

  return runWithTenant(null, true, async () => {
    const existing = await SubscriptionPlan.findOne({ name: name.toLowerCase() });
    if (existing) {
      throw ApiError.conflict('Plan with this name already exists');
    }

    const plan = await SubscriptionPlan.create({
      name: name.toLowerCase(),
      price,
      billingCycle,
      studentLimit,
      teacherLimit,
      storageLimit,
      features,
    });

    ApiResponse.created(res, { plan }, 'Subscription plan created');
  });
});

/**
 * Get all active subscription plans.
 */
export const getPlans = catchAsync(async (req, res) => {
  return runWithTenant(null, true, async () => {
    const plans = await SubscriptionPlan.find({ isActive: true });
    ApiResponse.ok(res, { plans });
  });
});

/**
 * [SUPER ADMIN] Update subscription plan.
 */
export const updatePlan = catchAsync(async (req, res) => {
  const { id } = req.params;
  const updates = req.body;

  return runWithTenant(null, true, async () => {
    const plan = await SubscriptionPlan.findByIdAndUpdate(id, updates, {
      new: true,
      runValidators: true,
    });

    if (!plan) {
      throw ApiError.notFound('Plan not found');
    }

    ApiResponse.ok(res, { plan }, 'Subscription plan updated');
  });
});

/**
 * [INSTITUTE ADMIN] Create a Razorpay order for subscription upgrade.
 * Step 1: Create payment order → client pays → Step 2: verify payment.
 */
export const createSubscriptionOrder = catchAsync(async (req, res) => {
  const { planId } = req.body;
  if (!req.tenantId) throw ApiError.badRequest('Tenant context required');
  if (!razorpay) throw ApiError.serviceUnavailable('Payment gateway not configured');

  return runWithTenant(null, true, async () => {
    const plan = await SubscriptionPlan.findById(planId);
    if (!plan || !plan.isActive) throw ApiError.notFound('Plan not found');

    const amountPaise = Math.round(plan.price * 100); // Razorpay uses paise
    const order = await razorpay.orders.create({
      amount: amountPaise,
      currency: 'INR',
      receipt: `sub_${req.tenantId}_${Date.now()}`,
      notes: { planId: plan._id.toString(), tenantId: req.tenantId },
    });

    ApiResponse.ok(
      res,
      {
        orderId: order.id,
        amount: order.amount,
        currency: order.currency,
        plan: { id: plan._id, name: plan.name, price: plan.price },
        keyId: config.razorpay.keyId,
      },
      'Subscription order created'
    );
  });
});

/**
 * [INSTITUTE ADMIN] Verify Razorpay payment and activate subscription.
 */
export const verifySubscriptionPayment = catchAsync(async (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature, planId } = req.body;
  if (!req.tenantId) throw ApiError.badRequest('Tenant context required');

  // Verify signature
  const expectedSig = crypto
    .createHmac('sha256', config.razorpay.keySecret)
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest('hex');

  if (!crypto.timingSafeEqual(Buffer.from(razorpay_signature), Buffer.from(expectedSig))) {
    throw ApiError.unauthorized('Payment verification failed — invalid signature');
  }

  return runWithTenant(null, true, async () => {
    const plan = await SubscriptionPlan.findById(planId);
    if (!plan) throw ApiError.notFound('Plan not found');

    const institute = await Institute.findById(req.tenantId);
    if (!institute) throw ApiError.notFound('Institute not found');

    const expiresAt = new Date();
    expiresAt.setMonth(expiresAt.getMonth() + (plan.billingCycle === 'yearly' ? 12 : 1));

    institute.subscription.plan = plan._id;
    institute.subscription.status = 'active';
    institute.subscription.expiresAt = expiresAt;
    institute.subscription.razorpayPaymentId = razorpay_payment_id;
    institute.limits.studentLimit = plan.studentLimit;
    institute.limits.teacherLimit = plan.teacherLimit;
    institute.limits.storageLimit = plan.storageLimit;
    await institute.save();

    // Queue confirmation email
    await emailQueue.add('send', {
      type: 'subscription_activated',
      data: { institute, plan, expiresAt },
    });

    ApiResponse.ok(res, { institute, plan, expiresAt }, 'Subscription activated successfully');
  });
});

/**
 * [INSTITUTE ADMIN] Legacy upgrade (no payment) — kept for development/demo use.
 */
export const upgradeSubscription = catchAsync(async (req, res) => {
  const { planId } = req.body;
  if (!req.tenantId) throw ApiError.badRequest('Tenant context required');
  if (config.env === 'production') throw ApiError.forbidden('Use the payment flow in production');

  return runWithTenant(null, true, async () => {
    const plan = await SubscriptionPlan.findById(planId);
    if (!plan || !plan.isActive) throw ApiError.notFound('Plan not found');

    const institute = await Institute.findById(req.tenantId);
    if (!institute) throw ApiError.notFound('Institute not found');

    const expiresAt = new Date();
    expiresAt.setMonth(expiresAt.getMonth() + (plan.billingCycle === 'yearly' ? 12 : 1));

    institute.subscription.plan = plan._id;
    institute.subscription.status = 'active';
    institute.subscription.expiresAt = expiresAt;
    institute.limits.studentLimit = plan.studentLimit;
    institute.limits.teacherLimit = plan.teacherLimit;
    institute.limits.storageLimit = plan.storageLimit;
    await institute.save();

    ApiResponse.ok(res, { institute, plan }, 'Subscription upgraded (demo mode)');
  });
});

/**
 * [INSTITUTE ADMIN] Get current subscription status.
 */
export const getMySubscription = catchAsync(async (req, res) => {
  if (!req.tenantId) throw ApiError.badRequest('Tenant context required');

  return runWithTenant(null, true, async () => {
    const institute = await Institute.findById(req.tenantId).populate('subscription.plan');
    if (!institute) throw ApiError.notFound('Institute not found');
    ApiResponse.ok(res, {
      subscription: institute.subscription,
      limits: institute.limits,
      storageUsed: institute.storageUsed,
    });
  });
});

/**
 * [SUPER ADMIN] Delete/Deactivate subscription plan.
 */
export const deletePlan = catchAsync(async (req, res) => {
  const { id } = req.params;

  return runWithTenant(null, true, async () => {
    const plan = await SubscriptionPlan.findByIdAndUpdate(id, { isActive: false }, { new: true });
    if (!plan) {
      throw ApiError.notFound('Plan not found');
    }
    ApiResponse.ok(res, null, 'Subscription plan deactivated');
  });
});
