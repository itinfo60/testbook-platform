export interface IReview {
  _id: string;
  user: string;
  course: string;
  rating: number;
  comment: string;
  isApproved: boolean;
  isFlagged: boolean;
  helpfulCount: number;
  reportCount: number;
  tenantId: string;
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
