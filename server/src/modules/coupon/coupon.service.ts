import { CouponRepository } from './coupon.repository.js';
import { ICoupon, IValidateCouponInput } from './coupon.dto.js';
import { ApiError } from '../../core/api-error.js';
import mongoose from 'mongoose';

export class CouponService {
  private readonly couponRepository: CouponRepository;

  constructor(couponRepository = new CouponRepository()) {
    this.couponRepository = couponRepository;
  }

  async validateCoupon(
    userId: string,
    input: IValidateCouponInput
  ): Promise<{
    coupon: {
      code: string;
      discountType: 'percentage' | 'fixed';
      discountValue: number;
      maxDiscount: number;
    };
    discount: number;
    finalAmount: number;
  }> {
    const { code, courseId, amount = 0 } = input;

    const coupon = await this.couponRepository.findOne({ code: code.toUpperCase() });
    if (!coupon) {
      throw ApiError.notFound('Coupon not found');
    }

    const validity = coupon.isValid();
    if (!validity.valid) {
      throw ApiError.badRequest(validity.message || 'Coupon is invalid');
    }

    // Check per-user limit
    const userUsageCount = coupon.usedBy.filter((u) => u.user.toString() === userId).length;
    if (userUsageCount >= coupon.perUserLimit) {
      throw ApiError.badRequest('You have already used this coupon');
    }

    // Check applicable courses
    if (courseId && coupon.applicableCourses.length > 0) {
      const isApplicable = coupon.applicableCourses.some((id) => id.toString() === courseId);
      if (!isApplicable) {
        throw ApiError.badRequest('Coupon not applicable for this course');
      }
    }

    const discount = coupon.calculateDiscount(amount);

    return {
      coupon: {
        code: coupon.code,
        discountType: coupon.discountType,
        discountValue: coupon.discountValue,
        maxDiscount: coupon.maxDiscount,
      },
      discount,
      finalAmount: Math.max(0, amount - discount),
    };
  }

  async getCoupons(query: any): Promise<{ docs: ICoupon[]; total: number; pagination: any }> {
    const filter: any = {};
    if (query.search) {
      filter.code = { $regex: query.search, $options: 'i' };
    }
    if (query.isActive !== undefined) {
      filter.isActive = query.isActive === 'true';
    }

    const options = {
      page: parseInt(query.page) || 1,
      limit: parseInt(query.limit) || 10,
      sort: query.sort || '-createdAt',
    };

    return this.couponRepository.paginateCoupons(filter, options);
  }

  async createCoupon(body: any): Promise<ICoupon> {
    const code = body.code.toUpperCase();
    const existing = await this.couponRepository.findOne({ code });
    if (existing) {
      throw ApiError.conflict('Coupon code already exists in this institute');
    }

    return this.couponRepository.create({ ...body, code });
  }

  async updateCoupon(id: string, body: any): Promise<ICoupon> {
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

  // Method to record coupon usage upon successful purchase
  async recordUsage(code: string, userId: string): Promise<void> {
    const coupon = await this.couponRepository.findOne({ code: code.toUpperCase() });
    if (!coupon) return;

    coupon.usedCount += 1;
    coupon.usedBy.push({
      user: new mongoose.Types.ObjectId(userId) as any,
      usedAt: new Date(),
    });

    await coupon.save();
  }
}

export default CouponService;
