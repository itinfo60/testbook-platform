import mongoose, { Schema, Model } from 'mongoose';
import paginatePlugin from '../../models/plugins/paginatePlugin.js';
import tenantPlugin from '../../models/plugins/tenantPlugin.js';
import { ITest, IQuestion, IOption } from './test.dto.js';
import { generateSlug } from '../../utils/helpers.js';

// Removed embedded schemas in favor of Question model

const testSchema = new Schema<ITest>(
  {
    title: {
      type: String,
      required: [true, 'Test title is required'],
      trim: true,
      minlength: 5,
      maxlength: 200,
      index: true,
    },
    slug: { type: String, unique: true, index: true },
    description: { type: String, maxlength: 2000, default: '' },
    instructions: { type: String, maxlength: 2000, default: '' },

    teacher: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    category: {
      type: Schema.Types.ObjectId,
      ref: 'ExamCategory',
      required: true,
      index: true,
    },
    testSeries: {
      type: Schema.Types.ObjectId,
      ref: 'TestSeries',
      default: null,
      index: true,
    },
    testNumber: { type: Number, default: 1 },

    questions: [
      {
        _id: { type: Schema.Types.ObjectId, default: () => new mongoose.Types.ObjectId() },
        question: { type: String, required: true },
        type: {
          type: String,
          enum: ['mcq', 'msq', 'true_false', 'fill_blank', 'subjective'],
          default: 'mcq',
        },
        options: [
          {
            text: { type: String, required: true },
            isCorrect: { type: Boolean, default: false },
          },
        ],
        correctAnswer: { type: String, default: '' },
        marks: { type: Number, default: 1 },
        negativeMarks: { type: Number, default: 0 },
        explanation: { type: String, default: '' },
        sectionName: { type: String, default: 'General' },
        order: { type: Number, default: 0 },
      },
    ],

    duration: { type: Number, required: true, min: 1 }, // minutes
    totalMarks: { type: Number, required: true, min: 1 },
    passingMarks: { type: Number, required: true, min: 0 },
    difficulty: {
      type: String,
      enum: ['beginner', 'intermediate', 'advanced'],
      default: 'intermediate',
      index: true,
    },
    testType: {
      type: String,
      enum: ['full_length', 'subject_wise', 'topic_wise', 'pyq'],
      default: 'full_length',
      index: true,
    },

    questionsCount: { type: Number, default: 0 },
    maxAttempts: { type: Number, default: 0 }, // 0 = unlimited
    totalAttempts: { type: Number, default: 0 },
    averageScore: { type: Number, default: 0 },
    passRate: { type: Number, default: 0 },

    status: {
      type: String,
      enum: ['draft', 'published', 'archived'],
      default: 'draft',
      index: true,
    },
    isPublished: { type: Boolean, default: false, index: true },
    isFeatured: { type: Boolean, default: false, index: true },
    isFree: { type: Boolean, default: true, index: true },
    price: { type: Number, default: 0, min: 0 },

    publishedAt: Date,
    scheduledAt: Date,
    tenantId: { type: Schema.Types.ObjectId, required: true, index: true },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

testSchema.index({ title: 'text', description: 'text' });
testSchema.index({ teacher: 1, status: 1 });
testSchema.index({ category: 1, isPublished: 1 });
testSchema.index({ tenantId: 1, isPublished: 1, createdAt: -1 });
testSchema.index({ tenantId: 1, teacher: 1, status: 1 });
testSchema.index({ tenantId: 1, category: 1, isPublished: 1 });

testSchema.virtual('questionCount').get(function (this: ITest) {
  return this.questions?.length || 0;
});

testSchema.pre('save', function (this: ITest, next) {
  this.questionsCount = this.questions?.length || 0;

  if (this.title && !this.slug) {
    this.slug = generateSlug(this.title);
  }

  if (this.isModified('status')) {
    this.isPublished = this.status === 'published';
    if (this.isPublished && !this.publishedAt) {
      this.publishedAt = new Date();
    }
  }
  next();
});

testSchema.plugin(paginatePlugin);
testSchema.plugin(tenantPlugin);

if (mongoose.models.Test) {
  delete mongoose.models.Test;
}

const Test: Model<ITest> = mongoose.model<ITest>('Test', testSchema);
export default Test;
