import Blog from './blog.model.js';
import ApiError from '../../utils/ApiError.js';
import ApiResponse from '../../utils/ApiResponse.js';
import catchAsync from '../../utils/catchAsync.js';
import redis from '../../config/redis.js';
import { generateSlug } from '../../utils/helpers.js';
import { buildFilterQuery, buildPaginationQuery } from '../../utils/pagination.js';

// ===== PUBLIC =====

/**
 * Get all blogs with pagination and filters
 */
export const getBlogs = catchAsync(async (req, res) => {
  const pagination = buildPaginationQuery(req.query);

  const filter = buildFilterQuery(req.query, {
    search: { type: 'search', fields: ['title', 'content', 'tags'] },
    status: { type: 'exact' },
    tag: { type: 'array', field: 'tags' },
    author: { type: 'exact' },
  });

  // Public users can only see published blogs
  if (req.user?.role !== 'admin') {
    filter.status = 'published';
  }
  filter.isDeleted = { $ne: true };

  const sortMap = {
    newest: '-createdAt',
    oldest: 'createdAt',
    popular: '-views',
    title_asc: 'title',
    title_desc: '-title',
  };

  const sort = sortMap[req.query.sort] || '-createdAt';

  const result = await Blog.paginate(filter, {
    ...pagination,
    sort,
    populate: { path: 'author', select: 'name avatar' },
  });

  ApiResponse.paginated(res, {
    docs: result.docs,
    page: result.pagination.page,
    limit: result.pagination.limit,
    total: result.pagination.total,
  });
});

/**
 * Get single blog by slug
 */
export const getBlogBySlug = catchAsync(async (req, res) => {
  const { slug } = req.params;

  const blog = await Blog.findOne({ slug, isDeleted: { $ne: true } })
    .populate('author', 'name avatar bio')
    .lean();

  if (!blog) {
    throw ApiError.notFound('Blog post not found');
  }

  // Check visibility
  if (blog.status !== 'published' && req.user?.role !== 'admin') {
    throw ApiError.forbidden('This blog post is not yet published');
  }

  // Increment views (async, don't wait)
  Blog.findByIdAndUpdate(blog._id, { $inc: { views: 1 } }).exec().catch(err => console.error('Error updating views:', err));

  ApiResponse.ok(res, { blog });
});

// ===== ADMIN =====

/**
 * Create new blog post
 */
export const createBlog = catchAsync(async (req, res) => {
  const { title } = req.body;
  const slug = req.body.slug || generateSlug(title);

  // Check if slug exists
  const existingBlog = await Blog.findOne({ slug });
  if (existingBlog) {
    throw ApiError.badRequest('A blog with this slug already exists. Please provide a different slug or title.');
  }

  const blog = await Blog.create({
    ...req.body,
    slug,
    author: req.userId,
  });

  ApiResponse.created(res, { blog }, 'Blog post created successfully');
});

/**
 * Update blog post
 */
export const updateBlog = catchAsync(async (req, res) => {
  const blog = await Blog.findById(req.params.id);

  if (!blog) {
    throw ApiError.notFound('Blog post not found');
  }

  // If title changed and slug not provided, update slug
  if (req.body.title && req.body.title !== blog.title && !req.body.slug) {
    req.body.slug = generateSlug(req.body.title);
  }

  Object.assign(blog, req.body);
  await blog.save();

  ApiResponse.ok(res, { blog }, 'Blog post updated successfully');
});

/**
 * Delete blog post
 */
export const deleteBlog = catchAsync(async (req, res) => {
  const blog = await Blog.findById(req.params.id);

  if (!blog) {
    throw ApiError.notFound('Blog post not found');
  }

  // Permanent delete or soft delete? 
  // Let's use soft delete if plugin is available
  await blog.softDelete(req.userId);

  ApiResponse.ok(res, null, 'Blog post deleted successfully');
});
