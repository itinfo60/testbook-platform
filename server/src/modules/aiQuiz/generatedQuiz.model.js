import mongoose from 'mongoose';
import paginatePlugin from '../../models/plugins/paginatePlugin.js';
import tenantPlugin from '../../models/plugins/tenantPlugin.js';

const optionSchema = new mongoose.Schema({
  text: { type: String, required: true },
  isCorrect: { type: Boolean, required: true },
});

const questionSchema = new mongoose.Schema({
  question: { type: String, required: true },
  options: [optionSchema],
});

const generatedQuizSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
    teacher: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    questions: [questionSchema],
    status: { type: String, enum: ['draft', 'saved'], default: 'saved' },
  },
  { timestamps: true, toJSON: { virtuals: true } }
);

generatedQuizSchema.plugin(paginatePlugin);
generatedQuizSchema.plugin(tenantPlugin);

export default mongoose.model('GeneratedQuiz', generatedQuizSchema);
