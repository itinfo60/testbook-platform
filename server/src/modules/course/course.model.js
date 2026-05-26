import mongoose from 'mongoose';
import paginatePlugin from '../../models/plugins/paginatePlugin.js';
import softDeletePlugin from '../../models/plugins/softDeletePlugin.js';
import tenantPlugin from '../../models/plugins/tenantPlugin.js';

const lessonSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  type: { type: String, enum: ['video', 'text', 'quiz'], required: true },
  content: { type: String, default: '' },
  videoUrl: { type: String, default: '' },
  duration: { type: Number, default: 0 }, // in seconds
  isFree: { type: Boolean, default: false },
  order: { type: Number, default: 0 },
  dripDays: { type: Number, default: 0 }, // days after enrollment before lesson unlocks (0 = immediate)
  resources: [
    {
      title: String,
      url: String,
      type: { type: String, enum: ['pdf', 'doc', 'link'] },
    },
  ],
});

const sectionSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  description: { type: String, default: '' },
  order: { type: Number, default: 0 },
  lessons: [lessonSchema],
});

const courseSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Course title is required'],
      trim: true,
      minlength: [5, 'Title must be at least 5 characters'],
      maxlength: [200, 'Title cannot exceed 200 characters'],
      index: true,
    },
    slug: { type: String, unique: true, index: true },
    description: {
      type: String,
      required: [true, 'Description is required'],
      minlength: [20, 'Description must be at least 20 characters'],
    },
    shortDescription: { type: String, maxlength: 300 },
    thumbnail: {
      url: { type: String, default: '' },
      publicId: { type: String, default: '' },
    },
    previewVideo: { type: String, default: '' },

    teacher: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ExamCategory',
      required: true,
      index: true,
    },

    price: { type: Number, default: 0, min: 0, index: true },
    discountPrice: { type: Number, default: 0, min: 0 },
    effectivePrice: { type: Number, default: 0, min: 0 },
    isFree: { type: Boolean, default: true },
    currency: { type: String, default: 'INR' },

    language: { type: String, default: 'English' },
    level: {
      type: String,
      enum: ['beginner', 'intermediate', 'advanced'],
      default: 'beginner',
      index: true,
    },
    tags: [{ type: String, trim: true }],
    requirements: [{ type: String, trim: true }],
    whatYouLearn: [{ type: String, trim: true }],

    sections: [sectionSchema],

    // Stats
    averageRating: { type: Number, default: 0, min: 0, max: 5, index: true },
    totalReviews: { type: Number, default: 0 },
    enrollmentCount: { type: Number, default: 0, index: true },
    completionRate: { type: Number, default: 0 },

    totalDuration: { type: Number, default: 0 }, // total seconds
    totalLessons: { type: Number, default: 0 },

    // Status
    status: {
      type: String,
      enum: ['draft', 'published', 'archived'],
      default: 'draft',
      index: true,
    },
    isPublished: { type: Boolean, default: false, index: true },
    isFeatured: { type: Boolean, default: false, index: true },
    publishedAt: Date,
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes
courseSchema.index({ title: 'text', description: 'text', tags: 'text' });
courseSchema.index({ teacher: 1, status: 1 });
courseSchema.index({ category: 1, isPublished: 1 });
courseSchema.index({ price: 1, averageRating: -1 });
courseSchema.index({ tenantId: 1, isPublished: 1, createdAt: -1 }); // primary tenant listing index
courseSchema.index({ tenantId: 1, teacher: 1, status: 1 }); // teacher's courses per tenant
courseSchema.index({ tenantId: 1, isFeatured: 1 }); // featured courses per tenant

// Fields 'effectivePrice' and 'isFree' are calculated pre-save

// Pre-save: calculate totals
courseSchema.pre('save', function (next) {
  if (this.isModified('sections')) {
    let totalLessons = 0;
    let totalDuration = 0;

    this.sections.forEach((section, sIndex) => {
      section.order = sIndex;
      section.lessons.forEach((lesson, lIndex) => {
        lesson.order = lIndex;
        totalLessons++;
        totalDuration += lesson.duration || 0;
      });
    });

    this.totalLessons = totalLessons;
    this.totalDuration = totalDuration;
  }

  // Always compute effectivePrice and isFree
  this.effectivePrice =
    this.discountPrice > 0 && this.discountPrice < this.price ? this.discountPrice : this.price;
  this.isFree = this.effectivePrice === 0;

  if (this.isModified('status')) {
    this.isPublished = this.status === 'published';
    if (this.isPublished && !this.publishedAt) {
      this.publishedAt = new Date();
    }
  }

  next();
});

// Plugins
courseSchema.plugin(paginatePlugin);
courseSchema.plugin(softDeletePlugin);
courseSchema.plugin(tenantPlugin);

const Course = mongoose.model('Course', courseSchema);
export default Course;
