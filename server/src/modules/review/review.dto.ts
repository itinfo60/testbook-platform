import { Document, Types } from 'mongoose';

export interface IReview extends Document {
  _id: Types.ObjectId;
  user: Types.ObjectId;
  course: Types.ObjectId;
  rating: number;
  comment: string;
  isApproved: boolean;
  isFlagged: boolean;
  helpfulCount: number;
  reportCount: number;
  tenantId: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export interface ICreateReviewInput {
  course: string;
  rating: number;
  comment: string;
}

export interface IUpdateReviewInput {
  rating?: number;
  comment?: string;
}
