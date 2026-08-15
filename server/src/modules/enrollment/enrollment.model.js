import mongoose from 'mongoose';
import paginatePlugin from '../../models/plugins/paginatePlugin.js';
import tenantPlugin from '../../models/plugins/tenantPlugin.js';

const progressSchema = new mongoose.Schema({
  lessonId: { type: mongoose.Schema.Types.ObjectId, required: true },
  sectionId: { type: mongoose.Schema.Types.ObjectId, required: true },
  completed: { type: Boolean, default: false },
  completedAt: Date,
  watchTime: { type: Number, default: 0 }, // seconds
  lastPosition: { type: Number, default: 0 }, // video position
});

const enrollmentSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      index: true,
    },
    test: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Test',
      index: true,
    },
    testSeries: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'TestSeries',
      index: true,
    },
    status: {
      type: String,
      enum: ['active', 'completed', 'expired', 'refunded', 'pending'],
      default: 'pending',
      index: true,
    },
    progress: [progressSchema],
    progressPercentage: { type: Number, default: 0, min: 0, max: 100 },
    amountPaid: { type: Number, default: 0 },
    paymentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Payment' },
    couponUsed: { type: mongoose.Schema.Types.ObjectId, ref: 'Coupon' },

    enrolledAt: { type: Date, default: Date.now },
    completedAt: Date,
    lastAccessedAt: { type: Date, default: Date.now },
    certificateIssued: { type: Boolean, default: false },
    certificateUrl: String,
    certificateId: { type: String, unique: true, sparse: true },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
  }
);

// Compound index to prevent duplicate enrollments
enrollmentSchema.index(
  { user: 1, course: 1 },
  { unique: true, partialFilterExpression: { course: { $exists: true } } }
);
enrollmentSchema.index(
  { user: 1, test: 1 },
  { unique: true, partialFilterExpression: { test: { $exists: true } } }
);

enrollmentSchema.pre('validate', function (next) {
  if (!this.course && !this.test) {
    next(new Error('Enrollment must be associated with either a course or a test.'));
  } else if (this.course && this.test) {
    next(new Error('Enrollment cannot be associated with both a course and a test.'));
  } else {
    next();
  }
});
enrollmentSchema.index({ enrolledAt: -1 });
enrollmentSchema.index({ status: 1, enrolledAt: -1 });
enrollmentSchema.index({ tenantId: 1, user: 1, status: 1 });
enrollmentSchema.index({ tenantId: 1, course: 1, status: 1 });
enrollmentSchema.index({ tenantId: 1, test: 1, status: 1 });

// Method to update progress
enrollmentSchema.methods.updateLessonProgress = function (sectionId, lessonId, data = {}) {
  const existing = this.progress.find(
    (p) =>
      p.lessonId.toString() === lessonId.toString() &&
      p.sectionId.toString() === sectionId.toString()
  );

  if (existing) {
    Object.assign(existing, data);
    if (data.completed && !existing.completedAt) existing.completedAt = new Date();
  } else {
    this.progress.push({
      lessonId,
      sectionId,
      ...data,
      completedAt: data.completed ? new Date() : undefined,
    });
  }

  return this;
};

// Method to recalculate progress percentage
enrollmentSchema.methods.recalculateProgress = function (totalLessons) {
  if (!totalLessons) return 0;
  const completedLessons = this.progress.filter((p) => p.completed).length;
  this.progressPercentage = Math.round((completedLessons / totalLessons) * 100);

  if (this.progressPercentage >= 100) {
    this.status = 'completed';
    this.completedAt = new Date();
  }

  return this.progressPercentage;
};

enrollmentSchema.plugin(paginatePlugin);
enrollmentSchema.plugin(tenantPlugin);

const Enrollment = mongoose.model('Enrollment', enrollmentSchema);
export default Enrollment;
