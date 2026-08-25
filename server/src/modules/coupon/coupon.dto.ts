export interface IUsedByUser {
  user: string;
  usedAt: Date;
}

export interface ICoupon {
  _id: string;
  code: string;
  description?: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  minPurchase: number;
  maxDiscount: number;
  usageLimit: number;
  usedCount: number;
  perUserLimit: number;
  applicableCourses: string[];
  applicableCategories: string[];
  isActive: boolean;
  startDate: Date;
  endDate: Date;
  usedBy: IUsedByUser[];
  tenantId: string;
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
