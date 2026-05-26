import mongoose from 'mongoose';
import paginatePlugin from '../../models/plugins/paginatePlugin.js';
import tenantPlugin from '../../models/plugins/tenantPlugin.js';

const couponSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, unique: true, uppercase: true, trim: true, index: true },
    description: { type: String, default: '' },
    discountType: { type: String, enum: ['percentage', 'fixed'], required: true },
    discountValue: { type: Number, required: true, min: 0 },
    minPurchase: { type: Number, default: 0 },
    maxDiscount: { type: Number, default: 0 },
    usageLimit: { type: Number, default: 0 }, // 0 = unlimited
    usedCount: { type: Number, default: 0 },
    perUserLimit: { type: Number, default: 1 },
    applicableCourses: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Course' }],
    applicableCategories: [{ type: mongoose.Schema.Types.ObjectId, ref: 'ExamCategory' }],
    isActive: { type: Boolean, default: true, index: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    usedBy: [{ user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, usedAt: Date }],
  },
  { timestamps: true }
);

couponSchema.methods.isValid = function () {
  const now = new Date();
  if (!this.isActive) return { valid: false, message: 'Coupon is inactive' };
  if (now < this.startDate) return { valid: false, message: 'Coupon not yet active' };
  if (now > this.endDate) return { valid: false, message: 'Coupon has expired' };
  if (this.usageLimit > 0 && this.usedCount >= this.usageLimit)
    return { valid: false, message: 'Coupon usage limit reached' };
  return { valid: true };
};

couponSchema.methods.calculateDiscount = function (amount) {
  if (amount < this.minPurchase) return 0;
  let discount =
    this.discountType === 'percentage' ? (amount * this.discountValue) / 100 : this.discountValue;
  if (this.maxDiscount > 0) discount = Math.min(discount, this.maxDiscount);
  return Math.min(discount, amount);
};

couponSchema.plugin(paginatePlugin);
couponSchema.plugin(tenantPlugin);

const Coupon = mongoose.model('Coupon', couponSchema);
export default Coupon;
