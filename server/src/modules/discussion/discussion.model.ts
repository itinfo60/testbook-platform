import mongoose, { Schema, Model } from 'mongoose';
import paginatePlugin from '../../models/plugins/paginatePlugin.js';
import tenantPlugin from '../../models/plugins/tenantPlugin.js';
import { IDiscussion, IReply } from './discussion.dto.js';

const replySchema = new Schema<IReply>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    content: { type: String, required: true, trim: true, maxlength: 2000 },
    likes: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

const discussionSchema = new Schema<IDiscussion>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    course: { type: Schema.Types.ObjectId, ref: 'Course', required: true, index: true },
    lesson: { type: Schema.Types.ObjectId },
    title: { type: String, required: true, trim: true, maxlength: 200 },
    content: { type: String, required: true, trim: true, maxlength: 5000 },
    replies: [replySchema],
    likes: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    isPinned: { type: Boolean, default: false },
    isResolved: { type: Boolean, default: false },
    tags: [String],
    viewCount: { type: Number, default: 0 },
    tenantId: { type: Schema.Types.ObjectId, required: true },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

discussionSchema.index({ course: 1, createdAt: -1 });
discussionSchema.index({ title: 'text', content: 'text' });

discussionSchema.virtual('replyCount').get(function (this: IDiscussion) {
  return this.replies?.length || 0;
});

discussionSchema.virtual('likeCount').get(function (this: IDiscussion) {
  return this.likes?.length || 0;
});

discussionSchema.plugin(paginatePlugin);
discussionSchema.plugin(tenantPlugin);

if (mongoose.models.Discussion) {
  delete mongoose.models.Discussion;
}

const Discussion: Model<IDiscussion> = mongoose.model<IDiscussion>('Discussion', discussionSchema);
export default Discussion;
