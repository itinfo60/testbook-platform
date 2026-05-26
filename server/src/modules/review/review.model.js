import mongoose from 'mongoose';
import paginatePlugin from '../../models/plugins/paginatePlugin.js';
import tenantPlugin from '../../models/plugins/tenantPlugin.js';

const reviewSchema = new mongoose.Schema(
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
      required: true,
      index: true,
    },
    rating: {
      type: Number,
      required: [true, 'Rating is required'],
      min: 1,
      max: 5,
      index: true,
    },
    comment: {
      type: String,
      required: [true, 'Review comment is required'],
      trim: true,
      minlength: [10, 'Review must be at least 10 characters'],
      maxlength: [1000, 'Review cannot exceed 1000 characters'],
    },
    isApproved: { type: Boolean, default: true },
    isFlagged: { type: Boolean, default: false },
    helpfulCount: { type: Number, default: 0 },
    reportCount: { type: Number, default: 0 },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
  }
);

// One review per user per course
reviewSchema.index({ user: 1, course: 1 }, { unique: true });
reviewSchema.index({ course: 1, createdAt: -1 });

// Static: Calculate average rating for a course
reviewSchema.statics.calculateAverageRating = async function (courseId) {
  const result = await this.aggregate([
    { $match: { course: new mongoose.Types.ObjectId(courseId), isApproved: true } },
    {
      $group: {
        _id: '$course',
        averageRating: { $avg: '$rating' },
        totalReviews: { $sum: 1 },
      },
    },
  ]);

  const Course = mongoose.model('Course');
  if (result.length > 0) {
    await Course.findByIdAndUpdate(courseId, {
      averageRating: Math.round(result[0].averageRating * 10) / 10,
      totalReviews: result[0].totalReviews,
    });
  } else {
    await Course.findByIdAndUpdate(courseId, { averageRating: 0, totalReviews: 0 });
  }
};

// Update rating after save/remove
reviewSchema.post('save', function () {
  this.constructor.calculateAverageRating(this.course);
});

reviewSchema.post('findOneAndDelete', function (doc) {
  if (doc) doc.constructor.calculateAverageRating(doc.course);
});

reviewSchema.plugin(paginatePlugin);
reviewSchema.plugin(tenantPlugin);

const Review = mongoose.model('Review', reviewSchema);
export default Review;
