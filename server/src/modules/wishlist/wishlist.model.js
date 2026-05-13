import mongoose from 'mongoose';
import paginatePlugin from '../../models/plugins/paginatePlugin.js';

const wishlistSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true, index: true },
  },
  { timestamps: true }
);

wishlistSchema.index({ user: 1, course: 1 }, { unique: true });

wishlistSchema.plugin(paginatePlugin);

const Wishlist = mongoose.model('Wishlist', wishlistSchema);
export default Wishlist;
