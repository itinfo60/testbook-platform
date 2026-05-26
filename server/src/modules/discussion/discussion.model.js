import mongoose from 'mongoose';
import paginatePlugin from '../../models/plugins/paginatePlugin.js';
import tenantPlugin from '../../models/plugins/tenantPlugin.js';

const replySchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  content: { type: String, required: true, trim: true, maxlength: 2000 },
  likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  createdAt: { type: Date, default: Date.now },
});

const discussionSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true, index: true },
    lesson: { type: mongoose.Schema.Types.ObjectId },
    title: { type: String, required: true, trim: true, maxlength: 200 },
    content: { type: String, required: true, trim: true, maxlength: 5000 },
    replies: [replySchema],
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    isPinned: { type: Boolean, default: false },
    isResolved: { type: Boolean, default: false },
    tags: [String],
    viewCount: { type: Number, default: 0 },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
  }
);

discussionSchema.index({ course: 1, createdAt: -1 });
discussionSchema.index({ title: 'text', content: 'text' });

discussionSchema.virtual('replyCount').get(function () {
  return this.replies?.length || 0;
});

discussionSchema.virtual('likeCount').get(function () {
  return this.likes?.length || 0;
});

discussionSchema.plugin(paginatePlugin);
discussionSchema.plugin(tenantPlugin);

const Discussion = mongoose.model('Discussion', discussionSchema);
export default Discussion;
