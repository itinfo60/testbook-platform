import mongoose, { Schema, Model } from 'mongoose';
import paginatePlugin from '../../models/plugins/paginatePlugin.js';
import tenantPlugin from '../../models/plugins/tenantPlugin.js';

export interface ILibraryResource {
  title: string;
  description?: string;
  category?: mongoose.Types.ObjectId;
  resourceType?: string;
  tags?: string[];
  fileUrl: string;
  fileType: string;
  accessLevel: 'all' | 'enrolled' | 'premium';
  applicableCourses?: mongoose.Types.ObjectId[];
  downloadsCount: number;
  tenantId: mongoose.Types.ObjectId;
}

const librarySchema = new Schema<ILibraryResource>(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    category: { type: Schema.Types.ObjectId, ref: 'ExamCategory', default: null },
    resourceType: {
      type: String,
      enum: [
        'syllabus',
        'exam_pattern',
        'pyq',
        'solved_pyq',
        'notes',
        'mind_map',
        'short_trick',
        'current_affairs',
        'video',
        'quiz',
        'other',
      ],
      default: 'other',
      index: true,
    },
    tags: [{ type: String }],
    fileUrl: { type: String, required: true },
    fileType: { type: String, required: true },
    accessLevel: { type: String, enum: ['all', 'enrolled', 'premium'], default: 'all' },
    applicableCourses: [{ type: Schema.Types.ObjectId, ref: 'Course' }],
    downloadsCount: { type: Number, default: 0 },
    tenantId: { type: Schema.Types.ObjectId, required: true, index: true },
  },
  {
    timestamps: true,
  }
);

librarySchema.index({ title: 'text', description: 'text' });
librarySchema.index({ tags: 1 });
librarySchema.plugin(paginatePlugin);
librarySchema.plugin(tenantPlugin);

if (mongoose.models.LibraryResource) {
  delete mongoose.models.LibraryResource;
}

const LibraryResource: Model<ILibraryResource> = mongoose.model<ILibraryResource>(
  'LibraryResource',
  librarySchema
);
export default LibraryResource;
