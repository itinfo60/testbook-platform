import mongoose, { Schema, Model } from 'mongoose';
import paginatePlugin from '../../models/plugins/paginatePlugin.js';
import tenantPlugin from '../../models/plugins/tenantPlugin.js';
import { IPayment } from './payment.dto.js';

const paymentSchema = new Schema<IPayment>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    course: { type: Schema.Types.ObjectId, ref: 'Course' },
    test: { type: Schema.Types.ObjectId, ref: 'Test' },
    subscriptionPlan: { type: Schema.Types.ObjectId, ref: 'SubscriptionPlan' },
    orderId: { type: String, required: true, unique: true, index: true },
    paymentId: { type: String, sparse: true, index: true },
    signature: { type: String },
    amount: { type: Number, required: true, min: 0 },
    currency: { type: String, default: 'INR' },
    status: {
      type: String,
      enum: ['pending', 'completed', 'failed', 'refunded'],
      default: 'pending',
      index: true,
    },
    provider: { type: String, enum: ['razorpay', 'stripe', 'free', 'demo'], default: 'razorpay' },
    coupon: { type: Schema.Types.ObjectId, ref: 'Coupon' },
    discount: { type: Number, default: 0 },
    tax: { type: Number, default: 0 },
    netAmount: { type: Number, default: 0 },
    refundId: String,
    refundAmount: { type: Number, default: 0 },
    refundedAt: Date,
    metadata: { type: Schema.Types.Mixed, default: {} },
    tenantId: { type: Schema.Types.ObjectId, required: true, index: true },
  },
  { timestamps: true }
);

paymentSchema.index({ user: 1, createdAt: -1 });
paymentSchema.index({ status: 1, createdAt: -1 });

paymentSchema.pre('validate', function (this: IPayment, next) {
  const associations = [this.course, this.test, this.subscriptionPlan].filter(Boolean).length;
  if (associations === 0) {
    next(
      new Error('Payment must be associated with either a course, a test, or a subscriptionPlan.')
    );
  } else if (associations > 1) {
    next(
      new Error(
        'Payment cannot be associated with more than one item (course, test, or subscriptionPlan).'
      )
    );
  } else {
    next();
  }
});

paymentSchema.plugin(paginatePlugin);
paymentSchema.plugin(tenantPlugin);

if (mongoose.models.Payment) {
  delete mongoose.models.Payment;
}

const Payment: Model<IPayment> = mongoose.model<IPayment>('Payment', paymentSchema);
export default Payment;
