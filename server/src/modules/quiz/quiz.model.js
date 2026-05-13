import mongoose from 'mongoose';
import paginatePlugin from '../../models/plugins/paginatePlugin.js';

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
    course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true, index: true },
    lesson: { type: mongoose.Schema.Types.ObjectId },
    teacher: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    questions: [quizQuestionSchema],
    passingScore: { type: Number, default: 60 },
    isPublished: { type: Boolean, default: false },
    totalAttempts: { type: Number, default: 0 },
    averageScore: { type: Number, default: 0 },
  },
  { timestamps: true, toJSON: { virtuals: true } }
);

quizSchema.virtual('questionCount').get(function () {
  return this.questions?.length || 0;
});

quizSchema.plugin(paginatePlugin);

const Quiz = mongoose.model('Quiz', quizSchema);
export default Quiz;
