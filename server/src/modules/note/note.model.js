import mongoose from 'mongoose';
import paginatePlugin from '../../models/plugins/paginatePlugin.js';

const noteSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true, index: true },
    lesson: { type: mongoose.Schema.Types.ObjectId },
    content: { type: String, required: true, trim: true, maxlength: 5000 },
    timestamp: { type: Number, default: 0 }, // video timestamp in seconds
    color: { type: String, default: '#FFD700' },
    isPinned: { type: Boolean, default: false },
  },
  {
    timestamps: true,
  }
);

noteSchema.index({ user: 1, course: 1, createdAt: -1 });

noteSchema.plugin(paginatePlugin);

const Note = mongoose.model('Note', noteSchema);
export default Note;
