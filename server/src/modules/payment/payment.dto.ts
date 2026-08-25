export interface IPayment {
  _id: string;
  user: string;
  course?: string;
  test?: string;
  subscriptionPlan?: string;
  orderId: string;
  paymentId?: string;
  signature?: string;
  amount: number;
  currency: string;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  provider: 'razorpay' | 'stripe' | 'free' | 'demo';
  coupon?: string;
  discount: number;
  tax: number;
  netAmount: number;
  refundId?: string;
  refundAmount: number;
  refundedAt?: Date;
  metadata: Record<string, any>;
  tenantId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ISubscriptionPlan {
  _id: string;
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
