import mongoose, { Schema, Model } from 'mongoose';
import paginatePlugin from '../../models/plugins/paginatePlugin.js';
import tenantPlugin from '../../models/plugins/tenantPlugin.js';
import { INote } from './note.dto.js';

const noteSchema = new Schema<INote>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    course: { type: Schema.Types.ObjectId, ref: 'Course', required: true, index: true },
    lesson: { type: Schema.Types.ObjectId },
    content: { type: String, required: true, trim: true, maxlength: 5000 },
    timestamp: { type: Number, default: 0 }, // video timestamp in seconds
    color: { type: String, default: '#FFD700' },
    isPinned: { type: Boolean, default: false },
    tenantId: { type: Schema.Types.ObjectId, required: true },
  },
  {
    timestamps: true,
  }
);

noteSchema.index({ user: 1, course: 1, createdAt: -1 });

noteSchema.plugin(paginatePlugin);
noteSchema.plugin(tenantPlugin);

if (mongoose.models.Note) {
  delete mongoose.models.Note;
}

const Note: Model<INote> = mongoose.model<INote>('Note', noteSchema);
export default Note;
