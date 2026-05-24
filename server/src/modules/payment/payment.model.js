import mongoose from 'mongoose';
import paginatePlugin from '../../models/plugins/paginatePlugin.js';

const paymentSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course' },
    test: { type: mongoose.Schema.Types.ObjectId, ref: 'Test' },
    orderId: { type: String, required: true, unique: true, index: true },
    paymentId: { type: String, sparse: true },
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
    coupon: { type: mongoose.Schema.Types.ObjectId, ref: 'Coupon' },
    discount: { type: Number, default: 0 },
    tax: { type: Number, default: 0 },
    netAmount: { type: Number, default: 0 },
    refundId: String,
    refundAmount: { type: Number, default: 0 },
    refundedAt: Date,
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

paymentSchema.index({ user: 1, createdAt: -1 });
paymentSchema.index({ status: 1, createdAt: -1 });

paymentSchema.pre('validate', function(next) {
  if (!this.course && !this.test) {
    next(new Error('Payment must be associated with either a course or a test.'));
  } else if (this.course && this.test) {
    next(new Error('Payment cannot be associated with both a course and a test.'));
  } else {
    next();
  }
});

paymentSchema.plugin(paginatePlugin);

const Payment = mongoose.model('Payment', paymentSchema);
export default Payment;
