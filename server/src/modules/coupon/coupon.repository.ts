import { Model } from 'mongoose';
import { TenantRepository } from '../../core/tenant.repository.js';
import { ICoupon } from './coupon.dto.js';
import Coupon from './coupon.model.js';

export class CouponRepository extends TenantRepository<ICoupon> {
  constructor(model: Model<ICoupon> = Coupon) {
    super(model);
  }

  async paginateCoupons(
    filter: any,
    options: any
  ): Promise<{ docs: ICoupon[]; total: number; pagination: any }> {
    const scopedFilter = this.getScopedFilter(filter);
    const result = await (this.model as any).paginate(scopedFilter, options);
    return {
      docs: result.docs,
      total: result.pagination.total,
      pagination: result.pagination,
    };
  }
}

export default CouponRepository;
