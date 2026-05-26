import mongoose from 'mongoose';

const badgeSchema = new mongoose.Schema(
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

const Badge = mongoose.model('Badge', badgeSchema);
export default Badge;
