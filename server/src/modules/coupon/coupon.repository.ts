import prisma from '../../config/prisma.js';
import { TenantRepository } from '../../core/tenant.repository.js';
import { ICoupon } from './coupon.dto.js';

export class CouponRepository extends TenantRepository<ICoupon> {
  constructor(model = prisma.coupon) {
    super(model as any);
  }

  async paginateCoupons(
    filter: any,
    options: any
  ): Promise<{ docs: ICoupon[]; total: number; pagination: any }> {
    const scopedFilter = this.getScopedFilter(filter);
    const result = await super.paginate(scopedFilter, options);
    return {
      docs: result.docs,
      total: result.pagination.total,
      pagination: result.pagination,
    };
  }
}

export default CouponRepository;
