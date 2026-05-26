import mongoose from 'mongoose';
import paginatePlugin from '../../models/plugins/paginatePlugin.js';
import tenantPlugin from '../../models/plugins/tenantPlugin.js';

const examCategorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Category name is required'],
      trim: true,
      unique: true,
      maxlength: 100,
      index: true,
    },
    slug: { type: String, unique: true, index: true },
    description: { type: String, maxlength: 500, default: '' },
    icon: { type: String, default: '' },
    image: {
      url: { type: String, default: '' },
      publicId: { type: String, default: '' },
    },
    parent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ExamCategory',
      default: null,
    },
    order: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true, index: true },
    courseCount: { type: Number, default: 0 },
    testCount: { type: Number, default: 0 },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

examCategorySchema.virtual('subcategories', {
  ref: 'ExamCategory',
  localField: '_id',
  foreignField: 'parent',
});

examCategorySchema.plugin(paginatePlugin);
examCategorySchema.plugin(tenantPlugin);

const ExamCategory = mongoose.model('ExamCategory', examCategorySchema);
export default ExamCategory;
