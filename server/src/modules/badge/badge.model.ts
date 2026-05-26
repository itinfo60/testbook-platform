import mongoose, { Schema, Model } from 'mongoose';
import { IBadge } from './badge.dto.js';

const badgeSchema = new Schema<IBadge>(
  {
    name: { type: String, required: true, unique: true, trim: true },
    slug: { type: String, unique: true },
    description: { type: String, required: true, maxlength: 300 },
    icon: { type: String, required: true },
    category: {
      type: String,
      enum: ['learning', 'achievement', 'streak', 'social', 'special'],
      required: true,
    },
    criteria: {
      type: { type: String, required: true },
      value: { type: Number, required: true },
    },
    points: { type: Number, default: 0 },
    rarity: { type: String, enum: ['common', 'rare', 'epic', 'legendary'], default: 'common' },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true, skipTenant: true }
);

badgeSchema.pre('validate', function (this: any, next) {
  if (this.name && (!this.slug || this.isModified('name'))) {
    this.slug = this.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }
  next();
});

if (mongoose.models.Badge) {
  delete mongoose.models.Badge;
}

const Badge: Model<IBadge> = mongoose.model<IBadge>('Badge', badgeSchema);
export default Badge;
