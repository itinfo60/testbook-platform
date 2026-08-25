export interface IBadgeCriteria {
  type: 'courses_completed' | 'tests_taken' | 'points_earned' | 'streak_days' | 'courses_enrolled';
  value: number;
}

export interface IBadge {
  id: string;
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

export interface IUserBadge {
  id: string;
  user: string;
  badge: string | IBadge;
  earnedAt: Date;
  tenantId: string;
  createdAt: Date;
  updatedAt: Date;
}
