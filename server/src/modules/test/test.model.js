import mongoose from 'mongoose';
import paginatePlugin from '../../models/plugins/paginatePlugin.js';
import tenantPlugin from '../../models/plugins/tenantPlugin.js';

const optionSchema = new mongoose.Schema({
  text: { type: String, required: true },
  isCorrect: { type: Boolean, required: true },
});

const questionSchema = new mongoose.Schema({
  question: { type: String, required: true },
  type: {
    type: String,
    enum: ['mcq', 'msq', 'true_false', 'fill_blank'],
    default: 'mcq',
  },
  options: [optionSchema],
  correctAnswer: String,
  marks: { type: Number, required: true, min: 0 },
  negativeMarks: { type: Number, default: 0, min: 0 },
  explanation: { type: String, default: '' },
  difficulty: { type: String, enum: ['easy', 'medium', 'hard'], default: 'medium' },
  tags: [String],
  order: { type: Number, default: 0 },
});

const testSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Test title is required'],
      trim: true,
      minlength: 5,
      maxlength: 200,
      index: true,
    },
    slug: { type: String, unique: true },
    description: { type: String, maxlength: 2000, default: '' },
    instructions: { type: String, maxlength: 2000, default: '' },

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

    questions: [questionSchema],

    duration: { type: Number, required: true, min: 1 }, // minutes
    totalMarks: { type: Number, required: true, min: 1 },
    passingMarks: { type: Number, required: true, min: 0 },
    difficulty: {
      type: String,
      enum: ['beginner', 'intermediate', 'advanced'],
      default: 'intermediate',
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
    isFeatured: { type: Boolean, default: false },
    isFree: { type: Boolean, default: true },
    price: { type: Number, default: 0 },
    randomizeQuestions: { type: Boolean, default: false },
    randomizeOptions: { type: Boolean, default: false },

    publishedAt: Date,
    scheduledAt: Date,
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

testSchema.virtual('questionCount').get(function () {
  return this.questions?.length || 0;
});

testSchema.pre('save', function (next) {
  this.questionsCount = this.questions?.length || 0;
  if (this.isModified('status')) {
    this.isPublished = this.status === 'published';
    if (this.isPublished && !this.publishedAt) this.publishedAt = new Date();
  }
  next();
});

testSchema.plugin(paginatePlugin);
testSchema.plugin(tenantPlugin);

const Test = mongoose.model('Test', testSchema);
export default Test;
