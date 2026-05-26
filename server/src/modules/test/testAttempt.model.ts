import mongoose, { Schema, Model } from 'mongoose';
import paginatePlugin from '../../models/plugins/paginatePlugin.js';
import tenantPlugin from '../../models/plugins/tenantPlugin.js';
import { ITestAttempt, IAttemptAnswer, IPaletteItem } from './test.dto.js';

const answerSchema = new Schema<IAttemptAnswer>({
  questionId: { type: Schema.Types.ObjectId, required: true },
  selectedOptions: [Number],
  textAnswer: { type: String, default: '' },
  isCorrect: { type: Boolean, default: false },
  marksObtained: { type: Number, default: 0 },
  timeTaken: { type: Number, default: 0 }, // seconds
});

const paletteSchema = new Schema<IPaletteItem>({
  questionId: { type: Schema.Types.ObjectId, required: true },
  status: {
    type: String,
    enum: ['visited', 'skipped', 'flagged', 'answered'],
    default: 'visited',
  },
});

const testAttemptSchema = new Schema<ITestAttempt>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    test: {
      type: Schema.Types.ObjectId,
      ref: 'Test',
      required: true,
      index: true,
    },
    answers: { type: [answerSchema], default: [] },
    palette: { type: [paletteSchema], default: [] },
    score: { type: Number, default: 0 },
    totalMarks: { type: Number, required: true },
    percentage: { type: Number, default: 0 },
    isPassed: { type: Boolean, default: false },
    status: {
      type: String,
      enum: ['in_progress', 'completed', 'timed_out', 'abandoned'],
      default: 'in_progress',
      index: true,
    },
    gradingStatus: {
      type: String,
      enum: ['auto_graded', 'pending_manual', 'manually_graded'],
      default: 'auto_graded',
      index: true,
    },
    startedAt: { type: Date, default: Date.now },
    completedAt: Date,
    timeTaken: { type: Number, default: 0 }, // total seconds
    attemptNumber: { type: Number, default: 1 },
    windowViolations: { type: Number, default: 0 },
    tenantId: { type: Schema.Types.ObjectId, required: true, index: true },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

testAttemptSchema.index({ user: 1, test: 1, createdAt: -1 });
testAttemptSchema.index({ test: 1, score: -1 });

testAttemptSchema.methods.calculateScore = function (this: ITestAttempt) {
  let totalScore = 0;
  this.answers.forEach((answer) => {
    totalScore += answer.marksObtained;
  });
  this.score = Math.max(0, totalScore);
  this.percentage = this.totalMarks > 0 ? Math.round((this.score / this.totalMarks) * 100) : 0;
  return this;
};

testAttemptSchema.plugin(paginatePlugin);
testAttemptSchema.plugin(tenantPlugin);

if (mongoose.models.TestAttempt) {
  delete mongoose.models.TestAttempt;
}

const TestAttempt: Model<ITestAttempt> = mongoose.model<ITestAttempt>(
  'TestAttempt',
  testAttemptSchema
);

export default TestAttempt;
