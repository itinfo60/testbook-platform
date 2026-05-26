import mongoose from 'mongoose';
import tenantPlugin from '../../models/plugins/tenantPlugin.js';

const affiliateSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    referralCode: { type: String, required: true, unique: true, uppercase: true, trim: true },
    commissionRate: { type: Number, default: 10, min: 0, max: 100 }, // percentage
    totalReferrals: { type: Number, default: 0 },
    totalEarnings: { type: Number, default: 0 }, // in INR
    pendingPayout: { type: Number, default: 0 },
    paidOut: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true, index: true },
  },
  { timestamps: true }
);

affiliateSchema.plugin(tenantPlugin);

const Referral = mongoose.model('Affiliate', affiliateSchema);

const referralSchema = new mongoose.Schema(
  {
    referralCode: { type: String, required: true, index: true },
    referrer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    referred: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    payment: { type: mongoose.Schema.Types.ObjectId, ref: 'Payment' },
    commissionAmount: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ['pending', 'approved', 'paid', 'cancelled'],
      default: 'pending',
      index: true,
    },
    paidAt: { type: Date },
  },
  { timestamps: true }
);

referralSchema.plugin(tenantPlugin);

export { Referral };
export const ReferralRecord = mongoose.model('ReferralRecord', referralSchema);
