import mongoose from 'mongoose';
import paginatePlugin from '../../models/plugins/paginatePlugin.js';
import tenantPlugin from '../../models/plugins/tenantPlugin.js';
import { generateSlug } from '../../utils/helpers.js';

const testSeriesSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Test Series title is required'],
      trim: true,
      maxlength: 200,
      index: true,
    },
    slug: { type: String, unique: true, index: true },
    description: { type: String, maxlength: 2000, default: '' },
    instructions: { type: String, maxlength: 2000, default: '' },

    examCategory: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ExamCategory',
      required: true,
      index: true,
    },
    subject: { type: String, default: 'General' },

    testType: {
      type: String,
      enum: ['full_length', 'subject_wise', 'topic_wise', 'pyq', 'daily', 'sectional'],
      default: 'full_length',
      index: true,
    },

    testsCount: { type: Number, default: 0 },
    questionsCount: { type: Number, default: 0 },
    totalMarks: { type: Number, default: 0 },
    duration: { type: Number, default: 0 }, // Total duration in minutes or hours

    thumbnail: {
      url: { type: String, default: '' },
      publicId: { type: String, default: '' },
    },

    difficulty: {
      type: String,
      enum: ['beginner', 'intermediate', 'advanced'],
      default: 'intermediate',
    },
    language: {
      type: String,
      enum: ['Hindi', 'English', 'Bilingual'],
      default: 'Bilingual',
    },

    isFree: { type: Boolean, default: false, index: true },
    price: { type: Number, default: 0, min: 0 },
    discountPrice: { type: Number, default: 0, min: 0 },

    isPublished: { type: Boolean, default: true, index: true },
    isFeatured: { type: Boolean, default: false, index: true },

    publishedAt: Date,
    tenantId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

testSeriesSchema.virtual('tests', {
  ref: 'Test',
  localField: '_id',
  foreignField: 'testSeries',
});

testSeriesSchema.pre('save', function (next) {
  if (this.title && !this.slug) {
    this.slug = generateSlug(this.title);
  }
  next();
});

testSeriesSchema.plugin(paginatePlugin);
testSeriesSchema.plugin(tenantPlugin);

if (mongoose.models.TestSeries) {
  delete mongoose.models.TestSeries;
}

const TestSeries = mongoose.model('TestSeries', testSeriesSchema);
export default TestSeries;
