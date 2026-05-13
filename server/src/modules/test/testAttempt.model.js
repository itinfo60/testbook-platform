import mongoose from 'mongoose';
import paginatePlugin from '../../models/plugins/paginatePlugin.js';

const answerSchema = new mongoose.Schema({
  questionId: { type: mongoose.Schema.Types.ObjectId, required: true },
  selectedOptions: [Number],
  textAnswer: String,
  isCorrect: { type: Boolean, default: false },
  marksObtained: { type: Number, default: 0 },
  timeTaken: { type: Number, default: 0 }, // seconds
});

const testAttemptSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    test: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Test',
      required: true,
      index: true,
    },
    answers: [answerSchema],
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
    startedAt: { type: Date, default: Date.now },
    completedAt: Date,
    timeTaken: { type: Number, default: 0 }, // total seconds
    attemptNumber: { type: Number, default: 1 },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
  }
);

testAttemptSchema.index({ user: 1, test: 1, createdAt: -1 });
testAttemptSchema.index({ test: 1, score: -1 });

testAttemptSchema.methods.calculateScore = function () {
  let totalScore = 0;
  this.answers.forEach((answer) => {
    totalScore += answer.marksObtained;
  });
  this.score = Math.max(0, totalScore);
  this.percentage = this.totalMarks > 0 ? Math.round((this.score / this.totalMarks) * 100) : 0;
  return this;
};

testAttemptSchema.plugin(paginatePlugin);

const TestAttempt = mongoose.model('TestAttempt', testAttemptSchema);
export default TestAttempt;
