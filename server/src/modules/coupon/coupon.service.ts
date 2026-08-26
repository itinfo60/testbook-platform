import prisma from '../../config/prisma.js';
import { CouponRepository } from './coupon.repository.js';
import { ApiError } from '../../core/api-error.js';

function formatCouponData(body: any) {
  const data: any = {};

  if (body.code !== undefined) {
    data.code = String(body.code).toUpperCase().trim();
  }

  if (body.discountType !== undefined) {
    data.discountType = body.discountType === 'flat' ? 'fixed' : body.discountType;
  }

  const discountType = data.discountType || body.discountType || 'percentage';
  const val =
    body.discountValue !== undefined && body.discountValue !== ''
      ? Number(body.discountValue)
      : undefined;

  if (discountType === 'percentage') {
    if (val !== undefined) {
      data.discountPercent = val;
      data.discountAmount = 0;
    } else if (body.discountPercent !== undefined) {
      data.discountPercent = Number(body.discountPercent);
      data.discountAmount = 0;
    }
  } else {
    data.discountType = 'fixed';
    if (val !== undefined) {
      data.discountAmount = val;
      data.discountPercent = 0;
    } else if (body.discountAmount !== undefined) {
      data.discountAmount = Number(body.discountAmount);
      data.discountPercent = 0;
    }
  }

  if (body.maxDiscount !== undefined) {
    data.maxDiscount =
      body.maxDiscount && body.maxDiscount !== '' ? Number(body.maxDiscount) : null;
  }
  if (body.minOrderAmount !== undefined || body.minPurchaseAmount !== undefined) {
    const m = body.minOrderAmount ?? body.minPurchaseAmount;
    data.minOrderAmount = m !== '' && m !== null && m !== undefined ? Number(m) : 0;
  }
  if (body.validFrom !== undefined || body.startDate !== undefined) {
    const d = body.validFrom || body.startDate;
    data.validFrom = d ? new Date(d) : null;
  }
  if (body.validUntil !== undefined || body.endDate !== undefined || body.expiresAt !== undefined) {
    const d = body.validUntil || body.endDate || body.expiresAt;
    data.validUntil = d ? new Date(d) : null;
  }
  if (body.maxUses !== undefined || body.maxUsage !== undefined || body.usageLimit !== undefined) {
    const u = body.maxUses ?? body.maxUsage ?? body.usageLimit;
    data.maxUses = u && u !== '' ? parseInt(String(u), 10) : null;
  }
  if (body.isActive !== undefined) {
    data.isActive = Boolean(body.isActive);
  }

  return data;
}

function mapCouponResponse(coupon: any) {
  if (!coupon) return coupon;
  const usedCount = coupon.usedCount ?? coupon.usageCount ?? 0;
  return {
    ...coupon,
    discountValue:
      coupon.discountType === 'percentage' ? coupon.discountPercent : coupon.discountAmount,
    startDate: coupon.validFrom,
    endDate: coupon.validUntil,
    expiresAt: coupon.validUntil,
    maxUsage: coupon.maxUses,
    usedCount,
    usageCount: usedCount,
  };
}

export class CouponService {
  private readonly couponRepository: CouponRepository;

  constructor(couponRepository = new CouponRepository()) {
    this.couponRepository = couponRepository;
  }

  async validateCoupon(userId: string, input: any): Promise<any> {
    const { code, courseId, amount = 0 } = input;
    if (!code) throw ApiError.badRequest('Coupon code is required');

    const cleanCode = code.toUpperCase().trim();
    const coupon = await prisma.coupon.findFirst({
      where: { code: cleanCode },
    });
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

    if (coupon.maxUses && (coupon.usedCount || 0) >= coupon.maxUses) {
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

    const [total, rawDocs] = await Promise.all([
      this.couponRepository.count({ where: filter }),
      this.couponRepository.findMany({
        where: filter,
        orderBy: options.orderBy,
        skip: (options.page - 1) * options.limit,
        take: options.limit,
      }),
    ]);

    const docs = rawDocs.map(mapCouponResponse);

    return { docs, total, pagination: { total, page: options.page, limit: options.limit } };
  }

  async getCouponById(id: string): Promise<any> {
    const coupon = await this.couponRepository.findById(id);
    if (!coupon) throw ApiError.notFound('Coupon not found');
    return mapCouponResponse(coupon);
  }

  async createCoupon(body: any): Promise<any> {
    const formatted = formatCouponData(body);
    const code = formatted.code || body.code?.toUpperCase();
    if (!code) throw ApiError.badRequest('Coupon code is required');

    const existing = await this.couponRepository.findOne({ code });
    if (existing) {
      throw ApiError.conflict('Coupon code already exists in this institute');
    }

    const created = await this.couponRepository.create({ ...formatted, code });
    return mapCouponResponse(created);
  }

  async updateCoupon(id: string, body: any): Promise<any> {
    const formatted = formatCouponData(body);
    const coupon = await this.couponRepository.updateById(id, formatted);
    if (!coupon) {
      throw ApiError.notFound('Coupon not found');
    }
    return mapCouponResponse(coupon);
  }

  async deleteCoupon(id: string): Promise<void> {
    const coupon = await this.couponRepository.deleteById(id);
    if (!coupon) {
      throw ApiError.notFound('Coupon not found');
    }
  }

  async recordUsage(code: string, userId?: string): Promise<void> {
    if (!code) return;
    const cleanCode = code.toUpperCase().trim();
    const coupon = await prisma.coupon.findFirst({
      where: { code: cleanCode },
    });
    if (!coupon) return;

    await prisma.coupon.update({
      where: { id: coupon.id },
      data: {
        usedCount: {
          increment: 1,
        },
      },
    });
  }
}

export default CouponService;
