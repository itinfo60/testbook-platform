import mongoose from 'mongoose';
import tenantPlugin from '../../models/plugins/tenantPlugin.js';
import paginatePlugin from '../../models/plugins/paginatePlugin.js';

const auditSchema = new mongoose.Schema(
  {
    actor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
    actorEmail: String,
    actorRole: String,
    action: { type: String, required: true, index: true },
    resource: { type: String, required: true, index: true },
    resourceId: { type: mongoose.Schema.Types.ObjectId, index: true },
    changes: { type: mongoose.Schema.Types.Mixed },
    metadata: {
      ip: String,
      userAgent: String,
      method: String,
      path: String,
    },
    status: { type: String, enum: ['success', 'failure'], default: 'success' },
    errorMessage: String,
  },
  { timestamps: true }
);

auditSchema.index({ createdAt: -1 });
auditSchema.index({ actor: 1, createdAt: -1 });
auditSchema.index({ action: 1, resource: 1, createdAt: -1 });

auditSchema.plugin(tenantPlugin);
auditSchema.plugin(paginatePlugin);

const AuditLog = mongoose.model('AuditLog', auditSchema);
export default AuditLog;
