import mongoose from 'mongoose';
import tenantPlugin from '../../models/plugins/tenantPlugin.js';

const userActivitySchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    type: {
      type: String,
      enum: [
        'login',
        'course_view',
        'lesson_complete',
        'test_attempt',
        'quiz_attempt',
        'certificate_earned',
        'badge_earned',
      ],
      required: true,
    },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
    ip: String,
    userAgent: String,
  },
  { timestamps: true }
);

userActivitySchema.index({ user: 1, createdAt: -1 });
userActivitySchema.index({ type: 1, createdAt: -1 });

// Auto-delete after 1 year
userActivitySchema.index({ createdAt: 1 }, { expireAfterSeconds: 365 * 24 * 60 * 60 });

userActivitySchema.plugin(tenantPlugin);

const UserActivity = mongoose.model('UserActivity', userActivitySchema);
export default UserActivity;
