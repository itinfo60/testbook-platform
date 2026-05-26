import { Types, Document } from 'mongoose';

export interface IPayment extends Document {
  _id: Types.ObjectId;
  user: Types.ObjectId;
  course?: Types.ObjectId;
  test?: Types.ObjectId;
  subscriptionPlan?: Types.ObjectId;
  orderId: string;
  paymentId?: string;
  signature?: string;
  amount: number;
  currency: string;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  provider: 'razorpay' | 'stripe' | 'free' | 'demo';
  coupon?: Types.ObjectId;
  discount: number;
  tax: number;
  netAmount: number;
  refundId?: string;
  refundAmount: number;
  refundedAt?: Date;
  metadata: Record<string, any>;
  tenantId: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export interface ISubscriptionPlan extends Document {
  _id: Types.ObjectId;
  name: 'starter' | 'growth' | 'premium';
  price: number;
  billingCycle: 'monthly' | 'yearly';
  studentLimit: number;
  teacherLimit: number;
  storageLimit: number;
  features: string[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ICreateOrderDto {
  courseId?: string;
  testId?: string;
  planId?: string;
  couponCode?: string;
}

export interface IVerifyPaymentDto {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
  planId?: string; // used for subscription upgrades
}

export interface IRetryOrderDto {
  paymentId: string;
}

export interface IRefundDto {
  amount?: number;
  reason?: string;
}

export interface ISubscriptionPlanDto {
  name: 'starter' | 'growth' | 'premium';
  price: number;
  billingCycle: 'monthly' | 'yearly';
  studentLimit: number;
  teacherLimit: number;
  storageLimit: number;
  features?: string[];
}
