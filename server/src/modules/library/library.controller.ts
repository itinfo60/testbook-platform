import { Response } from 'express';
import { BaseController } from '../../core/base.controller.js';
import { CustomRequest } from '../auth/auth.controller.js';
import ApiError from '../../utils/ApiError.js';
import ApiResponse from '../../utils/ApiResponse.js';
import prisma from '../../config/prisma.js';

import { uploadToSupabaseStorage } from '../../config/supabase.js';

export class LibraryController extends BaseController {
  createResource = this.catchAsync(async (req: CustomRequest, res: Response) => {
    const {
      title,
      description,
      tags,
      accessLevel,
      applicableCourses,
      resourceType,
      type,
      category,
      categoryId,
      examCategory,
      examCategoryId,
    } = req.body;

    let fileUrl = req.body.fileUrl || req.body.url || '';
    let fileType = req.body.fileType || '';

    if (req.file) {
      const uploaded = await uploadToSupabaseStorage(
        req.file.buffer,
        req.file.originalname,
        req.file.mimetype,
        'library'
      );
      fileUrl = uploaded.url;
      fileType = req.file.mimetype;
    }

    if (!title || !fileUrl) {
      throw ApiError.badRequest('Title and file (or fileUrl) are required');
    }

    const resolvedType = resourceType || type || 'notes';
    const resolvedCatId = categoryId || category || null;
    const resolvedExamCatId = examCategoryId || examCategory || null;

    const resource = await prisma.library.create({
      data: {
        title,
        description: description || '',
        type: resolvedType,
        url: fileUrl,
        fileData: {
          fileUrl,
          fileType,
          categoryId: resolvedCatId,
          examCategoryId: resolvedExamCatId,
          category: resolvedCatId,
          examCategory: resolvedExamCatId,
          tags: Array.isArray(tags) ? tags : [],
        },
        accessLevel: accessLevel || 'free',
        tenantId: req.tenantId as string,
      },
    });
    ApiResponse.created(res, { resource }, 'Library resource created');
  });

  getResources = this.catchAsync(async (req: CustomRequest, res: Response) => {
    const { page = 1, limit = 15, accessLevel, type, resourceType, search } = req.query;
    const where: any = {};
    if (req.tenantId) where.tenantId = req.tenantId;
    if (accessLevel && accessLevel !== 'all') where.accessLevel = accessLevel;
    const filterType = type || resourceType;
    if (filterType && filterType !== 'all') where.type = String(filterType);
    if (search) {
      where.OR = [
        { title: { contains: String(search), mode: 'insensitive' } },
        { description: { contains: String(search), mode: 'insensitive' } },
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);
    const [rawResources, total] = await Promise.all([
      prisma.library.findMany({
        where,
        skip,
        take: Number(limit),
        orderBy: { createdAt: 'desc' },
      }),
      prisma.library.count({ where }),
    ]);

    // Collect all referenced category IDs
    const catIdSet = new Set<string>();
    rawResources.forEach((r) => {
      const fd = (r.fileData as any) || {};
      if (fd.categoryId) catIdSet.add(String(fd.categoryId));
      if (fd.examCategoryId) catIdSet.add(String(fd.examCategoryId));
      if (fd.category && typeof fd.category === 'string') catIdSet.add(String(fd.category));
      if (fd.examCategory && typeof fd.examCategory === 'string')
        catIdSet.add(String(fd.examCategory));
    });

    const categoryList =
      catIdSet.size > 0
        ? await prisma.category.findMany({
            where: { id: { in: Array.from(catIdSet) } },
            select: { id: true, name: true, slug: true, icon: true, parentId: true },
          })
        : [];

    const categoryMap = Object.fromEntries(categoryList.map((c) => [c.id, c]));

    const resources = rawResources.map((r) => {
      const fd = (r.fileData as any) || {};
      const catId = fd.categoryId || fd.category;
      const examCatId = fd.examCategoryId || fd.examCategory;

      const resolvedCategory = catId ? categoryMap[catId] || { id: catId, name: catId } : null;
      const resolvedExam = examCatId
        ? categoryMap[examCatId] || { id: examCatId, name: examCatId }
        : null;

      return {
        ...r,
        fileUrl: r.url || fd.fileUrl || '',
        categoryId: catId || null,
        examCategoryId: examCatId || null,
        category: resolvedCategory,
        examCategory: resolvedExam,
        tags: Array.isArray(fd.tags) ? fd.tags : [],
        resourceType: r.type,
      };
    });

    ApiResponse.ok(
      res,
      { resources, total, page: Number(page), limit: Number(limit) },
      'Resources fetched'
    );
  });

  getResourceById = this.catchAsync(async (req: CustomRequest, res: Response) => {
    const { id } = req.params;
    const where: any = { id };
    if (req.tenantId) where.tenantId = req.tenantId;

    let raw = await prisma.library.findFirst({ where });
    if (!raw) {
      raw = await prisma.library.findUnique({ where: { id } });
    }
    if (!raw) throw ApiError.notFound('Resource not found');

    const fd = (raw.fileData as any) || {};
    const catId = fd.categoryId || fd.category;
    const examCatId = fd.examCategoryId || fd.examCategory;

    const idsToLookup = [catId, examCatId].filter(Boolean) as string[];
    const cats =
      idsToLookup.length > 0
        ? await prisma.category.findMany({
            where: { id: { in: idsToLookup } },
            select: { id: true, name: true, slug: true, icon: true, parentId: true },
          })
        : [];
    const catMap = Object.fromEntries(cats.map((c) => [c.id, c]));

    const resource = {
      ...raw,
      fileUrl: raw.url || fd.fileUrl || '',
      categoryId: catId || null,
      examCategoryId: examCatId || null,
      category: catId ? catMap[catId] || { id: catId, name: catId } : null,
      examCategory: examCatId ? catMap[examCatId] || { id: examCatId, name: examCatId } : null,
      tags: Array.isArray(fd.tags) ? fd.tags : [],
      resourceType: raw.type,
    };

    ApiResponse.ok(res, { resource }, 'Resource fetched');
  });

  downloadResource = this.catchAsync(async (req: CustomRequest, res: Response) => {
    const { id } = req.params;
    let resource = await prisma.library.findFirst({
      where: req.tenantId ? { id, tenantId: req.tenantId } : { id },
    });
    if (!resource) {
      resource = await prisma.library.findUnique({ where: { id } });
    }
    if (!resource) throw ApiError.notFound('Resource not found');

    const downloadUrl =
      resource.url ||
      (resource.fileData && typeof resource.fileData === 'object'
        ? (resource.fileData as any).fileUrl || (resource.fileData as any).url
        : '');

    if (!downloadUrl) {
      throw ApiError.badRequest('Resource does not have a downloadable file URL');
    }

    // Increment downloads count in database
    const updated = await prisma.library
      .update({
        where: { id: resource.id },
        data: { downloadsCount: { increment: 1 } },
      })
      .catch(() => resource);

    // If client requested JSON via Accept header or query param
    if (req.headers.accept?.includes('application/json') || req.query.json === 'true') {
      return ApiResponse.ok(
        res,
        {
          fileUrl: downloadUrl,
          url: downloadUrl,
          downloadUrl,
          downloadsCount: updated.downloadsCount || 1,
        },
        'Download link generated'
      );
    }

    res.redirect(downloadUrl);
  });

  updateResource = this.catchAsync(async (req: CustomRequest, res: Response) => {
    const { id } = req.params;
    const {
      title,
      description,
      tags,
      accessLevel,
      applicableCourses,
      resourceType,
      type,
      category,
      categoryId,
      examCategory,
      examCategoryId,
    } = req.body;

    let fileUrl = req.body.fileUrl || req.body.url;
    let fileType = req.body.fileType;

    if (req.file) {
      const uploaded = await uploadToSupabaseStorage(
        req.file.buffer,
        req.file.originalname,
        req.file.mimetype,
        'library'
      );
      fileUrl = uploaded.url;
      fileType = req.file.mimetype;
    }

    const existing = await prisma.library.findUnique({ where: { id } });
    if (!existing) throw ApiError.notFound('Resource not found');

    const existingFd = (existing.fileData as any) || {};

    const resolvedCatId =
      categoryId !== undefined
        ? categoryId
        : category !== undefined
          ? category
          : existingFd.categoryId;
    const resolvedExamCatId =
      examCategoryId !== undefined
        ? examCategoryId
        : examCategory !== undefined
          ? examCategory
          : existingFd.examCategoryId;

    const updateData: any = {};
    if (title) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (type || resourceType) updateData.type = resourceType || type;
    if (accessLevel) updateData.accessLevel = accessLevel;
    if (fileUrl) updateData.url = fileUrl;

    updateData.fileData = {
      ...existingFd,
      fileUrl: fileUrl || existingFd.fileUrl || existing.url,
      fileType: fileType || existingFd.fileType,
      categoryId: resolvedCatId || null,
      examCategoryId: resolvedExamCatId || null,
      category: resolvedCatId || null,
      examCategory: resolvedExamCatId || null,
      tags: tags !== undefined ? (Array.isArray(tags) ? tags : []) : existingFd.tags || [],
    };

    const updatedResource = await prisma.library.update({
      where: { id },
      data: updateData,
    });

    ApiResponse.ok(res, { resource: updatedResource }, 'Resource updated');
  });

  deleteResource = this.catchAsync(async (req: CustomRequest, res: Response) => {
    const { id } = req.params;
    const result = await prisma.library.deleteMany({ where: { id } });
    if (result.count === 0) throw ApiError.notFound('Resource not found');
    ApiResponse.ok(res, null, 'Resource deleted');
  });
}

export default new LibraryController();
