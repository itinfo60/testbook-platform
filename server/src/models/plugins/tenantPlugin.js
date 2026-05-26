import mongoose from 'mongoose';
import { getTenantId, isBypassTenant } from '../../utils/TenantContext.js';

/**
 * Mongoose plugin to enforce tenant isolation.
 * Automatically appends tenantId to queries and save hooks.
 */
export default function tenantPlugin(schema, options = {}) {
  // If skipTenant is specified in plugin or schema options, do not apply
  if (options.skipTenant || schema.options.skipTenant) {
    return;
  }

  // Add tenantId field if not already present
  if (!schema.path('tenantId')) {
    schema.add({
      tenantId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Institute',
        index: true,
      },
    });
  }

  /**
   * Inject tenantId query condition.
   */
  const applyTenantFilter = function (next) {
    if (isBypassTenant()) {
      return next();
    }

    const tenantId = getTenantId();
    if (tenantId) {
      this.where({ tenantId });
    }
    next();
  };

  // Register query middlewares
  schema.pre('find', applyTenantFilter);
  schema.pre('findOne', applyTenantFilter);
  schema.pre('findOneAndUpdate', applyTenantFilter);
  schema.pre('findOneAndDelete', applyTenantFilter);
  schema.pre('updateOne', applyTenantFilter);
  schema.pre('updateMany', applyTenantFilter);
  schema.pre('deleteOne', applyTenantFilter);
  schema.pre('deleteMany', applyTenantFilter);
  schema.pre('countDocuments', applyTenantFilter);
  schema.pre('estimatedDocumentCount', applyTenantFilter);

  // Auto-assign tenantId on save if in a tenant context and not explicitly set
  schema.pre('save', function (next) {
    if (isBypassTenant()) {
      return next();
    }

    const tenantId = getTenantId();
    if (tenantId && !this.tenantId) {
      this.tenantId = tenantId;
    }
    next();
  });

  // insertMany: inject tenantId into every doc in the array
  schema.pre('insertMany', function (next, docs) {
    if (isBypassTenant()) return next();
    const tenantId = getTenantId();
    if (tenantId && Array.isArray(docs)) {
      docs.forEach((doc) => {
        if (!doc.tenantId) doc.tenantId = tenantId;
      });
    }
    next();
  });

  // Inject tenantId filter stage at the start of aggregation pipelines
  schema.pre('aggregate', function (next) {
    if (isBypassTenant()) {
      return next();
    }

    const tenantId = getTenantId();
    if (tenantId) {
      // Cast string to mongoose ObjectId for aggregation stages
      let tenantObjectId;
      try {
        tenantObjectId =
          typeof tenantId === 'string' ? new mongoose.Types.ObjectId(tenantId) : tenantId;
      } catch (err) {
        tenantObjectId = tenantId;
      }

      this.pipeline().unshift({
        $match: { tenantId: tenantObjectId },
      });
    }
    next();
  });
}
