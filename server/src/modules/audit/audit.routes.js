import prisma from '../../config/prisma.js';
import { Router } from 'express';
import { authenticate, authorize } from '../../middleware/auth.js';
import ApiResponse from '../../utils/ApiResponse.js';
import catchAsync from '../../utils/catchAsync.js';
import { buildPaginationQuery } from '../../utils/pagination.js';

const router = Router();

router.use(authenticate, authorize('admin', 'super_admin'));

router.get(
  '/',
  catchAsync(async (req, res) => {
    const pagination = buildPaginationQuery(req.query);
    const filter = {};
    if (req.query.actor) filter.actor = req.query.actor;
    if (req.query.action) filter.action = req.query.action;
    if (req.query.resource) filter.resource = req.query.resource;
    if (req.query.status) filter.status = req.query.status;
    if (req.query.from || req.query.to) {
      filter.createdAt = {};
      if (req.query.from) filter.createdAt.$gte = new Date(req.query.from);
      if (req.query.to) filter.createdAt.$lte = new Date(req.query.to);
    }

    const result = await AuditLog.paginate(filter, {
      ...pagination,
      sort: '-createdAt',
      populate: { path: 'actor', select: 'name email role' },
    });

    ApiResponse.paginated(res, {
      docs: result.docs,
      page: result.pagination.page,
      limit: result.pagination.limit,
      total: result.pagination.total,
    });
  })
);

export default router;
