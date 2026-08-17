import mongoose from 'mongoose';
import paginatePlugin from '../../models/plugins/paginatePlugin.js';
import tenantPlugin from '../../models/plugins/tenantPlugin.js';

const quizOptionSchema = new mongoose.Schema({
  text: { type: String, required: true },
  isCorrect: { type: Boolean, required: true },
});

const quizQuestionSchema = new mongoose.Schema({
  question: { type: String, required: true },
  options: [quizOptionSchema],
  explanation: { type: String, default: '' },
  order: { type: Number, default: 0 },
});

const quizSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, index: true },
    description: { type: String, default: '' },
    course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', index: true },
    examCategory: { type: mongoose.Schema.Types.ObjectId, ref: 'ExamCategory', index: true },
    lesson: { type: mongoose.Schema.Types.ObjectId },
    type: { type: String, enum: ['daily', 'course', 'practice'], default: 'practice', index: true },
    duration: { type: Number, default: 10 },
    teacher: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    questions: [quizQuestionSchema],
    passingScore: { type: Number, default: 60 },
    isPublished: { type: Boolean, default: true },
    totalAttempts: { type: Number, default: 0 },
    averageScore: { type: Number, default: 0 },
  },
  { timestamps: true, toJSON: { virtuals: true } }
);

quizSchema.virtual('questionCount').get(function () {
  return this.questions?.length || 0;
});

quizSchema.plugin(paginatePlugin);
quizSchema.plugin(tenantPlugin);

const Quiz = mongoose.model('Quiz', quizSchema);
export default Quiz;
