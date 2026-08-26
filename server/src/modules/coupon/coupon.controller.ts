import { Response, Request } from 'express';
import { BaseController } from '../../core/base.controller.js';
import { CouponService } from './coupon.service.js';

interface CustomRequest extends Request {
  userId?: string;
  tenantId?: string | null;
}

export class CouponController extends BaseController {
  private readonly couponService: CouponService;

  constructor(couponService = new CouponService()) {
    super();
    this.couponService = couponService;
  }

  validateCoupon = this.catchAsync(async (req: CustomRequest, res: Response) => {
    const result = await this.couponService.validateCoupon(req.userId!, req.body);
    return this.ok(res, result, 'Coupon is valid');
  });

  getCoupons = this.catchAsync(async (req: CustomRequest, res: Response) => {
    const result = await this.couponService.getCoupons(req.query);
    return this.paginated(res, {
      docs: result.docs,
      page: (req.query.page as string) || '1',
      limit: (req.query.limit as string) || '10',
      total: result.total,
    });
  });

  getCouponById = this.catchAsync(async (req: CustomRequest, res: Response) => {
    const coupon = await this.couponService.getCouponById(req.params.id);
    return this.ok(res, { coupon });
  });

  createCoupon = this.catchAsync(async (req: CustomRequest, res: Response) => {
    const coupon = await this.couponService.createCoupon(req.body);
    return this.created(res, { coupon }, 'Coupon created');
  });

  updateCoupon = this.catchAsync(async (req: CustomRequest, res: Response) => {
    const coupon = await this.couponService.updateCoupon(req.params.id, req.body);
    return this.ok(res, { coupon }, 'Coupon updated');
  });

  deleteCoupon = this.catchAsync(async (req: CustomRequest, res: Response) => {
    await this.couponService.deleteCoupon(req.params.id);
    return this.ok(res, null, 'Coupon deleted');
  });
}

export default CouponController;
