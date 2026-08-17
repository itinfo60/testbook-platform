import { Response } from 'express';
import { BaseController } from '../../core/base.controller.js';
import LibraryResource from './library.model.ts';
import { CustomRequest } from '../auth/auth.controller.js';
import ApiError from '../../utils/ApiError.js';
import ApiResponse from '../../utils/ApiResponse.js';

export class LibraryController extends BaseController {
  // Create a new library resource (admin)
  createResource = this.catchAsync(async (req: CustomRequest, res: Response) => {
    const { title, description, category, examCategory, tags, accessLevel, applicableCourses } =
      req.body;
    const fileUrl =
      req.body.fileUrl ||
      (req.file && req.file.path) ||
      (req.file && `https://mock-cloudinary.com/${req.file.originalname}`) ||
      '';
    const fileType = req.body.fileType || (req.file && req.file.mimetype) || '';
    if (!title || !fileUrl) {
      throw ApiError.badRequest('Title and fileUrl are required');
    }
    const resource = await LibraryResource.create({
      title,
      description,
      category: category ?? null,
      examCategory: examCategory ?? null,
      tags,
      fileUrl,
      fileType,
      accessLevel: accessLevel || 'all',
      applicableCourses: applicableCourses || [],
      tenantId: req.tenantId,
      downloadsCount: 0,
    });
    ApiResponse.created(res, { resource }, 'Library resource created');
  });

  // List resources with optional filters
  getResources = this.catchAsync(async (req: CustomRequest, res: Response) => {
    const { category, tags, accessLevel, resourceType, page = 1, limit = 50 } = req.query as any;
    const filter: any = {};
    if (req.tenantId) filter.tenantId = req.tenantId;
    if (category && category !== 'all') filter.category = category;
    if (accessLevel && accessLevel !== 'all') filter.accessLevel = accessLevel;
    if (resourceType && resourceType !== 'all') filter.resourceType = resourceType;
    if (tags) filter.tags = { $in: Array.isArray(tags) ? tags : [tags] };

    const skip = (Number(page) - 1) * Number(limit);
    const [resources, total] = await Promise.all([
      LibraryResource.find(filter)
        .populate('category', 'name slug icon')
        .skip(skip)
        .limit(Number(limit))
        .sort({ createdAt: -1 })
        .lean(),
      LibraryResource.countDocuments(filter),
    ]);
    ApiResponse.ok(
      res,
      { resources, total, page: Number(page), limit: Number(limit) },
      'Resources fetched'
    );
  });

  // Download resource (increments count)
  downloadResource = this.catchAsync(async (req: CustomRequest, res: Response) => {
    const { id } = req.params;
    const resource = await LibraryResource.findOne({ _id: id, tenantId: req.tenantId });
    if (!resource) throw ApiError.notFound('Resource not found');
    // Increment download count
    await LibraryResource.updateOne({ _id: id }, { $inc: { downloadsCount: 1 } });
    // Redirect to stored URL (could be a signed URL for cloud storage)
    res.redirect(resource.fileUrl);
  });

  // Update resource (admin)
  updateResource = this.catchAsync(async (req: CustomRequest, res: Response) => {
    const { id } = req.params;
    const updates = req.body;
    const resource = await LibraryResource.findOneAndUpdate(
      { _id: id, tenantId: req.tenantId },
      updates,
      { new: true }
    );
    if (!resource) throw ApiError.notFound('Resource not found');
    ApiResponse.ok(res, { resource }, 'Resource updated');
  });

  // Delete resource (admin)
  deleteResource = this.catchAsync(async (req: CustomRequest, res: Response) => {
    const { id } = req.params;
    const result = await LibraryResource.deleteOne({ _id: id, tenantId: req.tenantId });
    if (result.deletedCount === 0) throw ApiError.notFound('Resource not found');
    ApiResponse.ok(res, null, 'Resource deleted');
  });
}

export default new LibraryController();
