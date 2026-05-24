import { PAGINATION } from '../constants/index.js';

export const buildPaginationQuery = (query = {}) => {
  const pageParam = parseInt(query.page);
  const page = isNaN(pageParam) ? PAGINATION.DEFAULT_PAGE : Math.max(1, pageParam);

  const limitParam = parseInt(query.limit);
  const limit = isNaN(limitParam) 
    ? PAGINATION.DEFAULT_LIMIT 
    : Math.min(Math.max(1, limitParam), PAGINATION.MAX_LIMIT);
  const skip = (page - 1) * limit;
  const sort = query.sort || '-createdAt';

  return { page, limit, skip, sort };
};

export const buildFilterQuery = (query, filterConfig = {}) => {
  const filter = {};

  for (const [key, config] of Object.entries(filterConfig)) {
    const value = query[key];
    
    // Skip undefined/empty for most types, but allow range types to proceed if they have min/max/from/to
    if ((value === undefined || value === '') && !['dateRange', 'range'].includes(config.type)) {
      continue;
    }

    switch (config.type) {
      case 'search':
        filter[config.field || key] = { $regex: value, $options: 'i' };
        break;
      case 'exact':
        filter[config.field || key] = value;
        break;
      case 'boolean':
        filter[config.field || key] = value === 'true';
        break;
      case 'number':
        filter[config.field || key] = Number(value);
        break;
      case 'dateRange':
        if (query[`${key}From`] || query[`${key}To`]) {
          filter[config.field || key] = {};
          if (query[`${key}From`]) filter[config.field || key].$gte = new Date(query[`${key}From`]);
          if (query[`${key}To`]) filter[config.field || key].$lte = new Date(query[`${key}To`] + 'T23:59:59.999Z');
        }
        break;
      case 'in':
        if (Array.isArray(value)) {
          filter[config.field || key] = { $in: value };
        } else if (typeof value === 'string') {
          filter[config.field || key] = { $in: value.split(',') };
        }
        break;
      case 'range':
        if (query[`${key}Min`] || query[`${key}Max`]) {
          filter[config.field || key] = {};
          if (query[`${key}Min`]) filter[config.field || key].$gte = Number(query[`${key}Min`]);
          if (query[`${key}Max`]) filter[config.field || key].$lte = Number(query[`${key}Max`]);
        }
        break;
      default:
        filter[config.field || key] = value;
    }
  }

  return filter;
};

export const paginateQuery = async (Model, filter, paginationOpts, options = {}) => {
  const { page, limit, skip, sort } = paginationOpts;
  const { populate = '', select = '', lean = true } = options;

  const [total, docs] = await Promise.all([
    Model.countDocuments(filter),
    Model.find(filter)
      .populate(populate)
      .select(select)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean(lean),
  ]);

  return {
    docs,
    page,
    limit,
    total,
    pages: Math.ceil(total / limit),
    hasNext: page * limit < total,
    hasPrev: page > 1,
  };
};
