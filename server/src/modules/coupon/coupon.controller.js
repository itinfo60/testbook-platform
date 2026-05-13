import Coupon from './coupon.model.js';
import ApiError from '../../utils/ApiError.js';
import ApiResponse from '../../utils/ApiResponse.js';
import catchAsync from '../../utils/catchAsync.js';
import { buildPaginationQuery } from '../../utils/pagination.js';

export const validateCoupon = catchAsync(async (req, res) => {
  const { code, courseId, amount } = req.body;

  const coupon = await Coupon.findOne({ code: code.toUpperCase() });
  if (!coupon) throw ApiError.notFound('Coupon not found');

  const validity = coupon.isValid();
  if (!validity.valid) throw ApiError.badRequest(validity.message);

  // Check per-user limit
  const userUsage = coupon.usedBy.filter((u) => u.user.toString() === req.userId).length;
  if (userUsage >= coupon.perUserLimit) {
    throw ApiError.badRequest('You have already used this coupon');
  }

  // Check applicable courses/categories
  if (coupon.applicableCourses.length > 0 && !coupon.applicableCourses.includes(courseId)) {
    throw ApiError.badRequest('Coupon not applicable for this course');
  }

  const discount = coupon.calculateDiscount(amount || 0);

  ApiResponse.ok(res, {
    coupon: {
      code: coupon.code,
      discountType: coupon.discountType,
      discountValue: coupon.discountValue,
      maxDiscount: coupon.maxDiscount,
    },
    discount,
    finalAmount: Math.max(0, (amount || 0) - discount),
  }, 'Coupon is valid');
});

// Admin CRUD
export const getCoupons = catchAsync(async (req, res) => {
  const pagination = buildPaginationQuery(req.query);

  const filter = {};
  if (req.query.search) filter.code = { $regex: req.query.search, $options: 'i' };
  if (req.query.isActive !== undefined) filter.isActive = req.query.isActive === 'true';

  const result = await Coupon.paginate(filter, { ...pagination });

  ApiResponse.paginated(res, {
    docs: result.docs,
    page: result.pagination.page,
    limit: result.pagination.limit,
    total: result.pagination.total,
  });
});

export const createCoupon = catchAsync(async (req, res) => {
  const existing = await Coupon.findOne({ code: req.body.code.toUpperCase() });
  if (existing) throw ApiError.conflict('Coupon code already exists');

  const coupon = await Coupon.create({ ...req.body, code: req.body.code.toUpperCase() });
  ApiResponse.created(res, { coupon }, 'Coupon created');
});

export const updateCoupon = catchAsync(async (req, res) => {
  if (req.body.code) req.body.code = req.body.code.toUpperCase();

  const coupon = await Coupon.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  if (!coupon) throw ApiError.notFound('Coupon not found');
  ApiResponse.ok(res, { coupon }, 'Coupon updated');
});

export const deleteCoupon = catchAsync(async (req, res) => {
  const coupon = await Coupon.findByIdAndDelete(req.params.id);
  if (!coupon) throw ApiError.notFound('Coupon not found');
  ApiResponse.ok(res, null, 'Coupon deleted');
});
