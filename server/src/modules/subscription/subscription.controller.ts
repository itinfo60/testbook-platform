import { Response } from 'express';
import { BaseController } from '../../core/base.controller.js';
import { SubscriptionService } from './subscription.service.js';
import { PaymentService } from '../payment/payment.service.js';
import { CustomRequest } from '../auth/auth.controller.js';
import { ApiError } from '../../core/api-error.js';
import config from '../../config/index.js';

export class SubscriptionController extends BaseController {
  private readonly subscriptionService: SubscriptionService;
  private readonly paymentService: PaymentService;

  constructor(
    subscriptionService = new SubscriptionService(),
    paymentService = new PaymentService()
  ) {
    super();
    this.subscriptionService = subscriptionService;
    this.paymentService = paymentService;
  }

  createPlan = this.catchAsync(async (req: CustomRequest, res: Response) => {
    const plan = await this.subscriptionService.createPlan(req.body);
    return this.created(res, { plan }, 'Subscription plan created successfully');
  });

  getPlans = this.catchAsync(async (req: CustomRequest, res: Response) => {
    const plans = await this.subscriptionService.getPlans();
    return this.ok(res, { plans });
  });

  updatePlan = this.catchAsync(async (req: CustomRequest, res: Response) => {
    const plan = await this.subscriptionService.updatePlan(req.params.id, req.body);
    return this.ok(res, { plan }, 'Subscription plan updated successfully');
  });

  deletePlan = this.catchAsync(async (req: CustomRequest, res: Response) => {
    await this.subscriptionService.deletePlan(req.params.id);
    return this.ok(res, null, 'Subscription plan deactivated successfully');
  });

  upgradeSubscriptionDemo = this.catchAsync(async (req: CustomRequest, res: Response) => {
    if (!req.tenantId) {
      throw ApiError.badRequest('Tenant context required');
    }
    if (config.env === 'production') {
      throw ApiError.forbidden(
        'Legacy direct upgrade is disabled in production mode. Please use payments instead.'
      );
    }
    const result = await this.subscriptionService.upgradeSubscriptionDemo(
      req.tenantId,
      req.body.planId
    );
    return this.ok(res, result, 'Subscription upgraded (demo mode)');
  });

  getMySubscription = this.catchAsync(async (req: CustomRequest, res: Response) => {
    if (!req.tenantId) {
      throw ApiError.badRequest('Tenant context required');
    }
    const result = await this.subscriptionService.getMySubscription(req.tenantId);
    return this.ok(res, result);
  });

  runDunningCycle = this.catchAsync(async (req: CustomRequest, res: Response) => {
    const result = await this.subscriptionService.runDunningCycle();
    return this.ok(res, result, 'Dunning engine cycle executed successfully');
  });

  // Delegated payment integrations
  createSubscriptionOrder = this.catchAsync(async (req: CustomRequest, res: Response) => {
    if (!req.userId) {
      throw ApiError.unauthorized();
    }
    const result = await this.paymentService.createCheckoutOrder(req.userId, {
      planId: req.body.planId,
    });
    return this.ok(res, result, 'Subscription order created');
  });

  verifySubscriptionPayment = this.catchAsync(async (req: CustomRequest, res: Response) => {
    if (!req.userId) {
      throw ApiError.unauthorized();
    }
    const result = await this.paymentService.verifyPayment(
      req.userId,
      req.tenantId || null,
      req.body
    );
    return this.ok(res, result, 'Subscription activated successfully');
  });
}

export default SubscriptionController;
