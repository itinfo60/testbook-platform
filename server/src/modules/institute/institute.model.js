import mongoose from 'mongoose';
import paginatePlugin from '../../models/plugins/paginatePlugin.js';

const instituteSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Institute name is required'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters'],
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },
    subdomain: {
      type: String,
      required: [true, 'Subdomain is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^[a-z0-9-]+$/, 'Subdomain can only contain lowercase letters, numbers, and hyphens'],
    },
    customDomain: {
      type: String,
      unique: true,
      sparse: true,
      lowercase: true,
      trim: true,
    },
    logo: {
      url: { type: String, default: '' },
      publicId: { type: String, default: '' },
    },
    theme: {
      primaryColor: { type: String, default: '#3b82f6' },
      secondaryColor: { type: String, default: '#1e3a8a' },
      bannerUrl: { type: String, default: '' },
      faviconUrl: { type: String, default: '' },
    },
    websiteTitle: {
      type: String,
      trim: true,
    },
    contactDetails: {
      email: { type: String, lowercase: true, trim: true },
      phone: { type: String, trim: true },
      address: { type: String, trim: true },
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    subscription: {
      plan: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'SubscriptionPlan',
        required: true,
      },
      status: {
        type: String,
        enum: ['active', 'suspended', 'expired'],
        default: 'active',
        index: true,
      },
      expiresAt: {
        type: Date,
        required: true,
      },
    },
    limits: {
      studentLimit: { type: Number, default: 100 },
      teacherLimit: { type: Number, default: 5 },
      storageLimit: { type: Number, default: 10 * 1024 * 1024 * 1024 }, // 10 GB
    },
    storageUsed: {
      type: Number,
      default: 0, // in bytes
    },
  },
  {
    timestamps: true,
    skipTenant: true, // This is a global system collection, do not add tenantId
  }
);

instituteSchema.plugin(paginatePlugin);

const Institute = mongoose.model('Institute', instituteSchema);
export default Institute;
