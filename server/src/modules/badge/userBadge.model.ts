import mongoose, { Schema, Model } from 'mongoose';
import paginatePlugin from '../../models/plugins/paginatePlugin.js';
import tenantPlugin from '../../models/plugins/tenantPlugin.js';
import { IUserBadge } from './badge.dto.js';

const userBadgeSchema = new Schema<IUserBadge>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    badge: { type: Schema.Types.ObjectId, ref: 'Badge', required: true },
    earnedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

userBadgeSchema.index({ user: 1, badge: 1 }, { unique: true });

userBadgeSchema.plugin(paginatePlugin);
userBadgeSchema.plugin(tenantPlugin);

if (mongoose.models.UserBadge) {
  delete mongoose.models.UserBadge;
}

const UserBadge: Model<IUserBadge> = mongoose.model<IUserBadge>('UserBadge', userBadgeSchema);
export default UserBadge;
