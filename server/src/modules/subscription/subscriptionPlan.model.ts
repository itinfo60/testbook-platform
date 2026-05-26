import mongoose, { Schema, Model } from 'mongoose';
import { ISubscriptionPlan } from '../payment/payment.dto.js';

const subscriptionPlanSchema = new Schema<ISubscriptionPlan>(
  {
    name: {
      type: String,
      required: [true, 'Plan name is required'],
      unique: true,
      lowercase: true,
      trim: true,
      enum: ['starter', 'growth', 'premium'],
    },
    price: {
      type: Number,
      required: [true, 'Plan price is required'],
      min: [0, 'Price cannot be negative'],
    },
    billingCycle: {
      type: String,
      enum: ['monthly', 'yearly'],
      default: 'monthly',
    },
    studentLimit: {
      type: Number,
      required: true,
      default: 100,
    },
    teacherLimit: {
      type: Number,
      required: true,
      default: 5,
    },
    storageLimit: {
      type: Number, // in bytes
      required: true,
      default: 10 * 1024 * 1024 * 1024, // 10 GB
    },
    features: [
      {
        type: String,
        trim: true,
      },
    ],
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

if (mongoose.models.SubscriptionPlan) {
  delete mongoose.models.SubscriptionPlan;
}

const SubscriptionPlan: Model<ISubscriptionPlan> = mongoose.model<ISubscriptionPlan>(
  'SubscriptionPlan',
  subscriptionPlanSchema
);
export default SubscriptionPlan;
