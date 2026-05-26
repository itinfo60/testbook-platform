import { Document, Types } from 'mongoose';

export interface IBadgeCriteria {
  type: 'courses_completed' | 'tests_taken' | 'points_earned' | 'streak_days' | 'courses_enrolled';
  value: number;
}

export interface IBadge extends Document {
  _id: Types.ObjectId;
  name: string;
  slug: string;
  description: string;
  icon: string;
  category: 'learning' | 'achievement' | 'streak' | 'social' | 'special';
  criteria: IBadgeCriteria;
  points: number;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface IUserBadge extends Document {
  _id: Types.ObjectId;
  user: Types.ObjectId;
  badge: Types.ObjectId | IBadge;
  earnedAt: Date;
  tenantId: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}
