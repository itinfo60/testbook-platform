import ApiError from '../../utils/ApiError.js';
import ApiResponse from '../../utils/ApiResponse.js';
import catchAsync from '../../utils/catchAsync.js';
import redis from '../../config/redis.js';
import { generateSlug } from '../../utils/helpers.js';
import { buildFilterQuery, buildPaginationQuery } from '../../utils/pagination.js';
import { runWithTenant } from '../../utils/TenantContext.js';
import prisma from '../../config/prisma.js';

// ===== PUBLIC =====

export const getBlogs = catchAsync(async (req, res) => {
  const pagination = buildPaginationQuery(req.query);
  const { page, limit, skip } = pagination;

  const where = {};

  if (req.query.search) {
    where.OR = [
      { title: { contains: req.query.search, mode: 'insensitive' } },
      { content: { contains: req.query.search, mode: 'insensitive' } },
    ];
  }
  if (req.query.status) {
    where.status = req.query.status;
  } else if (req.user?.role !== 'admin' && req.user?.role !== 'teacher') {
    where.status = 'published';
  }

  if (req.query.type) {
    where.type = req.query.type;
  }

  const sortMap = {
    newest: { createdAt: 'desc' },
    oldest: { createdAt: 'asc' },
    title_asc: { title: 'asc' },
    title_desc: { title: 'desc' },
  };

  const orderBy = sortMap[req.query.sort] || { createdAt: 'desc' };

  const [total, docs] = await Promise.all([
    prisma.blog.count({ where }),
    prisma.blog.findMany({
      where,
      orderBy,
      skip,
      take: limit,
    }),
  ]);

  ApiResponse.paginated(res, {
    docs,
    page,
    limit,
    total,
  });
});

export const getBlogBySlug = catchAsync(async (req, res) => {
  const { slug } = req.params;

  const blog = await prisma.blog.findFirst({
    where: {
      OR: [{ slug }, { id: slug }],
    },
  });

  if (!blog) {
    throw ApiError.notFound('Blog post not found');
  }

  if (blog.status !== 'published' && req.user?.role !== 'admin' && req.user?.role !== 'teacher') {
    throw ApiError.forbidden('This blog post is not yet published');
  }

  // Increment views count in database
  const updatedBlog = await prisma.blog
    .update({
      where: { id: blog.id },
      data: { views: { increment: 1 } },
    })
    .catch(() => blog);

  // If blog has attached resourceIds, fetch them from Library
  let attachedResources = [];
  const resourceIds = blog.resourceIds || blog.resources || [];
  if (Array.isArray(resourceIds) && resourceIds.length > 0) {
    const validIds = resourceIds.filter((id) => typeof id === 'string');
    if (validIds.length > 0) {
      attachedResources = await prisma.library.findMany({
        where: { id: { in: validIds } },
        select: {
          id: true,
          title: true,
          description: true,
          type: true,
          url: true,
          fileData: true,
          accessLevel: true,
          downloadsCount: true,
        },
      });
    }
  }

  // Also include exam category info if examCategory is present
  let categoryInfo = null;
  if (blog.examCategory) {
    categoryInfo = await prisma.category.findFirst({
      where: {
        OR: [{ id: blog.examCategory }, { slug: blog.examCategory }],
      },
      select: { id: true, name: true, slug: true, icon: true },
    });
  }

  ApiResponse.ok(res, {
    blog: {
      ...updatedBlog,
      attachedResources,
      categoryInfo,
    },
  });
});

// ===== ADMIN =====

function sanitizeBlogData(body, slug) {
  const {
    title,
    content,
    excerpt,
    status,
    type,
    tags,
    coverImage,
    thumbnail,
    examCategory,
    jobAlert,
    resourceIds,
    resources,
    tenantId,
  } = body;

  const resolvedResourceIds = Array.isArray(resourceIds)
    ? resourceIds
    : Array.isArray(resources)
      ? resources.map((r) => (typeof r === 'string' ? r : r.id || r._id)).filter(Boolean)
      : [];

  return {
    title,
    slug,
    content,
    excerpt: excerpt || null,
    status: status || 'draft',
    type: type || 'article',
    tags: Array.isArray(tags) ? tags : [],
    coverImage: coverImage || thumbnail || null,
    thumbnail: thumbnail || coverImage || null,
    examCategory: examCategory || null,
    jobAlert: jobAlert || null,
    resourceIds: resolvedResourceIds,
    ...(tenantId ? { tenantId } : {}),
  };
}

export const createBlog = catchAsync(async (req, res) => {
  const { title } = req.body;
  const slug = req.body.slug || generateSlug(title);

  const existingBlog = await prisma.blog.findUnique({ where: { slug } });
  if (existingBlog) {
    throw ApiError.badRequest(
      'A blog with this slug already exists. Please provide a different slug or title.'
    );
  }

  const blog = await prisma.blog.create({
    data: sanitizeBlogData(req.body, slug),
  });

  ApiResponse.created(res, { blog }, 'Blog post created successfully');
});

export const updateBlog = catchAsync(async (req, res) => {
  const existing = await prisma.blog.findUnique({ where: { id: req.params.id } });

  if (!existing) {
    throw ApiError.notFound('Blog post not found');
  }

  let slug = req.body.slug || existing.slug;
  if (req.body.title && req.body.title !== existing.title && !req.body.slug) {
    slug = generateSlug(req.body.title);
  }

  const blog = await prisma.blog.update({
    where: { id: req.params.id },
    data: sanitizeBlogData(req.body, slug),
  });

  ApiResponse.ok(res, { blog }, 'Blog post updated successfully');
});

export const deleteBlog = catchAsync(async (req, res) => {
  const existing = await prisma.blog.findUnique({ where: { id: req.params.id } });

  if (!existing) {
    throw ApiError.notFound('Blog post not found');
  }

  await prisma.blog.delete({
    where: { id: req.params.id },
  });

  ApiResponse.ok(res, null, 'Blog post deleted successfully');
});
