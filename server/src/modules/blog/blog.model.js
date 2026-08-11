import mongoose from 'mongoose';
import paginatePlugin from '../../models/plugins/paginatePlugin.js';
import tenantPlugin from '../../models/plugins/tenantPlugin.js';
import softDeletePlugin from '../../models/plugins/softDeletePlugin.js';

const blogSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Blog title is required'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    content: {
      type: String,
      required: [true, 'Content is required'],
    },
    excerpt: {
      type: String,
      maxlength: [500, 'Excerpt cannot exceed 500 characters'],
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    coverImage: {
      url: { type: String, default: '' },
      publicId: { type: String, default: '' },
    },
    tags: [{ type: String, trim: true }],
    type: {
      type: String,
      enum: ['article', 'job_alert', 'current_affairs'],
      default: 'article',
      index: true,
    },
    examCategory: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ExamCategory',
      index: true,
      default: null,
    },
    status: {
      type: String,
      enum: ['draft', 'published'],
      default: 'draft',
      index: true,
    },
    views: {
      type: Number,
      default: 0,
    },
    publishedAt: {
      type: Date,
    },

    // Job Alert specific fields (only relevant when type === 'job_alert')
    jobAlert: {
      organization: { type: String, default: '' },
      notificationDate: { type: Date },
      applicationStart: { type: Date },
      applicationEnd: { type: Date },
      examDate: { type: Date },
      admitCardDate: { type: Date },
      resultDate: { type: Date },
      officialNotificationUrl: { type: String, default: '' },
      totalVacancies: { type: Number, default: 0 },
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes for searching
blogSchema.index({ title: 'text', content: 'text', tags: 'text' });

// Middlewares
blogSchema.pre('save', function (next) {
  if (this.isModified('status')) {
    if (this.status === 'published' && !this.publishedAt) {
      this.publishedAt = new Date();
    }
  }
  next();
});

// Plugins
blogSchema.plugin(paginatePlugin);
blogSchema.plugin(tenantPlugin);
blogSchema.plugin(softDeletePlugin);

const Blog = mongoose.model('Blog', blogSchema);

export default Blog;
