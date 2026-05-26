import mongoose, { Schema, Model } from 'mongoose';
import paginatePlugin from '../../models/plugins/paginatePlugin.js';
import tenantPlugin from '../../models/plugins/tenantPlugin.js';
import { ICoupon } from './coupon.dto.js';

const usedByUserSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    usedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const couponSchema = new Schema<ICoupon>(
  {
    code: { type: String, required: true, uppercase: true, trim: true, index: true },
    description: { type: String, default: '' },
    discountType: { type: String, enum: ['percentage', 'fixed'], required: true },
    discountValue: { type: Number, required: true, min: 0 },
    minPurchase: { type: Number, default: 0 },
    maxDiscount: { type: Number, default: 0 },
    usageLimit: { type: Number, default: 0 }, // 0 = unlimited
    usedCount: { type: Number, default: 0 },
    perUserLimit: { type: Number, default: 1 },
    applicableCourses: [{ type: Schema.Types.ObjectId, ref: 'Course' }],
    applicableCategories: [{ type: Schema.Types.ObjectId, ref: 'ExamCategory' }],
    isActive: { type: Boolean, default: true, index: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    usedBy: [usedByUserSchema],
    tenantId: { type: Schema.Types.ObjectId, ref: 'Institute', required: true, index: true },
  },
  { timestamps: true }
);

// Enforce tenant-level uniqueness instead of global uniqueness
couponSchema.index({ tenantId: 1, code: 1 }, { unique: true });

couponSchema.methods.isValid = function (this: ICoupon) {
  const now = new Date();
  if (!this.isActive) return { valid: false, message: 'Coupon is inactive' };
  if (now < this.startDate) return { valid: false, message: 'Coupon not yet active' };
  if (now > this.endDate) return { valid: false, message: 'Coupon has expired' };
  if (this.usageLimit > 0 && this.usedCount >= this.usageLimit) {
    return { valid: false, message: 'Coupon usage limit reached' };
  }
  return { valid: true };
};

couponSchema.methods.calculateDiscount = function (this: ICoupon, amount: number) {
  if (amount < this.minPurchase) return 0;
  let discount =
    this.discountType === 'percentage' ? (amount * this.discountValue) / 100 : this.discountValue;
  if (this.maxDiscount > 0) discount = Math.min(discount, this.maxDiscount);
  return Math.min(discount, amount);
};

couponSchema.plugin(paginatePlugin);
couponSchema.plugin(tenantPlugin);

if (mongoose.models.Coupon) {
  delete mongoose.models.Coupon;
}

const Coupon: Model<ICoupon> = mongoose.model<ICoupon>('Coupon', couponSchema);
export default Coupon;
