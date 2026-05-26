import { Document, Types } from 'mongoose';

export interface IUsedByUser {
  user: Types.ObjectId;
  usedAt: Date;
}

export interface ICoupon extends Document {
  _id: Types.ObjectId;
  code: string;
  description?: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  minPurchase: number;
  maxDiscount: number;
  usageLimit: number;
  usedCount: number;
  perUserLimit: number;
  applicableCourses: Types.ObjectId[];
  applicableCategories: Types.ObjectId[];
  isActive: boolean;
  startDate: Date;
  endDate: Date;
  usedBy: IUsedByUser[];
  tenantId: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;

  isValid(): { valid: boolean; message?: string };
  calculateDiscount(amount: number): number;
}

export interface IValidateCouponInput {
  code: string;
  courseId?: string;
  amount?: number;
}
