import mongoose from 'mongoose';
import tenantPlugin from '../../models/plugins/tenantPlugin.js';

const apiKeySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    keyHash: { type: String, required: true, unique: true, select: false },
    keyPrefix: { type: String, required: true }, // First 8 chars for identification
    institute: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Institute',
      required: true,
      index: true,
    },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    lastUsedAt: { type: Date },
    expiresAt: { type: Date },
    isActive: { type: Boolean, default: true, index: true },
    permissions: {
      type: [String],
      enum: ['courses:read', 'courses:write', 'enrollments:read', 'tests:read', 'users:read'],
      default: ['courses:read'],
    },
  },
  { timestamps: true }
);

apiKeySchema.index({ institute: 1, isActive: 1 });
apiKeySchema.plugin(tenantPlugin);

const ApiKey = mongoose.model('ApiKey', apiKeySchema);
export default ApiKey;
