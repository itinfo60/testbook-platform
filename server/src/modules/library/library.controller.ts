import { Response } from 'express';
import { BaseController } from '../../core/base.controller.js';
import { CustomRequest } from '../auth/auth.controller.js';
import ApiError from '../../utils/ApiError.js';
import ApiResponse from '../../utils/ApiResponse.js';
import prisma from '../../config/prisma.js';

export class LibraryController extends BaseController {
  createResource = this.catchAsync(async (req: CustomRequest, res: Response) => {
    const fileUrl =
      req.body.fileUrl ||
      (req.file && req.file.path) ||
      (req.file && `https://mock-cloudinary.com/${req.file.originalname}`) ||
      '';
    const fileType = req.body.fileType || (req.file && req.file.mimetype) || '';
    if (!title || !fileUrl) {
      throw ApiError.badRequest('Title and fileUrl are required');
    }
    const resource = await prisma.library.create({
      data: {
        title,
        description,
        tags: tags || [],
        fileUrl,
        fileType,
        accessLevel: accessLevel || 'all',
        applicableCourses: applicableCourses || [],
        tenantId: req.tenantId as string,
        downloadsCount: 0,
      },
    });
    ApiResponse.created(res, { resource }, 'Library resource created');
  });

  getResources = this.catchAsync(async (req: CustomRequest, res: Response) => {
    const { page = 1, limit = 15, accessLevel, type: resourceType } = req.query;
    const where: any = {};
    if (req.tenantId) where.tenantId = req.tenantId;
    if (accessLevel && accessLevel !== 'all') where.accessLevel = accessLevel;
    if (resourceType && resourceType !== 'all') where.type = resourceType;

    const skip = (Number(page) - 1) * Number(limit);
    const [resources, total] = await Promise.all([
      prisma.library.findMany({
        where,
        skip,
        take: Number(limit),
        orderBy: { createdAt: 'desc' },
      }),
      prisma.library.count({ where }),
    ]);
    ApiResponse.ok(
      res,
      { resources, total, page: Number(page), limit: Number(limit) },
      'Resources fetched'
    );
  });

  downloadResource = this.catchAsync(async (req: CustomRequest, res: Response) => {
    const { id } = req.params;
    const resource = await prisma.library.findFirst({ where: { id, tenantId: req.tenantId } });
    if (!resource) throw ApiError.notFound('Resource not found');
    await prisma.library.update({ where: { id }, data: { downloadsCount: { increment: 1 } } });
    res.redirect(resource.fileUrl);
  });

  updateResource = this.catchAsync(async (req: CustomRequest, res: Response) => {
    const { id } = req.params;
    const updates = req.body;
    const resource = await prisma.library.updateMany({
      where: { id, tenantId: req.tenantId },
      data: updates,
    });
    if (resource.count === 0) throw ApiError.notFound('Resource not found');

    const updatedResource = await prisma.library.findUnique({ where: { id } });
    ApiResponse.ok(res, { resource: updatedResource }, 'Resource updated');
  });

  deleteResource = this.catchAsync(async (req: CustomRequest, res: Response) => {
    const { id } = req.params;
    const result = await prisma.library.deleteMany({ where: { id, tenantId: req.tenantId } });
    if (result.count === 0) throw ApiError.notFound('Resource not found');
    ApiResponse.ok(res, null, 'Resource deleted');
  });
}

export default new LibraryController();
