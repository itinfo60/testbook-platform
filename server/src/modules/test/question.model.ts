import mongoose, { Schema, Document, Types } from 'mongoose';
import paginatePlugin from '../../models/plugins/paginatePlugin.js';
import tenantPlugin from '../../models/plugins/tenantPlugin.js';

export interface IOption {
  _id?: Types.ObjectId;
  text: string;
  isCorrect: boolean;
}

export interface IQuestion extends Document {
  _id: Types.ObjectId;
  tenantId: Types.ObjectId;
  question: string;
  type: 'mcq' | 'msq' | 'true_false' | 'fill_blank' | 'subjective';
  options: IOption[];
  correctAnswer: string;
  marks: number;
  negativeMarks: number;
  explanation: string;
  difficulty: 'easy' | 'medium' | 'hard';
  tags: string[];
  subject: string;
  topic: string;
  status: 'draft' | 'published';
  createdAt: Date;
  updatedAt: Date;
}

const optionSchema = new Schema<IOption>({
  text: { type: String, required: true },
  isCorrect: { type: Boolean, required: true },
});

const questionSchema = new Schema<IQuestion>(
  {
    question: { type: String, required: true, trim: true },
    type: {
      type: String,
      enum: ['mcq', 'msq', 'true_false', 'fill_blank', 'subjective'],
      default: 'mcq',
    },
    options: [optionSchema],
    correctAnswer: { type: String, default: '' },
    marks: { type: Number, required: true, min: 0 },
    negativeMarks: { type: Number, default: 0, min: 0 },
    explanation: { type: String, default: '' },
    difficulty: { type: String, enum: ['easy', 'medium', 'hard'], default: 'medium' },
    tags: [{ type: String, trim: true }],
    subject: { type: String, default: '' },
    topic: { type: String, default: '' },
    status: {
      type: String,
      enum: ['draft', 'published'],
      default: 'draft',
      index: true,
    },
    tenantId: { type: Schema.Types.ObjectId, required: true, index: true },
  },
  {
    timestamps: true,
  }
);

questionSchema.index({ question: 'text', tags: 'text' });
questionSchema.index({ subject: 1, topic: 1 });
questionSchema.plugin(paginatePlugin);
questionSchema.plugin(tenantPlugin);

const Question = mongoose.model<IQuestion>('Question', questionSchema);
export default Question;
