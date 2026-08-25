import { CouponRepository } from './coupon.repository.js';
import { ApiError } from '../../core/api-error.js';

export class CouponService {
  private readonly couponRepository: CouponRepository;

  constructor(couponRepository = new CouponRepository()) {
    this.couponRepository = couponRepository;
  }

  async validateCoupon(userId: string, input: any): Promise<any> {
    const { code, courseId, amount = 0 } = input;

    const coupon = await this.couponRepository.findOne({ code: code.toUpperCase() });
    if (!coupon) {
      throw ApiError.notFound('Coupon not found');
    }

    if (!coupon.isActive) {
      throw ApiError.badRequest('Coupon is inactive');
    }

    if (coupon.validFrom && new Date() < new Date(coupon.validFrom)) {
      throw ApiError.badRequest('Coupon is not valid yet');
    }

    if (coupon.validUntil && new Date() > new Date(coupon.validUntil)) {
      throw ApiError.badRequest('Coupon has expired');
    }

    if (coupon.maxUses && coupon.usedCount >= coupon.maxUses) {
      throw ApiError.badRequest('Coupon usage limit reached');
    }

    if (amount < (coupon.minOrderAmount || 0)) {
      throw ApiError.badRequest(`Minimum order amount is ${coupon.minOrderAmount}`);
    }

    let discount = 0;
    if (coupon.discountType === 'percentage') {
      discount = (amount * (coupon.discountPercent || 0)) / 100;
      if (coupon.maxDiscount && discount > coupon.maxDiscount) {
        discount = coupon.maxDiscount;
      }
    } else {
      discount = coupon.discountAmount || 0;
    }

    return {
      coupon: {
        code: coupon.code,
        discountType: coupon.discountType,
        discountValue:
          coupon.discountType === 'percentage' ? coupon.discountPercent : coupon.discountAmount,
        maxDiscount: coupon.maxDiscount,
      },
      discount,
      finalAmount: Math.max(0, amount - discount),
    };
  }

  async getCoupons(query: any): Promise<any> {
    const filter: any = {};
    if (query.search) {
      filter.code = { contains: query.search, mode: 'insensitive' };
    }
    if (query.isActive !== undefined) {
      filter.isActive = query.isActive === 'true';
    }

    const options = {
      page: parseInt(query.page) || 1,
      limit: parseInt(query.limit) || 10,
      orderBy: query.sort
        ? { [query.sort.replace('-', '')]: query.sort.startsWith('-') ? 'desc' : 'asc' }
        : { createdAt: 'desc' },
    };

    const [total, docs] = await Promise.all([
      this.couponRepository.count({ where: filter }),
      this.couponRepository.findMany({
        where: filter,
        orderBy: options.orderBy,
        skip: (options.page - 1) * options.limit,
        take: options.limit,
      }),
    ]);

    return { docs, total, pagination: { total, page: options.page, limit: options.limit } };
  }

  async createCoupon(body: any): Promise<any> {
    const code = body.code.toUpperCase();
    const existing = await this.couponRepository.findOne({ code });
    if (existing) {
      throw ApiError.conflict('Coupon code already exists in this institute');
    }

    return this.couponRepository.create({ ...body, code });
  }

  async updateCoupon(id: string, body: any): Promise<any> {
    if (body.code) {
      body.code = body.code.toUpperCase();
    }

    const coupon = await this.couponRepository.updateById(id, body);
    if (!coupon) {
      throw ApiError.notFound('Coupon not found');
    }
    return coupon;
  }

  async deleteCoupon(id: string): Promise<void> {
    const coupon = await this.couponRepository.deleteById(id);
    if (!coupon) {
      throw ApiError.notFound('Coupon not found');
    }
  }

  async recordUsage(code: string, userId: string): Promise<void> {
    const coupon = await this.couponRepository.findOne({ code: code.toUpperCase() });
    if (!coupon) return;

    await this.couponRepository.updateById(coupon.id, {
      usedCount: coupon.usedCount + 1,
    });
  }
}

export default CouponService;
